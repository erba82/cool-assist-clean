// Envelope U-values, areas, transmission loads

function uFromLayers(layers) {
  // layers: [{thickness_m, k_W_mK}] plus inside/outside film coefficients (hi, ho)
  const hi = 8; // W/m2K
  const ho = 25; // default calm; caller can override for wind
  const R_layers = layers.reduce((acc, l) => acc + (l.thickness_m / l.k_W_mK), 0);
  const R_total = 1 / hi + R_layers + 1 / ho;
  return 1 / R_total;
}

function transmission_Q_W({ U_W_m2K, area_m2, deltaT_K }) {
  return U_W_m2K * area_m2 * deltaT_K;
}

function roofSolarEquivalent({ T_outdoor_C, solar_W_m2, absorptance = 0.6, h_o = 25 }) {
  // T_equiv = T_out + (alpha*I/ho)
  return T_outdoor_C + (absorptance * solar_W_m2) / h_o;
}

module.exports = { uFromLayers, transmission_Q_W, roofSolarEquivalent };
