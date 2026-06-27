// frontend/src/utils/PIDDataParser.ts
/**
 * P&ID Data Parser
 * Extracts 3D visualization data from 2D P&ID diagram data
 * Ensures 1:1 correspondence between 2D and 3D representations
 */

import { IndustrialEquipmentSpecs } from '../data/IndustrialEquipmentSpecs';

// ============================================================
// TYPE DEFINITIONS
// ============================================================

export interface EquipmentNode {
    id: string;
    tag: string;
    type: 'compressor' | 'receiver' | 'separator' | 'pump' | 'evaporator' | 'condenser' | 'valve';
    subType?: 'screw' | 'reciprocating' | 'horizontal' | 'vertical' | '  ball' | 'gate' | 'check' | 'relief';
    position2D: { x: number; y: number };
    capacity: number;
    refrigerant: string;
    stage?: 'Booster' | 'High Stage';
    connections: {
        suction?: string;
        discharge?: string;
        liquid?: string;
    };
    specs?: any;
}

export interface PipeSegment {
    id: string;
    type: 'suction' | 'discharge' | 'liquid' | 'hot_gas';
    from: string; // equipment ID
    to: string;
    diameter: number; // DN in mm
    valves: Array<{ type: string; position: number }>;
    color: string;
}

export interface RoomLayout {
    width: number;
    depth: number;
    height: number;
    minClearance: {
        compressor: { front: number; side: number; top: number };
        vessel: { all: number };
        pump: { front: number };
        aisle: number;
    };
}

export interface EquipmentLayout {
    [equipmentId: string]: {
        position: [number, number, number];
        rotation: number;
        foundation: { width: number; depth: number };
        structure?: { height: number };
    };
}

// ============================================================
// PARSER FUNCTIONS
// ============================================================

/**
 * Parse equipment from P&ID nodes
 */
export function parseEquipmentFromPID(pidData: any): EquipmentNode[] {
    const equipment: EquipmentNode[] = [];

    if (!pidData || !pidData.nodes) {
        console.warn('[PIDParser] No nodes in P&ID data');
        return equipment;
    }

    pidData.nodes.forEach((node: any) => {
        const eq: EquipmentNode = {
            id: node.id || node.data?.tag || `node-${equipment.length}`,
            tag: node.data?.tag || node.id,
            type: mapComponentType(node.data?.componentType || node.type),
            position2D: node.position || { x: 0, y: 0 },
            capacity: node.data?.capacity || 0,
            refrigerant: 'R717', // Default for ammonia systems
            connections: {},
            specs: node.data
        };

        // Determine subType from specs
        if (eq.type === 'compressor') {
            eq.subType = node.data?.type?.toLowerCase().includes('screw') ? 'screw' : 'reciprocating';
            eq.stage = node.data?.stage;
        } else if (eq.type === 'receiver' || eq.type === 'separator') {
            // Determine orientation from P&ID position or type
            eq.subType = 'horizontal'; // Most industrial are horizontal
        } else if (eq.type === 'valve') {
            eq.subType = determineValveType(node.data?.componentType);
        }

        equipment.push(eq);
    });

    return equipment;
}

/**
 * Parse pipe routing from P&ID edges
 */
export function parsePipeRoutingFromPID(pidData: any): PipeSegment[] {
    const pipes: PipeSegment[] = [];

    if (!pidData || !pidData.edges) {
        console.warn('[PIDParser] No edges in P&ID data');
        return pipes;
    }

    pidData.edges.forEach((edge: any) => {
        const pipe: PipeSegment = {
            id: edge.id || `pipe-${pipes.length}`,
            type: mapPipeType(edge.type || edge.label),
            from: edge.source,
            to: edge.target,
            diameter: extractDiameter(edge.label) || 50,
            valves: [],
            color: getPipeColor(edge.type)
        };

        // Extract valve info from edge if present
        if (edge.label && edge.label.includes('Valve')) {
            pipe.valves.push({
                type: edge.label.toLowerCase().includes('ball') ? 'ball' : 'gate',
                position: 0.5 // Mid-point
            });
        }

        pipes.push(pipe);
    });

    return pipes;
}

/**
 * Calculate room dimensions from equipment specs
 * Based on ASHRAE clearance requirements
 */
export function calculateRoomDimensions(equipment: EquipmentNode[]): RoomLayout {
    const ASHRAE_CLEARANCES = {
        compressor: { front: 0.9, side: 0.6, top: 2.1 }, // 3ft, 2ft, 7ft
        vessel: { all: 0.6 }, // 2ft all sides
        pump: { front: 0.9 }, // 3ft
        aisle: 1.2 // 4ft minimum
    };

    // Count equipment by type
    const compressors = equipment.filter(e => e.type === 'compressor');
    const vessels = equipment.filter(e => e.type === 'receiver' || e.type === 'separator');
    const pumps = equipment.filter(e => e.type === 'pump');

    // Estimate room size
    // Layout: Compressors along back wall, vessels in center, pumps in front

    const compWidth = compressors.length * 3.5 + (compressors.length - 1) * ASHRAE_CLEARANCES.compressor.side;
    const vesselWidth = vessels.length * 3.0 + (vessels.length - 1) * ASHRAE_CLEARANCES.vessel.all;
    const width = Math.max(12, Math.max(compWidth, vesselWidth) + 4); // Add margins

    const depth = Math.max(10,
        ASHRAE_CLEARANCES.compressor.front + 3.0 + // Compressor front clearance + depth
        ASHRAE_CLEARANCES.vessel.all * 2 + 2.5 + // Vessel clearances + diameter
        ASHRAE_CLEARANCES.pump.front + 1.0 + // Pump clearance + depth
        ASHRAE_CLEARANCES.aisle * 2 // Aisles
    );

    const height = Math.max(5, ASHRAE_CLEARANCES.compressor.top + 1.8 + 1.0); // Top clearance + equipment + margin

    return {
        width,
        depth,
        height,
        minClearance: ASHRAE_CLEARANCES
    };
}

/**
 * Generate equipment layout positions
 * Auto-position equipment with ASHRAE-compliant spacing
 */
export function generateEquipmentLayout(equipment: EquipmentNode[], roomSize: RoomLayout): EquipmentLayout {
    const layout: EquipmentLayout = {};

    // Group equipment by type
    const compressors = equipment.filter(e => e.type === 'compressor');
    const receivers = equipment.filter(e => e.type === 'receiver');
    const separators = equipment.filter(e => e.type === 'separator');
    const pumps = equipment.filter(e => e.type === 'pump');
    const evaporators = equipment.filter(e => e.type === 'evaporator');
    const condenser = equipment.find(e => e.type === 'condenser');

    // Position compressors along back wall
    compressors.forEach((comp, idx) => {
        const spacing = 3.5;
        const startX = -(compressors.length - 1) * spacing / 2;
        layout[comp.id] = {
            position: [startX + idx * spacing, 0, 3],
            rotation: 0,
            foundation: { width: 3.2, depth: 1.4 }
        };
    });

    // Position horizontal receivers on ground
    receivers.forEach((rec, idx) => {
        const spacing = 4.0;
        const startX = -(receivers.length - 1) * spacing / 2;
        layout[rec.id] = {
            position: [startX + idx * spacing - 3, 0, -2],
            rotation: 0,
            foundation: { width: 3.0, depth: 1.2 }
        };
    });

    // Position separators elevated on steel structure
    separators.forEach((sep, idx) => {
        const structureHeight = 2.0;
        layout[sep.id] = {
            position: [-1, 0, -4.5],
            rotation: 0,
            foundation: { width: 3.5, depth: 1.5 },
            structure: { height: structureHeight }
        };
    });

    // Position pumps near receivers
    pumps.forEach((pump, idx) => {
        layout[pump.id] = {
            position: [4 + idx * 1.2, 0, 3],
            rotation: 0,
            foundation: { width: 0.8, depth: 0.6 }
        };
    });

    // Position evaporators elevated (ceiling mounted)
    evaporators.forEach((evap, idx) => {
        layout[evap.id] = {
            position: [5, 3, -3],
            rotation: 0,
            foundation: { width: 0, depth: 0 } // Ceiling mounted, no foundation
        };
    });

    // Position condenser on rooftop platform
    if (condenser) {
        layout[condenser.id] = {
            position: [roomSize.width / 2 - 2, roomSize.height + 0.5, -roomSize.depth / 2 + 1],
            rotation: 0,
            foundation: { width: 4, depth: 2 }
        };
    }

    return layout;
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function mapComponentType(pidType: string): EquipmentNode['type'] {
    const type = pidType.toLowerCase();
    if (type.includes('comp')) return 'compressor';
    if (type.includes('receiver') || type.includes('hpr')) return 'receiver';
    if (type.includes('separator') || type.includes('mts') || type.includes('lps')) return 'separator';
    if (type.includes('pump')) return 'pump';
    if (type.includes('evap')) return 'evaporator';
    if (type.includes('cond')) return 'condenser';
    if (type.includes('valve')) return 'valve';
    return 'receiver'; // Default fallback
}

function mapPipeType(label: string): PipeSegment['type'] {
    const lower = label.toLowerCase();
    if (lower.includes('suction')) return 'suction';
    if (lower.includes('discharge')) return 'discharge';
    if (lower.includes('liquid')) return 'liquid';
    if (lower.includes('hot gas') || lower.includes('hotgas')) return 'hot_gas';
    return 'liquid'; // Default
}

function extractDiameter(label: string): number | null {
    const match = label.match(/DN(\d+)/i);
    return match ? parseInt(match[1]) : null;
}

function getPipeColor(type: string): string {
    const typeMap: { [key: string]: string } = {
        'discharge': '#C0392B', // Red
        'suction': '#2980B9',    // Blue
        'liquid': '#F39C12',     // Yellow
        'hot_gas': '#27AE60'     // Green
    };
    return typeMap[type] || typeMap['liquid'];
}

function determineValveType(componentType: string): 'ball' | 'gate' | 'check' | 'relief' {
    const type = componentType.toLowerCase();
    if (type.includes('ball')) return 'ball';
    if (type.includes('gate')) return 'gate';
    if (type.includes('check')) return 'check';
    if (type.includes('relief') || type.includes('safety')) return 'relief';
    return 'ball'; // Default
}
