'use strict';

const assert = require('assert');
const { CatalogueRepository } = require('./engineering/CatalogueRepository');
const { readinessFor, listReadiness } = require('./engineering/MultiRefrigerantReadinessService');

const repository = new CatalogueRepository();
const all = listReadiness(repository);
assert.strictEqual(all.length, 8);
assert(all.every((entry) => entry.supported));
assert(all.every((entry) => entry.endToEndReadiness.finalSelection === 'manufacturer-map-and-engineering-review-required'));

const r717 = readinessFor('R717', repository);
assert.strictEqual(r717.defaultSelectionIntent.template.id, 'R717_PUMPED_SCREW_EVAPORATIVE');
assert(r717.catalogueReadiness.categories.compressor.declaredCompatibleModelCount > 0);
assert(r717.catalogueReadiness.categories.compressor.sourceBackedModelCount > 0);

const r290 = readinessFor('R290', repository);
assert.strictEqual(r290.defaultSelectionIntent.template.id, 'R290_DX_AIR_COOLED');
assert.strictEqual(r290.endToEndReadiness.propertyCalculation, 'validated-property-provider-required');

const r717Compressor = repository.resolve('compressor', { model: 'XRV163/165', manufacturer: 'Howden' }, 'R717');
assert.strictEqual(r717Compressor.compatibleWithSelectedRefrigerant, true);
assert.strictEqual(r717Compressor.catalogueStatus, 'source-backed-catalogue-record');
assert.strictEqual(r717Compressor.status, 'manufacturer-evidence-required');
assert.strictEqual(r717Compressor.manufacturerEvidence.finalSelectionAllowed, false);

const r290Compressor = repository.resolve('compressor', { model: 'XRV163/165', manufacturer: 'Howden' }, 'R290');
assert.strictEqual(r290Compressor.status, 'unmapped');
assert.strictEqual(r290Compressor.record, null);

console.log(JSON.stringify({
  status: 'passed',
  checks: [
    'eight-refrigerant-readiness-matrix',
    'r717-source-backed-compressor-remains-manufacturer-evidence-gated',
    'r290-semantic-cycle-with-property-gate',
    'cross-refrigerant-catalogue-substitution-blocked'
  ],
  catalogueCoverage: all.map((entry) => ({
    code: entry.code,
    sourceBackedCategories: entry.catalogueReadiness.sourceBackedCategories
  }))
}, null, 2));
