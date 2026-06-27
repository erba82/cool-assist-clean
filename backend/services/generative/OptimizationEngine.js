// backend/services/generative/OptimizationEngine.js
/**
 * Multi-Objective Optimization Engine for GFDDE (Phase 2.2)
 * Optimizes designs for cost, efficiency, and reliability
 */

class OptimizationEngine {
    constructor() {
        this.objectives = ['cost', 'efficiency', 'reliability'];
    }

    /**
     * Optimize design variants using multi-objective approach
     * @param {Array} variants - Design variants
     * @param {object} criteria - Optimization criteria
     * @returns {Array} Pareto-optimal variants
     */
    optimize(variants, criteria = {}) {
        console.log(`[Optimization] Optimizing ${variants.length} variants`);

        const {
            priorityWeights = { cost: 0.3, efficiency: 0.5, reliability: 0.2 },
            constraints = {}
        } = criteria;

        // Score each variant
        const scoredVariants = variants.map(variant => {
            const scores = this.calculateObjectives(variant);
            const weightedScore = this.calculateWeightedScore(scores, priorityWeights);

            return {
                ...variant,
                objectives: scores,
                optimizationScore: weightedScore,
                paretoRank: 0  // Will be calculated
            };
        });

        // Calculate Pareto ranking
        const rankedVariants = this.calculateParetoFront(scoredVariants);

        // Sort by optimization score
        rankedVariants.sort((a, b) => b.optimizationScore - a.optimizationScore);

        console.log(`[Optimization] Best variant score: ${rankedVariants[0].optimizationScore.toFixed(2)}`);
        return rankedVariants;
    }

    /**
     * Calculate objective scores (cost, efficiency, reliability)
     */
    calculateObjectives(variant) {
        const objectives = {
            cost: this.estimateCost(variant),
            efficiency: this.calculateEfficiency(variant),
            reliability: this.assessReliability(variant)
        };

        // Normalize scores (0-100)
        return {
            cost: Math.min(100, (10000 / objectives.cost) * 100), // Lower cost = higher score
            efficiency: objectives.efficiency,
            reliability: objectives.reliability
        };
    }

    /**
     * Estimate system cost (simplified)
     */
    estimateCost(variant) {
        let totalCost = 0;

        // Compressor cost (~$300/kW)
        const compressors = variant.components.compressors || [];
        compressors.forEach(comp => {
            totalCost += comp.capacity * 300;
        });

        // Condenser cost (~$150/kW)
        const condensers = variant.components.condensers || [];
        condensers.forEach(cond => {
            totalCost += cond.capacity * 150;
        });

        // Evaporator cost (~$100/kW)
        const evaporators = variant.components.evaporators || [];
        evaporators.forEach(evap => {
            totalCost += evap.capacity * 100;
        });

        // Receiver cost (~$50/liter)
        if (variant.components.receiver) {
            totalCost += variant.components.receiver.volume * 50;
        }

        // Piping cost (~$500/pipe)
        const pipes = variant.piping || [];
        totalCost += pipes.length * 500;

        return totalCost;
    }

    /**
     * Calculate system efficiency score
     */
    calculateEfficiency(variant) {
        const thermo = variant.thermodynamics;

        if (!thermo || !thermo.cop) {
            return 50; // Default score if no data
        }

        // COP-based efficiency (3.0 = 75%, 4.0 = 100%)
        const copScore = Math.min(100, (thermo.cop / 4.0) * 100);

        // Pressure ratio penalty (lower is better)
        const prScore = thermo.pressureRatio ? Math.max(0, 100 - (thermo.pressureRatio - 3) * 10) : 80;

        // Component utilization (prefer 80-95% utilization)
        let utilizationScore = 80;
        if (variant.components.compressors && variant.components.compressors.length > 0) {
            const comp = variant.components.compressors[0];
            if (comp.utilization) {
                const util = parseFloat(comp.utilization);
                utilizationScore = 100 - Math.abs(87.5 - util);
            }
        }

        return (copScore * 0.5 + prScore * 0.3 + utilizationScore * 0.2);
    }

    /**
     * Assess system reliability
     */
    assessReliability(variant) {
        let score = 70; // Base score

        // Redundancy bonus
        const compressors = variant.components.compressors || [];
        if (compressors.length >= 2) score += 15;

        const evaporators = variant.components.evaporators || [];
        if (evaporators.length >= 3) score += 10;

        // Safety accessories bonus
        const accessories = variant.components.accessories || [];
        score += Math.min(15, accessories.length * 3);

        // Strategy bonus
        if (variant.strategy === 'conservative') score += 10;
        if (variant.strategy === 'balanced') score += 5;

        return Math.min(100, score);
    }

    /**
     * Calculate weighted score
     */
    calculateWeightedScore(objectives, weights) {
        return Object.keys(objectives).reduce((total, key) => {
            return total + (objectives[key] * (weights[key] || 0));
        }, 0);
    }

    /**
     * Calculate Pareto front (non-dominated solutions)
     */
    calculateParetoFront(variants) {
        variants.forEach((variant, i) => {
            let dominated = false;

            for (const other of variants) {
                if (this.dominates(other.objectives, variant.objectives)) {
                    dominated = true;
                    break;
                }
            }

            variant.paretoRank = dominated ? 1 : 0; // 0 = Pareto-optimal
        });

        return variants;
    }

    /**
     * Check if objectives A dominate objectives B
     */
    dominates(a, b) {
        let atLeastOneBetter = false;

        for (const objective of this.objectives) {
            if (a[objective] < b[objective]) {
                return false; // A is worse in this objective
            }
            if (a[objective] > b[objective]) {
                atLeastOneBetter = true;
            }
        }

        return atLeastOneBetter;
    }

    /**
     * Generate optimization report
     */
    generateReport(optimizedVariants) {
        const paretoFront = optimizedVariants.filter(v => v.paretoRank === 0);

        return {
            totalVariants: optimizedVariants.length,
            paretoOptimal: paretoFront.length,
            bestVariant: optimizedVariants[0],
            summary: {
                costRange: this.getRange(optimizedVariants, 'cost'),
                efficiencyRange: this.getRange(optimizedVariants, 'efficiency'),
                reliabilityRange: this.getRange(optimizedVariants, 'reliability')
            },
            recommendations: this.generateRecommendations(optimizedVariants[0])
        };
    }

    /**
     * Get objective range
     */
    getRange(variants, objective) {
        const values = variants.map(v => v.objectives[objective]);
        return {
            min: Math.min(...values).toFixed(1),
            max: Math.max(...values).toFixed(1),
            avg: (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1)
        };
    }

    /**
     * Generate recommendations
     */
    generateRecommendations(bestVariant) {
        const recommendations = [];

        if (bestVariant.objectives.cost < 70) {
            recommendations.push('Consider lower-cost components to improve budget compliance');
        }

        if (bestVariant.objectives.efficiency < 80) {
            recommendations.push('Improve system COP by optimizing operating temperatures');
        }

        if (bestVariant.objectives.reliability < 75) {
            recommendations.push('Add redundant components for higher reliability');
        }

        if (recommendations.length === 0) {
            recommendations.push('Design is well-optimized across all objectives');
        }

        return recommendations;
    }
}

module.exports = new OptimizationEngine();
