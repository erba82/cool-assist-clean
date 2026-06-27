const { GoogleGenerativeAI } = require('@google/generative-ai');
const OllamaService = require('./OllamaService');

/**
 * Gemini Service for General Purpose Chat
 * Provides direct access to Google's Gemini API for answering any questions
 * Falls back to local Ollama when Gemini is unavailable
 */
class GeminiService {
    constructor() {
        this.apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

        // Initialize Ollama service as backup
        this.ollamaService = new OllamaService();

        if (!this.apiKey) {
            console.warn('⚠️ GEMINI_API_KEY not found - attempting to use Ollama as fallback');
            this.available = false;
            return;
        }

        try {
            this.genAI = new GoogleGenerativeAI(this.apiKey);
            this.model = this.genAI.getGenerativeModel({
                model: "gemini-1.5-flash",
                generationConfig: {
                    temperature: 0.7,
                    topP: 0.9,
                    topK: 40,
                    maxOutputTokens: 2048,
                }
            });
            this.available = true;
            console.log('✅ GeminiService initialized');
        } catch (error) {
            console.error('❌ GeminiService initialization failed:', error.message);
            this.available = false;
        }

        // Session storage: sessionId -> chat instance
        this.sessions = new Map();
    }

    /**
     * Chat with Gemini (stateless single message)
     */
    async chat(message, language = 'en') {
        if (!this.available) {
            console.log('⚠️ Gemini not available, falling back to Ollama');
            // Fall back to Ollama if available
            if (this.ollamaService.available) {
                return await this.ollamaService.chat(message, language);
            }
            
            return {
                success: false,
                error: 'Gemini API not available. Please check GEMINI_API_KEY.',
                fallback: true
            };
        }

        try {
            const result = await this.model.generateContent(message);
            const response = result.response.text();

            return {
                success: true,
                message: response,
                language
            };
        } catch (error) {
            console.error('❌ Gemini chat error:', error.message);
            
            // Fall back to Ollama if available
            if (this.ollamaService.available) {
                console.log('⚠️ Gemini failed, falling back to Ollama');
                return await this.ollamaService.chat(message, language);
            }
            
            return {
                success: false,
                error: error.message,
                fallback: true
            };
        }
    }

    /**
     * Chat with conversation history (stateful)
     */
    async chatWithHistory(message, sessionId, language = 'en') {
        if (!this.available) {
            console.log('⚠️ Gemini not available, falling back to Ollama for session:', sessionId);
            // Fall back to Ollama if available
            if (this.ollamaService.available) {
                return await this.ollamaService.chatWithHistory(message, sessionId, language);
            }
            
            return {
                success: false,
                error: 'Gemini API not available',
                fallback: true
            };
        }

        try {
            // Get or create session chat
            if (!this.sessions.has(sessionId)) {
                const chat = this.model.startChat({
                    history: [],
                });
                this.sessions.set(sessionId, chat);
            }

            const chat = this.sessions.get(sessionId);
            const result = await chat.sendMessage(message);
            const response = result.response.text();

            return {
                success: true,
                message: response,
                language,
                sessionId
            };
        } catch (error) { 
            console.error('❌ Gemini chat error:', error.message);

            // If error, clear session and try Ollama fallback
            if (this.sessions.has(sessionId)) {
                this.sessions.delete(sessionId);
            }
            
            // Fall back to Ollama if available
            if (this.ollamaService.available) {
                console.log('⚠️ Gemini failed, falling back to Ollama for session:', sessionId);
                return await this.ollamaService.chatWithHistory(message, sessionId, language);
            }

            return {
                success: false,
                error: error.message,
                fallback: true
            };
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

module.exports = GeminiService;
