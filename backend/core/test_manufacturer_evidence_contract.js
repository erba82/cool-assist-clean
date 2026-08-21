'use strict';

const assert = require('assert');
const { validateManufacturerEvidence, evidenceDraftFromCatalogue } = require('./engineering/ManufacturerEvidenceContract');
const { CatalogueRepository } = require('./engineering/CatalogueRepository');

function completeEvidence() {
  return {
    evidenceId: 'evidence:compressor:example:rev-a',
    category: 'compressor',
    manufacturer: 'Example Manufacturer',
    model: 'EX-100',
    source: 'Owner-provided manufacturer performance package',
    revision: 'REV-A',
    licenseState: 'provided-by-user',
    status: 'verified',
    compatibility: {
      refrigerants: ['R717'],
      declaration: 'Manufacturer document declares R717 compatibility for the named model.'
    },
    performanceMap: {
      reference: 'Owner-provided map page 3',
      referenceConditionsSI: { evaporatingTemperatureK: 263.15, condensingTemperatureK: 308.15 }
    },
    operatingEnvelopeSI: { minEvaporatingTemperatureK: 243.15, maxCondensingTemperatureK: 318.15 },
    ports: [{ id: 'suction', connectionType: 'welded', nominalDiameterMm: 150 }]
  };
}

function main() {
  const checks = [];
  const valid = validateManufacturerEvidence(completeEvidence(), { selectedRefrigerant: 'R717' });
  assert.strictEqual(valid.valid, true);
  assert.strictEqual(valid.verifiedCandidate, true);
  assert.strictEqual(valid.finalSelectionAllowed, false);
  checks.push('complete-source-revision-map-envelope-and-port-evidence-is-review-gated-candidate');

  const noRevision = completeEvidence();
  delete noRevision.revision;
  const missingRevision = validateManufacturerEvidence(noRevision, { selectedRefrigerant: 'R717' });
  assert.strictEqual(missingRevision.valid, false);
  assert.strictEqual(missingRevision.verifiedCandidate, false);
  assert(missingRevision.issues.some((issue) => issue.includes('revision is required')));
  checks.push('missing-revision-cannot-be-verified-candidate');

  const wrongFluid = validateManufacturerEvidence(completeEvidence(), { selectedRefrigerant: 'R744' });
  assert.strictEqual(wrongFluid.valid, false);
  assert.strictEqual(wrongFluid.verifiedCandidate, false);
  assert(wrongFluid.issues.some((issue) => issue.includes('R744')));
  checks.push('cross-refrigerant-evidence-is-blocked');

  const repository = new CatalogueRepository();
  const catalogueRecord = repository.resolve('compressor', { model: 'XRV163/165', manufacturer: 'Howden' }, 'R717');
  assert.strictEqual(catalogueRecord.catalogueStatus, 'source-backed-catalogue-record');
  assert.strictEqual(catalogueRecord.status, 'manufacturer-evidence-required');
  assert.strictEqual(catalogueRecord.manufacturerEvidence.finalSelectionAllowed, false);
  assert.strictEqual(catalogueRecord.manufacturerEvidence.validation.verifiedCandidate, false);
  assert(catalogueRecord.reason.includes('revision is required'));
  checks.push('catalogue-source-reference-is-not-promoted-without-complete-evidence');

  const draft = evidenceDraftFromCatalogue(catalogueRecord.record, { category: 'compressor', selectedRefrigerant: 'R717' });
  assert.strictEqual(draft.status, 'review-required');
  assert.strictEqual(draft.provenance, 'catalogue-derived-draft-no-inferred-fields');
  assert.strictEqual(draft.performanceMap.reference, null);
  checks.push('catalogue-draft-preserves-unknown-fields-as-null');

  console.log(JSON.stringify({ status: 'passed', checks }, null, 2));
}

try {
  main();
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
