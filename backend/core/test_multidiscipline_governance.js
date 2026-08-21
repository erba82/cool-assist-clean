'use strict';

const assert = require('assert');
const { disciplineFor, listDisciplines } = require('./engineering/DisciplineCapabilityRegistry');
const { evaluateEngineeringSystem } = require('./engineering/EngineeringReviewGate');

const disciplines = listDisciplines();
assert.deepStrictEqual(disciplines.map((item) => item.code).sort(), ['electrical', 'hvac', 'refrigeration']);
assert.strictEqual(disciplineFor('refrigeration').availability, 'governed-beta');
assert.strictEqual(disciplineFor('HVAC').designExecution, 'blocked');
assert.strictEqual(disciplineFor('electrical').finalIssueAllowed, false);
assert.strictEqual(disciplineFor('unknown'), null);

const preliminary = evaluateEngineeringSystem({
  discipline: 'refrigeration',
  intent: { systemType: 'pumped-ammonia', operatingConditionsSI: { loadW: 500000 } },
  calculation: { status: 'coolprop-provider-result-review-required', results: { cop: 2.1 } },
  selection: { status: 'candidate-with-review' },
  graph: {
    nodes: [{ id: 'CMP-01', type: 'compressor' }],
    connections: [{ from: 'CMP-01', to: 'COND-01', service: 'discharge' }]
  },
  evidence: [{ source: 'manufacturer-catalogue.pdf', revision: '2026-01' }],
  delivery: { finalIssueRequested: false }
});
assert.strictEqual(preliminary.discipline, 'refrigeration');
assert.strictEqual(preliminary.finalIssueAllowed, false);
assert.strictEqual(preliminary.status, 'review-required');
assert(preliminary.gates.some((item) => item.name === 'physics' && item.status === 'review-required'));

const attemptedFinal = evaluateEngineeringSystem({
  discipline: 'refrigeration',
  intent: { systemType: 'dx', operatingConditionsSI: { loadW: 100000 } },
  calculation: { status: 'verified', results: { cop: 2.5 } },
  selection: { status: 'verified-candidate' },
  graph: { nodes: [{ id: 'EVP-01', type: 'evaporator' }], connections: [] },
  evidence: [{ source: 'manufacturer-map.pdf', revision: '2026-02' }],
  delivery: { finalIssueRequested: true, revision: 'A' }
});
assert.strictEqual(attemptedFinal.finalIssueAllowed, false);
assert.strictEqual(attemptedFinal.gates.find((item) => item.name === 'delivery').status, 'review-required');

const hvac = evaluateEngineeringSystem({
  discipline: 'hvac',
  intent: { systemType: 'air-handling', operatingConditionsSI: { outdoorDryBulbK: 308.15 } },
  delivery: { finalIssueRequested: false }
});
assert.strictEqual(hvac.status, 'blocked');
assert(hvac.blockers.some((item) => item.includes('HVAC calculation engine is not implemented.')));

const unknown = evaluateEngineeringSystem({ discipline: 'steam' });
assert.strictEqual(unknown.status, 'blocked');
assert.strictEqual(unknown.finalIssueAllowed, false);

console.log(JSON.stringify({
  status: 'passed',
  checks: [
    'registry-lists-refrigeration-hvac-electrical-truthfully',
    'refrigeration-preliminary-result-remains-review-required',
    'final-issue-remains-review-required-after-technical-gates',
    'planned-hvac-engine-is-blocked-not-fabricated',
    'unknown-discipline-is-blocked'
  ]
}, null, 2));
