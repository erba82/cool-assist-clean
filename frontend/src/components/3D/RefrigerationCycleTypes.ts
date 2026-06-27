/**
 * Refrigeration Cycle Configurations
 * 
 * Defines proper cycle-based equipment and piping for each refrigerant type
 * following ASHRAE 15, IIAR-2, and ASME B31.5 standards.
 * 
 * @version 1.0.0
 */

// ============================================================
// CYCLE TYPE DEFINITIONS
// ============================================================

export type CycleType = 'flooded' | 'dx' | 'transcritical' | 'cascade' | 'pumped_recirculation';
export type RefrigerantType = 'ammonia' | 'co2' | 'hfc' | 'hc' | 'hfo';

export interface CycleEquipment {
    hasLowPressureReceiver: boolean;
    hasHighPressureReceiver: boolean;
    hasSeparator: boolean;
    hasOilSeparator: boolean;
    hasOilPot: boolean;
    hasRefrigerantPumps: boolean;
    hasIntercooler: boolean;       // For CO2 transcritical
    hasGasCooler: boolean;         // CO2 uses gas cooler instead of condenser
    hasFlashTank: boolean;         // For CO2 transcritical
    hasSuctionAccumulator: boolean;// For DX systems
    hasFilterDrier: boolean;       // For HFC/HFO systems
    hasEconomizer: boolean;        // For 2-stage systems
}

export interface PipingRequirements {
    suctionSlope: number;          // Slope ratio (e.g., 1:200 = 0.005)
    pTrapDepth: number;            // P-trap depth in meters
    needsDoubleRiser: boolean;     // For capacity variation
    needsOilLiftRisers: boolean;   // For vertical suction risers
    maxHorizontalRun: number;      // Max horizontal run before support (meters)
    needsExpansionLoops: boolean;  // For long runs
}

export interface CycleStage {
    name: string;
    from: string;
    to: string;
    pipeType: 'discharge' | 'suction' | 'liquid' | 'hotGas' | 'oil';
    description: string;
}

export interface RefrigerationCycleConfig {
    cycleType: CycleType;
    refrigerantType: RefrigerantType;
    equipment: CycleEquipment;
    piping: PipingRequirements;
    stages: CycleStage[];
    standard: string;              // Primary standard (IIAR-2, ASHRAE, EN 378)
}

// ============================================================
// FLOODED AMMONIA CYCLE (R717)
// IIAR-2 Compliant - Industrial Refrigeration
// ============================================================

export const FLOODED_AMMONIA_CYCLE: RefrigerationCycleConfig = {
    cycleType: 'flooded',
    refrigerantType: 'ammonia',
    equipment: {
        hasLowPressureReceiver: true,
        hasHighPressureReceiver: true,
        hasSeparator: true,          // Low pressure receiver/separator
        hasOilSeparator: true,       // On discharge line
        hasOilPot: true,             // Drain from separator
        hasRefrigerantPumps: true,   // Recirculation pumps
        hasIntercooler: false,
        hasGasCooler: false,
        hasFlashTank: false,
        hasSuctionAccumulator: false,
        hasFilterDrier: false,       // Not needed for ammonia
        hasEconomizer: false
    },
    piping: {
        suctionSlope: 0.005,          // 1:200 slope toward separator
        pTrapDepth: 0.3,              // 300mm per IIAR-2
        needsDoubleRiser: true,       // Required for capacity > 100kW
        needsOilLiftRisers: true,     // Oil must return to compressor
        maxHorizontalRun: 3.0,        // Support every 3m
        needsExpansionLoops: true     // For runs > 15m
    },
    stages: [
        {
            name: 'Discharge',
            from: 'Compressor',
            to: 'Oil Separator → Condenser',
            pipeType: 'discharge',
            description: 'High pressure hot gas (1.0-1.5 MPa)'
        },
        {
            name: 'Condensate',
            from: 'Condenser',
            to: 'High Pressure Receiver',
            pipeType: 'liquid',
            description: 'Subcooled liquid to receiver'
        },
        {
            name: 'Liquid Supply',
            from: 'HP Receiver',
            to: 'Low Pressure Receiver',
            pipeType: 'liquid',
            description: 'Flash to LP receiver via expansion valve'
        },
        {
            name: 'Pump Liquid',
            from: 'LP Receiver',
            to: 'Evaporators',
            pipeType: 'liquid',
            description: 'Pumped liquid to evaporators (overfeed)'
        },
        {
            name: 'Wet Return',
            from: 'Evaporators',
            to: 'LP Receiver/Separator',
            pipeType: 'suction',
            description: 'Two-phase mixture back to separator'
        },
        {
            name: 'Dry Suction',
            from: 'Separator',
            to: 'Compressor',
            pipeType: 'suction',
            description: 'Dry saturated vapor to compressor'
        }
    ],
    standard: 'IIAR-2'
};

// ============================================================
// DIRECT EXPANSION (DX) CYCLE - R404A, R134a, R507
// ASHRAE 15 Compliant
// ============================================================

export const DX_HFC_CYCLE: RefrigerationCycleConfig = {
    cycleType: 'dx',
    refrigerantType: 'hfc',
    equipment: {
        hasLowPressureReceiver: false,
        hasHighPressureReceiver: true,  // Liquid receiver after condenser
        hasSeparator: false,            // No separator in DX
        hasOilSeparator: false,         // Oil mixed with refrigerant
        hasOilPot: false,
        hasRefrigerantPumps: false,     // Pressure differential drives flow
        hasIntercooler: false,
        hasGasCooler: false,
        hasFlashTank: false,
        hasSuctionAccumulator: true,    // Protect compressor from liquid
        hasFilterDrier: true,           // Required for HFCs
        hasEconomizer: false
    },
    piping: {
        suctionSlope: 0.0083,           // 1:120 slope per ASHRAE
        pTrapDepth: 0.15,               // 150mm typical
        needsDoubleRiser: false,
        needsOilLiftRisers: true,       // Oil entrainment
        maxHorizontalRun: 4.0,          // Support every 4m
        needsExpansionLoops: true
    },
    stages: [
        {
            name: 'Discharge',
            from: 'Compressor',
            to: 'Condenser',
            pipeType: 'discharge',
            description: 'High pressure superheated gas'
        },
        {
            name: 'Liquid Line',
            from: 'Condenser',
            to: 'Liquid Receiver → Filter Drier → TXV',
            pipeType: 'liquid',
            description: 'Subcooled liquid'
        },
        {
            name: 'Evaporator',
            from: 'TXV',
            to: 'Evaporator',
            pipeType: 'liquid',
            description: 'Low pressure two-phase'
        },
        {
            name: 'Suction',
            from: 'Evaporator',
            to: 'Suction Accumulator → Compressor',
            pipeType: 'suction',
            description: 'Superheated vapor'
        }
    ],
    standard: 'ASHRAE 15'
};

// ============================================================
// TRANSCRITICAL CO2 CYCLE (R744)
// EN 378 / ASHRAE 15 Compliant
// ============================================================

export const TRANSCRITICAL_CO2_CYCLE: RefrigerationCycleConfig = {
    cycleType: 'transcritical',
    refrigerantType: 'co2',
    equipment: {
        hasLowPressureReceiver: true,   // Flash tank / LP receiver
        hasHighPressureReceiver: true,  // HP receiver
        hasSeparator: false,
        hasOilSeparator: true,          // Required for CO2
        hasOilPot: true,
        hasRefrigerantPumps: false,
        hasIntercooler: true,           // Between stages
        hasGasCooler: true,             // NOT condenser - supercritical
        hasFlashTank: true,             // Gas bypass / parallel compression
        hasSuctionAccumulator: true,
        hasFilterDrier: false,          // CO2 compatible driers only
        hasEconomizer: true             // Flash gas economizer
    },
    piping: {
        suctionSlope: 0.005,
        pTrapDepth: 0.2,
        needsDoubleRiser: false,
        needsOilLiftRisers: true,
        maxHorizontalRun: 3.0,
        needsExpansionLoops: true       // High pressure differential
    },
    stages: [
        {
            name: 'MT Discharge',
            from: 'MT Compressor',
            to: 'Gas Cooler',
            pipeType: 'discharge',
            description: 'Supercritical CO2 (> 73.8 bar)'
        },
        {
            name: 'Gas Cooler Out',
            from: 'Gas Cooler',
            to: 'HP Receiver',
            pipeType: 'discharge',  // Still supercritical
            description: 'Cooled supercritical CO2'
        },
        {
            name: 'HP to Flash Tank',
            from: 'HP Receiver',
            to: 'Flash Tank',
            pipeType: 'liquid',
            description: 'Isenthalpic expansion'
        },
        {
            name: 'Flash Gas',
            from: 'Flash Tank',
            to: 'MT Compressor Suction',
            pipeType: 'suction',
            description: 'Flash gas bypass'
        },
        {
            name: 'MT Liquid',
            from: 'Flash Tank',
            to: 'MT Evaporators',
            pipeType: 'liquid',
            description: 'Medium temp liquid (-8°C to +5°C)'
        },
        {
            name: 'LT Liquid',
            from: 'Flash Tank',
            to: 'LT Evaporators',
            pipeType: 'liquid',
            description: 'Low temp liquid (-35°C to -25°C)'
        },
        {
            name: 'MT Suction',
            from: 'MT Evaporators',
            to: 'MT Compressor',
            pipeType: 'suction',
            description: 'MT suction (~25 bar)'
        },
        {
            name: 'LT Suction',
            from: 'LT Evaporators',
            to: 'LT Compressor → MT Suction',
            pipeType: 'suction',
            description: 'Cascade to MT'
        }
    ],
    standard: 'EN 378 / ASHRAE 15'
};

// ============================================================
// HYDROCARBON CYCLE (R290 Propane, R600a Isobutane)
// EN 378 Safety Requirements
// ============================================================

export const HYDROCARBON_CYCLE: RefrigerationCycleConfig = {
    cycleType: 'dx',
    refrigerantType: 'hc',
    equipment: {
        hasLowPressureReceiver: false,
        hasHighPressureReceiver: true,  // Minimized charge
        hasSeparator: false,
        hasOilSeparator: false,
        hasOilPot: false,
        hasRefrigerantPumps: false,
        hasIntercooler: false,
        hasGasCooler: false,
        hasFlashTank: false,
        hasSuctionAccumulator: true,
        hasFilterDrier: true,
        hasEconomizer: false
    },
    piping: {
        suctionSlope: 0.0083,
        pTrapDepth: 0.15,
        needsDoubleRiser: false,
        needsOilLiftRisers: true,
        maxHorizontalRun: 4.0,
        needsExpansionLoops: false      // Compact systems
    },
    stages: [
        {
            name: 'Discharge',
            from: 'Compressor',
            to: 'Condenser',
            pipeType: 'discharge',
            description: 'High pressure (minimize length)'
        },
        {
            name: 'Liquid',
            from: 'Condenser',
            to: 'Receiver → TXV → Evaporator',
            pipeType: 'liquid',
            description: 'Minimal charge design'
        },
        {
            name: 'Suction',
            from: 'Evaporator',
            to: 'Accumulator → Compressor',
            pipeType: 'suction',
            description: 'Protected suction'
        }
    ],
    standard: 'EN 378-1:2016'
};

// ============================================================
// FACTORY FUNCTION
// ============================================================

export function getCycleConfiguration(refrigerant: string): RefrigerationCycleConfig {
    switch (refrigerant) {
        case 'R717':
            return FLOODED_AMMONIA_CYCLE;
        case 'R744':
            return TRANSCRITICAL_CO2_CYCLE;
        case 'R290':
        case 'R600a':
            return HYDROCARBON_CYCLE;
        case 'R404A':
        case 'R134a':
        case 'R507':
        case 'R410A':
        case 'R1234yf':
        case 'R1234ze':
        default:
            return DX_HFC_CYCLE;
    }
}

/**
 * Get equipment requirements for a refrigerant
 */
export function getEquipmentRequirements(refrigerant: string): CycleEquipment {
    return getCycleConfiguration(refrigerant).equipment;
}

/**
 * Get piping requirements for a refrigerant
 */
export function getPipingRequirements(refrigerant: string): PipingRequirements {
    return getCycleConfiguration(refrigerant).piping;
}

/**
 * Check if refrigerant needs separator vessel
 */
export function needsSeparator(refrigerant: string): boolean {
    return getCycleConfiguration(refrigerant).equipment.hasSeparator;
}

/**
 * Check if refrigerant uses gas cooler instead of condenser
 */
export function usesGasCooler(refrigerant: string): boolean {
    return getCycleConfiguration(refrigerant).equipment.hasGasCooler;
}

/**
 * Check if refrigerant needs refrigerant pumps
 */
export function needsRefrigerantPumps(refrigerant: string): boolean {
    return getCycleConfiguration(refrigerant).equipment.hasRefrigerantPumps;
}
