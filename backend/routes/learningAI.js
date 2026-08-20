'use strict';

const express = require('express');
const LearningReviewRegistry = require('../core/ai/LearningReviewRegistry');

const router = express.Router();
const registry = new LearningReviewRegistry();

/**
 * Learning endpoints only record reviewable evidence. They never train a model,
 * reuse an unverified answer, write a Skill, change an engineering rule, or
 * change an active project automatically.
 */
router.get('/proposals', async (_req, res) => {
    try {
        res.json({ success: true, proposals: await registry.list(), policy: 'Every learning proposal needs human review before a separate skill draft or regression test is created.' });
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

router.post('/feedback', async (req, res) => {
    try {
        const proposal = await registry.record({
            kind: 'feedback',
            summary: req.body?.summary || req.body?.feedback,
            detail: req.body?.detail || req.body?.feedback,
            evidence: { interactionId: req.body?.interactionId || null, rating: req.body?.rating ?? null, attachmentId: req.body?.attachmentId || null },
            source: 'user-feedback'
        });
        res.status(201).json({ success: true, proposal, message: 'Feedback was recorded as a proposed learning item. No rule, skill, model or active project was changed.' });
    } catch (error) { res.status(400).json({ success: false, error: error.message, type: 'learning_feedback_error' }); }
});

router.post('/findings', async (req, res) => {
    try {
        const proposal = await registry.record({
            kind: 'test-finding', summary: req.body?.summary, detail: req.body?.detail,
            evidence: req.body?.evidence, source: req.body?.source || 'engineering-validation'
        });
        res.status(201).json({ success: true, proposal, message: 'Finding recorded for human review. Add a regression test or skill draft only after evidence approval.' });
    } catch (error) { res.status(400).json({ success: false, error: error.message, type: 'learning_finding_error' }); }
});

router.post('/proposals/:id/review', async (req, res) => {
    try {
        const proposal = await registry.markReviewed(req.params.id, req.body?.reviewNote);
        res.json({ success: true, proposal, policy: 'Reviewed does not activate a skill or change engineering rules. A separate controlled implementation and test are required.' });
    } catch (error) { res.status(404).json({ success: false, error: error.message }); }
});

router.get('/proposals/:id/skill-draft', async (req, res) => {
    try {
        const draft = await registry.buildSkillDraft(req.params.id);
        res.json({ success: true, draft, policy: 'Draft only. Download, source-review, and human approval are required before installing any skill.' });
    } catch (error) { res.status(400).json({ success: false, error: error.message, type: 'skill_draft_error' }); }
});

router.get('/stats', async (_req, res) => {
    try {
        const proposals = await registry.list();
        const counts = proposals.reduce((summary, item) => ({ ...summary, [item.status]: (summary[item.status] || 0) + 1 }), {});
        res.json({ success: true, stats: { total: proposals.length, byStatus: counts, automaticRuleChange: false, automaticSkillCreation: false } });
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

module.exports = router;
