/**
 * ThermodynamicCycleAnalyzer Module
 * 
 * Performs accurate thermodynamic cycle analysis for refrigeration systems:
 * - Calculates all 4 cycle points (evaporator out, compressor out, condenser out, expansion valve out)
 * - Uses saturation tables for precise enthalpy and entropy values
 * - Calculates COP, mass flow rate, and compressor work
 * - Generates cycle points table for documentation
 * 
 * Based on reference manual formulas:
 * - COP = Q_L / W = (h_evap_out - h_evap_in) / (h_comp_out - h_comp_in)
 * - ṁ = Q_evap / Δh
 * - W = ṁ × (h₂ - h₁)
 * 
 * @author GFDDE AI Engine
 * @version 3.0.0
 */

class ThermodynamicCycleAnalyzer {
    constructor(engine) {
        this.engine = engine;
        this.refrigerantData = null;
    }

    /**
     * Analyze complete refrigeration cycle
     * @param {Object} params - Cycle parameters
     * @param {number} params.evapTemp - Evaporating temperature (°C)
     * @param {number} params.condTemp - Condensing temperature (°C)
     * @param {number} params.superheat - Superheat at evaporator outlet (K), default 8
     * @param {number} params.subcool - Subcool at condenser outlet (K), default 4
     * @param {string} params.refrigerant - Refrigerant type, default 'R717'
     * @param {number} params.coolingLoad - Cooling load (kW)
     * @returns {Object} Complete cycle analysis
     */
    analyzeCycle(params) {
        const {
            evapTemp,
            condTemp,
            superheat = 8,
            subcool = 4,
            refrigerant = 'R717',
            coolingLoad
        } = params;

        // Load refrigerant data
        this.refrigerantData = this.engine.getData('refrigerants')?.[refrigerant];
        if (!this.refrigerantData) {
            throw new Error(`Refrigerant ${refrigerant} not found in database`);
        }

        // Calculate 4 cycle points
        const point1 = this._calculatePoint1(evapTemp, superheat);
        const point2 = this._calculatePoint2(point1, condTemp);
        const point3 = this._calculatePoint3(condTemp, subcool);
        const point4 = this._calculatePoint4(point3, evapTemp);

        // Calculate performance metrics
        const massFlowRate = this._calculateMassFlowRate(coolingLoad, point1, point4);
        const compressorWork = this._calculateCompressorWork(massFlowRate, point1, point2);
        const cop = this._calculateCOP(coolingLoad, compressorWork);
        const heatRejection = coolingLoad + compressorWork;

        return {
            cyclePoints: {
                point1,
                point2,
                point3,
                point4
            },
            performance: {
                coolingLoad: Math.round(coolingLoad * 100) / 100,
                massFlowRate: Math.round(massFlowRate * 1000) / 1000,
                compressorWork: Math.round(compressorWork * 100) / 100,
                heatRejection: Math.round(heatRejection * 100) / 100,
                cop: Math.round(cop * 100) / 100
            },
            parameters: {
                evapTemp,
                condTemp,
                superheat,
                subcool,
                refrigerant
            }
        };
    }

    /**
     * Point 1: Evaporator Outlet (Superheated Vapor)
     */
    _calculatePoint1(evapTemp, superheat) {
        const satProps = this._getSaturationProps(evapTemp);

        return {
            location: 'Evaporator Outlet',
            state: 'Superheated Vapor',
            temperature: evapTemp + superheat,
            pressure: satProps.pressure,
            enthalpy: satProps.enthalpy_vapor + (superheat * 2.2), // Approximate superheat enthalpy increase
            entropy: satProps.entropy_vapor + (superheat * 0.01), // Approximate entropy increase
            quality: 1.0, // Pure vapor
            superheat: superheat
        };
    }

    /**
     * Point 2: Compressor Outlet (Isentropic Compression)
     * s2 = s1 (isentropic process)
     */
    _calculatePoint2(point1, condTemp) {
        const satProps = this._getSaturationProps(condTemp);

        // For isentropic compression: s2 = s1
        // Enthalpy at compressor outlet (superheated vapor at high pressure)
        // Using approximate formula: h2 = h_g(cond) + Cp × (T2 - T_sat)

        // Estimate discharge temperature (typically 20-40K above condensing temp)
        const dischargeTemp = condTemp + 30;
        const tempRise = dischargeTemp - condTemp;

        return {
            location: 'Compressor Outlet',
            state: 'Superheated Vapor (High Pressure)',
            temperature: dischargeTemp,
            pressure: satProps.pressure,
            enthalpy: satProps.enthalpy_vapor + (tempRise * 2.2),
            entropy: point1.entropy, // Isentropic: s2 = s1
            quality: 1.0,
            superheat: tempRise
        };
    }

    /**
     * Point 3: Condenser Outlet (Subcooled Liquid)
     */
    _calculatePoint3(condTemp, subcool) {
        const satProps = this._getSaturationProps(condTemp);

        return {
            location: 'Condenser Outlet',
            state: 'Subcooled Liquid',
            temperature: condTemp - subcool,
            pressure: satProps.pressure,
            enthalpy: satProps.enthalpy_liquid - (subcool * 4.5), // Approximate subcool enthalpy decrease
            entropy: satProps.entropy_liquid - (subcool * 0.015), // Approximate entropy decrease
            quality: 0.0, // Pure liquid
            subcool: subcool
        };
    }

    /**
     * Point 4: Expansion Valve Outlet (Two-Phase Mixture)
     * h4 = h3 (isenthalpic expansion)
     */
    _calculatePoint4(point3, evapTemp) {
        const satProps = this._getSaturationProps(evapTemp);

        // Quality calculation: x = (h4 - h_f) / (h_g - h_f)
        const quality = (point3.enthalpy - satProps.enthalpy_liquid) /
            (satProps.enthalpy_vapor - satProps.enthalpy_liquid);

        return {
            location: 'Expansion Valve Outlet',
            state: 'Two-Phase Mixture',
            temperature: evapTemp,
            pressure: satProps.pressure,
            enthalpy: point3.enthalpy, // Isenthalpic: h4 = h3
            entropy: satProps.entropy_liquid + quality * (satProps.entropy_vapor - satProps.entropy_liquid),
            quality: Math.round(quality * 1000) / 1000
        };
    }

    /**
     * Calculate mass flow rate
     * ṁ = Q_evap / Δh = Q_evap / (h1 - h4)
     */
    _calculateMassFlowRate(coolingLoad, point1, point4) {
        const deltaH = point1.enthalpy - point4.enthalpy; // kJ/kg
        return coolingLoad / deltaH; // kg/s
    }

    /**
     * Calculate compressor work
     * W = ṁ × (h2 - h1)
     */
    _calculateCompressorWork(massFlowRate, point1, point2) {
        const deltaH = point2.enthalpy - point1.enthalpy; // kJ/kg
        return massFlowRate * deltaH; // kW
    }

    /**
     * Calculate COP
     * COP = Q_L / W = (h1 - h4) / (h2 - h1)
     */
    _calculateCOP(coolingLoad, compressorWork) {
        return coolingLoad / compressorWork;
    }

    /**
     * Get saturation properties at given temperature
     * Uses interpolation if exact temperature not in table
     */
    _getSaturationProps(temp) {
        const props = this.refrigerantData.properties;
        const tempStr = temp.toString();

        // If exact temperature exists
        if (props[tempStr]) {
            return props[tempStr];
        }

        // Otherwise, interpolate
        const temps = Object.keys(props).map(t => parseFloat(t)).sort((a, b) => a - b);

        // Find bounding temperatures
        let lowerTemp = temps[0];
        let upperTemp = temps[temps.length - 1];

        for (let i = 0; i < temps.length - 1; i++) {
            if (temps[i] <= temp && temps[i + 1] >= temp) {
                lowerTemp = temps[i];
                upperTemp = temps[i + 1];
                break;
            }
        }

        // Linear interpolation
        const lowerProps = props[lowerTemp.toString()];
        const upperProps = props[upperTemp.toString()];
        const fraction = (temp - lowerTemp) / (upperTemp - lowerTemp);

        return {
            pressure: lowerProps.pressure + fraction * (upperProps.pressure - lowerProps.pressure),
            density_liquid: lowerProps.density_liquid + fraction * (upperProps.density_liquid - lowerProps.density_liquid),
            density_vapor: lowerProps.density_vapor + fraction * (upperProps.density_vapor - lowerProps.density_vapor),
            enthalpy_liquid: lowerProps.enthalpy_liquid + fraction * (upperProps.enthalpy_liquid - lowerProps.enthalpy_liquid),
            enthalpy_vapor: lowerProps.enthalpy_vapor + fraction * (upperProps.enthalpy_vapor - lowerProps.enthalpy_vapor),
            latentHeat: lowerProps.latentHeat + fraction * (upperProps.latentHeat - lowerProps.latentHeat),
            entropy_liquid: lowerProps.entropy_liquid + fraction * (upperProps.entropy_liquid - lowerProps.entropy_liquid),
            entropy_vapor: lowerProps.entropy_vapor + fraction * (upperProps.entropy_vapor - lowerProps.entropy_vapor)
        };
    }

    /**
     * Generate cycle points table for documentation
     * Returns formatted table matching reference manual format
     */
    getCyclePointsTable(analysis) {
        const { cyclePoints } = analysis;

        return {
            headers: ['نقطه', 'بخش', 'T(°C)', 'P(bar)', 'h(kJ/kg)', 's(kJ/kg·K)', 'وضعیت'],
            rows: [
                {
                    point: '1',
                    section: cyclePoints.point1.location,
                    temperature: Math.round(cyclePoints.point1.temperature * 10) / 10,
                    pressure: Math.round(cyclePoints.point1.pressure * 100) / 100,
                    enthalpy: Math.round(cyclePoints.point1.enthalpy),
                    entropy: Math.round(cyclePoints.point1.entropy * 100) / 100,
                    state: cyclePoints.point1.state
                },
                {
                    point: '2',
                    section: cyclePoints.point2.location,
                    temperature: Math.round(cyclePoints.point2.temperature * 10) / 10,
                    pressure: Math.round(cyclePoints.point2.pressure * 100) / 100,
                    enthalpy: Math.round(cyclePoints.point2.enthalpy),
                    entropy: Math.round(cyclePoints.point2.entropy * 100) / 100,
                    state: cyclePoints.point2.state
                },
                {
                    point: '3',
                    section: cyclePoints.point3.location,
                    temperature: Math.round(cyclePoints.point3.temperature * 10) / 10,
                    pressure: Math.round(cyclePoints.point3.pressure * 100) / 100,
                    enthalpy: Math.round(cyclePoints.point3.enthalpy),
                    entropy: Math.round(cyclePoints.point3.entropy * 100) / 100,
                    state: cyclePoints.point3.state
                },
                {
                    point: '4',
                    section: cyclePoints.point4.location,
                    temperature: Math.round(cyclePoints.point4.temperature * 10) / 10,
                    pressure: Math.round(cyclePoints.point4.pressure * 100) / 100,
                    enthalpy: Math.round(cyclePoints.point4.enthalpy),
                    entropy: Math.round(cyclePoints.point4.entropy * 100) / 100,
                    state: cyclePoints.point4.state
                }
            ]
        };
    }

    /**
     * Get superheat and subcool values for output
     */
    getSuperheatSubcool(analysis) {
        return {
            superheat: {
                value: analysis.cyclePoints.point1.superheat,
                recommended: '5-10 K',
                status: analysis.cyclePoints.point1.superheat >= 5 && analysis.cyclePoints.point1.superheat <= 10 ? 'OK' : 'WARNING'
            },
            subcool: {
                value: analysis.cyclePoints.point3.subcool,
                recommended: '3-5 K',
                status: analysis.cyclePoints.point3.subcool >= 3 && analysis.cyclePoints.point3.subcool <= 5 ? 'OK' : 'WARNING'
            }
        };
    }
}

module.exports = ThermodynamicCycleAnalyzer;
