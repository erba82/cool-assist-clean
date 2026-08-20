'use strict';

const crypto = require('crypto');

const stableEvidence = (project, semanticCycle) => ({
    refrigerant: project?.refrigerant || null,
    compressorFamily: semanticCycle?.compressorFamily || null,
    condenserType: semanticCycle?.condenserType || null,
    feedMethod: semanticCycle?.feedMethod || null,
    templateId: semanticCycle?.template?.id || null,
    processAreas: (semanticCycle?.processAreas || []).map((area) => ({ id: area.id, type: area.type }))
});

/**
 * Produces a reviewable learning proposal from verified project semantics.
 * It never writes skills, modifies rules, changes standards, or trains a model.
 */
class LearningGovernanceService {
    propose({ project, semanticCycle, source = 'design-request' }) {
        const evidence = stableEvidence(project, semanticCycle);
        const fingerprint = crypto.createHash('sha256').update(JSON.stringify(evidence)).digest('hex').slice(0, 16);
        const slug = [evidence.refrigerant || 'unknown', evidence.templateId || 'unclassified'].join('-').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        const unclassified = !semanticCycle?.validation?.valid || semanticCycle?.validation?.engineeringReviewRequired || !evidence.templateId;

        return {
            schema: 'cool-assist.learning-proposal.v1',
            proposalId: `proposal-${fingerprint}`,
            status: 'proposed',
            requiresHumanApproval: true,
            source,
            evidence,
            sourceFingerprint: fingerprint,
            skillDraft: {
                name: `refrigeration-${slug || 'review-required'}-pattern`,
                description: 'Proposed reusable engineering workflow created from reviewed semantic P&ID evidence.',
                allowedContent: ['workflow', 'evidence schema', 'test scenarios'],
                prohibitedContent: ['unsourced standard requirements', 'fabricated equipment geometry', 'automatic production-rule changes', 'unreviewed safety settings']
            },
            reviewChecklist: [
                'Verify the source P&ID nodes, tags and equipment evidence.',
                'Verify refrigerant profile and cycle template selection.',
                'Verify manufacturer catalogue/GA data before adding geometry or ports.',
                'Verify applicable code and standards with the responsible engineer before promoting a rule.'
            ],
            promotionBlocked: unclassified,
            reason: unclassified ? 'Semantic cycle is incomplete or requires engineering review.' : 'Proposal is ready for human review; approval is still required before any reusable skill is created.'
        };
    }
}

module.exports = LearningGovernanceService;
