/**
 * regionalPricing.js
 * Regional price adjustment factors for global projects
 */

const REGIONAL_PRICING = {
    // North America (Base)
    'US': { factor: 1.0, currency: 'USD', name: 'United States' },
    'CA': { factor: 1.05, currency: 'USD', name: 'Canada' },

    // Europe
    'DE': { factor: 1.15, currency: 'EUR', name: 'Germany' },
    'FR': { factor: 1.15, currency: 'EUR', name: 'France' },
    'UK': { factor: 1.18, currency: 'GBP', name: 'United Kingdom' },
    'IT': { factor: 1.12, currency: 'EUR', name: 'Italy' },

    // Middle East
    'IR': { factor: 1.25, currency: 'USD', name: 'Iran' },
    'AE': { factor: 1.15, currency: 'USD', name: 'UAE' },
    'SA': { factor: 1.18, currency: 'USD', name: 'Saudi Arabia' },
    'TR': { factor: 1.10, currency: 'USD', name: 'Turkey' },

    // Asia
    'CN': { factor: 0.85, currency: 'CNY', name: 'China' },
    'JP': { factor: 1.20, currency: 'JPY', name: 'Japan' },
    'IN': { factor: 0.90, currency: 'INR', name: 'India' },

    // Default
    'DEFAULT': { factor: 1.10, currency: 'USD', name: 'International' }
};

function getRegionalFactor(locationString) {
    if (!locationString) return REGIONAL_PRICING.DEFAULT;

    const upperLoc = locationString.toUpperCase();

    // Simple keyword matching
    if (upperLoc.includes('IRAN') || upperLoc.includes('TEHRAN') || upperLoc.includes('ARDABIL')) return REGIONAL_PRICING.IR;
    if (upperLoc.includes('UAE') || upperLoc.includes('DUBAI')) return REGIONAL_PRICING.AE;
    if (upperLoc.includes('USA') || upperLoc.includes('AMERICA')) return REGIONAL_PRICING.US;
    if (upperLoc.includes('GERMANY')) return REGIONAL_PRICING.DE;
    if (upperLoc.includes('CHINA')) return REGIONAL_PRICING.CN;

    return REGIONAL_PRICING.DEFAULT;
}

module.exports = {
    REGIONAL_PRICING,
    getRegionalFactor
};
