// backend/services/physics/CoolPropWrapper.js
const axios = require('axios');
const AmmoniaProperties = require('../../utils/AmmoniaProperties');

/**
 * Production-Ready Node.js Wrapper for CoolProp Python Microservice
 * Features:
 * - Automatic retry with exponential backoff
 * - Fallback to AmmoniaProperties.js for R717
 * - Request timeout and error handling
 * - Complete cycle calculations
 */
class CoolPropWrapper {
    constructor(baseURL = process.env.COOLPROP_SERVICE_URL || 'http://127.0.0.1:5001') {
        this.baseURL = baseURL;
        this.client = axios.create({
            baseURL,
            timeout: 5000, // 5 second timeout
            headers: {
                'Content-Type': 'application/json'
            }
        });

        this.retryConfig = {
            maxRetries: 3,
            initialDelay: 500,  // ms
            maxDelay: 3000      // ms
        };

        this.serviceAvailable = null;  // null = unknown, true = available, false = unavailable
    }

    /**
     * Retry helper with exponential backoff
     */
    async _retryRequest(requestFn, retries = this.retryConfig.maxRetries) {
        for (let i = 0; i <= retries; i++) {
            try {
                return await requestFn();
            } catch (error) {
                if (i === retries) throw error;

                // Calculate delay with exponential backoff
                const delay = Math.min(
                    this.retryConfig.initialDelay * Math.pow(2, i),
                    this.retryConfig.maxDelay
                );

                console.log(`⚠️  CoolProp request failed (attempt ${i + 1}/${retries + 1}), retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    /**
     * Health check with caching
     */
    async healthCheck() {
        try {
            const response = await this.client.get('/health');
            this.serviceAvailable = true;
            return response.data;
        } catch (error) {
            this.serviceAvailable = false;
            throw new Error(`CoolProp service unavailable: ${error.message}`);
        }
    }

    /**
     * Calculate thermodynamic properties with retry and fallback
     */
    async calculateProperties(fluid, inputPair, input1, input2, outputs = ['H', 'S', 'D', 'Q']) {
        try {
            return await this._retryRequest(async () => {
                const response = await this.client.post('/properties', {
                    fluid,
                    input_pair: inputPair,
                    input1,
                    input2,
                    outputs
                });

                if (!response.data.success) {
                    throw new Error(response.data.error);
                }

                this.serviceAvailable = true;
                return response.data.results;
            });

        } catch (error) {
            console.error(`❌ CoolProp error: ${error.message}`);

            // Fallback to AmmoniaProperties for R717
            if ((fluid === 'R717' || fluid === 'Ammonia') && inputPair === 'PT') {
                console.log('   Using AmmoniaProperties.js fallback for R717');
                return this._fallbackAmmoniaProperties(input1, input2, outputs);
            }

            this.serviceAvailable = false;
            throw new Error(`Property calculation error: ${error.response?.data?.error || error.message}`);
        }
    }

    /**
     * Fallback to AmmoniaProperties.js for basic R717 calculations
     */
    _fallbackAmmoniaProperties(pressure, temperature, outputs) {
        try {
            // Use AmmoniaProperties methods
            const temperatureC = temperature - 273.15;
            const pressureBar = pressure / 100000;

            const results = {};

            // Basic properties (limited compared to CoolProp)
            if (outputs.includes('H')) {
                // Estimate enthalpy - this is simplified
                results.H = 1500000 + temperatureC * 2500; // Rough estimate
            }

            if (outputs.includes('S')) {
                results.S = 5000 + temperatureC * 20;  // Rough estimate
            }

            if (outputs.includes('D')) {
                // Density calculation
                const satPressure = AmmoniaProperties.getSaturationPressure(temperatureC);
                results.D = satPressure > pressureBar ? 640 : 3.5;  // Liquid or vapor
            }

            if (outputs.includes('Q')) {
                results.Q = temperature < 273.15 ? -1 : 0.5;  // Quality estimate
            }

            results._fallback = true;
            results._note = 'Using deterministic fallback - limited accuracy';

            return results;
        } catch (error) {
            throw new Error(`Fallback calculation failed: ${error.message}`);
        }
    }

    /**
     * Calculate VLE properties with retry
     */
    async calculateVLE(fluid, temperature, quality = 0) {
        try {
            return await this._retryRequest(async () => {
                const response = await this.client.post('/vle', {
                    fluid,
                    temperature,
                    quality
                });

                if (!response.data.success) {
                    throw new Error(response.data.error);
                }

                return response.data.results;
            });

        } catch (error) {
            console.error(`❌ VLE calculation error: ${error.message}`);
            throw error;
        }
    }

    /**
     * Calculate complete refrigeration cycle with retry
     */
    async calculateCycle(fluid, evapTemp, condTemp, superheat = 5, subcool = 3, isentropicEfficiency = 0.75) {
        try {
            return await this._retryRequest(async () => {
                const response = await this.client.post('/cycle', {
                    fluid,
                    evap_temp: evapTemp,
                    cond_temp: condTemp,
                    superheat,
                    subcool,
                    isentropic_efficiency: isentropicEfficiency
                });

                if (!response.data.success) {
                    throw new Error(response.data.error);
                }

                return {
                    states: response.data.states,
                    performance: response.data.performance
                };
            });

        } catch (error) {
            console.error(`❌ Cycle calculation error: ${error.message}`);
            throw error;
        }
    }

    /**
     * Calculate psychrometric properties with retry
     */
    async calculatePsychrometric(dryBulbTemp, pressure = 101325, inputType = 'RH', inputValue) {
        try {
            return await this._retryRequest(async () => {
                const response = await this.client.post('/psychrometric', {
                    dry_bulb_temp: dryBulbTemp,
                    pressure,
                    input_type: inputType,
                    input_value: inputValue
                });

                if (!response.data.success) {
                    throw new Error(response.data.error);
                }

                return response.data.results;
            });

        } catch (error) {
            console.error(`❌ Psychrometric calculation error: ${error.message}`);
            throw error;
        }
    }

    // === HELPER METHODS ===

    celsiusToKelvin(celsius) {
        return celsius + 273.15;
    }

    kelvinToCelsius(kelvin) {
        return kelvin - 273.15;
    }

    barToPascal(bar) {
        return bar * 100000;
    }

    pascalToBar(pascal) {
        return pascal / 100000;
    }

    /**
     * Convenience method for ammonia refrigeration cycle
     */
    async calculateAmmoniaCycle(evapTempC, condTempC, superheatK = 5, subcoolK = 3) {
        const evapTempK = this.celsiusToKelvin(evapTempC);
        const condTempK = this.celsiusToKelvin(condTempC);

        return await this.calculateCycle('R717', evapTempK, condTempK, superheatK, subcoolK);
    }

    /**
     * Check if service is available (with caching)
     */
    async isServiceAvailable() {
        if (this.serviceAvailable !== null) {
            return this.serviceAvailable;
        }

        try {
            await this.healthCheck();
            return true;
        } catch (error) {
            return false;
        }
    }
}

// Export singleton instance
module.exports = new CoolPropWrapper();
