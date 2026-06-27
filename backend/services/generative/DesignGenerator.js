// backend/services/generative/DesignGenerator.js
/**
 * Design Generator for GFDDE
 * Generates multiple design variants using RAG pipeline
 * Part of Phase 2.1: KG-RAG Framework
 */

const RAGOrchestrator = require('./RAGOrchestrator');
const CoolPropWrapper = require('../physics/CoolPropWrapper');

class DesignGenerator {
    constructor() {
        this.ragOrchestrator = RAGOrchestrator;
    }

    /**
     * Generate multiple design variants
     * @param {Object} requirements - Design requirements
     * @param {Object} options - Generation options (count, strategy, etc.)
     * @returns {Promise<Array>} Array of design variants
     */
    async generateVariants(requirements, options = {}) {
        const {
            variantCount = 3,
            strategy = 'balanced',  // 'conservative', 'balanced', 'aggressive'
            includeThermodynamics = true
        } = options;

        console.log(`[DesignGen] Generating ${variantCount} ${strategy} variants...`);

        const variants = [];

        // Initialize RAG
        await this.ragOrchestrator.initialize();

        // Prepare context once (shared across variants)
        const baseContext = await this.ragOrchestrator.prepareContext(requirements);

        // Generate variants with different parameters
        for (let i = 0; i < variantCount; i++) {
            const variant = await this.generateSingleVariant(
                requirements,
                baseContext,
                strategy,
                i,
                includeThermodynamics
            );

            variants.push(variant);
        }

        console.log(`[DesignGen] Generated ${variants.length} variants`);

        // Rank variants
        const rankedVariants = this.rankVariants(variants, requirements);

        return rankedVariants;
    }

    /**
     * Generate a single design variant
     */
    async generateSingleVariant(requirements, context, strategy, variantIndex, includeThermo) {
        const variant = {
            id: `variant_${variantIndex + 1}`,
            strategy,
            requirements,
            components: {},
            piping: [],
            thermodynamics: null,
            score: 0,
            metadata: {
                generatedAt: new Date().toISOString(),
                contextSources: context.metadata.sources
            }
        };

        try {
            // 1. Component selection based on strategy
            variant.components = this.selectComponents(requirements, context, strategy, variantIndex);

            // 2. Pipe sizing and routing
            variant.piping = this.designPiping(variant.components, context, strategy);

            // 3. Calculate thermodynamics if requested
            if (includeThermo) {
                variant.thermodynamics = await this.calculateThermodynamics(
                    variant.components,
                    requirements
                );
            }

            // 4. Calculate variant score
            variant.score = this.calculateVariantScore(variant, requirements, context);

            console.log(`[DesignGen]   Variant ${variant.id}: Score=${variant.score.toFixed(1)}`);

        } catch (error) {
            console.error(`[DesignGen] Error generating variant ${variant.id}: ${error.message}`);
            variant.error = error.message;
            variant.score = 0;
        }

        return variant;
    }

    /**
     * Select components for variant based on strategy
     */
    selectComponents(requirements, context, strategy, variantIndex) {
        const components = {
            compressors: [],
            condensers: [],
            evaporators: [],
            receiver: null,
            expansionValves: [],
            accessories: []
        };

        const capacity = requirements.cooling_capacity || 100;
        const refrigerant = requirements.refrigerant || 'R717';

        // Strategy affects component selection
        const strategyMultipliers = {
            conservative: { safety: 1.3, efficiency: 0.9, cost: 0.8 },
            balanced: { safety: 1.1, efficiency: 1.0, cost: 1.0 },
            aggressive: { safety: 1.0, efficiency: 1.2, cost: 1.2 }
        };

        const multiplier = strategyMultipliers[strategy] || strategyMultipliers.balanced;

        // Compressor selection
        if (capacity > 200) {
            // Two-stage system for high capacity
            components.compressors = [
                {
                    tag: 'CMP-B-1',
                    type: 'booster_compressor',
                    model: `BITZER-${Math.floor(capacity * 0.4 * multiplier.efficiency)}`,
                    capacity: capacity * 0.4,
                    refrigerant,
                    stage: 'booster'
                },
                {
                    tag: 'CMP-H-1',
                    type: 'high_stage_compressor',
                    model: `BITZER-${Math.floor(capacity * 0.6 * multiplier.efficiency)}`,
                    capacity: capacity * 0.6,
                    refrigerant,
                    stage: 'high'
                }
            ];
        } else {
            // Single-stage system
            components.compressors = [
                {
                    tag: 'CMP-01',
                    type: 'screw_compressor',
                    model: `N320VLD-${Math.floor(capacity * multiplier.efficiency)}`,
                    capacity: capacity * multiplier.safety,
                    refrigerant
                }
            ];
        }

        // Condenser selection
        components.condensers = [
            {
                tag: 'COND-01',
                type: 'evaporative_condenser',
                model: 'VXC-Series',
                capacity: capacity * 1.2 * multiplier.safety,  // 120% of cooling load
                refrigerant
            }
        ];

        // Evaporator selection - vary by variant index
        const evaporatorCount = variantIndex % 2 === 0 ? 2 : 3;
        for (let i = 0; i < evaporatorCount; i++) {
            components.evaporators.push({
                tag: `EVP-${String(i + 1).padStart(2, '0')}`,
                type: 'unit_cooler',
                model: 'OPTIGO-Plus',
                capacity: capacity / evaporatorCount,
                refrigerant,
                defrostType: strategy === 'aggressive' ? 'hot_gas' : 'electric'
            });
        }

        // Receiver
        components.receiver = {
            tag: 'HPR-01',
            type: 'horizontal_receiver',
            volume: Math.ceil(capacity * 0.5), // liters
            refrigerant
        };

        // Expansion valves
        components.evaporators.forEach(evap => {
            components.expansionValves.push({
                tag: `TEV-${evap.tag.split('-')[1]}`,
                type: 'thermostatic_expansion_valve',
                model: 'DANFOSS-TEN',
                capacity: evap.capacity,
                servesEvaporator: evap.tag
            });
        });

        // Accessories based on best practices from context
        if (context.bestPractices.find(bp => bp.category === 'safety')) {
            components.accessories.push(
                { type: 'pressure_relief_valve', location: 'receiver' },
                { type: 'ammonia_detector', location: 'machinery_room' }
            );
        }

        return components;
    }

    /**
     * Design piping system
     */
    designPiping(components, context, strategy) {
        const pipes = [];

        // Discharge lines (compressor → condenser)
        components.compressors.forEach(comp => {
            pipes.push({
                id: `PIPE-DISCH-${comp.tag}`,
                type: 'discharge',
                from: comp.tag,
                to: 'COND-01',
                sizeDN: this.calculatePipeSize(comp.capacity, 'discharge'),
                material: 'steel',
                insulation: false,
                color: 'red'
            });
        });

        // Liquid line (condenser → receiver → evaporators)
        pipes.push({
            id: 'PIPE-LIQ-MAIN',
            type: 'liquid',
            from: 'COND-01',
            to: 'HPR-01',
            sizeDN: this.calculatePipeSize(components.condensers[0].capacity, 'liquid'),
            material: 'steel',
            insulation: true,
            color: 'green'
        });

        components.evaporators.forEach(evap => {
            pipes.push({
                id: `PIPE-LIQ-${evap.tag}`,
                type: 'liquid',
                from: 'HPR-01',
                to: evap.tag,
                sizeDN: this.calculatePipeSize(evap.capacity, 'liquid'),
                material: 'steel',
                insulation: true,
                color: 'green'
            });
        });

        // Suction lines (evaporators → compressor)
        components.evaporators.forEach(evap => {
            const targetComp = components.compressors[0].tag; // Simplified
            pipes.push({
                id: `PIPE-SUC-${evap.tag}`,
                type: 'suction',
                from: evap.tag,
                to: targetComp,
                sizeDN: this.calculatePipeSize(evap.capacity, 'suction'),
                material: 'steel',
                insulation: true,
                color: 'blue'
            });
        });

        return pipes;
    }

    /**
     * Calculate pipe size based on capacity and line type
     */
    calculatePipeSize(capacity, lineType) {
        // Simplified sizing (real system would use velocity/pressure drop calculations)
        const sizingTable = {
            discharge: { 50: 'DN32', 100: 'DN50', 200: 'DN65', 500: 'DN80' },
            liquid: { 50: 'DN25', 100: 'DN32', 200: 'DN40', 500: 'DN50' },
            suction: { 50: 'DN65', 100: 'DN80', 200: 'DN100', 500: 'DN125' }
        };

        const table = sizingTable[lineType] || sizingTable.liquid;
        const capacityRanges = Object.keys(table).map(Number).sort((a, b) => a - b);

        for (const range of capacityRanges) {
            if (capacity <= range) return table[range];
        }

        return table[capacityRanges[capacityRanges.length - 1]];
    }

    /**
     * Calculate thermodynamics for variant
     */
    async calculateThermodynamics(components, requirements) {
        try {
            const evapTemp = requirements.evap_temp || -10;
            const condTemp = requirements.cond_temp || 40;

            const cycle = await CoolPropWrapper.calculateAmmoniaCycle(
                evapTemp,
                condTemp,
                5,  // Superheat
                3   // Subcool
            );

            return {
                cop: cycle.performance.COP,
                pressureRatio: cycle.performance.pressure_ratio,
                coolingCapacityPerKg: cycle.performance.cooling_capacity_per_kg / 1000,  // kJ/kg
                compressorWorkPerKg: cycle.performance.compressor_work_per_kg / 1000,
                states: cycle.states
            };
        } catch (error) {
            console.warn(`[DesignGen] Thermodynamic calculation failed: ${error.message}`);
            return null;
        }
    }

    /**
     * Calculate score for variant
     */
    calculateVariantScore(variant, requirements, context) {
        let score = 0;

        // Component count (fewer is sometimes better)
        const totalComponents =
            variant.components.compressors.length +
            variant.components.condensers.length +
            variant.components.evaporators.length;

        score += Math.max(0, 50 - totalComponents * 5); // Penalize complexity

        // Thermodynamic performance
        if (variant.thermodynamics && variant.thermodynamics.cop) {
            score += variant.thermodynamics.cop * 10; // Reward high COP
        }

        // Safety (more accessories = better)
        score += variant.components.accessories.length * 2;

        // Strategy alignment
        if (variant.strategy === 'balanced') score += 10;

        return Math.min(100, score);
    }

    /**
     * Rank variants by score
     */
    rankVariants(variants, requirements) {
        return variants.sort((a, b) => b.score - a.score);
    }
}

module.exports = new DesignGenerator();
