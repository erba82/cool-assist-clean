/*
 * AutoCADToolbar.tsx
 * Advanced drawing toolbar with AutoCAD-like tools for enhanced diagram creation
 * Date: 2025-12-10
 * Path: C:\Users\Erfan\cool-assist-clean\frontend\src\components\diagram\AutoCADToolbar.tsx
 */

import React, { useState, useCallback } from 'react';
import {
  Box,
  Paper,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Divider,
  Typography,
  Menu,
  MenuItem,
  ButtonGroup,
  Slider,
  TextField,
  InputAdornment
} from '@mui/material';
import {
  // Selection and Navigation
  PanTool as PanIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  ZoomOutMap as FitViewIcon,
  NearMe as SelectIcon,
  OpenWith as MoveIcon,
  RotateRight as RotateIcon,
  ContentCopy as CopyIcon,
  Delete as DeleteIcon,
  
  // Drawing Tools
  Timeline as LineIcon,
  Rectangle as RectangleIcon,
  Circle as CircleIcon,
  Polyline as PolylineIcon,
  TextFields as TextIcon,
  
  // Precision Tools
  GridOn as GridIcon,
  PinDrop as SnapIcon,
  Straighten as DimensionIcon,
  
  // File Operations
  Save as SaveIcon,
  Undo as UndoIcon,
  Redo as RedoIcon,
  Print as PrintIcon,
  GetApp as ExportIcon,
  
  // Layers and Properties
  Layers as LayersIcon,
  Settings as PropertiesIcon,
  Palette as ColorIcon,
  LineWeight as LineWeightIcon,
  
  // Symbols
  AccountTree as SymbolsIcon,
  Add as AddSymbolIcon
} from '@mui/icons-material';

export type DrawingTool = 
  | 'select' | 'pan' | 'zoom' | 'move' | 'rotate' | 'copy' | 'delete'
  | 'line' | 'rectangle' | 'circle' | 'polyline' | 'text' | 'dimension'
  | 'symbol' | 'pipe';

export interface ToolbarProps {
  activeTool: DrawingTool;
  onToolChange: (tool: DrawingTool) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitView: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
  onExport: () => void;
  onToggleGrid: () => void;
  onToggleSnap: () => void;
  gridVisible: boolean;
  snapEnabled: boolean;
  canUndo: boolean;
  canRedo: boolean;
  zoom: number;
  onZoomChange: (zoom: number) => void;
}

const AutoCADToolbar: React.FC<ToolbarProps> = ({
  activeTool,
  onToolChange,
  onZoomIn,
  onZoomOut,
  onFitView,
  onUndo,
  onRedo,
  onSave,
  onExport,
  onToggleGrid,
  onToggleSnap,
  gridVisible,
  snapEnabled,
  canUndo,
  canRedo,
  zoom,
  onZoomChange
}) => {
  const [exportMenuAnchor, setExportMenuAnchor] = useState<null | HTMLElement>(null);
  const [symbolMenuAnchor, setSymbolMenuAnchor] = useState<null | HTMLElement>(null);
  const [layersMenuAnchor, setLayersMenuAnchor] = useState<null | HTMLElement>(null);

  const handleExportClick = (event: React.MouseEvent<HTMLElement>) => {
    setExportMenuAnchor(event.currentTarget);
  };

  const handleSymbolClick = (event: React.MouseEvent<HTMLElement>) => {
    setSymbolMenuAnchor(event.currentTarget);
  };

  const handleLayersClick = (event: React.MouseEvent<HTMLElement>) => {
    setLayersMenuAnchor(event.currentTarget);
  };

  const handleCloseMenus = () => {
    setExportMenuAnchor(null);
    setSymbolMenuAnchor(null);
    setLayersMenuAnchor(null);
  };

  const formatZoom = (value: number) => `${Math.round(value * 100)}%`;

  return (
    <Paper 
      elevation={3} 
      sx={{ 
        position: 'fixed',
        top: 80,
        left: 20,
        zIndex: 1000,
        p: 1,
        backgroundColor: 'background.paper',
        borderRadius: 2,
        minWidth: 300,
        maxWidth: 400
      }}
    >
      {/* File Operations */}
      <Box sx={{ mb: 1 }}>
        <Typography variant="caption" color="text.secondary" sx={{ px: 1 }}>
          File
        </Typography>
        <ButtonGroup size="small" sx={{ display: 'flex', flexWrap: 'wrap' }}>
          <Tooltip title="Undo (Ctrl+Z)">
            <span>
              <IconButton 
                onClick={onUndo} 
                disabled={!canUndo}
                size="small"
              >
                <UndoIcon />
              </IconButton>
            </span>
          </Tooltip>
          
          <Tooltip title="Redo (Ctrl+Y)">
            <span>
              <IconButton 
                onClick={onRedo} 
                disabled={!canRedo}
                size="small"
              >
                <RedoIcon />
              </IconButton>
            </span>
          </Tooltip>
          
          <Tooltip title="Save (Ctrl+S)">
            <IconButton onClick={onSave} size="small">
              <SaveIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Export">
            <IconButton onClick={handleExportClick} size="small">
              <ExportIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Print">
            <IconButton onClick={() => window.print()} size="small">
              <PrintIcon />
            </IconButton>
          </Tooltip>
        </ButtonGroup>
      </Box>

      <Divider sx={{ my: 1 }} />

      {/* Navigation Tools */}
      <Box sx={{ mb: 1 }}>
        <Typography variant="caption" color="text.secondary" sx={{ px: 1 }}>
          Navigation
        </Typography>
        <ToggleButtonGroup
          value={activeTool}
          exclusive
          onChange={(_, newTool) => newTool && onToolChange(newTool)}
          size="small"
          sx={{ display: 'flex', flexWrap: 'wrap' }}
        >
          <ToggleButton value="select">
            <Tooltip title="Select (S)">
              <SelectIcon />
            </Tooltip>
          </ToggleButton>
          
          <ToggleButton value="pan">
            <Tooltip title="Pan (P)">
              <PanIcon />
            </Tooltip>
          </ToggleButton>
          
          <ToggleButton value="move">
            <Tooltip title="Move (M)">
              <MoveIcon />
            </Tooltip>
          </ToggleButton>
        </ToggleButtonGroup>
        
        <ButtonGroup size="small" sx={{ ml: 1 }}>
          <Tooltip title="Zoom In">
            <IconButton onClick={onZoomIn} size="small">
              <ZoomInIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Zoom Out">
            <IconButton onClick={onZoomOut} size="small">
              <ZoomOutIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Fit to View">
            <IconButton onClick={onFitView} size="small">
              <FitViewIcon />
            </IconButton>
          </Tooltip>
        </ButtonGroup>
      </Box>

      {/* Zoom Control */}
      <Box sx={{ px: 1, mb: 1 }}>
        <Typography variant="caption" color="text.secondary">
          Zoom: {formatZoom(zoom)}
        </Typography>
        <Slider
          size="small"
          value={zoom}
          min={0.1}
          max={3}
          step={0.1}
          onChange={(_, value) => onZoomChange(value as number)}
          sx={{ mx: 1 }}
        />
      </Box>

      <Divider sx={{ my: 1 }} />

      {/* Drawing Tools */}
      <Box sx={{ mb: 1 }}>
        <Typography variant="caption" color="text.secondary" sx={{ px: 1 }}>
          Drawing
        </Typography>
        <ToggleButtonGroup
          value={activeTool}
          exclusive
          onChange={(_, newTool) => newTool && onToolChange(newTool)}
          size="small"
          sx={{ display: 'flex', flexWrap: 'wrap' }}
        >
          <ToggleButton value="line">
            <Tooltip title="Line (L)">
              <LineIcon />
            </Tooltip>
          </ToggleButton>
          
          <ToggleButton value="rectangle">
            <Tooltip title="Rectangle (R)">
              <RectangleIcon />
            </Tooltip>
          </ToggleButton>
          
          <ToggleButton value="circle">
            <Tooltip title="Circle (C)">
              <CircleIcon />
            </Tooltip>
          </ToggleButton>
          
          <ToggleButton value="polyline">
            <Tooltip title="Polyline (PL)">
              <PolylineIcon />
            </Tooltip>
          </ToggleButton>
          
          <ToggleButton value="text">
            <Tooltip title="Text (T)">
              <TextIcon />
            </Tooltip>
          </ToggleButton>
          
          <ToggleButton value="dimension">
            <Tooltip title="Dimension (DIM)">
              <DimensionIcon />
            </Tooltip>
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Divider sx={{ my: 1 }} />

      {/* Modify Tools */}
      <Box sx={{ mb: 1 }}>
        <Typography variant="caption" color="text.secondary" sx={{ px: 1 }}>
          Modify
        </Typography>
        <ButtonGroup size="small">
          <Tooltip title="Rotate">
            <IconButton 
              onClick={() => onToolChange('rotate')}
              color={activeTool === 'rotate' ? 'primary' : 'default'}
              size="small"
            >
              <RotateIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Copy">
            <IconButton 
              onClick={() => onToolChange('copy')}
              color={activeTool === 'copy' ? 'primary' : 'default'}
              size="small"
            >
              <CopyIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Delete">
            <IconButton 
              onClick={() => onToolChange('delete')}
              color={activeTool === 'delete' ? 'primary' : 'default'}
              size="small"
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </ButtonGroup>
      </Box>

      <Divider sx={{ my: 1 }} />

      {/* Precision Tools */}
      <Box sx={{ mb: 1 }}>
        <Typography variant="caption" color="text.secondary" sx={{ px: 1 }}>
          Precision
        </Typography>
        <ButtonGroup size="small">
          <Tooltip title="Toggle Grid">
            <IconButton 
              onClick={onToggleGrid}
              color={gridVisible ? 'primary' : 'default'}
              size="small"
            >
              <GridIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Object Snap">
            <IconButton 
              onClick={onToggleSnap}
              color={snapEnabled ? 'primary' : 'default'}
              size="small"
            >
              <SnapIcon />
            </IconButton>
          </Tooltip>
        </ButtonGroup>
      </Box>

      <Divider sx={{ my: 1 }} />

      {/* Symbols and Layers */}
      <Box sx={{ mb: 1 }}>
        <Typography variant="caption" color="text.secondary" sx={{ px: 1 }}>
          Objects
        </Typography>
        <ButtonGroup size="small">
          <Tooltip title="HVAC Symbols">
            <IconButton onClick={handleSymbolClick} size="small">
              <SymbolsIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Layers">
            <IconButton onClick={handleLayersClick} size="small">
              <LayersIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Properties">
            <IconButton size="small">
              <PropertiesIcon />
            </IconButton>
          </Tooltip>
        </ButtonGroup>
      </Box>

      {/* Export Menu */}
      <Menu
        anchorEl={exportMenuAnchor}
        open={Boolean(exportMenuAnchor)}
        onClose={handleCloseMenus}
      >
        <MenuItem onClick={() => { handleCloseMenus(); onExport(); }}>
          Export as PDF
        </MenuItem>
        <MenuItem onClick={handleCloseMenus}>
          Export as DWG
        </MenuItem>
        <MenuItem onClick={handleCloseMenus}>
          Export as SVG
        </MenuItem>
        <MenuItem onClick={handleCloseMenus}>
          Export as PNG
        </MenuItem>
      </Menu>

      {/* Symbol Library Menu */}
      <Menu
        anchorEl={symbolMenuAnchor}
        open={Boolean(symbolMenuAnchor)}
        onClose={handleCloseMenus}
      >
        <MenuItem onClick={() => { handleCloseMenus(); onToolChange('symbol'); }}>
          Compressors
        </MenuItem>
        <MenuItem onClick={() => { handleCloseMenus(); onToolChange('symbol'); }}>
          Heat Exchangers
        </MenuItem>
        <MenuItem onClick={() => { handleCloseMenus(); onToolChange('symbol'); }}>
          Valves
        </MenuItem>
        <MenuItem onClick={() => { handleCloseMenus(); onToolChange('symbol'); }}>
          Vessels
        </MenuItem>
        <MenuItem onClick={() => { handleCloseMenus(); onToolChange('symbol'); }}>
          Piping Components
        </MenuItem>
        <MenuItem onClick={() => { handleCloseMenus(); onToolChange('symbol'); }}>
          Electrical Components
        </MenuItem>
      </Menu>

      {/* Layers Menu */}
      <Menu
        anchorEl={layersMenuAnchor}
        open={Boolean(layersMenuAnchor)}
        onClose={handleCloseMenus}
      >
        <MenuItem onClick={handleCloseMenus}>
          Equipment Layer
        </MenuItem>
        <MenuItem onClick={handleCloseMenus}>
          Piping Layer
        </MenuItem>
        <MenuItem onClick={handleCloseMenus}>
          Electrical Layer
        </MenuItem>
        <MenuItem onClick={handleCloseMenus}>
          Dimensions Layer
        </MenuItem>
        <MenuItem onClick={handleCloseMenus}>
          Text Layer
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleCloseMenus}>
          Manage Layers...
        </MenuItem>
      </Menu>
    </Paper>
  );
};

export default AutoCADToolbar;