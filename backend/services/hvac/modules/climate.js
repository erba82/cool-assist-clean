// Climate data retrieval and normalization
// Pluggable provider interface; default stub values with ability to override per city/country

const defaultMap = {
  'tehran, iran': {
    latitude: 35.6892,
    longitude: 51.3890,
    altitude_m: 1200,
    summer: { db_c: 35, rh: 0.2, wb_c: 21 },
    winter: { db_c: -10, rh: 0.4 },
    solar_w_m2: 850,
    wind_m_s: 3.0,
  },
};

function keyOf(location) {
  return String(location.city + ', ' + location.country).trim().toLowerCase();
}

async function getDesignData(location) {
  const key = keyOf(location);
  const record = defaultMap[key];
  if (record) return { ...record, source: 'internal-default' };
  // Fallback generic mid-latitude profile
  return {
    latitude: location.latitude ?? null,
    longitude: location.longitude ?? null,
    altitude_m: location.altitude_m ?? 0,
    summer: { db_c: 32, rh: 0.5, wb_c: 24 },
    winter: { db_c: -5, rh: 0.5 },
    solar_w_m2: 800,
    wind_m_s: 2.5,
    source: 'fallback-generic',
  };
}

module.exports = { getDesignData };
