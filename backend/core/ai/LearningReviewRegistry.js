'use strict';

const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

const STORE = path.resolve(__dirname, '../../runtime/learning-review-proposals.json');
const asText = (value, max = 4000) => String(value || '').trim().replace(/\u0000/g, '').slice(0, max);
const cleanEvidence = (evidence) => {
    if (!evidence || typeof evidence !== 'object' || Array.isArray(evidence)) return {};
    return Object.fromEntries(Object.entries(evidence).slice(0, 30).map(([key, value]) => [asText(key, 80), typeof value === 'string' ? asText(value, 1000) : value]));
};
const read = async () => { try { return JSON.parse(await fs.readFile(STORE, 'utf8')); } catch (error) { if (error.code === 'ENOENT') return { proposals: [] }; throw error; } };
const write = async (data) => { await fs.mkdir(path.dirname(STORE), { recursive: true }); await fs.writeFile(STORE, JSON.stringify(data, null, 2), 'utf8'); };

class LearningReviewRegistry {
    async list() { return (await read()).proposals; }

    async record({ kind, summary, detail, evidence = {}, source = 'user-feedback' }) {
        const recordKind = ['feedback', 'test-finding', 'document-observation', 'design-pattern'].includes(kind) ? kind : 'feedback';
        const safeSummary = asText(summary, 280);
        if (!safeSummary) throw new Error('A concise learning summary is required.');
        const state = await read();
        const fingerprint = crypto.createHash('sha256').update(JSON.stringify({ recordKind, safeSummary, evidence: cleanEvidence(evidence) })).digest('hex').slice(0, 16);
        const existing = state.proposals.find((proposal) => proposal.fingerprint === fingerprint && proposal.status !== 'rejected');
        if (existing) return { ...existing, deduplicated: true };
        const proposal = {
            id: `learning-${fingerprint}`,
            fingerprint,
            schema: 'cool-assist.learning-review.v1',
            kind: recordKind,
            summary: safeSummary,
            detail: asText(detail, 4000),
            evidence: cleanEvidence(evidence),
            source: asText(source, 120) || 'user-feedback',
            status: 'proposed',
            requiresHumanApproval: true,
            promotionBlocked: true,
            permittedNextSteps: ['review evidence', 'attach source documents', 'write a proposed skill draft', 'add regression test'],
            prohibitedNextSteps: ['automatically change engineering rules', 'claim standards compliance', 'learn from unverified external content', 'modify production selection criteria'],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        state.proposals.push(proposal);
        await write(state);
        return proposal;
    }

    async markReviewed(id, reviewerNote) {
        const state = await read();
        const proposal = state.proposals.find((item) => item.id === id);
        if (!proposal) throw new Error('Learning proposal was not found.');
        proposal.status = 'reviewed';
        proposal.reviewNote = asText(reviewerNote, 2000);
        proposal.updatedAt = new Date().toISOString();
        await write(state);
        return proposal;
    }

    async buildSkillDraft(id) {
        const proposal = (await read()).proposals.find((item) => item.id === id);
        if (!proposal) throw new Error('Learning proposal was not found.');
        if (proposal.status !== 'reviewed') throw new Error('A human-reviewed proposal is required before a skill draft can be generated.');
        const slug = proposal.summary.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48) || 'reviewed-engineering-pattern';
        const markdown = `---\nname: ${slug}\ndescription: Proposed review-only engineering skill generated from approved evidence. Use when the documented pattern and its source evidence match the new task.\n---\n\n# ${proposal.summary}\n\n## Guardrails\n\n- Treat this as a draft: do not modify engineering rules or selection logic without a separate implementation review and regression test.\n- Re-read every cited source before applying it to a new project.\n- Keep capacity, dimensions, DN, pricing, safety settings and compliance claims review-required unless the project supplies authoritative evidence.\n\n## Reviewed evidence\n\n\`\`\`json\n${JSON.stringify(proposal.evidence, null, 2)}\n\`\`\`\n\n## Workflow\n\n1. Validate the evidence against the active project and its refrigerant profile.\n2. Reproduce the issue or design pattern with a deterministic test.\n3. Propose a bounded change and record its source, limitation and regression coverage.\n4. Obtain engineering approval before promoting any production rule.\n\n## Review note\n\n${proposal.reviewNote || 'No review narrative supplied.'}\n`;
        return { proposalId: proposal.id, status: 'draft-only', requiresHumanApproval: true, fileName: `${slug}.md`, markdown };
    }
}

module.exports = LearningReviewRegistry;
