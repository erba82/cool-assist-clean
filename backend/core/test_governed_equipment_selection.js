'use strict';

const assert = require('assert');
const CompressorSelector = require('./modules/CompressorSelector');
const EvaporatorSelector = require('./modules/EvaporatorSelector');

const coolPropFixture = {
  async calculateSimpleVaporCompressionCycle() {
    return {
      status: 'ok',
      performanceSI: {
        coolingLoadW: 1800000,
        compressorPowerW: 720000,
        heatRejectionW: 2520000,
        massFlowKgPerS: 9.4,
        cop: 2.5
      },
      provenance: {
        providerId: 'coolprop',
        providerVersion: 'test-fixture',
        backend: 'HEOS',
        fluidIdentifier: 'Ammonia',
        referenceState: 'DEF',
        sourceRevision: 'fixture',
        queriedAt: new Date().toISOString()
      },
      limitations: ['Fixture only: manufacturer map remains required.']
    };
  }
};

const engine = {
  getData(key) {
    return key === 'refrigerants' ? require('./data/refrigerants.json') : null;
  }
};

async function run() {
  const compressor = new CompressorSelector(engine, { sidecarClient: coolPropFixture });
  const selected = await compressor.select(
    { temperatureLevel: 'T-30', evaporatingTemp: -30, totalLoad: 1800, rooms: [{ id: 'R1' }] },
    {
      refrigerant: 'R717',
      operatingConditions: { condensingTemperatureC: 35 },
      semanticCycle: { compressorFamily: 'screw' },
      designIntent: { compressorModelId: 'MAYEKAWA_V_250_VLD' },
      designBasis: { diversityFactor: 1, superheatK: 8, subcoolK: 4, compressorIsentropicEfficiency: 0.7 }
    }
  );

  assert.strictEqual(selected.manufacturer, 'Mayekawa');
  assert.strictEqual(selected.model, '250 VLD');
  assert.strictEqual(selected.manufacturerModelKey, 'MAYEKAWA_V_250_VLD');
  assert.strictEqual(selected.capacityPerUnit, null);
  assert.strictEqual(selected.motorPower, null);
  assert.strictEqual(selected.train.dutyCount, null);
  assert.strictEqual(selected.train.standbyCount, null);
  assert.strictEqual(selected.selectionStatus, 'manufacturer-map-required');
  assert.strictEqual(selected.finalSelectionAllowed, false);
  assert.strictEqual(selected.price, null);
  assert.strictEqual(selected.thermophysicalCycle.status, 'ok');
  assert.strictEqual(selected.thermophysicalCycle.performance.coolingLoadKw, 1800);

  const evaporator = new EvaporatorSelector(engine);
  const evapResult = await evaporator.select({
    total: 150,
    room: { id: 'ROOM-01', name: 'Cold Storage Room 1', type: 'storage', length: 18, width: 12, height: 9, temperature: -18 }
  }, { designBasis: { evaporatorTdK: 8 } });
  assert.strictEqual(evapResult.model, null);
  assert.strictEqual(evapResult.manufacturer, null);
  assert.strictEqual(evapResult.technicalSpecs.fanMotorPowerKw, null);
  assert.strictEqual(evapResult.selectionStatus, 'manufacturer-map-required');
  assert.strictEqual(evapResult.finalSelectionAllowed, false);

  const missingInput = await evaporator.select({ total: 0, room: { name: 'Unknown' } }, {});
  assert.strictEqual(missingInput.selectionStatus, 'inputs-required');
  assert(missingInput.issues.length >= 2);

  console.log(JSON.stringify({
    status: 'passed',
    checks: [
      'catalogue-manufacturer-model-is-not-cross-mixed',
      'manufacturer-map-missing-never-produces-unit-capacity-or-motor-rating',
      'thermophysical-cycle-is-separate-from-equipment-map',
      'evaporator-performance-fields-remain-blocked-without-map',
      'missing-room-inputs-are-fail-closed'
    ]
  }, null, 2));
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
