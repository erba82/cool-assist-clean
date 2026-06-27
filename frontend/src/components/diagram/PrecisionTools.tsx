/*
 * PrecisionTools.tsx
 * Precision drawing features including snap modes, coordinate input, and measurements
 * Date: 2025-12-10
 * Path: C:\Users\Erfan\cool-assist-clean\frontend\src\components\diagram\PrecisionTools.tsx
 */

import React, { useState, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  ButtonGroup,
  ToggleButton,
  ToggleButtonGroup,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Chip,
  Divider,
  InputAdornment,
  FormControlLabel,
  Switch
} from '@mui/material';
import {
  GridOn as GridIcon,
  PinDrop as SnapIcon,
  CenterFocusStrong as EndpointIcon,
  CropDin as MidpointIcon,
  AddCircle as IntersectionIcon,
  TripOrigin as CenterIcon,
  Straighten as MeasureIcon,
  MyLocation as CoordinateIcon
} from '@mui/icons-material';

export type SnapMode = 
  | 'grid' | 'endpoint' | 'midpoint' | 'center' | 'intersection' | 'perpendicular' | 'tangent';

export interface Point {
  x: number;
  y: number;
}

export interface PrecisionSettings {
  gridSize: number;
  snapThreshold: number;
  activeSnapModes: SnapMode[];
  coordinateInput: boolean;
  precisionMode: boolean;
  units: 'mm' | 'cm' | 'inch' | 'ft';
}

interface PrecisionToolsProps {
  settings: PrecisionSettings;
  onSettingsChange: (settings: PrecisionSettings) => void;
  onCoordinateInput: (point: Point) => void;
  currentPosition?: Point;
  visible?: boolean;
}

const PrecisionTools: React.FC<PrecisionToolsProps> = ({
  settings,
  onSettingsChange,
  onCoordinateInput,
  currentPosition,
  visible = true
}) => {
  const [coordinateDialogOpen, setCoordinateDialogOpen] = useState(false);
  const [coordinateInput, setCoordinateInput] = useState({ x: '', y: '' });

  const handleSnapModeChange = useCallback((modes: SnapMode[]) => {
    onSettingsChange({
      ...settings,
      activeSnapModes: modes
    });
  }, [settings, onSettingsChange]);

  const handleGridSizeChange = useCallback((size: number) => {
    onSettingsChange({
      ...settings,
      gridSize: Math.max(1, size)
    });
  }, [settings, onSettingsChange]);

  const handleSnapThresholdChange = useCallback((threshold: number) => {
    onSettingsChange({
      ...settings,
      snapThreshold: Math.max(1, threshold)
    });
  }, [settings, onSettingsChange]);

  const handleUnitsChange = useCallback((units: 'mm' | 'cm' | 'inch' | 'ft') => {
    onSettingsChange({
      ...settings,
      units
    });
  }, [settings, onSettingsChange]);

  const handleCoordinateSubmit = useCallback(() => {
    const x = parseFloat(coordinateInput.x);
    const y = parseFloat(coordinateInput.y);
    
    if (!isNaN(x) && !isNaN(y)) {
      onCoordinateInput({ x, y });
      setCoordinateDialogOpen(false);
      setCoordinateInput({ x: '', y: '' });
    }
  }, [coordinateInput, onCoordinateInput]);

  const formatCoordinate = (value: number): string => {
    return value.toFixed(2);
  };

  const getUnitSymbol = (unit: string): string => {
    switch (unit) {
      case 'mm': return 'mm';
      case 'cm': return 'cm';
      case 'inch': return '"';
      case 'ft': return "'";
      default: return '';
    }
  };

  if (!visible) return null;

  return (
    <>
      {/* Precision Tools Panel */}
      <Paper 
        elevation={3} 
        sx={{ 
          position: 'fixed',
          top: 80,
          right: 20,
          zIndex: 1000,
          p: 2,
          backgroundColor: 'background.paper',
          borderRadius: 2,
          minWidth: 280,
          maxWidth: 320
        }}
      >
        <Typography variant="h6" gutterBottom>
          Precision Tools
        </Typography>

        {/* Current Position Display */}
        {currentPosition && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Current Position
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
              <Chip 
                size="small" 
                label={`X: ${formatCoordinate(currentPosition.x)}${getUnitSymbol(settings.units)}`}
                variant="outlined"
              />
              <Chip 
                size="small" 
                label={`Y: ${formatCoordinate(currentPosition.y)}${getUnitSymbol(settings.units)}`}
                variant="outlined"
              />
            </Box>
          </Box>
        )}

        <Divider sx={{ my: 1 }} />

        {/* Snap Modes */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Object Snap
          </Typography>
          <ToggleButtonGroup
            value={settings.activeSnapModes}
            onChange={(_, modes) => handleSnapModeChange(modes)}
            size="small"
            sx={{ flexWrap: 'wrap', gap: 0.5 }}
          >
            <ToggleButton value="grid">
              <GridIcon fontSize="small" />
            </ToggleButton>
            <ToggleButton value="endpoint">
              <EndpointIcon fontSize="small" />
            </ToggleButton>
            <ToggleButton value="midpoint">
              <MidpointIcon fontSize="small" />
            </ToggleButton>
            <ToggleButton value="center">
              <CenterIcon fontSize="small" />
            </ToggleButton>
            <ToggleButton value="intersection">
              <IntersectionIcon fontSize="small" />
            </ToggleButton>
          </ToggleButtonGroup>
          
          <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {settings.activeSnapModes.map(mode => (
              <Chip 
                key={mode} 
                label={mode} 
                size="small" 
                color="primary"
                variant="outlined"
              />
            ))}
          </Box>
        </Box>

        <Divider sx={{ my: 1 }} />

        {/* Grid Settings */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Grid Settings
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={6}>
              <TextField
                label="Grid Size"
                type="number"
                size="small"
                fullWidth
                value={settings.gridSize}
                onChange={(e) => handleGridSizeChange(parseFloat(e.target.value) || 1)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      {getUnitSymbol(settings.units)}
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Snap Threshold"
                type="number"
                size="small"
                fullWidth
                value={settings.snapThreshold}
                onChange={(e) => handleSnapThresholdChange(parseFloat(e.target.value) || 1)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      px
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
          </Grid>
        </Box>

        <Divider sx={{ my: 1 }} />

        {/* Units */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Drawing Units
          </Typography>
          <ButtonGroup size="small" fullWidth>
            {(['mm', 'cm', 'inch', 'ft'] as const).map(unit => (
              <Button
                key={unit}
                variant={settings.units === unit ? 'contained' : 'outlined'}
                onClick={() => handleUnitsChange(unit)}
              >
                {unit === 'inch' ? '"' : unit === 'ft' ? "'" : unit}
              </Button>
            ))}
          </ButtonGroup>
        </Box>

        <Divider sx={{ my: 1 }} />

        {/* Coordinate Input */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Coordinate Input
          </Typography>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<CoordinateIcon />}
            onClick={() => setCoordinateDialogOpen(true)}
          >
            Enter Coordinates
          </Button>
        </Box>

        {/* Precision Mode Toggle */}
        <Box>
          <FormControlLabel
            control={
              <Switch
                checked={settings.precisionMode}
                onChange={(e) => onSettingsChange({
                  ...settings,
                  precisionMode: e.target.checked
                })}
              />
            }
            label="Precision Mode"
          />
          <Typography variant="caption" color="text.secondary" display="block">
            Enhanced accuracy for professional drawings
          </Typography>
        </Box>
      </Paper>

      {/* Coordinate Input Dialog */}
      <Dialog 
        open={coordinateDialogOpen} 
        onClose={() => setCoordinateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Enter Coordinates</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={6}>
              <TextField
                label="X Coordinate"
                type="number"
                fullWidth
                value={coordinateInput.x}
                onChange={(e) => setCoordinateInput(prev => ({ ...prev, x: e.target.value }))}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      {getUnitSymbol(settings.units)}
                    </InputAdornment>
                  )
                }}
                autoFocus
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Y Coordinate"
                type="number"
                fullWidth
                value={coordinateInput.y}
                onChange={(e) => setCoordinateInput(prev => ({ ...prev, y: e.target.value }))}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      {getUnitSymbol(settings.units)}
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
          </Grid>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Enter absolute coordinates for precise object placement.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCoordinateDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleCoordinateSubmit}
            variant="contained"
            disabled={!coordinateInput.x || !coordinateInput.y}
          >
            Place Point
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

// Utility functions for snap calculations
export class SnapCalculator {
  static snapToGrid(point: Point, gridSize: number): Point {
    return {
      x: Math.round(point.x / gridSize) * gridSize,
      y: Math.round(point.y / gridSize) * gridSize
    };
  }

  static snapToPoint(point: Point, targetPoint: Point, threshold: number): Point | null {
    const distance = Math.sqrt(
      Math.pow(point.x - targetPoint.x, 2) + Math.pow(point.y - targetPoint.y, 2)
    );
    
    return distance <= threshold ? targetPoint : null;
  }

  static findNearestEndpoint(point: Point, objects: any[], threshold: number): Point | null {
    let nearestPoint: Point | null = null;
    let minDistance = threshold;

    objects.forEach(obj => {
      if (obj.type === 'line' && obj.points) {
        const endpoints = [
          { x: obj.points[0], y: obj.points[1] },
          { x: obj.points[2], y: obj.points[3] }
        ];

        endpoints.forEach(endpoint => {
          const distance = Math.sqrt(
            Math.pow(point.x - endpoint.x, 2) + Math.pow(point.y - endpoint.y, 2)
          );

          if (distance < minDistance) {
            minDistance = distance;
            nearestPoint = endpoint;
          }
        });
      }
    });

    return nearestPoint;
  }

  static findNearestMidpoint(point: Point, objects: any[], threshold: number): Point | null {
    let nearestPoint: Point | null = null;
    let minDistance = threshold;

    objects.forEach(obj => {
      if (obj.type === 'line' && obj.points) {
        const midpoint = {
          x: (obj.points[0] + obj.points[2]) / 2,
          y: (obj.points[1] + obj.points[3]) / 2
        };

        const distance = Math.sqrt(
          Math.pow(point.x - midpoint.x, 2) + Math.pow(point.y - midpoint.y, 2)
        );

        if (distance < minDistance) {
          minDistance = distance;
          nearestPoint = midpoint;
        }
      }
    });

    return nearestPoint;
  }

  static calculateDistance(point1: Point, point2: Point): number {
    return Math.sqrt(
      Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2)
    );
  }

  static calculateAngle(point1: Point, point2: Point): number {
    return Math.atan2(point2.y - point1.y, point2.x - point1.x) * 180 / Math.PI;
  }
}

export default PrecisionTools;