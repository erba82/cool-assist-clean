'use strict';

const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');
const mongoose = require('mongoose');

const DEFAULT_URI = 'mongodb://127.0.0.1:27017/cool_assist';
const DEFAULT_COLLECTION = 'agent_learning_events';
const OUTBOX_FILE = path.resolve(__dirname, '../../runtime/agent-learning-outbox.ndjson');
const ALLOWED_KINDS = new Set(['model-routing-outcome', 'design-semantic-observation', 'user-feedback', 'attachment-observation', 'runtime-diagnostic']);
const PROHIBITED_IMPACTS = new Set(['engineering-rule', 'equipment-selection', 'thermophysical-property', 'safety-setting', 'standard-claim', 'skill-installation']);

const asText = (value, max = 800) => String(value || '').replace(/\u0000/g, '').trim().slice(0, max);
const asFinite = (value) => Number.isFinite(Number(value)) ? Number(value) : null;
const safeScalar = (value, max = 800) => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return asFinite(value);
    return asText(value, max);
};
const safeObject = (value, depth = 0) => {
    if (!value || typeof value !== 'object' || depth > 3) return {};
    if (Array.isArray(value)) return value.slice(0, 20).map((item) => typeof item === 'object' ? safeObject(item, depth + 1) : safeScalar(item, 240));
    return Object.fromEntries(Object.entries(value).slice(0, 40).map(([key, item]) => [asText(key, 80), typeof item === 'object' ? safeObject(item, depth + 1) : safeScalar(item, 800)]));
};

class AgentLearningStore {
    constructor({ env = process.env, now = () => new Date(), mongooseImpl = mongoose } = {}) {
        this.env = env;
        this.now = now;
        this.mongoose = mongooseImpl;
        this.uri = env.AGENT_LEARNING_DATABASE_URI || env.MONGO_URI || DEFAULT_URI;
        this.collection = env.AGENT_LEARNING_COLLECTION || DEFAULT_COLLECTION;
        this.connection = null;
        this.Event = null;
        this.state = 'idle';
        this.lastError = null;
        this.lastAttemptAt = 0;
        this.initialization = null;
    }

    _schema() {
        return new this.mongoose.Schema({
            eventId: { type: String, required: true, unique: true, index: true },
            schema: { type: String, required: true },
            kind: { type: String, required: true, index: true },
            observedAt: { type: Date, required: true, index: true },
            source: { type: String, required: true, index: true },
            ingestionMode: { type: String, enum: ['automatic'], required: true },
            operationalUse: { type: String, enum: ['telemetry', 'observational-memory'], required: true },
            promotionBlocked: { type: Boolean, default: true },
            humanApprovalRequiredForPromotion: { type: Boolean, default: true },
            automaticEngineeringChange: { type: Boolean, default: false },
            automaticSkillInstallation: { type: Boolean, default: false },
            evidence: { type: this.mongoose.Schema.Types.Mixed, default: {} },
            metadata: { type: this.mongoose.Schema.Types.Mixed, default: {} }
        }, { versionKey: false, strict: true });
    }

    async initialize() {
        if (this.state === 'ready') return this.status();
        if (this.initialization) return this.initialization;
        this.lastAttemptAt = Date.now();
        this.state = 'connecting';
        this.initialization = (async () => {
            try {
                this.connection = this.mongoose.createConnection(this.uri, { serverSelectionTimeoutMS: 3500, connectTimeoutMS: 3500, family: 4 });
                await this.connection.asPromise();
                this.Event = this.connection.models.AgentLearningEvent || this.connection.model('AgentLearningEvent', this._schema(), this.collection);
                this.state = 'ready';
                this.lastError = null;
                await this.flushOutbox();
                return this.status();
            } catch (error) {
                this.state = 'offline';
                this.lastError = asText(error.message, 320);
                if (this.connection) await this.connection.close().catch(() => undefined);
                this.connection = null;
                this.Event = null;
                return this.status();
            } finally {
                this.initialization = null;
            }
        })();
        return this.initialization;
    }

    status() {
        return {
            state: this.state,
            database: this.state === 'ready' ? 'mongodb' : 'outbox-pending',
            collection: this.collection,
            automaticIngestion: true,
            automaticEngineeringChange: false,
            automaticSkillInstallation: false,
            promotionBlocked: true,
            lastError: this.lastError
        };
    }

    _buildEvent({ kind, source = 'agent-runtime', evidence = {}, metadata = {} }) {
        const safeKind = ALLOWED_KINDS.has(kind) ? kind : 'runtime-diagnostic';
        const safeEvidence = safeObject(evidence);
        const requestedImpact = safeEvidence.impactScope || metadata.impactScope || 'observational-memory';
        if (PROHIBITED_IMPACTS.has(requestedImpact)) throw new Error(`Automatic learning cannot write ${requestedImpact} changes.`);
        const observedAt = this.now();
        const nonce = crypto.randomUUID();
        return {
            eventId: `agent-event-${nonce}`,
            schema: 'cool-assist.agent-learning-event.v1',
            kind: safeKind,
            observedAt,
            source: asText(source, 120) || 'agent-runtime',
            ingestionMode: 'automatic',
            operationalUse: safeKind === 'model-routing-outcome' ? 'telemetry' : 'observational-memory',
            promotionBlocked: true,
            humanApprovalRequiredForPromotion: true,
            automaticEngineeringChange: false,
            automaticSkillInstallation: false,
            evidence: safeEvidence,
            metadata: safeObject(metadata)
        };
    }

    async _appendOutbox(event) {
        await fs.mkdir(path.dirname(OUTBOX_FILE), { recursive: true });
        await fs.appendFile(OUTBOX_FILE, `${JSON.stringify(event)}\n`, 'utf8');
    }

    async _insert(event) {
        if (!this.Event) throw new Error('Learning database is not connected.');
        try {
            const stored = await this.Event.create(event);
            return { stored: true, deduplicated: false, event: stored.toObject() };
        } catch (error) {
            if (error?.code === 11000) return { stored: true, deduplicated: true, event };
            throw error;
        }
    }

    async record(payload) {
        const event = this._buildEvent(payload || {});
        if (this.state !== 'ready' && (Date.now() - this.lastAttemptAt > 10000 || this.state === 'idle')) await this.initialize();
        if (this.state === 'ready') {
            try { return { ...(await this._insert(event)), persistence: 'mongodb' }; }
            catch (error) { this.state = 'offline'; this.lastError = asText(error.message, 320); }
        }
        await this._appendOutbox(event);
        return { stored: false, queued: true, persistence: 'outbox', event };
    }

    async flushOutbox() {
        if (this.state !== 'ready' || !this.Event) return { flushed: 0, remaining: null };
        let text;
        try { text = await fs.readFile(OUTBOX_FILE, 'utf8'); } catch (error) { if (error.code === 'ENOENT') return { flushed: 0, remaining: 0 }; throw error; }
        const entries = text.split(/\r?\n/).filter(Boolean).map((line) => { try { return JSON.parse(line); } catch (_) { return null; } }).filter(Boolean);
        let flushed = 0;
        const remaining = [];
        for (const event of entries) {
            try { await this._insert(event); flushed += 1; } catch (_) { remaining.push(event); }
        }
        if (remaining.length) await fs.writeFile(OUTBOX_FILE, `${remaining.map((event) => JSON.stringify(event)).join('\n')}\n`, 'utf8');
        else await fs.unlink(OUTBOX_FILE).catch((error) => { if (error.code !== 'ENOENT') throw error; });
        return { flushed, remaining: remaining.length };
    }

    async list({ limit = 100, kind } = {}) {
        await this.initialize();
        if (this.state !== 'ready' || !this.Event) return [];
        const query = kind && ALLOWED_KINDS.has(kind) ? { kind } : {};
        return this.Event.find(query).sort({ observedAt: -1 }).limit(Math.max(1, Math.min(500, Number(limit) || 100))).lean();
    }

    async stats() {
        await this.initialize();
        if (this.state !== 'ready' || !this.Event) return { ...this.status(), total: 0, byKind: {} };
        const rows = await this.Event.aggregate([{ $group: { _id: '$kind', count: { $sum: 1 } } }]);
        const byKind = Object.fromEntries(rows.map((row) => [row._id, row.count]));
        return { ...this.status(), total: Object.values(byKind).reduce((sum, count) => sum + count, 0), byKind };
    }

    async close() { if (this.connection) await this.connection.close(); this.connection = null; this.Event = null; this.state = 'idle'; }
}

module.exports = AgentLearningStore;
