'use strict';

const express = require('express');
const McpConnectionRegistry = require('../services/McpConnectionRegistry');

const router = express.Router();
const registry = new McpConnectionRegistry();

router.get('/mcp', async (_req, res) => {
    try {
        res.json({ success: true, connections: await registry.list(), policy: 'MCP drafts require administrator approval before any network connection or tool discovery.' });
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

router.post('/mcp/drafts', async (req, res) => {
    try {
        const draft = await registry.createDraft(req.body || {});
        res.status(201).json({ success: true, draft, policy: 'No network connection, secret transmission, tool discovery, or project mutation occurred.' });
    } catch (error) { res.status(400).json({ success: false, error: error.message, type: 'mcp_draft_error' }); }
});

module.exports = router;
