/*
 * AdvancedDrawingCanvas.tsx
 * Enhanced drawing canvas with precision tools and AutoCAD-like features
 * Date: 2025-12-10
 * Path: C:\Users\Erfan\cool-assist-clean\frontend\src\components\diagram\AdvancedDrawingCanvas.tsx
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { Stage, Layer, Line, Rect, Circle, Text, Group, Image } from 'react-konva';
import Konva from 'konva';
import AutoCADToolbar, { DrawingTool } from './AutoCADToolbar';

// Drawing state interfaces
interface Point {
  x: number;
  y: number;
}

interface DrawingObject {
  id: string;
  type: 'line' | 'rectangle' | 'circle' | 'text' | 'symbol' | 'dimension';
  points?: number[];
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  radius?: number;
  text?: string;
  stroke?: string;
  strokeWidth?: number;
  fill?: string;
  layerId?: string;
  properties?: Record<string, any>;
}

interface CanvasLayer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  color: string;
}

interface CanvasState {
  objects: DrawingObject[];
  layers: CanvasLayer[];
  activeLayerId: string;
  history: DrawingObject[][];
  historyIndex: number;
}

interface AdvancedDrawingCanvasProps {
  width?: number;
  height?: number;
  onSave?: (objects: DrawingObject[]) => void;
  onExport?: () => void;
  initialObjects?: DrawingObject[];
}

const GRID_SIZE = 20;
const SNAP_THRESHOLD = 10;

const AdvancedDrawingCanvas: React.FC<AdvancedDrawingCanvasProps> = ({
  width = 1200,
  height = 800,
  onSave,
  onExport,
  initialObjects = []
}) => {
  // Canvas state
  const [canvasState, setCanvasState] = useState<CanvasState>({
    objects: initialObjects,
    layers: [
      { id: 'layer-0', name: 'Equipment', visible: true, locked: false, color: '#000000' },
      { id: 'layer-1', name: 'Piping', visible: true, locked: false, color: '#0066cc' },
      { id: 'layer-2', name: 'Electrical', visible: true, locked: false, color: '#cc6600' },
      { id: 'layer-3', name: 'Dimensions', visible: true, locked: false, color: '#009900' },
      { id: 'layer-4', name: 'Text', visible: true, locked: false, color: '#666666' }
    ],
    activeLayerId: 'layer-0',
    history: [initialObjects],
    historyIndex: 0
  });

  // Drawing state
  const [activeTool, setActiveTool] = useState<DrawingTool>('select');
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentDrawing, setCurrentDrawing] = useState<DrawingObject | null>(null);
  const [selectedObjects, setSelectedObjects] = useState<string[]>([]);
  
  // Canvas settings
  const [gridVisible, setGridVisible] = useState(true);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  
  // Refs
  const stageRef = useRef<any>(null);
  const layerRef = useRef<any>(null);

  // Snap to grid function
  const snapToGrid = useCallback((point: Point): Point => {
    if (!snapEnabled) return point;
    
    return {
      x: Math.round(point.x / GRID_SIZE) * GRID_SIZE,
      y: Math.round(point.y / GRID_SIZE) * GRID_SIZE
    };
  }, [snapEnabled]);

  // Get relative pointer position
  const getRelativePointerPosition = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return { x: 0, y: 0 };
    
    const pointer = stage.getPointerPosition();
    if (!pointer) return { x: 0, y: 0 };
    
    const transform = stage.getAbsoluteTransform().copy();
    transform.invert();
    
    return transform.point(pointer);
  }, []);

  // Add object to history
  const addToHistory = useCallback((objects: DrawingObject[]) => {
    setCanvasState(prev => {
      const newHistory = prev.history.slice(0, prev.historyIndex + 1);
      newHistory.push(objects);
      
      return {
        ...prev,
        objects,
        history: newHistory,
        historyIndex: newHistory.length - 1
      };
    });
  }, []);

  // Generate unique ID
  const generateId = () => `obj-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Handle mouse down
  const handleMouseDown = useCallback(() => {
    if (activeTool === 'select' || activeTool === 'pan') return;

    const pos = getRelativePointerPosition();
    const snappedPos = snapToGrid(pos);
    
    setIsDrawing(true);
    
    const newObject: DrawingObject = {
      id: generateId(),
      type: activeTool as any,
      layerId: canvasState.activeLayerId,
      stroke: canvasState.layers.find(l => l.id === canvasState.activeLayerId)?.color || '#000000',
      strokeWidth: 2
    };

    switch (activeTool) {
      case 'line':
        newObject.points = [snappedPos.x, snappedPos.y, snappedPos.x, snappedPos.y];
        break;
      case 'rectangle':
        newObject.x = snappedPos.x;
        newObject.y = snappedPos.y;
        newObject.width = 0;
        newObject.height = 0;
        newObject.fill = 'transparent';
        break;
      case 'circle':
        newObject.x = snappedPos.x;
        newObject.y = snappedPos.y;
        newObject.radius = 0;
        newObject.fill = 'transparent';
        break;
      case 'text':
        newObject.x = snappedPos.x;
        newObject.y = snappedPos.y;
        newObject.text = 'New Text';
        setIsDrawing(false);
        break;
    }

    setCurrentDrawing(newObject);
  }, [activeTool, getRelativePointerPosition, snapToGrid, canvasState.activeLayerId, canvasState.layers]);

  // Handle mouse move
  const handleMouseMove = useCallback((e: any) => {
    if (!isDrawing || !currentDrawing) return;

    const pos = getRelativePointerPosition();
    const snappedPos = snapToGrid(pos);
    
    let updatedDrawing = { ...currentDrawing };

    switch (activeTool) {
      case 'line':
        if (updatedDrawing.points && updatedDrawing.points.length >= 2) {
          updatedDrawing.points[2] = snappedPos.x;
          updatedDrawing.points[3] = snappedPos.y;
        }
        break;
      case 'rectangle':
        if (updatedDrawing.x !== undefined && updatedDrawing.y !== undefined) {
          updatedDrawing.width = snappedPos.x - updatedDrawing.x;
          updatedDrawing.height = snappedPos.y - updatedDrawing.y;
        }
        break;
      case 'circle':
        if (updatedDrawing.x !== undefined && updatedDrawing.y !== undefined) {
          const dx = snappedPos.x - updatedDrawing.x;
          const dy = snappedPos.y - updatedDrawing.y;
          updatedDrawing.radius = Math.sqrt(dx * dx + dy * dy);
        }
        break;
    }

    setCurrentDrawing(updatedDrawing);
  }, [isDrawing, currentDrawing, activeTool, getRelativePointerPosition, snapToGrid]);

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    if (!isDrawing || !currentDrawing) return;

    setIsDrawing(false);
    
    // Add the completed object to the canvas
    const newObjects = [...canvasState.objects, currentDrawing];
    addToHistory(newObjects);
    
    setCurrentDrawing(null);
    setActiveTool('select');
  }, [isDrawing, currentDrawing, canvasState.objects, addToHistory]);

  // Tool handlers
  const handleToolChange = (tool: DrawingTool) => {
    setActiveTool(tool);
    setSelectedObjects([]);
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.1));
  const handleFitView = () => {
    setZoom(1);
    setStagePos({ x: 0, y: 0 });
  };

  const handleUndo = () => {
    if (canvasState.historyIndex > 0) {
      setCanvasState(prev => ({
        ...prev,
        objects: prev.history[prev.historyIndex - 1],
        historyIndex: prev.historyIndex - 1
      }));
    }
  };

  const handleRedo = () => {
    if (canvasState.historyIndex < canvasState.history.length - 1) {
      setCanvasState(prev => ({
        ...prev,
        objects: prev.history[prev.historyIndex + 1],
        historyIndex: prev.historyIndex + 1
      }));
    }
  };

  const handleSave = () => {
    onSave?.(canvasState.objects);
  };

  const handleToggleGrid = () => setGridVisible(prev => !prev);
  const handleToggleSnap = () => setSnapEnabled(prev => !prev);

  // Render grid
  const renderGrid = () => {
    if (!gridVisible) return null;

    const lines = [];
    const stage = stageRef.current;
    if (!stage) return null;

    const stageWidth = stage.width();
    const stageHeight = stage.height();

    // Vertical lines
    for (let i = 0; i < stageWidth / zoom; i += GRID_SIZE) {
      lines.push(
        <Line
          key={`v${i}`}
          points={[i, 0, i, stageHeight / zoom]}
          stroke="#e0e0e0"
          strokeWidth={0.5}
        />
      );
    }

    // Horizontal lines
    for (let i = 0; i < stageHeight / zoom; i += GRID_SIZE) {
      lines.push(
        <Line
          key={`h${i}`}
          points={[0, i, stageWidth / zoom, i]}
          stroke="#e0e0e0"
          strokeWidth={0.5}
        />
      );
    }

    return lines;
  };

  // Render objects
  const renderObjects = () => {
    const objectsToRender = currentDrawing 
      ? [...canvasState.objects, currentDrawing]
      : canvasState.objects;

    return objectsToRender.map((obj) => {
      const layer = canvasState.layers.find(l => l.id === obj.layerId);
      if (!layer?.visible) return null;

      const isSelected = selectedObjects.includes(obj.id);
      const strokeColor = isSelected ? '#ff6b6b' : obj.stroke;
      const strokeWidth = isSelected ? (obj.strokeWidth || 2) + 1 : obj.strokeWidth;

      switch (obj.type) {
        case 'line':
          return (
            <Line
              key={obj.id}
              points={obj.points}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              lineCap="round"
              lineJoin="round"
            />
          );
        case 'rectangle':
          return (
            <Rect
              key={obj.id}
              x={obj.x}
              y={obj.y}
              width={obj.width}
              height={obj.height}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              fill={obj.fill}
            />
          );
        case 'circle':
          return (
            <Circle
              key={obj.id}
              x={obj.x}
              y={obj.y}
              radius={obj.radius}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              fill={obj.fill}
            />
          );
        case 'text':
          return (
            <Text
              key={obj.id}
              x={obj.x}
              y={obj.y}
              text={obj.text}
              fontSize={16}
              fill={strokeColor}
            />
          );
        default:
          return null;
      }
    });
  };

  return (
    <Box sx={{ position: 'relative', width: '100%', height: '100vh' }}>
      {/* Toolbar */}
      <AutoCADToolbar
        activeTool={activeTool}
        onToolChange={handleToolChange}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onFitView={handleFitView}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onSave={handleSave}
        onExport={onExport || (() => {})}
        onToggleGrid={handleToggleGrid}
        onToggleSnap={handleToggleSnap}
        gridVisible={gridVisible}
        snapEnabled={snapEnabled}
        canUndo={canvasState.historyIndex > 0}
        canRedo={canvasState.historyIndex < canvasState.history.length - 1}
        zoom={zoom}
        onZoomChange={setZoom}
      />

      {/* Canvas */}
      <Paper 
        elevation={1} 
        sx={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          margin: 0,
          borderRadius: 0,
          overflow: 'hidden'
        }}
      >
        <Stage
          ref={stageRef}
          width={width}
          height={height}
          scaleX={zoom}
          scaleY={zoom}
          x={stagePos.x}
          y={stagePos.y}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          draggable={activeTool === 'pan'}
          onDragEnd={(e: any) => {
            setStagePos({
              x: e.target.x(),
              y: e.target.y()
            });
          }}
        >
          <Layer ref={layerRef}>
            {/* Grid */}
            {renderGrid()}
            
            {/* Drawing objects */}
            {renderObjects()}
          </Layer>
        </Stage>
      </Paper>

      {/* Status bar */}
      <Paper 
        elevation={1} 
        sx={{ 
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: 30,
          display: 'flex',
          alignItems: 'center',
          px: 2,
          backgroundColor: 'background.paper',
          borderRadius: 0
        }}
      >
        <Typography variant="caption" sx={{ mr: 2 }}>
          Tool: {activeTool}
        </Typography>
        <Typography variant="caption" sx={{ mr: 2 }}>
          Zoom: {Math.round(zoom * 100)}%
        </Typography>
        <Typography variant="caption" sx={{ mr: 2 }}>
          Objects: {canvasState.objects.length}
        </Typography>
        <Typography variant="caption" sx={{ mr: 2 }}>
          Grid: {gridVisible ? 'ON' : 'OFF'}
        </Typography>
        <Typography variant="caption">
          Snap: {snapEnabled ? 'ON' : 'OFF'}
        </Typography>
      </Paper>
    </Box>
  );
};

export default AdvancedDrawingCanvas;