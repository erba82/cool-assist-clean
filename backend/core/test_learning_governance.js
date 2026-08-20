'use strict';

const assert = require('assert');
const LearningGovernanceService = require('./ai/LearningGovernanceService');

const service = new LearningGovernanceService();

const reviewed = service.propose({
    project: { refrigerant: 'R717' },
    semanticCycle: {
        compressorFamily: 'screw', condenserType: 'evaporative_condenser', feedMethod: 'pumped_recirculated',
        template: { id: 'R717_PUMPED_SCREW_EVAPORATIVE' }, processAreas: [{ id: 'IQF-01', type: 'iqf_tunnel' }],
        validation: { valid: true, engineeringReviewRequired: false }
    }
});
assert.strictEqual(reviewed.status, 'proposed');
assert.strictEqual(reviewed.requiresHumanApproval, true);
assert.strictEqual(reviewed.promotionBlocked, false);
assert(reviewed.skillDraft.prohibitedContent.includes('automatic production-rule changes'));

const unclassified = service.propose({ project: { refrigerant: 'R717' }, semanticCycle: { validation: { valid: false, engineeringReviewRequired: true } } });
assert.strictEqual(unclassified.promotionBlocked, true);
assert.strictEqual(unclassified.requiresHumanApproval, true);

console.log(JSON.stringify({ status: 'passed', checks: ['proposal-is-review-gated', 'unclassified-cycle-is-blocked', 'automatic-rule-change-is-prohibited'] }, null, 2));
