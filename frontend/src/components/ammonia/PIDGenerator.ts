// src/components/ammonia/PIDGenerator.ts
// The Drawing Logic for P&ID Generation

import { LoadCalculation } from './EngineeringCore';
import { EquipmentSelection } from './EquipmentSelector';

export interface DiagramNode {
    id: string;
    type: string;
    position: { x: number; y: number };
    data: {
        label: string;
        subLabel?: string;
        tag?: string;
        capacity?: number;
    };
}

export interface DiagramEdge {
    id: string;
    source: string;
    target: string;
    type: string;
    animated?: boolean;
    label?: string;
}

export interface PnIDDiagram {
    nodes: DiagramNode[];
    edges: DiagramEdge[];
}

export class PIDGenerator {
    /**
     * Generate P&ID diagram based on equipment selection
     */
    static generateDiagram(
        loadCalculation: LoadCalculation,
        equipmentSelection: EquipmentSelection
    ): PnIDDiagram {
        console.log('🎨 Generating P&ID diagram...');
        
        const nodes: DiagramNode[] = [];
        const edges: DiagramEdge[] = [];
        let nodeId = 0;
        let edgeId = 0;
        
        const getId = () => `n_${nodeId++}`;
        const getEdgeId = () => `e_${edgeId++}`;
        
        // Layout constants
        const EVAP_Y = 50;
        const VESSEL_Y = 350;
        const COMP_Y = 650;
        
        // 1. Evaporators (All rooms in 2 rows)
        loadCalculation.rooms.forEach((room, i) => {
            const row = Math.floor(i / 7);
            const col = i % 7;
            nodes.push({
                id: getId(),
                type: 'vesselNode',
                position: { x: 80 + col * 180, y: EVAP_Y + row * 130 },
                data: { 
                    label: room.name.substring(0, 8), 
                    subLabel: `${room.totalLoad.toFixed(0)}kW`,
                    tag: room.name
                }
            });
        });
        
        // 2. LP Separator (-40°C)
        const lpVesselId = getId();
        nodes.push({
            id: lpVesselId,
            type: 'vesselNode',
            position: { x: 200, y: VESSEL_Y },
            data: { label: 'LP Sep', subLabel: '-40°C', tag: 'V-LP' }
        });
        
        // 3. Intercooler (-10°C)
        const icVesselId = getId();
        nodes.push({
            id: icVesselId,
            type: 'vesselNode',
            position: { x: 900, y: VESSEL_Y },
            data: { label: 'Intercooler', subLabel: '-10°C', tag: 'V-IC' }
        });
        
        // 4. Booster Compressors (Left rack)
        equipmentSelection.boosterCompressors.forEach((comp, i) => {
            const compId = getId();
            nodes.push({
                id: compId,
                type: 'compressorNode',
                position: { x: 300 + i * 150, y: COMP_Y },
                data: { 
                    label: comp.tag,
                    subLabel: `${comp.capacity}kW`,
                    tag: comp.tag
                }
            });
            
            // Connect booster to LP separator
            edges.push({
                id: getEdgeId(),
                source: lpVesselId,
                target: compId,
                type: 'smoothstep',
                animated: true,
                label: 'Suction'
            });
            
            // Connect booster discharge to intercooler
            edges.push({
                id: getEdgeId(),
                source: compId,
                target: icVesselId,
                type: 'smoothstep',
                animated: true,
                label: 'Discharge'
            });
        });
        
        // 5. High Stage Compressors (Right rack)
        equipmentSelection.highStageCompressors.forEach((comp, i) => {
            const compId = getId();
            nodes.push({
                id: compId,
                type: 'compressorNode',
                position: { x: 1000 + i * 150, y: COMP_Y },
                data: { 
                    label: comp.tag,
                    subLabel: `${comp.capacity}kW`,
                    tag: comp.tag
                }
            });
            
            // Connect intercooler to high stage compressor
            edges.push({
                id: getEdgeId(),
                source: icVesselId,
                target: compId,
                type: 'smoothstep',
                animated: true,
                label: 'Suction'
            });
        });
        
        // 6. Condenser (Connect to last high stage compressor)
        const lastCompId = nodes.filter(n => n.type === 'compressorNode').pop()?.id || '';
        if (lastCompId) {
            const condenserId = getId();
            nodes.push({
                id: condenserId,
                type: 'condenserNode',
                position: { x: 1500, y: VESSEL_Y },
                data: { 
                    label: equipmentSelection.condenser.tag,
                    subLabel: `${equipmentSelection.condenser.capacity.toFixed(0)}kW`,
                    tag: equipmentSelection.condenser.tag
                }
            });
            
            // Connect high stage discharge to condenser
            edges.push({
                id: getEdgeId(),
                source: lastCompId,
                target: condenserId,
                type: 'smoothstep',
                animated: true,
                label: 'Discharge'
            });
        }
        
        console.log('✅ P&ID generated:', nodes.length, 'nodes,', edges.length, 'edges');
        
        return { nodes, edges };
    }
}