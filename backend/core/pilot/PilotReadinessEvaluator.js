'use strict';

const { validateGoldenCase, classifyVariance } = require('./GoldenCaseRegistry');
const { PilotScorecard } = require('./PilotScorecard');

const STATUS_ORDER = Object.freeze({ passed: 0, 'review-required': 1, blocked: 2 });

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function recordOf(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function hasText(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function gate(id, status, blockers, evidenceRequired) {
  return {
    id,
    status,
    blockers: [...new Set(blockers.filter(Boolean))],
    evidenceRequired: [...new Set(evidenceRequired.filter(Boolean))]
  };
}

function highestStatus(gates) {
  return gates.reduce((current, item) => STATUS_ORDER[item.status] > STATUS_ORDER[current] ? item.status : current, 'passed');
}

function evaluatePilotReadiness(candidate = {}) {
  const goldenCase = recordOf(candidate.goldenCase);
  const golden = validateGoldenCase(goldenCase);
  const caseId = goldenCase.caseId || null;
  const providerHealth = recordOf(recordOf(candidate.providerRuntime).health);
  const graph = recordOf(candidate.graph);
  const variances = asArray(candidate.variances).map(classifyVariance);
  const scorecardInput = recordOf(candidate.scorecard);
  const scorecard = new PilotScorecard({
    events: asArray(scorecardInput.events),
    evidence: asArray(scorecardInput.evidence),
    defects: asArray(scorecardInput.defects)
  });
  const score = caseId ? scorecard.scorecase(caseId) : null;
  const handoff = recordOf(candidate.controlledHandoff);
  const feedback = recordOf(candidate.partnerFeedback);

  const g0Blockers = [];
  if (providerHealth.status !== 'healthy') g0Blockers.push('Validated thermophysical provider health is not healthy.');
  if (!golden.signed) g0Blockers.push(...golden.issues);
  const g0 = gate('G0-product-data-readiness', g0Blockers.length ? 'blocked' : 'passed', g0Blockers, ['healthy provider runtime', 'signed golden case', 'source ledger', 'named reviewers']);

  const g1Blockers = [];
  const nodes = asArray(graph.nodes);
  const connections = asArray(graph.connections);
  if (!nodes.length || !connections.length) g1Blockers.push('Semantic graph nodes and connections are required for shadow-design review.');
  if (graph.crossRefrigerantContamination === true) g1Blockers.push('Cross-refrigerant contamination is flagged in the design graph.');
  const g1 = gate('G1-shadow-design', g1Blockers.length ? 'blocked' : 'review-required', g1Blockers.length ? g1Blockers : ['Semantic graph review by the assigned P&ID/BIM reviewer remains required.'], ['semantic graph review', 'cross-refrigerant check']);

  const g2Blockers = [];
  if (variances.some((item) => !item.resolved)) g2Blockers.push('At least one design variance has no approved root cause and owner.');
  if (!score || score.status === 'no-measured-data') g2Blockers.push('Measured scorecard baseline has not been recorded.');
  if (score?.criticalErrorEscapes?.escapedCriticalDefectCount > 0) g2Blockers.push('A critical error escape is recorded and must be resolved before the next gate.');
  const g2 = gate('G2-parallel-engineering', g2Blockers.length ? 'blocked' : 'review-required', g2Blockers.length ? g2Blockers : ['Parallel engineering results require human comparison and reviewer decision.'], ['variance root-cause register', 'scorecard baseline', 'critical error escape review']);

  const g3Blockers = [];
  if (!hasText(handoff.reviewPackRevision)) g3Blockers.push('Controlled handoff requires a revisioned review pack.');
  if (!asArray(handoff.approvals).length) g3Blockers.push('Controlled handoff requires named human approval records.');
  const priorBlocked = [g0, g1, g2].some((item) => item.status === 'blocked');
  if (priorBlocked) g3Blockers.push('Controlled handoff is blocked while a preceding pilot gate is blocked.');
  const g3 = gate('G3-controlled-handoff', g3Blockers.length ? 'blocked' : 'review-required', g3Blockers.length ? g3Blockers : ['Controlled handoff remains subject to the recorded human approvals.'], ['revisioned review pack', 'approval records', 'closed critical blockers']);

  const g4Blockers = [];
  if (!score || score.status === 'no-measured-data') g4Blockers.push('Pilot readout requires a measured scorecard.');
  if (!hasText(feedback.source) || !hasText(feedback.revision)) g4Blockers.push('Pilot readout requires a traceable design-partner feedback record.');
  const g4 = gate('G4-readout', g4Blockers.length ? 'blocked' : 'review-required', g4Blockers.length ? g4Blockers : ['Scale, narrow or stop remains a human product decision.'], ['measured scorecard', 'design-partner feedback', 'decision record']);

  const gates = [g0, g1, g2, g3, g4];
  return {
    contractVersion: '1.0.0',
    status: highestStatus(gates),
    pilotRefrigerant: golden.refrigerant || null,
    gates,
    goldenCase: {
      valid: golden.valid,
      signed: golden.signed,
      caseId
    },
    scorecard: score,
    varianceSummary: {
      total: variances.length,
      unresolved: variances.filter((item) => !item.resolved).length
    },
    finalIssueAllowed: false,
    note: 'This evaluator reports pilot governance evidence only. It does not approve construction, procurement, safety, regulatory compliance or a final engineering issue.'
  };
}

module.exports = { evaluatePilotReadiness, STATUS_ORDER };
