// Internal gains: occupancy, lighting, equipment

function occupancySensible_W({ count, activity = 'office' }) {
  const map = { office: 60, retail: 80, restaurant: 100, active: 150 };
  const q = map[activity] ?? 60;
  return count * q;
}

function lighting_W({ area_m2, power_W_m2, load_factor = 0.7, heat_factor = 0.9 }) {
  const P = area_m2 * power_W_m2;
  return P * load_factor * heat_factor;
}

function equipment_W({ area_m2, density_W_m2, load_factor = 0.7, conversion = 0.85 }) {
  const P = area_m2 * density_W_m2;
  return P * load_factor * conversion;
}

module.exports = { occupancySensible_W, lighting_W, equipment_W };
