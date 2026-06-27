// Equipment sizing: evaporator, condenser, compressor, expansion device

function condenserDesign_W({ Q_evap_W, COP_nominal = 3.2, margin = 0.1 }) {
  const W_comp_W = Q_evap_W / COP_nominal;
  const Q_cond_W = (Q_evap_W + W_comp_W) * (1 + margin);
  return { W_comp_W, Q_cond_W };
}

function evaporatorPerUnit_W({ Q_design_W, units = 1 }) {
  return Q_design_W / units;
}

function compressorSelection({ Q_evap_W, refrigerantCode = 'R410A', T_evap_C = 5, T_cond_C = 42 }) {
  // Placeholder selection output structure
  return {
    type: 'scroll',
    refrigerant: refrigerantCode,
    capacity_kW: Q_evap_W / 1000,
    evaporating_C: T_evap_C,
    condensing_C: T_cond_C,
    suggestedModels: [
      { brand: 'Copeland', model: 'ZH27', capacity_kW: (Q_evap_W / 1000) * 1.05 },
      { brand: 'Bitzer', model: '4F3A-200X', capacity_kW: (Q_evap_W / 1000) * 1.04 },
    ],
  };
}

function txvMassFlow_kg_h({ Q_evap_W, deltaH_kJ_kg = 155 }) {
  // m = Q / (h1 - h4)
  const Q_kJ_s = Q_evap_W / 1000;
  const m_kg_s = Q_kJ_s / deltaH_kJ_kg;
  return m_kg_s * 3600;
}

module.exports = { condenserDesign_W, evaporatorPerUnit_W, compressorSelection, txvMassFlow_kg_h };
