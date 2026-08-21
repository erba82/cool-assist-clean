'use strict';

const assert = require('assert');
const { PilotScorecard } = require('./pilot/PilotScorecard');

function main() {
  const checks = [];
  const scorecard = new PilotScorecard();
  const caseId = 'golden-r717-regression-unit-001';

  assert.strictEqual(scorecard.recordTimelineEvent({
    eventId: 'event-001', caseId, type: 'intake-complete', occurredAt: '2026-08-21T08:00:00.000Z', actor: 'Project intake reviewer'
  }).accepted, true);
  assert.strictEqual(scorecard.recordTimelineEvent({
    eventId: 'event-002', caseId, type: 'review-ready', occurredAt: '2026-08-21T12:00:00.000Z', actor: 'BIM/P&ID reviewer'
  }).accepted, true);
  assert.strictEqual(scorecard.recordTimelineEvent({
    eventId: 'event-003', caseId, type: 'review-decision', occurredAt: '2026-08-21T14:00:00.000Z', actor: 'Lead refrigeration engineer'
  }).accepted, true);
  checks.push('timeline-events-require-explicit-actors-and-timestamps');

  assert.strictEqual(scorecard.recordEvidence({
    evidenceId: 'evidence-001', caseId, source: 'Controlled test source', revision: 'TEST-REV-1', status: 'verified'
  }).accepted, true);
  const rejectedEvidence = scorecard.recordEvidence({
    evidenceId: 'evidence-002', caseId, source: 'Incomplete source', status: 'review-required'
  });
  assert.strictEqual(rejectedEvidence.accepted, false);
  checks.push('traceability-requires-source-and-revision-or-effective-date');

  assert.strictEqual(scorecard.recordDefect({
    defectId: 'defect-001', caseId, severity: 'critical', detectedAt: '2026-08-21T15:00:00.000Z', detectedBy: 'QA lead', escaped: true
  }).accepted, true);
  const incompleteDefect = scorecard.recordDefect({
    defectId: 'defect-002', caseId, severity: 'critical', detectedAt: '2026-08-21T15:00:00.000Z', detectedBy: 'QA lead'
  });
  assert.strictEqual(incompleteDefect.accepted, false);
  checks.push('critical-error-escape-requires-explicit-boolean');

  const result = scorecard.scorecase(caseId);
  assert.strictEqual(result.status, 'measured-review-required');
  assert.strictEqual(result.timestamps.intakeComplete, '2026-08-21T08:00:00.000Z');
  assert.strictEqual(result.durationsHours.intakeToReviewReady, 4);
  assert.strictEqual(result.traceability.completenessRatio, 1);
  assert.strictEqual(result.criticalErrorEscapes.escapedCriticalDefectCount, 1);
  assert.strictEqual(result.finalIssueAllowed, false);
  checks.push('scorecard-computes-only-from-entered-review-records');

  const log = scorecard.exportReviewLog(caseId);
  assert.strictEqual(log.timelineEvents.length, 3);
  assert.strictEqual(log.evidenceRecords.length, 1);
  assert.strictEqual(log.defects.length, 1);
  assert.strictEqual(log.scorecard.caseId, caseId);
  assert.strictEqual(log.finalIssueAllowed, false);
  checks.push('review-log-is-exportable-and-remains-review-gated');

  console.log(JSON.stringify({ status: 'passed', checks }, null, 2));
}

try {
  main();
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
