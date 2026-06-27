/*
 * IndustryNodes.tsx
 * React Flow nodes for industry standard HVAC symbols
 * Date: 2025-04-27 16:30:00
 * Path: C:\Users\Erfan\cool-assist-clean\frontend\src\components\diagram\IndustryNodes.tsx
 */

import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Box, Tooltip, Typography } from '@mui/material';
import { 
  IndustrialSymbols,
  getRefrigerantColor,
  getTemperatureColor
} from './IndustrialSymbols';

// Industrial node data type definition
export interface IndustrialNodeData {
  label: string;
  componentType?: string;
  subType?: string;
  manufacturer?: string;   // e.g. Danfoss, York, Carrier, etc.
  refrigerantType?: string; // e.g. Ammonia, R134a, R410A, etc.
  capacity?: string;       // e.g. "10 kW", "5 tons", etc.
  model?: string;          // e.g. model number
  temperature?: number;    // operating temperature
  pressure?: number;       // operating pressure
  flowDirection?: 'left-to-right' | 'right-to-left' | 'top-to-bottom' | 'bottom-to-top';
}

// Component SVG size mapping
const getNodeDimensions = (type: string): { width: number, height: number } => {
  // Default dimensions
  const defaultDims = { width: 60, height: 60 };
  
  // Map component types to their preferred dimensions
  const dimensionsMap: Record<string, { width: number, height: number }> = {
    // Compressors
    reciprocating_compressor: { width: 60, height: 60 },
    screw_compressor: { width: 70, height: 60 },
    scroll_compressor: { width: 60, height: 60 },
    centrifugal_compressor: { width: 80, height: 60 },
    
    // Heat exchangers
    water_cooled_condenser: { width: 100, height: 60 },
    air_cooled_condenser: { width: 120, height: 80 },
    evaporative_condenser: { width: 120, height: 100 },
    dx_evaporator: { width: 100, height: 60 },
    flooded_evaporator: { width: 100, height: 60 },
    
    // Valves
    ball_valve: { width: 50, height: 50 },
    check_valve: { width: 50, height: 50 },
    expansion_valve: { width: 70, height: 60 },
    solenoid_valve: { width: 60, height: 70 },
    pressure_regulating_valve: { width: 80, height: 70 },
    
    // Vessels
    receiver: { width: 60, height: 100 },
    hp_receiver: { width: 60, height: 100 },
    lp_receiver: { width: 60, height: 100 },
    oil_separator: { width: 60, height: 110 },
    
    // Filters
    filter_drier: { width: 50, height: 70 },
  };
  
  // Find dimensions by type or return default
  return dimensionsMap[type.toLowerCase()] || defaultDims;
};

// Get SVG component by type
const getSymbolComponent = (type: string): React.FC<any> => {
  // Clean up type string
  const cleanType = type.toLowerCase()
    .replace(/_/g, '')
    .replace(/\s+/g, '')
    .replace(/-/g, '');
  
  // Map to symbol component
  if (cleanType.includes('reciprocating') || cleanType.includes('piston')) {
    return IndustrialSymbols.ReciprocatingCompressor;
  }
  if (cleanType.includes('screw')) {
    return IndustrialSymbols.ScrewCompressor;
  }
  if (cleanType.includes('scroll')) {
    return IndustrialSymbols.ScrollCompressor;
  }
  if (cleanType.includes('centrifugal')) {
    return IndustrialSymbols.CentrifugalCompressor;
  }
  
  if (cleanType.includes('condenser') || cleanType.includes('condensing')) {
    if (cleanType.includes('water')) {
      return IndustrialSymbols.WaterCooledCondenser;
    }
    if (cleanType.includes('air')) {
      return IndustrialSymbols.AirCooledCondenser;
    }
    if (cleanType.includes('evaporative')) {
      return IndustrialSymbols.EvaporativeCondenser;
    }
    return IndustrialSymbols.WaterCooledCondenser; // Default
  }
  
  if (cleanType.includes('evaporator')) {
    if (cleanType.includes('dx') || cleanType.includes('direct')) {
      return IndustrialSymbols.DXEvaporator;
    }
    if (cleanType.includes('flood')) {
      return IndustrialSymbols.FloodedEvaporator;
    }
    return IndustrialSymbols.DXEvaporator; // Default
  }
  
  if (cleanType.includes('valve')) {
    if (cleanType.includes('ball')) {
      return IndustrialSymbols.BallValve;
    }
    if (cleanType.includes('check') || cleanType.includes('nonreturn')) {
      return IndustrialSymbols.CheckValve;
    }
    if (cleanType.includes('expansion') || cleanType.includes('txv') || cleanType.includes('thermostatic')) {
      return IndustrialSymbols.ExpansionValve;
    }
    if (cleanType.includes('solenoid')) {
      return IndustrialSymbols.SolenoidValve;
    }
    if (cleanType.includes('pressure') || cleanType.includes('regulating')) {
      return IndustrialSymbols.PressureRegulatingValve;
    }
    return IndustrialSymbols.BallValve; // Default valve
  }
  
  if (cleanType.includes('receiver')) {
    if (cleanType.includes('high') || cleanType.includes('hp')) {
      return IndustrialSymbols.HPReceiver;
    }
    if (cleanType.includes('low') || cleanType.includes('lp')) {
      return IndustrialSymbols.LPReceiver;
    }
    return IndustrialSymbols.Receiver; // Default
  }
  
  if (cleanType.includes('separator') && cleanType.includes('oil')) {
    return IndustrialSymbols.OilSeparator;
  }
  
  if (cleanType.includes('filter') || cleanType.includes('drier')) {
    return IndustrialSymbols.FilterDrier;
  }
  
  // Default to reciprocating compressor if no match
  return IndustrialSymbols.ReciprocatingCompressor;
};

// Generic Industrial Node that renders the appropriate symbol
const IndustrialNode: React.FC<NodeProps<IndustrialNodeData>> = ({ 
  id, 
  data, 
  isConnectable,
  selected
}) => {
  // Get component type (explicit or from label)
  const componentType = data.componentType || data.subType || 'default';
  
  // Get dimensions for this component type
  const { width, height } = getNodeDimensions(componentType);
  
  // Get the appropriate SVG component
  const SymbolComponent = getSymbolComponent(componentType);
  
  return (
    <div style={{ position: 'relative' }}>
      <Tooltip 
        title={
          <React.Fragment>
            <Typography variant="subtitle2">{data.label}</Typography>
            {data.capacity && <Typography variant="body2">Capacity: {data.capacity}</Typography>}
            {data.refrigerantType && <Typography variant="body2">Refrigerant: {data.refrigerantType}</Typography>}
            {data.model && <Typography variant="body2">Model: {data.model}</Typography>}
            {data.manufacturer && <Typography variant="body2">Manufacturer: {data.manufacturer}</Typography>}
            {data.temperature && <Typography variant="body2">Temperature: {data.temperature}°C</Typography>}
            {data.pressure && <Typography variant="body2">Pressure: {data.pressure} bar</Typography>}
          </React.Fragment>
        }
        arrow
        placement="top"
      >
        <Box sx={{ 
          border: selected ? '2px solid #1976d2' : 'none',
          borderRadius: '4px',
          padding: selected ? '4px' : '6px',
          transition: 'all 0.2s ease',
        }}>
          {/* Render the SVG component */}
          <SymbolComponent
            width={width}
            height={height}
            refrigerantType={data.refrigerantType}
            manufacturer={data.manufacturer}
          />
          
          {/* Label below the symbol */}
          <Box sx={{ 
            position: 'absolute',
            bottom: '-30px',
            left: '50%',
            transform: 'translateX(-50%)',
            textAlign: 'center',
            whiteSpace: 'nowrap',
            maxWidth: width * 1.5,
          }}>
            <Typography 
              variant="caption" 
              sx={{ 
                fontSize: '0.75rem',
                fontWeight: 'bold',
                display: 'block',
                lineHeight: 1.1,
              }}
            >
              {data.label}
            </Typography>
            
            {data.capacity && (
              <Typography 
                variant="caption" 
                sx={{ 
                  fontSize: '0.65rem',
                  color: 'text.secondary',
                  display: 'block',
                  lineHeight: 1.1,
                }}
              >
                {data.capacity}
              </Typography>
            )}
          </Box>
        </Box>
      </Tooltip>
      
      {/* Connection Handles - positioned based on component type */}
      <Handle
        type="target"
        position={Position.Left}
        id="in"
        style={{ background: '#555', width: '8px', height: '8px' }}
        isConnectable={isConnectable}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="out"
        style={{ background: '#555', width: '8px', height: '8px' }}
        isConnectable={isConnectable}
      />
      
      {/* Additional handles for specific components */}
      {componentType.includes('receiver') && (
        <Handle
          type="source"
          position={Position.Bottom}
          id="liquid-out"
          style={{ background: '#555', width: '8px', height: '8px' }}
          isConnectable={isConnectable}
        />
      )}
      {componentType.includes('oil_separator') && (
        <Handle
          type="source"
          position={Position.Bottom}
          id="oil-drain"
          style={{ background: '#d4a373', width: '8px', height: '8px' }}
          isConnectable={isConnectable}
        />
      )}
    </div>
  );
};

// Node for text labels
const TextLabelNode: React.FC<NodeProps<IndustrialNodeData>> = ({ data }) => {
  return (
    <div style={{ position: 'relative' }}>
      <Typography 
        variant="body2" 
        sx={{ 
          padding: '3px 8px',
          background: 'rgba(255, 255, 255, 0.85)',
          border: '1px solid #ccc',
          borderRadius: '4px',
          fontWeight: '500',
          boxShadow: '0px 1px 3px rgba(0,0,0,0.1)',
          maxWidth: '150px',
        }}
      >
        {data.label}
      </Typography>
    </div>
  );
};

// Export all node types
export const industryNodeTypes = {
  industrial: IndustrialNode,
  textLabel: TextLabelNode,
};

export default industryNodeTypes;