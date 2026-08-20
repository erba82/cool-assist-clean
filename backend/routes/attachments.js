'use strict';

const express = require('express');
const MultimodalAttachmentService = require('../services/MultimodalAttachmentService');

const router = express.Router();
const attachmentService = new MultimodalAttachmentService();

router.get('/supported-types', (_req, res) => res.json({ success: true, ...attachmentService.supportedTypes() }));

router.post('/analyze', async (req, res) => {
    try {
        const result = await attachmentService.analyze(req.body || {});
        res.status(201).json({
            success: true,
            ...result,
            policy: {
                projectMutation: 'prohibited',
                engineeringRuleMutation: 'prohibited',
                skillCreation: 'human-approval-required'
            }
        });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message, type: 'attachment_analysis_error' });
    }
});

module.exports = router;
