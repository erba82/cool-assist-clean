/*
 * LayerManager.tsx
 * AutoCAD-style layer management system for organizing diagram elements
 * Date: 2025-12-10
 * Path: C:\Users\Erfan\cool-assist-clean\frontend\src\components\diagram\LayerManager.tsx
 */

import React, { useState, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Checkbox,
  Menu,
  MenuItem,
  Divider,
  Chip,
  Tooltip,
  Stack
} from '@mui/material';
import {
  Layers as LayersIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreIcon,
  Palette as ColorIcon,
  Print as PrintIcon,
  ContentCopy as CopyIcon,
  MoveUp as MoveUpIcon,
  MoveDown as MoveDownIcon
} from '@mui/icons-material';

export interface Layer {
  id: string;
  name: string;
  description?: string;
  visible: boolean;
  locked: boolean;
  printable: boolean;
  color: string;
  lineWeight: number;
  lineType: 'solid' | 'dashed' | 'dotted' | 'dashdot';
  transparency: number; // 0-100
  objectCount: number;
  order: number;
}

export interface LayerManagerProps {
  layers: Layer[];
  activeLayerId: string;
  onLayersChange: (layers: Layer[]) => void;
  onActiveLayerChange: (layerId: string) => void;
  visible?: boolean;
  onClose?: () => void;
}

const defaultLayerColors = [
  '#FF0000', // Red
  '#00FF00', // Green  
  '#0000FF', // Blue
  '#FFFF00', // Yellow
  '#FF00FF', // Magenta
  '#00FFFF', // Cyan
  '#FFA500', // Orange
  '#800080', // Purple
  '#008000', // Dark Green
  '#000080', // Navy
];

const lineTypes = [
  { value: 'solid', label: 'Solid', pattern: '████████' },
  { value: 'dashed', label: 'Dashed', pattern: '████  ████' },
  { value: 'dotted', label: 'Dotted', pattern: '██  ██  ██' },
  { value: 'dashdot', label: 'Dash-Dot', pattern: '████  ██  ' }
];

const LayerManager: React.FC<LayerManagerProps> = ({
  layers,
  activeLayerId,
  onLayersChange,
  onActiveLayerChange,
  visible = true,
  onClose
}) => {
  const [newLayerDialog, setNewLayerDialog] = useState(false);
  const [editLayerDialog, setEditLayerDialog] = useState<string | null>(null);
  const [layerMenuAnchor, setLayerMenuAnchor] = useState<{ element: HTMLElement; layerId: string } | null>(null);
  const [newLayerData, setNewLayerData] = useState({
    name: '',
    description: '',
    color: defaultLayerColors[0],
    lineWeight: 1,
    lineType: 'solid' as const,
    transparency: 0
  });

  const sortedLayers = [...layers].sort((a, b) => a.order - b.order);

  const handleToggleVisibility = useCallback((layerId: string) => {
    const updatedLayers = layers.map(layer =>
      layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
    );
    onLayersChange(updatedLayers);
  }, [layers, onLayersChange]);

  const handleToggleLock = useCallback((layerId: string) => {
    const updatedLayers = layers.map(layer =>
      layer.id === layerId ? { ...layer, locked: !layer.locked } : layer
    );
    onLayersChange(updatedLayers);
  }, [layers, onLayersChange]);

  const handleTogglePrintable = useCallback((layerId: string) => {
    const updatedLayers = layers.map(layer =>
      layer.id === layerId ? { ...layer, printable: !layer.printable } : layer
    );
    onLayersChange(updatedLayers);
  }, [layers, onLayersChange]);

  const handleCreateLayer = useCallback(() => {
    const newLayer: Layer = {
      id: `layer-${Date.now()}`,
      name: newLayerData.name || `Layer ${layers.length + 1}`,
      description: newLayerData.description,
      visible: true,
      locked: false,
      printable: true,
      color: newLayerData.color,
      lineWeight: newLayerData.lineWeight,
      lineType: newLayerData.lineType,
      transparency: newLayerData.transparency,
      objectCount: 0,
      order: layers.length
    };

    onLayersChange([...layers, newLayer]);
    setNewLayerDialog(false);
    setNewLayerData({
      name: '',
      description: '',
      color: defaultLayerColors[0],
      lineWeight: 1,
      lineType: 'solid',
      transparency: 0
    });
  }, [layers, newLayerData, onLayersChange]);

  const handleDeleteLayer = useCallback((layerId: string) => {
    if (layers.length <= 1) {
      alert('Cannot delete the last remaining layer.');
      return;
    }
    
    const updatedLayers = layers.filter(layer => layer.id !== layerId);
    onLayersChange(updatedLayers);
    
    if (activeLayerId === layerId) {
      onActiveLayerChange(updatedLayers[0]?.id || '');
    }
  }, [layers, activeLayerId, onLayersChange, onActiveLayerChange]);

  const handleDuplicateLayer = useCallback((layerId: string) => {
    const sourceLayer = layers.find(layer => layer.id === layerId);
    if (!sourceLayer) return;

    const duplicatedLayer: Layer = {
      ...sourceLayer,
      id: `layer-${Date.now()}`,
      name: `${sourceLayer.name} Copy`,
      objectCount: 0,
      order: layers.length
    };

    onLayersChange([...layers, duplicatedLayer]);
  }, [layers, onLayersChange]);

  const handleMoveLayer = useCallback((layerId: string, direction: 'up' | 'down') => {
    const layerIndex = sortedLayers.findIndex(layer => layer.id === layerId);
    if (layerIndex === -1) return;

    const newIndex = direction === 'up' ? layerIndex - 1 : layerIndex + 1;
    if (newIndex < 0 || newIndex >= sortedLayers.length) return;

    const updatedLayers = [...layers];
    const targetLayer = updatedLayers.find(l => l.id === layerId);
    const swapLayer = updatedLayers.find(l => l.id === sortedLayers[newIndex].id);

    if (targetLayer && swapLayer) {
      const tempOrder = targetLayer.order;
      targetLayer.order = swapLayer.order;
      swapLayer.order = tempOrder;
    }

    onLayersChange(updatedLayers);
  }, [layers, sortedLayers, onLayersChange]);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, layerId: string) => {
    setLayerMenuAnchor({ element: event.currentTarget, layerId });
  };

  const handleMenuClose = () => {
    setLayerMenuAnchor(null);
  };

  const getLinePattern = (lineType: string) => {
    const pattern = lineTypes.find(type => type.value === lineType);
    return pattern?.pattern || '████████';
  };

  if (!visible) return null;

  return (
    <>
      <Paper 
        elevation={3} 
        sx={{ 
          position: 'fixed',
          top: 80,
          right: 340,
          width: 300,
          maxHeight: 500,
          zIndex: 1000,
          backgroundColor: 'background.paper',
          borderRadius: 2,
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
              <LayersIcon sx={{ mr: 1 }} />
              Layers
            </Typography>
            <Box>
              <Tooltip title="Add Layer">
                <IconButton 
                  size="small" 
                  onClick={() => setNewLayerDialog(true)}
                  color="primary"
                >
                  <AddIcon />
                </IconButton>
              </Tooltip>
              {onClose && (
                <IconButton size="small" onClick={onClose}>
                  ×
                </IconButton>
              )}
            </Box>
          </Box>
          <Typography variant="caption" color="text.secondary">
            {layers.length} layers • Active: {layers.find(l => l.id === activeLayerId)?.name}
          </Typography>
        </Box>

        {/* Layer List */}
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          <List dense>
            {sortedLayers.map((layer, index) => (
              <ListItem
                key={layer.id}
                sx={{
                  backgroundColor: layer.id === activeLayerId ? 'action.selected' : 'transparent',
                  cursor: 'pointer',
                  '&:hover': { backgroundColor: 'action.hover' }
                }}
                onClick={() => onActiveLayerChange(layer.id)}
              >
                {/* Layer Color Indicator */}
                <ListItemIcon sx={{ minWidth: 30 }}>
                  <Box
                    sx={{
                      width: 20,
                      height: 20,
                      backgroundColor: layer.color,
                      border: '1px solid #ccc',
                      borderRadius: 1,
                      opacity: layer.transparency ? (100 - layer.transparency) / 100 : 1
                    }}
                  />
                </ListItemIcon>

                {/* Layer Info */}
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: layer.id === activeLayerId ? 'bold' : 'normal' }}>
                        {layer.name}
                      </Typography>
                      {layer.objectCount > 0 && (
                        <Chip label={layer.objectCount} size="small" variant="outlined" />
                      )}
                    </Box>
                  }
                  secondary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          fontFamily: 'monospace',
                          fontSize: '0.6rem',
                          letterSpacing: 0
                        }}
                      >
                        {getLinePattern(layer.lineType)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {layer.lineWeight}pt
                      </Typography>
                    </Box>
                  }
                />

                {/* Layer Controls */}
                <ListItemSecondaryAction>
                  <Stack direction="row" spacing={0}>
                    <Tooltip title={layer.visible ? 'Hide Layer' : 'Show Layer'}>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleVisibility(layer.id);
                        }}
                      >
                        {layer.visible ? <VisibilityIcon fontSize="small" /> : <VisibilityOffIcon fontSize="small" />}
                      </IconButton>
                    </Tooltip>

                    <Tooltip title={layer.locked ? 'Unlock Layer' : 'Lock Layer'}>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleLock(layer.id);
                        }}
                      >
                        {layer.locked ? <LockIcon fontSize="small" /> : <LockOpenIcon fontSize="small" />}
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Layer Options">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMenuClick(e, layer.id);
                        }}
                      >
                        <MoreIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </Box>

        {/* Layer Statistics */}
        <Box sx={{ p: 1.5, borderTop: 1, borderColor: 'divider', bgcolor: 'background.default' }}>
          <Typography variant="caption" color="text.secondary">
            Total Objects: {layers.reduce((sum, layer) => sum + layer.objectCount, 0)} • 
            Visible: {layers.filter(l => l.visible).length}/{layers.length} • 
            Locked: {layers.filter(l => l.locked).length}
          </Typography>
        </Box>
      </Paper>

      {/* Layer Context Menu */}
      <Menu
        anchorEl={layerMenuAnchor?.element}
        open={Boolean(layerMenuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          if (layerMenuAnchor) setEditLayerDialog(layerMenuAnchor.layerId);
          handleMenuClose();
        }}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Edit Properties
        </MenuItem>
        
        <MenuItem onClick={() => {
          if (layerMenuAnchor) handleDuplicateLayer(layerMenuAnchor.layerId);
          handleMenuClose();
        }}>
          <CopyIcon fontSize="small" sx={{ mr: 1 }} />
          Duplicate Layer
        </MenuItem>

        <Divider />

        <MenuItem onClick={() => {
          if (layerMenuAnchor) handleMoveLayer(layerMenuAnchor.layerId, 'up');
          handleMenuClose();
        }}>
          <MoveUpIcon fontSize="small" sx={{ mr: 1 }} />
          Move Up
        </MenuItem>

        <MenuItem onClick={() => {
          if (layerMenuAnchor) handleMoveLayer(layerMenuAnchor.layerId, 'down');
          handleMenuClose();
        }}>
          <MoveDownIcon fontSize="small" sx={{ mr: 1 }} />
          Move Down
        </MenuItem>

        <Divider />

        <MenuItem onClick={() => {
          if (layerMenuAnchor) handleTogglePrintable(layerMenuAnchor.layerId);
          handleMenuClose();
        }}>
          <PrintIcon fontSize="small" sx={{ mr: 1 }} />
          Toggle Printable
        </MenuItem>

        <Divider />

        <MenuItem 
          onClick={() => {
            if (layerMenuAnchor) handleDeleteLayer(layerMenuAnchor.layerId);
            handleMenuClose();
          }}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete Layer
        </MenuItem>
      </Menu>

      {/* New Layer Dialog */}
      <Dialog open={newLayerDialog} onClose={() => setNewLayerDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Layer</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Layer Name"
              fullWidth
              value={newLayerData.name}
              onChange={(e) => setNewLayerData({ ...newLayerData, name: e.target.value })}
            />
            
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={2}
              value={newLayerData.description}
              onChange={(e) => setNewLayerData({ ...newLayerData, description: e.target.value })}
            />

            <Box>
              <Typography variant="subtitle2" gutterBottom>Color</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {defaultLayerColors.map(color => (
                  <Box
                    key={color}
                    onClick={() => setNewLayerData({ ...newLayerData, color })}
                    sx={{
                      width: 30,
                      height: 30,
                      backgroundColor: color,
                      border: newLayerData.color === color ? '3px solid #333' : '1px solid #ccc',
                      borderRadius: 1,
                      cursor: 'pointer'
                    }}
                  />
                ))}
              </Box>
            </Box>

            <TextField
              label="Line Weight"
              type="number"
              value={newLayerData.lineWeight}
              onChange={(e) => setNewLayerData({ ...newLayerData, lineWeight: Number(e.target.value) })}
              inputProps={{ min: 1, max: 10 }}
            />

            <Box>
              <Typography variant="subtitle2" gutterBottom>Line Type</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {lineTypes.map(type => (
                  <Button
                    key={type.value}
                    variant={newLayerData.lineType === type.value ? 'contained' : 'outlined'}
                    onClick={() => setNewLayerData({ ...newLayerData, lineType: type.value as any })}
                    sx={{ minWidth: 100 }}
                  >
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="caption" sx={{ fontFamily: 'monospace', fontSize: '0.6rem' }}>
                        {type.pattern}
                      </Typography>
                      <Typography variant="caption" display="block">
                        {type.label}
                      </Typography>
                    </Box>
                  </Button>
                ))}
              </Box>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewLayerDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateLayer} variant="contained">Create Layer</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default LayerManager;