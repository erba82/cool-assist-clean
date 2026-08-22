'use strict';

const assert = require('assert');
const fs = require('fs');
const TypeScript = require('../frontend/node_modules/typescript');

require.extensions['.ts'] = (module, filename) => {
  const output = TypeScript.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: TypeScript.ModuleKind.CommonJS, target: TypeScript.ScriptTarget.ES2020, esModuleInterop: true }
  }).outputText;
  module._compile(output, filename);
};

const { applyAmmoniaElevationHints } = require('../frontend/src/engines/RefrigerationSceneEngine.ts');

const equipment = (id, label, componentType, y, declared = false) => ({
  id,
  kind: componentType,
  position: [0, y, 0],
  params: {
    tag: id,
    label,
    componentType,
    roomId: 'machine-room',
    zone: 'machine-room',
    mounting: 'floor',
    connectionType: 'welded',
    details: { elevationStatus: declared ? 'declared-layout-input' : 'layout-input-required' }
  },
  ports: []
});

const missingLayout = [
  equipment('comp-1', 'Screw Compressor', 'screw_compressor', 0),
  equipment('lp-1', 'Low-Pressure Suction Separator', 'horizontal_vessel', 0),
  equipment('pump-1', 'Ammonia Liquid Recirculation Pump', 'centrifugal_pump', 1),
  equipment('cooler-1', 'Oil Cooler', 'oil_cooler', 1),
  equipment('ts-1', 'Thermosiphon Receiver', 'thermosiphon_vessel', 0)
];
const originalMissingPositions = missingLayout.map((item) => item.position[1]);
const missingLayoutHints = applyAmmoniaElevationHints(missingLayout, 'R717');
assert.deepStrictEqual(missingLayout.map((item) => item.position[1]), originalMissingPositions);
assert(missingLayoutHints.some((hint) => /Layout input required/.test(hint.relationship)));

const declaredLayout = [
  equipment('comp-2', 'Screw Compressor', 'screw_compressor', 1, true),
  equipment('lp-2', 'Low-Pressure Suction Separator', 'horizontal_vessel', 2.2, true),
  equipment('pump-2', 'Ammonia Liquid Recirculation Pump', 'centrifugal_pump', 0.6, true),
  equipment('cooler-2', 'Oil Cooler', 'oil_cooler', 1, true),
  equipment('ts-2', 'Thermosiphon Receiver', 'thermosiphon_vessel', 3, true)
];
const originalDeclaredPositions = declaredLayout.map((item) => item.position[1]);
const declaredHints = applyAmmoniaElevationHints(declaredLayout, 'R717');
assert.deepStrictEqual(declaredLayout.map((item) => item.position[1]), originalDeclaredPositions);
assert(declaredHints.some((hint) => hint.equipmentId === 'lp-2' && /above the compressor datum/.test(hint.relationship)));
assert(declaredHints.some((hint) => hint.equipmentId === 'pump-2' && /below the LP separator datum/.test(hint.relationship)));
assert(declaredHints.some((hint) => hint.equipmentId === 'ts-2' && /2\.00 m above oil-cooler datum/.test(hint.relationship)));

const noSeparateCooler = [equipment('ts-3', 'Thermosiphon Oil Cooler Vessel', 'thermosiphon_vessel', 3, true)];
const missingCoolerHints = applyAmmoniaElevationHints(noSeparateCooler, 'R717');
assert(missingCoolerHints.some((hint) => /No separately tagged oil cooler/.test(hint.relationship)));
assert.strictEqual(noSeparateCooler[0].position[1], 3);

const r404 = [equipment('comp-dx', 'Screw Compressor', 'screw_compressor', 0), equipment('lp-dx', 'Low-Pressure Suction Separator', 'horizontal_vessel', 0)];
assert.deepStrictEqual(applyAmmoniaElevationHints(r404, 'R404A'), []);
assert.strictEqual(r404[1].position[1], 0);

console.log(JSON.stringify({
  status: 'passed',
  checks: [
    'missing-layout-never-fabricates-elevation',
    'declared-lp-separator-and-pump-relationships-are-reviewed-without-moving-geometry',
    'declared-thermosiphon-head-is-reported-not-invented',
    'separate-oil-cooler-is-required-for-head-check',
    'non-r717-unchanged'
  ]
}, null, 2));
