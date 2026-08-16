'use strict';
const fs = require('fs');
const path = require('path');
const target = path.resolve(process.cwd(), 'backend/core/RefrigerationEngine.js');
let source = fs.readFileSync(target, 'utf8');
const changes = [
  [
    'results.calculations.temperatureLevels = this._groupByTemperature(results.calculations.loads);',
    'results.calculations.temperatureLevels = this._groupByTemperature(results.calculations.loads, project);'
  ],
  [
    '_groupByTemperature(loads) {',
    '_groupByTemperature(loads, project) {'
  ],
];
for (const [find, replace] of changes) {
  const first = source.indexOf(find);
  if (first < 0 || source.indexOf(find, first + find.length) >= 0) {
    throw new Error(`Expected exactly one fragment: ${find}`);
  }
  source = source.slice(0, first) + replace + source.slice(first + find.length);
}
fs.writeFileSync(target, source, 'utf8');
console.log('Fixed project context for temperature-level grouping.');
