/**
 * Ammonia (R-717) Thermodynamic Properties
 * Based on ASHRAE Fundamentals and RefProp data
 * 
 * All properties at saturated conditions
 */

class AmmoniaProperties {
    /**
     * Saturation properties of ammonia at various temperatures
     * temp: °C, pressure: kPa, hf: kJ/kg (liquid), hg: kJ/kg (vapor), sf: kJ/kg·K, sg: kJ/kg·K
     */
    static saturationTable = [
        { temp: -50, pressure: 40.9, hf: -44.3, hg: 1416.7, sf: -0.193, sg: 6.355, density_l: 682.9, density_v: 0.290 },
        { temp: -45, pressure: 57.2, hf: -22.0, hg: 1425.5, sf: -0.093, sg: 6.284, density_l: 678.3, density_v: 0.405 },
        { temp: -40, pressure: 71.7, hf: 0.0, hg: 1433.9, sf: 0.000, sg: 6.217, density_l: 673.6, density_v: 0.515 },
        { temp: -35, pressure: 90.6, hf: 22.5, hg: 1442.0, sf: 0.089, sg: 6.153, density_l: 669.0, density_v: 0.645 },
        { temp: -30, pressure: 113.3, hf: 45.4, hg: 1449.8, sf: 0.176, sg: 6.092, density_l: 664.2, density_v: 0.803 },
        { temp: -25, pressure: 140.3, hf: 68.6, hg: 1457.3, sf: 0.260, sg: 6.034, density_l: 659.4, density_v: 0.992 },
        { temp: -20, pressure: 172.2, hf: 92.2, hg: 1464.5, sf: 0.342, sg: 5.978, density_l: 654.6, density_v: 1.217 },
        { temp: -15, pressure: 209.5, hf: 116.1, hg: 1471.4, sf: 0.422, sg: 5.924, density_l: 649.7, density_v: 1.485 },
        { temp: -10, pressure: 252.7, hf: 140.4, hg: 1478.0, sf: 0.500, sg: 5.872, density_l: 644.7, density_v: 1.801 },
        { temp: -5, pressure: 302.4, hf: 165.1, hg: 1484.3, sf: 0.575, sg: 5.822, density_l: 639.7, density_v: 2.172 },
        { temp: 0, pressure: 359.0, hf: 190.2, hg: 1490.2, sf: 0.649, sg: 5.774, density_l: 634.6, density_v: 2.605 },
        { temp: 5, pressure: 423.1, hf: 215.7, hg: 1495.8, sf: 0.721, sg: 5.727, density_l: 629.4, density_v: 3.108 },
        { temp: 10, pressure: 495.3, hf: 241.7, hg: 1501.0, sf: 0.791, sg: 5.682, density_l: 624.1, density_v: 3.690 },
        { temp: 15, pressure: 576.1, hf: 268.1, hg: 1505.8, sf: 0.859, sg: 5.637, density_l: 618.8, density_v: 4.361 },
        { temp: 20, pressure: 666.3, hf: 295.0, hg: 1510.3, sf: 0.926, sg: 5.594, density_l: 613.3, density_v: 5.132 },
        { temp: 25, pressure: 766.4, hf: 322.4, hg: 1514.3, sf: 0.991, sg: 5.552, density_l: 607.8, density_v: 6.015 },
        { temp: 30, pressure: 877.1, hf: 350.3, hg: 1517.9, sf: 1.055, sg: 5.511, density_l: 602.1, density_v: 7.025 },
        { temp: 35, pressure: 999.0, hf: 378.8, hg: 1521.0, sf: 1.117, sg: 5.470, density_l: 596.3, density_v: 8.177 },
        { temp: 40, pressure: 1132.8, hf: 407.8, hg: 1523.6, sf: 1.178, sg: 5.430, density_l: 590.4, density_v: 9.489 }
    ];

    /**
     * Linear interpolation for ammonia properties
     */
    static interpolate(temp, property) {
        const table = this.saturationTable;

        // Find bounding points
        let lower = table[0];
        let upper = table[table.length - 1];

        for (let i = 0; i < table.length - 1; i++) {
            if (temp >= table[i].temp && temp <= table[i + 1].temp) {
                lower = table[i];
                upper = table[i + 1];
                break;
            }
        }

        // Perform linear interpolation
        const fraction = (temp - lower.temp) / (upper.temp - lower.temp);
        return lower[property] + fraction * (upper[property] - lower[property]);
    }

    /**
     * Get enthalpy of saturated liquid at given temperature
     */
    static getLiquidEnthalpy(tempC) {
        return this.interpolate(tempC, 'hf');
    }

    /**
     * Get enthalpy of saturated vapor at given temperature
     */
    static getVaporEnthalpy(tempC) {
        return this.interpolate(tempC, 'hg');
    }

    /**
     * Get saturation pressure at given temperature
     */
    static getSaturationPressure(tempC) {
        return this.interpolate(tempC, 'pressure');
    }

    /**
     * Get liquid density at given temperature
     */
    static getLiquidDensity(tempC) {
        return this.interpolate(tempC, 'density_l');
    }

    /**
     * Calculate enthalpy change for cooling/freezing process
     * @param {number} initialTemp - Initial product temperature (°C)
     * @param {number} finalTemp - Final product temperature (°C)
     * @param {number} freezingPoint - Freezing point of product (°C), typically -1.5 for meat
     * @returns {number} Specific enthalpy change (kJ/kg)
     */
    static calculateProductEnthalpyChange(initialTemp, finalTemp, freezingPoint = -1.5) {
        const cpAboveFreezing = 3.52;  // kJ/kg·K for meat above freezing
        const cpBelowFreezing = 1.76;  // kJ/kg·K for meat below freezing
        const latentHeat = 250;        // kJ/kg latent heat of fusion for meat (typical)

        let totalEnthalpy = 0;

        if (initialTemp > freezingPoint && finalTemp > freezingPoint) {
            // Only sensible cooling above freezing
            totalEnthalpy = cpAboveFreezing * (initialTemp - finalTemp);
        } else if (initialTemp > freezingPoint && finalTemp <= freezingPoint) {
            // Cooling above freezing + latent + cooling below freezing
            totalEnthalpy = cpAboveFreezing * (initialTemp - freezingPoint)
                + latentHeat
                + cpBelowFreezing * (freezingPoint - finalTemp);
        } else {
            // Only sensible cooling below freezing
            totalEnthalpy = cpBelowFreezing * (initialTemp - finalTemp);
        }

        return totalEnthalpy;
    }

    /**
     * Specific heat of ammonia vapor (approximation)
     */
    static getVaporCp(tempC) {
        return 2.2 + 0.0005 * tempC;  // kJ/kg·K
    }
}

module.exports = AmmoniaProperties;
