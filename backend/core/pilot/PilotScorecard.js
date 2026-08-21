'use strict';

const CONTRACT_VERSION = '1.0.0';
const TIMELINE_EVENTS = Object.freeze(['intake-complete', 'review-ready', 'review-decision', 'rework-started', 'rework-complete']);
const EVIDENCE_STATUSES = Object.freeze(['verified', 'review-required', 'blocked']);
const DEFECT_SEVERITIES = Object.freeze(['minor', 'major', 'critical']);

function hasText(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function stableClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function validTimestamp(value) {
  return hasText(value) && Number.isFinite(Date.parse(value));
}

function validateTimelineEvent(event = {}) {
  const issues = [];
  if (!hasText(event.eventId)) issues.push('eventId is required.');
  if (!hasText(event.caseId)) issues.push('caseId is required.');
  if (!TIMELINE_EVENTS.includes(event.type)) issues.push(`type must be one of: ${TIMELINE_EVENTS.join(', ')}.`);
  if (!validTimestamp(event.occurredAt)) issues.push('occurredAt must be an ISO-8601 timestamp.');
  if (!hasText(event.actor)) issues.push('actor is required.');
  return { valid: issues.length === 0, issues };
}

function validateEvidenceRecord(evidence = {}) {
  const issues = [];
  if (!hasText(evidence.evidenceId)) issues.push('evidenceId is required.');
  if (!hasText(evidence.caseId)) issues.push('caseId is required.');
  if (!hasText(evidence.source)) issues.push('source is required.');
  if (!hasText(evidence.revision) && !hasText(evidence.effectiveDate)) issues.push('revision or effectiveDate is required.');
  if (!EVIDENCE_STATUSES.includes(evidence.status)) issues.push(`status must be one of: ${EVIDENCE_STATUSES.join(', ')}.`);
  return { valid: issues.length === 0, issues };
}

function validateDefect(defect = {}) {
  const issues = [];
  if (!hasText(defect.defectId)) issues.push('defectId is required.');
  if (!hasText(defect.caseId)) issues.push('caseId is required.');
  if (!DEFECT_SEVERITIES.includes(defect.severity)) issues.push(`severity must be one of: ${DEFECT_SEVERITIES.join(', ')}.`);
  if (!hasText(defect.detectedAt)) issues.push('detectedAt is required.');
  if (!hasText(defect.detectedBy)) issues.push('detectedBy is required.');
  if (typeof defect.escaped !== 'boolean') issues.push('escaped must be explicit boolean.');
  return { valid: issues.length === 0, issues };
}

function latestTimestamp(events, type) {
  const relevant = events.filter((event) => event.type === type && validTimestamp(event.occurredAt));
  if (!relevant.length) return null;
  return relevant.reduce((latest, event) => Date.parse(event.occurredAt) > Date.parse(latest.occurredAt) ? event : latest).occurredAt;
}

function elapsedHours(start, end) {
  if (!start || !end) return null;
  const startAt = Date.parse(start);
  const endAt = Date.parse(end);
  if (!Number.isFinite(startAt) || !Number.isFinite(endAt) || endAt < startAt) return null;
  return (endAt - startAt) / 3_600_000;
}

class PilotScorecard {
  constructor({ events = [], evidence = [], defects = [] } = {}) {
    this.events = [];
    this.evidence = [];
    this.defects = [];
    asArray(events).forEach((event) => this.recordTimelineEvent(event));
    asArray(evidence).forEach((item) => this.recordEvidence(item));
    asArray(defects).forEach((item) => this.recordDefect(item));
  }

  recordTimelineEvent(event) {
    const validation = validateTimelineEvent(event);
    if (!validation.valid) return { accepted: false, validation };
    this.events.push(stableClone(event));
    return { accepted: true, validation };
  }

  recordEvidence(evidence) {
    const validation = validateEvidenceRecord(evidence);
    if (!validation.valid) return { accepted: false, validation };
    this.evidence.push(stableClone(evidence));
    return { accepted: true, validation };
  }

  recordDefect(defect) {
    const validation = validateDefect(defect);
    if (!validation.valid) return { accepted: false, validation };
    this.defects.push(stableClone(defect));
    return { accepted: true, validation };
  }

  scorecase(caseId) {
    const events = this.events.filter((event) => event.caseId === caseId);
    const evidence = this.evidence.filter((item) => item.caseId === caseId);
    const defects = this.defects.filter((item) => item.caseId === caseId);
    const timestamps = {
      intakeComplete: latestTimestamp(events, 'intake-complete'),
      reviewReady: latestTimestamp(events, 'review-ready'),
      reviewDecision: latestTimestamp(events, 'review-decision'),
      reworkStarted: latestTimestamp(events, 'rework-started'),
      reworkComplete: latestTimestamp(events, 'rework-complete')
    };
    const evidenceComplete = evidence.filter((item) => validateEvidenceRecord(item).valid).length;
    const criticalDefects = defects.filter((item) => item.severity === 'critical');
    const criticalEscapes = criticalDefects.filter((item) => item.escaped === true);

    return {
      contractVersion: CONTRACT_VERSION,
      caseId,
      status: events.length || evidence.length || defects.length ? 'measured-review-required' : 'no-measured-data',
      timestamps,
      durationsHours: {
        intakeToReviewReady: elapsedHours(timestamps.intakeComplete, timestamps.reviewReady),
        reviewReadyToDecision: elapsedHours(timestamps.reviewReady, timestamps.reviewDecision),
        reworkCycle: elapsedHours(timestamps.reworkStarted, timestamps.reworkComplete)
      },
      traceability: {
        evidenceRecordCount: evidence.length,
        completeEvidenceRecordCount: evidenceComplete,
        completenessRatio: evidence.length ? evidenceComplete / evidence.length : null,
        measurementNote: evidence.length ? 'Ratio is based only on entered evidence records; it is not a claim of project completeness.' : 'No evidence records were entered, so completeness is not measurable.'
      },
      criticalErrorEscapes: {
        criticalDefectCount: criticalDefects.length,
        escapedCriticalDefectCount: criticalEscapes.length,
        escapedCriticalDefectIds: criticalEscapes.map((item) => item.defectId),
        status: criticalEscapes.length ? 'critical-escape-recorded-review-required' : 'no-recorded-critical-escape'
      },
      finalIssueAllowed: false,
      policy: 'Scorecard outputs are measured logs, not performance claims. Human review and delivery gates remain required.'
    };
  }

  exportReviewLog(caseId = null) {
    const filter = (item) => !caseId || item.caseId === caseId;
    return {
      contractVersion: CONTRACT_VERSION,
      exportedAt: new Date().toISOString(),
      caseId: caseId || null,
      timelineEvents: this.events.filter(filter).map(stableClone),
      evidenceRecords: this.evidence.filter(filter).map(stableClone),
      defects: this.defects.filter(filter).map(stableClone),
      scorecard: caseId ? this.scorecase(caseId) : null,
      finalIssueAllowed: false,
      policy: 'Export is an immutable-style review snapshot; it does not approve engineering outputs.'
    };
  }
}

module.exports = {
  CONTRACT_VERSION,
  TIMELINE_EVENTS,
  EVIDENCE_STATUSES,
  DEFECT_SEVERITIES,
  validateTimelineEvent,
  validateEvidenceRecord,
  validateDefect,
  PilotScorecard
};
