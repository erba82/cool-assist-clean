// Duct sizing via velocity method

function diameter_m({ flow_L_s, velocity_m_s }) {
  const Q_m3_s = flow_L_s / 1000;
  const A_m2 = Q_m3_s / velocity_m_s;
  const D = Math.sqrt((4 * A_m2) / Math.PI);
  return D;
}

module.exports = { diameter_m };
