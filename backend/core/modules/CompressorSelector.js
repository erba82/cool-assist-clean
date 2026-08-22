'use strict';

/**
 * CompressorSelector
 *
 * Produces a traceable compressor-selection dossier.  It deliberately separates
 * a thermophysical *cycle calculation* from a manufacturer compressor
 * *performance-map selection*.  A valid cycle may size a design duty, but it
 * never proves a compressor model, motor rating, COP or redundancy train.
 */

const path = require('path');
const { CoolPropSidecarClient } = require('../engineering/CoolPropSidecarClient');
const { getRefrigerantProfile, normalizeRefrigerant } = require('../data/RefrigerantProfiles');
const { assessCatalogueEvidence } = require('../engineering/ManufacturerEvidenceContract');

const compressorCatalogue = require(path.resolve(__dirname, '../../../frontend/src/catalogue/catalogueCompressorModels.json'));

const finite = (value) => Number.isFinite(Number(value));
const rounded = (value, digits = 2) => finite(value) ? Math.round(Number(value) * (10 ** digits)) / (10 ** digits) : null;
const record = (value) => value && typeof value === 'object' && !Array.isArray(value) ? value : {};

class CompressorSelector {
  constructor(engine, { sidecarClient = null } = {}) {
    this.engine = engine;
    this.sidecar = sidecarClient || new CoolPropSidecarClient();
  }

  async select(tempLevel, project = {}) {
    const refrigerant = normalizeRefrigerant(project.refrigerant || 'R717');
    const profile = getRefrigerantProfile(refrigerant);
    const evaporatingTempC = Number(tempLevel?.evaporatingTemp);
    const undiscountedLoadKw = Number(tempLevel?.totalLoad);
    const designBasis = record(project.designBasis);
    const issues = [];
    const assumptions = [];

    if (!profile) throw new Error(`No refrigerant profile is available for ${refrigerant || project.refrigerant}.`);
    if (!finite(evaporatingTempC)) issues.push('A finite evaporating temperature is required for compressor duty calculation.');
    if (!finite(undiscountedLoadKw) || undiscountedLoadKw <= 0) issues.push('A positive calculated cooling load is required. Storage capacity is not a compressor design load.');

    const diversity = this._resolveDiversityFactor(tempLevel, designBasis, assumptions);
    const designLoadKw = issues.length ? null : rounded(undiscountedLoadKw * diversity.value);
    const condensing = this._resolveCondensingTemperature(project, designBasis, assumptions);
    const cycleInputs = this._resolveCycleInputs(designBasis, assumptions);
    const requestedModelKey = String(project?.designIntent?.compressorModelId || project?.designIntent?.compressorModel || '').trim();
    const requestedFamily = String(project?.semanticCycle?.compressorFamily || project?.designIntent?.compressorType || profile?.compressor?.family || '').toLowerCase();
    const candidates = this._catalogueCandidates({ refrigerant, requestedFamily });
    const requestedModel = requestedModelKey ? candidates.find((candidate) => candidate.id === requestedModelKey || candidate.model === requestedModelKey) : null;

    if (requestedModelKey && !requestedModel) issues.push(`Requested compressor model '${requestedModelKey}' is absent from the compatible catalogue.`);

    let cycle = null;
    if (!issues.length && finite(condensing.valueC)) {
      cycle = await this._calculateCycle({
        refrigerant,
        evaporatingTempC,
        condensingTempC: condensing.valueC,
        loadKw: designLoadKw,
        ...cycleInputs.values
      });
      if (cycle.status !== 'ok') issues.push(cycle.issue);
    } else if (!finite(condensing.valueC)) {
      issues.push('A condensing temperature or an approved climate/approach design basis is required.');
    }

    const modelEvidence = requestedModel ? assessCatalogueEvidence(requestedModel, { category: 'compressor', selectedRefrigerant: refrigerant }) : null;
    const mapStatus = requestedModel
      ? 'manufacturer-map-required'
      : 'manufacturer-model-and-map-required';
    const selectionStatus = cycle?.status === 'ok' && requestedModel ? mapStatus : 'inputs-required';

    return {
      category: 'compressor',
      selectionStatus,
      finalSelectionAllowed: false,
      selectionPolicy: 'A thermophysical cycle is not a manufacturer compressor performance map. Final issue, procurement and construction remain blocked until a compatible manufacturer map, revision, motor data and human engineering review are recorded.',
      configuration: this._configurationFor(profile, evaporatingTempC),
      refrigerant,
      temperatureLevel: tempLevel?.temperatureLevel || `T${evaporatingTempC}`,
      designDuty: {
        coolingLoadKw: designLoadKw,
        undiscountedCoolingLoadKw: rounded(undiscountedLoadKw),
        diversityFactor: diversity.value,
        diversitySource: diversity.source,
        evaporatingTemperatureC: rounded(evaporatingTempC),
        condensingTemperatureC: condensing.valueC,
        condensingTemperatureSource: condensing.source
      },
      operatingPoint: {
        refrigerant,
        evapTempC: rounded(evaporatingTempC),
        condTempC: condensing.valueC,
        superheatK: cycleInputs.values.superheatK,
        subcoolK: cycleInputs.values.subcoolK,
        compressorIsentropicEfficiency: cycleInputs.values.compressorIsentropicEfficiency,
        status: cycle?.status === 'ok' ? 'thermophysical-preliminary' : 'input-or-provider-required'
      },
      thermophysicalCycle: cycle,
      manufacturerSelection: {
        selectedModel: requestedModel ? this._catalogueIdentity(requestedModel) : null,
        compatibleCatalogueCandidates: candidates.map((candidate) => this._catalogueIdentity(candidate)),
        modelEvidence: modelEvidence ? {
          candidateStatus: modelEvidence.candidateStatus,
          finalSelectionAllowed: false,
          issues: modelEvidence.validation.issues,
          warnings: modelEvidence.validation.warnings,
          draft: modelEvidence.draft
        } : null,
        performanceMapStatus: mapStatus,
        reason: requestedModel
          ? 'The catalogue record identifies a compatible compressor family, but no map at the calculated operating point is loaded.'
          : 'No explicit manufacturer model was requested or selected. The application may present compatible catalogue candidates only.'
      },
      train: {
        dutyCount: null,
        standbyCount: null,
        totalCount: null,
        redundancyPolicy: project?.designIntent?.redundancyPolicy || 'approval-required',
        controlStrategy: project?.designIntent?.compressorControlStrategy || 'approval-required',
        status: 'manufacturer-map-required',
        reason: 'Duty and standby counts require individual map capacity at the declared evaporating/condensing temperatures and the approved control philosophy.'
      },
      // Compatibility aliases are deliberately null: legacy presentation code must
      // not turn a missing map into a plausible unit capacity or motor rating.
      manufacturer: requestedModel?.manufacturer || null,
      brand: requestedModel?.manufacturer || null,
      model: requestedModel?.model || null,
      manufacturerModelKey: requestedModel?.id || null,
      capacityPerUnit: null,
      motorPower: null,
      electricalPower: cycle?.performance?.compressorPowerKw ?? null,
      electrical: {
        ratedPower: null,
        totalThermodynamicCompressorPowerKw: cycle?.performance?.compressorPowerKw ?? null,
        status: cycle?.status === 'ok' ? 'cycle-only-not-motor-rating' : 'unavailable'
      },
      cop: cycle?.performance?.cop ?? null,
      heatRejection: cycle?.performance?.heatRejectionKw ?? null,
      massFlowRate: cycle?.performance?.massFlowKgPerS ?? null,
      price: null,
      currency: null,
      pricingStatus: 'supplier-quotation-required',
      tag: `COMP-${this._temperatureLevelTag(tempLevel?.temperatureLevel ?? evaporatingTempC)}`,
      assumptions,
      issues,
      blockingReasons: [
        ...(cycle?.status === 'ok' ? [] : ['Validated thermophysical cycle result is unavailable.']),
        'Manufacturer performance map at operating point is required.',
        'Manufacturer motor rating and operating envelope are required.',
        'Human engineering review is required before final selection.'
      ]
    };
  }

  _temperatureLevelTag(value) {
    const numeric = Number(value);
    if (Number.isFinite(numeric)) return `${numeric < 0 ? 'M' : 'P'}${Math.abs(Math.round(numeric))}`;
    const normalized = String(value || 'UNSPECIFIED').replace(/[^0-9A-Za-z]+/g, '-').replace(/^-+|-+$/g, '');
    return normalized || 'UNSPECIFIED';
  }

  _configurationFor(profile, evaporatingTempC) {
    const configured = String(profile?.cycle || 'design-specific');
    if (!finite(evaporatingTempC)) return { name: configured, status: 'input-required' };
    return {
      name: configured,
      status: 'semantic-profile',
      compressorFamily: profile?.compressor?.family || 'manufacturer-model-required',
      note: 'The refrigerant profile determines cycle semantics. It does not certify a compressor model or performance point.'
    };
  }

  _resolveDiversityFactor(tempLevel, designBasis, assumptions) {
    const declared = Number(designBasis?.diversityFactor ?? tempLevel?.diversityFactor);
    if (finite(declared) && declared > 0 && declared <= 1) return { value: declared, source: 'user-declared' };
    assumptions.push({ field: 'diversityFactor', proposedValue: 1, unit: '-', status: 'assumption-proposed', rationale: 'No approved diversity factor was supplied; no coincident-load reduction is applied.' });
    return { value: 1, source: 'assumption-proposed-not-approved' };
  }

  _resolveCondensingTemperature(project, designBasis, assumptions) {
    const declared = Number(project?.operatingConditions?.condensingTemperatureC ?? designBasis?.condensingTemperatureC);
    if (finite(declared)) return { valueC: declared, source: 'user-declared' };
    const ambient = Number(project?.climate?.summerWB ?? project?.climate?.summerDB);
    const approach = Number(designBasis?.condenserApproachK);
    if (finite(ambient) && finite(approach) && approach > 0) return { valueC: rounded(ambient + approach), source: 'approved-climate-plus-user-approach' };
    assumptions.push({ field: 'condensingTemperatureC', proposedValue: null, unit: '°C', status: 'input-required', rationale: 'No declared condensing temperature or approved climate-plus-approach basis is available.' });
    return { valueC: null, source: 'input-required' };
  }

  _resolveCycleInputs(designBasis, assumptions) {
    const resolve = (field, defaultValue, unit, rationale) => {
      const value = Number(designBasis?.[field]);
      if (finite(value) && value >= 0) return value;
      assumptions.push({ field, proposedValue: defaultValue, unit, status: 'assumption-proposed', rationale });
      return defaultValue;
    };
    return {
      values: {
        superheatK: resolve('superheatK', 8, 'K', 'Required by the preliminary CoolProp simple-cycle calculation.'),
        subcoolK: resolve('subcoolK', 4, 'K', 'Required by the preliminary CoolProp simple-cycle calculation.'),
        compressorIsentropicEfficiency: resolve('compressorIsentropicEfficiency', 0.70, '-', 'A preliminary cycle assumption; it is not a manufacturer compressor efficiency.')
      }
    };
  }

  _catalogueCandidates({ refrigerant, requestedFamily }) {
    const normalizedFamily = String(requestedFamily || '').toLowerCase();
    return (compressorCatalogue.models || []).filter((candidate) => {
      const refrigerants = Array.isArray(candidate.refrigerants) ? candidate.refrigerants.map(normalizeRefrigerant) : [];
      const familyText = `${candidate.compressorType || ''} ${candidate.family || ''}`.toLowerCase();
      const matchesFamily = !normalizedFamily || !/screw|recip|piston|scroll/.test(normalizedFamily) || familyText.includes(normalizedFamily.replace('piston', 'recip')) || (normalizedFamily === 'screw' && familyText.includes('screw'));
      return refrigerants.includes(refrigerant) && matchesFamily;
    });
  }

  _catalogueIdentity(candidate) {
    return {
      id: candidate.id,
      manufacturer: candidate.manufacturer,
      family: candidate.family,
      model: candidate.model,
      compressorType: candidate.compressorType,
      refrigerants: candidate.refrigerants,
      dimensionsMm: candidate.dimensionsMm,
      sourceRefs: candidate.sourceRefs || [],
      performanceMapStatus: 'manufacturer-map-required'
    };
  }

  async _calculateCycle({ refrigerant, evaporatingTempC, condensingTempC, loadKw, superheatK, subcoolK, compressorIsentropicEfficiency }) {
    try {
      const response = await this.sidecar.calculateSimpleVaporCompressionCycle({
        refrigerant,
        evapTempK: evaporatingTempC + 273.15,
        condTempK: condensingTempC + 273.15,
        superheatK,
        subcoolK,
        compressorIsentropicEfficiency,
        loadW: loadKw * 1000
      });
      const performance = record(response.performanceSI);
      if (!finite(performance.coolingLoadW) || !finite(performance.compressorPowerW) || !finite(performance.heatRejectionW) || !finite(performance.cop)) {
        throw new Error('CoolProp cycle response omitted finite required performance fields.');
      }
      return {
        status: 'ok',
        scope: 'thermophysical-preliminary-cycle-only',
        performance: {
          coolingLoadKw: rounded(performance.coolingLoadW / 1000),
          compressorPowerKw: rounded(performance.compressorPowerW / 1000),
          heatRejectionKw: rounded(performance.heatRejectionW / 1000),
          massFlowKgPerS: rounded(performance.massFlowKgPerS, 4),
          cop: rounded(performance.cop, 3)
        },
        provenance: response.provenance,
        limitations: response.limitations || ['Manufacturer compressor maps, motor rating, operating envelope and controls remain review-required.']
      };
    } catch (error) {
      return {
        status: 'provider-unavailable',
        scope: 'no-fallback-no-invented-cycle',
        issue: `Validated CoolProp cycle calculation is unavailable: ${error.message}`,
        performance: null,
        provenance: null
      };
    }
  }
}

module.exports = CompressorSelector;
