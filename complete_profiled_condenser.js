const fs = require('fs');
const file = 'backend/core/modules/CondenserSelector.js';
let source = fs.readFileSync(file, 'utf8');

if (!source.includes("require('../data/RefrigerantProfiles')")) {
  source = source.replace('class CondenserSelector {', "const { getRefrigerantProfile } = require('../data/RefrigerantProfiles');\nclass CondenserSelector {");
}
if (!source.includes('this.gasCoolers')) {
  source = source.replace("        // Air-cooled condensers\n        this.airCooledCondensers = {", "        this.gasCoolers = { 'GCO2': { capacityRange: [20, 560], approach: 10, fanPower: [1.5, 18], models: ['Güntner V-Shape Compact CO2-20', 'Güntner V-Shape Compact CO2-50', 'Güntner V-Shape Compact CO2-150', 'Güntner V-Shape Compact CO2-560'] } };\n        // Air-cooled condensers\n        this.airCooledCondensers = {");
}
const oldCatalogue = "        const condensers = type === 'evaporative' ?\n            this.evaporativeCondensers : this.airCooledCondensers;";
if (source.includes(oldCatalogue)) {
  source = source.replace(oldCatalogue, "        const condensers = type === 'evaporative' ? this.evaporativeCondensers :\n            type === 'gas_cooler' ? this.gasCoolers : this.airCooledCondensers;");
}
if (!source.includes('equipmentRole: type === \'gas_cooler\'')) {
  const oldType = "            type: type,\n            model: selection.model,";
  if (!source.includes(oldType)) throw new Error('Condenser response anchor not found');
  source = source.replace(oldType, "            type: type,\n            equipmentRole: type === 'gas_cooler' ? 'CO2 gas cooler' : 'heat rejection unit',\n            refrigerantProfile: getRefrigerantProfile(project.refrigerant)?.id || project.refrigerant,\n            componentPolicy: getRefrigerantProfile(project.refrigerant)?.componentPolicy || 'legacy-generic',\n            model: selection.model,");
}
source = source.replace(/manufacturer: type === 'evaporative' \? 'BAC' : '[^']*',/, "manufacturer: type === 'evaporative' ? 'BAC' : type === 'gas_cooler' ? 'Güntner' : 'GÜNTNER',");
fs.writeFileSync(file, source, 'utf8');
console.log('Profile-driven condenser and CO2 gas-cooler selection completed.');
