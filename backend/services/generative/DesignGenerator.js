// backend/services/generative/DesignGenerator.js
/**
 * Design Generator for GFDDE
 * Generates multiple design variants using RAG pipeline
 * Part of Phase 2.1: KG-RAG Framework
 */

const RAGOrchestrator = require('./RAGOrchestrator');
const { CoolPropSidecarClient } = require('../../core/engineering/CoolPropSidecarClient');
const { getProviderStatus } = require('../../core/engineering/ThermophysicalProviderRegistry');
const { normalizeRefrigerant, getRefrigerantProfile } = require('../../core/data/RefrigerantProfiles');
const { CatalogueRepository } = require('../../core/engineering/CatalogueRepository');

class DesignGenerator {
    constructor() {
        this.ragOrchestrator = RAGOrchestrator;
        this.catalogueRepository = new CatalogueRepository();
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
        const refrigerant = normalizeRefrigerant(requirements.refrigerant || 'R717');
        const profile = getRefrigerantProfile(refrigerant);
        if (!profile) throw new Error(`No refrigerant profile is registered for ${refrigerant}.`);
        const capacity = Number(requirements.cooling_capacity);
        const declaredCapacity = Number.isFinite(capacity) && capacity > 0 ? capacity : null;
        const strategyMultipliers = {
            conservative: { safety: 1.3 },
            balanced: { safety: 1.1 },
            aggressive: { safety: 1.0 }
        };
        const multiplier = strategyMultipliers[strategy] || strategyMultipliers.balanced;
        const compressorEvidence = this.catalogueRepository.resolve('compressor', profile.compressor, refrigerant);
        const condenserEvidence = this.catalogueRepository.resolve('condenser', profile.heatRejection, refrigerant);
        const evaporatorCount = variantIndex % 2 === 0 ? 2 : 3;
        const isBooster = profile.cycle === 'co2_transcritical_booster';
        const baseCompressor = {
            type: profile.compressor.family,
            capacity: declaredCapacity ? declaredCapacity * multiplier.safety : null,
            refrigerant,
            manufacturerIntent: profile.compressor.manufacturer || null,
            model: compressorEvidence.compatibleWithSelectedRefrigerant ? compressorEvidence.model : null,
            selectionStatus: compressorEvidence.status,
            selectionReason: compressorEvidence.reason || null
        };
        const components = {
            refrigerant,
            profileId: profile.id,
            cycle: profile.cycle,
            pipingPolicy: profile.piping,
            equipmentEvidence: { compressor: compressorEvidence, condenser: condenserEvidence },
            compressors: isBooster
                ? [
                    { ...baseCompressor, tag: 'CMP-LT-01', stage: 'low_temperature_booster', capacity: declaredCapacity ? declaredCapacity * 0.5 * multiplier.safety : null },
                    { ...baseCompressor, tag: 'CMP-MT-01', stage: 'medium_temperature_high_stage', capacity: declaredCapacity ? declaredCapacity * 0.5 * multiplier.safety : null }
                  ]
                : [{ ...baseCompressor, tag: 'CMP-01', stage: 'single_stage_or_profile_review' }],
            condensers: [{
                tag: profile.heatRejection.type === 'gas_cooler' ? 'GC-01' : 'COND-01',
                type: profile.heatRejection.type,
                capacity: declaredCapacity ? declaredCapacity * multiplier.safety : null,
                refrigerant,
                manufacturerIntent: profile.heatRejection.manufacturer || null,
                model: condenserEvidence.compatibleWithSelectedRefrigerant ? condenserEvidence.model : null,
                selectionStatus: condenserEvidence.status,
                selectionReason: condenserEvidence.reason || null
            }],
            evaporators: [],
            receiver: {
                tag: isBooster ? 'FGR-01' : 'RCV-01',
                type: profile.liquidManagement.receiver,
                volume: null,
                refrigerant,
                selectionStatus: 'manufacturer-sizing-required',
                selectionReason: 'Vessel volume, pressure class, nozzle configuration and manufacturer source data are required.'
            },
            expansionValves: [],
            accessories: (profile.safeguards || []).map((safeguard) => ({
                type: 'profile-safeguard',
                safeguard,
                selectionStatus: 'project-safety-review-required'
            }))
        };

        for (let index = 0; index < evaporatorCount; index++) {
            const tag = `EVP-${String(index + 1).padStart(2, '0')}`;
            const evaporatorEvidence = this.catalogueRepository.resolve('evaporator', {}, refrigerant);
            components.evaporators.push({
                tag,
                type: profile.feedMethod === 'pumped_recirculated' ? 'recirculated_air_cooler' : 'direct_expansion_air_cooler',
                model: evaporatorEvidence.compatibleWithSelectedRefrigerant ? evaporatorEvidence.model : null,
                capacity: declaredCapacity ? declaredCapacity / evaporatorCount : null,
                refrigerant,
                feedMethod: profile.feedMethod,
                selectionStatus: evaporatorEvidence.status,
                selectionReason: evaporatorEvidence.reason || null
            });
            components.expansionValves.push({
                tag: `LV-${String(index + 1).padStart(2, '0')}`,
                type: profile.liquidManagement.conditioning || 'liquid-control-device',
                model: null,
                refrigerant,
                capacity: declaredCapacity ? declaredCapacity / evaporatorCount : null,
                servesEvaporator: tag,
                selectionStatus: 'dn-and-manufacturer-capacity-map-required'
            });
        }

        // Preserve RAG knowledge as review evidence only; never turn it into an unverified component model.
        components.contextSafetyEvidenceAvailable = Boolean(context?.bestPractices?.some((practice) => practice.category === 'safety'));
        return components;
    }

    /**
     * Design piping system
     */
    designPiping(components, _context, _strategy) {
        const pipes = [];
        const condenserTag = components.condensers[0]?.tag || null;
        const receiverTag = components.receiver?.tag || null;
        const policy = components.pipingPolicy || {};
        const material = policy.material || null;
        const jointType = policy.jointType || null;
        const pipe = (id, type, from, to, capacity, insulation, color) => ({
            id,
            type,
            from,
            to,
            sizeDN: this.calculatePipeSize(capacity, type),
            sizingStatus: 'validated-pressure-drop-calculation-required',
            material,
            jointType,
            insulation,
            color,
            refrigerant: components.refrigerant
        });

        components.compressors.forEach((compressor) => {
            pipes.push(pipe(`PIPE-DISCH-${compressor.tag}`, 'discharge', compressor.tag, condenserTag, compressor.capacity, false, 'red'));
        });
        if (condenserTag && receiverTag) {
            pipes.push(pipe('PIPE-LIQ-MAIN', 'liquid', condenserTag, receiverTag, components.condensers[0].capacity, true, 'green'));
        }
        components.evaporators.forEach((evaporator) => {
            if (receiverTag) pipes.push(pipe(`PIPE-LIQ-${evaporator.tag}`, 'liquid', receiverTag, evaporator.tag, evaporator.capacity, true, 'green'));
            const targetCompressor = components.compressors[0]?.tag || null;
            if (targetCompressor) pipes.push(pipe(`PIPE-SUC-${evaporator.tag}`, 'suction', evaporator.tag, targetCompressor, evaporator.capacity, true, 'blue'));
        });
        return pipes;
    }

    /**
     * Calculate pipe size based on capacity and line type
     */
    calculatePipeSize(capacity, lineType) {
        if (!Number.isFinite(Number(capacity)) || Number(capacity) <= 0) return null;
        // Legacy nominal lookup is preliminary only; final DN requires the governed hydraulic calculation path.
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
    async calculateThermodynamics(_components, requirements) {
        const refrigerant = normalizeRefrigerant(requirements.refrigerant || 'R717');
        const evapTempC = Number(requirements.evap_temp);
        const condTempC = Number(requirements.cond_temp);
        const loadKW = Number(requirements.cooling_capacity);
        const provider = getProviderStatus();

        if (!Number.isFinite(evapTempC) || !Number.isFinite(condTempC) || !Number.isFinite(loadKW) || loadKW <= 0) {
            return {
                status: 'input-review-required',
                refrigerant,
                reviewRequired: true,
                note: 'evap_temp, cond_temp and cooling_capacity must be explicit finite design inputs before a property-based cycle can be evaluated.'
            };
        }
        if (provider.activeProvider?.providerId !== 'coolprop' || !provider.outboundCallsEnabled || provider.blockers.length) {
            return {
                status: 'validated-property-provider-required',
                refrigerant,
                reviewRequired: true,
                note: 'No approved local CoolProp sidecar is active. Thermodynamic values are intentionally not substituted from another refrigerant or a fixed COP.'
            };
        }

        try {
            const client = new CoolPropSidecarClient();
            if (refrigerant === 'R744') {
                const highSidePressurePa = Number(requirements.highSidePressurePa);
                const flashGasPressurePa = Number(requirements.flashGasPressurePa);
                const gasCoolerOutletTempC = Number(requirements.gasCoolerOutletTempC);
                if (!Number.isFinite(highSidePressurePa) || !Number.isFinite(flashGasPressurePa) || !Number.isFinite(gasCoolerOutletTempC)) {
                    return {
                        status: 'r744-operating-controls-required',
                        refrigerant,
                        reviewRequired: true,
                        note: 'R744 transcritical booster calculation requires explicit highSidePressurePa, flashGasPressurePa and gasCoolerOutletTempC. No high-pressure control setpoint is invented.'
                    };
                }
                const cycle = await client.calculateR744TranscriticalBoosterCycle({
                    evapTempK: evapTempC + 273.15,
                    gasCoolerOutletTempK: gasCoolerOutletTempC + 273.15,
                    highSidePressurePa,
                    flashGasPressurePa,
                    superheatK: Number.isFinite(Number(requirements.superheatK)) ? Number(requirements.superheatK) : 5,
                    lowStageIsentropicEfficiency: Number.isFinite(Number(requirements.lowStageIsentropicEfficiency)) ? Number(requirements.lowStageIsentropicEfficiency) : 0.75,
                    highStageIsentropicEfficiency: Number.isFinite(Number(requirements.highStageIsentropicEfficiency)) ? Number(requirements.highStageIsentropicEfficiency) : 0.75,
                    loadW: loadKW * 1000
                });
                return {
                    status: 'coolprop-r744-transcritical-booster-review-required',
                    refrigerant,
                    cop: cycle.performanceSI.cop,
                    pressureRatio: null,
                    coolingCapacityPerKg: cycle.performanceSI.refrigeratingEffectJPerKg / 1000,
                    compressorWorkPerKg: null,
                    states: cycle.cycle,
                    performanceSI: cycle.performanceSI,
                    provenance: cycle.provenance,
                    reviewRequired: true,
                    note: 'Provider-based preliminary R744 transcritical booster cycle. The supplied pressure controls are not optimized and manufacturer-map review remains mandatory.'
                };
            }
            const cycle = await client.calculateSimpleVaporCompressionCycle({
                refrigerant,
                evapTempK: evapTempC + 273.15,
                condTempK: condTempC + 273.15,
                superheatK: Number.isFinite(Number(requirements.superheatK)) ? Number(requirements.superheatK) : 5,
                subcoolK: Number.isFinite(Number(requirements.subcoolK)) ? Number(requirements.subcoolK) : 3,
                compressorIsentropicEfficiency: Number.isFinite(Number(requirements.compressorIsentropicEfficiency))
                    ? Number(requirements.compressorIsentropicEfficiency)
                    : 0.75,
                loadW: loadKW * 1000
            });
            return {
                status: 'coolprop-provider-result-review-required',
                refrigerant,
                cop: cycle.performanceSI.cop,
                pressureRatio: cycle.performanceSI.pressureRatio,
                coolingCapacityPerKg: cycle.performanceSI.refrigeratingEffectJPerKg / 1000,
                compressorWorkPerKg: cycle.performanceSI.compressorSpecificWorkJPerKg / 1000,
                states: cycle.cycle,
                provenance: cycle.provenance,
                reviewRequired: true,
                note: 'Provider-based preliminary cycle. Manufacturer performance maps and equipment-envelope review remain mandatory.'
            };
        } catch (error) {
            console.warn(`[DesignGen] Property-based thermodynamic calculation blocked: ${error.message}`);
            return {
                status: 'provider-calculation-blocked',
                refrigerant,
                reviewRequired: true,
                note: error.message
            };
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
