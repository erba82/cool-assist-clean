/**
 * Ollama Service for Local AI Model Integration
 * Connects to local Ollama instance reliably.
 */
const axios = require('axios');

class OllamaService {
    constructor() {
        // Smart URL Parser: Prevents 404 errors by normalizing the URL
        let base = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
        base = base.replace(/\/+$/, '');     // Remove trailing slashes
        base = base.replace(/\/api$/, '');   // Remove /api if user added it in .env
        
        this.baseUrl = base;                 // Result: http://127.0.0.1:11434
        this.apiBase = `${this.baseUrl}/api`; // Result: http://127.0.0.1:11434/api
        
        this.model = process.env.OLLAMA_MODEL || 'phi3.5:latest';
        this.sessions = new Map();
    }

    /**
     * Test connection to Ollama
     */
    async testConnection() {
        try {
            // Endpoint: http://127.0.0.1:11434/api/tags
            const response = await axios.get(`${this.apiBase}/tags`);
            return response.status === 200;
        } catch (error) {
            return false;
        }
    }

    /**
     * Get available models
     */
    async getAvailableModels() {
        try {
            const response = await axios.get(`${this.apiBase}/tags`);
            return response.data.models || [];
        } catch (error) {
            // Return empty array instead of crashing
            return [];
        }
    }

    /**
     * Chat with Ollama (stateless single message)
     */
    async chat(message, language = 'en', modelOverride = null) {
        const modelToUse = modelOverride || this.model;

        try {
            // Endpoint: http://127.0.0.1:11434/api/generate
            const response = await axios.post(`${this.apiBase}/generate`, {
                model: modelToUse,
                prompt: message,
                stream: false,
                options: {
                    temperature: 0.7,
                    top_p: 0.9,
                    top_k: 40,
                    num_ctx: 2048,
                }
            });

            return {
                success: true,
                message: response.data.response,
                language
            };
        } catch (error) {
            // Throw error to trigger AIServiceRouter's fallback mechanism
            throw new Error(`Ollama chat failed for model ${modelToUse}: ${error.message}`);
        }
    }

    /**
     * Chat with conversation history (stateful)
     */
    async chatWithHistory(message, sessionId, language = 'en', modelOverride = null) {
        const modelToUse = modelOverride || this.model;

        try {
            // Get or create session history
            if (!this.sessions.has(sessionId)) {
                this.sessions.set(sessionId, []);
            }

            const history = this.sessions.get(sessionId);

            // Prepare the full context with history
            let fullPrompt = `You are an expert HVACR (Heating, Ventilation, Air Conditioning, and Refrigeration) and Electrical assistant. `;
            fullPrompt += `Answer questions about refrigeration systems, cooling loads, piping design, electrical systems, and related topics. `;
            fullPrompt += `Be helpful, accurate, and concise.\n\n`;
            
            // Add conversation history
            for (const entry of history) {
                fullPrompt += `User: ${entry.user}\nAssistant: ${entry.assistant}\n\n`;
            }
            
            // Add the current message
            fullPrompt += `User: ${message}\nAssistant:`;

            const response = await axios.post(`${this.apiBase}/generate`, {
                model: modelToUse,
                prompt: fullPrompt,
                stream: false,
                options: {
                    temperature: 0.7,
                    top_p: 0.9,
                    top_k: 40,
                    num_ctx: 4096, // Allowed more context for history
                }
            });

            const botResponse = response.data.response;

            // Update session history
            history.push({
                user: message,
                assistant: botResponse,
                timestamp: new Date()
            });

            // Limit history size to prevent context overflow (keep last 10 interactions)
            if (history.length > 10) {
                history.shift(); 
            }

            return {
                success: true,
                message: botResponse,
                language,
                sessionId
            };
        } catch (error) { 
            // Clear session if context is broken or error occurs
            if (this.sessions.has(sessionId)) {
                this.sessions.delete(sessionId);
            }
            
            // Throw error to trigger fallback in Router
            throw new Error(`Ollama chatWithHistory failed for model ${modelToUse}: ${error.message}`);
        }
    }

    /**
     * Clear session history
     */
    clearSession(sessionId) {
        if (this.sessions.has(sessionId)) {
            this.sessions.delete(sessionId);
            return true;
        }
        return false;
    }

    /**
     * Get session count (for monitoring)
     */
    getSessionCount() {
        return this.sessions.size;
    }
}

module.exports = OllamaService;