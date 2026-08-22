'use strict';

const assert = require('assert');
const { evaluateChangeImpact, snapshotHash, normaliseSnapshot, SNAPSHOT_SCHEMA } = require('./engineering/ChangeImpactMocGate');

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function r717Snapshot() {
  return {
    schema: SNAPSHOT_SCHEMA,
    discipline: 'refrigeration',
    project: {
      refrigerant: 'R717',
      systemType: 'pumped_ammonia_industrial',
      operatingConditionsSI: { evaporatingTemperatureK: 243.15, condensingTemperatureK: 308.15, loadW: 500000 },
      location: 'Dubai'
    },
    calculation: { status: 'review-required', provider: 'coolprop-sidecar', referenceState: 'IIR', results: { loadW: 500000 } },
    graph: {
      nodes: [
        { id: 'COMP-01', type: 'screw-compressor', service: 'suction', dn: 'DN100', model: 'HOWDEN-XRV' },
        { id: 'SEP-LP-01', type: 'low-pressure-separator', service: 'suction', dn: 'DN150' }
      ],
      connections: [{ id: 'L-001', from: 'SEP-LP-01', to: 'COMP-01', service: 'suction', dn: 'DN100', jointPolicy: 'welded' }]
    },
    selection: {
      status: 'manufacturer-evidence-required',
      equipment: [{ id: 'COMP-01', family: 'screw', manufacturer: 'Howden', model: 'XRV', selectionStatus: 'review-required', catalogueModelId: 'HOWDEN-XRV-01' }]
    },
    procurement: {
      selectedTier: 'premium',
      rows: [{ id: 'COMP-01', selectedTier: 'premium', brand: 'Howden', model: 'XRV', catalogueModelId: 'HOWDEN-XRV-01', engineeringCompatibility: 'model-specific' }]
    },
    bim: { instances: [{ id: 'COMP-01', family: 'screw', model: 'XRV', portSignature: 'suction:DN100|discharge:DN80', service: 'refrigerant', dn: 'DN100' }] },
    energy: { baselineId: 'M&V-BASELINE-01', meterBoundary: 'plant-electricity', strategyIds: ['VFD-COND-FANS'] },
    compliance: { checks: [{ standard: 'IIAR 2', status: 'REVIEW REQUIRED', note: 'Independent review required.' }] },
    evidence: [{ id: 'COMP-01-DATA', source: 'Howden data sheet', revision: 'Rev A', model: 'XRV', manufacturer: 'Howden' }]
  };
}

const baseline = r717Snapshot();
const same = clone(baseline);
const noChange = evaluateChangeImpact({ baseline, proposed: same });
assert.strictEqual(noChange.status, 'no-change');
assert.strictEqual(noChange.mocAssessment, 'not-applicable');
assert.strictEqual(noChange.changeCount, 0);
assert.strictEqual(noChange.finalIssueAllowed, false);

const reordered = clone(baseline);
reordered.graph.nodes.reverse();
assert.strictEqual(snapshotHash(normaliseSnapshot(baseline)), snapshotHash(normaliseSnapshot(reordered)));
assert.strictEqual(evaluateChangeImpact({ baseline, proposed: reordered }).status, 'no-change');

const refrigerantChange = clone(baseline);
refrigerantChange.project.refrigerant = 'R744';
const refrigerantEvaluation = evaluateChangeImpact({ baseline, proposed: refrigerantChange, changeContext: { reason: 'Change to CO2 architecture' } });
assert.strictEqual(refrigerantEvaluation.status, 'review-required');
assert.strictEqual(refrigerantEvaluation.mocAssessment, 'review-required');
assert.strictEqual(refrigerantEvaluation.pssrReviewRequired, true);
assert.ok(refrigerantEvaluation.changes.some((item) => item.id === 'project:refrigerant' && item.severity === 'critical'));
assert.ok(refrigerantEvaluation.affectedGates.includes('physics'));
assert.ok(refrigerantEvaluation.evidenceRequired.includes('manufacturer compatibility'));
assert.strictEqual(refrigerantEvaluation.finalIssueAllowed, false);

const pidChange = clone(baseline);
pidChange.graph.connections[0].dn = 'DN125';
const pidEvaluation = evaluateChangeImpact({ baseline, proposed: pidChange });
assert.strictEqual(pidEvaluation.status, 'review-required');
assert.strictEqual(pidEvaluation.pssrReviewRequired, true);
assert.ok(pidEvaluation.changes.some((item) => item.id === 'graph-connection:L-001.dn'));
assert.ok(pidEvaluation.affectedGates.includes('bim'));

const tierChange = clone(baseline);
tierChange.procurement.selectedTier = 'budget';
tierChange.procurement.rows[0].selectedTier = 'budget';
tierChange.procurement.rows[0].brand = 'Regional Brand';
tierChange.procurement.rows[0].model = 'Budget-01';
tierChange.procurement.rows[0].catalogueModelId = null;
tierChange.procurement.rows[0].engineeringCompatibility = 'not-assessed';
const tierEvaluation = evaluateChangeImpact({ baseline, proposed: tierChange, changeContext: { replacementInKind: false } });
assert.strictEqual(tierEvaluation.status, 'review-required');
assert.ok(tierEvaluation.changes.some((item) => item.id === 'procurement:selectedTier'));
assert.ok(tierEvaluation.changes.some((item) => item.id === 'procurement:COMP-01.brand'));
assert.ok(tierEvaluation.affectedGates.includes('selection'));
assert.ok(tierEvaluation.mocChecklist.some((item) => /replacement-in-kind/i.test(item)));

const invalid = evaluateChangeImpact({ baseline: null, proposed: baseline });
assert.strictEqual(invalid.status, 'blocked');
assert.strictEqual(invalid.mocAssessment, 'blocked');
assert.strictEqual(invalid.finalIssueAllowed, false);

const blockedDiscipline = clone(baseline);
blockedDiscipline.discipline = 'hvac';
const hvacEvaluation = evaluateChangeImpact({ baseline, proposed: blockedDiscipline });
assert.strictEqual(hvacEvaluation.status, 'blocked');
assert.strictEqual(hvacEvaluation.finalIssueAllowed, false);

console.log(JSON.stringify({
  status: 'passed',
  checks: [
    'no-change-is-deterministic-and-never-final-issue',
    'snapshot-order-does-not-create-a-change',
    'refrigerant-change-is-critical-and-review-required',
    'pid-dn-change-impacts-bim-and-pssr-review',
    'procurement-tier-model-change-impacts-selection',
    'invalid-snapshot-is-blocked',
    'planned-discipline-is-blocked'
  ]
}, null, 2));
