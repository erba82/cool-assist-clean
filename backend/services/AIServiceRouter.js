/**
 * AI Service Router
 * Routes AI requests to the most appropriate local model based on task type
 * Optimized for: Phi-3.5 (Manager), DeepSeek-R1 (Math), Qwen2.5-Coder (Logic/3D)
 */
const OllamaService = require('./OllamaService');

class AIServiceRouter {
    constructor() {
        // Initialize multiple Ollama services for different models
        this.models = {};
        this.initializedModels = {};
        
        // Define model capabilities based on user specific hardware config
        this.modelCapabilities = {
            'phi3.5:latest': {
                description: 'Design Captain & Orchestrator - User intent analysis and workflow management',
                useCases: ['parsing', 'general_qa', 'input_analysis', 'design_management', 'explanation'],
                defaultPriority: 1
            },
            'qwen2.5-coder:3b': {
                description: 'Logic & Implementation - Code generation, 3D logic, and Diagrams',
                useCases: ['code_generation', 'diagram_generation', 'structured_data_extraction', 'pid_generation', 'three_d_logic'],
                defaultPriority: 2
            },
            'deepseek-r1:1.5b': {
                description: 'Math Engine - Heavy calculations and optimization',
                useCases: ['calculations', 'mathematical_reasoning', 'engineering_calculations', 'optimization', 'complex_physics'],
                defaultPriority: 3
            }
        };

        // Initialize available models
        this.initializeModels();
    }

    async initializeModels() {
        // Test all available models
        try {
            const ollamaService = new OllamaService();
            // Note: Ensure Ollama is running with 'ollama serve'
            
            // Try to get models, handle if Ollama is offline
            let availableModels = [];
            try {
                availableModels = await ollamaService.getAvailableModels();
                console.log(`📦 Found ${availableModels.length} available Ollama models:`);
                availableModels.forEach(model => {
                    console.log(`   - ${model.name}`);
                });
            } catch (connError) {
                console.error('⚠️ Could not connect to Ollama to list models. Ensure Ollama is running.');
            }
            
            // Initialize services for models we want to use
            for (const [modelName, capabilities] of Object.entries(this.modelCapabilities)) {
                // Check if model exists in the list OR force initialization if list failed (optimistic init)
                const cleanName = modelName.split(':')[0]; // e.g., 'phi3.5'
                const modelExists = availableModels.length === 0 || availableModels.some(m => m.name.includes(cleanName)); 
                
                if (modelExists) {
                    // Create a temporary service instance to test this specific model
                    const modelService = new OllamaService();
                    // Set the specific model
                    modelService.model = modelName;
                    
                    // Test the model
                    try {
                        // Quick handshake test
                        await modelService.chat('Are you online?', 'en');
                        this.models[modelName] = modelService;
                        this.initializedModels[modelName] = true;
                        console.log(`✅ Model initialized: ${modelName} (${capabilities.description})`);
                    } catch (error) {
                        console.log(`❌ Model failed to initialize: ${modelName} - ${error.message}`);
                        // Even if it fails ping, we mark it as false but keep the key
                        this.initializedModels[modelName] = false;
                    }
                } else {
                    console.log(`❌ Model not found on system: ${modelName} - Please run: ollama pull ${modelName}`);
                    this.initializedModels[modelName] = false;
                }
            }
            
            // Setup fallback
            const initializedCount = Object.keys(this.models).length;
            if (initializedCount === 0) {
                console.warn('⚠️ No AI models successfully initialized. AI features will be disabled until Ollama is running.');
            } else {
                console.log(`🚀 AI Service Router ready with ${initializedCount} active models.`);
            }

        } catch (error) {
            console.error('❌ Critical Error initializing models:', error.message);
        }
    }

    /**
     * Select the best model for a given task
     */
    selectBestModel(taskType) {
        // --- 🚨 تست سخت‌افزار: اجبار به استفاده از سبک‌ترین مدل 🚨 ---
        if (this.initializedModels['deepseek-r1:1.5b']) {
            console.log(`⚡ FORCING LIGHTWEIGHT MODEL (deepseek-r1) FOR TASK: ${taskType}`);
            return this.models['deepseek-r1:1.5b'];
        }
        // -------------------------------------------------------------

        // Only consider models that successfully initialized
        const availableModelNames = Object.keys(this.models).filter(model => this.initializedModels[model]);
        
        if (availableModelNames.length === 0) {
            return null;
        }
        
        // Map task types to preferred models based on user instructions
        // 1. phi3.5:latest -> Analysis & Management
        // 2. qwen2.5-coder:3b -> Logic, Code, Diagrams
        // 3. deepseek-r1:1.5b -> Math & Calculations
        
        const taskModelMap = {
            // --- Phi-3.5 (The Captain) ---
            'parsing': ['phi3.5:latest'],
            'input_parsing': ['phi3.5:latest'],
            'general_qa': ['phi3.5:latest'],
            'explanation': ['phi3.5:latest'],
            'design_management': ['phi3.5:latest'],
            'design_recommendations': ['phi3.5:latest'], // High level logic
            
            // --- DeepSeek-R1 (The Calculator) ---
            'calculations': ['deepseek-r1:1.5b'],
            'mathematical_reasoning': ['deepseek-r1:1.5b'],
            'optimization': ['deepseek-r1:1.5b'],
            'engineering_calculations': ['deepseek-r1:1.5b'],
            'complex_problem_solving': ['deepseek-r1:1.5b'],

            // --- Qwen 2.5 Coder (The Engineer/Architect) ---
            'structured_data_extraction': ['qwen2.5-coder:3b'],
            'code_generation': ['qwen2.5-coder:3b'],
            'diagram_generation': ['qwen2.5-coder:3b'],
            'pid_generation': ['qwen2.5-coder:3b'],
            'system_design': ['qwen2.5-coder:3b'], // 3D logic
            'technical_analysis': ['qwen2.5-coder:3b'],
            
            // Fallback strategy
            'default': ['phi3.5:latest', 'qwen2.5-coder:3b', 'deepseek-r1:1.5b']
        };
        
        const preferredModels = taskModelMap[taskType] || taskModelMap['default'];
        
        // Find the first PREFERRED model that is actually AVAILABLE
        for (const preferredModelName of preferredModels) {
            if (this.initializedModels[preferredModelName]) {
                return this.models[preferredModelName];
            }
        }
        
        // Final fallback: just return the first available model we have
        return this.models[availableModelNames[0]];
    }

    /**
     * Execute a chat request with the best model for the task
     */
    async chat(message, taskType = 'default', language = 'en') {
        const modelService = this.selectBestModel(taskType);
        
        if (!modelService) {
            // Try one more re-init attempt if call fails immediately (in case Ollama started late)
            return {
                success: false,
                error: 'No AI models available. Is Ollama running?',
                fallback: true
            };
        }
        
        try {
            // console.log(`🤖 Routing '${taskType}' task to ${modelService.model}`);
            return await modelService.chat(message, language);
        } catch (error) {
            console.error(`❌ Error with ${modelService.model}:`, error.message);
            
            // Try fallback to another model
            const otherModels = Object.keys(this.models).filter(m => 
                this.initializedModels[m] && m !== modelService.model
            );
            
            for (const modelName of otherModels) {
                try {
                    console.log(`⚠️ Falling back to ${modelName}`);
                    return await this.models[modelName].chat(message, language);
                } catch (fallbackError) {
                    continue;
                }
            }
            
            return {
                success: false,
                error: 'All available models failed to respond',
                fallback: true
            };
        }
    }

    /**
     * Execute a chat with history using the best model for the task
     */
    async chatWithHistory(message, sessionId, taskType = 'default', language = 'en') {
        const modelService = this.selectBestModel(taskType);
        
        if (!modelService) {
            return {
                success: false,
                error: 'No AI models available. Is Ollama running?',
                fallback: true
            };
        }
        
        try {
            return await modelService.chatWithHistory(message, sessionId, language);
        } catch (error) {
            console.error(`❌ Error with ${modelService.model}:`, error.message);
            
            // Try fallback
            const otherModels = Object.keys(this.models).filter(m => 
                this.initializedModels[m] && m !== modelService.model
            );
            
            for (const modelName of otherModels) {
                try {
                    return await this.models[modelName].chatWithHistory(message, sessionId, language);
                } catch (fallbackError) {
                    continue;
                }
            }
            
            return {
                success: false,
                error: 'All available models failed',
                fallback: true
            };
        }
    }

    /**
     * Get model availability status
     */
    getStatus() {
        const status = {};
        for (const [modelName, cap] of Object.entries(this.modelCapabilities)) {
            status[modelName] = {
                available: this.initializedModels[modelName] || false,
                capabilities: cap
            };
        }
        return {
            availableModels: Object.keys(this.models).filter(m => this.initializedModels[m]),
            status: status,
            totalAvailable: Object.keys(this.models).filter(m => this.initializedModels[m]).length
        };
    }
}

module.exports = AIServiceRouter;