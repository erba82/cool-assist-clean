'use strict';

const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Thin Gemini provider adapter. Provider fallback belongs only to AIModelRouter,
 * so a failed Gemini call can never be misreported as a Gemini response.
 */
class GeminiService {
    constructor({ env = process.env, clientFactory } = {}) {
        this.env = env;
        this.apiKey = env.GEMINI_API_KEY || env.GOOGLE_API_KEY;
        this.modelName = env.GEMINI_MODEL || 'gemini-3.5-flash';
        this.sessions = new Map();
        this.models = new Map();
        this.clientFactory = clientFactory || ((key) => new GoogleGenerativeAI(key));
        this.available = false;

        if (!this.apiKey) return;
        try {
            this.genAI = this.clientFactory(this.apiKey);
            this.available = Boolean(this.genAI && typeof this.genAI.getGenerativeModel === 'function');
            if (this.available) console.log(`GeminiService initialized for ${this.modelName}.`);
        } catch (error) {
            console.error('GeminiService initialization failed:', error.message);
            this.available = false;
        }
    }

    _model(modelName = this.modelName, { temperature = 0.3, maxTokens = 2048 } = {}) {
        if (!this.available) throw new Error('Gemini API is not configured.');
        const safeModel = String(modelName || this.modelName).trim();
        const key = `${safeModel}:${temperature}:${maxTokens}`;
        if (!this.models.has(key)) {
            this.models.set(key, this.genAI.getGenerativeModel({
                model: safeModel,
                generationConfig: { temperature, topP: 0.9, topK: 40, maxOutputTokens: maxTokens }
            }));
        }
        return { model: this.models.get(key), modelName: safeModel };
    }

    async chat(message, language = 'en', options = {}) {
        try {
            const selected = this._model(options.model, options);
            const result = await selected.model.generateContent(String(message || ''));
            const response = result?.response?.text?.();
            if (!response) throw new Error('Gemini response did not contain text.');
            return { success: true, message: response, language, model: selected.modelName };
        } catch (error) {
            return { success: false, error: error.message, provider: 'gemini' };
        }
    }

    async chatWithHistory(message, sessionId, language = 'en', options = {}) {
        try {
            const selected = this._model(options.model, options);
            const cacheKey = `${selected.modelName}:${String(sessionId || 'default')}`;
            if (!this.sessions.has(cacheKey)) this.sessions.set(cacheKey, selected.model.startChat({ history: [] }));
            const result = await this.sessions.get(cacheKey).sendMessage(String(message || ''));
            const response = result?.response?.text?.();
            if (!response) throw new Error('Gemini response did not contain text.');
            return { success: true, message: response, language, sessionId, model: selected.modelName };
        } catch (error) {
            this.clearSession(sessionId);
            return { success: false, error: error.message, provider: 'gemini' };
        }
    }

    clearSession(sessionId) {
        const suffix = `:${String(sessionId || 'default')}`;
        let cleared = false;
        for (const key of this.sessions.keys()) {
            if (key.endsWith(suffix)) {
                this.sessions.delete(key);
                cleared = true;
            }
        }
        return cleared;
    }

    getSessionCount() { return this.sessions.size; }
}

module.exports = GeminiService;
