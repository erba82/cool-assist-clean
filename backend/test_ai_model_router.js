'use strict';

const assert = require('assert');
const AIModelRouter = require('./services/AIModelRouter');

const response = (status, body) => ({ ok: status >= 200 && status < 300, status, json: async () => body });
const textResponse = (model, content = 'ok') => response(200, { model, choices: [{ message: { content } }] });
const messages = [{ role: 'user', content: 'test' }];
const nvidiaEnv = {
    NVIDIA_API_KEY: 'nvidia-test',
    NVIDIA_MODEL_ULTRA: 'nvidia/nemotron-3-ultra-550b-a55b',
    NVIDIA_MODEL_SUPER: 'nvidia/nemotron-3-super-120b-a12b',
    NVIDIA_MODEL_NANO_OMNI: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning'
};

(async () => {
    const calls = [];
    const deterministicNvidia = new AIModelRouter({
        env: nvidiaEnv,
        geminiService: { available: false },
        ollamaService: { chat: async () => ({ success: true, message: 'local must not run' }) },
        fetchImpl: async (url, options) => { calls.push({ url, body: JSON.parse(options.body) }); return textResponse(JSON.parse(options.body).model, '{"name":"NVIDIA project","rooms":[]}'); }
    });

    const engineering = await deterministicNvidia.complete({ messages, purpose: 'engineering-assistant' });
    assert.strictEqual(engineering.success, true);
    assert.strictEqual(engineering.provider, 'nvidia');
    assert.strictEqual(engineering.model, nvidiaEnv.NVIDIA_MODEL_SUPER);
    assert.strictEqual(engineering.profile, 'agentic-engineering');
    assert.strictEqual(calls.length, 1);
    assert(/integrate\.api\.nvidia\.com/.test(calls[0].url));
    assert.strictEqual(calls[0].body.chat_template_kwargs.enable_thinking, true);

    const highStakes = await deterministicNvidia.complete({ messages, purpose: 'project-intake' });
    assert.strictEqual(highStakes.model, nvidiaEnv.NVIDIA_MODEL_ULTRA);
    assert.strictEqual(highStakes.profile, 'frontier-reasoning');

    const multimodal = await deterministicNvidia.complete({
        purpose: 'attachment-analysis',
        messages: [{ role: 'user', content: [{ type: 'text', text: 'analyze attachment' }, { type: 'image_url', image_url: { url: 'data:image/png;base64,AA==' } }] }]
    });
    assert.strictEqual(multimodal.model, nvidiaEnv.NVIDIA_MODEL_NANO_OMNI);
    assert.strictEqual(multimodal.profile, 'multimodal-reasoning');

    const geminiFallback = new AIModelRouter({
        env: { GEMINI_API_KEY: 'gemini-test', GEMINI_MODEL: 'gemini-3.5-flash' },
        geminiService: { available: true, chat: async (_message, _language, options) => ({ success: true, message: 'Gemini fallback', model: options.model }) },
        ollamaService: { chat: async () => ({ success: true, message: 'local must not run' }) },
        fetchImpl: async () => { throw new Error('NVIDIA must not run without a key'); }
    });
    const gemini = await geminiFallback.complete({ messages, purpose: 'general-chat' });
    assert.strictEqual(gemini.success, true);
    assert.strictEqual(gemini.provider, 'gemini');
    assert.strictEqual(gemini.model, 'gemini-3.5-flash');

    const qwenFallback = new AIModelRouter({
        env: { TOKENROUTER_API_KEY: 'tokenrouter-test', TOKENROUTER_API_BASE_URL: 'https://api.tokenrouter.com/v1', TOKENROUTER_QWEN_MODEL: 'qwen3.8-max', DEEPSEEK_LOCAL_ENABLED: 'false' },
        geminiService: { available: false },
        ollamaService: null,
        fetchImpl: async (url, options) => {
            assert.strictEqual(url, 'https://api.tokenrouter.com/v1/chat/completions');
            assert.strictEqual(JSON.parse(options.body).model, 'qwen3.8-max');
            return textResponse('qwen3.8-max', 'Qwen fallback');
        }
    });
    const qwen = await qwenFallback.complete({ messages, purpose: 'general-chat' });
    assert.strictEqual(qwen.success, true);
    assert.strictEqual(qwen.provider, 'qwen');
    assert.strictEqual(qwen.model, 'qwen3.8-max');
    assert.strictEqual(qwen.profile, 'text-reasoning-fallback');
    assert(qwenFallback.status().governedOrder.indexOf('qwen') > qwenFallback.status().governedOrder.indexOf('gemini'));

    const localFallback = new AIModelRouter({
        env: { DEEPSEEK_LOCAL_ENABLED: 'true', OLLAMA_MODEL: 'deepseek-r1:1.5b' },
        geminiService: { available: false },
        ollamaService: { chat: async (_prompt, _language, model) => ({ success: true, message: 'local response', model }) },
        fetchImpl: async () => { throw new Error('No cloud call expected'); }
    });
    const local = await localFallback.complete({ messages, purpose: 'general-chat' });
    assert.strictEqual(local.success, true);
    assert.strictEqual(local.provider, 'deepseek-local');
    assert.strictEqual(local.model, 'deepseek-r1:1.5b');

    const adaptiveStore = {
        routingMetrics: async () => ({
            candidates: {
                'nvidia|nvidia/nemotron-3-super-120b-a12b|general-reasoning': { attempts: 5, successRate: 0.80, averageLatencyMs: 8000, feedbackCount: 5, averageRating: 3 },
                'nvidia|nvidia/nemotron-3-ultra-550b-a55b|escalated-reasoning': { attempts: 5, successRate: 0.95, averageLatencyMs: 1200, feedbackCount: 5, averageRating: 5 }
            }
        })
    };
    const adaptiveRouter = new AIModelRouter({
        env: { ...nvidiaEnv, AI_ROUTER_ADAPTIVE_MIN_SAMPLES: '3', AI_ROUTER_ADAPTIVE_REFRESH_MS: '5000' },
        learningStore: adaptiveStore,
        geminiService: { available: false },
        ollamaService: null,
        fetchImpl: async () => textResponse(nvidiaEnv.NVIDIA_MODEL_ULTRA, 'adaptive response')
    });
    const adaptiveInitial = adaptiveRouter.getRoutePlan({ messages, purpose: 'general-chat' });
    assert.strictEqual(adaptiveInitial.candidates[0].id, 'nvidia-super');
    await new Promise((resolve) => setTimeout(resolve, 0));
    const adaptivePlan = adaptiveRouter.getRoutePlan({ messages, purpose: 'general-chat' });
    assert.strictEqual(adaptivePlan.candidates[0].id, 'nvidia-ultra');
    assert.strictEqual(adaptivePlan.candidates[0].adaptive.eligible, true);
    assert.strictEqual(adaptivePlan.candidates[0].provider, 'nvidia');
    assert.strictEqual(adaptiveRouter.status().adaptiveLearning.providerPrecedencePreserved, true);

    const circuit = new AIModelRouter({
        env: { ...nvidiaEnv, AI_ROUTER_MAX_FAILURES: '2', DEEPSEEK_LOCAL_ENABLED: 'false' },
        geminiService: { available: false },
        ollamaService: null,
        fetchImpl: async () => response(503, {})
    });
    await circuit.complete({ messages, purpose: 'project-intake' });
    await circuit.complete({ messages, purpose: 'project-intake' });
    const blocked = await circuit.complete({ messages, purpose: 'project-intake' });
    assert.strictEqual(blocked.success, false);
    assert(blocked.attempts.some((attempt) => attempt.status === 'skipped-circuit-open'));

    const structured = await deterministicNvidia.structuredProject('R717 cold store');
    assert.strictEqual(structured.name, 'NVIDIA project');
    assert.strictEqual(structured.aiProvenance.provider, 'nvidia');
    assert.strictEqual(structured.aiProvenance.model, nvidiaEnv.NVIDIA_MODEL_ULTRA);
    assert.strictEqual(structured.aiProvenance.reviewRequired, true);

    const proposal = deterministicNvidia.buildLearningProposal(engineering);
    assert.strictEqual(proposal.kind, 'test-finding');
    assert.strictEqual(proposal.evidence.model, nvidiaEnv.NVIDIA_MODEL_SUPER);
    assert.strictEqual(proposal.evidence.success, true);

    console.log(JSON.stringify({ status: 'passed', checks: ['nvidia-super-engineering', 'nvidia-ultra-high-stakes', 'nvidia-nano-omni-multimodal', 'gemini-fallback', 'qwen-tokenrouter-fallback', 'local-deepseek-fallback', 'adaptive-profile-weighting', 'circuit-breaker', 'structured-provenance', 'proposal-only-learning'] }, null, 2));
})().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
