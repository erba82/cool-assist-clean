// backend/services/simulation/HeatTransferSolver.js
/**
 * Heat Transfer Solver for GFDDE
 * Provides simplified 1D/2D heat transfer calculations for quick estimations
 * Used when full CFD is not required or available
 */

class HeatTransferSolver {
    constructor() {
        // Thermal conductivities (W/m·K)
        this.materials = {
            'steel': 50,
            'copper': 385,
            'aluminum': 205,
            'insulation_pu': 0.022,
            'insulation_eps': 0.035
        };
    }

    /**
     * Calculate heat loss through insulated pipe (Radial 1D)
     * @param {Object} pipe - Pipe specifications
     * @param {Object} conditions - Operating conditions
     * @returns {Object} Heat loss results
     */
    calculatePipeHeatLoss(pipe, conditions) {
        const {
            innerDiameter, // m
            wallThickness, // m
            insulationThickness, // m
            material,
            insulationMaterial,
            length // m
        } = pipe;

        const {
            fluidTemp, // K
            ambientTemp, // K
            windSpeed // m/s (for convection)
        } = conditions;

        const r1 = innerDiameter / 2;
        const r2 = r1 + wallThickness;
        const r3 = r2 + insulationThickness;

        const k_pipe = this.materials[material] || 50;
        const k_ins = this.materials[insulationMaterial] || 0.035;

        // Convection coefficients (simplified correlations)
        const h_inner = this.calculateInnerConvection(fluidTemp, pipe.flowRate || 1);
        const h_outer = this.calculateOuterConvection(windSpeed);

        // Thermal resistance network
        const R_conv_in = 1 / (2 * Math.PI * r1 * length * h_inner);
        const R_cond_pipe = Math.log(r2 / r1) / (2 * Math.PI * length * k_pipe);
        const R_cond_ins = Math.log(r3 / r2) / (2 * Math.PI * length * k_ins);
        const R_conv_out = 1 / (2 * Math.PI * r3 * length * h_outer);

        const R_total = R_conv_in + R_cond_pipe + R_cond_ins + R_conv_out;
        const deltaT = Math.abs(fluidTemp - ambientTemp);
        const heatLoss = deltaT / R_total; // Watts

        return {
            heatLossWatts: heatLoss,
            heatLossPerMeter: heatLoss / length,
            surfaceTemp: ambientTemp + (heatLoss * R_conv_out) * (fluidTemp > ambientTemp ? 1 : -1),
            resistances: {
                innerConv: R_conv_in,
                pipeCond: R_cond_pipe,
                insCond: R_cond_ins,
                outerConv: R_conv_out
            }
        };
    }

    /**
     * Calculate heat exchanger effectiveness (LMTD method)
     * @param {Object} hx - Heat exchanger specs
     * @param {Object} streams - Hot and cold stream properties
     */
    calculateHXPerformance(hx, streams) {
        const { hotIn, hotOut, coldIn, coldOut } = streams;

        const deltaT1 = hotIn - coldOut;
        const deltaT2 = hotOut - coldIn;

        let lmtd;
        if (deltaT1 === deltaT2) {
            lmtd = deltaT1;
        } else {
            lmtd = (deltaT1 - deltaT2) / Math.log(deltaT1 / deltaT2);
        }

        const area = hx.area || 10; // m²
        const u_value = hx.u_value || 500; // W/m²·K

        const q = u_value * area * lmtd;

        return {
            lmtd,
            heatTransferRate: q, // Watts
            UA: u_value * area
        };
    }

    calculateInnerConvection(temp, flowRate) {
        // Simplified estimation for turbulent flow in pipe
        // Nu = 0.023 * Re^0.8 * Pr^0.4
        // Assuming water/ammonia-like properties for rough estimate
        return 3000; // W/m²·K (typical for liquid flow)
    }

    calculateOuterConvection(windSpeed) {
        // Simplified correlation for air over cylinder
        // h = 10 + 4 * v
        return 10 + 4 * (windSpeed || 0);
    }
}

module.exports = new HeatTransferSolver();
