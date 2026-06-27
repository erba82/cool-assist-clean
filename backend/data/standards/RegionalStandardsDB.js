/**
 * Regional Standards Database
 * Maps geographic locations to applicable engineering standards
 * Used for refrigeration, HVAC, and building code compliance
 */

const RegionalStandardsDB = {
    // ========================================
    // MIDDLE EAST
    // ========================================
    'Iran': {
        country: 'Iran',
        region: 'Middle East',
        primaryStandards: ['ISIRI', 'ASHRAE'],
        refrigerationStandards: {
            code: 'ISIRI 14291',
            description: 'Iranian Standard for Cold Storage Design',
            safetyFactor: 1.15,
            minInsulation: {
                frozen: 150, // mm for -18°C
                chilled: 100, // mm for +4°C
                blast: 200 // mm for -35°C
            }
        },
        buildingCode: 'Iranian National Building Regulations (Topic 14, 19)',
        electricalStandard: 'IEC with local amendments',
        voltage: { primary: 380, secondary: 220, frequency: 50 },
        refrigerantRestrictions: {
            ammonia: { allowed: true, minCharge: 50 }, // kg
            hfc: { allowed: true },
            co2: { allowed: true }
        },
        certifications: ['ISIRI', 'National Standard Mark'],
        language: 'fa'
    },

    'UAE': {
        country: 'United Arab Emirates',
        region: 'Middle East',
        primaryStandards: ['ASHRAE', 'BS', 'ESMA'],
        refrigerationStandards: {
            code: 'ESMA UAE.S 5010',
            description: 'UAE Standard for Refrigeration Systems',
            safetyFactor: 1.20,
            minInsulation: {
                frozen: 120,
                chilled: 80,
                blast: 180
            }
        },
        buildingCode: 'Dubai Municipality Code / Abu Dhabi ESTIDAMA',
        electricalStandard: 'BS 7671 / IEC',
        voltage: { primary: 400, secondary: 230, frequency: 50 },
        refrigerantRestrictions: {
            ammonia: { allowed: true, requiresApproval: true },
            hfc: { allowed: true },
            co2: { allowed: true }
        },
        certifications: ['ESMA', 'Civil Defense Approval'],
        language: 'en'
    },

    'Saudi Arabia': {
        country: 'Saudi Arabia',
        region: 'Middle East',
        primaryStandards: ['SASO', 'ASHRAE'],
        refrigerationStandards: {
            code: 'SASO',
            description: 'Saudi Standards for Cold Chain',
            safetyFactor: 1.20,
            minInsulation: {
                frozen: 120,
                chilled: 80,
                blast: 180
            }
        },
        buildingCode: 'Saudi Building Code (SBC)',
        electricalStandard: 'SBC-E / IEC',
        voltage: { primary: 380, secondary: 220, frequency: 60 },
        refrigerantRestrictions: {
            ammonia: { allowed: true },
            hfc: { allowed: true },
            co2: { allowed: true }
        },
        certifications: ['SASO', 'SFDA (Food)'],
        language: 'ar'
    },

    'Qatar': {
        country: 'Qatar',
        region: 'Middle East',
        primaryStandards: ['QCS', 'ASHRAE', 'BS'],
        refrigerationStandards: {
            code: 'QCS 2014',
            description: 'Qatar Construction Specifications',
            safetyFactor: 1.15,
            minInsulation: { frozen: 120, chilled: 80, blast: 180 }
        },
        buildingCode: 'QCS 2014',
        electricalStandard: 'QCS / BS 7671',
        voltage: { primary: 400, secondary: 230, frequency: 50 },
        refrigerantRestrictions: { ammonia: { allowed: true }, hfc: { allowed: true }, co2: { allowed: true } },
        certifications: ['KAHRAMA', 'Civil Defense'],
        language: 'en'
    },

    'Kuwait': {
        country: 'Kuwait',
        region: 'Middle East',
        primaryStandards: ['KEBS', 'ASHRAE'],
        refrigerationStandards: {
            code: 'KEBS Standards',
            safetyFactor: 1.15,
            minInsulation: { frozen: 120, chilled: 80, blast: 180 }
        },
        buildingCode: 'Kuwait Building Code',
        voltage: { primary: 400, secondary: 230, frequency: 50 },
        refrigerantRestrictions: { ammonia: { allowed: true }, hfc: { allowed: true }, co2: { allowed: true } },
        language: 'ar'
    },

    // ========================================
    // EUROPE
    // ========================================
    'Germany': {
        country: 'Germany',
        region: 'Europe',
        primaryStandards: ['DIN', 'EN', 'VDI'],
        refrigerationStandards: {
            code: 'DIN EN 378',
            description: 'Refrigerating systems and heat pumps - Safety and environmental requirements',
            safetyFactor: 1.10,
            minInsulation: { frozen: 140, chilled: 100, blast: 200 }
        },
        buildingCode: 'EnEV / GEG',
        electricalStandard: 'VDE / IEC',
        voltage: { primary: 400, secondary: 230, frequency: 50 },
        refrigerantRestrictions: {
            ammonia: { allowed: true, chargeLimit: 10000 },
            hfc: { allowed: true, fGasPhaseDown: true },
            co2: { allowed: true }
        },
        certifications: ['TÜV', 'CE', 'ATEX (hazardous)'],
        language: 'de'
    },

    'United Kingdom': {
        country: 'United Kingdom',
        region: 'Europe',
        primaryStandards: ['BS', 'EN', 'CIBSE'],
        refrigerationStandards: {
            code: 'BS EN 378',
            description: 'UK Refrigeration Safety Standards',
            safetyFactor: 1.10,
            minInsulation: { frozen: 120, chilled: 80, blast: 180 }
        },
        buildingCode: 'UK Building Regulations Part L',
        electricalStandard: 'BS 7671 (18th Edition)',
        voltage: { primary: 400, secondary: 230, frequency: 50 },
        refrigerantRestrictions: {
            ammonia: { allowed: true },
            hfc: { allowed: true, fGasPhaseDown: true },
            co2: { allowed: true }
        },
        certifications: ['UKCA', 'F-Gas Certification'],
        language: 'en'
    },

    'France': {
        country: 'France',
        region: 'Europe',
        primaryStandards: ['NF', 'EN', 'AFNOR'],
        refrigerationStandards: {
            code: 'NF EN 378',
            safetyFactor: 1.10,
            minInsulation: { frozen: 120, chilled: 80, blast: 180 }
        },
        buildingCode: 'RT 2020',
        voltage: { primary: 400, secondary: 230, frequency: 50 },
        refrigerantRestrictions: { ammonia: { allowed: true }, hfc: { allowed: true, fGasPhaseDown: true }, co2: { allowed: true } },
        certifications: ['NF', 'CE'],
        language: 'fr'
    },

    'Netherlands': {
        country: 'Netherlands',
        region: 'Europe',
        primaryStandards: ['NEN', 'EN'],
        refrigerationStandards: {
            code: 'NEN-EN 378',
            safetyFactor: 1.10,
            minInsulation: { frozen: 140, chilled: 100, blast: 200 }
        },
        buildingCode: 'Bouwbesluit',
        voltage: { primary: 400, secondary: 230, frequency: 50 },
        refrigerantRestrictions: { ammonia: { allowed: true }, hfc: { allowed: true, fGasPhaseDown: true }, co2: { allowed: true } },
        language: 'nl'
    },

    // ========================================
    // NORTH AMERICA
    // ========================================
    'USA': {
        country: 'United States',
        region: 'North America',
        primaryStandards: ['ASHRAE', 'IIAR', 'UL'],
        refrigerationStandards: {
            code: 'ASHRAE 15 / IIAR 2',
            description: 'Safety Standard for Refrigeration Systems',
            safetyFactor: 1.15,
            minInsulation: { frozen: 100, chilled: 75, blast: 150 }
        },
        buildingCode: 'IBC / IMC / NFPA',
        electricalStandard: 'NEC (NFPA 70)',
        voltage: { primary: 480, secondary: 120, frequency: 60 },
        refrigerantRestrictions: {
            ammonia: { allowed: true, requiresApproval: 'OSHA PSM > 10000 lbs' },
            hfc: { allowed: true, snapPhaseDown: true },
            co2: { allowed: true }
        },
        certifications: ['UL', 'ETL', 'ASME'],
        language: 'en'
    },

    'Canada': {
        country: 'Canada',
        region: 'North America',
        primaryStandards: ['CSA', 'ASHRAE'],
        refrigerationStandards: {
            code: 'CSA B52',
            description: 'Mechanical Refrigeration Code',
            safetyFactor: 1.15,
            minInsulation: { frozen: 150, chilled: 100, blast: 200 }
        },
        buildingCode: 'NBC / Provincial Codes',
        electricalStandard: 'CEC (CSA C22.1)',
        voltage: { primary: 600, secondary: 120, frequency: 60 },
        refrigerantRestrictions: { ammonia: { allowed: true }, hfc: { allowed: true }, co2: { allowed: true } },
        certifications: ['CSA', 'cUL'],
        language: 'en'
    },

    'Mexico': {
        country: 'Mexico',
        region: 'North America',
        primaryStandards: ['NOM', 'ASHRAE'],
        refrigerationStandards: {
            code: 'NOM-064-SCFI',
            safetyFactor: 1.15,
            minInsulation: { frozen: 100, chilled: 75, blast: 150 }
        },
        voltage: { primary: 440, secondary: 127, frequency: 60 },
        language: 'es'
    },

    // ========================================
    // ASIA
    // ========================================
    'China': {
        country: 'China',
        region: 'Asia',
        primaryStandards: ['GB', 'JB'],
        refrigerationStandards: {
            code: 'GB 9237',
            description: 'Safety Requirements for Refrigerating Systems',
            safetyFactor: 1.20,
            minInsulation: { frozen: 150, chilled: 100, blast: 200 }
        },
        buildingCode: 'GB 50189',
        electricalStandard: 'GB / IEC',
        voltage: { primary: 380, secondary: 220, frequency: 50 },
        refrigerantRestrictions: { ammonia: { allowed: true }, hfc: { allowed: true }, co2: { allowed: true } },
        certifications: ['CCC', 'GB'],
        language: 'zh'
    },

    'Japan': {
        country: 'Japan',
        region: 'Asia',
        primaryStandards: ['JIS', 'JRAIA'],
        refrigerationStandards: {
            code: 'JIS B 8621',
            description: 'Refrigeration safety code',
            safetyFactor: 1.15,
            minInsulation: { frozen: 120, chilled: 80, blast: 180 }
        },
        buildingCode: 'Building Standard Law',
        electricalStandard: 'JIS / JEC',
        voltage: { primary: 200, secondary: 100, frequency: 50 },
        refrigerantRestrictions: { ammonia: { allowed: true }, hfc: { allowed: true }, co2: { allowed: true } },
        certifications: ['JIS', 'PSE'],
        language: 'ja'
    },

    'India': {
        country: 'India',
        region: 'Asia',
        primaryStandards: ['IS', 'ASHRAE'],
        refrigerationStandards: {
            code: 'IS 660 / IS 4840',
            safetyFactor: 1.20,
            minInsulation: { frozen: 100, chilled: 75, blast: 150 }
        },
        buildingCode: 'NBC India',
        voltage: { primary: 415, secondary: 230, frequency: 50 },
        refrigerantRestrictions: { ammonia: { allowed: true }, hfc: { allowed: true }, co2: { allowed: true } },
        certifications: ['BIS', 'ISI'],
        language: 'en'
    },

    'South Korea': {
        country: 'South Korea',
        region: 'Asia',
        primaryStandards: ['KS', 'ASHRAE'],
        refrigerationStandards: {
            code: 'KS B 6753',
            safetyFactor: 1.15,
            minInsulation: { frozen: 120, chilled: 80, blast: 180 }
        },
        voltage: { primary: 380, secondary: 220, frequency: 60 },
        language: 'ko'
    },

    'Singapore': {
        country: 'Singapore',
        region: 'Asia',
        primaryStandards: ['SS', 'ASHRAE', 'BS'],
        refrigerationStandards: {
            code: 'SS 553',
            safetyFactor: 1.10,
            minInsulation: { frozen: 100, chilled: 75, blast: 150 }
        },
        buildingCode: 'BCA Green Mark',
        voltage: { primary: 400, secondary: 230, frequency: 50 },
        refrigerantRestrictions: { ammonia: { allowed: true, requiresApproval: true }, hfc: { allowed: true }, co2: { allowed: true } },
        certifications: ['PSB', 'BCA'],
        language: 'en'
    },

    // ========================================
    // AUSTRALIA / OCEANIA
    // ========================================
    'Australia': {
        country: 'Australia',
        region: 'Oceania',
        primaryStandards: ['AS', 'NZS'],
        refrigerationStandards: {
            code: 'AS/NZS 5149',
            description: 'Refrigerating systems and heat pumps',
            safetyFactor: 1.15,
            minInsulation: { frozen: 120, chilled: 80, blast: 180 }
        },
        buildingCode: 'NCC (National Construction Code)',
        electricalStandard: 'AS/NZS 3000',
        voltage: { primary: 400, secondary: 230, frequency: 50 },
        refrigerantRestrictions: { ammonia: { allowed: true }, hfc: { allowed: true, phaseDown: true }, co2: { allowed: true } },
        certifications: ['SAI', 'RCM'],
        language: 'en'
    },

    'New Zealand': {
        country: 'New Zealand',
        region: 'Oceania',
        primaryStandards: ['NZS', 'AS'],
        refrigerationStandards: {
            code: 'AS/NZS 5149',
            safetyFactor: 1.15,
            minInsulation: { frozen: 140, chilled: 100, blast: 200 }
        },
        voltage: { primary: 400, secondary: 230, frequency: 50 },
        language: 'en'
    },

    // ========================================
    // SOUTH AMERICA
    // ========================================
    'Brazil': {
        country: 'Brazil',
        region: 'South America',
        primaryStandards: ['ABNT', 'ASHRAE'],
        refrigerationStandards: {
            code: 'NBR 16069',
            safetyFactor: 1.15,
            minInsulation: { frozen: 100, chilled: 75, blast: 150 }
        },
        voltage: { primary: 380, secondary: 220, frequency: 60 },
        language: 'pt'
    },

    'Argentina': {
        country: 'Argentina',
        region: 'South America',
        primaryStandards: ['IRAM', 'ASHRAE'],
        refrigerationStandards: {
            code: 'IRAM',
            safetyFactor: 1.15,
            minInsulation: { frozen: 100, chilled: 75, blast: 150 }
        },
        voltage: { primary: 380, secondary: 220, frequency: 50 },
        language: 'es'
    },

    // ========================================
    // AFRICA
    // ========================================
    'South Africa': {
        country: 'South Africa',
        region: 'Africa',
        primaryStandards: ['SANS', 'ASHRAE'],
        refrigerationStandards: {
            code: 'SANS 10147',
            safetyFactor: 1.15,
            minInsulation: { frozen: 100, chilled: 75, blast: 150 }
        },
        voltage: { primary: 400, secondary: 230, frequency: 50 },
        language: 'en'
    },

    'Egypt': {
        country: 'Egypt',
        region: 'Africa',
        primaryStandards: ['ES', 'ASHRAE'],
        refrigerationStandards: {
            code: 'Egyptian Standards',
            safetyFactor: 1.20,
            minInsulation: { frozen: 100, chilled: 75, blast: 150 }
        },
        voltage: { primary: 380, secondary: 220, frequency: 50 },
        language: 'ar'
    },

    // ========================================
    // DEFAULT (International)
    // ========================================
    '_default': {
        country: 'International',
        region: 'Global',
        primaryStandards: ['ASHRAE', 'ISO', 'EN'],
        refrigerationStandards: {
            code: 'ASHRAE 15 / EN 378',
            description: 'International best practices',
            safetyFactor: 1.15,
            minInsulation: { frozen: 120, chilled: 80, blast: 180 }
        },
        buildingCode: 'ASHRAE 90.1',
        electricalStandard: 'IEC',
        voltage: { primary: 400, secondary: 230, frequency: 50 },
        refrigerantRestrictions: { ammonia: { allowed: true }, hfc: { allowed: true }, co2: { allowed: true } },
        certifications: ['ISO', 'CE'],
        language: 'en'
    }
};

/**
 * Get standards for a location
 */
function getStandardsForLocation(location) {
    // Type guard: ensure location is a string
    if (!location) {
        return { ...RegionalStandardsDB['_default'], matchedKey: '_default', isDefault: true };
    }

    // Handle location as object (e.g., { city: 'Dubai', country: 'UAE' })
    if (typeof location === 'object') {
        location = location.city || location.country || location.name || 'International';
    }

    // Ensure string
    location = String(location);

    // Try exact country match
    for (const [key, data] of Object.entries(RegionalStandardsDB)) {
        if (key === '_default') continue;

        const locationLower = location.toLowerCase();
        const keyLower = key.toLowerCase();

        if (locationLower.includes(keyLower) ||
            (data.country && locationLower.includes(data.country.toLowerCase()))) {
            return { ...data, matchedKey: key };
        }
    }

    // City to country mapping
    const cityCountryMap = {
        'tehran': 'Iran', 'isfahan': 'Iran', 'mashhad': 'Iran', 'shiraz': 'Iran', 'tabriz': 'Iran',
        'dubai': 'UAE', 'abu dhabi': 'UAE', 'sharjah': 'UAE',
        'riyadh': 'Saudi Arabia', 'jeddah': 'Saudi Arabia', 'dammam': 'Saudi Arabia',
        'doha': 'Qatar',
        'kuwait city': 'Kuwait',
        'berlin': 'Germany', 'munich': 'Germany', 'frankfurt': 'Germany',
        'london': 'United Kingdom', 'manchester': 'United Kingdom',
        'paris': 'France', 'lyon': 'France',
        'amsterdam': 'Netherlands', 'rotterdam': 'Netherlands',
        'new york': 'USA', 'los angeles': 'USA', 'chicago': 'USA', 'houston': 'USA', 'miami': 'USA',
        'toronto': 'Canada', 'vancouver': 'Canada', 'montreal': 'Canada',
        'mexico city': 'Mexico',
        'beijing': 'China', 'shanghai': 'China', 'guangzhou': 'China',
        'tokyo': 'Japan', 'osaka': 'Japan',
        'mumbai': 'India', 'delhi': 'India', 'bangalore': 'India',
        'seoul': 'South Korea',
        'singapore': 'Singapore',
        'sydney': 'Australia', 'melbourne': 'Australia', 'brisbane': 'Australia',
        'auckland': 'New Zealand',
        'sao paulo': 'Brazil', 'rio de janeiro': 'Brazil',
        'buenos aires': 'Argentina',
        'johannesburg': 'South Africa', 'cape town': 'South Africa',
        'cairo': 'Egypt', 'alexandria': 'Egypt',
        'moscow': 'Russia', 'istanbul': 'Turkey'
    };

    const locationLower = location.toLowerCase();
    for (const [city, country] of Object.entries(cityCountryMap)) {
        if (locationLower.includes(city)) {
            if (RegionalStandardsDB[country]) {
                return { ...RegionalStandardsDB[country], matchedKey: country, matchedCity: city };
            }
        }
    }

    // Return default
    return { ...RegionalStandardsDB['_default'], matchedKey: '_default', isDefault: true };
}

/**
 * Get insulation recommendation
 */
function getInsulationRecommendation(location, temperature) {
    const standards = getStandardsForLocation(location);
    const insulation = standards.refrigerationStandards?.minInsulation || { frozen: 120, chilled: 80, blast: 180 };

    if (temperature <= -30) return { thickness: insulation.blast, type: 'PU Panel', density: '40 kg/m³' };
    if (temperature <= -18) return { thickness: insulation.frozen, type: 'PU Panel', density: '40 kg/m³' };
    return { thickness: insulation.chilled, type: 'PU Panel', density: '38 kg/m³' };
}

/**
 * Get safety factor for calculations
 */
function getSafetyFactor(location) {
    const standards = getStandardsForLocation(location);
    return standards.refrigerationStandards?.safetyFactor || 1.15;
}

module.exports = {
    RegionalStandardsDB,
    getStandardsForLocation,
    getInsulationRecommendation,
    getSafetyFactor
};
