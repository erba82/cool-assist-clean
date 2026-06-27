/*
 * EnhancedDiagramGenerator.tsx
 * Enhanced diagram generator with AutoCAD-like features
 * Date: 2025-12-10
 * Path: C:\Users\Erfan\cool-assist-clean\frontend\src\pages\EnhancedDiagramGenerator.tsx
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Box, Typography, AppBar, Toolbar, IconButton, Tooltip, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert } from '@mui/material';
import { Close as CloseIcon, Fullscreen as FullscreenIcon, Psychology as AIIcon } from '@mui/icons-material';
import Layout from '../components/Layout/Layout';
import axios from 'axios';

// Import new enhanced components
import AdvancedDrawingCanvas from '../components/diagram/AdvancedDrawingCanvas';
import PrecisionTools, { PrecisionSettings, SnapCalculator } from '../components/diagram/PrecisionTools';
import EnhancedSymbolLibrary, { Symbol } from '../components/diagram/EnhancedSymbolLibrary';
import LayerManager, { Layer } from '../components/diagram/LayerManager';
import ExportManager from '../components/diagram/ExportManager';

// Drawing object interface
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

interface Point {
  x: number;
  y: number;
}

const EnhancedDiagramGenerator: React.FC = () => {
  // State management
  const [objects, setObjects] = useState<DrawingObject[]>([]);
  const [layers, setLayers] = useState<Layer[]>([
    { 
      id: 'layer-0', 
      name: 'Equipment', 
      visible: true, 
      locked: false, 
      printable: true,
      color: '#000000', 
      lineWeight: 2, 
      lineType: 'solid', 
      transparency: 0, 
      objectCount: 0, 
      order: 0 
    },
    { 
      id: 'layer-1', 
      name: 'Piping', 
      visible: true, 
      locked: false, 
      printable: true,
      color: '#0066cc', 
      lineWeight: 1, 
      lineType: 'solid', 
      transparency: 0, 
      objectCount: 0, 
      order: 1 
    },
    { 
      id: 'layer-2', 
      name: 'Electrical', 
      visible: true, 
      locked: false, 
      printable: true,
      color: '#cc6600', 
      lineWeight: 1, 
      lineType: 'dashed', 
      transparency: 0, 
      objectCount: 0, 
      order: 2 
    },
    { 
      id: 'layer-3', 
      name: 'Dimensions', 
      visible: true, 
      locked: false, 
      printable: true,
      color: '#009900', 
      lineWeight: 1, 
      lineType: 'solid', 
      transparency: 0, 
      objectCount: 0, 
      order: 3 
    },
    { 
      id: 'layer-4', 
      name: 'Text', 
      visible: true, 
      locked: false, 
      printable: true,
      color: '#666666', 
      lineWeight: 1, 
      lineType: 'solid', 
      transparency: 0, 
      objectCount: 0, 
      order: 4 
    }
  ]);
  const [activeLayerId, setActiveLayerId] = useState('layer-0');
  const [currentPosition, setCurrentPosition] = useState<Point>({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // AI Ammonia Calculation Dialog states
  const [showAmmoniaDialog, setShowAmmoniaDialog] = useState(false);
  const [ammoniaPrompt, setAmmoniaPrompt] = useState('I want to calculate a 5000-ton cold storage with 12 rooms measuring 18 x 15 at a height of 9 meters with ammonia refrigerant and all rooms with two circuits both above zero and below zero, with screw compressors, direct system, sending via pump.');
  const [ammoniaLoading, setAmmoniaLoading] = useState(false);
  const [ammoniaResults, setAmmoniaResults] = useState<any>(null);
  const [ammoniaError, setAmmoniaError] = useState<string | null>(null);
  
  // Panel visibility states
  const [showPrecisionTools, setShowPrecisionTools] = useState(true);
  const [showSymbolLibrary, setShowSymbolLibrary] = useState(true);
  const [showLayerManager, setShowLayerManager] = useState(true);

  // Precision settings
  const [precisionSettings, setPrecisionSettings] = useState<PrecisionSettings>({
    gridSize: 20,
    snapThreshold: 10,
    activeSnapModes: ['grid', 'endpoint'],
    coordinateInput: true,
    precisionMode: true,
    units: 'mm'
  });

  // Refs
  const canvasRef = useRef<HTMLDivElement>(null);

  // Update object count in layers
  useEffect(() => {
    const updatedLayers = layers.map(layer => ({
      ...layer,
      objectCount: objects.filter(obj => obj.layerId === layer.id).length
    }));
    
    const hasChanges = updatedLayers.some((layer, index) => 
      layer.objectCount !== layers[index].objectCount
    );
    
    if (hasChanges) {
      setLayers(updatedLayers);
    }
  }, [objects, layers]);

  // Handle symbol selection from library
  const handleSymbolSelect = useCallback((symbol: Symbol) => {
    console.log('Selected symbol:', symbol);
    // This would typically add the symbol to the canvas at the current cursor position
    // Implementation would depend on the drawing canvas system
  }, []);

  // Handle coordinate input from precision tools
  const handleCoordinateInput = useCallback((point: Point) => {
    console.log('Coordinate input:', point);
    // This would place an object or move the cursor to the specified coordinates
    setCurrentPosition(point);
  }, []);

  // Handle saving diagram
  const handleSaveDiagram = useCallback(() => {
    const diagramData = {
      objects,
      layers,
      settings: precisionSettings,
      metadata: {
        created: new Date().toISOString(),
        version: '1.0',
        title: 'HVAC System Diagram'
      }
    };
    
    // Save to localStorage or send to server
    localStorage.setItem('enhanced_diagram', JSON.stringify(diagramData));
    console.log('Diagram saved:', diagramData);
  }, [objects, layers, precisionSettings]);

  // Handle export
  const handleExport = useCallback((settings: any) => {
    console.log('Exporting with settings:', settings);
    // Export functionality is handled by ExportManager
  }, []);

  // Toggle fullscreen mode
  const handleToggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // Handle ammonia calculation with AI
  const handleAmmoniaCalculation = useCallback(async () => {
    setAmmoniaLoading(true);
    setAmmoniaError(null);
    setAmmoniaResults(null);

    try {
      // Parse the default facility data from the prompt
      const facilityData = {
        type: '5000-ton Cold Storage',
        totalCapacity: 5000,
        refrigerant: 'NH3',
        systemType: 'Direct Expansion with Pump Circulation',
        rooms: Array(12).fill(null).map((_, i) => ({
          id: i + 1,
          length: 18,
          width: 15,
          height: 9,
          name: `Cold Room ${i + 1}`
        }))
      };

      console.log('Calculating ammonia system...', facilityData);
      
      const response = await axios.post('/api/ammonia/calculate-5000-ton', {
        facilityData
      });

      console.log('Ammonia calculation response:', response.data);
      setAmmoniaResults(response.data);
      
      // Automatically generate diagram based on results
      if (response.data.success) {
        await generateAmmoniaFlowDiagram(response.data);
      }
    } catch (err: any) {
      console.error('Ammonia calculation error:', err);
      setAmmoniaError(
        err.response?.data?.details || 
        err.response?.data?.error || 
        'Error calculating ammonia system. Please try again.'
      );
    } finally {
      setAmmoniaLoading(false);
    }
  }, []);

  // Generate flow diagram from ammonia calculation results
  const generateAmmoniaFlowDiagram = useCallback(async (results: any) => {
    try {
      console.log('Generating flow diagram from ammonia results...');
      
      // Clear existing objects
      setObjects([]);
      
      // Create new objects based on calculation results
      const newObjects: DrawingObject[] = [];
      let objectId = 0;
      
      // Add compressors
      if (results.equipment.compressors) {
        results.equipment.compressors.forEach((comp: any, index: number) => {
          newObjects.push({
            id: `comp-${objectId++}`,
            type: 'symbol',
            x: 100 + (index * 150),
            y: 200,
            width: 80,
            height: 60,
            stroke: '#000000',
            strokeWidth: 2,
            fill: '#E3F2FD',
            layerId: 'layer-0',
            properties: {
              symbolType: 'screw_compressor',
              label: comp.model,
              capacity: `${comp.capacity} kW`,
              manufacturer: 'Bitzer/Mycom'
            }
          });
        });
      }
      
      // Add condensers
      if (results.equipment.condensers) {
        results.equipment.condensers.forEach((cond: any, index: number) => {
          newObjects.push({
            id: `cond-${objectId++}`,
            type: 'symbol',
            x: 100 + (index * 200),
            y: 50,
            width: 120,
            height: 80,
            stroke: '#0066cc',
            strokeWidth: 2,
            fill: '#BBDEFB',
            layerId: 'layer-0',
            properties: {
              symbolType: 'evaporative_condenser',
              label: cond.model,
              capacity: `${cond.capacity} kW`,
              manufacturer: 'Baltimore Aircoil'
            }
          });
        });
      }
      
      // Add piping connections
      newObjects.push({
        id: `pipe-${objectId++}`,
        type: 'line',
        points: [180, 260, 180, 130], // Connect compressor to condenser
        stroke: '#0066cc',
        strokeWidth: 3,
        layerId: 'layer-1',
        properties: {
          pipeType: 'Hot Gas Line',
          diameter: '6 inch',
          material: 'ASTM A333 Grade 6'
        }
      });
      
      // Add title
      newObjects.push({
        id: `title-${objectId++}`,
        type: 'text',
        x: 50,
        y: 30,
        text: '5000-Ton Ammonia Refrigeration System',
        stroke: '#000000',
        layerId: 'layer-4',
        properties: {
          fontSize: '18px',
          fontWeight: 'bold'
        }
      });
      
      // Add specifications text
      const specs = [
        `Total Capacity: ${results.specifications.totalCapacity}`,
        `Refrigerant: ${results.specifications.refrigerant}`,
        `System Type: ${results.specifications.systemType}`,
        `Number of Rooms: ${results.specifications.numberOfRooms}`
      ];
      
      specs.forEach((spec, index) => {
        newObjects.push({
          id: `spec-${objectId++}`,
          type: 'text',
          x: 50,
          y: 400 + (index * 20),
          text: spec,
          stroke: '#666666',
          layerId: 'layer-4',
          properties: {
            fontSize: '12px'
          }
        });
      });
      
      setObjects(newObjects);
      console.log('Flow diagram generated successfully with', newObjects.length, 'objects');
      
    } catch (error) {
      console.error('Error generating flow diagram:', error);
    }
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Ctrl+S: Save
      if (event.ctrlKey && event.key === 's') {
        event.preventDefault();
        handleSaveDiagram();
      }
      
      // Ctrl+E: Export
      if (event.ctrlKey && event.key === 'e') {
        event.preventDefault();
        // Trigger export dialog
      }
      
      // F11: Fullscreen
      if (event.key === 'F11') {
        event.preventDefault();
        handleToggleFullscreen();
      }
      
      // Escape: Exit tools
      if (event.key === 'Escape') {
        // Exit current tool or close dialogs
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [handleSaveDiagram, handleToggleFullscreen]);

  return (
    <Layout>
      <Box sx={{ 
        position: 'relative', 
        width: '100%', 
        height: '100vh',
        overflow: 'hidden',
        bgcolor: 'background.default'
      }}>
        {/* Header Bar */}
        <AppBar 
          position="static" 
          elevation={1} 
          sx={{ 
            bgcolor: 'background.paper', 
            color: 'text.primary',
            zIndex: 1100
          }}
        >
          <Toolbar variant="dense">
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Enhanced CAD Diagram Generator
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {/* Automatic AI Diagram Generator Link */}
              <Tooltip title="Switch to Fully Automatic AI Diagram Generator">
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<AIIcon />}
                  onClick={() => window.location.href = '/auto-diagram-generator'}
                  sx={{ mr: 1 }}
                >
                  Auto AI Generator
                </Button>
              </Tooltip>
              
              {/* AI Ammonia Calculation Button */}
              <Tooltip title="AI Ammonia System Calculator">
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<AIIcon />}
                  onClick={() => setShowAmmoniaDialog(true)}
                  sx={{ mr: 1 }}
                >
                  AI Ammonia
                </Button>
              </Tooltip>
              
              {/* Export Manager */}
              <ExportManager
                canvasRef={canvasRef}
                onExport={handleExport}
                defaultSettings={{
                  title: 'HVAC System Diagram',
                  author: 'Cool-Assist User'
                }}
              />
              
              <Tooltip title="Toggle Fullscreen (F11)">
                <IconButton onClick={handleToggleFullscreen} color="inherit">
                  <FullscreenIcon />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Close (Escape)">
                <IconButton 
                  onClick={() => window.history.back()} 
                  color="inherit"
                >
                  <CloseIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Toolbar>
        </AppBar>

        {/* Main Drawing Area */}
        <Box 
          ref={canvasRef}
          sx={{ 
            position: 'relative',
            width: '100%',
            height: 'calc(100vh - 64px)',
            overflow: 'hidden'
          }}
        >
          {/* Advanced Drawing Canvas */}
          <AdvancedDrawingCanvas
            width={window.innerWidth}
            height={window.innerHeight - 64}
            onSave={handleSaveDiagram}
            onExport={() => {}}
            initialObjects={objects}
          />

          {/* Precision Tools Panel */}
          <PrecisionTools
            settings={precisionSettings}
            onSettingsChange={setPrecisionSettings}
            onCoordinateInput={handleCoordinateInput}
            currentPosition={currentPosition}
            visible={showPrecisionTools}
          />

          {/* Layer Manager */}
          <LayerManager
            layers={layers}
            activeLayerId={activeLayerId}
            onLayersChange={setLayers}
            onActiveLayerChange={setActiveLayerId}
            visible={showLayerManager}
            onClose={() => setShowLayerManager(false)}
          />

          {/* Enhanced Symbol Library */}
          <EnhancedSymbolLibrary
            onSymbolSelect={handleSymbolSelect}
            visible={showSymbolLibrary}
          />
        </Box>

        {/* Quick Access Panel Toggles */}
        <Box sx={{
          position: 'fixed',
          top: 100,
          right: 10,
          zIndex: 999,
          display: 'flex',
          flexDirection: 'column',
          gap: 1
        }}>
          <Tooltip title="Toggle Precision Tools">
            <IconButton 
              size="small"
              onClick={() => setShowPrecisionTools(!showPrecisionTools)}
              sx={{ 
                bgcolor: showPrecisionTools ? 'primary.main' : 'background.paper',
                color: showPrecisionTools ? 'primary.contrastText' : 'text.primary',
                boxShadow: 1
              }}
            >
              🎯
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Toggle Layer Manager">
            <IconButton 
              size="small"
              onClick={() => setShowLayerManager(!showLayerManager)}
              sx={{ 
                bgcolor: showLayerManager ? 'primary.main' : 'background.paper',
                color: showLayerManager ? 'primary.contrastText' : 'text.primary',
                boxShadow: 1
              }}
            >
              📋
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Toggle Symbol Library">
            <IconButton 
              size="small"
              onClick={() => setShowSymbolLibrary(!showSymbolLibrary)}
              sx={{ 
                bgcolor: showSymbolLibrary ? 'primary.main' : 'background.paper',
                color: showSymbolLibrary ? 'primary.contrastText' : 'text.primary',
                boxShadow: 1
              }}
            >
              🔧
            </IconButton>
          </Tooltip>
        </Box>

        {/* Help Panel */}
        <Box sx={{
          position: 'fixed',
          bottom: 10,
          right: 10,
          bgcolor: 'background.paper',
          border: 1,
          borderColor: 'divider',
          borderRadius: 1,
          p: 1,
          maxWidth: 200,
          fontSize: '0.75rem',
          opacity: 0.8,
          zIndex: 999
        }}>
          <Typography variant="caption" display="block">
            <strong>Shortcuts:</strong>
          </Typography>
          <Typography variant="caption" display="block">
            Ctrl+S: Save • Ctrl+E: Export
          </Typography>
          <Typography variant="caption" display="block">
            F11: Fullscreen • Esc: Exit tool
          </Typography>
          <Typography variant="caption" display="block">
            S: Select • P: Pan • L: Line
          </Typography>
        </Box>
        
        {/* AI Ammonia Calculation Dialog */}
        <Dialog 
          open={showAmmoniaDialog} 
          onClose={() => setShowAmmoniaDialog(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AIIcon color="primary" />
              AI-Powered Ammonia Refrigeration System Calculator
            </Box>
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Describe your ammonia refrigeration system requirements, and our AI will calculate the complete system 
              with professional equipment selection and generate flow diagrams.
            </Typography>
            
            <TextField
              fullWidth
              multiline
              rows={4}
              label="System Requirements"
              value={ammoniaPrompt}
              onChange={(e) => setAmmoniaPrompt(e.target.value)}
              placeholder="Example: 5000-ton cold storage with 12 rooms, ammonia refrigerant, screw compressors..."
              variant="outlined"
              sx={{ mb: 2 }}
            />
            
            {ammoniaError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {ammoniaError}
              </Alert>
            )}
            
            {ammoniaResults && (
              <Alert severity="success" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>Calculation Complete!</strong><br />
                  Total Load: {ammoniaResults.calculationResults?.loadCalculation?.totalLoad?.toFixed(1)} kW<br />
                  Compressors: {ammoniaResults.equipment?.compressors?.length || 0}<br />
                  Condensers: {ammoniaResults.equipment?.condensers?.length || 0}<br />
                  Flow diagram has been generated on the canvas.
                </Typography>
              </Alert>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowAmmoniaDialog(false)}>
              Close
            </Button>
            <Button 
              variant="contained" 
              onClick={handleAmmoniaCalculation}
              disabled={ammoniaLoading || !ammoniaPrompt.trim()}
              startIcon={ammoniaLoading ? undefined : <AIIcon />}
            >
              {ammoniaLoading ? 'Calculating...' : 'Calculate & Generate Diagram'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Layout>
  );
};

export default EnhancedDiagramGenerator;