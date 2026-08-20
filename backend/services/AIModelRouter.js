'use strict';

const GeminiService = require('./GeminiService');

const DEFAULTS = Object.freeze({
    nvidiaBaseUrl: 'https://integrate.api.nvidia.com/v1',
    nvidiaModel: 'meta/llama-3.3-70b-instruct',
    deepSeekBaseUrl: 'https://api.deepseek.com',
    deepSeekModel: 'deepseek-v4-pro'
});

const stripCodeFence = (value) => String(value || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

class AIModelRouter {
    constructor({ fetchImpl = global.fetch, env = process.env, geminiService } = {}) {
        if (typeof fetchImpl !== 'function') throw new Error('AIModelRouter requires a fetch implementation.');
        this.fetch = fetchImpl;
        this.env = env;
        this.gemini = geminiService || new GeminiService();
        this.providers = ['nvidia', 'gemini', 'deepseek'];
    }

    status() {
        return {
            order: [...this.providers],
            nvidia: { configured: Boolean(this.env.NVIDIA_API_KEY), baseUrl: this.env.NVIDIA_API_BASE_URL || DEFAULTS.nvidiaBaseUrl, model: this.env.NVIDIA_MODEL || DEFAULTS.nvidiaModel },
            gemini: { configured: Boolean(this.env.GEMINI_API_KEY || this.env.GOOGLE_API_KEY), model: this.env.GEMINI_MODEL || 'gemini-1.5-flash' },
            deepseek: { configured: Boolean(this.env.DEEPSEEK_API_KEY), baseUrl: this.env.DEEPSEEK_API_BASE_URL || DEFAULTS.deepSeekBaseUrl, model: this.env.DEEPSEEK_MODEL || DEFAULTS.deepSeekModel }
        };
    }

    async complete({ messages, temperature = 0.1, maxTokens = 2048, purpose = 'general' }) {
        const attempts = [];
        for (const provider of this.providers) {
            try {
                const result = await this._completeWith(provider, { messages, temperature, maxTokens });
                if (result) return { success: true, provider, purpose, attempts, ...result };
            } catch (error) {
                attempts.push({ provider, status: 'failed', reason: String(error.message || error).slice(0, 240) });
            }
        }
        return { success: false, provider: null, purpose, attempts, error: 'No configured AI provider returned a usable response.' };
    }

    async structuredProject(message) {
        const response = await this.complete({
            purpose: 'project-intake',
            temperature: 0,
            maxTokens: 1800,
            messages: [
                { role: 'system', content: 'Extract only explicit refrigeration design facts from the user request. Return a single JSON object with name, location, refrigerant, product, rooms, requirements, designIntent, capacity, specifiedCoolingLoadKW and operatingConditions. Use null or empty values when unknown. Do not invent engineering data, equipment models, dimensions, standards compliance or safety settings.' },
                { role: 'user', content: String(message || '') }
            ]
        });
        if (!response.success) return null;
        try {
            const project = JSON.parse(stripCodeFence(response.text));
            if (!project || typeof project !== 'object' || Array.isArray(project)) throw new Error('Structured response was not an object.');
            project.aiProvenance = { provider: response.provider, purpose: response.purpose, reviewRequired: true };
            return project;
        } catch (error) {
            return null;
        }
    }

    async _completeWith(provider, request) {
        if (provider === 'nvidia') return this._openAICompatible('nvidia', this.env.NVIDIA_API_KEY, this.env.NVIDIA_API_BASE_URL || DEFAULTS.nvidiaBaseUrl, this.env.NVIDIA_MODEL || DEFAULTS.nvidiaModel, request);
        if (provider === 'gemini') return this._gemini(request);
        if (provider === 'deepseek') return this._openAICompatible('deepseek', this.env.DEEPSEEK_API_KEY, this.env.DEEPSEEK_API_BASE_URL || DEFAULTS.deepSeekBaseUrl, this.env.DEEPSEEK_MODEL || DEFAULTS.deepSeekModel, request);
        return null;
    }

    async _openAICompatible(provider, apiKey, baseUrl, model, request) {
        if (!apiKey) throw new Error(`${provider} is not configured.`);
        const url = `${String(baseUrl).replace(/\/$/, '')}/chat/completions`;
        const response = await this.fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
            body: JSON.stringify({ model, messages: request.messages, temperature: request.temperature, max_tokens: request.maxTokens, stream: false })
        });
        if (!response.ok) throw new Error(`${provider} returned HTTP ${response.status}.`);
        const data = await response.json();
        const text = data?.choices?.[0]?.message?.content;
        if (!text) throw new Error(`${provider} response did not contain chat content.`);
        return { text: String(text), model: data.model || model };
    }

    async _gemini(request) {
        if (!this.gemini.available) throw new Error('gemini is not configured.');
        const system = request.messages.find((message) => message.role === 'system')?.content || '';
        const prompt = request.messages.filter((message) => message.role !== 'system').map((message) => message.content).join('\n\n');
        const response = await this.gemini.chat(`${system}\n\n${prompt}`, 'en');
        if (!response?.success || !response.message) throw new Error(response?.error || 'gemini did not return content.');
        return { text: response.message, model: this.env.GEMINI_MODEL || 'gemini-1.5-flash' };
    }
}

module.exports = AIModelRouter;
