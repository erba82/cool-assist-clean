/*
 * HvacSymbols.tsx
 * Comprehensive library of HVACR and electrical industry standard symbols
 * Updated: 2025-04-27 15:45:00
 * Path: C:\Users\Erfan\cool-assist-clean\frontend\src\components\diagram\HvacSymbols.tsx
 */

import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Box, Typography, Tooltip } from '@mui/material';

// Node data definition with expanded properties
export interface HvacNodeData {
  label: string;
  componentType?: string;
  subType?: string;  // More specific type (e.g. "ball" for valve type)
  refrigerantType?: string; // R-22, R-410A, Ammonia, etc.
  size?: number;
  capacity?: string; // Capacity information
  color?: string;
  rotation?: number;
  temperature?: number;
  pressure?: number;
  flowDirection?: 'left-to-right' | 'right-to-left' | 'top-to-bottom' | 'bottom-to-top';
  specification?: string; // Additional specs like model number
  manufacturer?: string; // e.g., "Danfoss"
  inputPorts?: string[];
  outputPorts?: string[];
}

// DIN standard pipe sizes
const dinPipeSizes = {
  'DN15': { size: 15, color: '#ccc' },  // 1/2" nominal
  'DN20': { size: 20, color: '#ccc' },  // 3/4" nominal
  'DN25': { size: 25, color: '#ccc' },  // 1" nominal
  'DN32': { size: 32, color: '#ccc' },  // 1-1/4" nominal
  'DN40': { size: 40, color: '#ccc' },  // 1-1/2" nominal
  'DN50': { size: 50, color: '#ccc' },  // 2" nominal
  'DN65': { size: 65, color: '#ccc' },  // 2-1/2" nominal
  'DN80': { size: 80, color: '#ccc' },  // 3" nominal
  'DN100': { size: 100, color: '#ccc' }, // 4" nominal
};

// Temperature-based coloring according to standards
const getTemperatureColor = (temp?: number): string => {
  if (temp === undefined) return '#555'; // Default
  
  // Standard temperature-based pipe coloring
  if (temp < -20) return '#0057b8';       // Deep Blue (Very low temp)
  if (temp < 0) return '#00a2ed';         // Light Blue (Low temp)
  if (temp < 20) return '#71bf44';        // Green (Cool)
  if (temp < 40) return '#fff200';        // Yellow (Warm)
  if (temp < 80) return '#f7941d';        // Orange (Hot)
  return '#ed1c24';                       // Red (Very hot)
};

// Base style for all equipment components
const baseStyle = {
  border: '2px solid #000',
  borderRadius: '4px',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  position: 'relative' as const,
  background: '#fff',
  width: '100%',
  height: '100%',
};

// Style variations by component type
const componentStyles: Record<string, any> = {
  // Compressor types
  reciprocating_compressor: {
    borderRadius: '50%', 
    minWidth: '70px',
    minHeight: '70px',
    background: '#d1e8ff',
  },
  scroll_compressor: {
    borderRadius: '50%', 
    minWidth: '70px',
    minHeight: '70px',
    background: '#c2daff',
  },
  screw_compressor: {
    borderRadius: '20%', 
    minWidth: '80px',
    minHeight: '70px',
    background: '#b3cbff',
  },
  centrifugal_compressor: {
    borderRadius: '30%', 
    minWidth: '90px',
    minHeight: '70px',
    background: '#a4bcff',
  },
  
  // Heat exchanger types
  condenser: {
    minWidth: '120px', 
    minHeight: '60px',
    background: '#c6ecde',
  },
  water_cooled_condenser: {
    minWidth: '120px', 
    minHeight: '70px',
    background: '#b7e6d5',
  },
  air_cooled_condenser: {
    minWidth: '120px', 
    minHeight: '70px',
    background: '#a8e0cc',
  },
  evaporative_condenser: {
    minWidth: '120px', 
    minHeight: '80px',
    background: '#99dac3',
  },
  evaporator: {
    minWidth: '120px',
    minHeight: '60px', 
    background: '#e6f0ff',
  },
  dx_evaporator: {
    minWidth: '120px',
    minHeight: '70px', 
    background: '#d7e1f0',
  },
  flooded_evaporator: {
    minWidth: '120px',
    minHeight: '70px', 
    background: '#c8d2e1',
  },
  shell_tube_heat_exchanger: {
    minWidth: '140px',
    minHeight: '60px', 
    background: '#f0f0ff',
  },
  
  // Valve types
  valve: {
    minWidth: '50px',
    minHeight: '50px',
    background: '#ffe8cc',
    transform: 'rotate(45deg)',
  },
  ball_valve: {
    minWidth: '50px',
    minHeight: '50px',
    background: '#ffdeb3',
  },
  check_valve: {
    minWidth: '60px',
    minHeight: '40px',
    background: '#ffd499',
  },
  solenoid_valve: {
    minWidth: '60px',
    minHeight: '50px',
    background: '#ffcb80',
  },
  expansion_valve: {
    minWidth: '70px',
    minHeight: '50px',
    background: '#ffc166',
  },
  pressure_regulating_valve: {
    minWidth: '70px',
    minHeight: '50px',
    background: '#ffb84d',
  },
  
  // Control devices
  controller: {
    minWidth: '80px',
    minHeight: '50px',
    background: '#f0f0f0',
  },
  pressure_controller: {
    minWidth: '90px',
    minHeight: '50px',
    background: '#e1e1e1',
  },
  temperature_controller: {
    minWidth: '90px',
    minHeight: '50px',
    background: '#d2d2d2',
  },
  plc: {
    minWidth: '100px',
    minHeight: '60px',
    background: '#c3c3c3',
  },
  
  // Vessels and tanks
  receiver: {
    minWidth: '70px',
    minHeight: '100px',
    background: '#e0e0e0',
    borderRadius: '10px',
  },
  high_pressure_receiver: {
    minWidth: '70px',
    minHeight: '110px',
    background: '#d1d1d1',
    borderRadius: '10px',
  },
  low_pressure_receiver: {
    minWidth: '70px',
    minHeight: '110px',
    background: '#c2c2c2',
    borderRadius: '10px',
  },
  
  // Filters and other components
  filter: {
    minWidth: '50px',
    minHeight: '50px',
    background: '#f5f5f5',
    borderRadius: '5px',
  },
  filter_drier: {
    minWidth: '60px',
    minHeight: '60px',
    background: '#e6e6e6',
    borderRadius: '5px',
  },
  oil_separator: {
    minWidth: '60px',
    minHeight: '90px',
    background: '#d7d7d7',
    borderRadius: '8px',
  },
  
  // Electrical components
  motor: {
    minWidth: '60px',
    minHeight: '60px',
    background: '#ffe6ee',
    borderRadius: '50%',
  },
  vfd: {
    minWidth: '70px',
    minHeight: '90px',
    background: '#ffd9e6',
  },
  contactor: {
    minWidth: '50px',
    minHeight: '60px',
    background: '#ffccdd',
  },
  relay: {
    minWidth: '50px',
    minHeight: '40px',
    background: '#ffbfd4',
  },
  circuit_breaker: {
    minWidth: '40px',
    minHeight: '60px',
    background: '#ffb3cb',
  },
  
  // Default
  default: {
    minWidth: '80px',
    minHeight: '50px',
  },
};

// Refrigerant-specific styling (color hints based on refrigerant type)
const getRefrigerantStyle = (refrigerantType?: string): any => {
  if (!refrigerantType) return {};
  
  const refrigerantStyles: Record<string, any> = {
    'R-22': { borderColor: '#9fc5e8' }, // Light blue
    'R-410A': { borderColor: '#b6d7a8' }, // Light green
    'R-134a': { borderColor: '#f9cb9c' }, // Light orange
    'R-404A': { borderColor: '#ead1dc' }, // Light purple
    'R-407C': { borderColor: '#d5a6bd' }, // Medium purple
    'R-32': { borderColor: '#a2c4c9' }, // Teal
    'Ammonia': { borderColor: '#f1c232', borderWidth: '3px' }, // Specific yellow & thicker border for ammonia
    'CO2': { borderColor: '#cc0000', borderWidth: '3px' }, // Specific red & thicker border for CO2
  };
  
  // Find matching refrigerant style
  for (const [ref, style] of Object.entries(refrigerantStyles)) {
    if (refrigerantType.toUpperCase().includes(ref.toUpperCase())) {
      return style;
    }
  }
  
  return {}; // Default if no match
};

// --------------- Component Definitions ---------------

export const CompressorNode: React.FC<NodeProps<HvacNodeData>> = ({ data, isConnectable }) => {
  // Determine specific compressor type
  let compressorType = 'reciprocating_compressor'; // default
  
  if (data.subType) {
    const subType = data.subType.toLowerCase();
    if (subType.includes('scroll')) compressorType = 'scroll_compressor';
    else if (subType.includes('screw')) compressorType = 'screw_compressor';
    else if (subType.includes('centrifugal')) compressorType = 'centrifugal_compressor';
  } else if (data.label) {
    const label = data.label.toLowerCase();
    if (label.includes('scroll')) compressorType = 'scroll_compressor';
    else if (label.includes('screw')) compressorType = 'screw_compressor';
    else if (label.includes('centrifugal')) compressorType = 'centrifugal_compressor';
  }
  
  // Apply proper styles
  const refrigerantStyle = getRefrigerantStyle(data.refrigerantType);
  const style = {
    ...baseStyle,
    ...(componentStyles[compressorType] || componentStyles.reciprocating_compressor),
    ...refrigerantStyle,
  };
  
  let svgIcon;
  
  switch(compressorType) {
    case 'scroll_compressor':
      svgIcon = (
        <svg width="40" height="40" viewBox="0 0 50 50">
          <circle cx="25" cy="25" r="20" fill="none" stroke="#000" strokeWidth="2" />
          <path d="M25,25 m-10,0 a10,10 0 1,0 20,0 a10,10 0 1,0 -20,0" fill="none" stroke="#000" strokeWidth="1.5" />
          <path d="M25,25 m-5,0 a5,5 0 1,0 10,0 a5,5 0 1,0 -10,0" fill="none" stroke="#000" strokeWidth="1.5" />
        </svg>
      );
      break;
    case 'screw_compressor':
      svgIcon = (
        <svg width="50" height="40" viewBox="0 0 60 40">
          <rect x="5" y="5" width="50" height="30" rx="5" ry="5" fill="none" stroke="#000" strokeWidth="2" />
          <path d="M15,20 L45,20 M15,15 L45,15 M15,25 L45,25" stroke="#000" strokeWidth="1.5" />
        </svg>
      );
      break;
    case 'centrifugal_compressor':
      svgIcon = (
        <svg width="50" height="40" viewBox="0 0 60 50">
          <ellipse cx="30" cy="25" rx="25" ry="20" fill="none" stroke="#000" strokeWidth="2" />
          <path d="M30,25 m-15,0 a15,10 0 1,0 30,0 a15,10 0 1,0 -30,0" fill="none" stroke="#000" strokeWidth="1.5" />
          <line x1="10" y1="25" x2="50" y2="25" stroke="#000" strokeWidth="1.5" />
        </svg>
      );
      break;
    default: // reciprocating
      svgIcon = (
        <svg width="40" height="40" viewBox="0 0 50 50">
          <circle cx="25" cy="25" r="20" fill="none" stroke="#000" strokeWidth="2" />
          <path d="M15,25 L35,25 M25,15 L25,35" stroke="#000" strokeWidth="2" />
        </svg>
      );
  }
  
  return (
    <div style={{ position: 'relative' }}>
      <Tooltip title={`${data.label}${data.capacity ? ` - ${data.capacity}` : ''}`} arrow placement="top">
        <Box sx={style}>
          {svgIcon}
          
          {/* Label with capacity */}
          <Typography 
            variant="caption" 
            sx={{ 
              position: 'absolute', 
              bottom: '-25px', 
              left: '50%', 
              transform: 'translateX(-50%)',
              whiteSpace: 'nowrap',
              fontSize: '0.7rem',
              fontWeight: 'bold',
              textAlign: 'center',
              maxWidth: '120px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {data.label}
            {data.capacity && (
              <Typography 
                variant="caption" 
                display="block" 
                sx={{ 
                  fontSize: '0.65rem', 
                  color: 'text.secondary',
                  fontWeight: 'normal'
                }}
              >
                {data.capacity}
              </Typography>
            )}
          </Typography>
        </Box>
      </Tooltip>
      
      {/* Handles */}
      <Handle
        type="source"
        position={Position.Right}
        id="out"
        style={{ background: '#555', width: '8px', height: '8px' }}
        isConnectable={isConnectable}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="in"
        style={{ background: '#555', width: '8px', height: '8px' }}
        isConnectable={isConnectable}
      />
    </div>
  );
};

export const CondenserNode: React.FC<NodeProps<HvacNodeData>> = ({ data, isConnectable }) => {
  // Determine specific condenser type
  let condenserType = 'condenser'; // default
  
  if (data.subType) {
    const subType = data.subType.toLowerCase();
    if (subType.includes('water')) condenserType = 'water_cooled_condenser';
    else if (subType.includes('air')) condenserType = 'air_cooled_condenser';
    else if (subType.includes('evaporative')) condenserType = 'evaporative_condenser';
  } else if (data.label) {
    const label = data.label.toLowerCase();
    if (label.includes('water')) condenserType = 'water_cooled_condenser';
    else if (label.includes('air')) condenserType = 'air_cooled_condenser';
    else if (label.includes('evaporative')) condenserType = 'evaporative_condenser';
  }
  
  // Apply proper styles
  const refrigerantStyle = getRefrigerantStyle(data.refrigerantType);
  const style = {
    ...baseStyle,
    ...(componentStyles[condenserType] || componentStyles.condenser),
    ...refrigerantStyle,
  };
  
  let svgIcon;
  
  switch(condenserType) {
    case 'water_cooled_condenser':
      svgIcon = (
        <svg width="90" height="50" viewBox="0 0 120 60">
          <rect x="5" y="5" width="110" height="50" rx="2" ry="2" fill="none" stroke="#000" strokeWidth="2" />
          <line x1="5" y1="20" x2="115" y2="20" stroke="#000" strokeWidth="1" />
          <line x1="5" y1="40" x2="115" y2="40" stroke="#000" strokeWidth="1" />
          <path d="M20,5 L20,55 M40,5 L40,55 M60,5 L60,55 M80,5 L80,55 M100,5 L100,55" stroke="#000" strokeWidth="1" />
          <path d="M10,30 L115,30" stroke="#0066cc" strokeWidth="1.5" strokeDasharray="5,3" />
        </svg>
      );
      break;
    case 'air_cooled_condenser':
      svgIcon = (
        <svg width="90" height="50" viewBox="0 0 120 60">
          <rect x="5" y="5" width="110" height="50" rx="2" ry="2" fill="none" stroke="#000" strokeWidth="2" />
          <line x1="20" y1="5" x2="20" y2="55" stroke="#000" strokeWidth="1" />
          <line x1="40" y1="5" x2="40" y2="55" stroke="#000" strokeWidth="1" />
          <line x1="60" y1="5" x2="60" y2="55" stroke="#000" strokeWidth="1" />
          <line x1="80" y1="5" x2="80" y2="55" stroke="#000" strokeWidth="1" />
          <line x1="100" y1="5" x2="100" y2="55" stroke="#000" strokeWidth="1" />
          <path d="M5,15 L115,15 M5,30 L115,30 M5,45 L115,45" stroke="#000" strokeWidth="1" />
          <circle cx="30" cy="30" r="10" fill="none" stroke="#000" strokeWidth="1" />
          <circle cx="70" cy="30" r="10" fill="none" stroke="#000" strokeWidth="1" />
        </svg>
      );
      break;
    case 'evaporative_condenser':
      svgIcon = (
        <svg width="90" height="60" viewBox="0 0 120 80">
          <rect x="5" y="5" width="110" height="50" rx="2" ry="2" fill="none" stroke="#000" strokeWidth="2" />
          <line x1="20" y1="5" x2="20" y2="55" stroke="#000" strokeWidth="1" />
          <line x1="40" y1="5" x2="40" y2="55" stroke="#000" strokeWidth="1" />
          <line x1="60" y1="5" x2="60" y2="55" stroke="#000" strokeWidth="1" />
          <line x1="80" y1="5" x2="80" y2="55" stroke="#000" strokeWidth="1" />
          <line x1="100" y1="5" x2="100" y2="55" stroke="#000" strokeWidth="1" />
          <path d="M5,20 L115,20 M5,40 L115,40" stroke="#000" strokeWidth="1" />
          <path d="M5,70 C25,60 35,75 55,65 C75,55 85,70 105,60 L105,60" fill="none" stroke="#0066cc" strokeWidth="1.5" />
          <path d="M5,65 C25,55 35,70 55,60 C75,50 85,65 105,55 L105,55" fill="none" stroke="#0066cc" strokeWidth="1.5" />
        </svg>
      );
      break;
    default:
      svgIcon = (
        <svg width="90" height="50" viewBox="0 0 120 60">
          <rect x="5" y="5" width="110" height="50" rx="2" ry="2" fill="none" stroke="#000" strokeWidth="2" />
          <line x1="20" y1="5" x2="20" y2="55" stroke="#000" strokeWidth="1" />
          <line x1="40" y1="5" x2="40" y2="55" stroke="#000" strokeWidth="1" />
          <line x1="60" y1="5" x2="60" y2="55" stroke="#000" strokeWidth="1" />
          <line x1="80" y1="5" x2="80" y2="55" stroke="#000" strokeWidth="1" />
          <line x1="100" y1="5" x2="100" y2="55" stroke="#000" strokeWidth="1" />
        </svg>
      );
  }
  
  return (
    <div style={{ position: 'relative' }}>
      <Tooltip title={`${data.label}${data.capacity ? ` - ${data.capacity}` : ''}`} arrow placement="top">
        <Box sx={style}>
          {svgIcon}
          
          {/* Label with capacity */}
          <Typography 
            variant="caption" 
            sx={{ 
              position: 'absolute', 
              bottom: '-25px', 
              left: '50%', 
              transform: 'translateX(-50%)',
              whiteSpace: 'nowrap',
              fontSize: '0.7rem',
              fontWeight: 'bold',
              textAlign: 'center',
              maxWidth: '120px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {data.label}
            {data.capacity && (
              <Typography 
                variant="caption" 
                display="block" 
                sx={{ 
                  fontSize: '0.65rem', 
                  color: 'text.secondary',
                  fontWeight: 'normal'
                }}
              >
                {data.capacity}
              </Typography>
            )}
          </Typography>
        </Box>
      </Tooltip>
      
      {/* Handles */}
      <Handle
        type="source"
        position={Position.Right}
        id="out"
        style={{ background: '#555', width: '8px', height: '8px' }}
        isConnectable={isConnectable}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="in"
        style={{ background: '#555', width: '8px', height: '8px' }}
        isConnectable={isConnectable}
      />
      
      {/* Additional water connection handles for water-cooled condensers */}
      {condenserType === 'water_cooled_condenser' && (
        <>
          <Handle
            type="target"
            position={Position.Top}
            id="water-in"
            style={{ background: '#0066cc', width: '8px', height: '8px', left: '30%' }}
            isConnectable={isConnectable}
          />
          <Handle
            type="source"
            position={Position.Top}
            id="water-out"
            style={{ background: '#0066cc', width: '8px', height: '8px', left: '70%' }}
            isConnectable={isConnectable}
          />
        </>
      )}
    </div>
  );
};

export const EvaporatorNode: React.FC<NodeProps<HvacNodeData>> = ({ data, isConnectable }) => {
  // Determine specific evaporator type
  let evaporatorType = 'evaporator'; // default
  
  if (data.subType) {
    const subType = data.subType.toLowerCase();
    if (subType.includes('dx')) evaporatorType = 'dx_evaporator';
    else if (subType.includes('flood')) evaporatorType = 'flooded_evaporator';
  } else if (data.label) {
    const label = data.label.toLowerCase();
    if (label.includes('dx') || label.includes('direct')) evaporatorType = 'dx_evaporator';
    else if (label.includes('flood')) evaporatorType = 'flooded_evaporator';
  }
  
  // Apply proper styles
  const refrigerantStyle = getRefrigerantStyle(data.refrigerantType);
  const style = {
    ...baseStyle,
    ...(componentStyles[evaporatorType] || componentStyles.evaporator),
    ...refrigerantStyle,
  };
  
  let svgIcon;
  
  switch(evaporatorType) {
    case 'dx_evaporator':
      svgIcon = (
        <svg width="90" height="50" viewBox="0 0 120 60">
          <rect x="5" y="5" width="110" height="50" rx="2" ry="2" fill="none" stroke="#000" strokeWidth="2" />
          <line x1="5" y1="20" x2="115" y2="20" stroke="#000" strokeWidth="1" />
          <line x1="5" y1="40" x2="115" y2="40" stroke="#000" strokeWidth="1" />
          <line x1="20" y1="5" x2="20" y2="55" stroke="#000" strokeWidth="1" />
          <line x1="40" y1="5" x2="40" y2="55" stroke="#000" strokeWidth="1" />
          <line x1="60" y1="5" x2="60" y2="55" stroke="#000" strokeWidth="1" />
          <line x1="80" y1="5" x2="80" y2="55" stroke="#000" strokeWidth="1" />
          <line x1="100" y1="5" x2="100" y2="55" stroke="#000" strokeWidth="1" />
          <path d="M25,30 L35,30 M45,30 L55,30 M65,30 L75,30 M85,30 L95,30" stroke="#000" strokeWidth="1.5" />
        </svg>
      );
      break;
    case 'flooded_evaporator':
      svgIcon = (
        <svg width="90" height="50" viewBox="0 0 120 60">
          <rect x="5" y="5" width="110" height="50" rx="2" ry="2" fill="none" stroke="#000" strokeWidth="2" />
          <line x1="5" y1="20" x2="115" y2="20" stroke="#000" strokeWidth="1" />
          <line x1="5" y1="40" x2="115" y2="40" stroke="#000" strokeWidth="1" />
          <line x1="20" y1="5" x2="20" y2="55" stroke="#000" strokeWidth="1" />
          <line x1="40" y1="5" x2="40" y2="55" stroke="#000" strokeWidth="1" />
          <line x1="60" y1="5" x2="60" y2="55" stroke="#000" strokeWidth="1" />
          <line x1="80" y1="5" x2="80" y2="55" stroke="#000" strokeWidth="1" />
          <line x1="100" y1="5" x2="100" y2="55" stroke="#000" strokeWidth="1" />
          <path d="M5,30 L115,30" stroke="#000" strokeWidth="1.5" strokeDasharray="3,2" />
          <path d="M5,35 L115,35" stroke="#00aaff" strokeWidth="1" strokeDasharray="4,2" />
        </svg>
      );
      break;
    default:
      svgIcon = (
        <svg width="90" height="50" viewBox="0 0 120 60">
          <rect x="5" y="5" width="110" height="50" rx="2" ry="2" fill="none" stroke="#000" strokeWidth="2" />
          <line x1="5" y1="20" x2="115" y2="20" stroke="#000" strokeWidth="1" />
          <line x1="5" y1="40" x2="115" y2="40" stroke="#000" strokeWidth="1" />
          <path d="M20,30 C30,20 40,40 50,30 C60,20 70,40 80,30 C90,20 100,40 110,30" fill="none" stroke="#000" strokeWidth="1.5" />
        </svg>
      );
  }
  
  return (
    <div style={{ position: 'relative' }}>
      <Tooltip title={`${data.label}${data.capacity ? ` - ${data.capacity}` : ''}`} arrow placement="top">
        <Box sx={style}>
          {svgIcon}
          
          {/* Label with capacity */}
          <Typography 
            variant="caption" 
            sx={{ 
              position: 'absolute', 
              bottom: '-25px', 
              left: '50%', 
              transform: 'translateX(-50%)',
              whiteSpace: 'nowrap',
              fontSize: '0.7rem',
              fontWeight: 'bold',
              textAlign: 'center',
              maxWidth: '120px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {data.label}
            {data.capacity && (
              <Typography 
                variant="caption" 
                display="block" 
                sx={{ 
                  fontSize: '0.65rem', 
                  color: 'text.secondary',
                  fontWeight: 'normal'
                }}
              >
                {data.capacity}
              </Typography>
            )}
          </Typography>
        </Box>
      </Tooltip>
      
      {/* Handles */}
      <Handle
        type="source"
        position={Position.Right}
        id="out"
        style={{ background: '#555', width: '8px', height: '8px' }}
        isConnectable={isConnectable}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="in"
        style={{ background: '#555', width: '8px', height: '8px' }}
        isConnectable={isConnectable}
      />
    </div>
  );
};

export const ValveNode: React.FC<NodeProps<HvacNodeData>> = ({ data, isConnectable }) => {
  // Determine specific valve type
  let valveType = 'valve'; // default
  
  if (data.subType) {
    const subType = data.subType.toLowerCase();
    if (subType.includes('ball')) valveType = 'ball_valve';
    else if (subType.includes('check')) valveType = 'check_valve';
    else if (subType.includes('solenoid')) valveType = 'solenoid_valve';
    else if (subType.includes('expansion')) valveType = 'expansion_valve';
    else if (subType.includes('regulating') || subType.includes('pressure')) valveType = 'pressure_regulating_valve';
  } else if (data.label) {
    const label = data.label.toLowerCase();
    if (label.includes('ball')) valveType = 'ball_valve';
    else if (label.includes('check')) valveType = 'check_valve';
    else if (label.includes('solenoid')) valveType = 'solenoid_valve';
    else if (label.includes('expansion')) valveType = 'expansion_valve';
    else if (label.includes('regulating') || label.includes('pressure')) valveType = 'pressure_regulating_valve';
  }
  
  // Check manufacturer
  const isDanfoss = data.manufacturer?.toLowerCase().includes('danfoss') || 
                    data.label?.toLowerCase().includes('danfoss');
  
  // Apply proper styles
  const refrigerantStyle = getRefrigerantStyle(data.refrigerantType);
  const style = {
    ...baseStyle,
    ...(componentStyles[valveType] || componentStyles.valve),
    ...refrigerantStyle,
    // Add Danfoss branding if applicable
    ...(isDanfoss ? { borderColor: '#e31837' } : {}),
  };
  
  let svgIcon;
  
  switch(valveType) {
    case 'ball_valve':
      svgIcon = (
        <svg width="40" height="40" viewBox="0 0 50 50">
          <circle cx="25" cy="25" r="15" fill="none" stroke="#000" strokeWidth="2" />
          <rect x="15" y="22" width="20" height="6" fill={isDanfoss ? '#e31837' : '#000'} />
        </svg>
      );
      break;
    case 'check_valve':
      svgIcon = (
        <svg width="50" height="30" viewBox="0 0 60 40">
          <polygon points="10,20 50,5 50,35" fill="none" stroke="#000" strokeWidth="2" />
          <line x1="10" y1="5" x2="10" y2="35" stroke="#000" strokeWidth="2" />
          {isDanfoss && <text x="20" y="22" fontSize="8" fill="#e31837">DANFOSS</text>}
        </svg>
      );
      break;
    case 'solenoid_valve':
      svgIcon = (
        <svg width="50" height="40" viewBox="0 0 60 50">
          <rect x="10" y="10" width="40" height="30" fill="none" stroke="#000" strokeWidth="2" />
          <circle cx="30" cy="25" r="10" fill="none" stroke="#000" strokeWidth="2" />
          <path d="M20,25 L40,25" stroke="#000" strokeWidth="2" />
          <path d="M30,5 L30,15" stroke="#000" strokeWidth="2" />
          {isDanfoss && <text x="12" y="45" fontSize="6" fill="#e31837">DANFOSS</text>}
        </svg>
      );
      break;
    case 'expansion_valve':
      svgIcon = (
        <svg width="60" height="40" viewBox="0 0 70 50">
          <path d="M10,25 L60,25" stroke="#000" strokeWidth="2" />
          <polygon points="25,10 45,10 35,30" fill="none" stroke="#000" strokeWidth="2" />
          <circle cx="35" cy="35" r="10" fill="none" stroke="#000" strokeWidth="1.5" />
          <path d="M30,35 L40,35" stroke="#000" strokeWidth="1.5" />
          {isDanfoss && <text x="15" y="45" fontSize="6" fill="#e31837">DANFOSS</text>}
        </svg>
      );
      break;
    case 'pressure_regulating_valve':
      svgIcon = (
        <svg width="60" height="40" viewBox="0 0 70 50">
          <rect x="15" y="10" width="40" height="30" fill="none" stroke="#000" strokeWidth="2" />
          <path d="M20,25 L50,25 M35,15 L35,35" stroke="#000" strokeWidth="1.5" />
          <circle cx="35" cy="25" r="5" fill="none" stroke="#000" strokeWidth="1.5" />
          <path d="M10,40 L60,10" stroke="#000" strokeWidth="1" strokeDasharray="2,2" />
          {isDanfoss && <text x="20" y="45" fontSize="6" fill="#e31837">DANFOSS</text>}
        </svg>
      );
      break;
    default:
      svgIcon = (
        <svg width="40" height="40" viewBox="0 0 50 50">
          <polygon points="5,25 25,5 45,25 25,45" fill="none" stroke="#000" strokeWidth="2" />
          <line x1="25" y1="5" x2="25" y2="45" stroke="#000" strokeWidth="2" />
        </svg>
      );
  }
  
  return (
    <div style={{ position: 'relative' }}>
      <Tooltip 
        title={`${isDanfoss ? 'Danfoss ' : ''}${data.label}${data.specification ? ` (${data.specification})` : ''}`} 
        arrow 
        placement="top"
      >
        <Box sx={style}>
          {svgIcon}
          
          {/* Label with specification */}
          <Typography 
            variant="caption" 
            sx={{ 
              position: 'absolute', 
              bottom: '-25px', 
              left: '50%', 
              transform: 'translateX(-50%)',
              whiteSpace: 'nowrap',
              fontSize: '0.7rem',
              fontWeight: 'bold',
              textAlign: 'center',
              maxWidth: '100px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              color: isDanfoss ? '#e31837' : 'inherit',
            }}
          >
            {data.label}
            {data.specification && (
              <Typography 
                variant="caption" 
                display="block" 
                sx={{ 
                  fontSize: '0.65rem', 
                  color: isDanfoss ? '#e31837' : 'text.secondary',
                  fontWeight: 'normal'
                }}
              >
                {data.specification}
              </Typography>
            )}
          </Typography>
        </Box>
      </Tooltip>
      
      {/* Handles */}
      <Handle
        type="source"
        position={Position.Right}
        id="out"
        style={{ background: '#555', width: '8px', height: '8px' }}
        isConnectable={isConnectable}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="in"
        style={{ background: '#555', width: '8px', height: '8px' }}
        isConnectable={isConnectable}
      />
    </div>
  );
};

export const ControllerNode: React.FC<NodeProps<HvacNodeData>> = ({ data, isConnectable }) => {
  // Determine specific controller type
  let controllerType = 'controller'; // default
  
  if (data.subType) {
    const subType = data.subType.toLowerCase();
    if (subType.includes('pressure')) controllerType = 'pressure_controller';
    else if (subType.includes('temperature')) controllerType = 'temperature_controller';
    else if (subType.includes('plc')) controllerType = 'plc';
  } else if (data.label) {
    const label = data.label.toLowerCase();
    if (label.includes('pressure') || label.includes('rt')) controllerType = 'pressure_controller';
    else if (label.includes('temperature') || label.includes('ekc')) controllerType = 'temperature_controller';
    else if (label.includes('plc')) controllerType = 'plc';
  }
  
  // Check manufacturer
  const isDanfoss = data.manufacturer?.toLowerCase().includes('danfoss') || 
                    data.label?.toLowerCase().includes('danfoss') ||
                    data.label?.toLowerCase().includes('ekc') ||
                    data.label?.toLowerCase().includes('rt');
  
  // Apply proper styles
  const style = {
    ...baseStyle,
    ...(componentStyles[controllerType] || componentStyles.controller),
    // Add Danfoss branding if applicable
    ...(isDanfoss ? { borderColor: '#e31837' } : {}),
  };
  
  let svgIcon;
  
  switch(controllerType) {
    case 'pressure_controller':
      svgIcon = (
        <svg width="70" height="40" viewBox="0 0 90 50">
          <rect x="5" y="5" width="80" height="40" rx="2" ry="2" fill="none" stroke="#000" strokeWidth="2" />
          <circle cx="30" cy="25" r="15" fill="none" stroke="#000" strokeWidth="1.5" />
          <path d="M20,25 L40,25 M30,15 L30,35" stroke="#000" strokeWidth="1.5" />
          <path d="M50,15 L70,15 M50,25 L70,25 M50,35 L70,35" stroke="#000" strokeWidth="1.5" />
          {isDanfoss && (
            <text x="10" y="45" fontSize="7" fill="#e31837" fontWeight="bold">
              {data.label.includes('RT') ? 'RT' : 'DANFOSS'}
            </text>
          )}
        </svg>
      );
      break;
    case 'temperature_controller':
      svgIcon = (
        <svg width="70" height="40" viewBox="0 0 90 50">
          <rect x="5" y="5" width="80" height="40" rx="2" ry="2" fill="none" stroke="#000" strokeWidth="2" />
          <circle cx="25" cy="25" r="10" fill="none" stroke="#000" strokeWidth="1.5" />
          <path d="M25,15 L25,25 L30,25" stroke="#000" strokeWidth="1.5" />
          <rect x="45" y="15" width="30" height="20" fill="none" stroke="#000" strokeWidth="1.5" />
          <path d="M50,20 L70,20 M50,30 L70,30" stroke="#000" strokeWidth="1" />
          {isDanfoss && (
            <text x="10" y="45" fontSize="7" fill="#e31837" fontWeight="bold">
              {data.label.includes('EKC') ? 'EKC' : 'DANFOSS'}
            </text>
          )}
        </svg>
      );
      break;
    case 'plc':
      svgIcon = (
        <svg width="80" height="50" viewBox="0 0 100 60">
          <rect x="5" y="5" width="90" height="50" rx="3" ry="3" fill="none" stroke="#000" strokeWidth="2" />
          <rect x="15" y="15" width="70" height="15" fill="none" stroke="#000" strokeWidth="1.5" />
          <rect x="15" y="35" width="70" height="10" fill="none" stroke="#000" strokeWidth="1.5" />
          <path d="M25,15 L25,30 M35,15 L35,30 M45,15 L45,30 M55,15 L55,30 M65,15 L65,30 M75,15 L75,30" stroke="#000" strokeWidth="1" />
          <circle cx="20" cy="40" r="2" fill="#000" />
          <circle cx="30" cy="40" r="2" fill="#000" />
          <circle cx="40" cy="40" r="2" fill="#000" />
          <circle cx="50" cy="40" r="2" fill="#000" />
        </svg>
      );
      break;
    default:
      svgIcon = (
        <svg width="70" height="40" viewBox="0 0 80 50">
          <rect x="5" y="5" width="70" height="40" rx="3" ry="3" fill="none" stroke="#000" strokeWidth="2" />
          <rect x="15" y="15" width="50" height="20" rx="2" ry="2" fill="none" stroke="#000" strokeWidth="1.5" />
          <path d="M25,15 L25,35 M35,15 L35,35 M45,15 L45,35 M55,15 L55,35" stroke="#000" strokeWidth="1" />
          <path d="M15,25 L65,25" stroke="#000" strokeWidth="1" />
        </svg>
      );
  }
  
  return (
    <div style={{ position: 'relative' }}>
      <Tooltip 
        title={`${isDanfoss ? 'Danfoss ' : ''}${data.label}${data.specification ? ` (${data.specification})` : ''}`} 
        arrow 
        placement="top"
      >
        <Box sx={style}>
          {svgIcon}
          
          {/* Label with specification */}
          <Typography 
            variant="caption" 
            sx={{ 
              position: 'absolute', 
              bottom: '-25px', 
              left: '50%', 
              transform: 'translateX(-50%)',
              whiteSpace: 'nowrap',
              fontSize: '0.7rem',
              fontWeight: 'bold',
              textAlign: 'center',
              maxWidth: '120px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              color: isDanfoss ? '#e31837' : 'inherit',
            }}
          >
            {data.label}
            {data.specification && (
              <Typography 
                variant="caption" 
                display="block" 
                sx={{ 
                  fontSize: '0.65rem', 
                  color: isDanfoss ? '#e31837' : 'text.secondary',
                  fontWeight: 'normal'
                }}
              >
                {data.specification}
              </Typography>
            )}
          </Typography>
        </Box>
      </Tooltip>
      
      {/* Handles - Controllers often have multiple connections */}
      <Handle
        type="source"
        position={Position.Right}
        id="out"
        style={{ background: '#555', width: '8px', height: '8px' }}
        isConnectable={isConnectable}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="in"
        style={{ background: '#555', width: '8px', height: '8px' }}
        isConnectable={isConnectable}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="control-out"
        style={{ background: '#772953', width: '8px', height: '8px' }}
        isConnectable={isConnectable}
      />
    </div>
  );
};

export const ReceiverNode: React.FC<NodeProps<HvacNodeData>> = ({ data, isConnectable }) => {
  // Determine specific receiver type
  let receiverType = 'receiver'; // default
  
  if (data.subType) {
    const subType = data.subType.toLowerCase();
    if (subType.includes('high')) receiverType = 'high_pressure_receiver';
    else if (subType.includes('low')) receiverType = 'low_pressure_receiver';
  } else if (data.label) {
    const label = data.label.toLowerCase();
    if (label.includes('high')) receiverType = 'high_pressure_receiver';
    else if (label.includes('low')) receiverType = 'low_pressure_receiver';
  }
  
  // Apply proper styles
  const refrigerantStyle = getRefrigerantStyle(data.refrigerantType);
  const style = {
    ...baseStyle,
    ...(componentStyles[receiverType] || componentStyles.receiver),
    ...refrigerantStyle,
  };
  
  return (
    <div style={{ position: 'relative' }}>
      <Tooltip title={`${data.label}${data.capacity ? ` - ${data.capacity}` : ''}`} arrow placement="top">
        <Box sx={style}>
          <svg width="50" height="80" viewBox="0 0 60 100">
            <rect x="10" y="10" width="40" height="80" rx="10" ry="10" fill="none" stroke="#000" strokeWidth="2" />
            <line x1="10" y1="30" x2="50" y2="30" stroke="#000" strokeWidth="1" />
            <line x1="10" y1="50" x2="50" y2="50" stroke="#000" strokeWidth="1" />
            <line x1="10" y1="70" x2="50" y2="70" stroke="#000" strokeWidth="1" />
            
            {/* Refrigerant level indicator */}
            <rect x="20" y="40" width="5" height="40" fill="none" stroke="#000" strokeWidth="1" />
            <rect x="20" y="60" width="5" height="20" fill="#72c4f7" stroke="#000" strokeWidth="0" />
            
            {/* Pressure gauge for high pressure */}
            {receiverType === 'high_pressure_receiver' && (
              <circle cx="40" cy="30" r="7" fill="#fff" stroke="#000" strokeWidth="1" />
            )}
          </svg>
          
          {/* Label with capacity */}
          <Typography 
            variant="caption" 
            sx={{ 
              position: 'absolute', 
              bottom: '-25px', 
              left: '50%', 
              transform: 'translateX(-50%)',
              whiteSpace: 'nowrap',
              fontSize: '0.7rem',
              fontWeight: 'bold',
              textAlign: 'center',
              maxWidth: '100px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {data.label}
            {data.capacity && (
              <Typography 
                variant="caption" 
                display="block" 
                sx={{ 
                  fontSize: '0.65rem', 
                  color: 'text.secondary',
                  fontWeight: 'normal'
                }}
              >
                {data.capacity}
              </Typography>
            )}
          </Typography>
        </Box>
      </Tooltip>
      
      {/* Handles */}
      <Handle
        type="source"
        position={Position.Right}
        id="liquid-out"
        style={{ background: '#555', width: '8px', height: '8px', top: '70%' }}
        isConnectable={isConnectable}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="in"
        style={{ background: '#555', width: '8px', height: '8px', top: '30%' }}
        isConnectable={isConnectable}
      />
      <Handle
        type="source"
        position={Position.Top}
        id="gas-out"
        style={{ background: '#555', width: '8px', height: '8px' }}
        isConnectable={isConnectable}
      />
    </div>
  );
};

export const FilterNode: React.FC<NodeProps<HvacNodeData>> = ({ data, isConnectable }) => {
  // Determine specific filter type
  let filterType = 'filter'; // default
  
  if (data.subType) {
    const subType = data.subType.toLowerCase();
    if (subType.includes('drier')) filterType = 'filter_drier';
    else if (subType.includes('oil') || subType.includes('separator')) filterType = 'oil_separator';
  } else if (data.label) {
    const label = data.label.toLowerCase();
    if (label.includes('drier')) filterType = 'filter_drier';
    else if (label.includes('oil') || label.includes('separator')) filterType = 'oil_separator';
  }
  
  // Check manufacturer
  const isDanfoss = data.manufacturer?.toLowerCase().includes('danfoss') || 
                    data.label?.toLowerCase().includes('danfoss');
  
  // Apply proper styles
  const refrigerantStyle = getRefrigerantStyle(data.refrigerantType);
  const style = {
    ...baseStyle,
    ...(componentStyles[filterType] || componentStyles.filter),
    ...refrigerantStyle,
    // Add Danfoss branding if applicable
    ...(isDanfoss ? { borderColor: '#e31837' } : {}),
  };
  
  let svgIcon;
  
  switch(filterType) {
    case 'filter_drier':
      svgIcon = (
        <svg width="50" height="50" viewBox="0 0 60 60">
          <rect x="10" y="10" width="40" height="40" rx="5" ry="5" fill="none" stroke="#000" strokeWidth="2" />
          <path d="M15,15 L45,45 M15,45 L45,15" stroke="#000" strokeWidth="1.5" />
          <path d="M20,20 L40,40 M20,40 L40,20" stroke="#000" strokeWidth="1.5" />
          {isDanfoss && <text x="12" y="55" fontSize="7" fill="#e31837">DANFOSS</text>}
        </svg>
      );
      break;
    case 'oil_separator':
      svgIcon = (
        <svg width="50" height="80" viewBox="0 0 60 100">
          <rect x="10" y="10" width="40" height="80" rx="5" ry="5" fill="none" stroke="#000" strokeWidth="2" />
          <path d="M10,50 L50,50" stroke="#000" strokeWidth="1.5" />
          <path d="M10,70 L50,70" stroke="#000" strokeWidth="1.5" />
          <path d="M30,10 L30,50" stroke="#000" strokeWidth="1.5" />
          <circle cx="30" cy="85" r="5" fill="none" stroke="#000" strokeWidth="1" />
          {isDanfoss && <text x="12" y="95" fontSize="7" fill="#e31837">DANFOSS</text>}
          
          {/* Oil level */}
          <rect x="10" y="70" width="40" height="20" fill="#d4a373" fillOpacity="0.3" />
        </svg>
      );
      break;
    default:
      svgIcon = (
        <svg width="40" height="40" viewBox="0 0 50 50">
          <circle cx="25" cy="25" r="20" fill="none" stroke="#000" strokeWidth="2" />
          <path d="M15,15 L35,35 M15,35 L35,15" stroke="#000" strokeWidth="1.5" />
          {isDanfoss && <text x="10" y="45" fontSize="7" fill="#e31837">DANFOSS</text>}
        </svg>
      );
  }
  
  return (
    <div style={{ position: 'relative' }}>
      <Tooltip 
        title={`${isDanfoss ? 'Danfoss ' : ''}${data.label}${data.specification ? ` (${data.specification})` : ''}`} 
        arrow 
        placement="top"
      >
        <Box sx={style}>
          {svgIcon}
          
          {/* Label with specification */}
          <Typography 
            variant="caption" 
            sx={{ 
              position: 'absolute', 
              bottom: '-25px', 
              left: '50%', 
              transform: 'translateX(-50%)',
              whiteSpace: 'nowrap',
              fontSize: '0.7rem',
              fontWeight: 'bold',
              textAlign: 'center',
              maxWidth: '100px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              color: isDanfoss ? '#e31837' : 'inherit',
            }}
          >
            {data.label}
            {data.specification && (
              <Typography 
                variant="caption" 
                display="block" 
                sx={{ 
                  fontSize: '0.65rem', 
                  color: isDanfoss ? '#e31837' : 'text.secondary',
                  fontWeight: 'normal'
                }}
              >
                {data.specification}
              </Typography>
            )}
          </Typography>
        </Box>
      </Tooltip>
      
      {/* Handles */}
      <Handle
        type="source"
        position={Position.Right}
        id="out"
        style={{ background: '#555', width: '8px', height: '8px' }}
        isConnectable={isConnectable}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="in"
        style={{ background: '#555', width: '8px', height: '8px' }}
        isConnectable={isConnectable}
      />
      
      {/* Additional drain handle for oil separator */}
      {filterType === 'oil_separator' && (
        <Handle
          type="source"
          position={Position.Bottom}
          id="drain"
          style={{ background: '#d4a373', width: '8px', height: '8px' }}
          isConnectable={isConnectable}
        />
      )}
    </div>
  );
};

export const ElectricalNode: React.FC<NodeProps<HvacNodeData>> = ({ data, isConnectable }) => {
  // Determine specific electrical component type
  let componentType = 'motor'; // default
  
  if (data.subType) {
    const subType = data.subType.toLowerCase();
    if (subType.includes('vfd')) componentType = 'vfd';
    else if (subType.includes('contactor')) componentType = 'contactor';
    else if (subType.includes('relay')) componentType = 'relay';
    else if (subType.includes('breaker') || subType.includes('circuit')) componentType = 'circuit_breaker';
  } else if (data.label) {
    const label = data.label.toLowerCase();
    if (label.includes('vfd') || label.includes('drive') || label.includes('inverter')) componentType = 'vfd';
    else if (label.includes('contactor')) componentType = 'contactor';
    else if (label.includes('relay')) componentType = 'relay';
    else if (label.includes('breaker') || label.includes('circuit')) componentType = 'circuit_breaker';
  }
  
  // Apply proper styles
  const style = {
    ...baseStyle,
    ...(componentStyles[componentType] || componentStyles.motor),
  };
  
  let svgIcon;
  
  switch(componentType) {
    case 'vfd':
      svgIcon = (
        <svg width="50" height="70" viewBox="0 0 60 80">
          <rect x="10" y="10" width="40" height="60" rx="2" ry="2" fill="none" stroke="#000" strokeWidth="2" />
          <rect x="15" y="15" width="30" height="15" rx="1" ry="1" fill="none" stroke="#000" strokeWidth="1" />
          <circle cx="20" cy="40" r="5" fill="none" stroke="#000" strokeWidth="1" />
          <circle cx="20" cy="55" r="5" fill="none" stroke="#000" strokeWidth="1" />
          <circle cx="40" cy="40" r="5" fill="none" stroke="#000" strokeWidth="1" />
          <circle cx="40" cy="55" r="5" fill="none" stroke="#000" strokeWidth="1" />
          <text x="20" y="27" fontSize="10" textAnchor="middle" stroke="none" fill="#000">Hz</text>
        </svg>
      );
      break;
    case 'contactor':
      svgIcon = (
        <svg width="40" height="50" viewBox="0 0 50 60">
          <rect x="10" y="10" width="30" height="40" rx="2" ry="2" fill="none" stroke="#000" strokeWidth="2" />
          <rect x="15" y="15" width="20" height="10" fill="none" stroke="#000" strokeWidth="1" />
          <line x1="15" y1="35" x2="35" y2="35" stroke="#000" strokeWidth="1" />
          <line x1="20" y1="30" x2="20" y2="40" stroke="#000" strokeWidth="1" />
          <line x1="30" y1="30" x2="30" y2="40" stroke="#000" strokeWidth="1" />
          <path d="M15,45 L35,45 M15,50 L35,50" stroke="#000" strokeWidth="1" />
        </svg>
      );
      break;
    case 'relay':
      svgIcon = (
        <svg width="40" height="40" viewBox="0 0 50 50">
          <rect x="10" y="10" width="30" height="30" rx="2" ry="2" fill="none" stroke="#000" strokeWidth="2" />
          <line x1="10" y1="20" x2="40" y2="20" stroke="#000" strokeWidth="1" />
          <line x1="10" y1="30" x2="40" y2="30" stroke="#000" strokeWidth="1" />
          <circle cx="20" cy="15" r="2" fill="#000" />
          <circle cx="30" cy="15" r="2" fill="#000" />
          <circle cx="20" cy="25" r="2" fill="#000" />
          <circle cx="30" cy="25" r="2" fill="#000" />
          <circle cx="20" cy="35" r="2" fill="#000" />
          <circle cx="30" cy="35" r="2" fill="#000" />
        </svg>
      );
      break;
    case 'circuit_breaker':
      svgIcon = (
        <svg width="40" height="50" viewBox="0 0 50 60">
          <rect x="10" y="10" width="30" height="40" rx="0" ry="0" fill="none" stroke="#000" strokeWidth="2" />
          <path d="M15,15 L35,15" stroke="#000" strokeWidth="1" />
          <path d="M25,15 L25,25" stroke="#000" strokeWidth="1" />
          <path d="M20,25 L30,25" stroke="#000" strokeWidth="1" />
          <path d="M25,25 L25,35" stroke="#000" strokeWidth="1" />
          <path d="M15,35 L35,35" stroke="#000" strokeWidth="1" />
          <path d="M15,45 L35,45" stroke="#000" strokeWidth="1" />
          <path d="M25,35 L15,45" stroke="#000" strokeWidth="1.5" />
        </svg>
      );
      break;
    default: // motor
      svgIcon = (
        <svg width="50" height="50" viewBox="0 0 60 60">
          <circle cx="30" cy="30" r="20" fill="none" stroke="#000" strokeWidth="2" />
          <circle cx="30" cy="30" r="5" fill="none" stroke="#000" strokeWidth="1" />
          <path d="M30,10 L30,20 M30,40 L30,50 M10,30 L20,30 M40,30 L50,30" stroke="#000" strokeWidth="1.5" />
          <text x="30" y="30" fontSize="14" textAnchor="middle" dominantBaseline="central" stroke="none" fill="#000">M</text>
        </svg>
      );
  }
  
  return (
    <div style={{ position: 'relative' }}>
      <Tooltip title={`${data.label}${data.specification ? ` - ${data.specification}` : ''}`} arrow placement="top">
        <Box sx={style}>
          {svgIcon}
          
          {/* Label with specification */}
          <Typography 
            variant="caption" 
            sx={{ 
              position: 'absolute', 
              bottom: '-25px', 
              left: '50%', 
              transform: 'translateX(-50%)',
              whiteSpace: 'nowrap',
              fontSize: '0.7rem',
              fontWeight: 'bold',
              textAlign: 'center',
              maxWidth: '100px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {data.label}
            {data.specification && (
              <Typography 
                variant="caption" 
                display="block" 
                sx={{ 
                  fontSize: '0.65rem', 
                  color: 'text.secondary',
                  fontWeight: 'normal'
                }}
              >
                {data.specification}
              </Typography>
            )}
          </Typography>
        </Box>
      </Tooltip>
      
      {/* Handles */}
      <Handle
        type="source"
        position={Position.Right}
        id="out"
        style={{ background: '#555', width: '8px', height: '8px' }}
        isConnectable={isConnectable}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="in"
        style={{ background: '#555', width: '8px', height: '8px' }}
        isConnectable={isConnectable}
      />
    </div>
  );
};

export const TextLabelNode: React.FC<NodeProps<HvacNodeData>> = ({ data }) => {
  return (
    <div style={{ position: 'relative' }}>
      <Typography 
        variant="caption" 
        sx={{ 
          padding: '2px 6px',
          background: 'rgba(255, 255, 255, 0.8)',
          border: '1px solid #ccc',
          borderRadius: '3px',
          fontSize: '0.8rem',
          fontWeight: 'bold',
          boxShadow: '0px 1px 3px rgba(0,0,0,0.1)'
        }}
      >
        {data.label}
      </Typography>
    </div>
  );
};

export const DefaultNode: React.FC<NodeProps<HvacNodeData>> = ({ data, isConnectable }) => {
  return (
    <div style={{ position: 'relative' }}>
      <Box sx={{
        ...baseStyle,
        ...componentStyles.default,
      }}>
        {/* Default symbol */}
        <Typography variant="body2">{data.label}</Typography>
        
        {/* Capacity if available */}
        {data.capacity && (
          <Typography 
            variant="caption" 
            sx={{ 
              position: 'absolute', 
              bottom: '-20px', 
              left: '50%', 
              transform: 'translateX(-50%)',
              fontSize: '0.7rem',
              color: 'text.secondary',
            }}
          >
            {data.capacity}
          </Typography>
        )}
      </Box>
      
      {/* Handles */}
      <Handle
        type="source"
        position={Position.Right}
        id="out"
        style={{ background: '#555', width: '8px', height: '8px' }}
        isConnectable={isConnectable}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="in"
        style={{ background: '#555', width: '8px', height: '8px' }}
        isConnectable={isConnectable}
      />
    </div>
  );
};

// Function that determines the right component based on type
export const getNodeComponent = (type: string): React.FC<NodeProps<HvacNodeData>> => {
  const typeMap: Record<string, React.FC<NodeProps<HvacNodeData>>> = {
    // Compressors
    compressor: CompressorNode,
    reciprocating_compressor: CompressorNode,
    scroll_compressor: CompressorNode,
    screw_compressor: CompressorNode,
    centrifugal_compressor: CompressorNode,
    
    // Heat exchangers
    condenser: CondenserNode,
    air_cooled_condenser: CondenserNode,
    water_cooled_condenser: CondenserNode,
    evaporative_condenser: CondenserNode,
    
    evaporator: EvaporatorNode,
    dx_evaporator: EvaporatorNode,
    flooded_evaporator: EvaporatorNode,
    
    // Valves
    valve: ValveNode,
    ball_valve: ValveNode,
    check_valve: ValveNode,
    expansion_valve: ValveNode,
    solenoid_valve: ValveNode,
    pressure_regulating_valve: ValveNode,
    
    // Controllers
    controller: ControllerNode,
    pressure_controller: ControllerNode,
    temperature_controller: ControllerNode,
    plc: ControllerNode,
    
    // Vessels
    receiver: ReceiverNode,
    high_pressure_receiver: ReceiverNode,
    low_pressure_receiver: ReceiverNode,
    
    // Filters
    filter: FilterNode,
    filter_drier: FilterNode,
    oil_separator: FilterNode,
    
    // Electrical
    electrical: ElectricalNode,
    motor: ElectricalNode,
    vfd: ElectricalNode,
    contactor: ElectricalNode,
    relay: ElectricalNode,
    circuit_breaker: ElectricalNode,
    
    // Special
    textLabel: TextLabelNode,
    
    // Default
    default: DefaultNode,
  };
  
  return typeMap[type?.toLowerCase()] || DefaultNode;
};