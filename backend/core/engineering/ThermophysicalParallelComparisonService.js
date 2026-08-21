'use strict';

const RefrigerationEngine = require('../RefrigerationEngine');
const ThermodynamicCycleAnalyzer = require('../modules/ThermodynamicCycleAnalyzer');
const { normalizeRefrigerant } = require('../data/RefrigerantProfiles');
const { CoolPropSidecarClient } = require('./CoolPropSidecarClient');

const round = (value, digits = 6) => Number.isFinite(value) ? Number(value.toFixed(digits)) : null;
const percentDifference = (reference, candidate) => {
  if (!Number.isFinite(reference) || reference === 0 || !Number.isFinite(candidate)) return null;
  return round(((candidate - reference) / reference) * 100, 4);
};

class ThermophysicalParallelComparisonService {
  constructor({ env = process.env, engine = null, client = null } = {}) {
    this.engine = engine || new RefrigerationEngine();
    this.legacyAnalyzer = new ThermodynamicCycleAnalyzer(this.engine);
    this.client = client || new CoolPropSidecarClient({ env });
  }

  _legacyCycle({ refrigerant, evapTempK, condTempK, superheatK, subcoolK, loadW }) {
    const code = normalizeRefrigerant(refrigerant);
    const table = this.engine.getData('refrigerants')?.[code]?.properties;
    if (!table || !Object.keys(table).length) {
      return {
        status: 'not-available-for-this-refrigerant',
        reason: 'Legacy analyzer has no internal property table for this refrigerant; no cross-fluid fallback is permitted.',
        reviewRequired: true
      };
    }

    try {
      const analysis = this.legacyAnalyzer.analyzeCycle({
        refrigerant: code,
        evapTemp: evapTempK - 273.15,
        condTemp: condTempK - 273.15,
        superheat: superheatK,
        subcool: subcoolK,
        coolingLoad: loadW / 1000
      });
      return {
        status: 'preliminary-internal-table',
        reviewRequired: true,
        assumptions: [
          'Internal saturation-table interpolation only.',
          'Legacy superheat, discharge-temperature, subcooling and entropy adjustments are approximations.',
          'Not suitable as validated manufacturer selection evidence.'
        ],
        performanceSI: {
          cop: analysis.performance.cop,
          massFlowKgPerS: analysis.performance.massFlowRate,
          compressorPowerW: analysis.performance.compressorWork * 1000,
          heatRejectionW: analysis.performance.heatRejection * 1000,
          pressureRatio: analysis.cyclePoints.point2.pressure / analysis.cyclePoints.point1.pressure
        },
        pressuresSI: {
          evaporatingPressurePa: analysis.cyclePoints.point1.pressure * 100000,
          condensingPressurePa: analysis.cyclePoints.point2.pressure * 100000
        },
        raw: analysis
      };
    } catch (error) {
      return {
        status: 'legacy-calculation-failed',
        reason: error.message,
        reviewRequired: true
      };
    }
  }

  async compareSimpleVaporCompression({ refrigerant, evapTempK, condTempK, superheatK = 8, subcoolK = 4, compressorIsentropicEfficiency = 0.75, loadW }) {
    const code = normalizeRefrigerant(refrigerant);
    const legacy = this._legacyCycle({ refrigerant: code, evapTempK, condTempK, superheatK, subcoolK, loadW });
    const coolProp = await this.client.calculateSimpleVaporCompressionCycle({
      refrigerant: code,
      evapTempK,
      condTempK,
      superheatK,
      subcoolK,
      compressorIsentropicEfficiency,
      loadW
    });

    const provider = coolProp.performanceSI;
    const comparison = legacy.status === 'preliminary-internal-table'
      ? {
          comparable: true,
          deltasPercent: {
            cop: percentDifference(legacy.performanceSI.cop, provider.cop),
            massFlowKgPerS: percentDifference(legacy.performanceSI.massFlowKgPerS, provider.massFlowKgPerS),
            compressorPowerW: percentDifference(legacy.performanceSI.compressorPowerW, provider.compressorPowerW),
            heatRejectionW: percentDifference(legacy.performanceSI.heatRejectionW, provider.heatRejectionW),
            evaporatingPressurePa: percentDifference(legacy.pressuresSI.evaporatingPressurePa, coolProp.cycle.point1.P),
            condensingPressurePa: percentDifference(legacy.pressuresSI.condensingPressurePa, coolProp.cycle.point2.P)
          },
          note: 'Differences identify legacy-model limitations; they do not validate the CoolProp model against a manufacturer map or project data.'
        }
      : {
          comparable: false,
          note: 'No same-refrigerant legacy table exists. Cross-fluid comparison is prohibited.'
        };

    return {
      status: 'parallel-comparison-review-required',
      refrigerant: code,
      inputSI: { evapTempK, condTempK, superheatK, subcoolK, compressorIsentropicEfficiency, loadW },
      legacy,
      coolProp: {
        status: coolProp.status,
        reviewRequired: true,
        performanceSI: provider,
        cycle: coolProp.cycle,
        provenance: coolProp.provenance,
        warnings: coolProp.warnings
      },
      comparison,
      finalSelectionAllowed: false,
      policy: 'Parallel comparison does not replace manufacturer performance maps, equipment envelopes or engineering review.'
    };
  }
}

module.exports = ThermophysicalParallelComparisonService;
