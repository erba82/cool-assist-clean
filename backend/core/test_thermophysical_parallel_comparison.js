'use strict';

const assert = require('assert');
const ThermophysicalParallelComparisonService = require('./engineering/ThermophysicalParallelComparisonService');

async function main() {
  const env = {
    THERMOPHYSICAL_PROVIDER_MODE: 'coolprop-sidecar',
    THERMOPHYSICAL_PROVIDER_URL: 'http://127.0.0.1:5011',
    THERMOPHYSICAL_PROVIDER_ALLOW_OUTBOUND: 'true',
    THERMOPHYSICAL_PROVIDER_REFERENCE_STATE: 'IIR',
    THERMOPHYSICAL_PROVIDER_TIMEOUT_MS: '3000'
  };
  const service = new ThermophysicalParallelComparisonService({ env });
  const r717 = await service.compareSimpleVaporCompression({
    refrigerant: 'R717',
    evapTempK: 243.15,
    condTempK: 308.15,
    superheatK: 8,
    subcoolK: 4,
    compressorIsentropicEfficiency: 0.75,
    loadW: 500000
  });

  assert.strictEqual(r717.status, 'parallel-comparison-review-required');
  assert.strictEqual(r717.legacy.status, 'preliminary-internal-table');
  assert.strictEqual(r717.coolProp.provenance.providerId, 'coolprop');
  assert.strictEqual(r717.coolProp.provenance.providerVersion, '8.0.0');
  assert.strictEqual(r717.comparison.comparable, true);
  assert(Number.isFinite(r717.comparison.deltasPercent.cop));
  assert.strictEqual(r717.finalSelectionAllowed, false);

  const r290 = await service.compareSimpleVaporCompression({
    refrigerant: 'R290',
    evapTempK: 248.15,
    condTempK: 313.15,
    superheatK: 5,
    subcoolK: 3,
    compressorIsentropicEfficiency: 0.75,
    loadW: 100000
  });
  assert.strictEqual(r290.legacy.status, 'not-available-for-this-refrigerant');
  assert.strictEqual(r290.comparison.comparable, false);
  assert.strictEqual(r290.coolProp.status, 'ok');

  let r744Blocked = false;
  try {
    await service.compareSimpleVaporCompression({
      refrigerant: 'R744',
      evapTempK: 243.15,
      condTempK: 308.15,
      superheatK: 8,
      subcoolK: 4,
      compressorIsentropicEfficiency: 0.75,
      loadW: 100000
    });
  } catch (error) {
    r744Blocked = String(error.message).includes('R744 transcritical/booster cycle');
  }
  assert.strictEqual(r744Blocked, true);

  console.log(JSON.stringify({
    status: 'passed',
    checks: [
      'r717-parallel-comparison',
      'no-cross-refrigerant-legacy-comparison',
      'r744-simple-cycle-blocked'
    ],
    r717DeltasPercent: r717.comparison.deltasPercent
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
