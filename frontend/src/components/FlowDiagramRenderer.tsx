/*
 * FlowDiagramRenderer.tsx
 * Industry standard HVACR flow diagram renderer with DIN standard components
 * Updated: 2025-04-27 16:40:00
 * Path: C:\Users\Erfan\cool-assist-clean\frontend\src\components\FlowDiagramRenderer.tsx
 */

import React, { useMemo, useCallback, useState } from 'react';
import ReactFlow, {
    Controls,
    Background,
    applyNodeChanges,
    applyEdgeChanges,
    Node,
    Edge,
    NodeChange,
    EdgeChange,
    Connection,
    addEdge,
    BackgroundVariant,
    MiniMap,
    NodeTypes,
    Position,
    MarkerType,
    Panel
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Box, Paper, Typography, useTheme, Tooltip, IconButton, Divider } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import DownloadIcon from '@mui/icons-material/Download';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import RefreshIcon from '@mui/icons-material/Refresh';

// Import industry standard nodes
import { industryNodeTypes, IndustrialNodeData } from './diagram/IndustryNodes';
import { getRefrigerantColor, getTemperatureColor } from './diagram/IndustrialSymbols';

// DIN standard pipe sizes (mm)
const getPipeSizeFromDiameter = (diameterStr: string | undefined): string => {
  if (!diameterStr) return 'DN15'; // Default
  
  // Extract number from string (e.g., "54.8mm" to 54.8)
  const diameter = parseFloat(diameterStr.replace(/[^0-9.]/g, ''));
  
  // Map to closest DIN standard size
  if (diameter <= 15) return 'DN15'; // 1/2"
  if (diameter <= 20) return 'DN20'; // 3/4"
  if (diameter <= 25) return 'DN25'; // 1"
  if (diameter <= 32) return 'DN32'; // 1-1/4"
  if (diameter <= 40) return 'DN40'; // 1-1/2"
  if (diameter <= 50) return 'DN50'; // 2"
  if (diameter <= 65) return 'DN65'; // 2-1/2"
  if (diameter <= 80) return 'DN80'; // 3"
  return 'DN100'; // 4"
};

// Calculate stroke width based on DIN size
const getStrokeWidthFromDinSize = (dinSize: string): number => {
  // Map DIN sizes to visual stroke width
  const sizeMap: Record<string, number> = {
    'DN15': 2, 
    'DN20': 2.5,
    'DN25': 3,
    'DN32': 3.5,
    'DN40': 4,
    'DN50': 4.5,
    'DN65': 5,
    'DN80': 5.5,
    'DN100': 6
  };
  
  return sizeMap[dinSize] || 2; // Default to 2 if size not found
};

// Input props
interface FlowDiagramRendererProps {
    layoutData: string | undefined; // Layout data string
}

// Extract refrigerant type from component name or label
const extractRefrigerantType = (text: string): string | undefined => {
  const refrigerants = ['R-22', 'R-410A', 'R-134a', 'R-404A', 'R-407C', 'R-32', 'Ammonia', 'CO2'];
  
  for (const refrigerant of refrigerants) {
    if (text.includes(refrigerant) || 
        text.includes(refrigerant.replace('-', '')) || 
        text.includes(refrigerant.replace('-', ' '))) {
      return refrigerant;
    }
  }
  
  // Special case for ammonia
  if (text.toLowerCase().includes('nh3')) return 'Ammonia';
  
  // Special case for CO2
  if (text.toLowerCase().includes('co2') || text.toLowerCase().includes('r744')) return 'CO2';
  
  return undefined;
};

// Extract capacity information from text
const extractCapacity = (text: string): string | undefined => {
  // Look for patterns like "50 kW", "5 tons", "30 TR", etc.
  const capacityPatterns = [
    /(\d+(?:\.\d+)?\s*(?:kW|kw|KW))/i,
    /(\d+(?:\.\d+)?\s*(?:ton|tons|TR))/i,
    /(\d+(?:\.\d+)?\s*(?:BTU|BTU\/h))/i,
    /(\d+(?:\.\d+)?\s*(?:HP|hp))/i,
    /capacity:?\s*(\d+(?:\.\d+)?\s*(?:kW|ton|TR|BTU|HP|kw|tons|BTU\/h|hp))/i
  ];
  
  for (const pattern of capacityPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return undefined;
};

// Extract manufacturer information
const extractManufacturer = (text: string): string | undefined => {
  const manufacturers = ['Danfoss', 'Carrier', 'York', 'Trane', 'Bitzer', 'Copeland', 'Emerson'];
  
  for (const manufacturer of manufacturers) {
    if (text.toLowerCase().includes(manufacturer.toLowerCase())) {
      return manufacturer;
    }
  }
  // Special case for Danfoss controllers
  if (text.toLowerCase().includes('ekc') || text.toLowerCase().includes('rt')) {
    return 'Danfoss';
  }
  
  return undefined;
};

// Map component type from name to symbol type
const mapComponentTypeToNodeType = (componentName: string): string => {
  const nameLC = componentName.toLowerCase();
  
  // Compressors
  if (nameLC.includes('compressor')) {
    if (nameLC.includes('screw')) return 'screw_compressor';
    if (nameLC.includes('scroll')) return 'scroll_compressor';
    if (nameLC.includes('centrifugal')) return 'centrifugal_compressor';
    return 'reciprocating_compressor';
  }
  
  // Heat exchangers
  if (nameLC.includes('condenser')) {
    if (nameLC.includes('water')) return 'water_cooled_condenser';
    if (nameLC.includes('air')) return 'air_cooled_condenser';
    if (nameLC.includes('evaporative')) return 'evaporative_condenser';
    return 'condenser';
  }
  
  if (nameLC.includes('evaporator')) {
    if (nameLC.includes('dx')) return 'dx_evaporator';
    if (nameLC.includes('flood')) return 'flooded_evaporator';
    return 'evaporator';
  }
  
  // Valves
  if (nameLC.includes('valve')) {
    if (nameLC.includes('ball')) return 'ball_valve';
    if (nameLC.includes('check')) return 'check_valve';
    if (nameLC.includes('solenoid')) return 'solenoid_valve';
    if (nameLC.includes('expansion')) return 'expansion_valve';
    if (nameLC.includes('pressure') || nameLC.includes('regulating')) return 'pressure_regulating_valve';
    return 'valve';
  }
  
  // Controllers
  if (nameLC.includes('controller')) {
    if (nameLC.includes('pressure') || nameLC.includes('rt')) return 'pressure_controller';
    if (nameLC.includes('temperature') || nameLC.includes('ekc')) return 'temperature_controller';
    return 'controller';
  }
  
  if (nameLC.includes('plc')) return 'plc';
  
  // Vessels
  if (nameLC.includes('receiver')) {
    if (nameLC.includes('high')) return 'hp_receiver';
    if (nameLC.includes('low')) return 'lp_receiver';
    return 'receiver';
  }
  
  // Filters and separators
  if (nameLC.includes('filter')) {
    if (nameLC.includes('drier')) return 'filter_drier';
    return 'filter';
  }
  if (nameLC.includes('separator')) return 'oil_separator';
  if (nameLC.includes('drier')) return 'filter_drier';
  
  return 'industrial'; // Default to generic industrial node
};

// Main component
const FlowDiagramRenderer: React.FC<FlowDiagramRendererProps> = ({ layoutData }) => {
    // ReactFlow's nodes and edges states
    const [nodes, setNodes] = useState<Node[]>([]);
    const [edges, setEdges] = useState<Edge[]>([]);
    const [zoom, setZoom] = useState(1);
    
    // Standard settings
    const [activeStandard, setActiveStandard] = useState('ASHRAE');
    
    // Enhanced diagram parser for professional P&ID diagrams
    const parseEnhancedDiagram = (layoutData: string) => {
        const nodes: Node<IndustrialNodeData>[] = [];
        const edges: Edge[] = [];
        
        // Extract components and create a professional layout
        const lines = layoutData.split('\n');
        
        // Try to find global refrigerant type in the data
        const globalRefrigerantType = extractRefrigerantType(layoutData);
        const spacingFactor = 3.0; // Increased spacing for professional layout
        
        // Enhanced parsing that handles professional diagram content
        let currentSection = '';
        let componentIndex = 0;
        const componentPositions = [
            [100, 200], [300, 200], [500, 200], [700, 200], // Main line
            [200, 150], [400, 150], [600, 150], // Upper components
            [250, 280], [450, 280], [650, 280], // Lower components
            [150, 350], [350, 350], [550, 350], [750, 350], // Bottom line
            [100, 100], [300, 100], [500, 100], [700, 100], // Top line
        ];
        
        for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine || trimmedLine.startsWith('//')) continue;
            
            // Track sections for better organization
            if (trimmedLine.includes('MAIN REFRIGERATION CIRCUIT')) {
                currentSection = 'main';
                continue;
            }
            if (trimmedLine.includes('SAFETY AND MONITORING')) {
                currentSection = 'safety';
                continue;
            }
            if (trimmedLine.includes('MULTI-ROOM DISTRIBUTION')) {
                currentSection = 'distribution';
                continue;
            }
            
            // Parse enhanced COMPONENT format
            const componentMatch = trimmedLine.match(/^COMPONENT\s+"([^"]+)"\s+(\d+),(\d+)\s+id="([^"]+)"/i);
            if (componentMatch) {
                const [, name, x, y, id] = componentMatch;
                
                // Determine node type based on name
                let nodeType = mapComponentTypeToNodeType(name);
                
                // Extract enhanced information
                const capacity = extractCapacity(name);
                const refrigerantType = globalRefrigerantType;
                const manufacturer = extractManufacturer(name);
                
                // Use provided coordinates or auto-position
                let posX = parseFloat(x) * spacingFactor;
                let posY = parseFloat(y) * spacingFactor;
                
                // Create enhanced node with professional styling
                nodes.push({
                    id,
                    type: 'industrial',
                    position: { x: posX, y: posY },
                    data: { 
                        label: name,
                        componentType: nodeType,
                        refrigerantType,
                        capacity,
                        manufacturer
                    },
                });
                
                console.log(`Added enhanced component: ${id} [${nodeType}] at ${posX},${posY}`);
                continue;
            }
            
            // Parse enhanced PIPE format with better specifications
            const pipeMatch = trimmedLine.match(/^PIPE\s+sourceId="([^"]+)"\s+targetId="([^"]+)"\s+diameter=(\d+)mm\s+material="([^"]+)"(?:\s+label="([^"]+)")?/i);
            if (pipeMatch) {
                const [, sourceId, targetId, diameter, material, label] = pipeMatch;
                const edgeId = `pipe-${sourceId}-${targetId}`;
                
                // Enhanced pipe specifications
                const dinSize = getPipeSizeFromDiameter(diameter);
                const strokeWidth = getStrokeWidthFromDinSize(dinSize);
                
                // Determine pipe color based on function
                let pipeColor = '#1976d2'; // Default blue
                if (label) {
                    if (label.toLowerCase().includes('hot gas')) pipeColor = '#ff5722'; // Red for hot gas
                    else if (label.toLowerCase().includes('liquid')) pipeColor = '#4caf50'; // Green for liquid
                    else if (label.toLowerCase().includes('suction')) pipeColor = '#2196f3'; // Blue for suction
                    else if (label.toLowerCase().includes('water')) pipeColor = '#00bcd4'; // Cyan for water
                }
                
                // Create professional pipe connection
                edges.push({
                    id: edgeId,
                    source: sourceId,
                    target: targetId,
                    label: `${dinSize} ${material}${label ? ` (${label})` : ''}`,
                    type: 'smoothstep',
                    animated: true,
                    markerEnd: { 
                        type: MarkerType.ArrowClosed,
                        color: pipeColor,
                        width: strokeWidth + 5,
                        height: strokeWidth + 5
                    },
                    style: { 
                        strokeWidth: strokeWidth * 1.5, // Thicker for professional look
                        stroke: pipeColor
                    },
                    data: {
                        dinSize,
                        material,
                        label
                    }
                });
                
                console.log(`Added enhanced pipe: ${edgeId} (${dinSize} ${material})`);
                continue;
            }
            
            // Parse enhanced LABEL format
            const labelMatch = trimmedLine.match(/^LABEL\s+"([^"]+)"\s+(\d+),(\d+)\s+id="([^"]+)"/i);
            if (labelMatch) {
                const [, text, x, y, id] = labelMatch;
                
                const scaledX = parseFloat(x) * spacingFactor;
                const scaledY = parseFloat(y) * spacingFactor;
                
                nodes.push({
                    id,
                    type: 'textLabel',
                    position: { x: scaledX, y: scaledY },
                    data: { label: text },
                    draggable: true,
                    selectable: true,
                });
                
                console.log(`Added enhanced label: ${id} - "${text}"`);
                continue;
            }
        }
        
        // If no components were parsed from the enhanced format, create a demo layout from the content
        if (nodes.length === 0) {
            console.log("Creating demo layout from enhanced content");
            return createDemoLayoutFromEnhancedContent(layoutData);
        }
        
        console.log(`Enhanced parser: Created ${nodes.length} nodes and ${edges.length} edges`);
        return { initialNodes: nodes, initialEdges: edges };
    };
    
    // Create a demo layout when enhanced content doesn't parse directly
    const createDemoLayoutFromEnhancedContent = (content: string) => {
        const nodes: Node<IndustrialNodeData>[] = [];
        const edges: Edge[] = [];
        
        // Extract refrigerant type
        const refrigerant = content.includes('NH3') ? 'NH3' : content.includes('R-404A') ? 'R-404A' : 'R-410A';
        const isWaterCooled = content.toLowerCase().includes('water cooled') || content.toLowerCase().includes('cooling tower');
        const isEvaporative = content.toLowerCase().includes('evaporative');
        const hasMultipleRooms = content.toLowerCase().includes('multi-room') || content.toLowerCase().includes('room 1');
        
        // Create professional demo layout based on detected features
        const demoComponents = [
            { id: 'comp-main', name: `${refrigerant} Compressor`, type: 'screw_compressor', x: 100, y: 200 },
            { id: 'oil-sep', name: 'Oil Separator', type: 'oil_separator', x: 250, y: 150 },
            { id: 'cond-main', name: isWaterCooled ? 'Water Cooled Condenser' : isEvaporative ? 'Evaporative Condenser' : 'Air Cooled Condenser', type: 'condenser', x: 400, y: 200 },
            { id: 'receiver', name: 'Liquid Receiver', type: 'receiver', x: 550, y: 280 },
            { id: 'filter', name: 'Filter Drier', type: 'filter_drier', x: 650, y: 220 },
            { id: 'exp-valve', name: 'Danfoss Expansion Valve', type: 'expansion_valve', x: 750, y: 200 },
            { id: 'evap-main', name: hasMultipleRooms ? 'Distribution Header' : 'Evaporator', type: 'evaporator', x: 900, y: 200 },
            { id: 'accumulator', name: 'Accumulator', type: 'receiver', x: 800, y: 120 }
        ];
        
        // Add water cooling components if detected
        if (isWaterCooled) {
            demoComponents.push(
                { id: 'cooling-tower', name: 'Cooling Tower', type: 'cooling_tower', x: 400, y: 350 },
                { id: 'water-pump', name: 'Water Pump', type: 'pump', x: 300, y: 350 }
            );
        }
        
        // Add multiple room components if detected
        if (hasMultipleRooms) {
            demoComponents.push(
                { id: 'evap-room-1', name: 'Room 1 Evaporator', type: 'evaporator', x: 1050, y: 150 },
                { id: 'evap-room-2', name: 'Room 2 Evaporator', type: 'evaporator', x: 1050, y: 200 },
                { id: 'evap-room-3', name: 'Room 3 Evaporator', type: 'evaporator', x: 1050, y: 250 }
            );
        }
        
        // Create nodes
        demoComponents.forEach(comp => {
            nodes.push({
                id: comp.id,
                type: 'industrial',
                position: { x: comp.x, y: comp.y },
                data: {
                    label: comp.name,
                    componentType: comp.type,
                    refrigerantType: refrigerant
                }
            });
        });
        
        // Create connections
        const connections = [
            { source: 'comp-main', target: 'oil-sep', label: 'Hot Gas', color: '#ff5722' },
            { source: 'oil-sep', target: 'cond-main', label: 'To Condenser', color: '#ff5722' },
            { source: 'cond-main', target: 'receiver', label: 'Condensate', color: '#4caf50' },
            { source: 'receiver', target: 'filter', label: 'Liquid Line', color: '#4caf50' },
            { source: 'filter', target: 'exp-valve', label: 'Filtered Liquid', color: '#4caf50' },
            { source: 'exp-valve', target: 'evap-main', label: '2-Phase', color: '#9c27b0' },
            { source: 'evap-main', target: 'accumulator', label: 'Suction', color: '#2196f3' },
            { source: 'accumulator', target: 'comp-main', label: 'To Compressor', color: '#2196f3' }
        ];
        
        // Add water cooling connections
        if (isWaterCooled) {
            connections.push(
                { source: 'cooling-tower', target: 'water-pump', label: 'Water Return', color: '#00bcd4' },
                { source: 'water-pump', target: 'cond-main', label: 'Cooling Water', color: '#00bcd4' }
            );
        }
        
        // Add multi-room connections
        if (hasMultipleRooms) {
            connections.push(
                { source: 'evap-main', target: 'evap-room-1', label: 'To Room 1', color: '#9c27b0' },
                { source: 'evap-main', target: 'evap-room-2', label: 'To Room 2', color: '#9c27b0' },
                { source: 'evap-main', target: 'evap-room-3', label: 'To Room 3', color: '#9c27b0' }
            );
        }
        
        // Create edges
        connections.forEach((conn, index) => {
            edges.push({
                id: `edge-${index}`,
                source: conn.source,
                target: conn.target,
                label: conn.label,
                type: 'smoothstep',
                animated: true,
                markerEnd: { type: MarkerType.ArrowClosed, color: conn.color },
                style: { strokeWidth: 3, stroke: conn.color }
            });
        });
        
        console.log(`Demo layout: Created ${nodes.length} nodes and ${edges.length} edges`);
        return { initialNodes: nodes, initialEdges: edges };
    };
    
    // Original simple parser for basic diagrams
    const parseStandardDiagram = (layoutData: string) => {
        const nodes: Node<IndustrialNodeData>[] = [];
        const edges: Edge[] = [];
        
        const lines = layoutData.split('\n');
        const globalRefrigerantType = extractRefrigerantType(layoutData);
        const spacingFactor = 2.5;

        for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine) continue;

            const processedLine = trimmedLine.replace(/^\s*-\s*/, '');
            if (!processedLine) continue;

            // Parse COMPONENT "Name" X,Y id="unique_id"
            const componentMatch = processedLine.match(/^COMPONENT\s+"([^"]+)"\s+([\d.-]+),([\d.-]+)\s+id="([^"]+)"(?:\s+(?:type|subType)="([^"]+)")?(?:\s+(?:refrigerant|refrigerantType)="([^"]+)")?/i);
            if (componentMatch) {
                const [, name, x, y, id, subType, compRefrigerant] = componentMatch;
                
                let nodeType = mapComponentTypeToNodeType(subType || name);
                const capacity = extractCapacity(name);
                const refrigerantType = compRefrigerant || globalRefrigerantType;
                const manufacturer = extractManufacturer(name);
                
                const scaledX = parseFloat(x) * spacingFactor;
                const scaledY = parseFloat(y) * spacingFactor;
                
                nodes.push({
                    id,
                    type: name.toLowerCase().includes('label') ? 'textLabel' : 'industrial',
                    position: { x: scaledX, y: scaledY },
                    data: { 
                        label: name,
                        componentType: nodeType,
                        subType: subType,
                        refrigerantType,
                        capacity,
                        manufacturer
                    },
                });
                
                console.log(`Added component: ${id} [${nodeType}] at ${scaledX},${scaledY}`);
                continue;
            }

            // Parse PIPE sourceId="sid" targetId="tid" diameter=Dmm material=M label="Optional"
            const pipeMatch = processedLine.match(/^PIPE\s+sourceId="([^"]+)"\s+targetId="([^"]+)"(?:\s+diameter=([\d.]+)mm)?(?:\s+material=([\w-]+))?(?:\s+label="([^"]+)")?(?:\s+temperature=([\d.-]+))?/i);
            if (pipeMatch) {
                const [, sourceId, targetId, diameter, material, label, tempStr] = pipeMatch;
                const edgeId = `pipe-${sourceId}-${targetId}`;
                const temperature = tempStr ? parseFloat(tempStr) : undefined;
                
                const dinSize = getPipeSizeFromDiameter(diameter);
                const strokeWidth = getStrokeWidthFromDinSize(dinSize);
                
                let edgeLabel = '';
                if (dinSize) edgeLabel += `${dinSize} `;
                if (material) edgeLabel += `${material} `;
                if (label) edgeLabel += `(${label})`;
                
                const pipeColor = getTemperatureColor(temperature);
                
                edges.push({
                    id: edgeId,
                    source: sourceId,
                    target: targetId,
                    label: edgeLabel.trim() || undefined,
                    type: 'smoothstep',
                    animated: true,
                    markerEnd: { 
                        type: MarkerType.ArrowClosed,
                        color: pipeColor,
                        width: strokeWidth + 5,
                        height: strokeWidth + 5
                    },
                    style: { 
                        strokeWidth, 
                        stroke: pipeColor
                    },
                    data: {
                        temperature,
                        dinSize,
                        material
                    }
                });
                
                console.log(`Added pipe: ${edgeId} (${dinSize})`);
                continue;
            }

            // Parse LABEL "Text" X,Y id="unique_id"
            const labelMatch = processedLine.match(/^LABEL\s+"([^"]+)"\s+([\d.-]+),([\d.-]+)\s+id="([^"]+)"/i);
            if (labelMatch) {
                const [, text, x, y, id] = labelMatch;
                
                const scaledX = parseFloat(x) * spacingFactor;
                const scaledY = parseFloat(y) * spacingFactor;
                
                nodes.push({
                    id,
                    type: 'textLabel',
                    position: { x: scaledX, y: scaledY },
                    data: { label: text },
                    draggable: true,
                    selectable: true,
                });
                
                console.log(`Added label: ${id} - "${text}"`);
                continue;
            }

            console.warn(`Failed to parse line: "${processedLine}"`);
        }

        console.log(`Standard parser: Created ${nodes.length} nodes and ${edges.length} edges`);
        return { initialNodes: nodes, initialEdges: edges };
    };
    
    // Parse the layout data to create nodes and edges
    const { initialNodes, initialEdges } = useMemo(() => {
        const nodes: Node<IndustrialNodeData>[] = [];
        const edges: Edge[] = [];
        if (!layoutData) return { initialNodes: nodes, initialEdges: edges };

        console.log("Parsing enhanced layout data...", layoutData.substring(0, 200));
        
        // Check if this is the enhanced professional diagram format
        if (layoutData.includes('PROFESSIONAL P&ID FLOW DIAGRAM') || 
            layoutData.includes('MAIN REFRIGERATION CIRCUIT') ||
            layoutData.includes('Equipment Placement') ||
            layoutData.includes('Safety and Control') ||
            layoutData.includes('Multi-Room Distribution') ||
            layoutData.includes('Ammonia Refrigeration System') ||
            layoutData.includes('Cold Storage Rooms')) {
            
            console.log("Detected enhanced professional diagram format - parsing with enhanced parser");
            return parseEnhancedDiagram(layoutData);
        }
        
        // Fall back to original simple parser for basic diagrams
        console.log("Using standard diagram parser");
        return parseStandardDiagram(layoutData);
    }, [layoutData]);
    
    // Update nodes and edges when initialNodes/edges change
    React.useEffect(() => {
        setNodes(initialNodes);
        setEdges(initialEdges);
    }, [initialNodes, initialEdges]);

    // Event handlers for nodes and edges changes
    const onNodesChange = useCallback(
        (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
        [setNodes]
    );

    const onEdgesChange = useCallback(
        (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
        [setEdges]
    );

    const onConnect = useCallback(
        (connection: Connection) => setEdges((eds) => addEdge({
            ...connection,
            type: 'smoothstep',
            animated: true,
            markerEnd: { type: MarkerType.ArrowClosed },
            style: { strokeWidth: 2 }
        }, eds)),
        [setEdges]
    );

    // Zoom controls
    const handleZoomIn = useCallback(() => {
        setZoom((s) => Math.min(s + 0.2, 4));
    }, []);

    const handleZoomOut = useCallback(() => {
        setZoom((s) => Math.max(s - 0.2, 0.1));
    }, []);

    // Reset view
    const handleResetView = useCallback(() => {
        setZoom(1);
    }, []);

    // Switch standard
    const handleSwitchStandard = useCallback(() => {
        setActiveStandard(prev => prev === 'ASHRAE' ? 'DIN' : 'ASHRAE');
    }, []);

    const theme = useTheme();
    
    // If no data is available
    if (!layoutData) {
        return (
          <Box 
            sx={{ 
              p: 2, 
              textAlign: 'center', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              bgcolor: 'background.paper'
            }}
          >
            <ErrorOutlineIcon sx={{ fontSize: 50, color: 'grey.400', mb: 2 }} />
            <Typography variant="h6" sx={{ color: 'text.secondary', fontWeight: 500 }}>
              No diagram data available
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
              Please generate a new diagram or select an existing one
            </Typography>
          </Box>
        );
    }
    
    // If parsing failed
    if (initialNodes.length === 0 && initialEdges.length === 0) {
        return (
            <Box p={3}>
                <Paper elevation={3} sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    mb: 2, 
                    p: 2, 
                    bgcolor: 'warning.light', 
                    color: 'warning.contrastText',
                    borderRadius: 2
                }}>
                    <ErrorOutlineIcon sx={{ mr: 1 }} />
                    <Typography sx={{ fontWeight: 500 }}>
                        Could not parse layout data or layout is empty
                    </Typography>
                </Paper>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>Raw Layout Data:</Typography>
                <Paper elevation={2} sx={{ 
                    p: 2, 
                    bgcolor: 'background.paper', 
                    borderRadius: 2,
                    maxHeight: '300px',
                    overflow: 'auto'
                }}>
                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{layoutData}</pre>
                </Paper>
            </Box>
        );
    }

    return (
        <Box sx={{ 
            height: '600px', 
            width: '100%', 
            border: '1px solid', 
            borderColor: 'divider', 
            borderRadius: 2, 
            position: 'relative',
            bgcolor: 'background.paper'
        }}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                nodeTypes={industryNodeTypes}
                fitView
                attributionPosition="bottom-left"
                minZoom={0.1}
                maxZoom={4}
                nodesDraggable={true}
                defaultEdgeOptions={{
                    type: 'smoothstep',
                    animated: true,
                    style: { strokeWidth: 2 },
                    markerEnd: { type: MarkerType.ArrowClosed }
                }}
                style={{ background: theme.palette.background.paper }}
            >
                <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
                <Controls position="bottom-left" />
                <MiniMap 
                    nodeStrokeWidth={3} 
                    zoomable 
                    pannable 
                    position="bottom-right"
                    style={{ backgroundColor: '#f5f5f5' }}
                    nodeColor={(node) => {
                        const data = node.data as IndustrialNodeData;
                        if (data.refrigerantType) return getRefrigerantColor(data.refrigerantType);
                        return '#e0e0e0';
                    }}
                />
                
                {/* Top control panel */}
                <Panel position="top-right">
                    <Box sx={{ 
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1,
                        alignItems: 'flex-end'
                    }}>
                        <Paper 
                            elevation={2} 
                            sx={{ 
                                p: 1, 
                                borderRadius: 2, 
                                display: 'flex',
                                alignItems: 'center'
                            }}
                        >
                            <Typography variant="caption" sx={{ mr: 1, fontWeight: 'bold' }}>
                                Standard: {activeStandard}
                            </Typography>
                            <Tooltip title="Switch Standard">
                                <IconButton 
                                    size="small" 
                                    onClick={handleSwitchStandard}
                                >
                                    <RefreshIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                            <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
                            <Tooltip title="Zoom In">
                                <IconButton 
                                    size="small" 
                                    onClick={handleZoomIn}
                                >
                                    <ZoomInIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Zoom Out">
                                <IconButton 
                                    size="small" 
                                    onClick={handleZoomOut}
                                >
                                    <ZoomOutIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Reset View">
                                <IconButton 
                                    size="small" 
                                    onClick={handleResetView}
                                >
                                    <RefreshIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        </Paper>
                    </Box>
                </Panel>
                
                {/* Legend for temperature-based pipe colors */}
                <Panel position="bottom-center">
                    <Paper 
                        elevation={2} 
                        sx={{
                            p: 1,
                            borderRadius: 2,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                        }}
                    >
                        <Typography variant="caption" sx={{ fontWeight: 'bold', mr: 1 }}>Temperature:</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box sx={{ width: 15, height: 3, bgcolor: '#0057b8', mr: 0.3 }}/>
                            <Typography variant="caption">{"<-20°C"}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
                            <Box sx={{ width: 15, height: 3, bgcolor: '#00a2ed', mr: 0.3 }}/>
                            <Typography variant="caption">{"<0°C"}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
                            <Box sx={{ width: 15, height: 3, bgcolor: '#71bf44', mr: 0.3 }}/>
                            <Typography variant="caption">{"<20°C"}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
                            <Box sx={{ width: 15, height: 3, bgcolor: '#fff200', mr: 0.3 }}/>
                            <Typography variant="caption">{"<40°C"}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
                            <Box sx={{ width: 15, height: 3, bgcolor: '#f7941d', mr: 0.3 }}/>
                            <Typography variant="caption">{"<80°C"}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
                            <Box sx={{ width: 15, height: 3, bgcolor: '#ed1c24', mr: 0.3 }}/>
                            <Typography variant="caption">{">80°C"}</Typography>
                        </Box>
                    </Paper>
                </Panel>
            </ReactFlow>
        </Box>
    );
};

export default FlowDiagramRenderer;  