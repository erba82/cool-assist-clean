'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const energySource = fs.readFileSync(path.join(root, 'src', 'components', 'EnergyVisualization.tsx'), 'utf8');
const pidSource = fs.readFileSync(path.join(root, 'src', 'components', 'PIDDrawingEngine.tsx'), 'utf8');

const checks = [];

assert(energySource.includes('No approved monthly energy records are available.'), 'Energy chart must block rendering when no approved monthly records exist.');
checks.push('energy-record-gate');
assert(energySource.includes('explicit nameplate only'), 'Electrical flow must use declared nameplate evidence only.');
checks.push('electrical-nameplate-gate');
assert(!energySource.includes('COP ~3.5'), 'Legacy fixed COP fallback must not reappear in the governed visualization.');
assert(!energySource.includes('0.12'), 'Legacy fixed electricity tariff must not reappear in the governed visualization.');
assert(!energySource.includes('0.72'), 'Legacy fixed savings percentage must not reappear in the governed visualization.');
checks.push('no-fixed-energy-assumptions');

assert(pidSource.includes('Readable cycle'), 'P&ID must retain the readable-cycle viewport preset.');
assert(pidSource.includes('Full topology'), 'P&ID must retain the full-topology viewport preset.');
assert(pidSource.includes('never removed or hidden from the model'), 'Safety/control nodes must remain preserved in the topology model.');
checks.push('pid-viewport-presets');

console.log(JSON.stringify({ status: 'passed', checks }, null, 2));
