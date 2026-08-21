'use strict';

const assert = require('assert');
const { SidecarHealthGovernor } = require('./engineering/SidecarHealthGovernor');
const { CoolPropSidecarClient } = require('./engineering/CoolPropSidecarClient');

function healthyPayload(version = '8.0.0') {
  return {
    status: 'healthy',
    providerId: 'coolprop',
    providerVersion: version,
    providerGitRevision: 'test-revision',
    backend: 'HEOS',
    referenceState: 'IIR',
    outboundRequests: false,
    fluidMappings: {
      R717: { available: true },
      R744: { available: true }
    }
  };
}

async function expectReject(action, expectedFragment) {
  let rejected = false;
  try {
    await action();
  } catch (error) {
    rejected = true;
    assert(String(error.message).includes(expectedFragment), `Expected '${expectedFragment}' in '${error.message}'`);
  }
  assert.strictEqual(rejected, true, 'Expected the governor to block the action.');
}

async function main() {
  const checks = [];
  let clock = Date.parse('2026-08-21T00:00:00.000Z');
  const unavailable = new SidecarHealthGovernor({
    client: { healthCheck: async () => { throw new Error('connect ECONNREFUSED 127.0.0.1:5011'); } },
    now: () => clock,
    intervalMs: 1_000,
    staleAfterMs: 2_000
  });

  const unavailableStatus = await unavailable.checkNow();
  assert.strictEqual(unavailableStatus.health.status, 'unavailable');
  assert.strictEqual(unavailableStatus.health.propertyDependentCandidateAllowed, false);
  assert.strictEqual(unavailableStatus.health.finalSelectionAllowed, false);
  assert.strictEqual(unavailableStatus.health.selectionGate.status, 'blocked');
  await expectReject(() => unavailable.requirePropertyDependentCandidate(), 'candidate selection is blocked');
  checks.push('sidecar-unavailable-blocks-property-dependent-selection');

  // Use a real loopback HTTP client against reserved port 0 to exercise the
  // unavailable-runtime path without depending on any external service.
  const loopbackUnavailable = new SidecarHealthGovernor({
    client: new CoolPropSidecarClient({
      env: {
        THERMOPHYSICAL_PROVIDER_MODE: 'coolprop-sidecar',
        THERMOPHYSICAL_PROVIDER_URL: 'http://127.0.0.1:0',
        THERMOPHYSICAL_PROVIDER_ALLOW_OUTBOUND: 'true',
        THERMOPHYSICAL_PROVIDER_REFERENCE_STATE: 'IIR',
        THERMOPHYSICAL_PROVIDER_TIMEOUT_MS: '250'
      }
    }),
    now: () => clock
  });
  const loopbackUnavailableStatus = await loopbackUnavailable.checkNow();
  assert.strictEqual(loopbackUnavailableStatus.health.status, 'unavailable');
  assert.strictEqual(loopbackUnavailableStatus.health.propertyDependentCandidateAllowed, false);
  checks.push('real-loopback-unavailable-runtime-fails-closed');

  const available = new SidecarHealthGovernor({
    client: { healthCheck: async () => healthyPayload('8.0.0') },
    now: () => clock,
    intervalMs: 1_000,
    staleAfterMs: 2_000
  });
  const availableStatus = await available.checkNow();
  assert.strictEqual(availableStatus.health.status, 'healthy');
  assert.strictEqual(availableStatus.health.propertyDependentCandidateAllowed, true);
  assert.strictEqual(availableStatus.health.finalSelectionAllowed, false);
  assert.strictEqual(availableStatus.health.selectionGate.status, 'review-required');
  const candidateGate = await available.requirePropertyDependentCandidate();
  assert.strictEqual(candidateGate.health.provider.providerVersion, '8.0.0');
  checks.push('healthy-sidecar-permits-review-gated-candidate-work-only');

  clock += 2_001;
  const staleStatus = available.getStatus();
  assert.strictEqual(staleStatus.health.status, 'stale');
  assert.strictEqual(staleStatus.health.propertyDependentCandidateAllowed, false);
  assert.strictEqual(staleStatus.health.finalSelectionAllowed, false);
  assert(staleStatus.health.selectionGate.blockers.some((blocker) => blocker.includes('Property-dependent candidate selection is blocked')));
  checks.push('stale-health-fails-closed');

  console.log(JSON.stringify({
    status: 'passed',
    checks,
    recordedProviderVersion: availableStatus.health.provider.providerVersion,
    finalSelectionAllowed: availableStatus.health.finalSelectionAllowed
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
