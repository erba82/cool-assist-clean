const fs = require('fs');
const file = 'backend/core/modules/CondenserSelector.js';
let source = fs.readFileSync(file, 'utf8');

if (!source.includes("require('../data/RefrigerantProfiles')")) {
  source = source.replace('class CondenserSelector {', "const { getRefrigerantProfile } = require('../data/RefrigerantProfiles');\nclass CondenserSelector {");
}
if (!source.includes('this.gasCoolers')) {
  source = source.replace(/(\s*\/\/ Air-cooled condensers\r?\n\s*this\.airCooledCondensers = \{)/, "        this.gasCoolers = { 'GCO2': { capacityRange: [20, 560], approach: 10, fanPower: [1.5, 18], models: ['Güntner V-Shape Compact CO2-20', 'Güntner V-Shape Compact CO2-50', 'Güntner V-Shape Compact CO2-150', 'Güntner V-Shape Compact CO2-560'] } };\n$1");
}
source = source.replace(
  /const condensers = type === 'evaporative' \?\r?\n\s*this\.evaporativeCondensers : this\.airCooledCondensers;/,
  "const condensers = type === 'evaporative' ? this.evaporativeCondensers :\n            type === 'gas_cooler' ? this.gasCoolers : this.airCooledCondensers;"
);
if (!source.includes('equipmentRole: type === \'gas_cooler\'')) {
  const resultPattern = /(\s*type:\s*type,\r?\n)(\s*model:\s*selection\.model,)/;
  if (!resultPattern.test(source)) throw new Error('Condenser result type/model lines were not found');
  source = source.replace(resultPattern, "$1            equipmentRole: type === 'gas_cooler' ? 'CO2 gas cooler' : 'heat rejection unit',\n            refrigerantProfile: getRefrigerantProfile(project.refrigerant)?.id || project.refrigerant,\n            componentPolicy: getRefrigerantProfile(project.refrigerant)?.componentPolicy || 'legacy-generic',\n$2");
}
source = source.replace(/manufacturer:\s*type === 'evaporative' \? 'BAC' : '[^']*',/, "manufacturer: type === 'evaporative' ? 'BAC' : type === 'gas_cooler' ? 'Güntner' : 'GÜNTNER',");
fs.writeFileSync(file, source, 'utf8');
console.log('Profile-driven condenser and CO2 gas-cooler selection completed.');
