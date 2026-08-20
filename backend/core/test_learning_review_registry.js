'use strict';

const assert = require('assert');
const fs = require('fs/promises');
const path = require('path');
const LearningReviewRegistry = require('./ai/LearningReviewRegistry');

(async () => {
    const store = path.resolve(__dirname, '../runtime/learning-review-proposals.json');
    let existing = null;
    try { existing = await fs.readFile(store, 'utf8'); } catch (_) { /* no store is valid */ }
    await fs.rm(store, { force: true });
    const registry = new LearningReviewRegistry();
    const proposal = await registry.record({ kind: 'test-finding', summary: 'R134a P&ID medium tag mismatch', detail: 'Normalize profile id in generated line metadata.', evidence: { refrigerant: 'R134a', test: 'test_all_refrigerant_pid_profiles' } });
    assert.strictEqual(proposal.status, 'proposed');
    assert.strictEqual(proposal.requiresHumanApproval, true);
    assert.strictEqual(proposal.promotionBlocked, true);
    assert.ok(proposal.prohibitedNextSteps.includes('automatically change engineering rules'));
    const duplicate = await registry.record({ kind: 'test-finding', summary: 'R134a P&ID medium tag mismatch', detail: 'Ignored duplicate', evidence: { refrigerant: 'R134a', test: 'test_all_refrigerant_pid_profiles' } });
    assert.strictEqual(duplicate.id, proposal.id);
    assert.strictEqual(duplicate.deduplicated, true);
    const reviewed = await registry.markReviewed(proposal.id, 'Evidence and regression test reviewed.');
    assert.strictEqual(reviewed.status, 'reviewed');
    assert.strictEqual(reviewed.promotionBlocked, true);
    const draft = await registry.buildSkillDraft(proposal.id);
    assert.strictEqual(draft.status, 'draft-only');
    assert.strictEqual(draft.requiresHumanApproval, true);
    assert.match(draft.markdown, /Guardrails/);
    if (existing === null) await fs.rm(store, { force: true }); else await fs.writeFile(store, existing, 'utf8');
    console.log(JSON.stringify({ status: 'passed', checks: ['proposal-review-gated', 'rule-change-prohibited', 'duplicate-evidence-coalesced', 'review-does-not-promote-skill', 'reviewed-proposal-produces-draft-only'] }, null, 2));
})().catch((error) => { console.error(error); process.exit(1); });
