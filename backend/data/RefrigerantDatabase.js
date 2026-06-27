// backend/data/RefrigerantDatabase.js
/**
 * Comprehensive Refrigerant Database
 * Supports multiple refrigerants for GFDDE platform
 * Based on ASHRAE Standard 34 classifications and CoolProp data
 */

const RefrigerantDatabase = {
    refrigerants: [
        {
            id: 'R717',
            name: 'Ammonia',
            chemicalFormula: 'NH3',
            coolpropName: 'Ammonia',
            alternateNames: ['NH3', 'R-717'],

            // ASHRAE 34 Safety Classification
            safetyClass: 'B2L',
            toxicity: 'B', // Higher toxicity
            flammability: '2L', // Lower flammability

            // Physical Properties (at 25°C)
            properties: {
                molarMass: 17.03, // g/mol
                criticalTemp: 405.4, // K
                criticalPressure: 11333, // kPa
                normalBoilingPoint: -33.34, // °C
                ozoneDeplectionPotential: 0,
                globalWarmingPotential: 0,

                // Thermodynamic advantages
                latentHeat: 1369, // kJ/kg at NBP
                specificHeat_liquid: 4.7, // kJ/(kg·K)
                specificHeat_vapor: 2.2, // kJ/(kg·K)
            },

            // Operating Range
            operatingRange: {
                evapTemp: { min: -60, max: 10 }, // °C
                condTemp: { min: 20, max: 50 }, // °C
                maxPressure: 3500 // kPa
            },

            // Applications
            applications: [
                'Industrial refrigeration',
                'Cold storage warehouses',
                'Ice rinks',
                'Food processing',
                'Large-scale cooling'
            ],

            // Safety Requirements (ASHRAE 15)
            safety: {
                requiresDetection: true,
                detectionThreshold: 25, // ppm
                maxChargePerRoom: null, // Calculated based on volume
                lowerFlammabilityLimit: 150000, // ppm (15%)
                requiresVentilation: true,
                emergencyShutoff: true
            },

            // Compatibility
            compatibility: {
                lubricants: ['Mineral Oil', 'Polyol Ester (POE)'],
                materials: {
                    suitable: ['Steel', 'Iron', 'Aluminum'],
                    avoid: ['Copper', 'Copper Alloys', 'Zinc']
                }
            }
        },

        {
            id: 'R22',
            name: 'R-22',
            chemicalFormula: 'CHClF2',
            coolpropName: 'R22',
            alternateNames: ['HCFC-22', 'Chlorodifluoromethane'],

            safetyClass: 'A1',
            toxicity: 'A', // Lower toxicity
            flammability: '1', // No flame propagation

            properties: {
                molarMass: 86.47,
                criticalTemp: 369.3, // K
                criticalPressure: 4990, // kPa
                normalBoilingPoint: -40.8,
                ozoneDeplectionPotential: 0.055,
                globalWarmingPotential: 1810,
                latentHeat: 233.5,
                specificHeat_liquid: 1.26,
                specificHeat_vapor: 0.66
            },

            operatingRange: {
                evapTemp: { min: -50, max: 10 },
                condTemp: { min: 20, max: 60 },
                maxPressure: 3500
            },

            applications: [
                'Residential AC (legacy)',
                'Commercial refrigeration',
                'Heat pumps'
            ],

            phaseOut: {
                status: 'Being phased out',
                reason: 'High ODP under Montreal Protocol',
                deadline: 2030
            },

            safety: {
                requiresDetection: false,
                maxChargePerRoom: null,
                lowerFlammabilityLimit: null, // Non-flammable
                requiresVentilation: false
            },

            compatibility: {
                lubricants: ['Mineral Oil', 'Alkylbenzene'],
                materials: {
                    suitable: ['Copper', 'Steel', 'Brass'],
                    avoid: []
                }
            }
        },

        {
            id: 'R410A',
            name: 'R-410A',
            chemicalFormula: 'R32/R125 (50/50)',
            coolpropName: 'R410A',
            alternateNames: ['Puron', 'AZ-20'],

            safetyClass: 'A1',
            toxicity: 'A',
            flammability: '1',

            properties: {
                molarMass: 72.58,
                criticalTemp: 344.5,
                criticalPressure: 4901,
                normalBoilingPoint: -51.6,
                ozoneDeplectionPotential: 0,
                globalWarmingPotential: 2088,
                latentHeat: 276.0,
                specificHeat_liquid: 1.84,
                specificHeat_vapor: 0.98
            },

            operatingRange: {
                evapTemp: { min: -50, max: 15 },
                condTemp: { min: 20, max: 65 },
                maxPressure: 4500
            },

            applications: [
                'Residential AC (current standard)',
                'Commercial AC',
                'Heat pumps',
                'VRF systems'
            ],

            safety: {
                requiresDetection: false,
                maxChargePerRoom: null,
                lowerFlammabilityLimit: null,
                requiresVentilation: false
            },

            compatibility: {
                lubricants: ['Polyol Ester (POE)', 'Polyvinyl Ether (PVE)'],
                materials: {
                    suitable: ['Copper', 'Steel', 'Brass'],
                    avoid: []
                }
            },

            notes: 'Higher operating pressures than R22 (~60% higher)'
        },

        {
            id: 'R32',
            name: 'R-32',
            chemicalFormula: 'CH2F2',
            coolpropName: 'R32',
            alternateNames: ['Difluoromethane'],

            safetyClass: 'A2L',
            toxicity: 'A',
            flammability: '2L', // Mildly flammable

            properties: {
                molarMass: 52.02,
                criticalTemp: 351.3,
                criticalPressure: 5782,
                normalBoilingPoint: -51.7,
                ozoneDeplectionPotential: 0,
                globalWarmingPotential: 675,
                latentHeat: 390.5,
                specificHeat_liquid: 2.35,
                specificHeat_vapor: 1.05
            },

            operatingRange: {
                evapTemp: { min: -45, max: 15 },
                condTemp: { min: 20, max: 60 },
                maxPressure: 5000
            },

            applications: [
                'Residential AC (next-gen)',
                'Commercial AC',
                'Heat pumps',
                'Replacing R410A'
            ],

            safety: {
                requiresDetection: true,
                detectionThreshold: 20000, // ppm (LFL ~14.4%)
                maxChargePerRoom: 'CALCULATED', // Based on ASHRAE 15.2-2022
                lowerFlammabilityLimit: 144000, // ppm
                requiresVentilation: true
            },

            compatibility: {
                lubricants: ['Polyol Ester (POE)'],
                materials: {
                    suitable: ['Copper', 'Steel', 'Aluminum'],
                    avoid: []
                }
            },

            advantages: [
                'Lower GWP than R410A',
                'Higher efficiency',
                'Single component (easier recycling)'
            ]
        },

        {
            id: 'R134a',
            name: 'R-134a',
            chemicalFormula: 'CF3CH2F',
            coolpropName: 'R134a',
            alternateNames: ['HFC-134a', 'Tetrafluoroethane'],

            safetyClass: 'A1',
            toxicity: 'A',
            flammability: '1',

            properties: {
                molarMass: 102.03,
                criticalTemp: 374.2,
                criticalPressure: 4059,
                normalBoilingPoint: -26.1,
                ozoneDeplectionPotential: 0,
                globalWarmingPotential: 1430,
                latentHeat: 215.9,
                specificHeat_liquid: 1.43,
                specificHeat_vapor: 0.85
            },

            operatingRange: {
                evapTemp: { min: -40, max: 15 },
                condTemp: { min: 20, max: 65 },
                maxPressure: 3500
            },

            applications: [
                'Automotive AC',
                'Commercial refrigeration',
                'Chillers',
                'Vending machines'
            ],

            safety: {
                requiresDetection: false,
                maxChargePerRoom: null,
                lowerFlammabilityLimit: null,
                requiresVentilation: false
            },

            compatibility: {
                lubricants: ['Polyol Ester (POE)', 'Polyalkylene Glycol (PAG)'],
                materials: {
                    suitable: ['Copper', 'Steel', 'Aluminum'],
                    avoid: []
                }
            }
        },

        {
            id: 'R744',
            name: 'Carbon Dioxide',
            chemicalFormula: 'CO2',
            coolpropName: 'CO2',
            alternateNames: ['R-744', 'CO2', 'Carbon Dioxide'],

            safetyClass: 'A1',
            toxicity: 'A',
            flammability: '1',

            properties: {
                molarMass: 44.01,
                criticalTemp: 304.13, // K (31°C)
                criticalPressure: 7377,
                normalBoilingPoint: -78.4, // Sublimation point
                ozoneDeplectionPotential: 0,
                globalWarmingPotential: 1,
                latentHeat: 571.0, // At triple point
                specificHeat_liquid: 3.14,
                specificHeat_vapor: 0.85
            },

            operatingRange: {
                evapTemp: { min: -55, max: 10 },
                condTemp: { min: 25, max: 45 }, // Often transcritical
                maxPressure: 12000 // Very high pressure!
            },

            applications: [
                'Supermarket refrigeration',
                'Heat pumps (transcritical)',
                'Industrial cooling',
                'Eco-friendly systems'
            ],

            operatingMode: {
                subcritical: 'Below 31°C discharge temp',
                transcritical: 'Above 31°C discharge temp (gas cooler)'
            },

            safety: {
                requiresDetection: true,
                detectionThreshold: 5000, // ppm (asphyxiation risk)
                maxChargePerRoom: null,
                lowerFlammabilityLimit: null, // Non-flammable
                requiresVentilation: true,
                asphyxiationRisk: true
            },

            compatibility: {
                lubricants: ['Polyol Ester (POE)', 'Polyalkylene Glycol (PAG)'],
                materials: {
                    suitable: ['Stainless Steel', 'Copper Alloys'],
                    avoid: []
                }
            },

            notes: 'Requires special high-pressure components. Often operates in transcritical cycle.'
        },

        {
            id: 'R404A',
            name: 'R-404A',
            chemicalFormula: 'R125/R143a/R134a (44/52/4)',
            coolpropName: 'R404A',
            alternateNames: ['HP62', 'FX70', 'Suva HP62'],

            safetyClass: 'A1',
            toxicity: 'A', // Lower toxicity
            flammability: '1', // No flame propagation

            properties: {
                molarMass: 97.60,
                criticalTemp: 345.3, // K
                criticalPressure: 3735, // kPa
                normalBoilingPoint: -46.5, // °C
                ozoneDeplectionPotential: 0,
                globalWarmingPotential: 3922, // Very high!
                latentHeat: 198.6, // kJ/kg at NBP
                specificHeat_liquid: 1.51, // kJ/(kg·K)
                specificHeat_vapor: 0.96 // kJ/(kg·K)
            },

            operatingRange: {
                evapTemp: { min: -50, max: 10 }, // °C
                condTemp: { min: 20, max: 60 }, // °C
                maxPressure: 4000 // kPa
            },

            applications: [
                'Supermarket refrigeration',
                'Cold storage',
                'Transport refrigeration',
                'Ice machines',
                'Low-temperature applications'
            ],

            phaseOut: {
                status: 'Being restricted (F-gas regulations)',
                reason: 'Very high GWP - EU F-gas regulation limits',
                deadline: 2030,
                alternatives: ['R407A', 'R448A', 'R449A', 'R744']
            },

            safety: {
                requiresDetection: false,
                maxChargePerRoom: null,
                lowerFlammabilityLimit: null, // Non-flammable
                requiresVentilation: false
            },

            compatibility: {
                lubricants: ['Polyol Ester (POE)'],
                materials: {
                    suitable: ['Copper', 'Steel', 'Aluminum'],
                    avoid: []
                }
            },

            notes: 'Widely used in commercial refrigeration. Higher pressures than R22. Not suitable for air conditioning.'
        },

        {
            id: 'R407C',
            name: 'R-407C',
            chemicalFormula: 'R32/R125/R134a (23/25/52)',
            coolpropName: 'R407C',
            alternateNames: ['Klea 407C', 'AC9000', 'Genetron 407C', 'Suva 407C'],

            safetyClass: 'A1',
            toxicity: 'A',
            flammability: '1',

            properties: {
                molarMass: 86.20,
                criticalTemp: 359.3, // K
                criticalPressure: 4620, // kPa
                normalBoilingPoint: -43.6, // °C
                ozoneDeplectionPotential: 0,
                globalWarmingPotential: 1774,
                latentHeat: 264.1, // kJ/kg at NBP
                specificHeat_liquid: 1.63, // kJ/(kg·K)
                specificHeat_vapor: 0.88 // kJ/(kg·K)
            },

            operatingRange: {
                evapTemp: { min: -45, max: 15 }, // °C
                condTemp: { min: 20, max: 65 }, // °C
                maxPressure: 4500 // kPa
            },

            applications: [
                'Commercial AC (R22 retrofit)',
                'Chillers',
                'Heat pumps',
                'Process cooling',
                'Rooftop units'
            ],

            phaseOut: {
                status: 'Stable',
                reason: 'Medium GWP - acceptable under current regulations',
                alternatives: ['R32', 'R452B', 'R454B']
            },

            safety: {
                requiresDetection: false,
                maxChargePerRoom: null,
                lowerFlammabilityLimit: null, // Non-flammable
                requiresVentilation: false
            },

            compatibility: {
                lubricants: ['Polyol Ester (POE)'],
                materials: {
                    suitable: ['Copper', 'Steel', 'Aluminum', 'Brass'],
                    avoid: []
                }
            },

            notes: 'Temperature glide ~7K during phase change. Requires liquid charging. Not a drop-in replacement for R22 (requires TXV adjustment).'
        }
    ],

    /**
     * Get refrigerant by ID
     */
    getRefrigerant(id) {
        return this.refrigerants.find(r => r.id === id);
    },

    /**
     * Get refrigerant by CoolProp name
     */
    getByCoolPropName(name) {
        return this.refrigerants.find(r =>
            r.coolpropName === name || r.alternateNames.includes(name)
        );
    },

    /**
     * Filter by safety class
     */
    getBySafetyClass(safetyClass) {
        return this.refrigerants.filter(r => r.safetyClass === safetyClass);
    },

    /**
     * Get low-GWP alternatives
     */
    getLowGWPRefrigerants(maxGWP = 1000) {
        return this.refrigerants.filter(r => r.properties.globalWarmingPotential <= maxGWP);
    },

    /**
     * Get natural refrigerants
     */
    getNaturalRefrigerants() {
        return this.refrigerants.filter(r =>
            r.properties.ozoneDeplectionPotential === 0 &&
            r.properties.globalWarmingPotential <= 10
        );
    }
};

module.exports = RefrigerantDatabase;
