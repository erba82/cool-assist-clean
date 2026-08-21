'use strict';

require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });
const AIModelRouter = require('../services/AIModelRouter');
const GeminiService = require('../services/GeminiService');

const safeError = (error) => String(error?.message || error || 'unknown error').replace(/Bearer\s+[^\s]+/gi, 'Bearer [redacted]').slice(0, 240);
const probe = async ({ label, router, purpose, messages }) => {
    const started = Date.now();
    try {
        const result = await router.complete({ purpose, messages, temperature: 0, maxTokens: 256 });
        return {
            label,
            success: Boolean(result.success),
            provider: result.provider || null,
            model: result.model || null,
            profile: result.profile || null,
            latencyMs: Date.now() - started,
            responseReceived: Boolean(result.text && String(result.text).trim()),
            attempts: (result.attempts || []).map((attempt) => ({ provider: attempt.provider, model: attempt.model, profile: attempt.profile, status: attempt.status, latencyMs: attempt.latencyMs || null, reason: attempt.reason || null })),
            error: result.success ? null : safeError(result.error)
        };
    } catch (error) {
        return { label, success: false, provider: null, model: null, profile: null, latencyMs: Date.now() - started, responseReceived: false, attempts: [], error: safeError(error) };
    }
};

(async () => {
    const fullEnv = { ...process.env };
    const nvidiaRouter = new AIModelRouter({ env: fullEnv, geminiService: { available: false }, ollamaService: null });
    const geminiOnlyRouter = new AIModelRouter({
        env: { ...fullEnv, NVIDIA_API_KEY: '', DEEPSEEK_LOCAL_ENABLED: 'false', DEEPSEEK_API_KEY: '' },
        geminiService: new GeminiService({ env: fullEnv }),
        ollamaService: null
    });
    const system = { role: 'system', content: 'Reply with exactly API_OK. Do not add explanation.' };
    const reports = [];
    reports.push(await probe({ label: 'nvidia-super', router: nvidiaRouter, purpose: 'engineering-assistant', messages: [system, { role: 'user', content: 'Connectivity test.' }] }));
    reports.push(await probe({ label: 'nvidia-ultra', router: nvidiaRouter, purpose: 'project-intake', messages: [system, { role: 'user', content: 'Connectivity test.' }] }));
    reports.push(await probe({ label: 'nvidia-nano-omni-text-mode', router: nvidiaRouter, purpose: 'attachment-analysis', messages: [system, { role: 'user', content: 'Connectivity test for text-only multimodal routing.' }] }));
    reports.push(await probe({ label: 'gemini-3.5-flash', router: geminiOnlyRouter, purpose: 'general-chat', messages: [system, { role: 'user', content: 'Connectivity test.' }] }));
    console.log(JSON.stringify({ testedAt: new Date().toISOString(), reports }, null, 2));
    process.exitCode = reports.every((report) => report.success) ? 0 : 1;
})().catch((error) => {
    console.error(JSON.stringify({ fatal: safeError(error) }));
    process.exitCode = 1;
});
