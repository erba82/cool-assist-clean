/*
 * WiringDiagramRenderer.tsx
 * Electrical wiring diagram renderer with industrial symbols
 * Date: 2025-04-27 19:15:00
 */

import React, { useMemo, useState, useCallback } from 'react';
import ReactFlow, {
  Controls,
  Background,
  MiniMap,
  Node,
  Edge,
  NodeChange,
  EdgeChange,
  Connection,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  BackgroundVariant,
  Panel,
  MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Box, Typography, Button, Tooltip, IconButton, Divider, useTheme } from '@mui/material';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import CenterFocusStrongIcon from '@mui/icons-material/CenterFocusStrong';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

// Import electrical symbol nodes
import { electricalNodeTypes } from './diagram/ElectricalSymbols';

interface WiringDiagramRendererProps {
  layoutData: string;
}

const WiringDiagramRenderer: React.FC<WiringDiagramRendererProps> = ({ layoutData }) => {
  const theme = useTheme();
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  
  // Parse the layout data
  const { initialNodes, initialEdges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    
    try {
      if (!layoutData) return { initialNodes: nodes, initialEdges: edges };
    
      // Try to parse as JSON first
      try {
        const parsedData = JSON.parse(layoutData);
        
        // Handle structured JSON format
        if (parsedData.nodes && Array.isArray(parsedData.nodes)) {
          return {
            initialNodes: parsedData.nodes,
            initialEdges: parsedData.edges || []
          };
        }
      } catch (e) {
        console.log("Not valid JSON, parsing as text format");
      }
      
      // Parse text format
      const lines = layoutData.split('\n');
      
      for (const line of lines) {
        // Skip empty lines
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;
        
        // Component definition: COMPONENT "Label" X,Y id="unique_id" type="component_type"
        const componentMatch = trimmedLine.match(
          /^COMPONENT\s+"([^"]+)"\s+([\d.-]+),([\d.-]+)\s+id="([^"]+)"(?:\s+type="([^"]+)")?(?:\s+voltage="([^"]+)")?(?:\s+current="([^"]+)")?/i
        );
        
        if (componentMatch) {
          const [_, label, x, y, id, type, voltage, current] = componentMatch;
          
          // Determine position with spacing for better layout
          const posX = parseFloat(x) * 100;
          const posY = parseFloat(y) * 100;
          
          nodes.push({
            id,
            type: type || 'default',
            position: { x: posX, y: posY },
            data: { 
              label,
              type: type || 'default',
              voltage,
              current
            }
          });
          
          continue;
        }
        
        // Wire definition: WIRE sourceId="id1" targetId="id2" wireType="type" label="Optional"
        const wireMatch = trimmedLine.match(
          /^WIRE\s+sourceId="([^"]+)"\s+targetId="([^"]+)"(?:\s+wireType="([^"]+)")?(?:\s+label="([^"]+)")?/i
        );
        
        if (wireMatch) {
          const [_, sourceId, targetId, wireType, label] = wireMatch;
          const edgeId = `wire-${sourceId}-${targetId}`;
          
          edges.push({
            id: edgeId,
            source: sourceId,
            target: targetId,
            label,
            type: 'step',
            animated: wireType === 'power' || wireType === 'main',
            style: { 
              stroke: getWireColor(wireType),
              strokeWidth: getWireStrokeWidth(wireType)
            },
            markerEnd: wireType === 'control' ? {
              type: MarkerType.ArrowClosed,
              width: 15,
              height: 15,
              color: getWireColor(wireType)
            } : undefined
          });
          
          continue;
        }
        
        // Label definition: LABEL "Text" X,Y id="unique_id"
        const labelMatch = trimmedLine.match(/^LABEL\s+"([^"]+)"\s+([\d.-]+),([\d.-]+)\s+id="([^"]+)"/i);
        
        if (labelMatch) {
          const [_, text, x, y, id] = labelMatch;
          
          // Position with spacing
          const posX = parseFloat(x) * 100;
          const posY = parseFloat(y) * 100;
          
          nodes.push({
            id,
            type: 'textLabel',
            position: { x: posX, y: posY },
            data: { label: text }
          });
          
          continue;
        }
      }
    } catch (error) {
      console.error("Error parsing diagram data:", error);
    }
    
    return { initialNodes: nodes, initialEdges: edges };
  }, [layoutData]);
  
  // Update nodes and edges when initialNodes/edges change
  React.useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges]);
  
  // Get wire color based on type
  function getWireColor(wireType: string | undefined): string {
    if (!wireType) return theme.palette.mode === 'dark' ? '#cccccc' : '#333333';
    
    const wireTypeLC = wireType.toLowerCase();
    
    if (wireTypeLC === 'power' || wireTypeLC === 'main') return '#e74c3c'; // Red
    if (wireTypeLC === 'control') return '#3498db'; // Blue
    if (wireTypeLC === 'neutral') return '#7f8c8d'; // Grey
    if (wireTypeLC === 'ground') return '#27ae60'; // Green
    if (wireTypeLC === 'signal' || wireTypeLC === 'data') return '#9b59b6'; // Purple
    
    return theme.palette.mode === 'dark' ? '#cccccc' : '#333333';
  }
  
  // Get wire stroke width based on type
  function getWireStrokeWidth(wireType: string | undefined): number {
    if (!wireType) return 2;
    
    const wireTypeLC = wireType.toLowerCase();
    
    if (wireTypeLC === 'power' || wireTypeLC === 'main') return 3;
    if (wireTypeLC === 'control') return 2;
    if (wireTypeLC === 'neutral') return 2;
    if (wireTypeLC === 'ground') return 2;
    if (wireTypeLC === 'signal' || wireTypeLC === 'data') return 1.5;
    
    return 2;
  }
  
  // Event handlers
  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [setNodes]
  );
  
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [setEdges]
  );
  
  const onConnect = useCallback(
    (connection: Connection) =>
      setEdges((eds) =>
        addEdge(
          {
            ...connection,
            type: 'step',
            animated: false,
          },
          eds
        )
      ),
    [setEdges]
  );
  
  // Zoom controls
  const [zoom, setZoom] = useState(1);
  
  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.2, 4));
  };
  
  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.2, 0.1));
  };
  
  const handleResetView = () => {
    setZoom(1);
  };
  
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
          No wiring diagram data available
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
        <ErrorOutlineIcon sx={{ fontSize: 50, color: 'error.light', mb: 2 }} />
        <Typography variant="h6" sx={{ color: 'text.secondary', fontWeight: 500 }}>
          Error parsing wiring diagram data
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1, maxWidth: '600px' }}>
          The diagram data could not be parsed correctly. Please try generating a new diagram or check the data format.
        </Typography>
      </Box>
    );
  }
  
  return (
    <Box 
      sx={{ 
        height: '100%', 
        width: '100%', 
        border: '1px solid', 
        borderColor: 'divider', 
        borderRadius: 1
      }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={electricalNodeTypes}
        fitView
        attributionPosition="bottom-left"
        minZoom={0.1}
        maxZoom={4}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
        <Controls position="bottom-left" showInteractive={false} />
        <MiniMap
          nodeStrokeWidth={3}
          zoomable
          pannable
          maskColor={theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.6)'}
          style={{ backgroundColor: theme.palette.mode === 'dark' ? '#333' : '#f0f0f0' }}
        />
        
        {/* Custom controls */}
        <Panel position="top-right">
          <Box
            sx={{
              display: 'flex',
              gap: 1,
              bgcolor: 'background.paper',
              borderRadius: 1,
              boxShadow: 1,
              p: 0.5
            }}
          >
            <Tooltip title="Zoom In">
              <IconButton size="small" onClick={handleZoomIn}>
                <ZoomInIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Zoom Out">
              <IconButton size="small" onClick={handleZoomOut}>
                <ZoomOutIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Divider orientation="vertical" flexItem />
            <Tooltip title="Reset View">
              <IconButton size="small" onClick={handleResetView}>
                <CenterFocusStrongIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Panel>
        
        {/* Wire legend */}
        <Panel position="bottom-center">
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              bgcolor: 'background.paper',
              borderRadius: 1,
              boxShadow: 1,
              p: 1,
              mb: 1
            }}
          >
            <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
              Wire Types:
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ width: 20, height: 3, bgcolor: '#e74c3c', borderRadius: 1, mr: 1 }} />
              <Typography variant="caption">Power</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box sx={{ width: 20, height: 3, bgcolor: '#3498db', borderRadius: 1, mr: 1 }} />
              <Typography variant="caption">Control</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ width: 20, height: 3, bgcolor: '#27ae60', borderRadius: 1, mr: 1 }} />
              <Typography variant="caption">Ground</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ width: 20, height: 3, bgcolor: '#7f8c8d', borderRadius: 1, mr: 1 }} />
              <Typography variant="caption">Neutral</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ width: 20, height: 3, bgcolor: '#9b59b6', borderRadius: 1, mr: 1 }} />
              <Typography variant="caption">Signal</Typography>
            </Box>
          </Box>
        </Panel>
      </ReactFlow>
    </Box>
  );
};

export default WiringDiagramRenderer;