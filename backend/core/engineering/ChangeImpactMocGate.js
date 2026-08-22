'use strict';

const crypto = require('crypto');
const { disciplineFor, normalizeDiscipline } = require('./DisciplineCapabilityRegistry');

const SNAPSHOT_SCHEMA = 'cool-assist.design-snapshot.v1';
const SEVERITY_ORDER = Object.freeze({ low: 0, medium: 1, high: 2, critical: 3 });
const STATUS_ORDER = Object.freeze({ 'no-change': 0, 'review-required': 1, blocked: 2 });

function asObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function hasText(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === 'object') {
    return Object.keys(value).sort().reduce((result, key) => {
      result[key] = stableValue(value[key]);
      return result;
    }, {});
  }
  return value;
}

function stableJson(value) {
  return JSON.stringify(stableValue(value));
}

function snapshotHash(snapshot) {
  return crypto.createHash('sha256').update(stableJson(snapshot)).digest('hex');
}

function sameValue(left, right) {
  return stableJson(left) === stableJson(right);
}

function textOrNull(value) {
  return hasText(value) ? value.trim() : null;
}

function finiteOrNull(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function canonicalEntity(raw, fallbackId, fields) {
  const source = asObject(raw);
  const entity = { id: textOrNull(source.id) || textOrNull(source.tag) || fallbackId };
  fields.forEach((field) => {
    const value = source[field];
    if (typeof value === 'number') entity[field] = finiteOrNull(value);
    else if (Array.isArray(value) || (value && typeof value === 'object')) entity[field] = stableValue(value);
    else entity[field] = textOrNull(value);
  });
  return entity;
}

function canonicalMap(records, fields, fallbackPrefix) {
  return asArray(records)
    .map((record, index) => canonicalEntity(record, `${fallbackPrefix}-${index + 1}`, fields))
    .sort((left, right) => left.id.localeCompare(right.id));
}

function canonicalConnections(records) {
  return asArray(records)
    .map((record, index) => {
      const source = asObject(record);
      const from = textOrNull(source.from);
      const to = textOrNull(source.to);
      const service = textOrNull(source.service);
      const fallback = `${from || 'unknown'}>${to || 'unknown'}:${service || 'unknown'}:${index + 1}`;
      return {
        id: textOrNull(source.id) || textOrNull(source.tag) || fallback,
        from,
        to,
        service,
        dn: textOrNull(source.dn) || textOrNull(source.size) || null,
        jointPolicy: textOrNull(source.jointPolicy) || null,
        insulation: textOrNull(source.insulation) || null
      };
    })
    .sort((left, right) => left.id.localeCompare(right.id));
}

function canonicalCompliance(records) {
  return asArray(records)
    .map((record, index) => {
      const source = asObject(record);
      return {
        id: textOrNull(source.id) || textOrNull(source.code) || textOrNull(source.standard) || `check-${index + 1}`,
        standard: textOrNull(source.standard) || textOrNull(source.code),
        status: textOrNull(source.status),
        note: textOrNull(source.note) || textOrNull(source.details)
      };
    })
    .sort((left, right) => left.id.localeCompare(right.id));
}

function canonicalEvidence(records) {
  return asArray(records)
    .map((record, index) => {
      const source = asObject(record);
      return {
        id: textOrNull(source.id) || `${textOrNull(source.source) || 'evidence'}:${textOrNull(source.revision) || index + 1}`,
        source: textOrNull(source.source),
        revision: textOrNull(source.revision),
        model: textOrNull(source.model),
        manufacturer: textOrNull(source.manufacturer)
      };
    })
    .sort((left, right) => left.id.localeCompare(right.id));
}

function normaliseSnapshot(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;

  const source = asObject(raw);
  const project = asObject(source.project);
  const graph = asObject(source.graph);
  const selection = asObject(source.selection);
  const procurement = asObject(source.procurement);
  const bim = asObject(source.bim);
  const energy = asObject(source.energy);
  const compliance = asObject(source.compliance);
  const calculation = asObject(source.calculation);
  const discipline = normalizeDiscipline(source.discipline || project.discipline || 'refrigeration');

  const equipmentRows = asArray(selection.equipment).length
    ? selection.equipment
    : asArray(source.equipment);
  const procurementRows = asArray(procurement.rows).length
    ? procurement.rows
    : asArray(source.procurementRows);
  const bimInstances = asArray(bim.instances).length
    ? bim.instances
    : asArray(source.bimInstances);
  const energyStrategies = asArray(energy.strategyIds).length
    ? energy.strategyIds
    : asArray(energy.strategies).map((item) => asObject(item).id || asObject(item).code || item);

  return {
    schema: SNAPSHOT_SCHEMA,
    discipline: discipline || null,
    project: {
      refrigerant: textOrNull(project.refrigerant) || textOrNull(source.refrigerant),
      systemType: textOrNull(project.systemType) || textOrNull(source.systemType),
      operatingConditionsSI: stableValue(asObject(project.operatingConditionsSI || source.operatingConditionsSI)),
      location: textOrNull(project.location) || textOrNull(asObject(project.location).city)
    },
    calculation: {
      status: textOrNull(calculation.status),
      provider: textOrNull(calculation.provider),
      referenceState: textOrNull(calculation.referenceState),
      results: stableValue(asObject(calculation.results))
    },
    graph: {
      nodes: canonicalMap(graph.nodes || source.nodes, ['type', 'service', 'dn', 'model', 'manufacturer'], 'node'),
      connections: canonicalConnections(graph.connections || source.connections)
    },
    selection: {
      status: textOrNull(selection.status),
      equipment: canonicalMap(equipmentRows, ['family', 'model', 'manufacturer', 'selectionStatus', 'catalogueModelId'], 'equipment')
    },
    procurement: {
      selectedTier: textOrNull(procurement.selectedTier) || textOrNull(project.selectedTier),
      rows: canonicalMap(procurementRows, ['selectedTier', 'brand', 'model', 'catalogueModelId', 'engineeringCompatibility'], 'procurement')
    },
    bim: {
      instances: canonicalMap(bimInstances, ['family', 'model', 'portSignature', 'service', 'dn'], 'bim')
    },
    energy: {
      baselineId: textOrNull(energy.baselineId),
      meterBoundary: textOrNull(energy.meterBoundary),
      strategyIds: asArray(energyStrategies).map((item) => textOrNull(item)).filter(Boolean).sort()
    },
    compliance: {
      checks: canonicalCompliance(compliance.checks || compliance.standards || source.complianceChecks)
    },
    evidence: canonicalEvidence(source.evidence)
  };
}

function severityMax(changes) {
  return changes.reduce((current, item) => (
    SEVERITY_ORDER[item.severity] > SEVERITY_ORDER[current] ? item.severity : current
  ), 'low');
}

function statusMax(current, next) {
  return STATUS_ORDER[next] > STATUS_ORDER[current] ? next : current;
}

function changeRecord(domain, key, before, after, severity, impactedGates, evidenceRequired, description) {
  return {
    id: `${domain}:${key}`,
    domain,
    key,
    before: stableValue(before),
    after: stableValue(after),
    severity,
    impactedGates: [...new Set(impactedGates)].sort(),
    evidenceRequired: [...new Set(evidenceRequired)].sort(),
    description
  };
}

function compareScalar(changes, domain, key, before, after, severity, impactedGates, evidenceRequired, description) {
  if (!sameValue(before, after)) {
    changes.push(changeRecord(domain, key, before, after, severity, impactedGates, evidenceRequired, description));
  }
}

function compareRecordSets(changes, domain, baselineRecords, proposedRecords, fields, severity, impactedGates, evidenceRequired) {
  const baseline = new Map(baselineRecords.map((record) => [record.id, record]));
  const proposed = new Map(proposedRecords.map((record) => [record.id, record]));
  const ids = [...new Set([...baseline.keys(), ...proposed.keys()])].sort();

  ids.forEach((id) => {
    const before = baseline.get(id);
    const after = proposed.get(id);
    if (!before || !after) {
      changes.push(changeRecord(
        domain,
        id,
        before || null,
        after || null,
        severity,
        impactedGates,
        evidenceRequired,
        `${domain} record ${id} was ${before ? 'removed' : 'added'}.`
      ));
      return;
    }
    fields.forEach((field) => {
      compareScalar(
        changes,
        domain,
        `${id}.${field}`,
        before[field],
        after[field],
        severity,
        impactedGates,
        evidenceRequired,
        `${domain} record ${id} changed field ${field}.`
      );
    });
  });
}

function impactMatrix(changes) {
  const grouped = new Map();
  changes.forEach((change) => {
    const current = grouped.get(change.domain) || {
      domain: change.domain,
      severity: 'low',
      changes: 0,
      impactedGates: new Set(),
      evidenceRequired: new Set()
    };
    current.severity = SEVERITY_ORDER[change.severity] > SEVERITY_ORDER[current.severity] ? change.severity : current.severity;
    current.changes += 1;
    change.impactedGates.forEach((item) => current.impactedGates.add(item));
    change.evidenceRequired.forEach((item) => current.evidenceRequired.add(item));
    grouped.set(change.domain, current);
  });
  return [...grouped.values()]
    .map((item) => ({
      domain: item.domain,
      severity: item.severity,
      changes: item.changes,
      impactedGates: [...item.impactedGates].sort(),
      evidenceRequired: [...item.evidenceRequired].sort()
    }))
    .sort((left, right) => left.domain.localeCompare(right.domain));
}

function evaluateChangeImpact(request = {}) {
  const baseline = normaliseSnapshot(request.baseline);
  const proposed = normaliseSnapshot(request.proposed);
  const context = asObject(request.changeContext);

  if (!baseline || !proposed) {
    return {
      schema: 'cool-assist.change-impact.v1',
      status: 'blocked',
      finalIssueAllowed: false,
      mocAssessment: 'blocked',
      blockers: ['Both baseline and proposed design snapshots are required.'],
      changes: [],
      impactMatrix: [],
      note: 'This read-only evaluator does not certify engineering, safety, construction, procurement or regulatory compliance.'
    };
  }

  const discipline = disciplineFor(proposed.discipline);
  if (!discipline) {
    return {
      schema: 'cool-assist.change-impact.v1',
      status: 'blocked',
      finalIssueAllowed: false,
      mocAssessment: 'blocked',
      blockers: ['The proposed snapshot does not declare a registered engineering discipline.'],
      baseline: { hash: snapshotHash(baseline), discipline: baseline.discipline },
      proposed: { hash: snapshotHash(proposed), discipline: proposed.discipline },
      changes: [],
      impactMatrix: [],
      note: 'This read-only evaluator does not certify engineering, safety, construction, procurement or regulatory compliance.'
    };
  }

  if (discipline.designExecution === 'blocked') {
    return {
      schema: 'cool-assist.change-impact.v1',
      status: 'blocked',
      finalIssueAllowed: false,
      mocAssessment: 'blocked',
      blockers: [`${discipline.displayName} design execution is intentionally blocked.`],
      baseline: { hash: snapshotHash(baseline), discipline: baseline.discipline },
      proposed: { hash: snapshotHash(proposed), discipline: proposed.discipline },
      changes: [],
      impactMatrix: [],
      note: 'This read-only evaluator does not certify engineering, safety, construction, procurement or regulatory compliance.'
    };
  }

  const changes = [];
  compareScalar(changes, 'project', 'refrigerant', baseline.project.refrigerant, proposed.project.refrigerant, 'critical', ['input', 'physics', 'graph', 'selection', 'delivery'], ['refrigerant profile', 'property-provider provenance', 'manufacturer compatibility'], 'Refrigerant changed.');
  compareScalar(changes, 'project', 'systemType', baseline.project.systemType, proposed.project.systemType, 'critical', ['input', 'physics', 'graph', 'selection', 'delivery'], ['system definition', 'cycle review', 'engineering approval'], 'System type changed.');
  compareScalar(changes, 'project', 'operatingConditionsSI', baseline.project.operatingConditionsSI, proposed.project.operatingConditionsSI, 'critical', ['input', 'physics', 'selection', 'delivery'], ['SI operating conditions', 'property-provider provenance', 'manufacturer operating envelope'], 'SI operating conditions changed.');
  compareScalar(changes, 'calculation', 'status', baseline.calculation.status, proposed.calculation.status, 'high', ['physics', 'delivery'], ['calculation status', 'independent engineering review'], 'Calculation status changed.');
  compareScalar(changes, 'calculation', 'provider', baseline.calculation.provider, proposed.calculation.provider, 'high', ['physics', 'delivery'], ['property-provider provenance', 'reference state'], 'Calculation property provider changed.');
  compareScalar(changes, 'calculation', 'referenceState', baseline.calculation.referenceState, proposed.calculation.referenceState, 'high', ['physics', 'delivery'], ['property-provider provenance', 'reference state'], 'Calculation reference state changed.');

  compareRecordSets(changes, 'graph-node', baseline.graph.nodes, proposed.graph.nodes, ['type', 'service', 'dn', 'model', 'manufacturer'], 'high', ['graph', 'delivery'], ['P&ID topology review', 'equipment semantic identity']);
  compareRecordSets(changes, 'graph-connection', baseline.graph.connections, proposed.graph.connections, ['from', 'to', 'service', 'dn', 'jointPolicy', 'insulation'], 'high', ['graph', 'bim', 'delivery'], ['P&ID port/service review', 'piping DN/joint policy', 'BIM route review']);
  compareRecordSets(changes, 'selection', baseline.selection.equipment, proposed.selection.equipment, ['family', 'model', 'manufacturer', 'selectionStatus', 'catalogueModelId'], 'high', ['selection', 'procurement', 'delivery'], ['manufacturer compatibility', 'source revision', 'operating envelope']);
  compareScalar(changes, 'selection', 'status', baseline.selection.status, proposed.selection.status, 'high', ['selection', 'delivery'], ['selection status', 'manufacturer evidence']);
  compareScalar(changes, 'procurement', 'selectedTier', baseline.procurement.selectedTier, proposed.procurement.selectedTier, 'medium', ['procurement', 'selection', 'bim', 'delivery'], ['supplier source', 'brand/model compatibility', 'BIM/P&ID label review'], 'Procurement tier changed.');
  compareRecordSets(changes, 'procurement', baseline.procurement.rows, proposed.procurement.rows, ['selectedTier'], 'medium', ['procurement', 'bim', 'delivery'], ['supplier source', 'BIM/P&ID label review']);
  compareRecordSets(changes, 'procurement', baseline.procurement.rows, proposed.procurement.rows, ['brand', 'model', 'catalogueModelId', 'engineeringCompatibility'], 'high', ['procurement', 'selection', 'bim', 'delivery'], ['supplier source', 'manufacturer compatibility', 'BIM/P&ID label review']);
  compareRecordSets(changes, 'bim', baseline.bim.instances, proposed.bim.instances, ['family', 'model', 'portSignature', 'service', 'dn'], 'high', ['graph', 'bim', 'delivery'], ['BIM port continuity', 'clearance/elevation review', 'route/support review']);
  compareScalar(changes, 'energy', 'baselineId', baseline.energy.baselineId, proposed.energy.baselineId, 'medium', ['energy', 'delivery'], ['approved energy baseline', 'M&V boundary']);
  compareScalar(changes, 'energy', 'meterBoundary', baseline.energy.meterBoundary, proposed.energy.meterBoundary, 'medium', ['energy', 'delivery'], ['approved energy baseline', 'M&V boundary']);
  compareScalar(changes, 'energy', 'strategyIds', baseline.energy.strategyIds, proposed.energy.strategyIds, 'medium', ['energy', 'delivery'], ['strategy review', 'approved energy baseline']);
  compareRecordSets(changes, 'compliance', baseline.compliance.checks, proposed.compliance.checks, ['standard', 'status', 'note'], 'high', ['compliance', 'delivery'], ['PHA/MOC review', 'applicable code review']);
  compareRecordSets(changes, 'evidence', baseline.evidence, proposed.evidence, ['source', 'revision', 'model', 'manufacturer'], 'high', ['selection', 'procurement', 'delivery'], ['manufacturer source revision', 'approval record']);

  changes.sort((left, right) => left.id.localeCompare(right.id));
  const hasEngineeringChange = changes.length > 0;
  const pssrReviewRequired = hasEngineeringChange && changes.some((item) => ['project', 'graph-connection', 'graph-node', 'selection', 'bim'].includes(item.domain));
  const replacementInKind = context.replacementInKind === true;
  const overallSeverity = severityMax(changes);
  const status = hasEngineeringChange ? 'review-required' : 'no-change';
  const evidenceRequired = [...new Set(changes.flatMap((item) => item.evidenceRequired))].sort();
  const affectedGates = [...new Set(changes.flatMap((item) => item.impactedGates))].sort();
  const checklist = hasEngineeringChange ? [
    'Confirm the change reason, scope, owner and effective revision in the site MOC process.',
    'Determine whether the proposed change is replacement-in-kind under the site and jurisdictional procedure.',
    'Review every impacted calculation, P&ID/BIM/BOM artifact and manufacturer evidence listed by this evaluation.',
    ...(pssrReviewRequired ? ['Determine whether a pre-startup safety review is required before operation or return to service.'] : []),
    'Obtain independent engineering and process-safety review before any construction, procurement, safety or regulatory issue.'
  ] : [];

  return {
    schema: 'cool-assist.change-impact.v1',
    status,
    finalIssueAllowed: false,
    mocAssessment: hasEngineeringChange ? 'review-required' : 'not-applicable',
    pssrReviewRequired,
    changeContext: {
      reason: textOrNull(context.reason),
      replacementInKind,
      finalIssueRequested: context.finalIssueRequested === true
    },
    baseline: { hash: snapshotHash(baseline), discipline: baseline.discipline, schema: baseline.schema },
    proposed: { hash: snapshotHash(proposed), discipline: proposed.discipline, schema: proposed.schema },
    changeCount: changes.length,
    overallSeverity: hasEngineeringChange ? overallSeverity : null,
    changes,
    impactMatrix: impactMatrix(changes),
    affectedGates,
    evidenceRequired,
    mocChecklist: checklist,
    blockers: hasEngineeringChange
      ? ['Change-impact evaluation is review-required; no automatic MOC/PSSR approval or final issue is available.']
      : ['No semantic design difference was detected between the supplied snapshots.'],
    note: 'This read-only evaluator identifies potential change impact only. It does not replace MOC, PSSR, PHA/HAZOP, qualified engineering review, construction approval, procurement approval or regulatory compliance.'
  };
}

module.exports = {
  SNAPSHOT_SCHEMA,
  normaliseSnapshot,
  snapshotHash,
  evaluateChangeImpact
};
