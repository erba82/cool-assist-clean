// Refrigerant selection logic and databases (simplified rules from prompt)

const DB = [
  { code: 'R22', gwp: 1810, odp: 0.055, safety: 'A1', cop: 3.3, pressure: 'medium', allowed: ['USA-legacy', 'China-retrofit'] },
  { code: 'R410A', gwp: 2088, odp: 0, safety: 'A1', cop: 3.1, pressure: 'high', allowed: ['EU', 'USA', 'Global'] },
  { code: 'R407C', gwp: 1774, odp: 0, safety: 'A1', cop: 3.0, pressure: 'medium', allowed: ['USA', 'Global'] },
  { code: 'R407F', gwp: 1495, odp: 0, safety: 'A1', cop: 3.1, pressure: 'medium', allowed: ['Global'] },
  { code: 'R134a', gwp: 1430, odp: 0, safety: 'A1', cop: 3.2, pressure: 'medium', allowed: ['Global'] },
  { code: 'R1234yf', gwp: 4, odp: 0, safety: 'A2L', cop: 3.3, pressure: 'high', allowed: ['EU', 'USA', 'Global'] },
  { code: 'R1234ze(E)', gwp: 1, odp: 0, safety: 'A1', cop: 3.5, pressure: 'low', allowed: ['EU', 'USA', 'Global'] },
  // Natural refrigerants
  { code: 'R290', gwp: 3, odp: 0, safety: 'A3', cop: 3.6, pressure: 'medium', allowed: ['EU', 'USA', 'Global'] },
  { code: 'R600a', gwp: 3, odp: 0, safety: 'A3', cop: 3.6, pressure: 'low', allowed: ['Global'] },
  { code: 'R744', gwp: 1, odp: 0, safety: 'A1', cop: 3.8, pressure: 'very-high', allowed: ['Global'] },
  { code: 'NH3', gwp: 0, odp: 0, safety: 'B2L', cop: 3.9, pressure: 'medium', allowed: ['Industrial'] },
];

function regionFromLocation(loc) {
  const c = (loc.country || '').toLowerCase();
  if (['iran', 'uae', 'saudi arabia', 'qatar', 'oman', 'bahrain', 'kuwait'].includes(c)) return 'ME';
  if (['france', 'germany', 'italy', 'spain', 'poland', 'netherlands', 'sweden', 'uk', 'united kingdom'].includes(c)) return 'EU';
  if (['usa', 'united states', 'canada', 'mexico'].includes(c)) return 'NA';
  if (['india', 'pakistan', 'bangladesh'].includes(c)) return 'SA';
  return 'Global';
}

function filterByRegulation(region) {
  return DB.filter(r => {
    if (region === 'EU') return ['R410A', 'R1234yf', 'R1234ze(E)', 'R290', 'R744', 'R600a'].includes(r.code);
    if (region === 'NA') return ['R410A', 'R407C', 'R1234yf', 'R1234ze(E)', 'R134a', 'R744', 'R290'].includes(r.code);
    return true;
  });
}

function selectRefrigerants({ location, preferEfficiency = true, safetyPreference = 'A1' }) {
  const region = regionFromLocation(location);
  const allowed = filterByRegulation(region);
  const filtered = allowed.filter(r => (safetyPreference ? r.safety.startsWith(safetyPreference[0]) : true));
  const sorted = filtered.sort((a, b) => (preferEfficiency ? b.cop - a.cop : a.gwp - b.gwp));
  return sorted.slice(0, 3);
}

module.exports = { selectRefrigerants };
