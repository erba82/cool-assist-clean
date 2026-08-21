'use strict';

const assert = require('assert');
const { GoldenCaseRegistry, validateGoldenCase, classifyVariance } = require('./pilot/GoldenCaseRegistry');

function signedGoldenCase() {
  return {
    caseId: 'golden-r717-regression-unit-001',
    title: 'Controlled R717 pilot regression record',
    designBasis: {
      refrigerant: 'R717',
      projectType: 'industrial-cold-storage',
      jurisdiction: 'reviewed-test-jurisdiction',
      locationClimateEvidenceId: 'evidence:climate:unit-001',
      operatingConditionsSI: { evidenceReference: 'evidence:operating-point:unit-001' }
    },
    sourceLedger: [
      {
        evidenceId: 'evidence:climate:unit-001',
        source: 'Controlled test source ledger',
        revision: 'TEST-REV-1',
        status: 'verified'
      },
      {
        evidenceId: 'evidence:operating-point:unit-001',
        source: 'Controlled test source ledger',
        effectiveDate: '2026-08-21',
        status: 'verified'
      }
    ],
    expectedReviewDecisions: [
      { gate: 'physics', status: 'review-required' },
      { gate: 'delivery', status: 'review-required' }
    ],
    review: {
      status: 'approved-for-regression',
      signatures: [{ reviewer: 'Controlled QA Reviewer', role: 'qa', signedAt: '2026-08-21T00:00:00.000Z' }]
    }
  };
}

function main() {
  const checks = [];
  const registry = new GoldenCaseRegistry();
  const unsigned = signedGoldenCase();
  unsigned.review.status = 'review-required';
  const unsignedResult = registry.register(unsigned);
  assert.strictEqual(unsignedResult.accepted, true);
  const unsignedFixture = registry.regressionFixture(unsigned.caseId);
  assert.strictEqual(unsignedFixture.status, 'not-signed-for-regression');
  checks.push('unsigned-golden-case-cannot-generate-regression-fixture');

  const accepted = registry.register(signedGoldenCase());
  assert.strictEqual(accepted.accepted, true);
  assert.strictEqual(accepted.validation.signed, true);
  assert.strictEqual(accepted.validation.finalIssueAllowed, false);
  const fixture = registry.regressionFixture(accepted.record.caseId);
  assert.strictEqual(fixture.status, 'review-gated-regression-fixture');
  assert.strictEqual(fixture.finalIssueAllowed, false);
  assert.strictEqual(fixture.fixture.designBasis.refrigerant, 'R717');
  assert.strictEqual(fixture.fixture.expectedReviewDecisions.length, 2);
  checks.push('signed-r717-case-produces-evidence-only-review-gated-fixture');

  const unsupported = signedGoldenCase();
  unsupported.caseId = 'golden-r404a-out-of-scope';
  unsupported.designBasis.refrigerant = 'R404A';
  const unsupportedValidation = validateGoldenCase(unsupported);
  assert.strictEqual(unsupportedValidation.valid, false);
  assert(unsupportedValidation.issues.some((issue) => issue.includes('R717 or R744')));
  checks.push('out-of-scope-refrigerant-is-rejected');

  const resolvedVariance = classifyVariance({
    varianceId: 'variance-001',
    caseId: accepted.record.caseId,
    description: 'Controlled review variance',
    category: 'manufacturer-map-or-envelope',
    severity: 'major',
    owner: 'Lead refrigeration engineer'
  });
  assert.strictEqual(resolvedVariance.resolved, true);
  assert.strictEqual(resolvedVariance.category, 'manufacturer-map-or-envelope');
  const unresolvedVariance = classifyVariance({
    varianceId: 'variance-002',
    caseId: accepted.record.caseId,
    description: 'Unclassified variance',
    category: 'unapproved-category',
    severity: 'critical',
    owner: 'Lead refrigeration engineer'
  });
  assert.strictEqual(unresolvedVariance.resolved, false);
  assert.strictEqual(unresolvedVariance.category, 'unresolved');
  checks.push('variance-root-cause-taxonomy-fails-closed');

  console.log(JSON.stringify({ status: 'passed', checks }, null, 2));
}

try {
  main();
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
