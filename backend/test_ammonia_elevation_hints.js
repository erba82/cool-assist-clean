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

const equipment = (id, label, componentType, y) => ({
    id,
    kind: componentType,
    position: [0, y, 0],
    params: { tag: id, label, componentType, roomId: 'machine-room', zone: 'machine-room', mounting: 'floor', connectionType: 'welded' },
    ports: []
});

const r717 = [
    equipment('comp-1', 'Screw Compressor', 'screw_compressor', 0),
    equipment('lp-1', 'Low-Pressure Suction Separator', 'horizontal_vessel', 0),
    equipment('pump-1', 'Ammonia Liquid Recirculation Pump', 'centrifugal_pump', 1),
    equipment('cooler-1', 'Oil Cooler', 'oil_cooler', 1),
    equipment('ts-1', 'Thermosiphon Receiver', 'thermosiphon_vessel', 0)
];
const hints = applyAmmoniaElevationHints(r717, 'R717');
assert.strictEqual(r717.find((item) => item.id === 'lp-1').position[1], 0.6);
assert.strictEqual(r717.find((item) => item.id === 'pump-1').position[1], 0);
assert(r717.find((item) => item.id === 'ts-1').position[1] > 2.8);
assert(hints.some((hint) => hint.equipmentId === 'ts-1' && />1\.8 m/.test(hint.relationship)));

const noSeparateCooler = [equipment('ts-2', 'Thermosiphon Oil Cooler Vessel', 'thermosiphon_vessel', 0)];
const missingCoolerHints = applyAmmoniaElevationHints(noSeparateCooler, 'R717');
assert(missingCoolerHints.some((hint) => /not evaluated/.test(hint.relationship)));
assert.strictEqual(noSeparateCooler[0].position[1], 0);

const r404 = [equipment('comp-dx', 'Screw Compressor', 'screw_compressor', 0), equipment('lp-dx', 'Low-Pressure Suction Separator', 'horizontal_vessel', 0)];
assert.deepStrictEqual(applyAmmoniaElevationHints(r404, 'R404A'), []);
assert.strictEqual(r404[1].position[1], 0);

console.log(JSON.stringify({ status: 'passed', checks: ['lp-separator-above-compressor-preview', 'pump-below-separator-preview', 'separate-oil-cooler-head-only', 'no-self-reference', 'non-r717-unchanged'] }, null, 2));
