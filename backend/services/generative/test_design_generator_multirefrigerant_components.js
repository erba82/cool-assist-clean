'use strict';

const assert = require('assert');
const designGenerator = require('./DesignGenerator');
const { getRefrigerantProfile } = require('../../core/data/RefrigerantProfiles');

const refrigerants = ['R717', 'R744', 'R290', 'R32', 'R404A', 'R410A', 'R134a', 'R22'];
const context = { bestPractices: [] };
const outcomes = [];

for (const refrigerant of refrigerants) {
  const profile = getRefrigerantProfile(refrigerant);
  const components = designGenerator.selectComponents({ refrigerant, cooling_capacity: 120 }, context, 'balanced', 0);
  const piping = designGenerator.designPiping(components, context, 'balanced');

  assert.strictEqual(components.refrigerant, refrigerant);
  assert.strictEqual(components.profileId, profile.id);
  assert.strictEqual(components.cycle, profile.cycle);
  assert(components.compressors.every((compressor) => compressor.refrigerant === refrigerant));
  assert(components.condensers.every((condenser) => condenser.refrigerant === refrigerant));
  assert(components.evaporators.every((evaporator) => evaporator.refrigerant === refrigerant));
  assert(components.expansionValves.every((valve) => valve.refrigerant === refrigerant));
  assert(piping.every((pipe) => pipe.refrigerant === refrigerant));
  assert(piping.every((pipe) => pipe.material === (profile.piping?.material || null)));
  assert(piping.every((pipe) => pipe.jointType === (profile.piping?.jointType || null)));
  assert(!JSON.stringify(components).includes('N320VLD-'));
  assert(!JSON.stringify(components).includes('OPTIGO-Plus'));
  assert(!JSON.stringify(components).includes('DANFOSS-TEN'));

  if (refrigerant === 'R744') {
    assert.strictEqual(components.condensers[0].tag, 'GC-01');
    assert.strictEqual(components.receiver.tag, 'FGR-01');
    assert.strictEqual(components.compressors.length, 2);
  } else {
    assert.strictEqual(components.compressors.length, 1);
  }

  outcomes.push({
    refrigerant,
    cycle: components.cycle,
    heatRejectionTag: components.condensers[0].tag,
    receiverTag: components.receiver.tag,
    compressorCount: components.compressors.length,
    compressorSelectionStatus: components.compressors[0].selectionStatus
  });
}

console.log(JSON.stringify({
  status: 'passed',
  checks: [
    'eight-refrigerant-profile-propagation',
    'r744-gas-cooler-flash-gas-receiver-and-booster-roles',
    'refrigerant-specific-pipe-policy',
    'no-legacy-fabricated-model-identifiers'
  ],
  outcomes
}, null, 2));
