export type RefrigerantType = 'R717' | 'R744' | 'R404A' | 'R134a' | 'R22' | 'R507A';
export type CompressorType = 'Screw' | 'Reciprocating' | 'Scroll' | 'Centrifugal';
export type CondenserType = 'Evaporative' | 'AirCooled' | 'Adiabatic' | 'ShellAndTube';
export type VesselType = 'Receiver' | 'Intercooler' | 'OilSeparator' | 'SuctionAccumulator' | 'FlashTank';

export interface ConnectionPoint {
    x: number; // Offset from center in meters
    y: number;
    z: number;
    size: number; // ND in inches
    type: 'Flange' | 'Thread' | 'Weld';
    orientation: 'Vertical' | 'Horizontal';
}

export interface EquipmentSpec {
    id: string;
    model: string;
    manufacturer: string;
    type: string;
    subType?: string;
    refrigerants: RefrigerantType[];
    capacityRange: [number, number]; // kW min, max
    dimensions: { length: number; width: number; height: number }; // meters
    connections: {
        suction: ConnectionPoint;
        discharge: ConnectionPoint;
        liquid?: ConnectionPoint; // For vessels/condensers
        drain?: ConnectionPoint;
    };
    meta: {
        motorMount: 'direct' | 'belt' | 'internal';
        oilSeparator: 'horizontal' | 'vertical' | 'none' | 'integral';
        cylinders?: number;
        fans?: number;
    };
}

export const INDUSTRIAL_EQUIPMENT_SPECS: Record<string, EquipmentSpec[]> = {
    // ==================================================================================
    // 1. COMPRESSORS
    // ==================================================================================
    compressors: [
        // --- AMMONIA (R717) - SCREW - HEAT PUMP / INDUSTRIAL ---
        {
            id: 'comp-screw-large-r717',
            model: 'Howden XRV-204',
            manufacturer: 'Howden',
            type: 'Screw',
            refrigerants: ['R717'],
            capacityRange: [500, 1500],
            dimensions: { length: 3.2, width: 1.4, height: 1.8 },
            connections: {
                suction: { x: -1.0, y: 1.2, z: 0, size: 8, type: 'Flange', orientation: 'Vertical' },
                discharge: { x: 1.0, y: 0.9, z: 0, size: 6, type: 'Flange', orientation: 'Horizontal' }
            },
            meta: { motorMount: 'direct', oilSeparator: 'horizontal' }
        },
        {
            id: 'comp-screw-med-r717',
            model: 'Mycom 250V',
            manufacturer: 'Mayekawa',
            type: 'Screw',
            refrigerants: ['R717'],
            capacityRange: [200, 600],
            dimensions: { length: 2.6, width: 1.1, height: 1.5 },
            connections: {
                suction: { x: -0.8, y: 1.0, z: 0, size: 6, type: 'Flange', orientation: 'Vertical' },
                discharge: { x: 0.8, y: 0.8, z: 0, size: 4, type: 'Flange', orientation: 'Horizontal' }
            },
            meta: { motorMount: 'direct', oilSeparator: 'horizontal' }
        },

        // --- AMMONIA (R717) - RECIPROCATING ---
        {
            id: 'comp-recip-large-r717',
            model: 'Grasso V-1200',
            manufacturer: 'GEA',
            type: 'Reciprocating',
            refrigerants: ['R717'],
            capacityRange: [150, 400],
            dimensions: { length: 2.1, width: 1.0, height: 1.3 },
            connections: {
                suction: { x: -0.6, y: 0.9, z: 0, size: 4, type: 'Flange', orientation: 'Vertical' },
                discharge: { x: 0.6, y: 0.9, z: 0, size: 3, type: 'Flange', orientation: 'Vertical' }
            },
            meta: { motorMount: 'direct', oilSeparator: 'none', cylinders: 8 }
        },

        // --- CO2 (R744) - TRANSCRITICAL ---
        {
            id: 'comp-co2-trans-4cyl',
            model: 'Bitzer 4MTE',
            manufacturer: 'Bitzer',
            type: 'Reciprocating',
            subType: 'Transcritical',
            refrigerants: ['R744'],
            capacityRange: [20, 80],
            dimensions: { length: 0.9, width: 0.6, height: 0.7 },
            connections: {
                suction: { x: -0.2, y: 0.4, z: 0, size: 2, type: 'Flange', orientation: 'Horizontal' },
                discharge: { x: 0.2, y: 0.4, z: 0, size: 1.5, type: 'Flange', orientation: 'Horizontal' }
            },
            meta: { motorMount: 'internal', oilSeparator: 'integral', cylinders: 4 }
        },

        // --- FREON (R404A/R134a) - SEMI-HERMETIC ---
        {
            id: 'comp-recip-freon-med',
            model: 'Copeland Discuss 6D',
            manufacturer: 'Copeland',
            type: 'Reciprocating',
            refrigerants: ['R404A', 'R134a', 'R22'],
            capacityRange: [30, 100],
            dimensions: { length: 0.8, width: 0.5, height: 0.6 },
            connections: {
                suction: { x: -0.2, y: 0.5, z: 0, size: 2.5, type: 'Flange', orientation: 'Vertical' },
                discharge: { x: 0.2, y: 0.5, z: 0, size: 1.5, type: 'Flange', orientation: 'Vertical' }
            },
            meta: { motorMount: 'internal', oilSeparator: 'none', cylinders: 6 }
        }
    ],

    // ==================================================================================
    // 2. CONDENSERS
    // ==================================================================================
    condensers: [
        // --- EVAPORATIVE (Standard Industrial) ---
        {
            id: 'cond-evap-large',
            model: 'BAC VXC-500',
            manufacturer: 'BAC',
            type: 'Evaporative',
            refrigerants: ['R717', 'R744'],
            capacityRange: [1000, 3000],
            dimensions: { length: 5.5, width: 2.4, height: 4.2 },
            connections: {
                suction: { x: 0, y: 3.8, z: 0.8, size: 6, type: 'Flange', orientation: 'Horizontal' }, // Hot Gas Entry
                discharge: { x: 0, y: 0.4, z: -1.0, size: 4, type: 'Flange', orientation: 'Horizontal' }  // Liquid Out
            },
            meta: { fans: 4 }
        },
        {
            id: 'cond-evap-med',
            model: 'Evapco ATC-200',
            manufacturer: 'Evapco',
            type: 'Evaporative',
            refrigerants: ['R717', 'R404A'],
            capacityRange: [400, 1000],
            dimensions: { length: 3.6, width: 1.8, height: 3.2 },
            connections: {
                suction: { x: 0, y: 2.8, z: 0.6, size: 4, type: 'Flange', orientation: 'Horizontal' },
                discharge: { x: 0, y: 0.4, z: -0.8, size: 3, type: 'Flange', orientation: 'Horizontal' }
            },
            meta: { fans: 2 }
        },

        // --- AIR COOLED (V-Block) ---
        {
            id: 'cond-air-vshape',
            model: 'Guntner V-Shape',
            manufacturer: 'Guntner',
            type: 'AirCooled',
            refrigerants: ['R404A', 'R744', 'R134a'],
            capacityRange: [200, 600],
            dimensions: { length: 4.0, width: 1.2, height: 1.8 },
            connections: {
                suction: { x: -1.8, y: 1.5, z: 0, size: 3, type: 'Thread', orientation: 'Horizontal' },
                discharge: { x: 1.8, y: 0.2, z: 0, size: 2, type: 'Thread', orientation: 'Horizontal' }
            },
            meta: { fans: 4 }
        }
    ],

    // ==================================================================================
    // 3. VESSELS
    // ==================================================================================
    vessels: [
        {
            id: 'rec-vert-industrial',
            model: 'HPR 1000L',
            manufacturer: 'Generic',
            type: 'Receiver',
            refrigerants: ['R717'],
            capacityRange: [300, 2000],
            dimensions: { length: 0.8, width: 0.8, height: 3.0 },
            connections: {
                suction: { x: 0, y: 2.8, z: 0, size: 4, type: 'Flange', orientation: 'Horizontal' }, // Condensate In
                discharge: { x: 0, y: 0.3, z: 0.4, size: 4, type: 'Flange', orientation: 'Horizontal' }  // Liquid Out
            },
            meta: { oilSeparator: 'none' }
        },
        {
            id: 'rec-horiz-co2',
            model: 'Flash Tank 500L',
            manufacturer: 'Generic',
            type: 'FlashTank',
            refrigerants: ['R744'],
            capacityRange: [100, 500],
            dimensions: { length: 2.2, width: 0.6, height: 0.6 },
            connections: {
                suction: { x: -0.8, y: 0.6, z: 0, size: 3, type: 'Weld', orientation: 'Vertical' },
                discharge: { x: 0.8, y: 0.1, z: 0, size: 3, type: 'Weld', orientation: 'Vertical' }
            },
            meta: { oilSeparator: 'none' }
        }
    ]
};

// ==================================================================================
// LOGIC HELPERS
// ==================================================================================

export const getEquipmentSpec = (category: string, capacity: number, refrigerant: string): EquipmentSpec => {
    const list = INDUSTRIAL_EQUIPMENT_SPECS[category] || [];

    // Sort logic to find best capacity match
    // Filters first by refrigerant capability
    const compatible = list.filter(item => item.refrigerants.includes(refrigerant as RefrigerantType));

    if (compatible.length === 0) {
        // Fallback to generic if no specific refrigerant match (shouldn't happen with full DB)
        return list[0];
    }

    // Find closest capacity match (simple logic: find first where max >= cap)
    // For very large systems, it might pick the largest available
    const match = compatible.find(item => capacity <= item.capacityRange[1]);

    return match || compatible[compatible.length - 1]; // Return match or largest available
};
