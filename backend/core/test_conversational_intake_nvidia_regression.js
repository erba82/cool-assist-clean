'use strict';

const assert = require('assert');
const InputParser = require('./ai/InputParser');
const IntentClassifier = require('./ai/IntentClassifier');
const DesignOrchestrator = require('./ai/DesignOrchestrator');
const AIModelRouter = require('../services/AIModelRouter');

(async () => {
    const parser = new InputParser();
    const classifier = new IntentClassifier();
    const initialText = 'design a 5000 ton cold storage with 12 rooms, for beef at -18C, in Paris';
    const parsed = await parser.parse(initialText);

    assert.deepStrictEqual(parsed.location, { city: 'Paris', country: 'France' });
    assert.deepStrictEqual(parsed.product, { type: 'beef' });
    assert.strictEqual(parsed.storageCapacityTons, 5000);
    assert.strictEqual(parsed.roomCount, 12);
    assert.strictEqual(parsed.temperature, -18);
    assert.strictEqual(parsed.rooms.length, 0, 'Capacity alone must not create dimensional rooms.');

    const clarification = classifier.classify('beef', { awaitingInfo: true });
    assert.strictEqual(clarification.intent, 'CLARIFICATION');
    assert.deepStrictEqual(clarification.entities.products, ['beef']);

    const router = new AIModelRouter({
        env: { NVIDIA_API_KEY: 'configured-for-test', GEMINI_API_KEY: 'configured-for-test', DEEPSEEK_LOCAL_ENABLED: 'false' },
        fetchImpl: async () => { throw new Error('No provider request is expected in route-plan testing.'); },
        geminiService: { available: true },
        ollamaService: null
    });
    const routePlan = router.getRoutePlan({ purpose: 'project-intake', messages: [{ role: 'user', content: initialText }] });
    assert.strictEqual(routePlan.candidates[0].provider, 'nvidia');
    assert.strictEqual(routePlan.candidates[0].id, 'nvidia-ultra');

    const orchestrator = new DesignOrchestrator();
    // The external provider is isolated in this state-machine test. The returned
    // provenance mirrors a successful structured intake without supplying facts
    // that were not present in the user message.
    orchestrator._parseWithAI = async () => ({
        name: null,
        location: null,
        refrigerant: null,
        product: null,
        rooms: [],
        requirements: [],
        designIntent: {},
        capacity: null,
        specifiedCoolingLoadKW: null,
        operatingConditions: {},
        aiProvenance: { provider: 'nvidia', model: 'nvidia/nemotron-3-super-120b-a12b', profile: 'agentic-engineering', purpose: 'project-intake', reviewRequired: true }
    });

    const first = await orchestrator.handleMessage(initialText, 'intake-regression');
    assert.strictEqual(first.type, 'info_request');
    assert.strictEqual(first.completeness, 80);
    assert.deepStrictEqual(first.questions.map((question) => question.field), ['dimensions']);
    assert.strictEqual(first.questions[0].required, true);

    const second = await orchestrator.handleMessage('each room is 60m x 40m x 9m', 'intake-regression');
    assert.strictEqual(second.type, 'recommendations');
    assert.strictEqual(second.awaitingConfirmation, true);
    assert.strictEqual(second.projectSummary.temperature, '-18°C');
    assert.strictEqual(second.aiProvenance.provider, 'nvidia');

    const state = orchestrator.conversationState.get('intake-regression');
    assert.strictEqual(state.parsedInfo.roomCount, 12);
    assert.strictEqual(state.parsedInfo.rooms.length, 12);
    assert.deepStrictEqual(state.parsedInfo.location, { city: 'Paris', country: 'France' });
    assert.deepStrictEqual(state.parsedInfo.product, { type: 'beef' });
    assert.strictEqual(state.parsedInfo.temperature, -18);

    const loadRequired = await orchestrator.handleMessage('confirm', 'intake-regression');
    assert.strictEqual(loadRequired.type, 'info_request');
    assert.strictEqual(loadRequired.questions[0].field, 'coolingLoadPerRoomKW');

    const afterLoad = await orchestrator.handleMessage('150 kW per room', 'intake-regression');
    assert.strictEqual(afterLoad.type, 'recommendations');
    assert.strictEqual(afterLoad.aiProvenance.provider, 'nvidia');

    let confirmedPayload = null;
    orchestrator.processRequest = async (_message, skipParsing, payload) => {
        confirmedPayload = { skipParsing, payload };
        return { success: true, type: 'design', project: { refrigerant: payload.refrigerant }, calculations: {} };
    };
    const confirmation = await orchestrator.handleMessage('confirm', 'intake-regression');
    assert.strictEqual(confirmation.success, true);
    assert.strictEqual(confirmedPayload.skipParsing, true);
    assert.strictEqual(confirmedPayload.payload.refrigerant, 'R717');
    assert.strictEqual(confirmedPayload.payload.coolingLoadPerRoomKW, 150);
    assert.strictEqual(confirmedPayload.payload.rooms.length, 12);
    assert(confirmedPayload.payload.rooms.every((room) => room.specifiedCoolingLoadKW === 150));

    console.log(JSON.stringify({
        status: 'passed',
        checks: [
            'paris-and-beef-extracted-without-defaults',
            'capacity-does-not-fabricate-room-dimensions',
            'awaiting-info-beef-is-clarification',
            'nvidia-remains-first-for-project-intake',
            'large-project-with-declared-room-count-asks-only-for-missing-dimensions',
            'negative-storage-temperature-is-not-coerced-from-null-to-zero',
            'dimension-follow-up-produces-reviewable-recommendations-with-nvidia-provenance',
            'confirm-blocks-zero-load-design-until-user-declares-per-room-load',
            'declared-per-room-load-is-propagated-to-all-user-defined-rooms',
            'confirm-sends-canonical-r717-code-not-display-label'
        ]
    }, null, 2));
})().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
