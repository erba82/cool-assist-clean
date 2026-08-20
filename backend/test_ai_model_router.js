'use strict';

const assert = require('assert');
const AIModelRouter = require('./services/AIModelRouter');

const response = (status, body) => ({ ok: status >= 200 && status < 300, status, json: async () => body });
const messages = [{ role: 'user', content: 'test' }];

(async () => {
    const calls = [];
    const nvidiaFirst = new AIModelRouter({
        env: { NVIDIA_API_KEY: 'nvidia-test', GEMINI_API_KEY: 'gemini-test', DEEPSEEK_API_KEY: 'deepseek-test' },
        geminiService: { available: true, chat: async () => ({ success: true, message: 'gemini should not run' }) },
        fetchImpl: async (url) => {
            calls.push(url);
            return response(200, { model: 'nvidia-model', choices: [{ message: { content: '{"name":"NVIDIA project","rooms":[]}' } }] });
        }
    });
    const first = await nvidiaFirst.complete({ messages });
    assert.strictEqual(first.success, true);
    assert.strictEqual(first.provider, 'nvidia');
    assert.strictEqual(calls.length, 1);
    assert(/integrate\.api\.nvidia\.com/.test(calls[0]));

    const geminiFallback = new AIModelRouter({
        env: { GEMINI_API_KEY: 'gemini-test' },
        geminiService: { available: true, chat: async () => ({ success: true, message: 'gemini fallback response' }) },
        fetchImpl: async () => { throw new Error('fetch must not be called when NVIDIA and DeepSeek lack keys'); }
    });
    const second = await geminiFallback.complete({ messages });
    assert.strictEqual(second.success, true);
    assert.strictEqual(second.provider, 'gemini');

    const deepseekFallback = new AIModelRouter({
        env: { NVIDIA_API_KEY: 'nvidia-test', DEEPSEEK_API_KEY: 'deepseek-test' },
        geminiService: { available: false },
        fetchImpl: async (url) => {
            calls.push(url);
            if (/integrate\.api\.nvidia\.com/.test(url)) return response(503, {});
            return response(200, { model: 'deepseek-test-model', choices: [{ message: { content: 'deepseek fallback response' } }] });
        }
    });
    const third = await deepseekFallback.complete({ messages });
    assert.strictEqual(third.success, true);
    assert.strictEqual(third.provider, 'deepseek');
    assert(third.attempts.some((attempt) => attempt.provider === 'nvidia'));

    const structured = await nvidiaFirst.structuredProject('R717 cold store');
    assert.strictEqual(structured.name, 'NVIDIA project');
    assert.strictEqual(structured.aiProvenance.provider, 'nvidia');
    assert.strictEqual(structured.aiProvenance.reviewRequired, true);

    console.log(JSON.stringify({ status: 'passed', order: ['nvidia', 'gemini', 'deepseek'], checks: ['nvidia-first', 'gemini-fallback', 'deepseek-fallback', 'structured-provenance'] }, null, 2));
})().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
