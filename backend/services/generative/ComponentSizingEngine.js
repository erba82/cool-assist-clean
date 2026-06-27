/**
 * Enhanced Component Sizing Engine with ML Integration
 * Professional implementation combining ML predictions with rule-based fallback
 */

const axios = require('axios');

class ComponentSizingEngineML {
    constructor() {
        this.mlServiceUrl = process.env.ML_SERVICE_URL || 'http://127.0.0.1:5002';
        this.mlAvailable = false;
        this.checkMLService();

        // Keep rule-based database as fallback
        this.ruleBasedDB = this.initializeRuleBasedDatabase();
    }

    /**
     * Check if ML service is available
     */
    async checkMLService() {
        try {
            const response = await axios.get(`${this.mlServiceUrl}/health`, { timeout: 2000 });
            this.mlAvailable = response.data.status === 'healthy';
            if (this.mlAvailable) {
                console.log('[ComponentSizing] ✅ ML Service connected');
                console.log(`[ComponentSizing]    Models: ${response.data.models.join(', ')}`);
            }
        } catch (error) {
            this.mlAvailable = false;
            console.warn('[ComponentSizing] ⚠️  ML Service unavailable - using rule-based fallback');
        }
    }

    /**
     * Size system using ML (primary method)
     */
    async sizeWithML(requirements) {
        if (!this.mlAvailable) {
            console.log('[ComponentSizing] ML unavailable, using rules...');
            return this.sizeWithRules(requirements);
        }

        try {
            console.log('[ComponentSizing] Using ML predictions...');

            const response = await axios.post(
                `${this.mlServiceUrl}/predict/system`,
                requirements,
                { timeout: 5000 }
            );

            if (!response.data.success) {
                console.warn('[ComponentSizing] ML prediction failed, falling back to rules');
                return this.sizeWithRules(requirements);
            }

            const mlResult = response.data;

            // Use ML predictions with high confidence
            const confidence = mlResult.compressor.confidence || 0;

            if (confidence < 0.7) {
                console.warn(`[ComponentSizing] Low ML confidence (${(confidence * 100).toFixed(1)}%), using hybrid approach`);
                return this.hybridSizing(requirements, mlResult);
            }

            console.log(`[ComponentSizing] ✅ ML prediction (confidence: ${(confidence * 100).toFixed(1)}%)`);

            return this.formatMLResult(mlResult, requirements);

        } catch (error) {
            console.error('[ComponentSizing] ML error:', error.message);
            return this.sizeWithRules(requirements);
        }
    }

    /**
     * Format ML result to standard output
     */
    formatMLResult(mlResult, requirements) {
        const comp = mlResult.compressor;
        const bestRecommendation = comp.recommendations[0];

        return {
            method: 'ml',
            confidence: comp.confidence,
            requirements,
            components: {
                compressor: {
                    model: bestRecommendation.model,
                    type: comp.equipment_type,
                    capacity: bestRecommendation.capacity,
                    power: bestRecommendation.power,
                    predicted_capacity: comp.predicted_capacity,
                    predicted_power: comp.predicted_power,
                    match_score: bestRecommendation.match_score,
                    alternatives: comp.recommendations.slice(1, 3)
                },
                condenser: {
                    required_capacity: mlResult.condenser.required_capacity,
                    heat_rejection: mlResult.condenser.heat_rejection,
                    type: requirements.refrigerant === 'R717' ? 'evaporative' : 'air_cooled'
                },
                evaporators: {
                    count: mlResult.evaporators.count,
                    capacity_each: mlResult.evaporators.capacity_each
                }
            },
            performance: {
                ml_predicted_cop: requirements.cop || 3.2,
                ml_confidence: comp.confidence
            },
            metadata: {
                timestamp: new Date().toISOString(),
                ml_version: mlResult.metadata.model_version
            }
        };
    }

    /**
     * Hybrid approach: ML + Rules validation
     */
    async hybridSizing(requirements, mlResult) {
        console.log('[ComponentSizing] Using hybrid ML + Rules approach');

        // Get rule-based sizing
        const ruleResult = await this.sizeWithRules(requirements);

        // Compare ML vs Rules
        const mlCapacity = mlResult.compressor.predicted_capacity;
        const ruleCapacity = ruleResult.components.compressor.capacity;

        const diff = Math.abs(mlCapacity - ruleCapacity) / ruleCapacity;

        if (diff > 0.2) {  // >20% difference
            console.warn(`[ComponentSizing] Large ML/Rule difference (${(diff * 100).toFixed(1)}%), using rules`);
            return ruleResult;
        }

        // ML prediction is reasonable, use it
        return this.formatMLResult(mlResult, requirements);
    }

    /**
     * Rule-based sizing (fallback)
     */
    async sizeWithRules(requirements) {
        console.log('[ComponentSizing] Using rule-based sizing...');

        const { cooling_capacity, evap_temp, cond_temp, refrigerant = 'R717' } = requirements;

        // Safety factor
        const safetyFactor = 1.15;
        const requiredCapacity = cooling_capacity * safetyFactor;

        // Select compressor
        const compType = requiredCapacity > 40 ? 'screw' : 'reciprocating';
        const compressors = this.ruleBasedDB.compressors[compType];

        const bestCompressor = compressors
            .filter(c => c.capacity >= requiredCapacity * 0.9)
            .sort((a, b) => a.capacity - b.capacity)[0] || compressors[compressors.length - 1];

        // Heat rejection
        const heatRejection = cooling_capacity + bestCompressor.power;
        const condenserCapacity = heatRejection * 1.15;

        return {
            method: 'rules',
            confidence: 0.85,  // Rule-based confidence
            requirements,
            components: {
                compressor: {
                    model: bestCompressor.model,
                    type: compType,
                    capacity: bestCompressor.capacity,
                    power: bestCompressor.power
                },
                condenser: {
                    required_capacity: condenserCapacity,
                    heat_rejection: heatRejection,
                    type: refrigerant === 'R717' ? 'evaporative' : 'air_cooled'
                },
                evaporators: {
                    count: cooling_capacity > 150 ? 3 : 2,
                    capacity_each: cooling_capacity / (cooling_capacity > 150 ? 3 : 2)
                }
            },
            performance: {
                estimated_cop: 3.2
            },
            metadata: {
                timestamp: new Date().toISOString()
            }
        };
    }

    /**
     * Main sizing method - auto-selects best approach
     */
    async sizeSystem(requirements) {
        // Check ML service availability
        await this.checkMLService();

        // Use ML if available
        return this.sizeWithML(requirements);
    }

    /**
     * Initialize rule-based database
     */
    initializeRuleBasedDatabase() {
        return {
            compressors: {
                screw: [
                    { model: 'BITZER-4NES-20Y', capacity: 50, power: 15.5 },
                    { model: 'BITZER-6FE-35Y', capacity: 100, power: 29 },
                    { model: 'BITZER-N320VLD', capacity: 150, power: 42 },
                    { model: 'BITZER-S6H-25.2', capacity: 200, power: 55 },
                    { model: 'BITZER-CSH8561-90', capacity: 300, power: 82 }
                ],
                reciprocating: [
                    { model: 'BITZER-4CC-9.2Y', capacity: 25, power: 8 },
                    { model: 'BITZER-4DC-10.2Y', capacity: 40, power: 12 }
                ]
            }
        };
    }
}

// Export singleton
module.exports = new ComponentSizingEngineML();
