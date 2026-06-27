/**
 * Product Properties Database
 * Standard thermodynamic properties for common refrigerated products
 * Based on ASHRAE Handbook - Refrigeration
 */

const ProductProperties = {
    // MEAT PRODUCTS
    'beef': {
        name: 'Beef (Fresh)',
        freezingPoint: -1.7,        // °C
        waterContent: 0.75,          // mass fraction
        specificHeatAbove: 3.08,     // kJ/kg·K (above freezing)
        specificHeatBelow: 1.76,     // kJ/kg·K (below freezing)
        latentHeat: 249,             // kJ/kg
        density: 1050,               // kg/m³
        entryTemp: 35,               // °C (typical carcass temp)
        respiration: 0               // W/kg (post-slaughter)
    },
    'lamb': {
        name: 'Lamb (Fresh)',
        freezingPoint: -2.0,
        waterContent: 0.73,
        specificHeatAbove: 3.10,
        specificHeatBelow: 1.68,
        latentHeat: 242,
        density: 1060,
        entryTemp: 36,
        respiration: 0
    },
    'poultry': {
        name: 'Poultry (Chicken)',
        freezingPoint: -2.8,
        waterContent: 0.74,
        specificHeatAbove: 3.32,
        specificHeatBelow: 1.55,
        latentHeat: 246,
        density: 960,
        entryTemp: 38,
        respiration: 0
    },

    // FISH & SEAFOOD
    'fish': {
        name: 'Fish (Lean)',
        freezingPoint: -2.2,
        waterContent: 0.82,
        specificHeatAbove: 3.76,
        specificHeatBelow: 1.84,
        latentHeat: 272,
        density: 1040,
        entryTemp: 15,
        respiration: 0
    },
    'shrimp': {
        name: 'Shrimp',
        freezingPoint: -2.5,
        waterContent: 0.77,
        specificHeatAbove: 3.50,
        specificHeatBelow: 1.67,
        latentHeat: 256,
        density: 1020,
        entryTemp: 10,
        respiration: 0
    },

    // DAIRY
    'milk': {
        name: 'Milk (Whole)',
        freezingPoint: -0.5,
        waterContent: 0.88,
        specificHeatAbove: 3.93,
        specificHeatBelow: 2.01,
        latentHeat: 292,
        density: 1030,
        entryTemp: 35,
        respiration: 0
    },
    'cheese': {
        name: 'Cheese (Hard)',
        freezingPoint: -13.0,
        waterContent: 0.37,
        specificHeatAbove: 2.30,
        specificHeatBelow: 1.38,
        latentHeat: 123,
        density: 1090,
        entryTemp: 20,
        respiration: 0
    },

    // FRUITS & VEGETABLES
    'apples': {
        name: 'Apples',
        freezingPoint: -1.5,
        waterContent: 0.84,
        specificHeatAbove: 3.73,
        specificHeatBelow: 1.88,
        latentHeat: 279,
        density: 840,
        entryTemp: 25,
        respiration: 0.0025    // W/kg (active respiration)
    },
    'potatoes': {
        name: 'Potatoes',
        freezingPoint: -0.6,
        waterContent: 0.78,
        specificHeatAbove: 3.52,
        specificHeatBelow: 1.76,
        latentHeat: 259,
        density: 1080,
        entryTemp: 20,
        respiration: 0.0020
    },

    // DEFAULT/MIXED
    'mixed': {
        name: 'Mixed Products',
        freezingPoint: -2.0,
        waterContent: 0.75,
        specificHeatAbove: 3.20,
        specificHeatBelow: 1.70,
        latentHeat: 250,
        density: 1000,
        entryTemp: 25,
        respiration: 0
    }
};

/**
 * Get product properties with fallback to mixed
 */
function getProductProperties(productType) {
    const type = productType.toLowerCase().trim();
    return ProductProperties[type] || ProductProperties['mixed'];
}

/**
 * Calculate processing time based on product and temperature drop
 * ASHRAE recommended values for industrial refrigeration
 */
function getProcessingTime(productType, entryTemp, targetTemp, processType) {
    const product = getProductProperties(productType);
    const tempDrop = entryTemp - targetTemp;

    // Freezing time estimation (Plank's equation simplified)
    if (targetTemp < product.freezingPoint) {
        // Blast freezing
        if (processType === 'blast' || processType === 'tunnel') {
            // Fast freezing: 3-6 hours for most products
            if (tempDrop > 50) return 5; // Deep freezing
            if (tempDrop > 40) return 4;
            return 3;
        }
        // Air blast freezing (slower)
        if (tempDrop > 50) return 8;
        if (tempDrop > 40) return 6;
        return 4;
    }

    // Chilling only
    if (processType === 'chill' || processType === 'precool') {
        if (tempDrop > 30) return 2;  // Pre-cooling
        if (tempDrop > 20) return 1.5;
        return 1;
    }

    // Storage (already at temp, minimal load)
    return 24; // Full day cycle
}

module.exports = {
    ProductProperties,
    getProductProperties,
    getProcessingTime
};
