'use strict';

const assert = require('assert');
const AIModelRouter = require('./services/AIModelRouter');
const LearningReviewRegistry = require('./core/ai/LearningReviewRegistry');

(async () => {
    const router = new AIModelRouter({
        env: {
            DEEPSEEK_LOCAL_ENABLED: 'true',
            OLLAMA_BASE_URL: 'http://127.0.0.1:11434',
            OLLAMA_MODEL: 'deepseek-r1:1.5b'
        },
        geminiService: { available: false }
    });
    const result = await router.complete({
        purpose: 'general-chat',
        temperature: 0,
        maxTokens: 96,
        messages: [{ role: 'user', content: 'Reply with exactly: LOCAL_ROUTER_OK' }]
    });
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.provider, 'deepseek-local');
    assert.strictEqual(result.model, 'deepseek-r1:1.5b');
    assert(result.text.length > 0);

    const proposal = router.buildLearningProposal(result);
    const registry = new LearningReviewRegistry();
    const stored = await registry.record(proposal);
    assert.strictEqual(stored.requiresHumanApproval, true);
    assert.strictEqual(stored.promotionBlocked, true);
    assert.strictEqual(stored.status, 'proposed');

    console.log(JSON.stringify({
        status: 'passed',
        provider: result.provider,
        model: result.model,
        responseReceived: result.text.length > 0,
        learningProposal: { id: stored.id, status: stored.status, requiresHumanApproval: stored.requiresHumanApproval, promotionBlocked: stored.promotionBlocked }
    }, null, 2));
})().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
