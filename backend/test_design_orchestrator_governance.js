'use strict';

const assert = require('assert');
const DesignOrchestrator = require('./core/ai/DesignOrchestrator');

(async () => {
    const orchestrator = new DesignOrchestrator();
    const response = await orchestrator.processRequest('R717 design test', true, {
        name: 'Governance Integration Test',
        location: { city: 'Dubai', country: 'AE' },
        refrigerant: 'R717',
        capacity: 100,
        rooms: [{ id: 'cold-01', name: 'Cold Room 1', temperature: -25, capacity: 100 }],
        designIntent: { compressorFamily: 'screw', feedMethod: 'pumped_recirculated', condenserType: 'evaporative_condenser' }
    });

    assert.strictEqual(response.success, true);
    assert(response.learningProposal, 'The design response must include a governed learning proposal.');
    assert.strictEqual(response.learningProposal.requiresHumanApproval, true);
    assert.strictEqual(response.learningProposal.status, 'proposed');
    assert(response.semanticCycle, 'Semantic cycle must remain available in the response.');
    console.log(JSON.stringify({ status: 'passed', proposalId: response.learningProposal.proposalId, semanticTemplate: response.semanticCycle?.template?.id || null }, null, 2));
})().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
