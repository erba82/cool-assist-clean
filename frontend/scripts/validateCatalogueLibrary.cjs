const fs = require('fs');
const path = require('path');

const cataloguePath = path.resolve(__dirname, '../src/catalogue/catalogueCompressorModels.json');
const catalogue = JSON.parse(fs.readFileSync(cataloguePath, 'utf8'));

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

assert(catalogue.schemaVersion === '1.0.0', 'Unexpected catalogue schema version.');
assert(catalogue.units === 'mm', 'Catalogue data must use millimetres.');
assert(Array.isArray(catalogue.models) && catalogue.models.length === 11, 'Expected 11 verified catalogue model entries.');

const identityKeys = new Set();
catalogue.models.forEach((model) => {
  assert(!identityKeys.has(model.id), `Duplicate model id: ${model.id}`);
  identityKeys.add(model.id);
  ['length', 'width', 'height'].forEach((dimension) => {
    assert(Number.isFinite(model.dimensionsMm[dimension]) && model.dimensionsMm[dimension] > 0, `${model.id}:${dimension} must be finite and positive.`);
  });
  assert(Array.isArray(model.connections) && model.connections.length === 3, `${model.id} must expose suction, discharge, and oil-injection records.`);
  const ids = new Set(model.connections.map((connection) => connection.id));
  ['suction', 'discharge', 'oil-injection'].forEach((id) => assert(ids.has(id), `${model.id} is missing ${id}.`));
  model.connections.forEach((connection) => {
    assert(['verified', 'requires-manufacturer-ga'].includes(connection.coordinateStatus), `${model.id}:${connection.id} has invalid coordinate status.`);
    assert((connection.positionMm === null) === (connection.direction === null), `${model.id}:${connection.id} must define both coordinate and direction or neither.`);
    if (connection.coordinateStatus === 'verified') {
      assert(connection.positionMm !== null && connection.direction !== null, `${model.id}:${connection.id} cannot be verified without a coordinate frame.`);
    }
  });
});

console.log(`Validated ${catalogue.models.length} catalogue compressor models with no fabricated routing coordinates.`);
