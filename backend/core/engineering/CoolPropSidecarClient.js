'use strict';

const axios = require('axios');
const {
  getProviderStatus,
  validatePropertyRequest
} = require('./ThermophysicalProviderRegistry');

const LOOPBACK_HOSTS = new Set(['127.0.0.1', 'localhost', '::1']);

function isFiniteRecord(values) {
  return values && Object.values(values).every((value) => Number.isFinite(value));
}

function isLoopbackUrl(url) {
  try {
    return LOOPBACK_HOSTS.has(new URL(url).hostname);
  } catch (_error) {
    return false;
  }
}

class CoolPropSidecarClient {
  constructor({ env = process.env, httpClient = null } = {}) {
    this.env = env;
    this.baseUrl = String(env.THERMOPHYSICAL_PROVIDER_URL || '').trim().replace(/\/$/, '');
    this.timeoutMs = Number(env.THERMOPHYSICAL_PROVIDER_TIMEOUT_MS || 3000);
    this.httpClient = httpClient || axios.create({
      baseURL: this.baseUrl,
      timeout: Number.isFinite(this.timeoutMs) && this.timeoutMs > 0 ? this.timeoutMs : 3000,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  get status() {
    return getProviderStatus(this.env);
  }

  _assertCallable() {
    const provider = this.status;
    if (provider.activeProvider?.providerId !== 'coolprop') {
      throw new Error('CoolProp sidecar is not explicitly configured.');
    }
    if (!provider.outboundCallsEnabled) {
      throw new Error('CoolProp sidecar calls are disabled by policy.');
    }
    if (!this.baseUrl || !isLoopbackUrl(this.baseUrl)) {
      throw new Error('CoolProp sidecar URL must be an explicit loopback URL.');
    }
    if (provider.blockers.length) {
      throw new Error(`CoolProp sidecar is not callable: ${provider.blockers.join(' ')}`);
    }
    return provider;
  }

  _validateProviderPayload(payload, requestedOutputs) {
    if (!payload || payload.status !== 'ok' || !isFiniteRecord(payload.valuesSI)) {
      throw new Error('CoolProp sidecar returned no finite property result.');
    }
    if (requestedOutputs.some((output) => !Object.prototype.hasOwnProperty.call(payload.valuesSI, output))) {
      throw new Error('CoolProp sidecar response omitted a requested output.');
    }
    const provenance = payload.provenance;
    if (!provenance || provenance.providerId !== 'coolprop' || !provenance.providerVersion || !provenance.backend || !provenance.fluidIdentifier || !provenance.referenceState || !provenance.sourceRevision || !provenance.queriedAt) {
      throw new Error('CoolProp sidecar response lacks required provenance.');
    }
    return payload;
  }

  async healthCheck() {
    this._assertCallable();
    const { data } = await this.httpClient.get('/health');
    if (!data || data.status !== 'healthy' || data.providerId !== 'coolprop' || data.outboundRequests !== false) {
      throw new Error('CoolProp sidecar health contract failed.');
    }
    return data;
  }

  async getProperties(request) {
    const validation = validatePropertyRequest(request);
    if (!validation.valid) {
      throw new Error(`Invalid canonical property request: ${validation.issues.join(' ')}`);
    }
    this._assertCallable();
    try {
      const { data } = await this.httpClient.post('/v1/properties', validation.normalized);
      return this._validateProviderPayload(data, validation.normalized.outputs);
    } catch (error) {
      const detail = error.response?.data?.error || error.message;
      throw new Error(`CoolProp property request failed: ${detail}`);
    }
  }

  async calculateR744TranscriticalBoosterCycle({ evapTempK, gasCoolerOutletTempK, highSidePressurePa, flashGasPressurePa, superheatK, lowStageIsentropicEfficiency, highStageIsentropicEfficiency, loadW }) {
    this._assertCallable();
    const payload = {
      refrigerant: 'R744',
      evapTempK,
      gasCoolerOutletTempK,
      highSidePressurePa,
      flashGasPressurePa,
      superheatK,
      lowStageIsentropicEfficiency,
      highStageIsentropicEfficiency,
      loadW
    };
    try {
      const { data } = await this.httpClient.post('/v1/cycle/r744-transcritical-booster', payload);
      if (data?.status !== 'ok' || data.architecture !== 'r744-transcritical-booster-preliminary' || !isFiniteRecord(data.performanceSI) || !data.provenance?.providerVersion) {
        throw new Error('CoolProp sidecar returned an invalid R744 transcritical-booster result.');
      }
      return data;
    } catch (error) {
      const detail = error.response?.data?.error || error.message;
      throw new Error(`CoolProp R744 transcritical-booster request failed: ${detail}`);
    }
  }

  async calculateSimpleVaporCompressionCycle({ refrigerant, evapTempK, condTempK, superheatK, subcoolK, compressorIsentropicEfficiency, loadW }) {
    this._assertCallable();
    const payload = {
      refrigerant,
      evapTempK,
      condTempK,
      superheatK,
      subcoolK,
      compressorIsentropicEfficiency,
      loadW
    };
    try {
      const { data } = await this.httpClient.post('/v1/cycle/simple-vapor-compression', payload);
      const performance = data?.performanceSI;
      if (data?.status !== 'ok' || !isFiniteRecord(performance) || !data.provenance?.providerVersion) {
        throw new Error('CoolProp sidecar returned an invalid cycle result.');
      }
      return data;
    } catch (error) {
      const detail = error.response?.data?.error || error.message;
      throw new Error(`CoolProp cycle request failed: ${detail}`);
    }
  }
}

module.exports = { CoolPropSidecarClient, isLoopbackUrl };
