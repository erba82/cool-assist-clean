// backend/services/generative/KGRetriever.js
/**
 * Knowledge Graph Retriever for GFDDE
 * Queries the KG to find similar designs, best practices, and constraints
 * Part of the KG-RAG (Knowledge Graph-Retrieval Augmented Generation) framework
 */

class KGRetriever {
    constructor(knowledgeGraph = null) {
        this.kg = knowledgeGraph;
        this.cache = new Map();
    }

    /**
     * Set the Knowledge Graph for querying
     */
    setKnowledgeGraph(kg) {
        this.kg = kg;
        this.cache.clear(); // Clear cache when KG changes
    }

    /**
     * Find similar system designs based on requirements
     * @param {Object} requirements - Design requirements (capacity, temperatures, etc.)
     * @returns {Array} Similar design patterns from KG
     */
    findSimilarDesigns(requirements) {
        if (!this.kg) return [];

        const cacheKey = JSON.stringify(requirements);
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        const similar = [];
        const nodes = this.kg.rawGraph?.nodes || [];

        // Find systems with similar capacity requirements
        const targetCapacity = requirements.cooling_capacity || 100; // kW
        const tolerance = 0.3; // 30% tolerance

        for (const node of nodes) {
            if (node.type === 'evaporator' && node.properties?.capacity) {
                const nodeCapacity = node.properties.capacity;
                const ratio = nodeCapacity / targetCapacity;

                if (ratio >= (1 - tolerance) && ratio <= (1 + tolerance)) {
                    similar.push({
                        node: node,
                        similarity: 1 - Math.abs(1 - ratio),
                        matchType: 'capacity'
                    });
                }
            }
        }

        // Sort by similarity
        similar.sort((a, b) => b.similarity - a.similarity);

        this.cache.set(cacheKey, similar.slice(0, 10)); // Cache top 10
        return similar.slice(0, 10);
    }

    /**
     * Retrieve component selection rules from KG
     * @param {string} componentType - Type of component (e.g., 'compressor', 'valve')
     * @param {Object} context - Operating context (refrigerant, temperatures, capacity)
     * @returns {Object} Selection rules and constraints
     */
    getSelectionRules(componentType, context) {
        const rules = {
            componentType,
            mandatory: [],
            recommended: [],
            constraints: []
        };

        // Extract rules from KG based on historical successful designs
        const nodes = this.kg?.rawGraph?.nodes || [];
        const relevantNodes = nodes.filter(n => n.type === componentType);

        if (relevantNodes.length > 0) {
            // Analyze patterns in successful designs
            const sizes = relevantNodes.map(n => n.properties?.size).filter(Boolean);
            const manufacturers = relevantNodes.map(n => n.properties?.manufacturer).filter(Boolean);

            if (sizes.length > 0) {
                const avgSize = sizes.reduce((a, b) => a + b, 0) / sizes.length;
                rules.recommended.push({
                    parameter: 'size',
                    value: Math.round(avgSize),
                    confidence: 0.7
                });
            }

            if (manufacturers.length > 0) {
                const manufacturerCounts = {};
                manufacturers.forEach(m => {
                    manufacturerCounts[m] = (manufacturerCounts[m] || 0) + 1;
                });
                const mostCommon = Object.entries(manufacturerCounts)
                    .sort(([, a], [, b]) => b - a)[0];

                if (mostCommon) {
                    rules.recommended.push({
                        parameter: 'manufacturer',
                        value: mostCommon[0],
                        confidence: mostCommon[1] / manufacturers.length
                    });
                }
            }
        }

        // Add industry-standard constraints
        if (componentType === 'compressor' && context.refrigerant === 'R717') {
            rules.constraints.push({
                type: 'material_compatibility',
                rule: 'Avoid copper and copper alloys',
                severity: 'critical'
            });
        }

        if (componentType === 'solenoid_valve') {
            rules.mandatory.push({
                parameter: 'coil_type',
                value: 'hermetic',
                reason: 'Prevent refrigerant leakage'
            });
        }

        return rules;
    }

    /**
     * Retrieve piping layout constraints from similar systems
     * @param {Object} systemSpec - System specifications
     * @returns {Array} Layout constraints
     */
    getLayoutConstraints(systemSpec) {
        const constraints = [];

        // Minimum pipe sizes based on capacity
        const capacity = systemSpec.cooling_capacity || 100;
        if (capacity > 500) {
            constraints.push({
                type: 'minimum_pipe_size',
                value: 'DN80',
                reason: 'High capacity requires larger piping to minimize pressure drop'
            });
        }

        // Refrigerant-specific constraints
        if (systemSpec.refrigerant === 'R717') {
            constraints.push({
                type: 'pipe_routing',
                rule: 'Avoid long horizontal runs in suction lines',
                reason: 'Prevent oil trapping'
            });

            constraints.push({
                type: 'safety',
                rule: 'Install ammonia detectors with any indoor piping',
                reason: 'ASHRAE 15 requirement for B-class refrigerants'
            });
        }

        if (systemSpec.refrigerant === 'R32' || systemSpec.refrigerant === 'R744') {
            constraints.push({
                type: 'safety',
                rule: `Maximum charge limit: ${this.calculateChargeLimitA2L(systemSpec)}`,
                reason: 'ASHRAE 15.2-2022 for A2L refrigerants'
            });
        }

        // Flow direction constraints
        constraints.push({
            type: 'flow_direction',
            rule: 'Size risers for minimum velocity of 7.5 m/s',
            reason: 'Ensure oil return to compressor'
        });

        return constraints;
    }

    /**
     * Calculate refrigerant charge limit for A2L refrigerants
     * Based on ASHRAE 15.2-2022
     */
    calculateChargeLimitA2L(systemSpec) {
        const roomVolume = systemSpec.room_volume || 50; // m³
        const LFL = 144000; // ppm for R32 (example)
        const safetyFactor = 0.25; // 25% of LFL

        // Simplified calculation
        const maxConcentration = LFL * safetyFactor;
        const maxCharge = (maxConcentration / 1000000) * roomVolume * 52; // Molecular weight R32

        return `${maxCharge.toFixed(2)} kg for ${roomVolume} m³ room`;
    }

    /**
     * Get best practices from KG
     * @param {string} category - Category (e.g., 'piping', 'safety', 'efficiency')
     * @returns {Array} Best practices
     */
    getBestPractices(category) {
        const practices = {
            piping: [
                'Use suction line accumulators to prevent liquid slugging',
                'Install vibration eliminators near compressors',
                'Slope suction lines 1/2" per 10 feet toward compressor',
                'Use eccentric reducers (flat side up) in horizontal suction lines'
            ],
            safety: [
                'Install pressure relief valves on all vessels',
                'Provide emergency ventilation in machinery rooms',
                'Label all refrigerant piping per ANSI/ASME A13.1',
                'Install leak detectors with automatic shutdown'
            ],
            efficiency: [
                'Subcool liquid refrigerant by 5-10°F',
                'Superheat suction gas by 5-10°F',
                'Minimize pressure drop in suction lines (<2 psi)',
                'Use hot gas defrost where applicable'
            ],
            maintenance: [
                'Install service valves on all major components',
                'Provide sight glasses on liquid lines',
                'Install filter-driers with replaceable cores',
                'Use vibration isolators on pumps and compressors'
            ]
        };

        return practices[category] || [];
    }

    /**
     * Query KG for equipment at specific operating conditions
     * @param {Object} conditions - Operating conditions
     * @returns {Array} Suitable equipment from KG
     */
    queryEquipmentByConditions(conditions) {
        const { evapTemp, condTemp, refrigerant, capacity } = conditions;

        const suitableEquipment = [];
        const nodes = this.kg?.rawGraph?.nodes || [];

        for (const node of nodes) {
            if (node.type === 'compressor') {
                // Check if compressor can handle these conditions
                const metadata = node.metadata || {};

                if (metadata.refrigerant === refrigerant || metadata.refrigerant === 'multi') {
                    suitableEquipment.push({
                        nodeId: node.id,
                        type: node.type,
                        model: node.properties?.model,
                        capacity: metadata.capacity,
                        efficiency: metadata.cop,
                        matchScore: this.calculateMatchScore(metadata, conditions)
                    });
                }
            }
        }

        return suitableEquipment.sort((a, b) => b.matchScore - a.matchScore);
    }

    calculateMatchScore(equipment, required) {
        let score = 0;

        // Capacity match (most important)
        if (equipment.capacity && required.capacity) {
            const ratio = equipment.capacity / required.capacity;
            if (ratio >= 0.9 && ratio <= 1.1) score += 50;
            else if (ratio >= 0.7 && ratio <= 1.3) score += 30;
            else score += 10;
        }

        // Refrigerant match
        if (equipment.refrigerant === required.refrigerant) score += 30;

        // Efficiency bonus
        if (equipment.cop > 3.5) score += 20;

        return score;
    }
}

module.exports = new KGRetriever();
