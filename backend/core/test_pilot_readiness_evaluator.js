'use strict';

const assert = require('assert');
const { evaluatePilotReadiness } = require('./pilot/PilotReadinessEvaluator');

function goldenCase() {
  return {
    caseId: 'golden-r717-evaluator-unit-001',
    title: 'Controlled R717 readiness evaluator record',
    designBasis: {
      refrigerant: 'R717',
      projectType: 'industrial-cold-storage',
      jurisdiction: 'reviewed-test-jurisdiction',
      locationClimateEvidenceId: 'evidence:climate:evaluator-001',
      operatingConditionsSI: { evidenceReference: 'evidence:operating-point:evaluator-001' }
    },
    sourceLedger: [
      { evidenceId: 'evidence:climate:evaluator-001', source: 'Controlled test ledger', revision: 'TEST-REV-1', status: 'verified' },
      { evidenceId: 'evidence:operating-point:evaluator-001', source: 'Controlled test ledger', revision: 'TEST-REV-1', status: 'verified' }
    ],
    expectedReviewDecisions: [{ gate: 'physics', status: 'review-required' }],
    review: { status: 'approved-for-regression', signatures: [{ reviewer: 'Controlled QA Reviewer', role: 'qa', signedAt: '2026-08-21T00:00:00.000Z' }] }
  };
}

function candidate() {
  const caseId = goldenCase().caseId;
  return {
    goldenCase: goldenCase(),
    providerRuntime: { health: { status: 'healthy' } },
    graph: {
      nodes: [{ id: 'COMP-01', type: 'compressor' }, { id: 'COND-01', type: 'condenser' }],
      connections: [{ from: 'COMP-01', to: 'COND-01', service: 'hot-gas' }],
      crossRefrigerantContamination: false
    },
    variances: [{
      varianceId: 'variance-evaluator-001', caseId, description: 'Controlled variance review', category: 'input-basis', severity: 'minor', owner: 'Lead refrigeration engineer'
    }],
    scorecard: {
      events: [
        { eventId: 'event-evaluator-001', caseId, type: 'intake-complete', occurredAt: '2026-08-21T08:00:00.000Z', actor: 'Intake reviewer' },
        { eventId: 'event-evaluator-002', caseId, type: 'review-ready', occurredAt: '2026-08-21T12:00:00.000Z', actor: 'BIM/P&ID reviewer' },
        { eventId: 'event-evaluator-003', caseId, type: 'review-decision', occurredAt: '2026-08-21T14:00:00.000Z', actor: 'Lead refrigeration engineer' }
      ],
      evidence: [{ evidenceId: 'evidence-scorecard-001', caseId, source: 'Controlled test ledger', revision: 'TEST-REV-1', status: 'verified' }],
      defects: []
    },
    controlledHandoff: {
      reviewPackRevision: 'PILOT-REV-1',
      approvals: [{ reviewer: 'Lead refrigeration engineer', decidedAt: '2026-08-21T15:00:00.000Z' }]
    },
    partnerFeedback: { source: 'Controlled design partner feedback', revision: 'TEST-REV-1' }
  };
}

function main() {
  const checks = [];
  const readiness = evaluatePilotReadiness(candidate());
  assert.strictEqual(readiness.gates[0].status, 'passed');
  assert.strictEqual(readiness.gates[1].status, 'review-required');
  assert.strictEqual(readiness.gates[2].status, 'review-required');
  assert.strictEqual(readiness.gates[3].status, 'review-required');
  assert.strictEqual(readiness.gates[4].status, 'review-required');
  assert.strictEqual(readiness.finalIssueAllowed, false);
  checks.push('complete-evidence-remains-review-gated-through-g4');

  const unavailableProvider = candidate();
  unavailableProvider.providerRuntime.health.status = 'unavailable';
  const blocked = evaluatePilotReadiness(unavailableProvider);
  assert.strictEqual(blocked.gates[0].status, 'blocked');
  assert.strictEqual(blocked.gates[3].status, 'blocked');
  assert.strictEqual(blocked.finalIssueAllowed, false);
  checks.push('provider-unavailability-blocks-g0-and-controlled-handoff');

  const unresolvedVariance = candidate();
  unresolvedVariance.variances[0].category = 'unapproved-category';
  const varianceBlocked = evaluatePilotReadiness(unresolvedVariance);
  assert.strictEqual(varianceBlocked.gates[2].status, 'blocked');
  assert.strictEqual(varianceBlocked.varianceSummary.unresolved, 1);
  checks.push('unresolved-variance-blocks-parallel-engineering');

  console.log(JSON.stringify({ status: 'passed', checks }, null, 2));
}

try {
  main();
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
