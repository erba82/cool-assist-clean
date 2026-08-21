'use strict';

const { disciplineFor, normalizeDiscipline } = require('./DisciplineCapabilityRegistry');

const STATUS_ORDER = Object.freeze({ passed: 0, 'review-required': 1, blocked: 2 });

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function hasText(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function gate(name, status, blockers, evidenceRequired) {
  return {
    name,
    status,
    blockers: [...new Set(blockers.filter(Boolean))],
    evidenceRequired: [...new Set(evidenceRequired.filter(Boolean))]
  };
}

function summaryStatus(gates) {
  return gates.reduce((current, item) => (
    STATUS_ORDER[item.status] > STATUS_ORDER[current] ? item.status : current
  ), 'passed');
}

function evaluateEngineeringSystem(candidate = {}) {
  const disciplineCode = normalizeDiscipline(candidate.discipline);
  const discipline = disciplineFor(disciplineCode);
  if (!discipline) {
    return {
      discipline: null,
      status: 'blocked',
      finalIssueAllowed: false,
      gates: [gate('discipline', 'blocked', ['A registered engineering discipline is required.'], ['discipline'])],
      blockers: ['A registered engineering discipline is required.']
    };
  }

  const intent = candidate.intent && typeof candidate.intent === 'object' ? candidate.intent : {};
  const calculation = candidate.calculation && typeof candidate.calculation === 'object' ? candidate.calculation : {};
  const selection = candidate.selection && typeof candidate.selection === 'object' ? candidate.selection : {};
  const graph = candidate.graph && typeof candidate.graph === 'object' ? candidate.graph : {};
  const delivery = candidate.delivery && typeof candidate.delivery === 'object' ? candidate.delivery : {};
  const evidence = asArray(candidate.evidence);

  const inputBlockers = [];
  if (!hasText(intent.systemType)) inputBlockers.push('System type is missing.');
  if (!intent.operatingConditionsSI || typeof intent.operatingConditionsSI !== 'object' || !Object.keys(intent.operatingConditionsSI).length) {
    inputBlockers.push('SI operating conditions are missing.');
  }
  if (asArray(intent.missingInputs).length) inputBlockers.push('Intent still lists missing engineering inputs.');
  const inputGate = gate('input', inputBlockers.length ? 'blocked' : 'passed', inputBlockers, ['systemType', 'operatingConditionsSI']);

  const physicsBlockers = [];
  let physicsStatus = 'passed';
  if (discipline.calculation === 'not-implemented') {
    physicsStatus = 'blocked';
    physicsBlockers.push(`${discipline.displayName} calculation engine is not implemented.`);
  } else if (!hasText(calculation.status)) {
    physicsStatus = 'review-required';
    physicsBlockers.push('Calculation status and provenance are not supplied.');
  } else if (['blocked', 'provider-calculation-blocked', 'validated-property-provider-required'].includes(calculation.status)) {
    physicsStatus = 'blocked';
    physicsBlockers.push(`Calculation status is ${calculation.status}.`);
  } else if (!['verified', 'validated'].includes(calculation.status)) {
    physicsStatus = 'review-required';
    physicsBlockers.push(`Calculation is ${calculation.status}; independent engineering review remains required.`);
  }
  if (calculation.results && typeof calculation.results === 'object') {
    const nonFiniteKey = Object.entries(calculation.results).find(([, value]) => typeof value === 'number' && !Number.isFinite(value));
    if (nonFiniteKey) {
      physicsStatus = 'blocked';
      physicsBlockers.push(`Calculation result ${nonFiniteKey[0]} is non-finite.`);
    }
  }
  const physicsGate = gate('physics', physicsStatus, physicsBlockers, ['provider/formula provenance', 'finite result']);

  const graphBlockers = [];
  let graphStatus = 'passed';
  const nodes = asArray(graph.nodes);
  const connections = asArray(graph.connections);
  if (discipline.semanticGraph === 'contract-planned') {
    graphStatus = 'blocked';
    graphBlockers.push(`${discipline.displayName} semantic graph is not implemented.`);
  } else if (!nodes.length) {
    graphStatus = 'review-required';
    graphBlockers.push('Design graph has no semantic nodes.');
  } else {
    const unresolvedNode = nodes.find((node) => !hasText(node.id) || !hasText(node.type));
    if (unresolvedNode) {
      graphStatus = 'blocked';
      graphBlockers.push('A graph node lacks a stable id or semantic type.');
    }
    const unresolvedConnection = connections.find((connection) => !hasText(connection.from) || !hasText(connection.to) || !hasText(connection.service));
    if (unresolvedConnection) {
      graphStatus = 'blocked';
      graphBlockers.push('A graph connection lacks from, to or service metadata.');
    }
  }
  const graphGate = gate('graph', graphStatus, graphBlockers, ['semantic nodes', 'port/service connections']);

  const selectionBlockers = [];
  let selectionStatus = 'passed';
  if (discipline.equipmentSelection === 'not-implemented') {
    selectionStatus = 'blocked';
    selectionBlockers.push(`${discipline.displayName} equipment-selection engine is not implemented.`);
  } else if (!hasText(selection.status)) {
    selectionStatus = 'review-required';
    selectionBlockers.push('Equipment-selection status is not supplied.');
  } else if (['blocked', 'unmapped', 'manufacturer-evidence-required'].includes(selection.status)) {
    selectionStatus = 'blocked';
    selectionBlockers.push(`Equipment selection status is ${selection.status}.`);
  } else if (selection.status !== 'verified-candidate') {
    selectionStatus = 'review-required';
    selectionBlockers.push(`Equipment selection is ${selection.status}; manufacturer envelope review remains required.`);
  }
  const sourceBackedEvidence = evidence.filter((item) => item && hasText(item.source) && hasText(item.revision));
  if (selection.status === 'verified-candidate' && !sourceBackedEvidence.length) {
    selectionStatus = 'blocked';
    selectionBlockers.push('A verified candidate requires source and revision evidence.');
  }
  const selectionGate = gate('selection', selectionStatus, selectionBlockers, ['manufacturer compatibility', 'source revision', 'operating envelope']);

  const deliveryBlockers = [];
  let deliveryStatus = 'review-required';
  if (delivery.finalIssueRequested) {
    const preceding = [inputGate, physicsGate, graphGate, selectionGate];
    const unresolved = preceding.filter((item) => item.status !== 'passed');
    if (unresolved.length) {
      deliveryStatus = 'blocked';
      deliveryBlockers.push('Final issue is prohibited until all preceding gates pass.');
    } else if (!hasText(delivery.revision)) {
      deliveryStatus = 'blocked';
      deliveryBlockers.push('Final issue requires a delivery revision.');
    } else {
      deliveryStatus = 'review-required';
      deliveryBlockers.push('Independent engineering approval is required before final issue.');
    }
  } else {
    deliveryBlockers.push('Output is preliminary; final issue was not requested.');
  }
  const deliveryGate = gate('delivery', deliveryStatus, deliveryBlockers, ['revision', 'approval record', 'complete deliverable package']);

  const gates = [inputGate, physicsGate, graphGate, selectionGate, deliveryGate];
  const blockers = gates.flatMap((item) => item.blockers);
  return {
    discipline: discipline.code,
    availability: discipline.availability,
    status: summaryStatus(gates),
    finalIssueAllowed: false,
    gates,
    blockers: [...new Set(blockers)],
    note: 'This is a read-only governance evaluation. It does not certify construction, procurement, safety or regulatory compliance.'
  };
}

module.exports = { evaluateEngineeringSystem, STATUS_ORDER };
