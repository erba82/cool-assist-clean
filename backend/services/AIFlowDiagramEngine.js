/**
 * AI-Powered Flow Diagram Generation Engine
 * Uses Gemini AI to intelligently design P&ID diagrams based on:
 * - Project specifications
 * - Equipment selections
 * - ASHRAE/ISO standards
 * - Industry best practices
 * - Historical system knowledge (RAG)
 */

const { GoogleGenerativeAI } = require("@google/generative-ai");
const OllamaService = require('./OllamaService');
const AIServiceRouter = require('./AIServiceRouter'); // NEW: Add the AI Service Router
const ValveSelectionEngine = require("./ValveSelectionEngine");
const RAGOrchestrator = require("./generative/RAGOrchestrator");
const DesignGenerator = require("./generative/DesignGenerator");

class AIFlowDiagramEngine {
    constructor() {
        const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
        if (apiKey) {
            this.genAI = new GoogleGenerativeAI(apiKey);
            this.model = this.genAI.getGenerativeModel({
                model: "gemini-2.0-flash-thinking-exp-1219"
            });
            this.hasAI = true;
        } else {
            this.hasAI = false;
            console.warn('⚠️  No Gemini API key - AI features disabled');
        }
        
        // Initialize Ollama as fallback
        this.ollamaService = new OllamaService();
        
        // NEW: Initialize AI Service Router for intelligent model selection
        this.aiServiceRouter = new AIServiceRouter();
        
        // RAG integration from Phase 2.1
        this.ragOrchestrator = RAGOrchestrator;
        this.designGenerator = DesignGenerator;
    }

    /**
     * Generate P&ID from natural language description (Phase 2.3)
     * @param {string} userPrompt - Natural language description
     * @param {object} additionalContext - Optional additional requirements
     * @returns {object} - Complete design with variants
     */
    async generateFromNaturalLanguage(userPrompt, additionalContext = {}) {
        console.log('\n🤖 Phase 2.3: Natural Language P&ID Generation');
        console.log(`📝 User Prompt: "${userPrompt}"\n`);

        // Step 1: Extract requirements from natural language
        const requirements = await this.extractRequirements(userPrompt, additionalContext);
        console.log('✅ Requirements extracted from natural language');

        // Step 2: Prepare RAG context
        await this.ragOrchestrator.initialize();
        const ragContext = await this.ragOrchestrator.prepareContext(requirements);
        console.log(`✅ RAG context prepared (${ragContext.metadata.sources.length} sources)`);

        // Step 3: Generate design variants using DesignGenerator
        const variants = await this.designGenerator.generateVariants(requirements, {
            variantCount: 3,
            strategy: 'balanced',
            includeThermodynamics: true
        });
        console.log(`✅ Generated ${variants.length} design variants`);

        // Step 4: If AI available, enhance with Gemini
        let aiEnhancedDesign = null;
        if (this.hasAI) {
            try {
                aiEnhancedDesign = await this.enhanceWithAI(
                    userPrompt,
                    requirements,
                    ragContext,
                    variants[0]  // Use top variant
                );
                console.log('✅ Design enhanced with Gemini AI');
            } catch (error) {
                console.warn(`⚠️  AI enhancement failed: ${error.message}`);
            }
        }

        return {
            userPrompt,
            requirements,
            ragContext: {
                sources: ragContext.metadata.sources,
                similarSystems: ragContext.similarDesigns.length,
                constraints: ragContext.layoutConstraints.length
            },
            variants,
            topVariant: variants[0],
            aiEnhanced: aiEnhancedDesign,
            metadata: {
                generatedAt: new Date().toISOString(),
                hasAI: this.hasAI,
                phase: '2.3'
            }
        };
    }

    /**
     * Extract structured requirements from natural language
     */
    async extractRequirements(userPrompt, additionalContext) {
        const requirements = {
            cooling_capacity: null,
            evap_temp: null,
            cond_temp: null,
            refrigerant: 'R717',  // Default
            application: 'cold_storage',
            room_volume: null,
            productType: null,
            ...additionalContext
        };

        // Simple keyword extraction (in production, use NLP or AI)
        const lowerPrompt = userPrompt.toLowerCase();

        // Extract capacity
        const capacityMatch = lowerPrompt.match(/(\d+)\s*(kw|kilowatt)/i);
        if (capacityMatch) {
            requirements.cooling_capacity = parseInt(capacityMatch[1]);
        } else {
            // Estimate from product mass
            const massMatch = lowerPrompt.match(/(\d+)\s*(kg|ton|tonne)/i);
            if (massMatch) {
                const mass = parseInt(massMatch[1]);
                const unit = massMatch[2].toLowerCase();
                const massKg = unit.startsWith('ton') ? mass * 1000 : mass;
                // Rough estimate: 0.15 kW per kg for freezing
                requirements.cooling_capacity = Math.ceil(massKg * 0.15);
            }
        }

        // Extract temperatures
        const tempMatch = lowerPrompt.match(/(-?\d+)\s*°?c/i);
        if (tempMatch) {
            requirements.evap_temp = parseInt(tempMatch[1]);
        }

        // Infer condenser temp (typically 35-40°C for air-cooled)
        requirements.cond_temp = 40;

        // Extract product type
        const products = ['meat', 'fish', 'dairy', 'vegetables', 'fruit', 'ice cream'];
        for (const product of products) {
            if (lowerPrompt.includes(product)) {
                requirements.productType = product;
                break;
            }
        }

        // Default capacity if not found
        if (!requirements.cooling_capacity) {
            requirements.cooling_capacity = 100;  // Default 100 kW
        }

        // Default evap temp based on product
        if (!requirements.evap_temp) {
            if (lowerPrompt.includes('freez')) {
                requirements.evap_temp = -30;  // Blast freezing
            } else if (lowerPrompt.includes('cold') || lowerPrompt.includes('chill')) {
                requirements.evap_temp = -5;   // Cold storage
            } else {
                requirements.evap_temp = -10;  // Default
            }
        }

        return requirements;
    }

    /**
     * Enhance design with Gemini AI
     */
    async enhanceWithAI(userPrompt, requirements, ragContext, topVariant) {
        if (!this.hasAI) {
            return null;
        }

        // Format RAG context for AI
        const contextPrompt = this.ragOrchestrator.formatContextForLLM(ragContext);

        const prompt = `
You are an expert refrigeration engineer. A user requested:

"${userPrompt}"

Based on this, we extracted the following requirements and generated a design:

# EXTRACTED REQUIREMENTS
${JSON.stringify(requirements, null, 2)}

# KNOWLEDGE GRAPH CONTEXT (RAG)
${contextPrompt}

# GENERATED DESIGN (Top Variant)
Score: ${topVariant.score}
Strategy: ${topVariant.strategy}

Components:
${JSON.stringify(topVariant.components, null, 2)}

Piping:
${JSON.stringify(topVariant.piping, null, 2)}

Thermodynamics:
${topVariant.thermodynamics ? JSON.stringify(topVariant.thermodynamics, null, 2) : 'Not calculated'}

# YOUR TASK
Review this design and provide:
1. Validation of the design against ASHRAE standards
2. Suggestions for improvement
3. Any missing components or safety considerations
4. P&ID layout recommendations

Respond in JSON format:
{
  "validation": {
    "compliant": boolean,
    "issues": [array of issues],
    "score": 0-100
  },
  "suggestions": [array of improvement suggestions],
  "missingComponents": [array of missing items],
  "safetyNotes": [array of safety considerations],
  "layoutRecommendations": "text description"
}
`;

        try {
            const result = await this.model.generateContent(prompt);
            const responseText = result.response.text();

            // Extract JSON from response
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }

            return { rawResponse: responseText };
        } catch (error) {
            console.error('AI enhancement error:', error.message);
            return null;
        }
    }

    /**
     * Generate complete P&ID using AI intelligence (Existing method)
     * @param {object} equipment - Selected equipment
     * @param {object} loads - Calculated loads
     * @param {object} specs - Project specifications
     * @returns {object} - { nodes, edges } for React Flow
     */
    async generateIntelligentPID(equipment, loads, specs) {
        console.log('\n🤖 AI-Powered P&ID Generation Started...\n');

        // Prepare comprehensive context for AI
        const context = this.prepareContext(equipment, loads, specs);

        // Ask AI to design the P&ID
        const aiDesign = await this.requestAIDesign(context);

        // Convert AI design to React Flow format
        const flowDiagram = this.convertToReactFlow(aiDesign, equipment, loads);

        console.log('✅ AI-Powered P&ID Generation Complete!\n');
        return flowDiagram;
    }

    /**
     * Prepare comprehensive context for AI
     */
    prepareContext(equipment, loads, specs) {
        return {
            projectInfo: specs.projectInfo,
            systemType: loads.total.booster > 0 ? 'Two-Stage Ammonia' : 'Single-Stage Ammonia',
            totalLoad: {
                booster: loads.total.booster,
                highStage: loads.total.highStage
            },
            rooms: loads.rooms.map(r => ({
                name: r.name,
                count: r.count || 1,
                type: r.type,
                temp: r.temp,
                loadKW: r.loadKW,
                totalKW: r.totalKW,
                evaporators: r.evapSelection
            })),
            equipment: {
                compressors: equipment.compressors.map(c => ({
                    tag: c.tag,
                    type: c.type,
                    stage: c.stage,
                    capacity: c.capacity,
                    manufacturer: c.manufacturer,
                    model: c.model
                })),
                condenser: equipment.condenser,
                vessels: equipment.vessels,
                pumps: equipment.pumps || [],
                evaporators: equipment.evaporators || []
            },
            standards: {
                piping: 'ASME B31.5',
                vessels: 'ASME Section VIII',
                pid: 'ISO 14617',
                safety: 'IIAR 2'
            }
        };
    }

    /**
     * Request AI to design the P&ID
     */
    async requestAIDesign(context) {
        const prompt = `
You are an expert refrigeration engineer designing a Process & Instrumentation Diagram (P&ID) for an industrial ammonia refrigeration system.

# PROJECT CONTEXT
${JSON.stringify(context, null, 2)}

# YOUR TASK
Design a complete, professional P&ID following these requirements:

## 1. LAYOUT STRATEGY
- **Intelligent Layout**: You are free to arrange components logically based on flow.
- **Flow Direction**: Generally Top-to-Bottom or Left-to-Right for major flows.
- **Grouping**: Group related equipment (e.g., Valve Stations near Evaporators).
- **Avoid Overlaps**: Ensure sufficient spacing (minimum 150px horizontal, 150px vertical).
- **Standard Layers (Guideline only, not strict)**:
  * High Side (Condensers, Receivers) -> Top/Right
  * Compressors -> Middle/Bottom
  * Low Side (Evaporators) -> Bottom/Left

## 2. EQUIPMENT PLACEMENT
For EACH component, specify:
- ID, componentType, x, y coordinates
- label: equipment name
- metadata: capacity, size, etc.

## 3. PIPING CONNECTIONS
For EACH pipe, specify: source, target, label, pipeType, sizeDN

# OUTPUT FORMAT
Provide ONLY a valid JSON object (no markdown code blocks):

{
  "design_rationale": "Brief explanation of your design choices",
  "generatedBy": "AI Assistant",
  "nodes": [
    {"id": "COND", "componentType": "evaporative_condenser", "x": 600, "y": 100, "label": "Condenser Model", "metadata": {}},
    {"id": "HPR", "componentType": "receiver", "x": 600, "y": 250, "label": "HP Receiver", "metadata": {}}
  ],
  "edges": [
    {"source": "COND", "target": "HPR", "label": "Liquid DN100", "pipeType": "liquid", "sizeDN": 100}
  ]
}

CRITICAL: Output ONLY valid JSON, no other text.
`;
        
        // If Google AI is not available, use Ollama as fallback
        if (!this.hasAI) {
            if (this.ollamaService && this.ollamaService.available) {
                console.log('🔄 Using Ollama for P&ID design');
                return await this.requestAIDesignWithOllama(prompt, context);
            } else {
                console.warn('⚠️ No AI services available - using fallback design');
                return this.getFallbackDesign(context);
            }
        }

        try {
            // Use standard flash model for better reliability
            const model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

            const result = await model.generateContent(prompt, {
                generationConfig: {
                    temperature: 0, // Deterministic output
                    maxOutputTokens: 8192
                }
            });

            let responseText = result.response.text();
            console.log('AI Raw Response Length:', responseText.length);

            // Clean response - remove markdown code blocks if present
            responseText = responseText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

            // Extract JSON from response
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                console.error('AI Response (first 500 chars):', responseText.substring(0, 500));
                throw new Error("AI response did not contain valid JSON");
            }

            const aiDesign = JSON.parse(jsonMatch[0]);

            // Validate design
            if (!aiDesign.nodes || !Array.isArray(aiDesign.nodes) || aiDesign.nodes.length === 0) {
                throw new Error("AI design has no nodes");
            }

            console.log('✅ AI Design Rationale:', aiDesign.design_rationale);
            console.log(`✅ Generated ${aiDesign.nodes.length} nodes and ${aiDesign.edges?.length || 0} edges`);

            return aiDesign;
        } catch (error) {
            console.error('❌ AI Design Generation Error:', error.message);
            console.error('Full error:', error);
            throw error; // Re-throw to trigger fallback in parent
        }
    }

    /**
     * Request AI design using Ollama
     */
    async requestAIDesignWithOllama(prompt, context) {
        try {
            // NEW: Use AI Service Router with diagram_generation task type for intelligent model selection
            const result = await this.aiServiceRouter.chat(prompt, 'pid_generation');
            
            if (!result.success) {
                console.error('❌ Ollama design generation failed:', result.error);
                return this.getFallbackDesign(context);
            }
            
            let responseText = result.message;
            console.log('Ollama Raw Response Length:', responseText.length);

            // Clean response - remove markdown code blocks if present
            responseText = responseText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

            // Extract JSON from response
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                console.error('Ollama Response (first 500 chars):', responseText.substring(0, 500));
                throw new Error("Ollama response did not contain valid JSON");
            }

            const aiDesign = JSON.parse(jsonMatch[0]);

            // Validate design
            if (!aiDesign.nodes || !Array.isArray(aiDesign.nodes) || aiDesign.nodes.length === 0) {
                throw new Error("Ollama design has no nodes");
            }

            console.log('✅ Ollama Design Rationale:', aiDesign.design_rationale);
            console.log(`✅ Generated ${aiDesign.nodes.length} nodes and ${aiDesign.edges?.length || 0} edges`);

            return aiDesign;
        } catch (error) {
            console.error('❌ Ollama Design Generation Error:', error.message);
            console.error('Full error:', error);
            // Return fallback design
            return this.getFallbackDesign(context);
        }
    }

    /**
     * Convert AI design to React Flow format
     */
    convertToReactFlow(aiDesign, equipment, loads) {
        const nodes = (aiDesign.nodes || []).map(node => ({
            id: node.id,
            type: 'industrial',
            position: { x: node.x, y: node.y },
            data: {
                label: node.label,
                componentType: node.componentType,
                tag: node.id,
                ...node.metadata
            }
        }));

        let edgeId = 0;
        const edges = (aiDesign.edges || []).map(edge => ({
            id: `e${edgeId++}`,
            source: edge.source,
            target: edge.target,
            label: edge.label,
            type: edge.pipeType || 'liquid',
            animated: edge.pipeType === 'liquid',
            style: {
                stroke: edge.pipeType === 'suction' ? '#2196F3' :
                    edge.pipeType === 'discharge' ? '#f44336' :
                        '#4CAF50',
                strokeWidth: Math.max(2, (edge.sizeDN || 50) / 30)
            }
        }));

        return {
            initialNodes: nodes,
            initialEdges: edges,
            aiRationale: aiDesign.design_rationale,
            instrumentation: aiDesign.instrumentation || []
        };
    }

    /**
     * Fallback design if AI fails
     */
    getFallbackDesign(context) {
        console.warn('Using fallback design due to AI error');

        return {
            design_rationale: "Fallback deterministic design",
            nodes: [
                {
                    id: "COND",
                    componentType: "evaporative_condenser",
                    x: 500,
                    y: 100,
                    label: context.equipment.condenser?.model || "Condenser",
                    metadata: { capacity: `${context.totalLoad.highStage} kW` }
                }
            ],
            edges: [],
            instrumentation: []
        };
    }

    /**
     * Enhanced pipe size calculation
     */
    calculatePipeSize(flowKW, refrigerantState) {
        let factor = 8;
        if (refrigerantState === 'liquid') factor = 6;
        else if (refrigerantState === 'suction') factor = 9;
        else if (refrigerantState === 'discharge') factor = 7;

        const dn = Math.ceil(Math.sqrt(flowKW) * factor / 5) * 5;
        const standardSizes = [25, 32, 40, 50, 65, 80, 100, 125, 150, 200, 250];
        return standardSizes.find(s => s >= dn) || standardSizes[standardSizes.length - 1];
    }
}

module.exports = AIFlowDiagramEngine;
