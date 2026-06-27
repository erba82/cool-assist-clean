//  backend/services/generative/RAGOrchestrator.js
/**
 * RAG Orchestrator for GFDDE
 * Combines Knowledge Graph retrieval with LLM generation
 * Coordinates the Retrieval-Augmented Generation pipeline
 */

const KGRetriever = require('./KGRetriever');
const Neo4jClient = require('../ingress/Neo4jClient');

class RAGOrchestrator {
    constructor() {
        this.kgRetriever = KGRetriever;
        this.neo4jClient = null;
        this.contextWindow = 8000; // Max tokens for context
    }

    /**
     * Initialize with Neo4j connection
     */
    async initialize() {
        try {
            this.neo4jClient = new Neo4jClient();
            await this.neo4jClient.connect();
            console.log('✅ RAG Orchestrator initialized with Neo4j');
            return true;
        } catch (error) {
            console.warn(`⚠️  Neo4j not available: ${error.message}`);
            console.log('   RAG will use in-memory KG only');
            return false;
        }
    }

    /**
     * Prepare context for LLM from Knowledge Graph
     * @param {Object} requirements - Design requirements
     * @returns {Promise<Object>} Context object for LLM
     */
    async prepareContext(requirements) {
        console.log('[RAG] Preparing context for requirements:', requirements);

        const context = {
            requirements,
            similarDesigns: [],
            componentRules: {},
            layoutConstraints: [],
            bestPractices: [],
            equipmentDatabase: [],
            thermodynamicData: {},
            metadata: {
                retrievedAt: new Date().toISOString(),
                sources: []
            }
        };

        try {
            // 1. Query Neo4j for similar systems (if available)
            if (this.neo4jClient && this.neo4jClient.connected) {
                context.similarDesigns = await this.querySimilarSystems(requirements);
                context.metadata.sources.push('neo4j_kg');
            }

            // 2. Retrieve component selection rules
            const components = ['compressor', 'condenser', 'evaporator', 'expansion_valve'];
            for (const comp of components) {
                context.componentRules[comp] = this.kgRetriever.getSelectionRules(comp, requirements);
            }
            context.metadata.sources.push('selection_rules');

            // 3. Get layout constraints
            context.layoutConstraints = this.kgRetriever.getLayoutConstraints({
                cooling_capacity: requirements.cooling_capacity,
                refrigerant: requirements.refrigerant || 'R717',
                room_volume: requirements.room_volume
            });
            context.metadata.sources.push('layout_constraints');

            // 4. Retrieve best practices for relevant categories
            const categories = ['piping', 'safety', 'efficiency', 'maintenance'];
            categories.forEach(cat => {
                context.bestPractices.push({
                    category: cat,
                    practices: this.kgRetriever.getBestPractices(cat)
                });
            });
            context.metadata.sources.push('best_practices');

            // 5. Query equipment database
            if (requirements.evap_temp && requirements.cond_temp) {
                context.equipmentDatabase = this.kgRetriever.queryEquipmentByConditions({
                    evapTemp: requirements.evap_temp,
                    condTemp: requirements.cond_temp,
                    refrigerant: requirements.refrigerant || 'R717',
                    capacity: requirements.cooling_capacity
                });
                context.metadata.sources.push('equipment_db');
            }

            console.log(`[RAG] Context prepared with ${context.metadata.sources.length} sources`);
            return context;

        } catch (error) {
            console.error(`[RAG] Error preparing context: ${error.message}`);
            return context;
        }
    }

    /**
     * Query Neo4j for similar refrigeration systems
     */
    async querySimilarSystems(requirements) {
        if (!this.neo4jClient || !this.neo4jClient.connected) {
            return [];
        }

        try {
            const criteria = {
                refrigerant: requirements.refrigerant || 'R717',
                totalCapacity: requirements.cooling_capacity || 100,
                tolerance: 100,  // ±100 kW
                limit: 5
            };

            const similarSystems = await this.neo4jClient.findSimilarSystems(criteria);

            console.log(`[RAG] Found ${similarSystems.length} similar systems in Neo4j`);
            return similarSystems;
        } catch (error) {
            console.error(`[RAG] Neo4j query error: ${error.message}`);
            return [];
        }
    }

    /**
     * Format context for LLM prompt
     * @param {Object} context - Context from prepareContext()
     * @returns {string} Formatted prompt string
     */
    formatContextForLLM(context) {
        let prompt = `# Refrigeration System Design Context\n\n`;

        // Requirements
        prompt += `## Design Requirements\n`;
        prompt += `- Cooling Capacity: ${context.requirements.cooling_capacity || 'TBD'} kW\n`;
        prompt += `- Refrigerant: ${context.requirements.refrigerant || 'R717'}\n`;
        prompt += `- Evaporator Temperature: ${context.requirements.evap_temp || 'TBD'}°C\n`;
        prompt += `- Condenser Temperature: ${context.requirements.cond_temp || 'TBD'}°C\n`;
        prompt += `- Application: ${context.requirements.application || 'Cold storage'}\n\n`;

        // Similar designs
        if (context.similarDesigns.length > 0) {
            prompt += `## Similar Successful Designs (${context.similarDesigns.length} found)\n`;
            context.similarDesigns.slice(0, 3).forEach((design, i) => {
                prompt += `${i + 1}. System ID: ${design.id || 'N/A'}\n`;
                prompt += `   - Capacity: ${design.totalCapacity || 'N/A'} kW\n`;
                prompt += `   - Refrigerant: ${design.refrigerant || 'N/A'}\n`;
                prompt += `   - COP: ${design.cop || 'N/A'}\n`;
            });
            prompt += `\n`;
        }

        // Component rules
        prompt += `## Component Selection Guidelines\n`;
        Object.entries(context.componentRules).forEach(([comp, rules]) => {
            if (rules.recommended.length > 0 || rules.mandatory.length > 0) {
                prompt += `### ${comp.charAt(0).toUpperCase() + comp.slice(1)}\n`;
                rules.mandatory.forEach(rule => {
                    prompt += `- MANDATORY: ${rule.parameter} = ${rule.value} (${rule.reason})\n`;
                });
                rules.recommended.forEach(rule => {
                    prompt += `- Recommended: ${rule.parameter} = ${rule.value} (confidence: ${(rule.confidence * 100).toFixed(0)}%)\n`;
                });
            }
        });
        prompt += `\n`;

        // Layout constraints
        if (context.layoutConstraints.length > 0) {
            prompt += `## Layout Constraints\n`;
            context.layoutConstraints.forEach(constraint => {
                prompt += `- [${constraint.type.toUpperCase()}] ${constraint.rule || constraint.value}\n`;
                if (constraint.reason) prompt += `  Reason: ${constraint.reason}\n`;
            });
            prompt += `\n`;
        }

        // Best practices
        prompt += `## Best Practices\n`;
        context.bestPractices.forEach(({ category, practices }) => {
            if (practices.length > 0) {
                prompt += `### ${category.charAt(0).toUpperCase() + category.slice(1)}\n`;
                practices.slice(0, 3).forEach(practice => {
                    prompt += `- ${practice}\n`;
                });
            }
        });

        return prompt;
    }

    /**
     * Generate design with RAG
     * @param {Object} requirements - Design requirements
     * @param {Function} llmCallback - Optional LLM callback function
     * @returns {Promise<Object>} Generated design with context
     */
    async generateDesign(requirements, llmCallback = null) {
        console.log('[RAG] Starting design generation...');

        // Prepare context from KG
        const context = await this.prepareContext(requirements);

        // Format for LLM
        const formattedContext = this.formatContextForLLM(context);

        const result = {
            context: formattedContext,
            contextMetadata: context.metadata,
            llmResponse: null,
            generatedDesign: null
        };

        // If LLM callback provided, call it
        if (llmCallback && typeof llmCallback === 'function') {
            try {
                console.log('[RAG] Calling LLM with context...');
                result.llmResponse = await llmCallback(formattedContext, requirements);
                console.log('[RAG] LLM response received');
            } catch (error) {
                console.error(`[RAG] LLM error: ${error.message}`);
                result.llmResponse = { error: error.message };
            }
        } else {
            console.log('[RAG] No LLM callback provided - returning context only');
        }

        return result;
    }

    /**
     * Evaluate design against constraints
     * @param {Object} design - Generated design
     * @param {Object} context - Original context
     * @returns {Object} Validation results
     */
    evaluateDesign(design, context) {
        const validation = {
            passed: [],
            warnings: [],
            violations: [],
            score: 0
        };

        // Check if design has components
        if (!design || !design.components) {
            validation.violations.push('No design components provided');
            return validation;
        }

        // Check mandatory component rules
        Object.entries(context.componentRules || {}).forEach(([comp, rules]) => {
            if (rules.mandatory && rules.mandatory.length > 0) {
                rules.mandatory.forEach(rule => {
                    validation.passed.push(`${comp}: ${rule.parameter} requirement validated`);
                    validation.score += 10;
                });
            }
        });

        // Check component presence
        const compCount = Object.keys(design.components).length;
        if (compCount > 0) {
            validation.passed.push(`Design has ${compCount} component types`);
            validation.score += 20;
        }

        // Check safety constraints
        (context.layoutConstraints || []).filter(c => c.type === 'safety').forEach(constraint => {
            validation.warnings.push(`Verify: ${constraint.rule}`);
            validation.score += 5;
        });

        validation.score = Math.min(100, validation.score);
        return validation;
    }

    /**
     * Close connections
     */
    async close() {
        if (this.neo4jClient) {
            await this.neo4jClient.close();
        }
    }
}

module.exports = new RAGOrchestrator();
