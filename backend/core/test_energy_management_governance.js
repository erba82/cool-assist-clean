'use strict';

const assert = require('assert');
const EnergyManagementService = require('./modules/EnergyManagementService');

const service = new EnergyManagementService();
const results = { calculations: { compressors: [{ electrical: { ratedPower: 80 } }], condensers: [{ electrical: { ratedPower: 12 } }], evaporators: [{ motorPower: 5 }], pumps: [] } };

const missing = service.build(results, { name: 'No meters' });
assert.strictEqual(missing.baseline.origin, 'input-required');
assert.strictEqual(missing.baseline.annualKwh, null);
assert.strictEqual(missing.enpis[0].status, 'input-required');
assert.strictEqual(missing.connectedElectricalPowerKw, 97);
assert.strictEqual(missing.actions[0].status, 'input-required');

const measured = service.build(results, {
    energyManagement: {
        baseline: { annualKwh: 420000, period: '2025-01-01 to 2025-12-31', boundary: 'Refrigeration plant', source: 'MTR-PLANT-01 export' },
        meters: [{ id: 'MTR-PLANT-01', name: 'Plant main meter', coverage: 'Refrigeration plant', source: 'BMS export', status: 'measured' }],
        throughput: { annualQuantity: 7000, unit: 'tonne', source: 'WMS annual report', relevantVariables: 'Frozen product throughput' }
    }
});
assert.strictEqual(measured.baseline.origin, 'measured');
assert.strictEqual(measured.enpis[0].status, 'calculated');
assert.strictEqual(measured.enpis[0].value, 60);
assert.strictEqual(measured.meters[0].status, 'measured');

console.log(JSON.stringify({ status: 'passed', checks: ['no-baseline-fabrication', 'declared-power-only', 'measured-baseline-contract', 'traceable-enpi'] }, null, 2));
