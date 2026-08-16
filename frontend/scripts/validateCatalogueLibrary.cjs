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
  const ids = new Set(model.connections.map((connection) => connection.id));
  ['suction', 'discharge', 'oil-injection'].forEach((id) => assert(ids.has(id), `${model.id} is missing ${id}.`));
  model.connections.forEach((connection) => {
    assert(['verified', 'requires-manufacturer-ga'].includes(connection.coordinateStatus), `${model.id}:${connection.id} has invalid coordinate status.`);
    assert((connection.positionMm === null) === (connection.direction === null), `${model.id}:${connection.id} must define both coordinate and direction or neither.`);
    if (connection.coordinateStatus === 'verified') assert(connection.positionMm !== null && connection.direction !== null, `${model.id}:${connection.id} cannot be verified without a coordinate frame.`);
  });
});

const valveCatalogue = readJson('../src/catalogue/valves_catalog.json');
assert(valveCatalogue.schemaVersion === '1.0.0', 'Unexpected valve catalogue schema version.');
assert(valveCatalogue.units === 'mm', 'Valve catalogue data must use millimetres.');
assert(Array.isArray(valveCatalogue.models) && valveCatalogue.models.length >= 13, 'Expected at least 13 source-traceable valve-family records.');

const valveIds = new Set();
valveCatalogue.models.forEach((model) => {
  assert(!valveIds.has(model.id), `Duplicate valve model id: ${model.id}`);
  valveIds.add(model.id);
  assert(Array.isArray(model.sourceRefs) && model.sourceRefs.length > 0, `${model.id} lacks source traceability.`);
  assert(Array.isArray(model.connectionPorts) && model.connectionPorts.length === 2, `${model.id} must define one inlet and one outlet.`);
  const portIds = new Set(model.connectionPorts.map((port) => port.id));
  assert(portIds.has('inlet') && portIds.has('outlet'), `${model.id} must contain inlet and outlet ports.`);
  Object.entries(model.dimensionsMm).forEach(([name, value]) => {
    if (typeof value === 'number') assert(Number.isFinite(value) && value >= 0, `${model.id}:${name} must be finite and non-negative.`);
  });
  model.connectionPorts.forEach((port) => {
    assert(Array.isArray(port.allowedNominalBoresMm) && port.allowedNominalBoresMm.length > 0, `${model.id}:${port.id} needs nominal-bore data.`);
    port.allowedNominalBoresMm.forEach((bore) => assert(Number.isFinite(bore) && bore > 0, `${model.id}:${port.id} has invalid nominal bore.`));
    assert((port.positionMm === null) === (port.direction === null), `${model.id}:${port.id} must define both a position and a direction or neither.`);
    if (port.coordinateStatus !== 'requires-manufacturer-ga') {
      assert(Array.isArray(port.positionMm) && port.positionMm.length === 3 && port.positionMm.every(Number.isFinite), `${model.id}:${port.id} must have a finite port position.`);
      assert(Array.isArray(port.direction) && port.direction.length === 3 && port.direction.every(Number.isFinite), `${model.id}:${port.id} must have a finite port direction.`);
    }
  });
  if (model.geometryReadiness === 'parametric-reference') {
    assert(Number.isFinite(model.dimensionsMm.faceToFace) || Number.isFinite(model.dimensionsMm.overallLength), `${model.id} requires verified face-to-face or overall length.`);
  }
  if (model.flowDirection === 'unidirectional') {
    assert(Array.isArray(model.flowDirectionVector) && model.flowDirectionVector.length === 3, `${model.id} requires a flow direction vector.`);
  }
});

console.log(`Validated ${compressorCatalogue.models.length} compressor models and ${valveCatalogue.models.length} source-traceable valve models without fabricated routing coordinates.`);
