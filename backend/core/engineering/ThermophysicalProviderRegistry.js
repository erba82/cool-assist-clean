'use strict';

const { normalizeRefrigerant } = require('../data/RefrigerantProfiles');

const CONTRACT_VERSION = '1.0.0';
const SUPPORTED_REFRIGERANTS = Object.freeze(['R717', 'R744', 'R290', 'R32', 'R404A', 'R410A', 'R134a', 'R22']);
const ALLOWED_PROVIDER_MODES = Object.freeze(['none', 'coolprop-sidecar', 'refprop-sidecar']);
const ALLOWED_STATE_KEYS = Object.freeze(['T', 'P', 'Q', 'Hmass', 'Smass', 'Dmass']);
const ALLOWED_OUTPUTS = Object.freeze(['P', 'T', 'Q', 'Dmass', 'Hmass', 'Smass', 'Cpmass', 'VISCOSITY', 'CONDUCTIVITY']);
const ALLOWED_REFERENCE_STATES = Object.freeze(['IIR', 'ASHRAE', 'NBP', 'DEF']);

const normalizeMode = (value) => String(value || 'none').trim().toLowerCase();
const isFiniteNumber = (value) => Number.isFinite(Number(value));

const publicProviderDefinitions = Object.freeze({
  'coolprop-sidecar': {
    providerId: 'coolprop',
    backend: 'HEOS',
    status: 'candidate-local-adapter',
    note: 'A locally hosted CoolProp adapter may be used only after version pinning, vector validation and engineering approval.'
  },
  'refprop-sidecar': {
    providerId: 'refprop',
    backend: 'REFPROP',
    status: 'candidate-licensed-adapter',
    note: 'A NIST REFPROP adapter requires an owner-approved license, controlled runtime path, version record and engineering approval.'
  }
});

function getProviderStatus(env = process.env) {
  const requestedMode = normalizeMode(env.THERMOPHYSICAL_PROVIDER_MODE);
  const mode = ALLOWED_PROVIDER_MODES.includes(requestedMode) ? requestedMode : 'none';
  const endpointConfigured = Boolean(String(env.THERMOPHYSICAL_PROVIDER_URL || '').trim());
  const outboundCallsEnabled = String(env.THERMOPHYSICAL_PROVIDER_ALLOW_OUTBOUND || 'false').trim().toLowerCase() === 'true';
  const referenceState = String(env.THERMOPHYSICAL_PROVIDER_REFERENCE_STATE || 'IIR').trim().toUpperCase();
  const referenceStateAccepted = ALLOWED_REFERENCE_STATES.includes(referenceState);
  const invalidMode = requestedMode !== mode;

  let status = 'not-configured';
  let active = null;
  const blockers = [];

  if (invalidMode) blockers.push(`Unsupported THERMOPHYSICAL_PROVIDER_MODE: ${requestedMode}.`);
  if (mode !== 'none') {
    active = publicProviderDefinitions[mode];
    if (!endpointConfigured) blockers.push('Provider endpoint is not configured.');
    if (!referenceStateAccepted) blockers.push(`Reference state ${referenceState} is not in the allowed contract.`);
    if (!outboundCallsEnabled) blockers.push('Outbound provider calls are disabled by policy.');
    status = blockers.length ? 'configured-not-callable-review-required' : 'configured-not-approved-review-required';
  }

  return {
    contractVersion: CONTRACT_VERSION,
    status,
    activeProvider: active ? { ...active } : null,
    outboundCallsEnabled,
    finalSelectionApproved: false,
    referenceState: referenceStateAccepted ? referenceState : null,
    supportedRefrigerants: [...SUPPORTED_REFRIGERANTS],
    blockers: mode === 'none'
      ? ['No validated thermophysical-property provider is configured. Internal tables remain preliminary and review-required.']
      : blockers,
    policy: 'This registry does not issue thermophysical values or make network requests. A validated provider adapter, source revision, applicability check, manufacturer map and engineering approval remain required for final selection.'
  };
}

function validatePropertyRequest(request = {}) {
  const refrigerant = normalizeRefrigerant(request.refrigerant);
  const state = request.state || {};
  const outputs = Array.isArray(request.outputs) ? request.outputs : [];
  const referenceState = String(request.referenceState || 'IIR').trim().toUpperCase();
  const issues = [];

  if (!SUPPORTED_REFRIGERANTS.includes(refrigerant)) issues.push(`Unsupported refrigerant: ${refrigerant || 'blank'}.`);
  const inputEntries = Object.entries(state).filter(([key]) => ALLOWED_STATE_KEYS.includes(key));
  if (inputEntries.length !== 2) issues.push('Exactly two supported independent state inputs are required.');
  inputEntries.forEach(([key, value]) => {
    const valueSI = typeof value === 'object' && value !== null ? value.valueSI : value;
    if (!isFiniteNumber(valueSI)) issues.push(`State input ${key} must be finite and expressed in SI units.`);
  });
  const qualityValue = typeof state.Q === 'object' && state.Q !== null ? state.Q.valueSI : state.Q;
  if (state.Q !== undefined && (!isFiniteNumber(qualityValue) || Number(qualityValue) < 0 || Number(qualityValue) > 1)) issues.push('Vapour quality Q must be within [0, 1].');
  if (!outputs.length) issues.push('At least one requested output is required.');
  outputs.forEach((output) => { if (!ALLOWED_OUTPUTS.includes(output)) issues.push(`Unsupported requested output: ${output}.`); });
  if (!ALLOWED_REFERENCE_STATES.includes(referenceState)) issues.push(`Unsupported reference state: ${referenceState}.`);

  return {
    valid: issues.length === 0,
    issues,
    normalized: issues.length ? null : { refrigerant, state, outputs: [...outputs], referenceState }
  };
}

module.exports = {
  CONTRACT_VERSION,
  SUPPORTED_REFRIGERANTS,
  getProviderStatus,
  validatePropertyRequest
};
