// backend/helpers/RegionResolver.js
// Simple utility to map location strings to region codes.
// In a real app this could use a geocoding API, but for now we use keyword matching.

/**
 * Resolve a region code based on a free‑text location.
 * Returns one of: 'NA' (North America), 'EU' (Europe), 'ME' (Middle East),
 * 'AS' (Asia), 'SA' (South America), or 'AF' (Africa).
 */
function resolveRegion(location) {
    const lower = (location || '').toLowerCase();
    if (lower.includes('usa') || lower.includes('canada') || lower.includes('mexico')) return 'NA';
    if (lower.includes('europe') || lower.includes('germany') || lower.includes('france') || lower.includes('iran')) return 'EU';
    if (lower.includes('middle east') || lower.includes('uae') || lower.includes('saudi')) return 'ME';
    if (lower.includes('china') || lower.includes('japan') || lower.includes('india') || lower.includes('korea')) return 'AS';
    if (lower.includes('brazil') || lower.includes('argentina') || lower.includes('colombia')) return 'SA';
    if (lower.includes('south africa') || lower.includes('nigeria')) return 'AF';
    // Default to North America if unknown
    return 'NA';
}

module.exports = { resolveRegion };
