'use strict';

const GeminiService = require('./GeminiService');
const OllamaService = require('./OllamaService');

const DEFAULTS = Object.freeze({
    nvidiaBaseUrl: 'https://integrate.api.nvidia.com/v1',
    nvidiaUltra: 'nvidia/nemotron-3-ultra-550b-a55b',
    nvidiaSuper: 'nvidia/nemotron-3-super-120b-a12b',
    nvidiaNanoOmni: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning',
    geminiModel: 'gemini-3.5-flash',
    deepSeekBaseUrl: 'https://api.deepseek.com',
    deepSeekModel: 'deepseek-v4-pro',
    localDeepSeekModel: 'deepseek-r1:1.5b',
    maxFailures: 2
});

const HIGH_STAKES_PURPOSES = new Set(['project-intake', 'engineering-review', 'long-context-analysis', 'high-stakes-analysis', 'complex-agentic']);
const ENGINEERING_PURPOSES = new Set(['engineering-assistant', 'design-analysis', 'topology-interpretation', 'pid-analysis', 'file-analysis', 'technical-analysis']);
const MULTIMODAL_PURPOSES = new Set(['attachment-analysis', 'multimodal-analysis', 'image-analysis', 'video-analysis', 'audio-analysis', 'document-analysis']);
const stripCodeFence = (value) => String(value || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
const asText = (value, max = 240) => String(value || '').replace(/\u0000/g, '').trim().slice(0, max);

function hasNonTextContent(messages = []) {
    return messages.some((message) => Array.isArray(message?.content) || Boolean(message?.attachment) || Boolean(message?.attachments));
}

function flattenMessages(messages = []) {
    return messages.map((message) => {
        if (typeof message?.content === 'string') return `${message.role || 'user'}: ${message.content}`;
        if (Array.isArray(message?.content)) {
            return `${message.role || 'user'}: ${message.content.map((part) => part?.text || part?.url || '').filter(Boolean).join('\n')}`;
        }
        return `${message?.role || 'user'}: ${String(message?.content || '')}`;
    }).join('\n\n');
}

class AIModelRouter {
    constructor({ fetchImpl = global.fetch, env = process.env, geminiService, ollamaService, now = () => Date.now() } = {}) {
        if (typeof fetchImpl !== 'function') throw new Error('AIModelRouter requires a fetch implementation.');
        this.fetch = fetchImpl;
        this.env = env;
        this.now = now;
        this.gemini = geminiService || new GeminiService({ env });
        this.ollama = ollamaService || new OllamaService({ env });
        this.maxFailures = Math.max(1, Number(env.AI_ROUTER_MAX_FAILURES) || DEFAULTS.maxFailures);
        this.telemetry = new Map();
    }

    _modelConfig() {
        return {
            ultra: this.env.NVIDIA_MODEL_ULTRA || DEFAULTS.nvidiaUltra,
            super: this.env.NVIDIA_MODEL_SUPER || this.env.NVIDIA_MODEL || DEFAULTS.nvidiaSuper,
            nanoOmni: this.env.NVIDIA_MODEL_NANO_OMNI || DEFAULTS.nvidiaNanoOmni,
            gemini: this.env.GEMINI_MODEL || DEFAULTS.geminiModel,
            deepseekRemote: this.env.DEEPSEEK_MODEL || DEFAULTS.deepSeekModel,
            deepseekLocal: this.env.OLLAMA_MODEL || DEFAULTS.localDeepSeekModel
        };
    }

    _requirements({ purpose = 'general', modalities = [], messages = [] } = {}) {
        const normalizedPurpose = asText(purpose, 80).toLowerCase() || 'general';
        const normalizedModalities = Array.isArray(modalities) ? modalities.map((value) => asText(value, 40).toLowerCase()).filter(Boolean) : [];
        const multimodal = hasNonTextContent(messages) || normalizedModalities.some((value) => value !== 'text') || MULTIMODAL_PURPOSES.has(normalizedPurpose);
        return {
            purpose: normalizedPurpose,
            modalities: normalizedModalities.length ? normalizedModalities : ['text'],
            multimodal,
            highStakes: HIGH_STAKES_PURPOSES.has(normalizedPurpose),
            engineering: ENGINEERING_PURPOSES.has(normalizedPurpose)
        };
    }

    _isCircuitOpen(candidate) {
        const metric = this.telemetry.get(candidate.id);
        return Boolean(metric && metric.consecutiveFailures >= this.maxFailures);
    }

    _candidate(id, provider, model, profile, extra = {}) {
        return { id, provider, model, profile, ...extra };
    }

    getRoutePlan(request = {}) {
        const requirements = this._requirements(request);
        const models = this._modelConfig();
        const candidates = [];
        const nvidiaConfigured = Boolean(this.env.NVIDIA_API_KEY);
        const geminiConfigured = Boolean(this.env.GEMINI_API_KEY || this.env.GOOGLE_API_KEY) && Boolean(this.gemini?.available);
        const localEnabled = String(this.env.DEEPSEEK_LOCAL_ENABLED || 'true').toLowerCase() !== 'false';
        const localConfigured = localEnabled && Boolean(this.ollama);
        const remoteDeepSeekConfigured = Boolean(this.env.DEEPSEEK_API_KEY);

        // Provider precedence is fixed by owner policy. Capability selects a profile within NVIDIA before fallback.
        if (nvidiaConfigured) {
            if (requirements.multimodal) {
                candidates.push(this._candidate('nvidia-nano-omni', 'nvidia', models.nanoOmni, 'multimodal-reasoning'));
            } else if (requirements.highStakes) {
                candidates.push(this._candidate('nvidia-ultra', 'nvidia', models.ultra, 'frontier-reasoning'));
                candidates.push(this._candidate('nvidia-super', 'nvidia', models.super, 'agentic-engineering'));
            } else {
                candidates.push(this._candidate('nvidia-super', 'nvidia', models.super, requirements.engineering ? 'agentic-engineering' : 'general-reasoning'));
                candidates.push(this._candidate('nvidia-ultra', 'nvidia', models.ultra, 'escalated-reasoning'));
            }
        }
        if (geminiConfigured) candidates.push(this._candidate('gemini-flash', 'gemini', models.gemini, 'stable-multimodal-fallback'));
        if (!requirements.multimodal && localConfigured) candidates.push(this._candidate('deepseek-local', 'deepseek-local', models.deepseekLocal, 'private-loopback-fallback'));
        if (!requirements.multimodal && remoteDeepSeekConfigured) candidates.push(this._candidate('deepseek-remote', 'deepseek', models.deepseekRemote, 'remote-fallback'));

        return {
            strategy: 'capability-latency-provenance',
            requirements,
            candidates: candidates.map((candidate) => ({ ...candidate, circuitOpen: this._isCircuitOpen(candidate) }))
        };
    }

    status() {
        const plan = this.getRoutePlan({ purpose: 'general', messages: [] });
        const models = this._modelConfig();
        const telemetry = Object.fromEntries([...this.telemetry.entries()].map(([id, value]) => [id, { ...value }]));
        return {
            strategy: 'capability-latency-provenance',
            governedOrder: ['nvidia', 'gemini', 'deepseek-local', 'deepseek'],
            nvidia: {
                configured: Boolean(this.env.NVIDIA_API_KEY),
                baseUrl: this.env.NVIDIA_API_BASE_URL || DEFAULTS.nvidiaBaseUrl,
                models: { ultra: models.ultra, super: models.super, nanoOmni: models.nanoOmni }
            },
            gemini: { configured: Boolean(this.env.GEMINI_API_KEY || this.env.GOOGLE_API_KEY) && Boolean(this.gemini?.available), model: models.gemini },
            deepseekLocal: { configured: String(this.env.DEEPSEEK_LOCAL_ENABLED || 'true').toLowerCase() !== 'false', baseUrl: this.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434', model: models.deepseekLocal },
            deepseekRemote: { configured: Boolean(this.env.DEEPSEEK_API_KEY), baseUrl: this.env.DEEPSEEK_API_BASE_URL || DEFAULTS.deepSeekBaseUrl, model: models.deepseekRemote },
            defaultPlan: plan.candidates,
            telemetry
        };
    }

    _recordOutcome(candidate, startedAt, success, reason = null) {
        const elapsedMs = Math.max(0, this.now() - startedAt);
        const previous = this.telemetry.get(candidate.id) || { attempts: 0, successes: 0, failures: 0, totalLatencyMs: 0, consecutiveFailures: 0 };
        const next = {
            attempts: previous.attempts + 1,
            successes: previous.successes + (success ? 1 : 0),
            failures: previous.failures + (success ? 0 : 1),
            totalLatencyMs: previous.totalLatencyMs + elapsedMs,
            averageLatencyMs: Math.round((previous.totalLatencyMs + elapsedMs) / (previous.attempts + 1)),
            consecutiveFailures: success ? 0 : previous.consecutiveFailures + 1,
            lastStatus: success ? 'success' : 'failed',
            lastFailure: success ? null : asText(reason, 240),
            updatedAt: new Date().toISOString()
        };
        this.telemetry.set(candidate.id, next);
        return { elapsedMs, telemetry: next };
    }

    async complete({ messages, temperature = 0.2, maxTokens = 2048, purpose = 'general', modalities = [] } = {}) {
        if (!Array.isArray(messages) || messages.length === 0) throw new Error('AIModelRouter requires at least one message.');
        const plan = this.getRoutePlan({ purpose, modalities, messages });
        const attempts = [];
        for (const candidate of plan.candidates) {
            if (candidate.circuitOpen) {
                attempts.push({ provider: candidate.provider, model: candidate.model, profile: candidate.profile, status: 'skipped-circuit-open' });
                continue;
            }
            const startedAt = this.now();
            try {
                const result = await this._completeWith(candidate, { messages, temperature, maxTokens, requirements: plan.requirements });
                const outcome = this._recordOutcome(candidate, startedAt, true);
                return {
                    success: true,
                    provider: candidate.provider,
                    model: result.model || candidate.model,
                    profile: candidate.profile,
                    purpose: plan.requirements.purpose,
                    text: result.text,
                    attempts,
                    routing: { strategy: plan.strategy, requirements: plan.requirements, selected: candidate, latencyMs: outcome.elapsedMs, reviewRequired: true }
                };
            } catch (error) {
                const outcome = this._recordOutcome(candidate, startedAt, false, error?.message || error);
                attempts.push({ provider: candidate.provider, model: candidate.model, profile: candidate.profile, status: 'failed', latencyMs: outcome.elapsedMs, reason: asText(error?.message || error, 240) });
            }
        }
        return { success: false, provider: null, purpose: plan.requirements.purpose, attempts, routing: { strategy: plan.strategy, requirements: plan.requirements, reviewRequired: true }, error: 'No eligible AI provider returned a usable response.' };
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
            project.aiProvenance = { provider: response.provider, model: response.model, profile: response.profile, purpose: response.purpose, routing: response.routing, reviewRequired: true };
            return project;
        } catch (error) {
            return null;
        }
    }

    async _completeWith(candidate, request) {
        if (candidate.provider === 'nvidia') {
            return this._openAICompatible('nvidia', this.env.NVIDIA_API_KEY, this.env.NVIDIA_API_BASE_URL || DEFAULTS.nvidiaBaseUrl, candidate.model, request, { enableThinking: request.requirements.highStakes || request.requirements.engineering });
        }
        if (candidate.provider === 'gemini') return this._gemini(request, candidate.model);
        if (candidate.provider === 'deepseek-local') return this._localDeepSeek(request, candidate.model);
        if (candidate.provider === 'deepseek') return this._openAICompatible('deepseek', this.env.DEEPSEEK_API_KEY, this.env.DEEPSEEK_API_BASE_URL || DEFAULTS.deepSeekBaseUrl, candidate.model, request);
        throw new Error(`Unknown provider: ${candidate.provider}`);
    }

    async _openAICompatible(provider, apiKey, baseUrl, model, request, options = {}) {
        if (!apiKey) throw new Error(`${provider} is not configured.`);
        const url = `${String(baseUrl).replace(/\/$/, '')}/chat/completions`;
        const body = { model, messages: request.messages, temperature: request.temperature, max_tokens: request.maxTokens, stream: false };
        if (provider === 'nvidia' && options.enableThinking) body.chat_template_kwargs = { enable_thinking: true, force_nonempty_content: true };
        const response = await this.fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` }, body: JSON.stringify(body) });
        if (!response.ok) throw new Error(`${provider} returned HTTP ${response.status}.`);
        const data = await response.json();
        const text = data?.choices?.[0]?.message?.content;
        if (!text) throw new Error(`${provider} response did not contain chat content.`);
        return { text: String(text), model: data.model || model };
    }

    async _gemini(request, model) {
        if (!this.gemini?.available) throw new Error('gemini is not configured.');
        const system = request.messages.find((message) => message.role === 'system')?.content || '';
        const prompt = request.messages.filter((message) => message.role !== 'system').map((message) => typeof message.content === 'string' ? message.content : flattenMessages([message])).join('\n\n');
        const response = await this.gemini.chat(`${system}\n\n${prompt}`, 'en', { model, temperature: request.temperature, maxTokens: request.maxTokens });
        if (!response?.success || !response.message) throw new Error(response?.error || 'gemini did not return content.');
        return { text: response.message, model: response.model || model };
    }

    async _localDeepSeek(request, model) {
        if (!this.ollama) throw new Error('local DeepSeek is unavailable.');
        const response = await this.ollama.chat(flattenMessages(request.messages), 'en', model);
        if (!response?.success || !response.message) throw new Error(response?.error || 'local DeepSeek did not return content.');
        return { text: response.message, model };
    }

    buildLearningProposal(result) {
        if (!result || !result.routing) return null;
        const selected = result.routing.selected || null;
        return {
            kind: 'test-finding',
            summary: `AI router observation: ${selected?.provider || 'none'} ${selected?.model || 'unavailable'} for ${result.purpose || 'general'}`,
            detail: 'Automated runtime observation only. It may inform a human-reviewed routing proposal, but it cannot alter engineering rules, provider precedence, model policy, skills or equipment selection.',
            evidence: {
                strategy: result.routing.strategy,
                purpose: result.purpose || null,
                provider: selected?.provider || null,
                model: selected?.model || null,
                profile: selected?.profile || null,
                success: Boolean(result.success),
                latencyMs: result.routing.latencyMs || null,
                attemptCount: Array.isArray(result.attempts) ? result.attempts.length : 0
            },
            source: 'model-router-runtime'
        };
    }
}

module.exports = AIModelRouter;
