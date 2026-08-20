/**
 * RefrigerantProfiles
 *
 * Single source of truth for refrigerant-specific engineering behaviour. It is
 * intentionally a profile catalogue, not a substitute for manufacturer selection
 * software, project hazard analysis, pressure-vessel design, or code compliance.
 */
const PROFILES = {
  R717: {
    id: 'R717', family: 'ammonia-industrial', safetyClass: 'B2L',
    cycle: 'pumped_ammonia_industrial',
    feedMethod: 'pumped_recirculated',
    topology: 'pumped-ammonia-industrial',
    compressor: { family: 'screw', manufacturer: 'GEA / Mayekawa / Howden', model: 'HSN8571 industrial screw package' },
    heatRejection: { type: 'evaporative_condenser', manufacturer: 'BAC / Evapco', model: 'Industrial evaporative condenser' },
    liquidManagement: { receiver: 'HP Receiver', accumulator: 'Low-Pressure Suction Separator', conditioning: 'Liquid Pump' },
    piping: { jointType: 'welded', material: 'carbon or stainless steel', policy: 'Welded steel process piping; detachable flanges only where explicitly designed.' },
    safeguards: ['ammonia detection', 'emergency ventilation', 'emergency shutdown', 'pressure relief review'],
    componentPolicy: 'industrial-ammonia-rated'
  },
  R744: {
    id: 'R744', family: 'co2-transcritical', safetyClass: 'A1',
    cycle: 'co2_transcritical_booster',
    feedMethod: 'direct_expansion',
    topology: 'co2-transcritical-gas-cooler',
    compressor: { family: 'co2_reciprocating', manufacturer: 'BITZER', model: 'ECOLINE transcritical CO2 compressor' },
    heatRejection: { type: 'gas_cooler', manufacturer: 'Güntner / BITZER', model: 'CO2 gas cooler' },
    liquidManagement: { receiver: 'Flash Gas Receiver', accumulator: 'Suction Accumulator', conditioning: 'High-pressure control valve' },
    piping: { jointType: 'welded', material: 'high-pressure rated steel', policy: 'High-pressure CO2 piping and components; pressure class, relief devices, and control architecture require project review.' },
    safeguards: ['high-pressure monitoring', 'pressure relief review', 'gas detection where required', 'emergency shutdown'],
    componentPolicy: 'co2-transcritical-rated'
  },
  R290: {
    id: 'R290', family: 'propane-a3', safetyClass: 'A3',
    cycle: 'dx-propane',
    feedMethod: 'direct_expansion',
    topology: 'direct-expansion-propane',
    compressor: { family: 'r290_scroll', manufacturer: 'Copeland', model: 'R290-rated scroll compressor' },
    heatRejection: { type: 'air_cooled_condenser', manufacturer: 'Güntner / Copeland', model: 'Air-cooled condenser for R290' },
    liquidManagement: { receiver: 'Liquid Receiver', accumulator: 'Suction Accumulator', conditioning: 'Filter Drier' },
    piping: { jointType: 'brazed', material: 'refrigeration copper or approved steel', policy: 'Sealed brazed DX piping; no decorative flanges. Charge, zoning, ignition-source and ventilation review are mandatory.' },
    safeguards: ['A3 hydrocarbon leak detection', 'mechanical ventilation', 'non-sparking electrical equipment', 'emergency shutdown', 'charge-limit review'],
    componentPolicy: 'r290-a3-rated'
  },
  R32: {
    id: 'R32', family: 'a2l-dx', safetyClass: 'A2L',
    cycle: 'dx-a2l',
    feedMethod: 'direct_expansion',
    topology: 'direct-expansion-a2l',
    compressor: { family: 'r32_scroll', manufacturer: 'Copeland', model: 'YP / YPV R32-rated scroll compressor' },
    heatRejection: { type: 'air_cooled_condenser', manufacturer: 'Güntner / Copeland', model: 'A2L-rated air-cooled condenser' },
    liquidManagement: { receiver: 'Liquid Receiver', accumulator: 'Suction Accumulator', conditioning: 'Filter Drier' },
    piping: { jointType: 'brazed', material: 'refrigeration copper', policy: 'Sealed brazed DX piping; use A2L-rated components and safety controls.' },
    safeguards: ['A2L leak detection', 'enhanced mechanical ventilation', 'A2L-rated electrical equipment', 'emergency shutdown', 'charge-limit review'],
    componentPolicy: 'a2l-rated'
  },
  R404A: {
    id: 'R404A', family: 'hfc-dx', safetyClass: 'A1', cycle: 'dx-hfc', feedMethod: 'direct_expansion', topology: 'direct-expansion-refrigeration',
    compressor: { family: 'reciprocating', manufacturer: 'BITZER', model: 'ECOLINE 6G refrigeration compressor' },
    heatRejection: { type: 'air_cooled_condenser', manufacturer: 'Güntner', model: 'Air-cooled condenser' },
    liquidManagement: { receiver: 'Liquid Receiver', accumulator: 'Suction Accumulator', conditioning: 'Filter Drier' },
    piping: { jointType: 'brazed', material: 'refrigeration copper', policy: 'Brazed DX piping; service connections require explicit source data.' },
    safeguards: ['high-pressure cut-out', 'low-pressure cut-out', 'pressure relief review'], componentPolicy: 'hfc-rated'
  },
  R410A: {
    id: 'R410A', family: 'hfc-dx', safetyClass: 'A1', cycle: 'dx-hfc', feedMethod: 'direct_expansion', topology: 'direct-expansion-refrigeration',
    compressor: { family: 'r410a_scroll', manufacturer: 'Copeland', model: 'ZP R410A scroll compressor' },
    heatRejection: { type: 'air_cooled_condenser', manufacturer: 'Güntner', model: 'R410A-rated air-cooled condenser' },
    liquidManagement: { receiver: 'Liquid Receiver', accumulator: 'Suction Accumulator', conditioning: 'Filter Drier' },
    piping: { jointType: 'brazed', material: 'refrigeration copper', policy: 'Brazed DX piping with R410A-rated pressure components.' },
    safeguards: ['high-pressure cut-out', 'low-pressure cut-out', 'pressure relief review'], componentPolicy: 'hfc-rated'
  },
  R134a: {
    id: 'R134a', family: 'hfc-dx', safetyClass: 'A1', cycle: 'dx-hfc', feedMethod: 'direct_expansion', topology: 'direct-expansion-refrigeration',
    compressor: { family: 'reciprocating', manufacturer: 'BITZER', model: 'ECOLINE R134a reciprocating compressor' },
    heatRejection: { type: 'air_cooled_condenser', manufacturer: 'Güntner', model: 'Air-cooled condenser' },
    liquidManagement: { receiver: 'Liquid Receiver', accumulator: 'Suction Accumulator', conditioning: 'Filter Drier' },
    piping: { jointType: 'brazed', material: 'refrigeration copper', policy: 'Brazed DX piping; service connections require explicit source data.' },
    safeguards: ['high-pressure cut-out', 'low-pressure cut-out', 'pressure relief review'], componentPolicy: 'hfc-rated'
  },
  R22: {
    id: 'R22', family: 'hcfc-legacy-dx', safetyClass: 'A1', cycle: 'dx-hcfc', feedMethod: 'direct_expansion', topology: 'direct-expansion-refrigeration',
    compressor: { family: 'reciprocating', manufacturer: 'BITZER', model: 'ECOLINE R22 reciprocating compressor' },
    heatRejection: { type: 'air_cooled_condenser', manufacturer: 'Güntner', model: 'Air-cooled condenser' },
    liquidManagement: { receiver: 'Liquid Receiver', accumulator: 'Suction Accumulator', conditioning: 'Filter Drier' },
    piping: { jointType: 'brazed', material: 'refrigeration copper', policy: 'Brazed DX piping; legacy-refrigerant regulatory status requires project review.' },
    safeguards: ['high-pressure cut-out', 'low-pressure cut-out', 'pressure relief review', 'regulatory review'], componentPolicy: 'hcfc-legacy-rated'
  }
};

function normalizeRefrigerant(value) {
  const raw = String(value || '').trim().toUpperCase().replace(/[\s-]/g, '');
  if (raw === 'R134A') return 'R134a';
  return raw;
}

function getRefrigerantProfile(refrigerant) {
  return PROFILES[normalizeRefrigerant(refrigerant)] || null;
}

function listSupportedRefrigerants() {
  return Object.keys(PROFILES);
}

module.exports = { PROFILES, normalizeRefrigerant, getRefrigerantProfile, listSupportedRefrigerants };
