'use strict';

const express = require('express');
const LearningReviewRegistry = require('../core/ai/LearningReviewRegistry');
const AgentLearningStore = require('../core/ai/AgentLearningStore');

const router = express.Router();
const registry = new LearningReviewRegistry();
const automaticStore = new AgentLearningStore();
void automaticStore.initialize();

/**
 * Runtime observations and user feedback are automatically persisted in MongoDB.
 * Promotion into an engineering rule, equipment-selection policy, safety setting,
 * standards claim, or installed skill remains separately review-gated.
 */
router.get('/events', async (req, res) => {
    try {
        const events = await automaticStore.list({ limit: req.query?.limit, kind: req.query?.kind });
        res.json({ success: true, events, storage: automaticStore.status() });
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

router.get('/proposals', async (_req, res) => {
    try {
        res.json({ success: true, proposals: await registry.list(), policy: 'Proposals are reserved for controlled promotion of engineering rules, skills, or other production-impacting changes.' });
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

router.post('/feedback', async (req, res) => {
    try {
        const event = await automaticStore.record({
            kind: 'user-feedback',
            source: 'user-feedback',
            evidence: {
                interactionId: req.body?.interactionId || null,
                rating: req.body?.rating ?? null,
                category: req.body?.category || null,
                feedback: req.body?.feedback || req.body?.summary || null
            },
            metadata: { attachmentId: req.body?.attachmentId || null }
        });
        res.status(201).json({ success: true, event, message: 'Feedback was stored automatically as observational memory. It cannot change engineering rules or install skills.' });
    } catch (error) { res.status(400).json({ success: false, error: error.message, type: 'learning_feedback_error' }); }
});

router.post('/findings', async (req, res) => {
    try {
        const event = await automaticStore.record({
            kind: 'runtime-diagnostic',
            source: req.body?.source || 'engineering-validation',
            evidence: { summary: req.body?.summary, detail: req.body?.detail, ...(req.body?.evidence || {}) },
            metadata: { reportedBy: 'api' }
        });
        res.status(201).json({ success: true, event, message: 'Finding was stored automatically as runtime evidence. Production-impacting promotion remains blocked.' });
    } catch (error) { res.status(400).json({ success: false, error: error.message, type: 'learning_finding_error' }); }
});

router.post('/proposals/:id/review', async (req, res) => {
    try {
        const proposal = await registry.markReviewed(req.params.id, req.body?.reviewNote);
        res.json({ success: true, proposal, policy: 'Reviewed promotion still requires controlled implementation and regression testing.' });
    } catch (error) { res.status(404).json({ success: false, error: error.message }); }
});

router.get('/proposals/:id/skill-draft', async (req, res) => {
    try {
        const draft = await registry.buildSkillDraft(req.params.id);
        res.json({ success: true, draft, policy: 'Draft only. Source review and approval remain required before installing a skill.' });
    } catch (error) { res.status(400).json({ success: false, error: error.message, type: 'skill_draft_error' }); }
});

router.get('/stats', async (_req, res) => {
    try {
        const [proposals, automatic] = await Promise.all([registry.list(), automaticStore.stats()]);
        const proposalCounts = proposals.reduce((summary, item) => ({ ...summary, [item.status]: (summary[item.status] || 0) + 1 }), {});
        res.json({ success: true, stats: { automatic, promotionProposals: { total: proposals.length, byStatus: proposalCounts }, automaticRuleChange: false, automaticSkillCreation: false } });
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

module.exports = router;
