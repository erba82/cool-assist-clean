/**
 * Global Regional Data - Climate and Energy Costs
 * Comprehensive database for 50+ major cities worldwide
 * Data sourced from: ASHRAE, IEA, National energy agencies
 * Last updated: December 2024
 */

const GlobalRegionalData = {
    // ========================================
    // MIDDLE EAST (10+ cities)
    // ========================================
    'Tehran, Iran': {
        climate: { summerDesign: { temp: 38, rh: 20, wetBulb: 22 }, winterDesign: { temp: -5, rh: 65, wetBulb: -6 }, avgTemp: 18, coolingDegreeDays: 1500, heatingDegreeDays: 2100, elevation: 1200, climateZone: '3B' },
        energy: { electricityCost: 0.04, peakRatePremium: 1.5, offPeakDiscount: 0.7, demandCharge: 8, currency: 'USD', timeOfUseRates: true },
        incentives: { solarRebate: 0.20, energyEfficiency: 0.15, heatRecovery: 0.10 }
    },
    'Dubai, UAE': {
        climate: { summerDesign: { temp: 45, rh: 60, wetBulb: 35 }, winterDesign: { temp: 14, rh: 70, wetBulb: 12 }, avgTemp: 28, coolingDegreeDays: 4500, heatingDegreeDays: 100, elevation: 5, climateZone: '1A' },
        energy: { electricityCost: 0.08, peakRatePremium: 2.0, offPeakDiscount: 0.6, demandCharge: 15, currency: 'USD', timeOfUseRates: true },
        incentives: { solarRebate: 0.30, energyEfficiency: 0.20, demandResponse: 0.15 }
    },
    'Riyadh, Saudi Arabia': {
        climate: { summerDesign: { temp: 46, rh: 15, wetBulb: 25 }, winterDesign: { temp: 8, rh: 50, wetBulb: 5 }, avgTemp: 26, coolingDegreeDays: 4200, heatingDegreeDays: 400, elevation: 600, climateZone: '2B' },
        energy: { electricityCost: 0.05, peakRatePremium: 1.8, offPeakDiscount: 0.5, demandCharge: 12, currency: 'USD', timeOfUseRates: true },
        incentives: { solarRebate: 0.25, energyEfficiency: 0.18 }
    },
    'Cairo, Egypt': {
        climate: { summerDesign: { temp: 40, rh: 30, wetBulb: 26 }, winterDesign: { temp: 10, rh: 60, wetBulb: 7 }, avgTemp: 22, coolingDegreeDays: 3500, heatingDegreeDays: 200, elevation: 23, climateZone: '2B' },
        energy: { electricityCost: 0.06, peakRatePremium: 1.8, offPeakDiscount: 0.7, demandCharge: 8, currency: 'USD', timeOfUseRates: true },
        incentives: { solarRebate: 0.25, energyEfficiency: 0.12 }
    },
    'Abu Dhabi, UAE': {
        climate: { summerDesign: { temp: 46, rh: 65, wetBulb: 36 }, winterDesign: { temp: 12, rh: 70, wetBulb: 10 }, avgTemp: 28, coolingDegreeDays: 4600, heatingDegreeDays: 50, elevation: 5, climateZone: '1A' },
        energy: { electricityCost: 0.07, peakRatePremium: 2.0, offPeakDiscount: 0.6, demandCharge: 14, currency: 'USD', timeOfUseRates: true },
        incentives: { solarRebate: 0.28, energyEfficiency: 0.22, demandResponse: 0.12 }
    },
    'Doha, Qatar': {
        climate: { summerDesign: { temp: 45, rh: 70, wetBulb: 35 }, winterDesign: { temp: 12, rh: 65, wetBulb: 10 }, avgTemp: 28, coolingDegreeDays: 4700, heatingDegreeDays: 50, elevation: 10, climateZone: '1A' },
        energy: { electricityCost: 0.03, peakRatePremium: 1.6, offPeakDiscount: 0.7, demandCharge: 10, currency: 'USD', timeOfUseRates: true },
        incentives: { solarRebate: 0.30, energyEfficiency: 0.20 }
    },
    'Kuwait City, Kuwait': {
        climate: { summerDesign: { temp: 50, rh: 30, wetBulb: 32 }, winterDesign: { temp: 5, rh: 60, wetBulb: 3 }, avgTemp: 27, coolingDegreeDays: 5000, heatingDegreeDays: 300, elevation: 42, climateZone: '2B' },
        energy: { electricityCost: 0.02, peakRatePremium: 1.5, offPeakDiscount: 0.8, demandCharge: 8, currency: 'USD', timeOfUseRates: true },
        incentives: { solarRebate: 0.15, energyEfficiency: 0.10 }
    },
    'Muscat, Oman': {
        climate: { summerDesign: { temp: 42, rh: 55, wetBulb: 32 }, winterDesign: { temp: 15, rh: 65, wetBulb: 12 }, avgTemp: 28, coolingDegreeDays: 4300, heatingDegreeDays: 30, elevation: 10, climateZone: '1A' },
        energy: { electricityCost: 0.04, peakRatePremium: 1.6, offPeakDiscount: 0.7, demandCharge: 10, currency: 'USD', timeOfUseRates: true },
        incentives: { solarRebate: 0.22, energyEfficiency: 0.15 }
    },
    'Jeddah, Saudi Arabia': {
        climate: { summerDesign: { temp: 43, rh: 70, wetBulb: 34 }, winterDesign: { temp: 18, rh: 65, wetBulb: 15 }, avgTemp: 28, coolingDegreeDays: 4200, heatingDegreeDays: 20, elevation: 12, climateZone: '1A' },
        energy: { electricityCost: 0.05, peakRatePremium: 1.8, offPeakDiscount: 0.5, demandCharge: 12, currency: 'USD', timeOfUseRates: true },
        incentives: { solarRebate: 0.25, energyEfficiency: 0.18 }
    },
    'Baghdad, Iraq': {
        climate: { summerDesign: { temp: 48, rh: 20, wetBulb: 28 }, winterDesign: { temp: 3, rh: 65, wetBulb: 1 }, avgTemp: 23, coolingDegreeDays: 3800, heatingDegreeDays: 600, elevation: 35, climateZone: '2B' },
        energy: { electricityCost: 0.03, peakRatePremium: 1.4, offPeakDiscount: 0.8, demandCharge: 6, currency: 'USD', timeOfUseRates: true },
        incentives: { solarRebate: 0.15, energyEfficiency: 0.10 }
    },
    'Amman, Jordan': {
        climate: { summerDesign: { temp: 36, rh: 30, wetBulb: 24 }, winterDesign: { temp: 2, rh: 70, wetBulb: 0 }, avgTemp: 18, coolingDegreeDays: 1400, heatingDegreeDays: 1200, elevation: 780, climateZone: '3B' },
        energy: { electricityCost: 0.10, peakRatePremium: 1.6, offPeakDiscount: 0.7, demandCharge: 10, currency: 'USD', timeOfUseRates: true },
        incentives: { solarRebate: 0.28, energyEfficiency: 0.20 }
    },
    'Beirut, Lebanon': {
        climate: { summerDesign: { temp: 33, rh: 70, wetBulb: 27 }, winterDesign: { temp: 8, rh: 75, wetBulb: 6 }, avgTemp: 20, coolingDegreeDays: 1200, heatingDegreeDays: 800, elevation: 15, climateZone: '3A' },
        energy: { electricityCost: 0.15, peakRatePremium: 1.5, offPeakDiscount: 0.7, demandCharge: 12, currency: 'USD', timeOfUseRates: true },
        incentives: { solarRebate: 0.25, energyEfficiency: 0.18 }
    },

    // ========================================
    // EUROPE (12+ cities)
    // ========================================
    'London, UK': {
        climate: { summerDesign: { temp: 28, rh: 60, wetBulb: 22 }, winterDesign: { temp: -3, rh: 85, wetBulb: -4 }, avgTemp: 11, coolingDegreeDays: 200, heatingDegreeDays: 2400, elevation: 24, climateZone: '4C' },
        energy: { electricityCost: 0.35, peakRatePremium: 1.3, offPeakDiscount: 0.8, demandCharge: 20, currency: 'USD', timeOfUseRates: true },
        incentives: { heatRecovery: 0.30, energyEfficiency: 0.25, carbonReduction: 0.20 }
    },
    'Berlin, Germany': {
        climate: { summerDesign: { temp: 32, rh: 55, wetBulb: 24 }, winterDesign: { temp: -10, rh: 80, wetBulb: -11 }, avgTemp: 10, coolingDegreeDays: 300, heatingDegreeDays: 2800, elevation: 34, climateZone: '5A' },
        energy: { electricityCost: 0.32, peakRatePremium: 1.4, offPeakDiscount: 0.75, demandCharge: 18, currency: 'USD', timeOfUseRates: true },
        incentives: { solarRebate: 0.35, heatRecovery: 0.40, energyEfficiency: 0.30 }
    },
    'Paris, France': {
        climate: { summerDesign: { temp: 33, rh: 50, wetBulb: 25 }, winterDesign: { temp: -2, rh: 85, wetBulb: -3 }, avgTemp: 12, coolingDegreeDays: 250, heatingDegreeDays: 2200, elevation: 35, climateZone: '4A' },
        energy: { electricityCost: 0.22, peakRatePremium: 1.5, offPeakDiscount: 0.7, demandCharge: 16, currency: 'USD', timeOfUseRates: true },
        incentives: { solarRebate: 0.30, heatRecovery: 0.35, energyEfficiency: 0.25 }
    },
    'Madrid, Spain': {
        climate: { summerDesign: { temp: 38, rh: 30, wetBulb: 24 }, winterDesign: { temp: -2, rh: 70, wetBulb: -4 }, avgTemp: 15, coolingDegreeDays: 800, heatingDegreeDays: 1600, elevation: 650, climateZone: '4A' },
        energy: { electricityCost: 0.28, peakRatePremium: 1.6, offPeakDiscount: 0.65, demandCharge: 18, currency: 'USD', timeOfUseRates: true },
        incentives: { solarRebate: 0.35, energyEfficiency: 0.28 }
    },
    'Rome, Italy': {
        climate: { summerDesign: { temp: 35, rh: 50, wetBulb: 26 }, winterDesign: { temp: 0, rh: 75, wetBulb: -2 }, avgTemp: 16, coolingDegreeDays: 700, heatingDegreeDays: 1400, elevation: 21, climateZone: '4A' },
        energy: { electricityCost: 0.30, peakRatePremium: 1.5, offPeakDiscount: 0.7, demandCharge: 16, currency: 'USD', timeOfUseRates: true },
        incentives: { solarRebate: 0.32, energyEfficiency: 0.25 }
    },
    'Amsterdam, Netherlands': {
        climate: { summerDesign: { temp: 28, rh: 65, wetBulb: 22 }, winterDesign: { temp: -5, rh: 85, wetBulb: -6 }, avgTemp: 10, coolingDegreeDays: 150, heatingDegreeDays: 2600, elevation: -2, climateZone: '4C' },
        energy: { electricityCost: 0.28, peakRatePremium: 1.4, offPeakDiscount: 0.75, demandCharge: 18, currency: 'USD', timeOfUseRates: true },
        incentives: { heatRecovery: 0.35, energyEfficiency: 0.28, carbonReduction: 0.22 }
    },
    'Stockholm, Sweden': {
        climate: { summerDesign: { temp: 27, rh: 60, wetBulb: 20 }, winterDesign: { temp: -15, rh: 85, wetBulb: -16 }, avgTemp: 7, coolingDegreeDays: 100, heatingDegreeDays: 3500, elevation: 28, climateZone: '6A' },
        energy: { electricityCost: 0.20, peakRatePremium: 1.3, offPeakDiscount: 0.8, demandCharge: 15, currency: 'USD', timeOfUseRates: true },
        incentives: { heatRecovery: 0.45, energyEfficiency: 0.35, carbonReduction: 0.30 }
    },
    'Warsaw, Poland': {
        climate: { summerDesign: { temp: 30, rh: 60, wetBulb: 23 }, winterDesign: { temp: -15, rh: 80, wetBulb: -16 }, avgTemp: 9, coolingDegreeDays: 200, heatingDegreeDays: 3200, elevation: 106, climateZone: '5A' },
        energy: { electricityCost: 0.18, peakRatePremium: 1.5, offPeakDiscount: 0.7, demandCharge: 14, currency: 'USD', timeOfUseRates: true },
        incentives: { heatRecovery: 0.35, energyEfficiency: 0.25 }
    },
    'Moscow, Russia': {
        climate: { summerDesign: { temp: 29, rh: 65, wetBulb: 22 }, winterDesign: { temp: -25, rh: 80, wetBulb: -26 }, avgTemp: 6, coolingDegreeDays: 100, heatingDegreeDays: 4500, elevation: 156, climateZone: '6A' },
        energy: { electricityCost: 0.08, peakRatePremium: 1.4, offPeakDiscount: 0.75, demandCharge: 10, currency: 'USD', timeOfUseRates: true },
        incentives: { heatRecovery: 0.40, energyEfficiency: 0.25 }
    },
    'Vienna, Austria': {
        climate: { summerDesign: { temp: 32, rh: 55, wetBulb: 24 }, winterDesign: { temp: -10, rh: 80, wetBulb: -11 }, avgTemp: 11, coolingDegreeDays: 250, heatingDegreeDays: 2500, elevation: 171, climateZone: '5A' },
        energy: { electricityCost: 0.25, peakRatePremium: 1.4, offPeakDiscount: 0.75, demandCharge: 16, currency: 'USD', timeOfUseRates: true },
        incentives: { heatRecovery: 0.38, energyEfficiency: 0.30 }
    },
    'Athens, Greece': {
        climate: { summerDesign: { temp: 38, rh: 40, wetBulb: 26 }, winterDesign: { temp: 3, rh: 70, wetBulb: 1 }, avgTemp: 18, coolingDegreeDays: 1200, heatingDegreeDays: 1000, elevation: 70, climateZone: '3A' },
        energy: { electricityCost: 0.20, peakRatePremium: 1.5, offPeakDiscount: 0.7, demandCharge: 14, currency: 'USD', timeOfUseRates: true },
        incentives: { solarRebate: 0.35, energyEfficiency: 0.22 }
    },
    'Istanbul, Turkey': {
        climate: { summerDesign: { temp: 33, rh: 65, wetBulb: 26 }, winterDesign: { temp: 0, rh: 80, wetBulb: -2 }, avgTemp: 15, coolingDegreeDays: 800, heatingDegreeDays: 1400, elevation: 40, climateZone: '4A' },
        energy: { electricityCost: 0.10, peakRatePremium: 1.5, offPeakDiscount: 0.7, demandCharge: 10, currency: 'USD', timeOfUseRates: true },
        incentives: { solarRebate: 0.25, energyEfficiency: 0.20 }
    },

    // ========================================
    // NORTH AMERICA (10+ cities)
    // ========================================
    'New York, USA': {
        climate: { summerDesign: { temp: 35, rh: 55, wetBulb: 26 }, winterDesign: { temp: -12, rh: 70, wetBulb: -13 }, avgTemp: 13, coolingDegreeDays: 600, heatingDegreeDays: 2400, elevation: 10, climateZone: '4A' },
        energy: { electricityCost: 0.18, peakRatePremium: 2.5, offPeakDiscount: 0.6, demandCharge: 25, currency: 'USD', timeOfUseRates: true },
        incentives: { solarRebate: 0.26, energyEfficiency: 0.20, demandResponse: 0.15 }
    },
    'Los Angeles, USA': {
        climate: { summerDesign: { temp: 35, rh: 50, wetBulb: 24 }, winterDesign: { temp: 5, rh: 60, wetBulb: 3 }, avgTemp: 18, coolingDegreeDays: 800, heatingDegreeDays: 600, elevation: 93, climateZone: '3B' },
        energy: { electricityCost: 0.22, peakRatePremium: 3.0, offPeakDiscount: 0.5, demandCharge: 30, currency: 'USD', timeOfUseRates: true },
        incentives: { solarRebate: 0.30, energyEfficiency: 0.25, demandResponse: 0.20 }
    },
    'Chicago, USA': {
        climate: { summerDesign: { temp: 34, rh: 60, wetBulb: 26 }, winterDesign: { temp: -20, rh: 70, wetBulb: -21 }, avgTemp: 10, coolingDegreeDays: 500, heatingDegreeDays: 3200, elevation: 181, climateZone: '5A' },
        energy: { electricityCost: 0.13, peakRatePremium: 2.0, offPeakDiscount: 0.7, demandCharge: 20, currency: 'USD', timeOfUseRates: true },
        incentives: { heatRecovery: 0.30, energyEfficiency: 0.22 }
    },
    'Toronto, Canada': {
        climate: { summerDesign: { temp: 32, rh: 60, wetBulb: 24 }, winterDesign: { temp: -22, rh: 75, wetBulb: -23 }, avgTemp: 9, coolingDegreeDays: 300, heatingDegreeDays: 3500, elevation: 76, climateZone: '6A' },
        energy: { electricityCost: 0.11, peakRatePremium: 1.8, offPeakDiscount: 0.6, demandCharge: 15, currency: 'USD', timeOfUseRates: true },
        incentives: { heatRecovery: 0.40, energyEfficiency: 0.30, carbonReduction: 0.25 }
    },
    'Houston, USA': {
        climate: { summerDesign: { temp: 38, rh: 75, wetBulb: 30 }, winterDesign: { temp: 0, rh: 70, wetBulb: -2 }, avgTemp: 21, coolingDegreeDays: 2500, heatingDegreeDays: 800, elevation: 15, climateZone: '2A' },
        energy: { electricityCost: 0.11, peakRatePremium: 2.2, offPeakDiscount: 0.6, demandCharge: 18, currency: 'USD', timeOfUseRates: true },
        incentives: { solarRebate: 0.22, energyEfficiency: 0.18 }
    },
    'Miami, USA': {
        climate: { summerDesign: { temp: 35, rh: 80, wetBulb: 29 }, winterDesign: { temp: 10, rh: 70, wetBulb: 8 }, avgTemp: 25, coolingDegreeDays: 4000, heatingDegreeDays: 100, elevation: 2, climateZone: '1A' },
        energy: { electricityCost: 0.12, peakRatePremium: 2.0, offPeakDiscount: 0.65, demandCharge: 20, currency: 'USD', timeOfUseRates: true },
        incentives: { solarRebate: 0.26, demandResponse: 0.18 }
    },
    'Dallas, USA': {
        climate: { summerDesign: { temp: 40, rh: 50, wetBulb: 28 }, winterDesign: { temp: -5, rh: 65, wetBulb: -6 }, avgTemp: 19, coolingDegreeDays: 2200, heatingDegreeDays: 1200, elevation: 131, climateZone: '3A' },
        energy: { electricityCost: 0.10, peakRatePremium: 2.0, offPeakDiscount: 0.65, demandCharge: 16, currency: 'USD', timeOfUseRates: true },
        incentives: { solarRebate: 0.20, energyEfficiency: 0.15 }
    },
    'Phoenix, USA': {
        climate: { summerDesign: { temp: 46, rh: 15, wetBulb: 26 }, winterDesign: { temp: 2, rh: 50, wetBulb: 0 }, avgTemp: 24, coolingDegreeDays: 3800, heatingDegreeDays: 600, elevation: 340, climateZone: '2B' },
        energy: { electricityCost: 0.12, peakRatePremium: 2.5, offPeakDiscount: 0.55, demandCharge: 22, currency: 'USD', timeOfUseRates: true },
        incentives: { solarRebate: 0.30, energyEfficiency: 0.22, demandResponse: 0.18 }
    },
    'Denver, USA': {
        climate: { summerDesign: { temp: 35, rh: 30, wetBulb: 22 }, winterDesign: { temp: -18, rh: 60, wetBulb: -19 }, avgTemp: 11, coolingDegreeDays: 400, heatingDegreeDays: 3000, elevation: 1609, climateZone: '5B' },
        energy: { electricityCost: 0.12, peakRatePremium: 1.8, offPeakDiscount: 0.7, demandCharge: 16, currency: 'USD', timeOfUseRates: true },
        incentives: { heatRecovery: 0.30, energyEfficiency: 0.25 }
    },
    'Vancouver, Canada': {
        climate: { summerDesign: { temp: 28, rh: 65, wetBulb: 21 }, winterDesign: { temp: -5, rh: 80, wetBulb: -6 }, avgTemp: 11, coolingDegreeDays: 100, heatingDegreeDays: 2500, elevation: 0, climateZone: '4C' },
        energy: { electricityCost: 0.09, peakRatePremium: 1.5, offPeakDiscount: 0.75, demandCharge: 12, currency: 'USD', timeOfUseRates: true },
        incentives: { heatRecovery: 0.40, energyEfficiency: 0.32, carbonReduction: 0.28 }
    },
    'Mexico City, Mexico': {
        climate: { summerDesign: { temp: 30, rh: 50, wetBulb: 22 }, winterDesign: { temp: 5, rh: 55, wetBulb: 3 }, avgTemp: 17, coolingDegreeDays: 200, heatingDegreeDays: 800, elevation: 2240, climateZone: '4A' },
        energy: { electricityCost: 0.08, peakRatePremium: 1.6, offPeakDiscount: 0.7, demandCharge: 10, currency: 'USD', timeOfUseRates: true },
        incentives: { solarRebate: 0.20, energyEfficiency: 0.15 }
    },

    // ========================================
    // ASIA (12+ cities)
    // ========================================
    'Tokyo, Japan': {
        climate: { summerDesign: { temp: 35, rh: 70, wetBulb: 28 }, winterDesign: { temp: 0, rh: 60, wetBulb: -2 }, avgTemp: 16, coolingDegreeDays: 900, heatingDegreeDays: 1800, elevation: 40, climateZone: '4A' },
        energy: { electricityCost: 0.26, peakRatePremium: 1.6, offPeakDiscount: 0.75, demandCharge: 22, currency: 'USD', timeOfUseRates: true },
        incentives: { energyEfficiency: 0.28, demandResponse: 0.18 }
    },
    'Shanghai, China': {
        climate: { summerDesign: { temp: 37, rh: 75, wetBulb: 30 }, winterDesign: { temp: -2, rh: 70, wetBulb: -4 }, avgTemp: 17, coolingDegreeDays: 1200, heatingDegreeDays: 1600, elevation: 4, climateZone: '3A' },
        energy: { electricityCost: 0.08, peakRatePremium: 2.2, offPeakDiscount: 0.55, demandCharge: 12, currency: 'USD', timeOfUseRates: true },
        incentives: { solarRebate: 0.25, energyEfficiency: 0.20 }
    },
    'Singapore': {
        climate: { summerDesign: { temp: 33, rh: 85, wetBulb: 28 }, winterDesign: { temp: 24, rh: 80, wetBulb: 22 }, avgTemp: 27, coolingDegreeDays: 5500, heatingDegreeDays: 0, elevation: 15, climateZone: '1A' },
        energy: { electricityCost: 0.15, peakRatePremium: 1.5, offPeakDiscount: 0.8, demandCharge: 18, currency: 'USD', timeOfUseRates: true },
        incentives: { energyEfficiency: 0.30, greenBuilding: 0.25 }
    },
    'Mumbai, India': {
        climate: { summerDesign: { temp: 36, rh: 80, wetBulb: 30 }, winterDesign: { temp: 15, rh: 70, wetBulb: 12 }, avgTemp: 27, coolingDegreeDays: 4800, heatingDegreeDays: 0, elevation: 14, climateZone: '1A' },
        energy: { electricityCost: 0.10, peakRatePremium: 2.0, offPeakDiscount: 0.65, demandCharge: 10, currency: 'USD', timeOfUseRates: true },
        incentives: { solarRebate: 0.30, energyEfficiency: 0.15 }
    },
    'Beijing, China': {
        climate: { summerDesign: { temp: 36, rh: 65, wetBulb: 28 }, winterDesign: { temp: -10, rh: 55, wetBulb: -12 }, avgTemp: 13, coolingDegreeDays: 800, heatingDegreeDays: 2500, elevation: 44, climateZone: '4A' },
        energy: { electricityCost: 0.08, peakRatePremium: 2.0, offPeakDiscount: 0.6, demandCharge: 10, currency: 'USD', timeOfUseRates: true },
        incentives: { solarRebate: 0.22, heatRecovery: 0.28, energyEfficiency: 0.18 }
    },
    'Hong Kong': {
        climate: { summerDesign: { temp: 34, rh: 85, wetBulb: 29 }, winterDesign: { temp: 10, rh: 75, wetBulb: 8 }, avgTemp: 23, coolingDegreeDays: 3000, heatingDegreeDays: 200, elevation: 32, climateZone: '2A' },
        energy: { electricityCost: 0.12, peakRatePremium: 1.8, offPeakDiscount: 0.7, demandCharge: 15, currency: 'USD', timeOfUseRates: true },
        incentives: { energyEfficiency: 0.25, greenBuilding: 0.20 }
    },
    'Seoul, South Korea': {
        climate: { summerDesign: { temp: 33, rh: 70, wetBulb: 27 }, winterDesign: { temp: -12, rh: 65, wetBulb: -14 }, avgTemp: 13, coolingDegreeDays: 700, heatingDegreeDays: 2400, elevation: 38, climateZone: '4A' },
        energy: { electricityCost: 0.10, peakRatePremium: 1.7, offPeakDiscount: 0.7, demandCharge: 14, currency: 'USD', timeOfUseRates: true },
        incentives: { solarRebate: 0.30, energyEfficiency: 0.25, heatRecovery: 0.20 }
    },
    'Bangkok, Thailand': {
        climate: { summerDesign: { temp: 38, rh: 75, wetBulb: 30 }, winterDesign: { temp: 20, rh: 70, wetBulb: 18 }, avgTemp: 28, coolingDegreeDays: 5000, heatingDegreeDays: 0, elevation: 2, climateZone: '1A' },
        energy: { electricityCost: 0.10, peakRatePremium: 1.6, offPeakDiscount: 0.7, demandCharge: 12, currency: 'USD', timeOfUseRates: true },
        incentives: { solarRebate: 0.25, energyEfficiency: 0.18 }
    },
    'Delhi, India': {
        climate: { summerDesign: { temp: 45, rh: 40, wetBulb: 30 }, winterDesign: { temp: 5, rh: 65, wetBulb: 3 }, avgTemp: 25, coolingDegreeDays: 3500, heatingDegreeDays: 400, elevation: 216, climateZone: '2A' },
        energy: { electricityCost: 0.08, peakRatePremium: 2.0, offPeakDiscount: 0.65, demandCharge: 8, currency: 'USD', timeOfUseRates: true },
        incentives: { solarRebate: 0.32, energyEfficiency: 0.15 }
    },
    'Taipei, Taiwan': {
        climate: { summerDesign: { temp: 35, rh: 80, wetBulb: 29 }, winterDesign: { temp: 10, rh: 80, wetBulb: 8 }, avgTemp: 23, coolingDegreeDays: 2500, heatingDegreeDays: 300, elevation: 5, climateZone: '2A' },
        energy: { electricityCost: 0.10, peakRatePremium: 1.8, offPeakDiscount: 0.7, demandCharge: 12, currency: 'USD', timeOfUseRates: true },
        incentives: { solarRebate: 0.25, energyEfficiency: 0.20 }
    },
    'Jakarta, Indonesia': {
        climate: { summerDesign: { temp: 35, rh: 85, wetBulb: 29 }, winterDesign: { temp: 24, rh: 85, wetBulb: 23 }, avgTemp: 28, coolingDegreeDays: 5200, heatingDegreeDays: 0, elevation: 8, climateZone: '1A' },
        energy: { electricityCost: 0.08, peakRatePremium: 1.5, offPeakDiscount: 0.75, demandCharge: 10, currency: 'USD', timeOfUseRates: true },
        incentives: { solarRebate: 0.20, energyEfficiency: 0.15 }
    },
    'Kuala Lumpur, Malaysia': {
        climate: { summerDesign: { temp: 34, rh: 85, wetBulb: 28 }, winterDesign: { temp: 24, rh: 80, wetBulb: 22 }, avgTemp: 28, coolingDegreeDays: 5000, heatingDegreeDays: 0, elevation: 22, climateZone: '1A' },
        energy: { electricityCost: 0.08, peakRatePremium: 1.5, offPeakDiscount: 0.75, demandCharge: 10, currency: 'USD', timeOfUseRates: true },
        incentives: { solarRebate: 0.25, energyEfficiency: 0.18 }
    },

    // ========================================
    // SOUTH AMERICA (6+ cities)
    // ========================================
    'São Paulo, Brazil': {
        climate: { summerDesign: { temp: 32, rh: 75, wetBulb: 26 }, winterDesign: { temp: 10, rh: 80, wetBulb: 8 }, avgTemp: 20, coolingDegreeDays: 800, heatingDegreeDays: 400, elevation: 760, climateZone: '3A' },
        energy: { electricityCost: 0.12, peakRatePremium: 3.0, offPeakDiscount: 0.5, demandCharge: 18, currency: 'USD', timeOfUseRates: true },
        incentives: { solarRebate: 0.20, energyEfficiency: 0.15 }
    },
    'Buenos Aires, Argentina': {
        climate: { summerDesign: { temp: 35, rh: 70, wetBulb: 27 }, winterDesign: { temp: 3, rh: 75, wetBulb: 1 }, avgTemp: 18, coolingDegreeDays: 700, heatingDegreeDays: 900, elevation: 25, climateZone: '3A' },
        energy: { electricityCost: 0.06, peakRatePremium: 1.8, offPeakDiscount: 0.65, demandCharge: 8, currency: 'USD', timeOfUseRates: true },
        incentives: { solarRebate: 0.22, energyEfficiency: 0.15 }
    },
    'Santiago, Chile': {
        climate: { summerDesign: { temp: 33, rh: 40, wetBulb: 22 }, winterDesign: { temp: 2, rh: 75, wetBulb: 0 }, avgTemp: 14, coolingDegreeDays: 400, heatingDegreeDays: 1200, elevation: 520, climateZone: '4A' },
        energy: { electricityCost: 0.14, peakRatePremium: 1.6, offPeakDiscount: 0.7, demandCharge: 12, currency: 'USD', timeOfUseRates: true },
        incentives: { solarRebate: 0.25, energyEfficiency: 0.20 }
    },
    'Lima, Peru': {
        climate: { summerDesign: { temp: 30, rh: 80, wetBulb: 25 }, winterDesign: { temp: 15, rh: 85, wetBulb: 13 }, avgTemp: 20, coolingDegreeDays: 800, heatingDegreeDays: 100, elevation: 154, climateZone: '3A' },
        energy: { electricityCost: 0.10, peakRatePremium: 1.5, offPeakDiscount: 0.75, demandCharge: 10, currency: 'USD', timeOfUseRates: true },
        incentives: { solarRebate: 0.20, energyEfficiency: 0.15 }
    },
    'Bogota, Colombia': {
        climate: { summerDesign: { temp: 22, rh: 70, wetBulb: 18 }, winterDesign: { temp: 8, rh: 80, wetBulb: 6 }, avgTemp: 14, coolingDegreeDays: 50, heatingDegreeDays: 200, elevation: 2640, climateZone: '4A' },
        energy: { electricityCost: 0.10, peakRatePremium: 1.4, offPeakDiscount: 0.8, demandCharge: 10, currency: 'USD', timeOfUseRates: true },
        incentives: { energyEfficiency: 0.18 }
    },
    'Rio de Janeiro, Brazil': {
        climate: { summerDesign: { temp: 38, rh: 80, wetBulb: 30 }, winterDesign: { temp: 15, rh: 75, wetBulb: 13 }, avgTemp: 24, coolingDegreeDays: 2000, heatingDegreeDays: 50, elevation: 11, climateZone: '2A' },
        energy: { electricityCost: 0.14, peakRatePremium: 2.5, offPeakDiscount: 0.55, demandCharge: 16, currency: 'USD', timeOfUseRates: true },
        incentives: { solarRebate: 0.22, energyEfficiency: 0.15 }
    },

    // ========================================
    // AFRICA (6+ cities)
    // ========================================
    'Johannesburg, South Africa': {
        climate: { summerDesign: { temp: 30, rh: 55, wetBulb: 22 }, winterDesign: { temp: 0, rh: 65, wetBulb: -2 }, avgTemp: 16, coolingDegreeDays: 400, heatingDegreeDays: 1200, elevation: 1753, climateZone: '3B' },
        energy: { electricityCost: 0.09, peakRatePremium: 2.2, offPeakDiscount: 0.6, demandCharge: 12, currency: 'USD', timeOfUseRates: true },
        incentives: { solarRebate: 0.30, energyEfficiency: 0.18 }
    },
    'Cape Town, South Africa': {
        climate: { summerDesign: { temp: 32, rh: 45, wetBulb: 22 }, winterDesign: { temp: 5, rh: 75, wetBulb: 3 }, avgTemp: 17, coolingDegreeDays: 300, heatingDegreeDays: 600, elevation: 0, climateZone: '3B' },
        energy: { electricityCost: 0.10, peakRatePremium: 2.0, offPeakDiscount: 0.65, demandCharge: 12, currency: 'USD', timeOfUseRates: true },
        incentives: { solarRebate: 0.32, energyEfficiency: 0.20 }
    },
    'Lagos, Nigeria': {
        climate: { summerDesign: { temp: 34, rh: 85, wetBulb: 28 }, winterDesign: { temp: 24, rh: 80, wetBulb: 22 }, avgTemp: 27, coolingDegreeDays: 4500, heatingDegreeDays: 0, elevation: 41, climateZone: '1A' },
        energy: { electricityCost: 0.08, peakRatePremium: 1.5, offPeakDiscount: 0.8, demandCharge: 8, currency: 'USD', timeOfUseRates: false },
        incentives: { solarRebate: 0.25, energyEfficiency: 0.12 }
    },
    'Nairobi, Kenya': {
        climate: { summerDesign: { temp: 28, rh: 60, wetBulb: 21 }, winterDesign: { temp: 12, rh: 70, wetBulb: 10 }, avgTemp: 18, coolingDegreeDays: 200, heatingDegreeDays: 300, elevation: 1795, climateZone: '4A' },
        energy: { electricityCost: 0.15, peakRatePremium: 1.4, offPeakDiscount: 0.75, demandCharge: 12, currency: 'USD', timeOfUseRates: true },
        incentives: { solarRebate: 0.28, energyEfficiency: 0.18 }
    },
    'Casablanca, Morocco': {
        climate: { summerDesign: { temp: 32, rh: 60, wetBulb: 24 }, winterDesign: { temp: 5, rh: 80, wetBulb: 3 }, avgTemp: 18, coolingDegreeDays: 500, heatingDegreeDays: 700, elevation: 56, climateZone: '3A' },
        energy: { electricityCost: 0.12, peakRatePremium: 1.6, offPeakDiscount: 0.7, demandCharge: 10, currency: 'USD', timeOfUseRates: true },
        incentives: { solarRebate: 0.30, energyEfficiency: 0.20 }
    },
    'Addis Ababa, Ethiopia': {
        climate: { summerDesign: { temp: 26, rh: 55, wetBulb: 19 }, winterDesign: { temp: 8, rh: 60, wetBulb: 6 }, avgTemp: 16, coolingDegreeDays: 100, heatingDegreeDays: 500, elevation: 2355, climateZone: '4A' },
        energy: { electricityCost: 0.03, peakRatePremium: 1.3, offPeakDiscount: 0.85, demandCharge: 5, currency: 'USD', timeOfUseRates: false },
        incentives: { energyEfficiency: 0.15 }
    },

    // ========================================
    // OCEANIA (4+ cities)
    // ========================================
    'Sydney, Australia': {
        climate: { summerDesign: { temp: 35, rh: 65, wetBulb: 27 }, winterDesign: { temp: 5, rh: 70, wetBulb: 3 }, avgTemp: 18, coolingDegreeDays: 600, heatingDegreeDays: 600, elevation: 3, climateZone: '3A' },
        energy: { electricityCost: 0.20, peakRatePremium: 2.5, offPeakDiscount: 0.6, demandCharge: 22, currency: 'USD', timeOfUseRates: true },
        incentives: { solarRebate: 0.35, energyEfficiency: 0.25, demandResponse: 0.20 }
    },
    'Melbourne, Australia': {
        climate: { summerDesign: { temp: 38, rh: 45, wetBulb: 25 }, winterDesign: { temp: 3, rh: 75, wetBulb: 1 }, avgTemp: 15, coolingDegreeDays: 400, heatingDegreeDays: 1200, elevation: 31, climateZone: '4A' },
        energy: { electricityCost: 0.22, peakRatePremium: 2.2, offPeakDiscount: 0.62, demandCharge: 20, currency: 'USD', timeOfUseRates: true },
        incentives: { solarRebate: 0.32, energyEfficiency: 0.25, heatRecovery: 0.20 }
    },
    'Brisbane, Australia': {
        climate: { summerDesign: { temp: 34, rh: 70, wetBulb: 27 }, winterDesign: { temp: 8, rh: 65, wetBulb: 6 }, avgTemp: 20, coolingDegreeDays: 1000, heatingDegreeDays: 200, elevation: 38, climateZone: '2A' },
        energy: { electricityCost: 0.18, peakRatePremium: 2.0, offPeakDiscount: 0.65, demandCharge: 18, currency: 'USD', timeOfUseRates: true },
        incentives: { solarRebate: 0.35, energyEfficiency: 0.22 }
    },
    'Auckland, New Zealand': {
        climate: { summerDesign: { temp: 28, rh: 70, wetBulb: 22 }, winterDesign: { temp: 5, rh: 80, wetBulb: 3 }, avgTemp: 15, coolingDegreeDays: 100, heatingDegreeDays: 1000, elevation: 60, climateZone: '4C' },
        energy: { electricityCost: 0.18, peakRatePremium: 1.5, offPeakDiscount: 0.75, demandCharge: 14, currency: 'USD', timeOfUseRates: true },
        incentives: { energyEfficiency: 0.25, carbonReduction: 0.22 }
    },

    // Default fallback for unknown locations
    '_default': {
        climate: { summerDesign: { temp: 35, rh: 60, wetBulb: 27 }, winterDesign: { temp: 0, rh: 70, wetBulb: -2 }, avgTemp: 15, coolingDegreeDays: 1000, heatingDegreeDays: 1500, elevation: 100, climateZone: '4A' },
        energy: { electricityCost: 0.12, peakRatePremium: 1.5, offPeakDiscount: 0.7, demandCharge: 15, currency: 'USD', timeOfUseRates: false },
        incentives: { solarRebate: 0.20, energyEfficiency: 0.15 }
    }
};

module.exports = GlobalRegionalData;
