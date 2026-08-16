const fs = require('fs');

function addImport(file, anchor, line) {
  let source = fs.readFileSync(file, 'utf8');
  if (!source.includes(line)) {
    if (!source.includes(anchor)) throw new Error(`Import anchor missing in ${file}`);
    source = source.replace(anchor, `${anchor}\n${line}`);
    fs.writeFileSync(file, source, 'utf8');
  }
}
function replaceExact(file, find, replace) {
  let source = fs.readFileSync(file, 'utf8');
  if (!source.includes(find)) throw new Error(`Expected text missing in ${file}: ${find.slice(0, 96)}`);
  source = source.replace(find, replace);
  fs.writeFileSync(file, source, 'utf8');
}
function replaceBetween(file, startToken, endToken, replacement) {
  let source = fs.readFileSync(file, 'utf8');
  const start = source.indexOf(startToken);
  const end = source.indexOf(endToken, start);
  if (start < 0 || end < 0) throw new Error(`Method boundary missing in ${file}: ${startToken}`);
  source = source.slice(0, start) + replacement + source.slice(end);
  fs.writeFileSync(file, source, 'utf8');
}

// Condenser / gas-cooler selection is driven by the refrigerant profile.
addImport('backend/core/modules/CondenserSelector.js', "class CondenserSelector {", "const { getRefrigerantProfile } = require('../data/RefrigerantProfiles');");
let condenser = fs.readFileSync('backend/core/modules/CondenserSelector.js', 'utf8');
if (!condenser.includes('this.gasCoolers')) {
  condenser = condenser.replace(
    "        // Air-cooled condensers\n        this.airCooledCondensers = {",
    `        // CO2 gas coolers. Final model selection requires manufacturer software and design-pressure review.
        this.gasCoolers = {
            'GCO2': { capacityRange: [20, 560], approach: 10, fanPower: [1.5, 18], models: ['Güntner V-Shape Compact CO2-20', 'Güntner V-Shape Compact CO2-50', 'Güntner V-Shape Compact CO2-150', 'Güntner V-Shape Compact CO2-560'] }
        };
        // Air-cooled condensers
        this.airCooledCondensers = {`
  );
  fs.writeFileSync('backend/core/modules/CondenserSelector.js', condenser, 'utf8');
}
replaceBetween(
  'backend/core/modules/CondenserSelector.js',
  '    _selectType(',
  '    _getAltitudeFactor(',
  `    _selectType(project, wetBulb, dryBulb) {
        const profile = getRefrigerantProfile(project.refrigerant);
        if (profile?.heatRejection?.type) return profile.heatRejection.type;
        if (project.condenserType) return project.condenserType;
        return 'air_cooled';
    }
`
);
replaceExact(
  'backend/core/modules/CondenserSelector.js',
  "        const condensers = type === 'evaporative' ?\n            this.evaporativeCondensers : this.airCooledCondensers;",
  "        const condensers = type === 'evaporative' ? this.evaporativeCondensers :\n            type === 'gas_cooler' ? this.gasCoolers : this.airCooledCondensers;"
);
replaceExact(
  'backend/core/modules/CondenserSelector.js',
  "            manufacturer: type === 'evaporative' ? 'BAC' : 'GÃœNTNER',",
  "            manufacturer: type === 'evaporative' ? 'BAC' : type === 'gas_cooler' ? 'Güntner' : 'GÜNTNER',"
);
replaceExact(
  'backend/core/modules/CondenserSelector.js',
  "            type: type,\n            model: selection.model,",
  "            type: type,\n            equipmentRole: type === 'gas_cooler' ? 'CO2 gas cooler' : 'heat rejection unit',\n            refrigerantProfile: getRefrigerantProfile(project.refrigerant)?.id || project.refrigerant,\n            componentPolicy: getRefrigerantProfile(project.refrigerant)?.componentPolicy || 'legacy-generic',\n            model: selection.model,"
);

// Generate profile-specific P&ID equipment, cycle metadata, safety devices, and pipe-joint policy.
addImport('backend/services/generative/AdvancedPIDGenerator.js', "class AdvancedPIDGenerator {", "const { getRefrigerantProfile } = require('../../core/data/RefrigerantProfiles');");
replaceExact(
  'backend/services/generative/AdvancedPIDGenerator.js',
  "        const isAmmonia = this._isAmmonia(refrigerant);\n        const totalLoad =",
  "        const profile = getRefrigerantProfile(refrigerant);\n        if (!profile) throw new Error(`No refrigerant profile is available for ${refrigerant}`);\n        const isAmmonia = profile.family === 'ammonia-industrial';\n        const isCO2 = profile.family === 'co2-transcritical';\n        const defaultJointType = profile.piping.jointType;\n        const totalLoad ="
);
replaceExact(
  'backend/services/generative/AdvancedPIDGenerator.js',
  "            : [{ model: isAmmonia ? 'HSN8571' : 'Copeland ZB Series', type: isAmmonia ? 'Screw' : 'Reciprocating' }];",
  "            : [{ model: profile.compressor.model, type: profile.compressor.family, manufacturer: profile.compressor.manufacturer }];"
);
replaceExact(
  'backend/services/generative/AdvancedPIDGenerator.js',
  "                model: source.model || (isAmmonia ? 'HSN8571' : 'Copeland ZB Series')",
  "                model: source.model || profile.compressor.model"
);
replaceExact(
  'backend/services/generative/AdvancedPIDGenerator.js',
  "                    jointType: 'welded',\n                    connectionType: 'welded',",
  "                    jointType: defaultJointType,\n                    connectionType: defaultJointType,"
);
replaceExact(
  'backend/services/generative/AdvancedPIDGenerator.js',
  "            label: condenser.model || (isAmmonia ? 'Evaporative Condenser' : 'Air-Cooled Condenser'),\n            componentType: isAmmonia ? 'evaporative_condenser' : 'air_cooled_condenser',",
  "            label: condenser.model || profile.heatRejection.model,\n            componentType: profile.heatRejection.type,"
);
replaceExact(
  'backend/services/generative/AdvancedPIDGenerator.js',
  "            label: isAmmonia ? 'HP Receiver' : 'Liquid Receiver',\n            componentType: 'horizontal_vessel',\n            tag: isAmmonia ? 'REC-HP-01' : 'REC-LP-01',",
  "            label: profile.liquidManagement.receiver,\n            componentType: 'horizontal_vessel',\n            tag: isAmmonia ? 'REC-HP-01' : isCO2 ? 'REC-FG-01' : 'REC-LP-01',"
);
replaceExact(
  'backend/services/generative/AdvancedPIDGenerator.js',
  "        const needsOilSeparator = isAmmonia || compressors.length > 1 || Boolean(calculations.oilSeparators?.length);",
  "        const needsOilSeparator = isAmmonia || isCO2 || compressors.length > 1 || Boolean(calculations.oilSeparators?.length);"
);
replaceExact(
  'backend/services/generative/AdvancedPIDGenerator.js',
  "            label: isAmmonia ? 'Liquid Pump' : 'Filter Drier',\n            componentType: isAmmonia ? 'centrifugal_pump' : 'strainer',",
  "            label: profile.liquidManagement.conditioning,\n            componentType: isAmmonia ? 'centrifugal_pump' : 'strainer',"
);
replaceExact(
  'backend/services/generative/AdvancedPIDGenerator.js',
  "            label: isAmmonia ? 'Low-Pressure Suction Separator' : 'Suction Accumulator',\n            componentType: 'horizontal_vessel',\n            tag: isAmmonia ? 'SEP-LP-01' : 'ACC-SUC-01',",
  "            label: profile.liquidManagement.accumulator,\n            componentType: 'horizontal_vessel',\n            tag: isAmmonia ? 'SEP-LP-01' : isCO2 ? 'ACC-CO2-01' : 'ACC-SUC-01',"
);
replaceExact(
  'backend/services/generative/AdvancedPIDGenerator.js',
  "                label: isAmmonia ? 'Hand Expansion Valve' : 'Thermostatic Expansion Valve',",
  "                label: isAmmonia ? 'Hand Expansion Valve' : isCO2 ? 'Electronic Expansion Valve' : 'Thermostatic Expansion Valve',"
);
replaceExact(
  'backend/services/generative/AdvancedPIDGenerator.js',
  "        const assemblyTitle = `${refrigerant} P&ID TO BIM ASSEMBLY`;",
  `        const safetyDeviceMap = {
            'ammonia detection': ['Ammonia Gas Detector', 'gas_detector'],
            'A3 hydrocarbon leak detection': ['R290 Gas Detector', 'gas_detector'],
            'A2L leak detection': ['A2L Gas Detector', 'gas_detector'],
            'gas detection where required': ['CO2 Gas Detector', 'gas_detector'],
            'mechanical ventilation': ['Emergency Ventilation Fan', 'ventilation_fan'],
            'enhanced mechanical ventilation': ['Enhanced Ventilation Fan', 'ventilation_fan'],
            'emergency ventilation': ['Emergency Ventilation Fan', 'ventilation_fan'],
            'emergency shutdown': ['Emergency Shutdown Panel', 'emergency_shutdown'],
            'high-pressure monitoring': ['High-Pressure Safety Control', 'safety_control'],
            'pressure relief review': ['Pressure Relief Review Point', 'relief_valve']
        };
        profile.safeguards.forEach((requirement, index) => {
            const [label, componentType] = safetyDeviceMap[requirement] || [requirement, 'safety_control'];
            addNode({ x: 60 + (index % 2) * 145, y: 105 + Math.floor(index / 2) * 75, label, componentType, tag: 'SAFE-' + String(index + 1).padStart(2, '0'), mounting: 'wall', details: { safetyRequirement: requirement, refrigerant, profile: profile.id } });
        });
        const assemblyTitle = refrigerant + ' P&ID TO BIM ASSEMBLY';`
);
replaceExact(
  'backend/services/generative/AdvancedPIDGenerator.js',
  "                topology: isAmmonia ? 'pumped-ammonia-industrial' : 'direct-expansion-refrigeration',\n                assemblyTitle,\n                jointPolicy: isAmmonia ? 'R717 process piping: welded connections by default; flanges only when explicitly specified.' : `${refrigerant} design: refrigerant-specific equipment and closed-loop topology generated from the submitted design.`,",
  "                topology: profile.topology,\n                cycle: profile.cycle,\n                assemblyTitle,\n                profile: { id: profile.id, family: profile.family, safetyClass: profile.safetyClass, componentPolicy: profile.componentPolicy, safeguards: profile.safeguards, pipingMaterial: profile.piping.material },\n                jointPolicy: profile.piping.policy,"
);

// Make the 3D engine understand braided DX lines, CO2 gas coolers and safety devices.
replaceExact('frontend/src/engines/RefrigerationSceneEngine.ts', "export type JointType = 'welded' | 'flanged' | 'grooved';", "export type JointType = 'welded' | 'brazed' | 'flanged' | 'grooved';");
replaceExact('frontend/src/engines/RefrigerationSceneEngine.ts', "  if (/evaporative.?condenser|condenser/.test(type)) return 'BIM_CONDENSER_EVAP';", "  if (/gas.?cooler|evaporative.?condenser|condenser/.test(type)) return 'BIM_CONDENSER_EVAP';");
replaceExact('frontend/src/engines/RefrigerationSceneEngine.ts', "  if (/pump|circulator/.test(type)) return 'BIM_PUMP_CENTRIFUGAL';\n  if (/pump|circulator/.test(type)) return 'BIM_PUMP_CENTRIFUGAL';", "  if (/pump|circulator/.test(type)) return 'BIM_PUMP_CENTRIFUGAL';\n  if (/gas.?detector|safety.?control|emergency.?shutdown/.test(type)) return 'BIM_SAFETY_PANEL';\n  if (/ventilation.?fan/.test(type)) return 'BIM_VENTILATION_FAN';");
replaceExact('frontend/src/engines/RefrigerationSceneEngine.ts', "  if (/groove|grooved|victaulic/.test(explicit)) return 'grooved';\n  // R717 pipe-runs are visually rendered as welded unless a detachable joint is\n  // specified by the source design.\n  if (/717|ammonia|nh3/.test(refrigerant)) return 'welded';\n  return 'welded';", "  if (/groove|grooved|victaulic/.test(explicit)) return 'grooved';\n  if (/braze|brazed/.test(explicit)) return 'brazed';\n  const ref = String(refrigerant || '').toUpperCase();\n  if (/717|AMMONIA|NH3|744/.test(ref)) return 'welded';\n  return 'brazed';");

console.log('Central refrigerant profiles are now wired into condenser, P&ID, and 3D scene policies.');
