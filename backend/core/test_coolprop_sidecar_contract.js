'use strict';

const assert = require('assert');
const { CoolPropSidecarClient, isLoopbackUrl } = require('./engineering/CoolPropSidecarClient');

async function expectReject(action, expectedFragment) {
  let rejected = false;
  try {
    await action();
  } catch (error) {
    rejected = true;
    assert(String(error.message).includes(expectedFragment), `Expected '${expectedFragment}' in '${error.message}'`);
  }
  assert(rejected, `Expected rejection containing '${expectedFragment}'.`);
}

async function main() {
  const checks = [];
  const disabled = new CoolPropSidecarClient({ env: { THERMOPHYSICAL_PROVIDER_MODE: 'none' } });
  await expectReject(() => disabled.healthCheck(), 'not explicitly configured');
  checks.push('default-disabled');

  assert.strictEqual(isLoopbackUrl('http://127.0.0.1:5011'), true);
  assert.strictEqual(isLoopbackUrl('http://localhost:5011'), true);
  assert.strictEqual(isLoopbackUrl('https://example.com'), false);
  checks.push('loopback-only-url-policy');

  const env = {
    THERMOPHYSICAL_PROVIDER_MODE: 'coolprop-sidecar',
    THERMOPHYSICAL_PROVIDER_URL: 'http://127.0.0.1:5011',
    THERMOPHYSICAL_PROVIDER_ALLOW_OUTBOUND: 'true',
    THERMOPHYSICAL_PROVIDER_REFERENCE_STATE: 'IIR',
    THERMOPHYSICAL_PROVIDER_TIMEOUT_MS: '3000'
  };
  const client = new CoolPropSidecarClient({ env });
  const health = await client.healthCheck();
  assert.strictEqual(health.providerVersion, '8.0.0');
  assert.strictEqual(health.outboundRequests, false);
  assert.strictEqual(Object.keys(health.fluidMappings).length, 8);
  assert(Object.values(health.fluidMappings).every((mapping) => mapping.available === true));
  checks.push('sidecar-health-and-eight-fluid-mappings');

  const refrigerants = ['R717', 'R744', 'R290', 'R32', 'R404A', 'R410A', 'R134a', 'R22'];
  for (const refrigerant of refrigerants) {
    const result = await client.getProperties({
      refrigerant,
      state: { T: { valueSI: 273.15 }, Q: { valueSI: 1 } },
      outputs: ['P', 'Dmass', 'Hmass', 'Smass'],
      referenceState: 'IIR'
    });
    assert.strictEqual(result.status, 'ok');
    assert.strictEqual(result.provenance.providerId, 'coolprop');
    assert.strictEqual(result.provenance.referenceState, 'IIR');
    assert.strictEqual(result.reviewRequired, true);
    assert(Object.values(result.valuesSI).every(Number.isFinite));
  }
  checks.push('eight-refrigerant-saturation-properties-with-provenance');

  const r744Booster = await client.calculateR744TranscriticalBoosterCycle({
    evapTempK: 243.15,
    gasCoolerOutletTempK: 308.15,
    highSidePressurePa: 9000000,
    flashGasPressurePa: 3600000,
    superheatK: 8,
    lowStageIsentropicEfficiency: 0.75,
    highStageIsentropicEfficiency: 0.75,
    loadW: 100000
  });
  assert.strictEqual(r744Booster.architecture, 'r744-transcritical-booster-preliminary');
  assert.strictEqual(r744Booster.provenance.providerId, 'coolprop');
  assert(Object.values(r744Booster.performanceSI).every(Number.isFinite));
  checks.push('r744-transcritical-booster-with-explicit-pressure-controls');

  await expectReject(() => client.getProperties({
    refrigerant: 'UNKNOWN',
    state: { T: { valueSI: 273.15 }, Q: { valueSI: 1 } },
    outputs: ['P'],
    referenceState: 'IIR'
  }), 'Invalid canonical property request');
  checks.push('unknown-refrigerant-blocked');

  console.log(JSON.stringify({ status: 'passed', checks }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
