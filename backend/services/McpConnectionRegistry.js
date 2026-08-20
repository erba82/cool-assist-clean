'use strict';

const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

const STORE = path.resolve(__dirname, '../runtime/mcp-connections.json');
const ALLOWED_TRANSPORTS = new Set(['streamable-http', 'sse', 'stdio']);

const readStore = async () => {
    try { return JSON.parse(await fs.readFile(STORE, 'utf8')); }
    catch (error) { if (error.code === 'ENOENT') return { connections: [] }; throw error; }
};
const writeStore = async (value) => {
    await fs.mkdir(path.dirname(STORE), { recursive: true });
    await fs.writeFile(STORE, JSON.stringify(value, null, 2), 'utf8');
};
const safeName = (name) => String(name || '').trim().replace(/[^a-zA-Z0-9 _.-]/g, '').slice(0, 80);
const validateUrl = (value) => {
    if (!value) return null;
    const url = new URL(String(value));
    if (url.protocol !== 'https:') throw new Error('Remote MCP endpoints must use HTTPS.');
    if (/^(localhost|127\.0\.0\.1|0\.0\.0\.0|::1)$/i.test(url.hostname)) throw new Error('Localhost is not allowed for remote MCP drafts. Use a reviewed stdio connector for local servers.');
    return url.toString();
};

class McpConnectionRegistry {
    async list() {
        const state = await readStore();
        return state.connections.map(({ secretEnv, ...safe }) => ({ ...safe, secretConfigured: Boolean(secretEnv) }));
    }

    async createDraft(input) {
        const transport = String(input?.transport || 'streamable-http');
        if (!ALLOWED_TRANSPORTS.has(transport)) throw new Error(`Unsupported MCP transport: ${transport}`);
        const name = safeName(input?.name);
        if (!name) throw new Error('Connection name is required.');
        if (transport === 'stdio') throw new Error('Stdio MCP connections are not accepted through the web UI. Install them through an administrator-reviewed deployment configuration.');
        const endpoint = validateUrl(input?.endpoint);
        if (!endpoint) throw new Error('A HTTPS MCP endpoint is required.');
        const sourceDocumentation = validateUrl(input?.sourceDocumentation);
        const state = await readStore();
        const connection = {
            id: crypto.randomUUID(), name, transport, endpoint, sourceDocumentation: sourceDocumentation || null,
            requestedCapabilities: Array.isArray(input?.requestedCapabilities) ? input.requestedCapabilities.slice(0, 12).map((item) => String(item).slice(0, 100)) : [],
            status: 'draft', approvalRequired: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
            notes: 'Draft only. No connection, tool discovery, credential transmission or project mutation occurs until an administrator approves and activates this integration.'
        };
        state.connections.push(connection);
        await writeStore(state);
        return connection;
    }
}

module.exports = McpConnectionRegistry;
