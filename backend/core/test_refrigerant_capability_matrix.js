'use strict';

const assert = require('assert');
const { listCapabilities, capabilityFor } = require('./engineering/RefrigerantCapabilityService');
const RefrigerationTopologyInterpreter = require('./engineering/RefrigerationTopologyInterpreter');

const capabilities = listCapabilities();
assert.deepStrictEqual(capabilities.map((item) => item.code), ['R134a', 'R22', 'R290', 'R32', 'R404A', 'R410A', 'R717', 'R744']);
assert.ok(capabilities.every((item) => item.supported && item.profile && item.defaultSelectionIntent && item.calculationReadiness && item.equipmentReadiness));
assert.strictEqual(capabilityFor('R404A').defaultSelectionIntent.template.id, 'DX_AIR_COOLED');
assert.strictEqual(capabilityFor('R744').defaultSelectionIntent.template.id, 'R744_TRANSCRITICAL_BOOSTER');
assert.strictEqual(capabilityFor('R290').defaultSelectionIntent.template.id, 'R290_DX_AIR_COOLED');
assert.strictEqual(capabilityFor('R32').defaultSelectionIntent.template.id, 'R32_DX_AIR_COOLED');
assert.strictEqual(capabilityFor('R22').defaultSelectionIntent.template.id, 'R22_DX_AIR_COOLED_LEGACY');
assert.strictEqual(capabilityFor('R290').calculationReadiness.propertyStatus, 'validated-property-provider-required');
assert.strictEqual(capabilityFor('R717').calculationReadiness.propertyStatus, 'internal-table-review-required');
assert.strictEqual(capabilityFor('R1234YF').supported, false);

const interpreter = new RefrigerationTopologyInterpreter();
const r744 = interpreter.interpret({ refrigerant: 'R744', rooms: [{ id: 'MT', name: 'Medium temperature storage' }] }, {});
assert.strictEqual(r744.template.id, 'R744_TRANSCRITICAL_BOOSTER');
const r290 = interpreter.interpret({ refrigerant: 'R290', rooms: [{ id: 'DX', name: 'DX cold room' }] }, {});
assert.strictEqual(r290.template.id, 'R290_DX_AIR_COOLED');

console.log(JSON.stringify({ status: 'passed', profiles: capabilities.length, checks: ['profile-matrix', 'semantic-template-per-profile', 'property-readiness-explicit', 'unknown-refrigerant-blocked', 'r744-topology', 'r290-topology'] }, null, 2));
