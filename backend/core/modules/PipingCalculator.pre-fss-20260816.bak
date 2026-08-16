/**
 * PipingCalculator Module
 * 
 * Calculates pipe sizes for:
 * - Suction lines
 * - Discharge lines  
 * - Liquid lines
 * - Hot gas lines
 * 
 * Based on ASHRAE velocity and pressure drop limits
 * 
 * @author GFDDE AI Engine
 * @version 2.0.0
 */

class PipingCalculator {
    constructor(engine) {
        this.engine = engine;

        // Standard pipe sizes (DN in mm, corresponding to actual ID)
        this.pipeSchedule = {
            'DN15': { od: 21.3, id: 15.8 },
            'DN20': { od: 26.7, id: 20.9 },
            'DN25': { od: 33.4, id: 26.6 },
            'DN32': { od: 42.2, id: 35.1 },
            'DN40': { od: 48.3, id: 40.9 },
            'DN50': { od: 60.3, id: 52.5 },
            'DN65': { od: 73.0, id: 62.7 },
            'DN80': { od: 88.9, id: 77.9 },
            'DN100': { od: 114.3, id: 102.3 },
            'DN125': { od: 139.7, id: 128.2 },
            'DN150': { od: 168.3, id: 154.1 },
            'DN200': { od: 219.1, id: 202.7 },
            'DN250': { od: 273.0, id: 254.5 },
            'DN300': { od: 323.9, id: 303.2 }
        };

        // Recommended velocities (m/s)
        this.velocityLimits = {
            suction: { min: 7, max: 15, recommended: 10 },
            discharge: { min: 15, max: 25, recommended: 18 },
            liquid: { min: 0.5, max: 1.5, recommended: 1.0 },
            hotGas: { min: 15, max: 25, recommended: 20 }
        };

        // Pressure drop limits (kPa/100m)
        this.pressureDropLimits = {
            suction: 2.0,     // Critical for efficiency
            discharge: 10.0,
            liquid: 15.0
        };
    }

    /**
     * Size all system piping
     * @param {Object} calculations - System calculations
     * @param {Object} project - Project context
     * @returns {Object} Piping schedule
     */
    async size(calculations, project) {
        const refrigerant = project.refrigerant || 'R717';
        const refData = this.engine.getData('refrigerants')?.[refrigerant];

        const piping = {
            suction: [],
            discharge: [],
            liquid: [],
            summary: {}
        };

        // Size suction lines for each temperature level
        if (calculations.temperatureLevels) {
            for (const [level, data] of Object.entries(calculations.temperatureLevels)) {
                const evapTemp = data.evaporatingTemp;
                const load = data.totalLoad;

                // Get vapor density at evaporating temp
                const vaporDensity = refData?.properties?.[evapTemp.toString()]?.density_vapor || 1.0;

                // Try to get accurate mass flow from compressor cycle analysis
                let massFlow = 0;
                const compressor = calculations.compressors?.find(c =>
                    Math.abs(c.evaporatingTemp - evapTemp) < 1
                );

                if (compressor?.massFlowRate) {
                    // Use accurate mass flow from thermodynamic cycle analysis
                    massFlow = compressor.massFlowRate;
                } else {
                    // Fallback to latent heat approximation
                    const latentHeat = refData?.properties?.[evapTemp.toString()]?.latentHeat || 1300;
                    massFlow = load / latentHeat;  // kg/s
                }

                // Size suction line
                const suctionSize = this._sizePipe(massFlow, vaporDensity, 'suction');
                piping.suction.push({
                    temperatureLevel: level,
                    evapTemp: evapTemp,
                    load: Math.round(load * 100) / 100,
                    massFlow: Math.round(massFlow * 1000) / 1000,
                    method: compressor?.massFlowRate ? 'cycle_analysis' : 'latent_heat',
                    ...suctionSize
                });
            }
        }

        // Size discharge line (combined)
        if (calculations.compressors) {
            const totalHeatRejection = calculations.compressors.reduce(
                (sum, c) => sum + (c.heatRejection || 0), 0
            );
            const condensingTemp = project.climate?.summerWB ?
                project.climate.summerWB + 8 : 32;

            const vaporDensity = refData?.properties?.['35']?.density_vapor || 10;
            const latentHeat = refData?.properties?.['35']?.latentHeat || 1100;
            const massFlow = totalHeatRejection / latentHeat;

            const dischargeSize = this._sizePipe(massFlow, vaporDensity, 'discharge');
            piping.discharge.push({
                type: 'main',
                load: Math.round(totalHeatRejection * 100) / 100,
                massFlow: Math.round(massFlow * 1000) / 1000,
                ...dischargeSize
            });
        }

        // Size liquid lines
        if (calculations.condensers) {
            const liquidDensity = 600;  // kg/m³ typical for ammonia liquid
            const totalLoad = piping.suction.reduce((sum, s) => sum + s.load, 0);
            const latentHeat = 1200;
            const massFlow = totalLoad / latentHeat;

            const liquidSize = this._sizePipe(massFlow, liquidDensity, 'liquid');
            piping.liquid.push({
                type: 'main',
                load: Math.round(totalLoad * 100) / 100,
                massFlow: Math.round(massFlow * 1000) / 1000,
                ...liquidSize
            });
        }

        // Summary
        piping.summary = {
            largestSuction: this._getLargestPipe(piping.suction),
            dischargeMain: piping.discharge[0]?.size || 'N/A',
            liquidMain: piping.liquid[0]?.size || 'N/A'
        };

        return piping;
    }

    _sizePipe(massFlow, density, lineType) {
        const limits = this.velocityLimits[lineType];
        const targetVelocity = limits.recommended;

        // Volume flow rate (m³/s)
        const volumeFlow = massFlow / density;

        // Required area (m²) for target velocity
        const requiredArea = volumeFlow / targetVelocity;

        // Required diameter (m)
        const requiredDiameter = Math.sqrt(4 * requiredArea / Math.PI) * 1000;  // mm

        // Find standard size
        let selectedSize = 'DN300';  // Default to largest
        let actualID = 303.2;

        for (const [size, dims] of Object.entries(this.pipeSchedule)) {
            if (dims.id >= requiredDiameter) {
                selectedSize = size;
                actualID = dims.id;
                break;
            }
        }

        // Calculate actual velocity
        const actualArea = Math.PI * Math.pow(actualID / 1000, 2) / 4;
        const actualVelocity = volumeFlow / actualArea;

        // Estimate pressure drop (simplified Darcy-Weisbach)
        const f = 0.02;  // Friction factor (typical for steel pipe)
        const pressureDrop = f * (100 / (actualID / 1000)) *
            (density * Math.pow(actualVelocity, 2) / 2) / 1000;

        return {
            size: selectedSize,
            actualID: actualID,
            requiredDiameter: Math.round(requiredDiameter * 10) / 10,
            velocity: Math.round(actualVelocity * 100) / 100,
            velocityOK: actualVelocity >= limits.min && actualVelocity <= limits.max,
            pressureDrop: Math.round(pressureDrop * 100) / 100,
            pressureDropOK: pressureDrop <= this.pressureDropLimits[lineType]
        };
    }

    _getLargestPipe(pipes) {
        if (!pipes || pipes.length === 0) return 'N/A';

        let largest = 'DN15';
        let largestID = 0;

        for (const pipe of pipes) {
            const id = this.pipeSchedule[pipe.size]?.id || 0;
            if (id > largestID) {
                largestID = id;
                largest = pipe.size;
            }
        }

        return largest;
    }
}

module.exports = PipingCalculator;
