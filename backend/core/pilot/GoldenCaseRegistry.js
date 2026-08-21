'use strict';

const { normalizeRefrigerant } = require('../data/RefrigerantProfiles');

const CONTRACT_VERSION = '1.0.0';
const PILOT_REFRIGERANTS = Object.freeze(['R717', 'R744']);
const VARIANCE_ROOT_CAUSES = Object.freeze([
  'input-basis',
  'thermophysical-provider',
  'calculation-method',
  'manufacturer-map-or-envelope',
  'pid-graph-or-port-mapping',
  'bim-geometry-or-routing',
  'reviewer-decision',
  'external-project-change'
]);
const VARIANCE_SEVERITIES = Object.freeze(['minor', 'major', 'critical']);

function hasText(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function recordOf(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function sourceBacked(item) {
  const evidence = recordOf(item);
  return hasText(evidence.evidenceId) && hasText(evidence.source) && (hasText(evidence.revision) || hasText(evidence.effectiveDate));
}

function stableClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function validateGoldenCase(candidate, { at = new Date() } = {}) {
  const goldenCase = recordOf(candidate);
  const designBasis = recordOf(goldenCase.designBasis);
  const review = recordOf(goldenCase.review);
  const reviewerSignatures = asArray(review.signatures);
  const refrigerant = normalizeRefrigerant(designBasis.refrigerant);
  const sourceLedger = asArray(goldenCase.sourceLedger);
  const expectedReviewDecisions = asArray(goldenCase.expectedReviewDecisions);
  const issues = [];
  const warnings = [];

  if (!hasText(goldenCase.caseId)) issues.push('caseId is required.');
  if (!hasText(goldenCase.title)) issues.push('title is required.');
  if (!PILOT_REFRIGERANTS.includes(refrigerant)) issues.push('Pilot golden cases are limited to R717 or R744 until scope expansion is explicitly approved.');
  if (!hasText(designBasis.projectType)) issues.push('designBasis.projectType is required.');
  if (!hasText(designBasis.jurisdiction)) issues.push('designBasis.jurisdiction is required.');
  if (!hasText(designBasis.locationClimateEvidenceId)) issues.push('designBasis.locationClimateEvidenceId is required.');
  if (!recordOf(designBasis.operatingConditionsSI) || !Object.keys(designBasis.operatingConditionsSI).length) {
    issues.push('designBasis.operatingConditionsSI is required.');
  }
  if (!sourceLedger.length) issues.push('sourceLedger must contain traceable evidence.');
  if (sourceLedger.some((item) => !sourceBacked(item))) issues.push('Each sourceLedger item requires evidenceId, source and revision or effectiveDate.');
  if (!expectedReviewDecisions.length) issues.push('expectedReviewDecisions are required.');
  if (expectedReviewDecisions.some((decision) => !hasText(decision?.gate) || !hasText(decision?.status))) {
    issues.push('Each expected review decision requires gate and status.');
  }
  if (!hasText(review.status)) issues.push('review.status is required.');
  if (!reviewerSignatures.length) issues.push('At least one named human reviewer signature is required.');
  if (reviewerSignatures.some((signature) => !hasText(signature?.reviewer) || !hasText(signature?.role) || !hasText(signature?.signedAt))) {
    issues.push('Each reviewer signature requires reviewer, role and signedAt.');
  }
  if (hasText(goldenCase.expiresAt)) {
    const expiration = Date.parse(goldenCase.expiresAt);
    if (!Number.isFinite(expiration)) issues.push('expiresAt must be ISO-8601 when supplied.');
    if (Number.isFinite(expiration) && expiration < at.getTime()) issues.push('Golden case is expired.');
  } else {
    warnings.push('No expiresAt is recorded; golden-case recency requires human review.');
  }

  const signed = issues.length === 0 && review.status === 'approved-for-regression';
  return {
    contractVersion: CONTRACT_VERSION,
    valid: issues.length === 0,
    signed,
    finalIssueAllowed: false,
    refrigerant,
    issues,
    warnings,
    normalized: issues.length ? null : {
      ...stableClone(goldenCase),
      designBasis: { ...stableClone(designBasis), refrigerant },
      sourceLedger: stableClone(sourceLedger),
      expectedReviewDecisions: stableClone(expectedReviewDecisions),
      review: stableClone(review)
    },
    policy: 'Golden cases are controlled regression evidence. They are not construction, procurement, compliance or safety approval.'
  };
}

function classifyVariance(variance = {}) {
  const candidate = recordOf(variance);
  const category = String(candidate.category || '').trim();
  const severity = String(candidate.severity || '').trim().toLowerCase();
  const issues = [];
  if (!hasText(candidate.varianceId)) issues.push('varianceId is required.');
  if (!hasText(candidate.caseId)) issues.push('caseId is required.');
  if (!hasText(candidate.description)) issues.push('description is required.');
  if (!VARIANCE_SEVERITIES.includes(severity)) issues.push(`severity must be one of: ${VARIANCE_SEVERITIES.join(', ')}.`);
  if (!VARIANCE_ROOT_CAUSES.includes(category)) issues.push('Variance root cause is unresolved or outside the approved taxonomy.');
  if (!hasText(candidate.owner)) issues.push('A human owner is required for variance resolution.');

  return {
    contractVersion: CONTRACT_VERSION,
    resolved: issues.length === 0,
    category: VARIANCE_ROOT_CAUSES.includes(category) ? category : 'unresolved',
    severity: VARIANCE_SEVERITIES.includes(severity) ? severity : 'unclassified',
    issues,
    finalIssueAllowed: false,
    policy: 'An unresolved variance blocks the next pilot gate when it affects physics, safety, compatibility or traceability.'
  };
}

class GoldenCaseRegistry {
  constructor({ initialCases = [] } = {}) {
    this.cases = new Map();
    asArray(initialCases).forEach((item) => this.register(item));
  }

  register(candidate) {
    const validation = validateGoldenCase(candidate);
    if (!validation.valid) {
      return { accepted: false, validation, record: null };
    }
    const record = stableClone(validation.normalized);
    this.cases.set(record.caseId, record);
    return { accepted: true, validation, record: stableClone(record) };
  }

  get(caseId) {
    const record = this.cases.get(caseId);
    return record ? stableClone(record) : null;
  }

  list() {
    return [...this.cases.values()].map(stableClone);
  }

  regressionFixture(caseId) {
    const record = this.get(caseId);
    if (!record) {
      return {
        status: 'not-found',
        caseId,
        fixture: null,
        finalIssueAllowed: false,
        reason: 'No registered golden case has this caseId.'
      };
    }
    const validation = validateGoldenCase(record);
    if (!validation.signed) {
      return {
        status: 'not-signed-for-regression',
        caseId,
        fixture: null,
        finalIssueAllowed: false,
        reason: validation.issues.join(' ') || 'Golden case review status is not approved-for-regression.'
      };
    }
    return {
      status: 'review-gated-regression-fixture',
      caseId,
      fixture: {
        designBasis: stableClone(record.designBasis),
        sourceLedger: stableClone(record.sourceLedger),
        expectedReviewDecisions: stableClone(record.expectedReviewDecisions),
        review: {
          status: record.review.status,
          signatures: stableClone(record.review.signatures)
        }
      },
      finalIssueAllowed: false,
      policy: 'Fixture preserves approved evidence only; it does not generate design values or selection results.'
    };
  }
}

module.exports = {
  CONTRACT_VERSION,
  PILOT_REFRIGERANTS,
  VARIANCE_ROOT_CAUSES,
  VARIANCE_SEVERITIES,
  validateGoldenCase,
  classifyVariance,
  GoldenCaseRegistry
};
