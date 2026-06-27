// Cooling load breakdown: transmission, infiltration, people, lighting, equipment, latent, safety

const { transmission_Q_W, roofSolarEquivalent } = require('./envelope');
const psychro = require('./psychrometrics');

function infiltration_W({ ACH, volume_m3, deltaT_K }) {
  const rho = 1.2; // kg/m3
  const Cp = 1.0; // kJ/kgK -> convert to kW by /3600 factor later, but here keep W
  // Q = ACH * Vol * rho * Cp * dT / 3600, kW
  const kW = (ACH * volume_m3 * rho * Cp * deltaT_K) / 3600;
  return kW * 1000; // W
}

function latent_W({ m_dot_kg_s, W_outdoor, W_indoor }) {
  const h_fg_kJ_kg = 2450;
  return m_dot_kg_s * (W_outdoor - W_indoor) * h_fg_kJ_kg * 1000; // to W
}

function sensibleTotal_W(parts) {
  return Object.values(parts).reduce((a, b) => a + b, 0);
}

function totalWithMargin_W({ sensible_W, latent_W, margin = 0.15 }) {
  const total = sensible_W + latent_W;
  return total * (1 + margin);
}

module.exports = {
  infiltration_W,
  latent_W,
  sensibleTotal_W,
  totalWithMargin_W,
  transmission_Q_W,
  roofSolarEquivalent,
};
