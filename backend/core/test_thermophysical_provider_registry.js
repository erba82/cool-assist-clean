'use strict';

const assert = require('assert');
const { getProviderStatus, validatePropertyRequest } = require('./engineering/ThermophysicalProviderRegistry');
const { capabilityFor } = require('./engineering/RefrigerantCapabilityService');

const checks = [];

const defaultStatus = getProviderStatus({});
assert.strictEqual(defaultStatus.status, 'not-configured');
assert.strictEqual(defaultStatus.outboundCallsEnabled, false);
assert.strictEqual(defaultStatus.activeProvider, null);
checks.push('default-provider-disabled');

const coolPropCandidate = getProviderStatus({
  THERMOPHYSICAL_PROVIDER_MODE: 'coolprop-sidecar',
  THERMOPHYSICAL_PROVIDER_URL: 'http://127.0.0.1:8123',
  THERMOPHYSICAL_PROVIDER_REFERENCE_STATE: 'IIR'
});
assert.strictEqual(coolPropCandidate.status, 'configured-not-callable-review-required');
assert.strictEqual(coolPropCandidate.outboundCallsEnabled, false);
assert(coolPropCandidate.blockers.includes('Outbound provider calls are disabled by policy.'));
checks.push('provider-candidate-does-not-auto-connect');

const reviewedCandidate = getProviderStatus({
  THERMOPHYSICAL_PROVIDER_MODE: 'coolprop-sidecar',
  THERMOPHYSICAL_PROVIDER_URL: 'http://127.0.0.1:8123',
  THERMOPHYSICAL_PROVIDER_REFERENCE_STATE: 'IIR',
  THERMOPHYSICAL_PROVIDER_ALLOW_OUTBOUND: 'true'
});
assert.strictEqual(reviewedCandidate.status, 'configured-not-approved-review-required');
assert.strictEqual(reviewedCandidate.finalSelectionApproved, false);
checks.push('configured-provider-remains-review-gated');

const validSaturationRequest = validatePropertyRequest({
  refrigerant: 'R717',
  state: { T: { valueSI: 243.15 }, Q: { valueSI: 1 } },
  outputs: ['P', 'Dmass', 'Hmass', 'Smass'],
  referenceState: 'IIR'
});
assert.strictEqual(validSaturationRequest.valid, true);
checks.push('valid-si-saturation-request');

const r134aRequest = validatePropertyRequest({
  refrigerant: 'R134a',
  state: { P: 250000, Hmass: 400000 },
  outputs: ['T', 'Dmass'],
  referenceState: 'ASHRAE'
});
assert.strictEqual(r134aRequest.valid, true);
checks.push('canonical-refrigerant-alias');

const invalidRequest = validatePropertyRequest({
  refrigerant: 'UNKNOWN',
  state: { T: 243.15, Q: 1.2 },
  outputs: ['NOT_A_PROPERTY'],
  referenceState: 'INVALID'
});
assert.strictEqual(invalidRequest.valid, false);
assert(invalidRequest.issues.some((issue) => issue.includes('Unsupported refrigerant')));
assert(invalidRequest.issues.some((issue) => issue.includes('Vapour quality')));
assert(invalidRequest.issues.some((issue) => issue.includes('Unsupported requested output')));
checks.push('invalid-request-blocked');

assert.strictEqual(capabilityFor('R717').calculationReadiness.propertyStatus, 'internal-table-review-required');
assert.strictEqual(capabilityFor('R744').calculationReadiness.propertyStatus, 'validated-property-provider-required');
checks.push('legacy-readiness-preserved-without-provider');

console.log(JSON.stringify({ status: 'passed', checks }, null, 2));
