'use strict';

const { CoolPropSidecarClient } = require('./CoolPropSidecarClient');

const CONTRACT_VERSION = '1.0.0';
const DEFAULT_INTERVAL_MS = 30_000;
const DEFAULT_STALE_AFTER_MS = 90_000;

function positiveFiniteInteger(value, fallback) {
  const candidate = Number(value);
  return Number.isInteger(candidate) && candidate > 0 ? candidate : fallback;
}

function isoAt(epochMs) {
  return new Date(epochMs).toISOString();
}

function unavailableSnapshot({ observedAt, error, previousHealthyAt = null }) {
  return {
    status: 'unavailable',
    observedAt: isoAt(observedAt),
    previousHealthyAt,
    provider: null,
    error: String(error?.message || error || 'Sidecar health check failed.'),
    finalSelectionAllowed: false,
    propertyDependentCandidateAllowed: false,
    selectionGate: {
      status: 'blocked',
      blockers: [
        'Validated thermophysical-property sidecar is unavailable.',
        'Property-dependent candidate selection is blocked until a fresh healthy sidecar check succeeds.',
        'Final equipment selection remains prohibited pending manufacturer evidence and independent engineering approval.'
      ]
    }
  };
}

/**
 * Local runtime governor for the loopback-only CoolProp sidecar.
 *
 * It never launches arbitrary processes, retries property calculations silently, or
 * approves final equipment selection. A failed or stale health observation blocks
 * any path that wants to rely on provider-derived property results. The process
 * operator remains responsible for restarting the sidecar with the reviewed local
 * script and recording any runtime/version change before engineering review.
 *
 * Manual restart runbook:
 *  1. Stop the failed local sidecar process only after preserving diagnostic output.
 *  2. From the repository root, run backend\\thermophysical-sidecar\\start-sidecar.ps1.
 *  3. Verify GET http://127.0.0.1:5011/health returns providerId=coolprop,
 *     a non-empty providerVersion, outboundRequests=false, and all required fluids.
 *  4. Re-run the governed comparison/regression tests; do not promote cached
 *     provider values from the prior process into a new selection decision.
 *  5. Record the provider version/revision and obtain the required engineering review.
 */
class SidecarHealthGovernor {
  constructor({
    env = process.env,
    client = null,
    intervalMs = null,
    staleAfterMs = null,
    now = () => Date.now(),
    setIntervalFn = setInterval,
    clearIntervalFn = clearInterval
  } = {}) {
    this.env = env;
    this.client = client || new CoolPropSidecarClient({ env });
    this.intervalMs = positiveFiniteInteger(intervalMs || env.THERMOPHYSICAL_PROVIDER_HEALTH_INTERVAL_MS, DEFAULT_INTERVAL_MS);
    this.staleAfterMs = positiveFiniteInteger(staleAfterMs || env.THERMOPHYSICAL_PROVIDER_HEALTH_STALE_AFTER_MS, DEFAULT_STALE_AFTER_MS);
    this.now = now;
    this.setIntervalFn = setIntervalFn;
    this.clearIntervalFn = clearIntervalFn;
    this.timer = null;
    this.inFlight = null;
    this.lastObservation = null;
  }

  get monitoring() {
    return Boolean(this.timer);
  }

  _validateHealthPayload(health) {
    if (!health || health.status !== 'healthy' || health.providerId !== 'coolprop') {
      throw new Error('Sidecar health contract does not identify a healthy CoolProp provider.');
    }
    if (typeof health.providerVersion !== 'string' || !health.providerVersion.trim()) {
      throw new Error('Sidecar health contract lacks providerVersion.');
    }
    if (health.outboundRequests !== false) {
      throw new Error('Sidecar health contract must declare outboundRequests=false.');
    }
    if (!health.fluidMappings || typeof health.fluidMappings !== 'object') {
      throw new Error('Sidecar health contract lacks fluid mappings.');
    }
    const unavailableFluid = Object.entries(health.fluidMappings).find(([, mapping]) => mapping?.available !== true);
    if (unavailableFluid) {
      throw new Error(`Sidecar reports unavailable fluid mapping: ${unavailableFluid[0]}.`);
    }
    return health;
  }

  _healthySnapshot(health, observedAt) {
    const provider = {
      providerId: health.providerId,
      providerVersion: health.providerVersion,
      providerGitRevision: health.providerGitRevision || null,
      backend: health.backend || null,
      referenceState: health.referenceState || null,
      fluidCount: Object.keys(health.fluidMappings).length
    };
    return {
      status: 'healthy',
      observedAt: isoAt(observedAt),
      previousHealthyAt: isoAt(observedAt),
      provider,
      error: null,
      finalSelectionAllowed: false,
      propertyDependentCandidateAllowed: true,
      selectionGate: {
        status: 'review-required',
        blockers: [
          'A healthy sidecar only permits review-gated property-dependent candidate work.',
          'Final equipment selection remains prohibited pending manufacturer evidence and independent engineering approval.'
        ]
      }
    };
  }

  _isFresh(observation = this.lastObservation, at = this.now()) {
    if (!observation || observation.status !== 'healthy') return false;
    const observedAt = Date.parse(observation.observedAt);
    return Number.isFinite(observedAt) && at - observedAt <= this.staleAfterMs;
  }

  _snapshot(at = this.now()) {
    const fresh = this._isFresh(this.lastObservation, at);
    const base = this.lastObservation || {
      status: 'not-checked',
      observedAt: null,
      previousHealthyAt: null,
      provider: null,
      error: null,
      finalSelectionAllowed: false,
      propertyDependentCandidateAllowed: false,
      selectionGate: {
        status: 'blocked',
        blockers: ['No sidecar health observation has been recorded.']
      }
    };
    const observedAtEpoch = base.observedAt ? Date.parse(base.observedAt) : null;
    const stale = base.status === 'healthy' && !fresh;
    const health = stale
      ? {
        ...base,
        status: 'stale',
        error: `Last healthy sidecar observation exceeds ${this.staleAfterMs} ms.`,
        propertyDependentCandidateAllowed: false,
        finalSelectionAllowed: false,
        selectionGate: {
          status: 'blocked',
          blockers: [
            `Last healthy sidecar observation is stale after ${this.staleAfterMs} ms.`,
            'Property-dependent candidate selection is blocked until a fresh health check succeeds.',
            'Final equipment selection remains prohibited pending manufacturer evidence and independent engineering approval.'
          ]
        }
      }
      : base;
    return {
      contractVersion: CONTRACT_VERSION,
      policy: 'Fail closed: unavailable or stale sidecar health blocks property-dependent candidate selection. A healthy sidecar never authorizes final equipment selection.',
      monitoring: {
        active: this.monitoring,
        intervalMs: this.intervalMs,
        staleAfterMs: this.staleAfterMs
      },
      health,
      restartRunbook: {
        automaticRestartAllowed: false,
        location: 'backend/thermophysical-sidecar/start-sidecar.ps1',
        requiredVerification: ['loopback health endpoint', 'provider version/revision record', 'governed regression test', 'engineering review']
      },
      observedAtEpoch
    };
  }

  async checkNow() {
    if (this.inFlight) return this.inFlight;
    this.inFlight = (async () => {
      const observedAt = this.now();
      const previousHealthyAt = this.lastObservation?.status === 'healthy'
        ? this.lastObservation.observedAt
        : this.lastObservation?.previousHealthyAt || null;
      try {
        const health = this._validateHealthPayload(await this.client.healthCheck());
        this.lastObservation = this._healthySnapshot(health, observedAt);
      } catch (error) {
        this.lastObservation = unavailableSnapshot({ observedAt, error, previousHealthyAt });
      } finally {
        this.inFlight = null;
      }
      return this._snapshot(observedAt);
    })();
    return this.inFlight;
  }

  async requirePropertyDependentCandidate() {
    const status = await this.checkNow();
    if (status.health.status !== 'healthy' || !status.health.propertyDependentCandidateAllowed) {
      throw new Error(status.health.selectionGate.blockers.join(' '));
    }
    return status;
  }

  startMonitoring() {
    if (this.timer) return this._snapshot();
    this.timer = this.setIntervalFn(() => {
      this.checkNow().catch(() => undefined);
    }, this.intervalMs);
    if (typeof this.timer?.unref === 'function') this.timer.unref();
    return this._snapshot();
  }

  stopMonitoring() {
    if (this.timer) this.clearIntervalFn(this.timer);
    this.timer = null;
    return this._snapshot();
  }

  getStatus() {
    return this._snapshot();
  }
}

module.exports = {
  CONTRACT_VERSION,
  DEFAULT_INTERVAL_MS,
  DEFAULT_STALE_AFTER_MS,
  SidecarHealthGovernor
};
