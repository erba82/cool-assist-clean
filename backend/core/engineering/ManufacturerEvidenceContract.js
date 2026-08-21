'use strict';

const { normalizeRefrigerant } = require('../data/RefrigerantProfiles');

const CONTRACT_VERSION = '1.0.0';
const LICENSE_STATES = Object.freeze(['provided-by-user', 'licensed', 'public-metadata-only', 'unknown']);
const EVIDENCE_STATUSES = Object.freeze(['verified', 'review-required', 'blocked']);

function hasText(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function recordOf(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizedRefrigerants(value) {
  return asArray(value).map(normalizeRefrigerant).filter(Boolean);
}

function validateManufacturerEvidence(record, { selectedRefrigerant = null, at = new Date() } = {}) {
  const evidence = recordOf(record);
  const compatibility = recordOf(evidence.compatibility);
  const performanceMap = recordOf(evidence.performanceMap);
  const envelope = recordOf(evidence.operatingEnvelopeSI);
  const ports = asArray(evidence.ports);
  const issues = [];
  const warnings = [];
  const normalizedSelectedRefrigerant = selectedRefrigerant ? normalizeRefrigerant(selectedRefrigerant) : null;
  const refrigerants = normalizedRefrigerants(compatibility.refrigerants);

  if (!hasText(evidence.evidenceId)) issues.push('evidenceId is required.');
  if (!hasText(evidence.category)) issues.push('category is required.');
  if (!hasText(evidence.manufacturer)) issues.push('manufacturer is required.');
  if (!hasText(evidence.model)) issues.push('model is required.');
  if (!hasText(evidence.source)) issues.push('source is required.');
  if (!hasText(evidence.revision)) issues.push('revision is required.');
  if (!LICENSE_STATES.includes(evidence.licenseState)) issues.push(`licenseState must be one of: ${LICENSE_STATES.join(', ')}.`);
  if (!EVIDENCE_STATUSES.includes(evidence.status)) issues.push(`status must be one of: ${EVIDENCE_STATUSES.join(', ')}.`);

  if (!refrigerants.length) issues.push('compatibility.refrigerants must declare at least one refrigerant.');
  if (!hasText(compatibility.declaration)) issues.push('compatibility.declaration is required.');
  if (normalizedSelectedRefrigerant && !refrigerants.includes(normalizedSelectedRefrigerant)) {
    issues.push(`Evidence does not declare compatibility with selected refrigerant ${normalizedSelectedRefrigerant}.`);
  }

  if (!hasText(performanceMap.reference)) issues.push('performanceMap.reference is required.');
  if (!recordOf(performanceMap.referenceConditionsSI) || !Object.keys(performanceMap.referenceConditionsSI).length) {
    issues.push('performanceMap.referenceConditionsSI is required.');
  }
  if (!recordOf(envelope) || !Object.keys(envelope).length) issues.push('operatingEnvelopeSI is required.');
  if (!ports.length) issues.push('ports must contain manufacturer-supported connection data.');
  if (ports.some((port) => !hasText(port.id) || !hasText(port.connectionType) || !Number.isFinite(Number(port.nominalDiameterMm)))) {
    issues.push('Each port requires id, connectionType and a finite nominalDiameterMm.');
  }

  if (evidence.expiryDate) {
    const expiryAt = Date.parse(evidence.expiryDate);
    if (!Number.isFinite(expiryAt)) issues.push('expiryDate must be an ISO-8601 date when supplied.');
    if (Number.isFinite(expiryAt) && expiryAt < at.getTime()) issues.push('Evidence is expired.');
  } else {
    warnings.push('No expiryDate is recorded; evidence recency must be reviewed by a human.');
  }

  if (evidence.licenseState === 'unknown') warnings.push('License state is unknown and must be cleared before controlled handoff.');
  if (evidence.status !== 'verified') warnings.push(`Evidence status is ${evidence.status}; final equipment selection is prohibited.`);

  const verifiedCandidate = issues.length === 0 && evidence.status === 'verified' && evidence.licenseState !== 'unknown';
  return {
    contractVersion: CONTRACT_VERSION,
    valid: issues.length === 0,
    verifiedCandidate,
    finalSelectionAllowed: false,
    selectedRefrigerant: normalizedSelectedRefrigerant,
    normalized: issues.length ? null : {
      ...evidence,
      compatibility: { ...compatibility, refrigerants },
      performanceMap: { ...performanceMap },
      operatingEnvelopeSI: { ...envelope },
      ports: ports.map((port) => ({ ...port }))
    },
    issues,
    warnings,
    policy: 'A verified candidate remains review-gated. Manufacturer evidence alone never authorizes procurement, construction, safety or final selection.'
  };
}

function evidenceDraftFromCatalogue(record, { category, selectedRefrigerant = null } = {}) {
  const sourceRefs = asArray(record?.sourceRefs || record?.sources || record?.verification?.sourceRefs);
  const firstSource = recordOf(sourceRefs[0]);
  const refrigerants = normalizedRefrigerants(record?.refrigerants || record?.compatibleRefrigerants || record?.compatibility?.refrigerants);
  const connections = asArray(record?.connections || record?.connectionPorts).map((connection) => ({
    id: connection?.id || null,
    connectionType: connection?.connectionType || connection?.jointType || null,
    nominalDiameterMm: Number.isFinite(Number(connection?.nominalDiameterMm)) ? Number(connection.nominalDiameterMm) : null,
    sourceReference: asArray(connection?.sourceRefs)[0] || null
  }));
  return {
    contractVersion: CONTRACT_VERSION,
    evidenceId: category && (record?.id || record?.modelId) ? `${category}:${record.id || record.modelId}:manufacturer-evidence-draft` : null,
    category: category || null,
    manufacturer: record?.manufacturer || record?.brand || null,
    model: record?.model || record?.name || record?.id || record?.modelId || null,
    source: firstSource.document || firstSource.source || null,
    revision: firstSource.revision || null,
    licenseState: 'unknown',
    status: 'review-required',
    compatibility: {
      refrigerants,
      declaration: firstSource.document ? `Catalogue source ${firstSource.document} is present; compatibility requires review against the selected operating point.` : null
    },
    performanceMap: {
      reference: null,
      referenceConditionsSI: {}
    },
    operatingEnvelopeSI: {},
    ports: connections,
    sourceRefs: sourceRefs.map((source) => ({ ...source })),
    provenance: 'catalogue-derived-draft-no-inferred-fields',
    selectedRefrigerant: selectedRefrigerant ? normalizeRefrigerant(selectedRefrigerant) : null
  };
}

function assessCatalogueEvidence(record, context = {}) {
  const draft = evidenceDraftFromCatalogue(record, context);
  const validation = validateManufacturerEvidence(draft, context);
  return {
    draft,
    validation,
    candidateStatus: validation.verifiedCandidate ? 'verified-candidate' : 'manufacturer-evidence-required',
    finalSelectionAllowed: false
  };
}

module.exports = {
  CONTRACT_VERSION,
  LICENSE_STATES,
  EVIDENCE_STATUSES,
  validateManufacturerEvidence,
  evidenceDraftFromCatalogue,
  assessCatalogueEvidence
};
