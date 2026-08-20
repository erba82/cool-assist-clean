'use strict';

const assert = require('assert');
const fs = require('fs/promises');
const path = require('path');
const os = require('os');
const MultimodalAttachmentService = require('./services/MultimodalAttachmentService');
const McpConnectionRegistry = require('./services/McpConnectionRegistry');

(async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'cool-assist-governance-'));
    const attachmentService = new MultimodalAttachmentService({ uploadDirectory: path.join(root, 'uploads') });
    const result = await attachmentService.analyze({
        fileName: '../project_basis.txt', mimeType: 'text/plain',
        base64: Buffer.from('R717 system. Capacity provided by user: 500 kW.').toString('base64')
    });
    assert.strictEqual(result.analysis.kind, 'text');
    assert.strictEqual(result.analysis.status, 'extracted');
    assert.strictEqual(result.analysis.reviewRequired, true);
    assert.ok(result.attachment.stored);
    assert.ok(!result.attachment.fileName.includes('/'));

    const registry = new McpConnectionRegistry();
    const originalStore = path.resolve(__dirname, 'runtime/mcp-connections.json');
    let existing = null;
    try { existing = await fs.readFile(originalStore, 'utf8'); } catch (_) { /* absent is acceptable */ }
    const draft = await registry.createDraft({
        name: 'Example HTTPS MCP', transport: 'streamable-http', endpoint: 'https://mcp.example.com/api',
        sourceDocumentation: 'https://docs.example.com/mcp', requestedCapabilities: ['read catalogues']
    });
    assert.strictEqual(draft.status, 'draft');
    assert.strictEqual(draft.approvalRequired, true);
    assert.match(draft.notes, /No connection/i);
    assert.rejects(() => registry.createDraft({ name: 'Private', transport: 'streamable-http', endpoint: 'http://localhost:3000/mcp' }));

    if (existing === null) await fs.rm(originalStore, { force: true });
    else await fs.writeFile(originalStore, existing, 'utf8');
    await fs.rm(root, { recursive: true, force: true });
    console.log(JSON.stringify({ status: 'passed', checks: ['attachment-text-extraction', 'attachment-review-gated', 'mcp-draft-only', 'mcp-localhost-blocked'] }, null, 2));
})().catch((error) => { console.error(error); process.exit(1); });
