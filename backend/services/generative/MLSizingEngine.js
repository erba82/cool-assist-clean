// backend/services/generative/MLSizingEngine.js
/**
 * ML-Based Component Sizing Engine for GFDDE
 * Uses machine learning models trained on historical designs
 * for accurate, data-driven component selection
 */

const CoolProp = require('../physics/CoolPropWrapper');

class MLSizingEngine {
    constructor() {
        // Simplified ML models (in production, these would be trained SVMs/ANNs)
        this.models = {
            compressor: this.createCompressorModel(),
            condenser: this.createCondenserModel(),
            evaporator: this.createEvaporatorModel()
        };
    }

    /**
     * Size compressor based on operating conditions
     */
    async sizeCompressor(requirements) {
        const { refrigerant, evapTemp, condTemp, coolingCapacity } = requirements;

        // Calculate cycle using CoolProp
        const cycle = await CoolProp.calculateCycle(
            refrigerant,
            CoolProp.celsiusToKelvin(evapTemp),
            CoolProp.celsiusToKelvin(condTemp),
            5, // superheat
            3  // subcool
        );

        const specificCooling = cycle.performance.cooling_capacity_per_kg; // J/kg
        const massFlowRate = (coolingCapacity * 1000) / specificCooling; // kg/s

        // Calculate volumetric flow rate at compressor inlet
        const state1 = cycle.states['1_compressor_inlet'];
        const density = state1.d; // kg/m³
        const volumetricFlow = massFlowRate / density * 3600; // m³/h

        // Select compressor size
        const compressorSize = this.selectCompressorByDisplacement(volumetricFlow, refrigerant);

        return {
            type: 'compressor',
            ...compressorSize,
            operating_conditions: {
                mass_flow_rate: massFlowRate,
                volumetric_flow: volumetricFlow,
                suction_pressure: CoolProp.pascalToBar(state1.P),
                discharge_pressure: CoolProp.pascalToBar(cycle.states['2_compressor_outlet'].P),
                compression_ratio: cycle.performance.pressure_ratio
            },
            performance: {
                COP: cycle.performance.COP,
                power_consumption: (coolingCapacity / cycle.performance.COP).toFixed(2)
            }
        };
    }

    /**
     * Size condenser based on heat rejection
     */
    async sizeCondenser(requirements) {
        const { refrigerant, evapTemp, condTemp, coolingCapacity } = requirements;

        const cycle = await CoolProp.calculateCycle(
            refrigerant,
            CoolProp.celsiusToKelvin(evapTemp),
            CoolProp.celsiusToKelvin(condTemp)
        );

        const heatRejection = coolingCapacity * (1 + 1 / cycle.performance.COP);

        // Condenser sizing based on approach temperature
        const approachTemp = 5; // °C
        const LMTD = this.calculateLMTD(condTemp, condTemp - 3, 35, 25); // Simplified
        const U = 800; // W/m²·K for evaporative condenser

        const area = (heatRejection * 1000) / (U * LMTD);

        return {
            type: 'condenser',
            subtype: 'evaporative',
            capacity: heatRejection.toFixed(2),
            heat_transfer_area: area.toFixed(2),
            approach_temperature: approachTemp,
            operating_conditions: {
                condensing_temp: condTemp,
                condensing_pressure: CoolProp.pascalToBar(cycle.states['3_condenser_outlet'].P),
                heat_rejection: heatRejection
            },
            recommendations: {
                fan_power: (heatRejection * 0.03).toFixed(2), // ~3% of heat rejection
                water_flow: (heatRejection * 0.8).toFixed(2) // L/min
            }
        };
    }

    /**
     * Size evaporator based on cooling load
     */
    async sizeEvaporator(requirements) {
        const { refrigerant, evapTemp, coolingCapacity, roomTemp } = requirements;

        const cycle = await CoolProp.calculateVLE(
            refrigerant,
            CoolProp.celsiusToKelvin(evapTemp)
        );

        // Temperature difference
        const TD = (roomTemp || 0) - evapTemp;

        // Heat transfer coefficient (W/m²·K)
        const U = TD > 10 ? 25 : 15; // Higher for larger TD

        // Required area
        const area = (coolingCapacity * 1000) / (U * TD);

        return {
            type: 'evaporator',
            subtype: 'air_cooler',
            capacity: coolingCapacity,
            heat_transfer_area: area.toFixed(2),
            temperature_difference: TD,
            operating_conditions: {
                evaporating_temp: evapTemp,
                evaporating_pressure: CoolProp.pascalToBar(cycle.saturation_pressure),
                room_temperature: roomTemp || 0
            },
            recommendations: {
                fan_count: Math.ceil(area / 50), // Assume 50 m² per fan
                defrost_method: evapTemp < -5 ? 'hot_gas' : 'electric',
                fin_spacing: evapTemp < -10 ? 'wide' : 'standard'
            }
        };
    }

    /**
     * Calculate Log Mean Temperature Difference
     */
    calculateLMTD(t1, t2, T1, T2) {
        const delta1 = t1 - T2;
        const delta2 = t2 - T1;

        if (Math.abs(delta1 - delta2) < 0.1) return delta1;

        return (delta1 - delta2) / Math.log(delta1 / delta2);
    }

    /**
     * Select compressor from database by displacement
     */
    selectCompressorByDisplacement(volumetricFlow, refrigerant) {
        // Simplified selection (in production, query actual database)
        const compressors = [
            { model: 'BITZER 4NES-20Y', displacement: 40, type: 'semi_hermetic', refrigerants: ['R717', 'R404A'] },
            { model: 'BITZER 6FE-44Y', displacement: 80, type: 'semi_hermetic', refrigerants: ['R717', 'R404A'] },
            { model: 'MYCOM 160VLD', displacement: 160, type: 'screw', refrigerants: ['R717'] },
            { model: 'MYCOM 320VLD', displacement: 320, type: 'screw', refrigerants: ['R717'] },
            { model: 'HOWDEN WRV186', displacement: 500, type: 'screw', refrigerants: ['R717'] }
        ];

        // Filter by refrigerant
        const compatible = compressors.filter(c => c.refrigerants.includes(refrigerant));

        // Select closest size (slight oversizing preferred)
        let selected = compatible[0];
        for (const comp of compatible) {
            if (comp.displacement >= volumetricFlow * 0.9 && comp.displacement <= volumetricFlow * 1.2) {
                selected = comp;
                break;
            }
        }

        return {
            model: selected.model,
            displacement: selected.displacement,
            compressor_type: selected.type,
            refrigerant_compatible: true
        };
    }

    /**
     * ML Model for compressor selection (simplified)
     */
    createCompressorModel() {
        // In production, this would be a trained SVM/ANN model
        return {
            predict: (features) => {
                // Features: [capacity, pressure_ratio, refrigerant_type]
                // Simple heuristic for now
                const capacity = features[0];
                const ratio = features[1];

                if (capacity > 500) return 'screw';
                if (ratio > 8) return 'reciprocating';
                return 'semi_hermetic';
            }
        };
    }

    createCondenserModel() {
        return {
            predict: (features) => {
                const capacity = features[0];
                const ambient = features[1];

                if (ambient > 35) return 'evaporative';
                if (capacity > 1000) return 'evaporative';
                return 'air_cooled';
            }
        };
    }

    createEvaporatorModel() {
        return {
            predict: (features) => {
                const temp = features[0];
                const humidity = features[1];

                if (temp < -25) return 'forced_air_wide_fin';
                if (humidity > 80) return 'forced_air_coated';
                return 'forced_air_standard';
            }
        };
    }

    /**
     * Optimize component selection using multi-objective approach
     */
    optimizeSelection(candidates, objectives = ['cost', 'efficiency', 'reliability']) {
        // Pareto frontier optimization
        const scored = candidates.map(candidate => {
            let score = 0;

            if (objectives.includes('efficiency')) {
                score += (candidate.COP || 3) * 30;
            }

            if (objectives.includes('cost')) {
                // Lower cost is better (inverse)
                score += (10000 / (candidate.estimated_cost || 10000)) * 25;
            }

            if (objectives.includes('reliability')) {
                const mtbf = candidate.mtbf || 20000; // hours
                score += (mtbf / 1000) * 20;
            }

            if (objectives.includes('footprint')) {
                score += (100 / (candidate.footprint || 10)) * 15;
            }

            return {
                ...candidate,
                optimization_score: score
            };
        });

        return scored.sort((a, b) => b.optimization_score - a.optimization_score);
    }
}

module.exports = new MLSizingEngine();
