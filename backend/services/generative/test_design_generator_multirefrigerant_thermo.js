'use strict';

const assert = require('assert');
const designGenerator = require('./DesignGenerator');

async function main() {
  const original = {
    mode: process.env.THERMOPHYSICAL_PROVIDER_MODE,
    url: process.env.THERMOPHYSICAL_PROVIDER_URL,
    allow: process.env.THERMOPHYSICAL_PROVIDER_ALLOW_OUTBOUND,
    reference: process.env.THERMOPHYSICAL_PROVIDER_REFERENCE_STATE
  };
  process.env.THERMOPHYSICAL_PROVIDER_MODE = 'coolprop-sidecar';
  process.env.THERMOPHYSICAL_PROVIDER_URL = 'http://127.0.0.1:5011';
  process.env.THERMOPHYSICAL_PROVIDER_ALLOW_OUTBOUND = 'true';
  process.env.THERMOPHYSICAL_PROVIDER_REFERENCE_STATE = 'IIR';

  const r290 = await designGenerator.calculateThermodynamics({}, {
    refrigerant: 'R290', evap_temp: -25, cond_temp: 40, cooling_capacity: 100
  });
  assert.strictEqual(r290.status, 'coolprop-provider-result-review-required');
  assert.strictEqual(r290.refrigerant, 'R290');
  assert.strictEqual(r290.provenance.providerId, 'coolprop');
  assert(Number.isFinite(r290.cop));

  const r744MissingControls = await designGenerator.calculateThermodynamics({}, {
    refrigerant: 'R744', evap_temp: -30, cond_temp: 35, cooling_capacity: 100
  });
  assert.strictEqual(r744MissingControls.status, 'r744-operating-controls-required');
  assert.strictEqual(r744MissingControls.refrigerant, 'R744');

  const r744 = await designGenerator.calculateThermodynamics({}, {
    refrigerant: 'R744', evap_temp: -30, cond_temp: 35, cooling_capacity: 100,
    gasCoolerOutletTempC: 35, highSidePressurePa: 9000000, flashGasPressurePa: 3600000
  });
  assert.strictEqual(r744.status, 'coolprop-r744-transcritical-booster-review-required');
  assert.strictEqual(r744.refrigerant, 'R744');
  assert.strictEqual(r744.provenance.providerId, 'coolprop');
  assert(Number.isFinite(r744.cop));

  process.env.THERMOPHYSICAL_PROVIDER_MODE = 'none';
  process.env.THERMOPHYSICAL_PROVIDER_ALLOW_OUTBOUND = 'false';
  const r404aNoProvider = await designGenerator.calculateThermodynamics({}, {
    refrigerant: 'R404A', evap_temp: -25, cond_temp: 40, cooling_capacity: 100
  });
  assert.strictEqual(r404aNoProvider.status, 'validated-property-provider-required');
  assert.strictEqual(r404aNoProvider.refrigerant, 'R404A');

  for (const [key, value] of Object.entries(original)) {
    if (value === undefined) delete process.env[{ mode: 'THERMOPHYSICAL_PROVIDER_MODE', url: 'THERMOPHYSICAL_PROVIDER_URL', allow: 'THERMOPHYSICAL_PROVIDER_ALLOW_OUTBOUND', reference: 'THERMOPHYSICAL_PROVIDER_REFERENCE_STATE' }[key]];
    else process.env[{ mode: 'THERMOPHYSICAL_PROVIDER_MODE', url: 'THERMOPHYSICAL_PROVIDER_URL', allow: 'THERMOPHYSICAL_PROVIDER_ALLOW_OUTBOUND', reference: 'THERMOPHYSICAL_PROVIDER_REFERENCE_STATE' }[key]] = value;
  }

  console.log(JSON.stringify({
    status: 'passed',
    checks: [
      'r290-uses-selected-refrigerant-and-coolprop',
      'r744-requires-explicit-pressure-controls-and-uses-booster-sidecar',
      'r404a-without-provider-is-blocked-not-substituted'
    ]
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
