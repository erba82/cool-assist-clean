const fs = require('fs');
const path = require('path');

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.resolve(__dirname, relativePath), 'utf8'));

const compressorCatalogue = readJson('../src/catalogue/catalogueCompressorModels.json');
assert(compressorCatalogue.schemaVersion === '1.0.0', 'Unexpected compressor catalogue schema version.');
assert(compressorCatalogue.units === 'mm', 'Compressor catalogue data must use millimetres.');
assert(Array.isArray(compressorCatalogue.models) && compressorCatalogue.models.length === 11, 'Expected 11 verified catalogue compressor models.');

const compressorIds = new Set();
compressorCatalogue.models.forEach((model) => {
  assert(!compressorIds.has(model.id), `Duplicate compressor model id: ${model.id}`);
  compressorIds.add(model.id);
  ['length', 'width', 'height'].forEach((dimension) => {
    assert(Number.isFinite(model.dimensionsMm[dimension]) && model.dimensionsMm[dimension] > 0, `${model.id}:${dimension} must be finite and positive.`);
  });
  assert(Array.isArray(model.connections) && model.connections.length === 3, `${model.id} must expose suction, discharge, and oil-injection records.`);
});

const valveCatalogue = readJson('../src/catalogue/valves_catalog.json');
assert(valveCatalogue.schemaVersion === '1.0.0', 'Unexpected valve catalogue schema version.');
assert(valveCatalogue.units === 'mm', 'Valve catalogue data must use millimetres.');
assert(Array.isArray(valveCatalogue.models) && valveCatalogue.models.length >= 13, 'Expected at least 13 source-traceable valve records.');

const valveIds = new Set();
valveCatalogue.models.forEach((model) => {
  assert(!valveIds.has(model.id), `Duplicate valve model id: ${model.id}`);
  valveIds.add(model.id);
  assert(Array.isArray(model.sourceRefs) && model.sourceRefs.length > 0, `${model.id} lacks source traceability.`);
});

const condenserCatalogue = readJson('../src/catalogue/condensers_catalog.json');
assert(condenserCatalogue.schemaVersion === '1.0.0', 'Unexpected condenser catalogue schema version.');
assert(Array.isArray(condenserCatalogue.models) && condenserCatalogue.models.length >= 2, 'Expected at least 2 verified condenser models.');

const pumpCatalogue = readJson('../src/catalogue/pumps_catalog.json');
assert(pumpCatalogue.schemaVersion === '1.0.0', 'Unexpected pump catalogue schema version.');
assert(Array.isArray(pumpCatalogue.models) && pumpCatalogue.models.length >= 2, 'Expected at least 2 verified pump models.');

const evaporatorCatalogue = readJson('../src/catalogue/evaporators_catalog.json');
assert(evaporatorCatalogue.schemaVersion === '1.0.0', 'Unexpected evaporator catalogue schema version.');
assert(Array.isArray(evaporatorCatalogue.models) && evaporatorCatalogue.models.length >= 1, 'Expected at least 1 verified evaporator model.');

console.log(`Validated ${compressorCatalogue.models.length} compressors, ${valveCatalogue.models.length} valves, ${condenserCatalogue.models.length} condensers, ${pumpCatalogue.models.length} pumps, and ${evaporatorCatalogue.models.length} evaporators successfully.`);
