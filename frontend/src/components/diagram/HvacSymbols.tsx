import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Box, Typography, Tooltip } from '@mui/material';

// Node data definition with expanded properties
export interface HvacNodeData {
  label: string;
  componentType?: string; // General category (e.g., 'Valve', 'Pump', 'Compressor')
  subType?: string;       // More specific type (e.g., "ball", "centrifugal", "screw", "ICS", "EVR")
  refrigerantType?: string; // R-22, R-410A, Ammonia, CO2, Water, Glycol etc.
  fluidType?: 'refrigerant' | 'water' | 'glycol' | 'steam' | 'oil' | 'air' | string; // Type of fluid handled
  size?: number | string; // Pipe size (DN) or component size designation
  capacity?: string;      // Capacity information (kW, tons, m³/h, etc.)
  color?: string;         // Custom color override
  rotation?: number;      // Rotation angle
  temperature?: number;   // Operating temperature
  pressure?: number | string; // Operating pressure or pressure rating
  flowDirection?: 'left-to-right' | 'right-to-left' | 'top-to-bottom' | 'bottom-to-top'; // For specific directional symbols
  specification?: string; // Additional specs like model number, material
  manufacturer?: string;  // e.g., "Danfoss", "Bitzer", "Grundfos"
  inputPorts?: string[];  // Custom input port IDs
  outputPorts?: string[]; // Custom output port IDs
  numberOfFans?: number;  // For multi-fan units like cold storage evaporators
  vesselType?: 'receiver' | 'separator' | 'accumulator' | 'expansion_tank' | string; // Type of vessel
  fittingType?: 'elbow' | 'tee' | 'reducer' | 'cross' | string; // Type of piping fitting
  pumpType?: 'centrifugal' | 'positive_displacement' | 'inline' | string; // Type of pump
  fanCoilType?: 'floor' | 'ceiling' | 'wall' | 'cassette' | 'duct' | string; // Type of Fan Coil Unit
}

// DIN standard pipe sizes (Example - can be expanded)
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
  // Add more sizes as needed
};

// Temperature-based coloring according to standards (DIN 2403 example)
const getTemperatureColor = (temp?: number): string => {
  if (temp === undefined) return '#555'; // Default grey if no temp data
  // Simplified standard temperature-based pipe coloring (DIN 2403 inspired)
  if (temp < 0) return '#00a2ed';         // Light Blue (Cold < 0°C)
  if (temp < 100) return '#71bf44';       // Green (Water < 100°C)
  if (temp < 200) return '#ed1c24';       // Red (Hot Water/Steam < 200°C)
  if (temp < 300) return '#a8a8a8';       // Silver-Grey (Steam 200-300°C)
  // Add more ranges as needed
  return '#555';                           // Default grey for other temps
};

// --- Constants ---
const DANFOSS_COLOR = '#e31837'; // Danfoss Red Brand Color

// Base style for all equipment components
const baseStyle = {
  border: '1px solid #555', // Slightly thinner border for cleaner look
  borderRadius: '4px',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  position: 'relative' as const,
  background: '#fff',
  width: 'auto', // Allow content (SVG) to determine size
  height: 'auto',
  padding: '5px', // Add padding around SVG
  minWidth: '50px', // Minimum size
  minHeight: '50px',
};

// Style variations by component type (Define base visual cues)
// Note: The primary visual identification comes from the SVG symbol.
const componentStyles: Record<string, any> = {
  // Compressors
  compressor: { background: '#d1e8ff' },
  reciprocating_compressor: { background: '#d1e8ff', borderRadius: '50%'}, // Often circular symbol base
  screw_compressor: { background: '#b3cbff', borderRadius: '10px' }, // Often rectangular/oval base
  scroll_compressor: { background: '#c2daff', borderRadius: '50%' },
  centrifugal_compressor: { background: '#a4bcff', borderRadius: '30%' },

  // Condensers / Heat Exchangers
  condenser: { background: '#c6ecde' },
  air_cooled_condenser: { background: '#a8e0cc' },
  water_cooled_condenser: { background: '#b7e6d5' },
  evaporative_condenser: { background: '#99dac3' },
  shell_tube_heat_exchanger: { background: '#d0e0f0' },
  plate_heat_exchanger: { background: '#c0d0e0' },

  // Evaporators
  evaporator: { background: '#e6f0ff' },
  dx_evaporator: { background: '#d7e1f0' },
  flooded_evaporator: { background: '#c8d2e1' },
  cold_storage_evaporator: { background: '#b8c2d1' },

  // Valves
  valve: { background: '#ffe8cc', transform: 'rotate(0deg)' }, // Reset rotation, let SVG handle it
  gate_valve: { background: '#fff0db' },
  globe_valve: { background: '#fff0db' },
  ball_valve: { background: '#ffdeb3' },
  butterfly_valve: { background: '#ffdeb3' },
  check_valve: { background: '#ffd499' },
  solenoid_valve: { background: '#ffcb80' },
  expansion_valve: { background: '#ffc166' }, // TEV, EEV
  pressure_regulating_valve: { background: '#ffb84d' }, // KVP, KVL, etc.
  safety_valve: { background: '#ffac33' },
  control_valve: { background: '#ffac33' }, // General modulating valve
  three_way_valve: { background: '#ffac33' },
  four_way_valve: { background: '#ffac33' }, // Reversing valve

  // Pumps
  pump: { background: '#fadde1', borderRadius: '50%' }, // Often circular
  centrifugal_pump: { background: '#fadde1' },
  positive_displacement_pump: { background: '#f8c8d2' },
  inline_pump: { background: '#f6b8c3' },

  // Vessels and Tanks
  vessel: { background: '#e0e0e0', borderRadius: '10px' }, // General vessel
  receiver: { background: '#e0e0e0' }, // HP/LP Receiver
  separator: { background: '#d1d1d1' }, // Oil Separator, Suction Accumulator
  accumulator: { background: '#c2c2c2' },
  expansion_tank: { background: '#b3b3b3' },

  // Filters, Strainers, Driers
  filter: { background: '#f5f5f5', borderRadius: '5px' },
  strainer: { background: '#f5f5f5', borderRadius: '5px' },
  filter_drier: { background: '#e6e6e6', borderRadius: '5px' },

  // HVAC Units
  fan_coil_unit: { background: '#d9ead3' },
  air_handling_unit: { background: '#c8e0b4', minWidth: '150px', minHeight: '80px' },
  boiler: { background: '#f4cccc' },
  chiller: { background: '#cfe2f3', minWidth: '150px', minHeight: '100px' },

  // Ventilation
  fan: { background: '#fff2cc', borderRadius: '50%' },
  damper: { background: '#fce5cd' },
  grille_diffuser: { background: '#e1e1e1' },

  // Controls and Instruments
  controller: { background: '#f0f0f0' },
  sensor: { background: '#f0f0f0', borderRadius: '50%' }, // Temp, Pressure, Humidity sensors
  gauge: { background: '#e1e1e1', borderRadius: '50%' }, // Pressure Gauge, Temp Gauge
  flow_meter: { background: '#d2d2d2' },
  plc: { background: '#c3c3c3' },

  // Electrical
  motor: { background: '#ffe6ee', borderRadius: '50%' },
  vfd: { background: '#ffd9e6' },
  contactor: { background: '#ffccdd' },
  relay: { background: '#ffbfd4' },
  circuit_breaker: { background: '#ffb3cb' },
  transformer: { background: '#ffe0e0' },

  // Piping Fittings (Often smaller, no background needed)
  piping_fitting: { background: 'none', border: 'none', padding: '0' },
  elbow: { background: 'none', border: 'none', padding: '0' },
  tee: { background: 'none', border: 'none', padding: '0' },
  reducer: { background: 'none', border: 'none', padding: '0' },

  // Default / Text
  textLabel: { background: 'rgba(255, 255, 255, 0.8)', border: '1px solid #ccc', padding: '2px 6px', borderRadius: '3px', boxShadow: '0px 1px 3px rgba(0,0,0,0.1)', minWidth: '0', minHeight: '0' },
  default: { minWidth: '60px', minHeight: '40px', background: '#eee' },
};

// Refrigerant/Fluid specific styling (Color hints based on type)
const getFluidStyle = (fluidType?: string, refrigerantType?: string, manufacturer?: string): any => {
  let style: any = {};
  const effectiveType = fluidType || refrigerantType; // Prioritize fluidType if available
  const isDanfoss = manufacturer?.toLowerCase().includes('danfoss');

  if (!effectiveType && !isDanfoss) return {};

  // Priority for Danfoss Branding on relevant components
  if (isDanfoss) {
    style.borderColor = DANFOSS_COLOR;
    style.borderWidth = '2px'; // Make Danfoss components stand out slightly more
  }

  // Fluid-based color hints (can override Danfoss border if needed, or be combined)
  const fluidStyles: Record<string, any> = {
    // Refrigerants (Example)
    'R-22': { borderColor: '#9fc5e8' },
    'R-410A': { borderColor: '#b6d7a8' },
    'R-134a': { borderColor: '#f9cb9c' },
    'R-404A': { borderColor: '#ead1dc' },
    'R-407C': { borderColor: '#d5a6bd' },
    'R-32': { borderColor: '#a2c4c9' },
    'Ammonia': { borderColor: '#f1c232', borderWidth: '3px' }, // Thicker border for Ammonia hazard
    'CO2': { borderColor: '#cc0000', borderWidth: '3px' },   // Thicker border for CO2 high pressure

    // Other Fluids (Example based on DIN 2403 or common practice)
    'Water': { borderColor: '#00a2ed' },        // Blue for cold water
    'Chilled Water': { borderColor: '#0057b8' }, // Darker blue
    'Hot Water': { borderColor: '#ed1c24' },    // Red
    'Glycol': { borderColor: '#9370db' },        // Purple/Violet for Glycol
    'Steam': { borderColor: '#a8a8a8' },        // Silver/Grey for Steam
    'Oil': { borderColor: '#d4a373' },        // Brown/Tan for Oil
    'Air': { borderColor: '#fefefe' },        // White/Light Grey for Air/Gases (might be hard to see)
    'Natural Gas': { borderColor: '#ffd700' }, // Yellow for Gas
  };

  if (effectiveType) {
    for (const [type, typeStyle] of Object.entries(fluidStyles)) {
      if (effectiveType.toLowerCase().includes(type.toLowerCase())) {
        // Combine styles, ensuring Danfoss border width might persist unless fluid overrides it
        style = { ...typeStyle, ...style };
        if (isDanfoss && !style.borderWidth) { // Keep Danfoss thicker border if fluid doesn't specify one
             style.borderWidth = '2px';
        }
        break; // Stop after first match
      }
    }
  }

  return style;
};


// --------------- Helper for Label Rendering ---------------
const NodeLabel: React.FC<{ data: HvacNodeData, isDanfoss?: boolean }> = ({ data, isDanfoss = false }) => (
  <Typography
    variant="caption"
    sx={{
      position: 'absolute',
      bottom: '-25px', // Adjust as needed
      left: '50%',
      transform: 'translateX(-50%)',
      whiteSpace: 'nowrap',
      fontSize: '0.7rem',
      fontWeight: 'bold',
      textAlign: 'center',
      maxWidth: '150px', // Increased max width
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      color: isDanfoss ? DANFOSS_COLOR : 'inherit',
      cursor: 'default', // Prevent text selection on label drag
    }}
  >
    {`${isDanfoss ? 'Danfoss ' : ''}${data.label}`}
    {(data.capacity || data.specification || data.size) && (
      <Typography
        variant="caption"
        display="block"
        sx={{
          fontSize: '0.65rem',
          color: isDanfoss ? DANFOSS_COLOR : 'text.secondary',
          fontWeight: 'normal',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {/* Show one detail: Capacity > Spec > Size */}
      </Typography>
    )}
  </Typography>
);

// --------------- Component Definitions ---------------

// --- Compressors ---
export const CompressorNode: React.FC<NodeProps<HvacNodeData>> = ({ data, isConnectable }) => {
  let compressorType = 'reciprocating_compressor'; // default: Piston/Reciprocating
  let svgIcon;

  // Determine specific type from subType or label
  const typeHint = (data.subType || data.label || '').toLowerCase();
  if (typeHint.includes('screw')) compressorType = 'screw_compressor';
  else if (typeHint.includes('scroll')) compressorType = 'scroll_compressor';
  else if (typeHint.includes('centrifugal')) compressorType = 'centrifugal_compressor';
  else if (typeHint.includes('piston') || typeHint.includes('reciprocating')) compressorType = 'reciprocating_compressor';

  const isDanfoss = data.manufacturer?.toLowerCase().includes('danfoss');
  const style = {
    ...baseStyle,
    ...(componentStyles[compressorType] || componentStyles.compressor),
    ...getFluidStyle(data.fluidType, data.refrigerantType, data.manufacturer),
  };

  // Standard P&ID Symbols (simplified)
  switch(compressorType) {
    case 'screw_compressor':
      svgIcon = ( // Symbol often looks like two intermeshed screws or a long rectangle
        <svg width="60" height="40" viewBox="0 0 70 50">
          <rect x="5" y="10" width="60" height="30" rx="5" ry="5" fill="none" stroke="#000" strokeWidth="1.5" />
          <path d="M15 20 Q 25 15, 35 20 T 55 20" stroke="#000" strokeWidth="1" fill="none" />
          <path d="M15 30 Q 25 25, 35 30 T 55 30" stroke="#000" strokeWidth="1" fill="none" />
          {isDanfoss && <circle cx="60" cy="10" r="4" fill={DANFOSS_COLOR} stroke="#000" strokeWidth="0.5"/>}
        </svg>
      );
      break;
    case 'scroll_compressor':
      svgIcon = ( // Symbol often circular with internal spiral
        <svg width="50" height="50" viewBox="0 0 60 60">
          <circle cx="30" cy="30" r="25" fill="none" stroke="#000" strokeWidth="1.5" />
          <path d="M30 30 m -15 0 a 15 15 0 1 0 30 0 a 12 12 0 1 0 -24 0 a 9 9 0 1 0 18 0 a 6 6 0 1 0 -12 0 a 3 3 0 1 0 6 0" fill="none" stroke="#000" strokeWidth="1"/>
          {isDanfoss && <circle cx="50" cy="10" r="4" fill={DANFOSS_COLOR} stroke="#000" strokeWidth="0.5"/>}
        </svg>
      );
      break;
    case 'centrifugal_compressor':
      svgIcon = ( // Symbol often circular with radial blades/arrow
        <svg width="50" height="50" viewBox="0 0 60 60">
          <circle cx="30" cy="30" r="25" fill="none" stroke="#000" strokeWidth="1.5" />
          <path d="M30 10 V 50 M10 30 H 50 M15 15 L 45 45 M15 45 L 45 15" stroke="#000" strokeWidth="1" />
           <path d="M 30 5 A 25 25 0 0 1 55 30 L 50 30 A 20 20 0 0 0 30 10 Z" fill="#000" fillOpacity="0.2" /> {/* Direction indicator */}
          {isDanfoss && <circle cx="50" cy="10" r="4" fill={DANFOSS_COLOR} stroke="#000" strokeWidth="0.5"/>}
        </svg>
      );
      break;
    case 'reciprocating_compressor': // Piston compressor
    default:
      svgIcon = ( // Symbol often circular with a 'T' or piston indicator
        <svg width="50" height="50" viewBox="0 0 60 60">
          <circle cx="30" cy="30" r="25" fill="none" stroke="#000" strokeWidth="1.5" />
          <rect x="20" y="20" width="20" height="10" fill="none" stroke="#000" strokeWidth="1" /> {/* Piston head */}
          <line x1="30" y1="30" x2="30" y2="45" stroke="#000" strokeWidth="1" /> {/* Connecting rod */}
          {isDanfoss && <circle cx="50" cy="10" r="4" fill={DANFOSS_COLOR} stroke="#000" strokeWidth="0.5"/>}
        </svg>
      );
  }

  return (
    <div style={{ position: 'relative' }}>
      <Tooltip title={`${isDanfoss ? 'Danfoss ' : ''}${data.label}${data.capacity ? ` - ${data.capacity}` : ''}${data.specification ? ` (${data.specification})` : ''}`} arrow placement="top">
        <Box sx={style}>
          {svgIcon}
          <NodeLabel data={data} isDanfoss={isDanfoss} />
        </Box>
      </Tooltip>
      <Handle type="target" position={Position.Left} id="in" style={{ background: '#555' }} isConnectable={isConnectable} />
      <Handle type="source" position={Position.Right} id="out" style={{ background: '#555' }} isConnectable={isConnectable} />
       {/* Optional Oil Handle */}
       {(compressorType === 'screw_compressor' || compressorType === 'reciprocating_compressor') && (
         <Handle type="source" position={Position.Bottom} id="oil_out" style={{ background: '#d4a373', left: '75%' }} isConnectable={isConnectable} />
       )}
       {(compressorType === 'screw_compressor' || compressorType === 'reciprocating_compressor') && (
         <Handle type="target" position={Position.Bottom} id="oil_in" style={{ background: '#d4a373', left: '25%' }} isConnectable={isConnectable} />
       )}
    </div>
  );
};

// --- Heat Exchangers (Condensers, Evaporators, General) ---
export const CondenserNode: React.FC<NodeProps<HvacNodeData>> = ({ data, isConnectable }) => {
  let condenserType = 'air_cooled_condenser'; // Default to air-cooled
  let svgIcon;
  const typeHint = (data.subType || data.label || '').toLowerCase();

  if (typeHint.includes('water')) condenserType = 'water_cooled_condenser';
  else if (typeHint.includes('evaporative')) condenserType = 'evaporative_condenser';
  else if (typeHint.includes('shell') && typeHint.includes('tube')) condenserType = 'shell_tube_heat_exchanger'; // Use general HX symbol
  else if (typeHint.includes('plate')) condenserType = 'plate_heat_exchanger'; // Use general HX symbol
  else if (typeHint.includes('air')) condenserType = 'air_cooled_condenser';

  const isDanfoss = data.manufacturer?.toLowerCase().includes('danfoss'); // Less common for condensers, but possible
  const style = {
    ...baseStyle,
    ...(componentStyles[condenserType] || componentStyles.condenser),
    ...getFluidStyle(data.fluidType, data.refrigerantType, data.manufacturer),
  };

  // Standard P&ID Symbols
  switch(condenserType) {
    case 'water_cooled_condenser': // Often shell & tube or plate, show water connections
    case 'shell_tube_heat_exchanger':
      svgIcon = ( // Generic Shell & Tube Symbol
        <svg width="80" height="50" viewBox="0 0 90 60">
          <rect x="5" y="10" width="80" height="40" rx="10" ry="10" fill="none" stroke="#000" strokeWidth="1.5" /> {/* Shell */}
          {/* Tubes (simplified) */}
          <line x1="15" y1="20" x2="75" y2="20" stroke="#000" strokeWidth="1" />
          <line x1="15" y1="30" x2="75" y2="30" stroke="#000" strokeWidth="1" />
          <line x1="15" y1="40" x2="75" y2="40" stroke="#000" strokeWidth="1" />
           {/* Baffles (optional indicator) */}
           <line x1="30" y1="10" x2="30" y2="50" stroke="#000" strokeWidth="0.5" strokeDasharray="3,3"/>
           <line x1="60" y1="10" x2="60" y2="50" stroke="#000" strokeWidth="0.5" strokeDasharray="3,3"/>
        </svg>
      );
      break;
     case 'plate_heat_exchanger':
       svgIcon = ( // Generic Plate Heat Exchanger symbol (stacked plates)
         <svg width="60" height="60" viewBox="0 0 70 70">
           <rect x="5" y="5" width="60" height="60" rx="2" ry="2" fill="none" stroke="#000" strokeWidth="1.5" />
           {/* Plate indicators */}
           <line x1="15" y1="15" x2="55" y2="15" stroke="#000" strokeWidth="1" />
           <line x1="15" y1="25" x2="55" y2="25" stroke="#000" strokeWidth="1" />
           <line x1="15" y1="35" x2="55" y2="35" stroke="#000" strokeWidth="1" />
           <line x1="15" y1="45" x2="55" y2="45" stroke="#000" strokeWidth="1" />
           <line x1="15" y1="55" x2="55" y2="55" stroke="#000" strokeWidth="1" />
           {/* Port indicators (simplified) */}
           <circle cx="10" cy="10" r="3" fill="#fff" stroke="#000" strokeWidth="1"/>
           <circle cx="60" cy="10" r="3" fill="#fff" stroke="#000" strokeWidth="1"/>
           <circle cx="10" cy="60" r="3" fill="#fff" stroke="#000" strokeWidth="1"/>
           <circle cx="60" cy="60" r="3" fill="#fff" stroke="#000" strokeWidth="1"/>
         </svg>
       );
       break;
    case 'evaporative_condenser':
      svgIcon = ( // Coil with spray and fan symbol
        <svg width="70" height="70" viewBox="0 0 80 80">
          <rect x="5" y="15" width="70" height="50" rx="2" ry="2" fill="none" stroke="#000" strokeWidth="1.5" /> {/* Housing */}
          {/* Coil (simplified zigzag) */}
          <path d="M15 25 L 65 25 L 15 35 L 65 35 L 15 45 L 65 45 L 15 55 L 65 55" stroke="#000" strokeWidth="1" fill="none"/>
          {/* Fan Symbol */}
          <circle cx="40" cy="10" r="8" fill="none" stroke="#000" strokeWidth="1" />
          <path d="M40 2 L 40 18 M32 10 L 48 10" stroke="#000" strokeWidth="0.5"/>
          {/* Spray Symbol (simplified drops) */}
          <circle cx="25" cy="70" r="1.5" fill="#00a2ed" />
          <circle cx="35" cy="70" r="1.5" fill="#00a2ed" />
          <circle cx="45" cy="70" r="1.5" fill="#00a2ed" />
          <circle cx="55" cy="70" r="1.5" fill="#00a2ed" />
          <path d="M 20 65 L 60 65" stroke="#00a2ed" strokeWidth="1"/>
        </svg>
      );
      break;
    case 'air_cooled_condenser':
    default:
      svgIcon = ( // Coil with fan symbol
        <svg width="80" height="60" viewBox="0 0 90 70">
           <rect x="5" y="15" width="80" height="50" rx="2" ry="2" fill="none" stroke="#000" strokeWidth="1.5" /> {/* Housing/Coil Area */}
          {/* Coil (simplified fins/tubes) */}
           <line x1="15" y1="20" x2="75" y2="20" stroke="#000" strokeWidth="0.5" />
           <line x1="15" y1="25" x2="75" y2="25" stroke="#000" strokeWidth="0.5" />
           <line x1="15" y1="30" x2="75" y2="30" stroke="#000" strokeWidth="0.5" />
           <line x1="15" y1="35" x2="75" y2="35" stroke="#000" strokeWidth="0.5" />
           <line x1="15" y1="40" x2="75" y2="40" stroke="#000" strokeWidth="0.5" />
           <line x1="15" y1="45" x2="75" y2="45" stroke="#000" strokeWidth="0.5" />
           <line x1="15" y1="50" x2="75" y2="50" stroke="#000" strokeWidth="0.5" />
           <line x1="15" y1="55" x2="75" y2="55" stroke="#000" strokeWidth="0.5" />
           <line x1="15" y1="60" x2="75" y2="60" stroke="#000" strokeWidth="0.5" />
          {/* Fan Symbol (Simplified) */}
          <circle cx="45" cy="10" r="8" fill="none" stroke="#000" strokeWidth="1" />
          <path d="M45 2 V 18 M37 10 H 53" stroke="#000" strokeWidth="0.5" />
          {/* Optional: Multiple fans */}
          {/* <circle cx="25" cy="10" r="8" fill="none" stroke="#000" strokeWidth="1" />
          <path d="M25 2 V 18 M17 10 H 33" stroke="#000" strokeWidth="0.5" />
          <circle cx="65" cy="10" r="8" fill="none" stroke="#000" strokeWidth="1" />
          <path d="M65 2 V 18 M57 10 H 73" stroke="#000" strokeWidth="0.5" /> */}
        </svg>
      );
  }

  // Determine Handles based on type
  let handles: React.ReactNode[] = [
    <Handle key="ref-in" type="target" position={Position.Left} id="refrigerant_in" style={{ background: '#cc0000', top: '30%' }} isConnectable={isConnectable} />, // Red for Hot Gas In
    <Handle key="ref-out" type="source" position={Position.Right} id="refrigerant_out" style={{ background: '#ff8c00', top: '70%' }} isConnectable={isConnectable} />, // Orange for Liquid Out
  ];

  if (condenserType === 'water_cooled_condenser' || condenserType === 'shell_tube_heat_exchanger' || condenserType === 'plate_heat_exchanger') {
    handles.push(
      <Handle key="water-in" type="target" position={Position.Top} id="water_in" style={{ background: '#00a2ed', left: '30%' }} isConnectable={isConnectable} />,
      <Handle key="water-out" type="source" position={Position.Bottom} id="water_out" style={{ background: '#0057b8', left: '70%' }} isConnectable={isConnectable} />
    );
  } else if (condenserType === 'evaporative_condenser') {
     handles.push(
      <Handle key="water-makeup" type="target" position={Position.Bottom} id="water_makeup" style={{ background: '#00a2ed', left: '30%' }} isConnectable={isConnectable} />,
      <Handle key="water-drain" type="source" position={Position.Bottom} id="water_drain" style={{ background: '#0057b8', left: '70%' }} isConnectable={isConnectable} />
      // Air handles could be added if needed, but often implicit
    );
  }
  // Air-cooled implicitly uses ambient air

  return (
    <div style={{ position: 'relative' }}>
      <Tooltip title={`${data.label}${data.capacity ? ` - ${data.capacity}` : ''}${data.specification ? ` (${data.specification})` : ''}`} arrow placement="top">
        <Box sx={style}>
          {svgIcon}
          <NodeLabel data={data} isDanfoss={isDanfoss} />
        </Box>
      </Tooltip>
      {handles}
    </div>
  );
};

export const EvaporatorNode: React.FC<NodeProps<HvacNodeData>> = ({ data, isConnectable }) => {
  let evaporatorType = 'dx_evaporator'; // Default to DX (Direct Expansion)
  let svgIcon;
  const typeHint = (data.subType || data.label || '').toLowerCase();

  if (typeHint.includes('flood')) evaporatorType = 'flooded_evaporator';
  else if (typeHint.includes('shell') && typeHint.includes('tube')) evaporatorType = 'shell_tube_heat_exchanger';
  else if (typeHint.includes('plate')) evaporatorType = 'plate_heat_exchanger';
  else if (typeHint.includes('cold') || typeHint.includes('storage') || typeHint.includes('unit cooler')) evaporatorType = 'cold_storage_evaporator';
  else if (typeHint.includes('dx') || typeHint.includes('direct')) evaporatorType = 'dx_evaporator';

  const isDanfoss = data.manufacturer?.toLowerCase().includes('danfoss'); // Evaps less likely branded Danfoss, but possible for components
   const style = {
    ...baseStyle,
    ...(componentStyles[evaporatorType] || componentStyles.evaporator),
    ...getFluidStyle(data.fluidType, data.refrigerantType, data.manufacturer),
  };

   // Standard P&ID Symbols
   // Note: Evaporator symbols often look similar to condensers but represent heat absorption.
   // We use slightly different internal representations or context colors for handles.
   switch(evaporatorType) {
      case 'flooded_evaporator': // Often shell & tube, liquid level is important
      case 'shell_tube_heat_exchanger':
         svgIcon = ( // Similar to S&T Condenser, but context implies evaporation
           <svg width="80" height="50" viewBox="0 0 90 60">
             <rect x="5" y="10" width="80" height="40" rx="10" ry="10" fill="none" stroke="#000" strokeWidth="1.5" />
             <line x1="15" y1="20" x2="75" y2="20" stroke="#000" strokeWidth="1" />
             <line x1="15" y1="30" x2="75" y2="30" stroke="#000" strokeWidth="1" />
             <line x1="15" y1="40" x2="75" y2="40" stroke="#000" strokeWidth="1" />
              {/* Liquid Level Indicator (for flooded) */}
              {evaporatorType === 'flooded_evaporator' && <line x1="10" y1="35" x2="80" y2="35" stroke="#00a2ed" strokeWidth="1.5" strokeDasharray="5,2" />}
           </svg>
         );
         break;
     case 'plate_heat_exchanger':
       svgIcon = ( // Same symbol as PHE condenser, context matters
         <svg width="60" height="60" viewBox="0 0 70 70">
           <rect x="5" y="5" width="60" height="60" rx="2" ry="2" fill="none" stroke="#000" strokeWidth="1.5" />
           <line x1="15" y1="15" x2="55" y2="15" stroke="#000" strokeWidth="1" />
           <line x1="15" y1="25" x2="55" y2="25" stroke="#000" strokeWidth="1" />
           <line x1="15" y1="35" x2="55" y2="35" stroke="#000" strokeWidth="1" />
           <line x1="15" y1="45" x2="55" y2="45" stroke="#000" strokeWidth="1" />
           <line x1="15" y1="55" x2="55" y2="55" stroke="#000" strokeWidth="1" />
           <circle cx="10" cy="10" r="3" fill="#fff" stroke="#000" strokeWidth="1"/>
           <circle cx="60" cy="10" r="3" fill="#fff" stroke="#000" strokeWidth="1"/>
           <circle cx="10" cy="60" r="3" fill="#fff" stroke="#000" strokeWidth="1"/>
           <circle cx="60" cy="60" r="3" fill="#fff" stroke="#000" strokeWidth="1"/>
         </svg>
       );
       break;
     case 'cold_storage_evaporator': // Unit cooler symbol (coil + fans)
       const numFans = data.numberOfFans || 1; // Default to 1 fan if not specified
       const fanPositions = Array.from({ length: numFans }, (_, i) => (i + 1) * (80 / (numFans + 1)));
       svgIcon = (
         <svg width="80" height="60" viewBox="0 0 90 70">
           <rect x="5" y="15" width="80" height="50" rx="2" ry="2" fill="none" stroke="#000" strokeWidth="1.5" /> {/* Housing */}
           {/* Coil (Simplified Waves/Zigzag) */}
           <path d="M15 25 C 25 20, 35 30, 45 25 S 65 30, 75 25" stroke="#000" strokeWidth="1" fill="none"/>
           <path d="M15 35 C 25 30, 35 40, 45 35 S 65 40, 75 35" stroke="#000" strokeWidth="1" fill="none"/>
           <path d="M15 45 C 25 40, 35 50, 45 45 S 65 50, 75 45" stroke="#000" strokeWidth="1" fill="none"/>
           <path d="M15 55 C 25 50, 35 60, 45 55 S 65 60, 75 55" stroke="#000" strokeWidth="1" fill="none"/>
           {/* Fan Symbols */}
           {fanPositions.map(cx => (
             <g key={`fan-${cx}`}>
               <circle cx={cx} cy="10" r="6" fill="none" stroke="#000" strokeWidth="1" />
               <path d={`M${cx} 4 V 16 M${cx-4} 10 H ${cx+4}`} stroke="#000" strokeWidth="0.5" />
             </g>
           ))}
           {/* Defrost Heater Indicator (Optional Simple Line) */}
           {typeHint.includes('defrost') && <line x1="10" y1="60" x2="80" y2="60" stroke="#ed1c24" strokeWidth="1.5" strokeDasharray="4,2"/>}
         </svg>
       );
       break;
     case 'dx_evaporator': // Generic Finned Coil symbol
     default:
       svgIcon = ( // Similar to air-cooled condenser, context matters
         <svg width="80" height="50" viewBox="0 0 90 60">
           <rect x="5" y="5" width="80" height="50" rx="2" ry="2" fill="none" stroke="#000" strokeWidth="1.5" />
           {/* Tube/Fin representation */}
           <line x1="15" y1="15" x2="75" y2="15" stroke="#000" strokeWidth="0.5" />
           <line x1="15" y1="25" x2="75" y2="25" stroke="#000" strokeWidth="0.5" />
           <line x1="15" y1="35" x2="75" y2="35" stroke="#000" strokeWidth="0.5" />
           <line x1="15" y1="45" x2="75" y2="45" stroke="#000" strokeWidth="0.5" />
           {/* Distributor/Header indication (optional) */}
           <rect x="10" y="20" width="5" height="20" fill="none" stroke="#000" strokeWidth="1" />
         </svg>
       );
   }

   // Determine Handles based on type
   let handles: React.ReactNode[] = [
     <Handle key="ref-in" type="target" position={Position.Left} id="refrigerant_in" style={{ background: '#ff8c00', top: '70%' }} isConnectable={isConnectable} />, // Orange for Liquid In (after expansion)
     <Handle key="ref-out" type="source" position={Position.Right} id="refrigerant_out" style={{ background: '#add8e6', top: '30%' }} isConnectable={isConnectable} />, // Light Blue for Suction Gas Out
   ];

   if (evaporatorType === 'shell_tube_heat_exchanger' || evaporatorType === 'plate_heat_exchanger' || evaporatorType === 'flooded_evaporator') {
     // Assume chilling water/glycol
     handles.push(
       <Handle key="fluid-in" type="target" position={Position.Top} id="fluid_in" style={{ background: '#0057b8', left: '70%' }} isConnectable={isConnectable} />, // Dark Blue In (warmer fluid)
       <Handle key="fluid-out" type="source" position={Position.Bottom} id="fluid_out" style={{ background: '#00a2ed', left: '30%' }} isConnectable={isConnectable} /> // Light Blue Out (colder fluid)
     );
   }
   // Air evaporators (DX, Cold Storage) implicitly use surrounding air

   return (
     <div style={{ position: 'relative' }}>
       <Tooltip title={`${data.label}${data.capacity ? ` - ${data.capacity}` : ''}${data.specification ? ` (${data.specification})` : ''}`} arrow placement="top">
         <Box sx={style}>
           {svgIcon}
           <NodeLabel data={data} isDanfoss={isDanfoss} />
         </Box>
       </Tooltip>
       {handles}
     </div>
   );
};

// --- Valves ---
// Includes Water, Freon, Ammonia valves. Emphasizes Danfoss.
export const ValveNode: React.FC<NodeProps<HvacNodeData>> = ({ data, isConnectable }) => {
  let valveType = 'valve'; // Default generic valve
  let svgIcon;
  const typeHint = (data.subType || data.label || '').toLowerCase();
  const isDanfoss = data.manufacturer?.toLowerCase().includes('danfoss') ||
                    typeHint.includes('danfoss') ||
                    typeHint.startsWith('icf') || typeHint.startsWith('ics') || // Ammonia valve platforms
                    typeHint.startsWith('evr') || typeHint.startsWith('tev') || typeHint.startsWith('kv') || // Common Freon/Ammonia valve types
                    typeHint.startsWith('pm') || typeHint.startsWith('gplx');

  // Determine specific valve type for symbol
  if (typeHint.includes('ball')) valveType = 'ball_valve';
  else if (typeHint.includes('gate')) valveType = 'gate_valve';
  else if (typeHint.includes('globe')) valveType = 'globe_valve';
  else if (typeHint.includes('butterfly')) valveType = 'butterfly_valve';
  else if (typeHint.includes('check') || typeHint.includes('nr') ) valveType = 'check_valve'; // NR for Non-Return
  else if (typeHint.includes('solenoid') || typeHint.startsWith('evr') || typeHint.startsWith('evs') || typeHint.includes('icf')) valveType = 'solenoid_valve'; // EVR, EV Solenoid, ICF contains solenoid
  else if (typeHint.includes('expansion') || typeHint.startsWith('tev') || typeHint.startsWith('akv') || typeHint.startsWith('ets')) valveType = 'expansion_valve'; // TEV (thermostatic), AKV/ETS (electronic)
  else if (typeHint.includes('regulat') || typeHint.includes('pressure') || typeHint.startsWith('kvp') || typeHint.startsWith('kvl') || typeHint.startsWith('kvr') || typeHint.startsWith('ics p') || typeHint.startsWith('cvp')) valveType = 'pressure_regulating_valve';
  else if (typeHint.includes('safety') || typeHint.includes('relief') || typeHint.startsWith('sfv') || typeHint.startsWith('bsv')) valveType = 'safety_valve';
  else if (typeHint.includes('control') || typeHint.includes('modulat') || typeHint.startsWith('icm') || typeHint.startsWith('icv') || typeHint.startsWith('amv')) valveType = 'control_valve'; // General control valve
  else if (typeHint.includes('three') || typeHint.includes('3-way')) valveType = 'three_way_valve';
  else if (typeHint.includes('four') || typeHint.includes('4-way') || typeHint.includes('reversing')) valveType = 'four_way_valve';
  else if (typeHint.includes('strainer') || typeHint.startsWith('fia')) valveType = 'strainer'; // FIA is Danfoss Strainer
  else if (typeHint.includes('icf')) valveType = 'valve_station'; // ICF is a valve station, could have specific symbol


  const style = {
    ...baseStyle,
    ...(componentStyles[valveType] || componentStyles.valve),
    ...getFluidStyle(data.fluidType, data.refrigerantType, data.manufacturer), // Apply fluid/Danfoss style AFTER base style
    border: 'none', // Valves often don't have a box border in P&ID, symbol defines shape
    background: 'none', // No background fill
    padding: '2px', // Minimal padding
  };

  const strokeColor = isDanfoss ? DANFOSS_COLOR : '#000';
  const strokeWidth = isDanfoss ? 2 : 1.5;

  // Standard P&ID Symbols for Valves
  switch(valveType) {
      case 'gate_valve':
          svgIcon = ( // Two triangles pointing inwards, intersecting line
              <svg width="40" height="40" viewBox="0 0 50 50">
                  <path d="M5 25 H 45" stroke="#000" strokeWidth={strokeWidth} />
                  <circle cx="25" cy="25" r="10" fill="none" stroke={strokeColor} strokeWidth={strokeWidth} />
                  <line x1="25" y1="5" x2="25" y2="20" stroke={strokeColor} strokeWidth={strokeWidth} /> {/* Stem */}
              </svg>
          );
          break;
      case 'globe_valve':
          svgIcon = ( // Two triangles pointing inwards, filled circle in center
              <svg width="40" height="40" viewBox="0 0 50 50">
                  <path d="M5 25 H 45" stroke="#000" strokeWidth={strokeWidth} />
                  <circle cx="25" cy="25" r="8" fill={strokeColor} stroke={strokeColor} strokeWidth={strokeWidth} />
                  <line x1="25" y1="5" x2="25" y2="17" stroke={strokeColor} strokeWidth={strokeWidth} /> {/* Stem */}
              </svg>
          );
          break;
      case 'ball_valve':
          svgIcon = ( // Two triangles pointing inwards, open circle in center
              <svg width="40" height="40" viewBox="0 0 50 50">
                  <path d="M5 25 H 45" stroke="#000" strokeWidth={strokeWidth} />
                  <circle cx="25" cy="25" r="8" fill="none" stroke={strokeColor} strokeWidth={strokeWidth} />
                   <line x1="25" y1="5" x2="25" y2="17" stroke={strokeColor} strokeWidth={strokeWidth} /> {/* Stem */}
                  {/* Optional handle indicator */}
                  {/* <line x1="15" y1="5" x2="35" y2="5" stroke={strokeColor} strokeWidth={strokeWidth}/> */}
              </svg>
          );
          break;
      case 'butterfly_valve':
          svgIcon = ( // Two triangles pointing inwards, line through center (bowtie shape)
              <svg width="40" height="40" viewBox="0 0 50 50">
                  <path d="M5 25 H 45" stroke="#000" strokeWidth={strokeWidth} />
                  <path d="M15 25 L 25 15 L 35 25 L 25 35 Z" fill="none" stroke={strokeColor} strokeWidth={strokeWidth} />
                  <line x1="25" y1="5" x2="25" y2="15" stroke={strokeColor} strokeWidth={strokeWidth} /> {/* Stem */}
              </svg>
          );
          break;
      case 'check_valve': // Non-return valve
          svgIcon = ( // Triangle pointing flow direction, with line behind
              <svg width="40" height="30" viewBox="0 0 50 40">
                  <path d="M5 20 H 45" stroke="#000" strokeWidth={strokeWidth} />
                  <polygon points="15,20 35,10 35,30" fill="none" stroke={strokeColor} strokeWidth={strokeWidth} />
                  <line x1="15" y1="10" x2="15" y2="30" stroke={strokeColor} strokeWidth={strokeWidth} />
                   {/* Optional: Swing check symbol */}
                   {/* <path d="M15 10 Q 25 20 15 30" stroke={strokeColor} strokeWidth="1" fill="none" /> */}
              </svg>
          );
          break;
      case 'solenoid_valve':
          svgIcon = ( // Valve symbol with 'S' or box on top
              <svg width="40" height="45" viewBox="0 0 50 55">
                  {/* Base valve symbol (e.g., generic bowtie) */}
                  <path d="M5 30 H 45" stroke="#000" strokeWidth={strokeWidth} />
                  <path d="M15 30 L 25 20 L 35 30 L 25 40 Z" fill="none" stroke={strokeColor} strokeWidth={strokeWidth} />
                  {/* Solenoid Box */}
                  <rect x="18" y="5" width="14" height="12" fill="none" stroke={strokeColor} strokeWidth={strokeWidth} />
                  <text x="25" y="16" fontSize="10" textAnchor="middle" fill={strokeColor} fontWeight="bold">S</text>
                  <line x1="25" y1="17" x2="25" y2="20" stroke={strokeColor} strokeWidth={strokeWidth} />
              </svg>
          );
          break;
      case 'expansion_valve': // TEV or EEV
          svgIcon = ( // Valve symbol with 'X' or diaphragm symbol
              <svg width="40" height="45" viewBox="0 0 50 55">
                  <path d="M5 30 H 45" stroke="#000" strokeWidth={strokeWidth} />
                  <path d="M15 30 L 35 30" stroke={strokeColor} strokeWidth={strokeWidth} />
                  <path d="M20 25 L 30 35 M20 35 L 30 25" stroke={strokeColor} strokeWidth={strokeWidth} /> {/* 'X' symbol */}
                   {/* Optional: Diaphragm/Sensor line for TEV */}
                  <line x1="25" y1="25" x2="25" y2="10" stroke={strokeColor} strokeWidth={strokeWidth/2} strokeDasharray="2,1"/>
                  <circle cx="25" cy="8" r="4" fill="none" stroke={strokeColor} strokeWidth={strokeWidth/2} />
              </svg>
          );
          break;
      case 'pressure_regulating_valve':
          svgIcon = ( // Valve symbol with diaphragm and spring / pilot line
              <svg width="40" height="45" viewBox="0 0 50 55">
                   {/* Base valve symbol (e.g., globe) */}
                  <path d="M5 30 H 45" stroke="#000" strokeWidth={strokeWidth} />
                  <circle cx="25" cy="30" r="6" fill={strokeColor} stroke={strokeColor} strokeWidth={strokeWidth} />
                  <line x1="25" y1="20" x2="25" y2="24" stroke={strokeColor} strokeWidth={strokeWidth} /> {/* Stem */}
                   {/* Diaphragm */}
                  <path d="M15 20 H 35" stroke={strokeColor} strokeWidth={strokeWidth} />
                  {/* Pilot line / Pressure sense line */}
                   <path d="M35 20 C 45 20 45 5 35 5" fill="none" stroke={strokeColor} strokeWidth={strokeWidth/2} strokeDasharray="2,1"/>
                   <path d="M35 5 L 30 5" stroke={strokeColor} strokeWidth={strokeWidth/2} strokeDasharray="2,1"/>
                  {/* Optional Spring */}
                  {/* <path d="M25 20 L 25 10 L 20 12 L 30 14 L 20 16 L 25 18" fill="none" stroke={strokeColor} strokeWidth="1" /> */}
              </svg>
          );
          break;
      case 'safety_valve': // Relief valve
          svgIcon = ( // Valve symbol opening against spring pressure
              <svg width="40" height="40" viewBox="0 0 50 50">
                  <path d="M5 25 H 20 M 30 25 H 45" stroke="#000" strokeWidth={strokeWidth} /> {/* Inlet/Outlet */}
                   <path d="M20 20 L 30 20 L 25 10 Z" fill="none" stroke={strokeColor} strokeWidth={strokeWidth} /> {/* Valve Seat/Disc */}
                  <line x1="25" y1="20" x2="25" y2="25" stroke={strokeColor} strokeWidth={strokeWidth} />
                   <path d="M25 25 L 25 35" stroke="#000" strokeWidth={strokeWidth} /> {/* Outlet Path */}
                   <path d="M25 10 L 25 5 L 20 7 L 30 9 L 20 11 L 25 13" fill="none" stroke={strokeColor} strokeWidth={strokeWidth/1.5} /> {/* Spring */}
              </svg>
          );
          break;
     case 'control_valve': // General modulating valve (often with actuator)
          svgIcon = ( // Globe/Generic valve with actuator box
              <svg width="40" height="45" viewBox="0 0 50 55">
                   <path d="M5 30 H 45" stroke="#000" strokeWidth={strokeWidth} />
                   <circle cx="25" cy="30" r="8" fill={strokeColor} stroke={strokeColor} strokeWidth={strokeWidth} /> {/* Globe style body */}
                  <line x1="25" y1="5" x2="25" y2="22" stroke={strokeColor} strokeWidth={strokeWidth} /> {/* Stem */}
                  <rect x="18" y="5" width="14" height="10" fill="none" stroke={strokeColor} strokeWidth={strokeWidth} /> {/* Actuator */}
              </svg>
          );
          break;
    case 'three_way_valve':
          svgIcon = ( // Three connection points, internal diverter/mixer symbol
              <svg width="45" height="45" viewBox="0 0 55 55">
                  <path d="M5 27.5 H 20 M 35 27.5 H 50 M 27.5 5 V 20 M 27.5 35 V 50" stroke="#000" strokeWidth={strokeWidth} /> {/* Ports */}
                  <circle cx="27.5" cy="27.5" r="10" fill="none" stroke={strokeColor} strokeWidth={strokeWidth} /> {/* Body */}
                  <path d="M20 20 L 35 35" stroke={strokeColor} strokeWidth={strokeWidth} /> {/* Internal path indicator (example) */}
                  {/* Could also be T-shape or L-shape inside circle */}
              </svg>
          );
          break;
     case 'four_way_valve': // Reversing valve
           svgIcon = (
               <svg width="50" height="50" viewBox="0 0 60 60">
                   <path d="M5 15 V 45 M 55 15 V 45 M 15 5 H 45 M 15 55 H 45" stroke="#000" strokeWidth={strokeWidth} /> {/* Ports */}
                   <rect x="15" y="15" width="30" height="30" fill="none" stroke={strokeColor} strokeWidth={strokeWidth} /> {/* Body */}
                    {/* Internal paths (simplified 'X') */}
                   <path d="M20 20 L 40 40 M 20 40 L 40 20" stroke={strokeColor} strokeWidth={strokeWidth} strokeDasharray="3,2"/>
               </svg>
           );
           break;
     case 'strainer':
         svgIcon = ( // Box with diagonal screen mesh symbol
             <svg width="40" height="30" viewBox="0 0 50 40">
                 <path d="M5 20 H 15 M 35 20 H 45" stroke="#000" strokeWidth={strokeWidth} />
                 <rect x="15" y="10" width="20" height="20" fill="none" stroke={strokeColor} strokeWidth={strokeWidth} />
                 <line x1="18" y1="28" x2="32" y2="12" stroke={strokeColor} strokeWidth={strokeWidth/2} />
             </svg>
         );
         break;
      case 'valve_station': // Like Danfoss ICF - block with multiple functions indicated
          svgIcon = ( // Represent as a block with common P&ID symbols inside
              <svg width="70" height="40" viewBox="0 0 80 50">
                  <rect x="5" y="5" width="70" height="40" rx="3" ry="3" fill="none" stroke={strokeColor} strokeWidth={strokeWidth} />
                  {/* Example internal symbols (Solenoid + Strainer + Ball Valve) */}
                   <path d="M15 25 L 20 20 L 25 25 L 20 30 Z" fill="none" stroke={strokeColor} strokeWidth={strokeWidth/2} />
                   <rect x="18" y="8" width="6" height="5" fill="none" stroke={strokeColor} strokeWidth={strokeWidth/2} />
                   <text x="21" y="13" fontSize="4" textAnchor="middle" fill={strokeColor}>S</text>
                   <line x1="21" y1="13" x2="21" y2="18" stroke={strokeColor} strokeWidth={strokeWidth/2} />

                   <rect x="35" y="15" width="10" height="10" fill="none" stroke={strokeColor} strokeWidth={strokeWidth/2} />
                   <line x1="37" y1="23" x2="43" y2="17" stroke={strokeColor} strokeWidth={strokeWidth/2} />

                   <circle cx="58" cy="25" r="4" fill="none" stroke={strokeColor} strokeWidth={strokeWidth/2} />
                   <line x1="58" y1="17" x2="58" y2="21" stroke={strokeColor} strokeWidth={strokeWidth/2} />

                   {/* Connections */}
                   <path d="M5 25 H 15 M 62 25 H 75" stroke="#000" strokeWidth={strokeWidth} />
              </svg>
          );
          break;
      case 'valve': // Generic valve symbol (bowtie)
      default:
          svgIcon = (
              <svg width="40" height="40" viewBox="0 0 50 50">
                  <path d="M5 25 H 45" stroke="#000" strokeWidth={strokeWidth} />
                  <path d="M15 25 L 25 15 L 35 25 L 25 35 Z" fill="none" stroke={strokeColor} strokeWidth={strokeWidth} />
              </svg>
          );
  }

  // Determine handles based on type
  let handles: React.ReactNode[];
  if (valveType === 'three_way_valve') {
      handles = [
          <Handle key="in1" type="target" position={Position.Left} id="in1" style={{ background: '#555' }} isConnectable={isConnectable} />,
          <Handle key="in2" type="target" position={Position.Top} id="in2" style={{ background: '#555' }} isConnectable={isConnectable} />,
          <Handle key="out" type="source" position={Position.Right} id="out" style={{ background: '#555' }} isConnectable={isConnectable} />,
          // Add bottom handle if it's a mixing valve primarily
          // <Handle key="out-bottom" type="source" position={Position.Bottom} id="out-bottom" style={{ background: '#555' }} isConnectable={isConnectable} />
      ];
  } else if (valveType === 'four_way_valve') {
       handles = [
          <Handle key="p1" type="target" position={Position.Left} id="port1" style={{ background: '#555', top: '25%' }} isConnectable={isConnectable} />,
          <Handle key="p2" type="source" position={Position.Left} id="port2" style={{ background: '#555', top: '75%' }} isConnectable={isConnectable} />,
          <Handle key="p3" type="target" position={Position.Right} id="port3" style={{ background: '#555', top: '25%' }} isConnectable={isConnectable} />,
          <Handle key="p4" type="source" position={Position.Right} id="port4" style={{ background: '#555', top: '75%' }} isConnectable={isConnectable} />,
           // Optional pilot/solenoid connections
           <Handle key="pilot" type="target" position={Position.Top} id="pilot" style={{ background: '#772953' }} isConnectable={isConnectable} />,
       ];
  } else if (valveType === 'safety_valve') {
      handles = [
          <Handle key="in" type="target" position={Position.Left} id="in" style={{ background: '#555' }} isConnectable={isConnectable} />,
          <Handle key="out" type="source" position={Position.Bottom} id="out" style={{ background: '#555' }} isConnectable={isConnectable} />, // Relief typically goes down or away
      ];
  } else { // Default Input/Output
      handles = [
          <Handle key="in" type="target" position={Position.Left} id="in" style={{ background: '#555' }} isConnectable={isConnectable} />,
          <Handle key="out" type="source" position={Position.Right} id="out" style={{ background: '#555' }} isConnectable={isConnectable} />,
           // Add control signal handle for relevant types
           (valveType === 'solenoid_valve' || valveType === 'control_valve' || valveType === 'expansion_valve') && (
               <Handle key="control" type="target" position={Position.Top} id="control_signal" style={{ background: '#772953' }} isConnectable={isConnectable} />
           ),
           // Add pressure sensing handle for regulators/TEVs
           (valveType === 'pressure_regulating_valve' || valveType === 'expansion_valve') && (
               <Handle key="sense" type="target" position={Position.Bottom} id="pressure_sense" style={{ background: '#f1c232', left: '70%' }} isConnectable={isConnectable} />
           )
      ];
  }


  return (
      <div style={{ position: 'relative' }}>
          <Tooltip title={`${isDanfoss ? 'Danfoss ' : ''}${data.label}${data.specification ? ` (${data.specification})` : ''}${data.size ? ` - DN${data.size}` : ''}`} arrow placement="top">
              <Box sx={style}>
                  {svgIcon}
                  <NodeLabel data={data} isDanfoss={isDanfoss} />
              </Box>
          </Tooltip>
          {handles}
      </div>
  );
};

// --- Pumps ---
export const PumpNode: React.FC<NodeProps<HvacNodeData>> = ({ data, isConnectable }) => {
  let pumpType = 'centrifugal_pump'; // Default
  let svgIcon;
  const typeHint = (data.subType || data.pumpType || data.label || '').toLowerCase();

  if (typeHint.includes('positive') || typeHint.includes('displacement') || typeHint.includes('gear') || typeHint.includes('screw')) pumpType = 'positive_displacement_pump';
  else if (typeHint.includes('inline')) pumpType = 'inline_pump';
  else if (typeHint.includes('centrifugal') || typeHint.includes('circulator')) pumpType = 'centrifugal_pump';

  const isDanfoss = data.manufacturer?.toLowerCase().includes('danfoss'); // Danfoss makes some pumps/pump controllers
  const isGrundfos = data.manufacturer?.toLowerCase().includes('grundfos'); // Common pump manufacturer
  const style = {
    ...baseStyle,
    ...(componentStyles[pumpType] || componentStyles.pump),
    ...getFluidStyle(data.fluidType, data.refrigerantType, data.manufacturer),
    borderRadius: '50%', // Most pump symbols are circular based
    padding: '8px',
  };

  // Standard P&ID Symbols
  switch(pumpType) {
    case 'positive_displacement_pump':
      svgIcon = ( // Circle with interlocking gears/lobes symbol
        <svg width="40" height="40" viewBox="0 0 50 50">
          <circle cx="25" cy="25" r="20" fill="none" stroke="#000" strokeWidth="1.5" />
          {/* Simplified gear/lobe symbol */}
          <circle cx="18" cy="25" r="7" fill="none" stroke="#000" strokeWidth="1" />
          <circle cx="32" cy="25" r="7" fill="none" stroke="#000" strokeWidth="1" />
          <path d="M18 18 L 18 32 M32 18 L 32 32" stroke="#000" strokeWidth="1" />
          {isDanfoss && <circle cx="40" cy="10" r="3" fill={DANFOSS_COLOR} />}
          {isGrundfos && <rect x="37" y="7" width="6" height="6" fill="#e00000" />} {/* Grundfos Red Square */}
        </svg>
      );
      break;
     case 'inline_pump':
       svgIcon = ( // Pump symbol integrated directly into the line (Triangle in circle maybe)
         <svg width="40" height="40" viewBox="0 0 50 50">
           <circle cx="25" cy="25" r="20" fill="none" stroke="#000" strokeWidth="1.5" />
           <polygon points="15,30 25,15 35,30" fill="#000" stroke="#000" strokeWidth="1" />
           {isDanfoss && <circle cx="40" cy="10" r="3" fill={DANFOSS_COLOR} />}
           {isGrundfos && <rect x="37" y="7" width="6" height="6" fill="#e00000" />}
         </svg>
       );
       break;
    case 'centrifugal_pump':
    default:
      svgIcon = ( // Circle with tangent outlet and radial inlet/impeller symbol
        <svg width="40" height="40" viewBox="0 0 50 50">
          <circle cx="25" cy="25" r="20" fill="none" stroke="#000" strokeWidth="1.5" />
          <path d="M25 25 H 5" stroke="#000" strokeWidth="1.5" /> {/* Inlet */}
          <path d="M25 5 V 0" stroke="#000" strokeWidth="1.5" /> {/* Outlet */}
          {/* Impeller direction indicator (optional) */}
          <path d="M 25 25 Q 35 15 45 15" fill="none" stroke="#000" strokeWidth="1" />
          {isDanfoss && <circle cx="40" cy="10" r="3" fill={DANFOSS_COLOR} />}
           {isGrundfos && <rect x="37" y="7" width="6" height="6" fill="#e00000" />}
        </svg>
      );
  }

  return (
    <div style={{ position: 'relative' }}>
      <Tooltip title={`${isGrundfos ? 'Grundfos ' : (isDanfoss ? 'Danfoss ' : '')}${data.label}${data.capacity ? ` - ${data.capacity}` : ''}${data.specification ? ` (${data.specification})` : ''}`} arrow placement="top">
        <Box sx={style}>
          {svgIcon}
          {/* Pump label might need adjusting if symbol fills the circle */}
          {/* <NodeLabel data={data} isDanfoss={isDanfoss} /> */}
          <Typography variant="caption" sx={{ position:'absolute', bottom: '-20px', left:'50%', transform:'translateX(-50%)', fontSize:'0.65rem', fontWeight:'bold', color: isDanfoss ? DANFOSS_COLOR : (isGrundfos ? '#e00000' : 'inherit') }}>{data.label}</Typography>
        </Box>
      </Tooltip>
      <Handle type="target" position={Position.Left} id="in" style={{ background: '#555' }} isConnectable={isConnectable} />
      <Handle type="source" position={Position.Top} id="out" style={{ background: '#555' }} isConnectable={isConnectable} />
    </div>
  );
};

// --- Vessels --- (Receivers, Separators, Accumulators, Expansion Tanks)
export const VesselNode: React.FC<NodeProps<HvacNodeData>> = ({ data, isConnectable }) => {
  let vesselType = data.vesselType || 'vessel'; // Default generic
  let svgIcon;
  const typeHint = (data.subType || data.label || '').toLowerCase();

  // Refine type based on hints
  if (typeHint.includes('receiver')) vesselType = 'receiver';
  else if (typeHint.includes('separator') || typeHint.includes('oil')) vesselType = 'separator';
  else if (typeHint.includes('accumulator') || typeHint.includes('suction')) vesselType = 'accumulator';
  else if (typeHint.includes('expansion')) vesselType = 'expansion_tank';

  const isDanfoss = data.manufacturer?.toLowerCase().includes('danfoss'); // Danfoss makes oil separators, etc.
  const style = {
    ...baseStyle,
    ...(componentStyles[vesselType] || componentStyles.vessel),
    ...getFluidStyle(data.fluidType, data.refrigerantType, data.manufacturer),
    borderRadius: (vesselType === 'expansion_tank') ? '50%' : '10px', // Expansion tanks often spherical/rounded
  };

  // Standard P&ID Symbols (Simplified)
  switch(vesselType) {
    case 'receiver': // Vertical or horizontal cylinder
       svgIcon = (
        <svg width="50" height="80" viewBox="0 0 60 100">
          <rect x="10" y="10" width="40" height="80" rx="10" ry="10" fill="none" stroke="#000" strokeWidth="1.5" />
          {/* Level Gauge Indicator */}
           <rect x="45" y="20" width="5" height="60" fill="none" stroke="#000" strokeWidth="0.5" />
           <rect x="45" y="50" width="5" height="30" fill="#72c4f7" fillOpacity="0.7" strokeWidth="0" />
            {isDanfoss && <circle cx="50" cy="10" r="3" fill={DANFOSS_COLOR} />}
        </svg>
      );
      break;
    case 'separator': // Often vertical with internal baffles/demister symbol
       svgIcon = (
        <svg width="50" height="80" viewBox="0 0 60 100">
          <rect x="10" y="10" width="40" height="80" rx="10" ry="10" fill="none" stroke="#000" strokeWidth="1.5" />
          {/* Internal Baffle/Demister Symbol */}
          <path d="M15 30 H 45 M 15 35 H 45" stroke="#000" strokeWidth="1" strokeDasharray="2,2" />
           <path d="M15 50 C 25 45, 35 55, 45 50" fill="none" stroke="#000" strokeWidth="1" />
           {/* Oil level if oil separator */}
           {typeHint.includes('oil') && <rect x="10" y="70" width="40" height="20" fill="#d4a373" fillOpacity="0.5" />}
           {isDanfoss && <circle cx="50" cy="10" r="3" fill={DANFOSS_COLOR} />}
        </svg>
      );
      break;
    case 'accumulator': // Similar to separator, focuses on liquid trapping at outlet
       svgIcon = (
        <svg width="50" height="80" viewBox="0 0 60 100">
          <rect x="10" y="10" width="40" height="80" rx="10" ry="10" fill="none" stroke="#000" strokeWidth="1.5" />
          {/* U-tube outlet to trap liquid */}
           <path d="M 45 30 H 30 V 70 H 40" fill="none" stroke="#000" strokeWidth="1.5"/>
           {/* Inlet typically higher */}
           <path d="M 5 20 H 10" fill="none" stroke="#000" strokeWidth="1.5"/>
           {isDanfoss && <circle cx="50" cy="10" r="3" fill={DANFOSS_COLOR} />}
        </svg>
      );
      break;
    case 'expansion_tank': // Often spherical or rounded cylinder
       svgIcon = (
        <svg width="60" height="60" viewBox="0 0 70 70">
          <circle cx="35" cy="35" r="30" fill="none" stroke="#000" strokeWidth="1.5" />
          {/* Diaphragm indicator (optional) */}
           <path d="M 5 35 H 65" stroke="#000" strokeWidth="1" strokeDasharray="4,2"/>
           {/* Connection point */}
           <path d="M 35 65 V 70" fill="none" stroke="#000" strokeWidth="1.5"/>
        </svg>
      );
      break;
    case 'vessel': // Generic Vertical Tank
    default:
      svgIcon = (
        <svg width="50" height="80" viewBox="0 0 60 100">
          <rect x="10" y="10" width="40" height="80" rx="5" ry="5" fill="none" stroke="#000" strokeWidth="1.5" />
          {/* Simple port indicators */}
          <line x1="0" y1="30" x2="10" y2="30" stroke="#000" strokeWidth="1.5" />
          <line x1="50" y1="70" x2="60" y2="70" stroke="#000" strokeWidth="1.5" />
        </svg>
      );
  }

  // Define Handles based on common usage
  let handles: React.ReactNode[];
  switch(vesselType) {
    case 'receiver':
      handles = [
        <Handle key="in" type="target" position={Position.Top} id="in" style={{ background: '#555', left: '30%' }} isConnectable={isConnectable} />, // Inlet often top/side
        <Handle key="out" type="source" position={Position.Bottom} id="liquid_out" style={{ background: '#555' }} isConnectable={isConnectable} />, // Liquid out bottom
        <Handle key="vent" type="source" position={Position.Top} id="gas_vent" style={{ background: '#aaa', left: '70%' }} isConnectable={isConnectable} />, // Optional vent/equalization
      ];
      break;
    case 'separator': // e.g., Oil Separator
       handles = [
        <Handle key="in" type="target" position={Position.Left} id="in" style={{ background: '#555', top: '30%' }} isConnectable={isConnectable} />, // Inlet high
        <Handle key="out" type="source" position={Position.Right} id="gas_out" style={{ background: '#555', top: '30%' }} isConnectable={isConnectable} />, // Gas out high
         <Handle key="drain" type="source" position={Position.Bottom} id="liquid_drain" style={{ background: typeHint.includes('oil') ? '#d4a373' : '#555' }} isConnectable={isConnectable} />, // Drain bottom
       ];
      break;
     case 'accumulator': // Suction Accumulator
       handles = [
        <Handle key="in" type="target" position={Position.Left} id="in" style={{ background: '#add8e6', top: '30%' }} isConnectable={isConnectable} />, // Suction gas in (possibly wet)
        <Handle key="out" type="source" position={Position.Right} id="out" style={{ background: '#add8e6', top: '70%' }} isConnectable={isConnectable} />, // Suction gas out (dry)
         <Handle key="drain" type="source" position={Position.Bottom} id="liquid_drain" style={{ background: typeHint.includes('oil') ? '#d4a373' : '#555' }} isConnectable={isConnectable} />, // Optional liquid/oil drain
       ];
      break;
     case 'expansion_tank':
       handles = [
        <Handle key="conn" type="target" position={Position.Bottom} id="connection" style={{ background: '#555' }} isConnectable={isConnectable} />, // Usually one connection
       ];
       break;
    default: // Generic
       handles = [
        <Handle key="in" type="target" position={Position.Left} id="in" style={{ background: '#555' }} isConnectable={isConnectable} />,
        <Handle key="out" type="source" position={Position.Right} id="out" style={{ background: '#555' }} isConnectable={isConnectable} />,
        <Handle key="top" type="target" position={Position.Top} id="top_conn" style={{ background: '#aaa' }} isConnectable={isConnectable} />,
        <Handle key="bottom" type="source" position={Position.Bottom} id="bottom_conn" style={{ background: '#aaa' }} isConnectable={isConnectable} />,
       ];
  }


  return (
    <div style={{ position: 'relative' }}>
      <Tooltip title={`${isDanfoss ? 'Danfoss ' : ''}${data.label}${data.capacity ? ` - ${data.capacity}` : ''}${data.specification ? ` (${data.specification})` : ''}`} arrow placement="top">
        <Box sx={style}>
          {svgIcon}
          <NodeLabel data={data} isDanfoss={isDanfoss} />
        </Box>
      </Tooltip>
      {handles}
    </div>
  );
};


// --- Filters & Strainers --- (Already exists, improved Danfoss handling & Strainer SVG)
export const FilterNode: React.FC<NodeProps<HvacNodeData>> = ({ data, isConnectable }) => {
  let filterType = 'filter'; // default
  let svgIcon;
  const typeHint = (data.subType || data.label || '').toLowerCase();

  if (typeHint.includes('drier') || typeHint.includes('dryer')) filterType = 'filter_drier';
  else if (typeHint.includes('strainer') || typeHint.startsWith('fia')) filterType = 'strainer'; // Danfoss FIA
  else if (typeHint.includes('oil')) filterType = 'oil_filter'; // Specific oil filter symbol might differ
  else if (typeHint.includes('filter')) filterType = 'filter';

  const isDanfoss = data.manufacturer?.toLowerCase().includes('danfoss') ||
                    typeHint.includes('danfoss') || typeHint.startsWith('dcl') || typeHint.startsWith('dcr') || typeHint.startsWith('dmb') || typeHint.startsWith('dml') || typeHint.startsWith('fia');

   const style = {
    ...baseStyle,
    ...(componentStyles[filterType] || componentStyles.filter),
    ...getFluidStyle(data.fluidType, data.refrigerantType, data.manufacturer),
  };

  switch(filterType) {
    case 'filter_drier':
      svgIcon = ( // Cylinder with 'X' or screen pattern
        <svg width="40" height="50" viewBox="0 0 50 60">
          <rect x="10" y="5" width="30" height="50" rx="5" ry="5" fill="none" stroke="#000" strokeWidth="1.5" />
          <path d="M15 15 L 35 45 M 15 45 L 35 15" stroke="#000" strokeWidth="1" />
          {isDanfoss && <circle cx="40" cy="10" r="3" fill={DANFOSS_COLOR} />}
        </svg>
      );
      break;
    case 'strainer':
        svgIcon = ( // Box/Body with diagonal screen symbol (same as valve version but standalone)
             <svg width="40" height="30" viewBox="0 0 50 40">
                 <rect x="10" y="5" width="30" height="30" rx="2" ry="2" fill="none" stroke="#000" strokeWidth="1.5" />
                 <line x1="15" y1="30" x2="35" y2="10" stroke="#000" strokeWidth="1" />
                 {isDanfoss && <circle cx="40" cy="10" r="3" fill={DANFOSS_COLOR} />}
             </svg>
         );
         break;
    case 'oil_filter': // May look similar to drier or have specific symbol
    case 'filter': // Generic Filter Symbol (Circle with cross)
    default:
      svgIcon = (
        <svg width="40" height="40" viewBox="0 0 50 50">
          <circle cx="25" cy="25" r="20" fill="none" stroke="#000" strokeWidth="1.5" />
          <path d="M15 15 L 35 35 M 15 35 L 35 15" stroke="#000" strokeWidth="1" />
           {isDanfoss && <circle cx="40" cy="10" r="3" fill={DANFOSS_COLOR} />}
        </svg>
      );
  }

  return (
    <div style={{ position: 'relative' }}>
      <Tooltip title={`${isDanfoss ? 'Danfoss ' : ''}${data.label}${data.specification ? ` (${data.specification})` : ''}`} arrow placement="top">
        <Box sx={style}>
          {svgIcon}
          <NodeLabel data={data} isDanfoss={isDanfoss} />
        </Box>
      </Tooltip>
      <Handle type="target" position={Position.Left} id="in" style={{ background: '#555' }} isConnectable={isConnectable} />
      <Handle type="source" position={Position.Right} id="out" style={{ background: '#555' }} isConnectable={isConnectable} />
       {/* Optional drain for strainers */}
       {filterType === 'strainer' && (
         <Handle type="source" position={Position.Bottom} id="drain" style={{ background: '#aaa' }} isConnectable={isConnectable} />
       )}
    </div>
  );
};


// --- Fan Coil Units ---
export const FanCoilNode: React.FC<NodeProps<HvacNodeData>> = ({ data, isConnectable }) => {
  let fcType = data.fanCoilType || 'duct'; // Default to ducted/generic
  let svgIcon;
  const typeHint = (data.subType || data.label || '').toLowerCase();

  if (typeHint.includes('floor')) fcType = 'floor';
  else if (typeHint.includes('ceiling') || typeHint.includes('cassette')) fcType = 'ceiling'; // Cassette is a type of ceiling
  else if (typeHint.includes('wall')) fcType = 'wall';
  else if (typeHint.includes('duct')) fcType = 'duct';

  const style = {
    ...baseStyle,
    ...componentStyles.fan_coil_unit,
    ...getFluidStyle(data.fluidType, data.refrigerantType, data.manufacturer), // Usually water/glycol
  };

  // Simplified representation for different FCU types
  switch(fcType) {
    case 'floor':
      svgIcon = ( // Rectangle with fan symbol at bottom, coil symbol, top discharge grille
        <svg width="50" height="70" viewBox="0 0 60 80">
          <rect x="5" y="5" width="50" height="70" rx="2" ry="2" fill="none" stroke="#000" strokeWidth="1.5" />
          {/* Fan */}
          <circle cx="30" cy="65" r="8" fill="none" stroke="#000" strokeWidth="1" />
          <path d="M30 57 V 73 M 22 65 H 38" stroke="#000" strokeWidth="0.5" />
          {/* Coil */}
          <path d="M15 25 C 20 20, 25 30, 30 25 S 40 30, 45 25" stroke="#000" strokeWidth="1" fill="none"/>
          <path d="M15 35 C 20 30, 25 40, 30 35 S 40 40, 45 35" stroke="#000" strokeWidth="1" fill="none"/>
          {/* Grille */}
          <path d="M10 10 H 50 M 10 15 H 50" stroke="#000" strokeWidth="1" />
        </svg>
      );
      break;
    case 'ceiling': // Can be cassette (4-way blow) or concealed (ducted)
      if (typeHint.includes('cassette')) {
        svgIcon = ( // Square with central return, 4-way supply, fan & coil internal
          <svg width="70" height="70" viewBox="0 0 80 80">
            <rect x="5" y="5" width="70" height="70" rx="2" ry="2" fill="none" stroke="#000" strokeWidth="1.5" />
            {/* Central Return */}
            <rect x="25" y="25" width="30" height="30" fill="none" stroke="#000" strokeDasharray="2,2" strokeWidth="1" />
            {/* 4-Way Supply Arrows */}
            <path d="M40 25 V 10 L 35 15 M 40 10 L 45 15" fill="none" stroke="#000" strokeWidth="1" /> {/* Up */}
            <path d="M40 55 V 70 L 35 65 M 40 70 L 45 65" fill="none" stroke="#000" strokeWidth="1" /> {/* Down */}
            <path d="M25 40 H 10 L 15 35 M 10 40 L 15 45" fill="none" stroke="#000" strokeWidth="1" /> {/* Left */}
            <path d="M55 40 H 70 L 65 35 M 70 40 L 65 45" fill="none" stroke="#000" strokeWidth="1" /> {/* Right */}
            {/* Internal Fan/Coil (Simplified) */}
             <circle cx="40" cy="40" r="5" fill="none" stroke="#000" strokeWidth="0.5" />
             <path d="M30 30 L 50 50 M 30 50 L 50 30" stroke="#000" strokeWidth="0.5" strokeDasharray="1,1"/>
          </svg>
        );
      } else { // Concealed / Ducted Ceiling
         svgIcon = ( // Rectangle with duct connections, internal fan/coil
           <svg width="80" height="50" viewBox="0 0 90 60">
             <rect x="5" y="5" width="80" height="50" rx="2" ry="2" fill="none" stroke="#000" strokeWidth="1.5" />
             {/* Fan */}
             <circle cx="25" cy="30" r="10" fill="none" stroke="#000" strokeWidth="1" />
             <path d="M25 20 V 40 M 15 30 H 35" stroke="#000" strokeWidth="0.5" />
             {/* Coil */}
             <path d="M45 15 L 75 15 L 45 25 L 75 25 L 45 35 L 75 35 L 45 45 L 75 45" stroke="#000" strokeWidth="1" fill="none"/>
              {/* Duct Connections */}
             <path d="M 85 15 H 90 M 85 45 H 90 M 0 30 H 5" fill="none" stroke="#000" strokeWidth="1.5" />
           </svg>
         );
      }
      break;
    case 'wall':
       svgIcon = ( // Rectangle mounted high, downward discharge grille, internal fan/coil
         <svg width="70" height="40" viewBox="0 0 80 50">
           <rect x="5" y="5" width="70" height="40" rx="2" ry="2" fill="none" stroke="#000" strokeWidth="1.5" />
           {/* Fan (Side view often) */}
           <circle cx="20" cy="25" r="8" fill="none" stroke="#000" strokeWidth="1" />
           <path d="M12 25 H 28 M 20 17 V 33" stroke="#000" strokeWidth="0.5" />
           {/* Coil */}
           <path d="M35 10 L 65 10 L 35 20 L 65 20 L 35 30 L 65 30" stroke="#000" strokeWidth="1" fill="none"/>
           {/* Discharge Grille/Louvers */}
           <path d="M10 40 H 70 M 15 45 H 65" stroke="#000" strokeWidth="1" />
         </svg>
       );
       break;
    case 'duct': // Often shown as AHU component, rectangle with fan/coil/filter
    default:
       svgIcon = ( // Generic box with Fan + Coil symbols inside
         <svg width="80" height="50" viewBox="0 0 90 60">
           <rect x="5" y="5" width="80" height="50" rx="2" ry="2" fill="none" stroke="#000" strokeWidth="1.5" />
           {/* Fan */}
           <circle cx="25" cy="30" r="10" fill="none" stroke="#000" strokeWidth="1" />
           <path d="M25 20 V 40 M 15 30 H 35" stroke="#000" strokeWidth="0.5" />
           {/* Coil */}
           <path d="M45 15 L 75 15 L 45 25 L 75 25 L 45 35 L 75 35 L 45 45 L 75 45" stroke="#000" strokeWidth="1" fill="none"/>
         </svg>
       );
  }

  // Common handles: Water In/Out, maybe Air In/Out if ducted
  let handles = [
      <Handle key="water-in" type="target" position={Position.Top} id="water_in" style={{ background: '#00a2ed', left: '30%' }} isConnectable={isConnectable} />,
      <Handle key="water-out" type="source" position={Position.Bottom} id="water_out" style={{ background: '#0057b8', left: '70%' }} isConnectable={isConnectable} />,
  ];
  if (fcType === 'duct' || (fcType === 'ceiling' && !typeHint.includes('cassette'))) {
      handles.push(
          <Handle key="air-in" type="target" position={Position.Left} id="air_in" style={{ background: '#ccc' }} isConnectable={isConnectable} />,
          <Handle key="air-out" type="source" position={Position.Right} id="air_out" style={{ background: '#ccc' }} isConnectable={isConnectable} />
      );
  }

  return (
    <div style={{ position: 'relative' }}>
      <Tooltip title={`${data.label}${data.capacity ? ` - ${data.capacity}` : ''}${data.specification ? ` (${data.specification})` : ''}`} arrow placement="top">
        <Box sx={style}>
          {svgIcon}
          <NodeLabel data={data} />
        </Box>
      </Tooltip>
      {handles}
    </div>
  );
};

// --- Piping Fittings --- (Elbow, Tee, Reducer) - Basic Representations
export const PipingFittingNode: React.FC<NodeProps<HvacNodeData>> = ({ data, isConnectable }) => {
  let fittingType = data.fittingType || 'elbow'; // Default
  let svgIcon;
  const typeHint = (data.subType || data.label || '').toLowerCase();

  if (typeHint.includes('elbow') || typeHint.includes('bend')) fittingType = 'elbow';
  else if (typeHint.includes('tee')) fittingType = 'tee';
  else if (typeHint.includes('reducer') || typeHint.includes('reducing')) fittingType = 'reducer';
  else if (typeHint.includes('cross')) fittingType = 'cross';

   const style = {
    ...baseStyle,
    ...(componentStyles[fittingType] || componentStyles.piping_fitting),
    minWidth: '20px', // Fittings are usually small
    minHeight: '20px',
     border: 'none', // No border for fittings themselves
     background: 'none',
     padding: 0,
   };

  const pipeColor = getFluidStyle(data.fluidType, data.refrigerantType, data.manufacturer)?.borderColor || '#555';
  const pipeWidth = "2";

  // Simple SVG representations
  switch(fittingType) {
    case 'tee':
      svgIcon = (
        <svg width="30" height="30" viewBox="0 0 40 40">
          <line x1="5" y1="20" x2="35" y2="20" stroke={pipeColor} strokeWidth={pipeWidth} />
          <line x1="20" y1="5" x2="20" y2="35" stroke={pipeColor} strokeWidth={pipeWidth} />
        </svg>
      );
      break;
    case 'reducer': // Concentric reducer
      svgIcon = (
        <svg width="40" height="20" viewBox="0 0 50 30">
          <polygon points="5,5 45,10 45,20 5,25" fill="none" stroke={pipeColor} strokeWidth={pipeWidth} />
        </svg>
      );
      break;
    case 'cross':
       svgIcon = (
        <svg width="30" height="30" viewBox="0 0 40 40">
          <line x1="5" y1="20" x2="35" y2="20" stroke={pipeColor} strokeWidth={pipeWidth} />
          <line x1="20" y1="5" x2="20" y2="35" stroke={pipeColor} strokeWidth={pipeWidth} />
           <circle cx="20" cy="20" r="2" fill={pipeColor} /> {/* Center point */}
        </svg>
      );
      break;
    case 'elbow': // 90 Degree Elbow
    default:
      svgIcon = (
        <svg width="30" height="30" viewBox="0 0 40 40">
          <path d="M 5 20 H 20 V 35" fill="none" stroke={pipeColor} strokeWidth={pipeWidth} />
        </svg>
      );
  }

  // Define Handles (More complex logic needed for orientation) - Basic setup:
  let handles: React.ReactNode[];
  switch(fittingType) {
      case 'tee':
          handles = [
              <Handle key="h1" type="target" position={Position.Left} id="in_main" style={{ background: pipeColor }} isConnectable={isConnectable} />,
              <Handle key="h2" type="source" position={Position.Right} id="out_main" style={{ background: pipeColor }} isConnectable={isConnectable} />,
              <Handle key="h3" type="source" position={Position.Top} id="out_branch" style={{ background: pipeColor }} isConnectable={isConnectable} />,
              // Or target if it's a mixing tee
               <Handle key="h4" type="target" position={Position.Bottom} id="in_branch_alt" style={{ background: pipeColor }} isConnectable={isConnectable} />,
          ];
          break;
      case 'reducer':
          handles = [
              <Handle key="r1" type="target" position={Position.Left} id="in_large" style={{ background: pipeColor, height:'10px' }} isConnectable={isConnectable} />,
              <Handle key="r2" type="source" position={Position.Right} id="out_small" style={{ background: pipeColor, height:'6px' }} isConnectable={isConnectable} />,
          ];
          break;
      case 'cross':
          handles = [
              <Handle key="c1" type="target" position={Position.Left} id="in1" style={{ background: pipeColor }} isConnectable={isConnectable} />,
              <Handle key="c2" type="source" position={Position.Right} id="out1" style={{ background: pipeColor }} isConnectable={isConnectable} />,
              <Handle key="c3" type="target" position={Position.Top} id="in2" style={{ background: pipeColor }} isConnectable={isConnectable} />,
              <Handle key="c4" type="source" position={Position.Bottom} id="out2" style={{ background: pipeColor }} isConnectable={isConnectable} />,
          ];
          break;
      case 'elbow':
      default:
           handles = [
              <Handle key="e1" type="target" position={Position.Left} id="in" style={{ background: pipeColor }} isConnectable={isConnectable} />,
              <Handle key="e2" type="source" position={Position.Bottom} id="out" style={{ background: pipeColor }} isConnectable={isConnectable} />,
              // Needs logic for other orientations (Top, Right output)
           ];
  }


  return (
    // Tooltip might be less useful here, or show size/angle
    <div style={{ position: 'relative' }}>
       <Tooltip title={`${data.label || fittingType}${data.size ? ` - ${data.size}` : ''}`} arrow placement="top">
          <Box sx={style}>
              {svgIcon}
              {/* No label typically shown directly on fitting nodes */}
          </Box>
       </Tooltip>
      {handles}
    </div>
  );
};


// --- Other Components (Boiler, Damper, Fan) ---
// Basic implementations - Can be expanded significantly

export const BoilerNode: React.FC<NodeProps<HvacNodeData>> = ({ data, isConnectable }) => {
     const style = { ...baseStyle, ...componentStyles.boiler, ...getFluidStyle('Hot Water', undefined, data.manufacturer) };
     const svgIcon = ( // Symbol often a rounded rectangle with flame/heat indication
          <svg width="60" height="80" viewBox="0 0 70 90">
               <rect x="5" y="5" width="60" height="80" rx="15" ry="15" fill="none" stroke="#000" strokeWidth="1.5" />
               {/* Flame Symbol */}
               <path d="M 25 75 C 20 65, 30 55, 35 65 C 40 55, 50 65, 45 75 Q 35 70 25 75 Z" fill="#f7941d" stroke="#ed1c24" strokeWidth="1"/>
                {/* Water Pipes */}
               <path d="M 5 20 H 15 M 55 20 H 65" stroke="#0057b8" strokeWidth="1.5" /> {/* Cold In */}
               <path d="M 5 40 H 15 M 55 40 H 65" stroke="#ed1c24" strokeWidth="1.5" /> {/* Hot Out */}
                {/* Flue Gas Outlet */}
               <path d="M 35 5 V 0" stroke="#888" strokeWidth="1.5" />
          </svg>
     );
     return (
          <div style={{ position: 'relative' }}>
               <Tooltip title={`${data.label}${data.capacity ? ` - ${data.capacity}` : ''}`} arrow placement="top">
                    <Box sx={style}>
                         {svgIcon}
                         <NodeLabel data={data} />
                    </Box>
               </Tooltip>
               <Handle type="target" position={Position.Left} id="water_in" style={{ background: '#0057b8', top:'25%' }} isConnectable={isConnectable} />
               <Handle type="source" position={Position.Right} id="water_out" style={{ background: '#ed1c24', top:'50%' }} isConnectable={isConnectable} />
               <Handle type="target" position={Position.Bottom} id="fuel_in" style={{ background: '#ffd700' }} isConnectable={isConnectable} />
               <Handle type="source" position={Position.Top} id="flue_out" style={{ background: '#888' }} isConnectable={isConnectable} />
          </div>
     );
};

export const DamperNode: React.FC<NodeProps<HvacNodeData>> = ({ data, isConnectable }) => {
     const style = { ...baseStyle, ...componentStyles.damper, border:'none', background:'none', padding: '2px' };
     const svgIcon = ( // Bowtie symbol similar to butterfly valve, but often in duct context
          <svg width="40" height="40" viewBox="0 0 50 50">
                <path d="M5 25 H 45" stroke="#000" strokeWidth="1.5" /> {/* Duct Line */}
               <path d="M15 25 L 25 15 L 35 25 L 25 35 Z" fill="none" stroke="#000" strokeWidth="1.5" /> {/* Damper Blades */}
               {/* Actuator indication (optional) */}
               <circle cx="25" cy="10" r="4" fill="none" stroke="#000" strokeWidth="1"/>
               <line x1="25" y1="14" x2="25" y2="15" stroke="#000" strokeWidth="1" />
          </svg>
     );
     return (
          <div style={{ position: 'relative' }}>
               <Tooltip title={`${data.label}${data.specification ? ` (${data.specification})` : ''}`} arrow placement="top">
                    <Box sx={style}>
                         {svgIcon}
                         <NodeLabel data={data} />
                    </Box>
               </Tooltip>
               <Handle type="target" position={Position.Left} id="in" style={{ background: '#ccc' }} isConnectable={isConnectable} />
               <Handle type="source" position={Position.Right} id="out" style={{ background: '#ccc' }} isConnectable={isConnectable} />
               {/* Control Handle */}
                <Handle key="control" type="target" position={Position.Top} id="control_signal" style={{ background: '#772953' }} isConnectable={isConnectable} />
          </div>
     );
};

export const FanNode: React.FC<NodeProps<HvacNodeData>> = ({ data, isConnectable }) => {
     const style = { ...baseStyle, ...componentStyles.fan, borderRadius:'50%', padding:'8px' };
     const svgIcon = ( // Standard fan symbol (circle with blades/cross)
          <svg width="40" height="40" viewBox="0 0 50 50">
               <circle cx="25" cy="25" r="20" fill="none" stroke="#000" strokeWidth="1.5" />
               <path d="M25 5 V 45 M 5 25 H 45" stroke="#000" strokeWidth="1" /> {/* Simple Cross */}
               {/* Optional: Curved blades for axial/centrifugal indication */}
               {/* <path d="M 25 5 A 20 20 0 0 1 45 25" fill="none" stroke="#000" strokeWidth="1" />
               <path d="M 45 25 A 20 20 0 0 1 25 45" fill="none" stroke="#000" strokeWidth="1" />
               <path d="M 25 45 A 20 20 0 0 1 5 25" fill="none" stroke="#000" strokeWidth="1" />
               <path d="M 5 25 A 20 20 0 0 1 25 5" fill="none" stroke="#000" strokeWidth="1" /> */}
          </svg>
     );
      return (
          <div style={{ position: 'relative' }}>
               <Tooltip title={`${data.label}${data.capacity ? ` - ${data.capacity}` : ''}`} arrow placement="top">
                    <Box sx={style}>
                         {svgIcon}
                         <NodeLabel data={data} />
                    </Box>
               </Tooltip>
               <Handle type="target" position={Position.Left} id="in" style={{ background: '#ccc' }} isConnectable={isConnectable} />
               <Handle type="source" position={Position.Right} id="out" style={{ background: '#ccc' }} isConnectable={isConnectable} />
          </div>
     );
};


// --- Existing Components (Controller, Electrical, Text, Default) ---
// Keep these as they are, but ensure Danfoss branding applies correctly to Controllers if needed.

export const ControllerNode: React.FC<NodeProps<HvacNodeData>> = ({ data, isConnectable }) => {
  let controllerType = 'controller'; // default
  let svgIcon;
  const typeHint = (data.subType || data.label || '').toLowerCase();

  if (typeHint.includes('pressure') || typeHint.startsWith('rt')) controllerType = 'pressure_controller';
  else if (typeHint.includes('temperature') || typeHint.startsWith('ekc') || typeHint.startsWith('etc')) controllerType = 'temperature_controller';
  else if (typeHint.includes('plc')) controllerType = 'plc';
  else if (typeHint.includes('sensor') || typeHint.includes('transmitter')) controllerType = 'sensor';
  else if (typeHint.includes('gauge')) controllerType = 'gauge';
  else if (typeHint.includes('flow') && typeHint.includes('meter')) controllerType = 'flow_meter';


  const isDanfoss = data.manufacturer?.toLowerCase().includes('danfoss') ||
                    typeHint.includes('danfoss') || typeHint.startsWith('ekc') || typeHint.startsWith('rt') || typeHint.startsWith('mbs') || typeHint.startsWith('aks');

  const style = {
    ...baseStyle,
    ...(componentStyles[controllerType] || componentStyles.controller),
    ...getFluidStyle(undefined, undefined, data.manufacturer), // Primarily for Danfoss border
  };

  // Symbols for Controllers and Instruments
  switch(controllerType) {
    case 'pressure_controller': // Often square with 'P' inside circle
      svgIcon = (
        <svg width="60" height="40" viewBox="0 0 70 50">
          <rect x="5" y="5" width="60" height="40" rx="2" ry="2" fill="none" stroke="#000" strokeWidth="1.5" />
          <circle cx="35" cy="25" r="12" fill="none" stroke="#000" strokeWidth="1" />
          <text x="35" y="30" fontSize="14" textAnchor="middle" fill="#000">P</text>
           {isDanfoss && <circle cx="60" cy="10" r="3" fill={DANFOSS_COLOR} />}
        </svg>
      );
      break;
    case 'temperature_controller': // Square with 'T' inside circle
      svgIcon = (
         <svg width="60" height="40" viewBox="0 0 70 50">
          <rect x="5" y="5" width="60" height="40" rx="2" ry="2" fill="none" stroke="#000" strokeWidth="1.5" />
          <circle cx="35" cy="25" r="12" fill="none" stroke="#000" strokeWidth="1" />
          <text x="35" y="30" fontSize="14" textAnchor="middle" fill="#000">T</text>
           {isDanfoss && <circle cx="60" cy="10" r="3" fill={DANFOSS_COLOR} />}
        </svg>
      );
      break;
    case 'plc': // Programmable Logic Controller - Rectangle with 'PLC'
      svgIcon = (
         <svg width="80" height="50" viewBox="0 0 90 60">
          <rect x="5" y="5" width="80" height="50" rx="3" ry="3" fill="none" stroke="#000" strokeWidth="1.5" />
          <text x="45" y="35" fontSize="18" textAnchor="middle" fill="#000" fontWeight="bold">PLC</text>
           {/* IO indicators (simplified) */}
          <rect x="10" y="10" width="10" height="40" fill="none" stroke="#000" strokeWidth="0.5" />
          <rect x="70" y="10" width="10" height="40" fill="none" stroke="#000" strokeWidth="0.5" />
        </svg>
      );
      break;
     case 'sensor': // Circle with line (general sensor)
     case 'gauge': // Circle with needle (gauge)
       const isGauge = controllerType === 'gauge';
       svgIcon = (
         <svg width="40" height="40" viewBox="0 0 50 50">
           <circle cx="25" cy="25" r="18" fill="none" stroke="#000" strokeWidth="1.5" />
           <line x1="25" y1="25" x2={isGauge ? "40" : "25"} y2={isGauge ? "15" : "7"} stroke="#000" strokeWidth="1.5"/> {/* Needle or Connection */}
           {isDanfoss && <circle cx="40" cy="10" r="3" fill={DANFOSS_COLOR} />}
         </svg>
       );
       break;
     case 'flow_meter': // Circle/Square with 'F' or specific symbol (turbine/orifice)
       svgIcon = (
         <svg width="50" height="40" viewBox="0 0 60 50">
           <rect x="5" y="5" width="50" height="40" rx="2" ry="2" fill="none" stroke="#000" strokeWidth="1.5" />
           <circle cx="30" cy="25" r="12" fill="none" stroke="#000" strokeWidth="1" />
           <text x="30" y="30" fontSize="14" textAnchor="middle" fill="#000">F</text>
           {isDanfoss && <circle cx="50" cy="10" r="3" fill={DANFOSS_COLOR} />}
         </svg>
       );
       break;
    default: // Generic Controller Box
      svgIcon = (
        <svg width="70" height="40" viewBox="0 0 80 50">
          <rect x="5" y="5" width="70" height="40" rx="3" ry="3" fill="none" stroke="#000" strokeWidth="1.5" />
          <rect x="15" y="15" width="50" height="20" rx="1" ry="1" fill="none" stroke="#000" strokeWidth="1" />
          {isDanfoss && <circle cx="70" cy="10" r="3" fill={DANFOSS_COLOR} />}
        </svg>
      );
  }

  // Define Handles - Controllers/Instruments can have varied connections
   let handles: React.ReactNode[];
   if (controllerType === 'sensor' || controllerType === 'gauge' || controllerType === 'flow_meter') {
       handles = [
           <Handle key="process" type="target" position={Position.Bottom} id="process_connection" style={{ background: '#555' }} isConnectable={isConnectable} />, // Connects to pipe/vessel
           <Handle key="signal" type="source" position={Position.Top} id="signal_out" style={{ background: '#772953' }} isConnectable={isConnectable} />, // Outputs signal
       ];
   } else if (controllerType === 'plc') {
        handles = [ // PLC has many IO points
           <Handle key="pwr" type="target" position={Position.Top} id="power_in" style={{ background: '#ff0000', left: '20%' }} isConnectable={isConnectable} />,
           <Handle key="in1" type="target" position={Position.Left} id="input1" style={{ background: '#772953', top: '30%' }} isConnectable={isConnectable} />,
           <Handle key="in2" type="target" position={Position.Left} id="input2" style={{ background: '#772953', top: '70%' }} isConnectable={isConnectable} />,
           <Handle key="out1" type="source" position={Position.Right} id="output1" style={{ background: '#772953', top: '30%' }} isConnectable={isConnectable} />,
           <Handle key="out2" type="source" position={Position.Right} id="output2" style={{ background: '#772953', top: '70%' }} isConnectable={isConnectable} />,
           <Handle key="comm" type="target" position={Position.Bottom} id="network" style={{ background: '#0000ff' }} isConnectable={isConnectable} />,
       ];
   } else { // General Controller
       handles = [
           <Handle key="in" type="target" position={Position.Left} id="sensor_in" style={{ background: '#772953', top: '30%' }} isConnectable={isConnectable} />,
           <Handle key="sp" type="target" position={Position.Left} id="setpoint_in" style={{ background: '#772953', top: '70%' }} isConnectable={isConnectable} />,
           <Handle key="out" type="source" position={Position.Right} id="control_out" style={{ background: '#772953' }} isConnectable={isConnectable} />,
           <Handle key="pwr" type="target" position={Position.Top} id="power" style={{ background: '#ff0000' }} isConnectable={isConnectable} />,
       ];
   }


  return (
    <div style={{ position: 'relative' }}>
      <Tooltip title={`${isDanfoss ? 'Danfoss ' : ''}${data.label}${data.specification ? ` (${data.specification})` : ''}`} arrow placement="top">
        <Box sx={style}>
          {svgIcon}
          <NodeLabel data={data} isDanfoss={isDanfoss} />
        </Box>
      </Tooltip>
      {handles}
    </div>
  );
};


// --- Electrical Components --- (Keep as is, symbols are fairly standard)
export const ElectricalNode: React.FC<NodeProps<HvacNodeData>> = ({ data, isConnectable }) => {
  let componentType = 'motor'; // default
  let svgIcon;
  const typeHint = (data.subType || data.label || '').toLowerCase();

  if (typeHint.includes('vfd') || typeHint.includes('drive') || typeHint.includes('inverter')) componentType = 'vfd';
  else if (typeHint.includes('contactor')) componentType = 'contactor';
  else if (typeHint.includes('relay')) componentType = 'relay';
  else if (typeHint.includes('breaker') || typeHint.includes('circuit')) componentType = 'circuit_breaker';
  else if (typeHint.includes('transformer')) componentType = 'transformer';
  else if (typeHint.includes('motor')) componentType = 'motor';

  const style = {
    ...baseStyle,
    ...(componentStyles[componentType] || componentStyles.motor),
    ...getFluidStyle(undefined, undefined, data.manufacturer), // Check for Danfoss VFDs etc.
  };
  const isDanfoss = data.manufacturer?.toLowerCase().includes('danfoss'); // e.g., VLT Drives


  // Electrical Symbols (ANSI/IEC inspired)
  switch(componentType) {
    case 'vfd': // Variable Frequency Drive
      svgIcon = (
        <svg width="50" height="70" viewBox="0 0 60 80">
          <rect x="10" y="10" width="40" height="60" rx="2" ry="2" fill="none" stroke="#000" strokeWidth="1.5" />
          {/* AC in symbol (~) , DC bus symbol (=), AC out symbol (~) */}
           <path d="M15 20 C 20 15, 25 25, 30 20" fill="none" stroke="#000" strokeWidth="1"/>
           <line x1="15" y1="40" x2="45" y2="40" stroke="#000" strokeWidth="1.5"/>
           <line x1="15" y1="43" x2="45" y2="43" stroke="#000" strokeWidth="0.5" strokeDasharray="3,2"/>
           <path d="M15 60 C 20 55, 25 65, 30 60 S 40 65, 45 60" fill="none" stroke="#000" strokeWidth="1"/>
           <text x="30" y="50" fontSize="10" textAnchor="middle" fill="#000">VFD</text>
           {isDanfoss && <circle cx="50" cy="10" r="3" fill={DANFOSS_COLOR} />}
        </svg>
      );
      break;
    case 'contactor': // Coil and Contacts symbol
      svgIcon = (
        <svg width="40" height="50" viewBox="0 0 50 60">
          {/* Coil */}
          <rect x="15" y="40" width="20" height="10" rx="2" ry="2" fill="none" stroke="#000" strokeWidth="1.5" />
          <text x="10" y="50" fontSize="8" textAnchor="middle">A1</text>
          <text x="40" y="50" fontSize="8" textAnchor="middle">A2</text>
          {/* Main Contacts (Normally Open) */}
          <line x1="10" y1="10" x2="10" y2="20" stroke="#000" strokeWidth="1.5"/>
          <line x1="10" y1="30" x2="10" y2="40" stroke="#000" strokeWidth="1.5"/>
          <line x1="10" y1="25" x2="20" y2="20" stroke="#000" strokeWidth="1.5"/> {/* NO contact symbol */}

          <line x1="25" y1="10" x2="25" y2="20" stroke="#000" strokeWidth="1.5"/>
          <line x1="25" y1="30" x2="25" y2="40" stroke="#000" strokeWidth="1.5"/>
          <line x1="25" y1="25" x2="35" y2="20" stroke="#000" strokeWidth="1.5"/>

           <line x1="40" y1="10" x2="40" y2="20" stroke="#000" strokeWidth="1.5"/>
          <line x1="40" y1="30" x2="40" y2="40" stroke="#000" strokeWidth="1.5"/>
          <line x1="40" y1="25" x2="50" y2="20" stroke="#000" strokeWidth="1.5"/>

           {/* Dashed line linking coil to contacts */}
           <line x1="25" y1="40" x2="25" y2="28" stroke="#000" strokeWidth="1" strokeDasharray="2,2" />
           {isDanfoss && <circle cx="40" cy="5" r="3" fill={DANFOSS_COLOR} />}
        </svg>
      );
      break;
    case 'relay': // Similar to contactor, often smaller, different contact arrangements shown
      svgIcon = (
         <svg width="30" height="40" viewBox="0 0 40 50">
          {/* Coil */}
          <rect x="10" y="30" width="20" height="10" rx="2" ry="2" fill="none" stroke="#000" strokeWidth="1.5" />
           {/* Contacts (e.g., SPDT - Single Pole Double Throw) */}
           <line x1="5" y1="10" x2="5" y2="25" stroke="#000" strokeWidth="1.5"/> {/* Common */}
           <line x1="5" y1="18" x2="15" y2="10" stroke="#000" strokeWidth="1.5"/> {/* Normally Closed (NC) */}
           <line x1="5" y1="18" x2="15" y2="25" stroke="#000" strokeWidth="1.5"/> {/* Normally Open (NO) */}
           <circle cx="17" cy="10" r="2" fill="#fff" stroke="#000" strokeWidth="1" /> {/* NC Terminal */}
           <circle cx="17" cy="25" r="2" fill="#fff" stroke="#000" strokeWidth="1" /> {/* NO Terminal */}
           {/* Link */}
           <line x1="20" y1="30" x2="10" y2="21" stroke="#000" strokeWidth="1" strokeDasharray="2,2" />
        </svg>
      );
      break;
    case 'circuit_breaker': // Breaker symbol (box with arc chute or curve)
      svgIcon = (
        <svg width="30" height="40" viewBox="0 0 40 50">
           <line x1="20" y1="0" x2="20" y2="15" stroke="#000" strokeWidth="1.5"/>
           <line x1="20" y1="35" x2="20" y2="50" stroke="#000" strokeWidth="1.5"/>
           {/* Breaker contacts with thermal/magnetic trip curve */}
           <line x1="20" y1="20" x2="30" y2="15" stroke="#000" strokeWidth="1.5"/>
           <path d="M 20 30 C 25 30 25 25 30 25" fill="none" stroke="#000" strokeWidth="1.5"/> {/* Thermal element */}
           <rect x="10" y="23" width="5" height="4" fill="none" stroke="#000" strokeWidth="1" /> {/* Magnetic element (optional) */}
           {isDanfoss && <circle cx="35" cy="5" r="3" fill={DANFOSS_COLOR} />}
        </svg>
      );
      break;
     case 'transformer':
         svgIcon = ( // Two coils separated by core lines
             <svg width="50" height="40" viewBox="0 0 60 50">
                 {/* Coils */}
                 <path d="M10 10 C 10 5 20 5 20 10 S 10 15 20 20 S 10 25 20 30 S 10 35 20 40" fill="none" stroke="#000" strokeWidth="1.5" />
                 <path d="M40 10 C 40 5 50 5 50 10 S 40 15 50 20 S 40 25 50 30 S 40 35 50 40" fill="none" stroke="#000" strokeWidth="1.5" />
                 {/* Core Lines */}
                 <line x1="25" y1="5" x2="35" y2="5" stroke="#000" strokeWidth="1.5" />
                 <line x1="25" y1="45" x2="35" y2="45" stroke="#000" strokeWidth="1.5" />
             </svg>
         );
         break;
    default: // motor (Circle with M)
      svgIcon = (
        <svg width="50" height="50" viewBox="0 0 60 60">
          <circle cx="30" cy="30" r="25" fill="none" stroke="#000" strokeWidth="1.5" />
          <text x="30" y="37" fontSize="24" textAnchor="middle" stroke="none" fill="#000">M</text>
          {isDanfoss && <circle cx="50" cy="10" r="3" fill={DANFOSS_COLOR} />}
        </svg>
      );
  }

  return (
    <div style={{ position: 'relative' }}>
      <Tooltip title={`${isDanfoss ? 'Danfoss ' : ''}${data.label}${data.specification ? ` - ${data.specification}` : ''}`} arrow placement="top">
        <Box sx={style}>
          {svgIcon}
          <NodeLabel data={data} isDanfoss={isDanfoss}/>
        </Box>
      </Tooltip>
      {/* Basic Electrical Handles */}
      <Handle type="target" position={Position.Top} id="power_in" style={{ background: '#ff0000' }} isConnectable={isConnectable} />
       {/* Motor/VFD output */}
       {(componentType === 'motor' || componentType === 'vfd') &&
         <Handle type="source" position={Position.Bottom} id="power_out" style={{ background: '#ff0000' }} isConnectable={isConnectable} />
       }
       {/* Control signals for VFD/Contactor/Relay */}
       {(componentType === 'vfd' || componentType === 'contactor' || componentType === 'relay') &&
         <Handle type="target" position={Position.Left} id="control_in" style={{ background: '#772953' }} isConnectable={isConnectable} />
       }
       {/* Output contacts for Contactor/Relay/Breaker */}
        {(componentType === 'contactor' || componentType === 'relay' || componentType === 'circuit_breaker') &&
         <Handle type="source" position={Position.Bottom} id="contact_out" style={{ background: '#ff0000' }} isConnectable={isConnectable} />
       }
    </div>
  );
};

export const TextLabelNode: React.FC<NodeProps<HvacNodeData>> = ({ data }) => {
  return (
    <div style={{ position: 'relative' }}>
      <Typography
        variant="body2" // Use body2 for slightly larger default text labels
        sx={{
          padding: '3px 8px',
          background: 'rgba(255, 255, 255, 0.9)', // More opaque background
          border: '1px solid #bbb',
          borderRadius: '3px',
          fontSize: data.size ? `${data.size}rem` : '0.85rem', // Allow size control
          fontWeight: 'normal', // Normal weight unless specified
          boxShadow: '0px 1px 2px rgba(0,0,0,0.1)',
          color: data.color || '#000', // Allow color control
          maxWidth: '200px', // Limit width
          whiteSpace: 'normal', // Allow wrapping
          textAlign: 'center',
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
       <Tooltip title={`${data.label}${data.specification ? ` (${data.specification})` : ''}`} arrow placement="top">
          <Box sx={{ ...baseStyle, ...componentStyles.default }}>
              <Typography variant="caption" sx={{textAlign:'center', maxWidth: '80px', overflow:'hidden', textOverflow:'ellipsis'}}>{data.label || 'Unknown'}</Typography>
          </Box>
       </Tooltip>
      <Handle type="target" position={Position.Left} id="in" style={{ background: '#555' }} isConnectable={isConnectable} />
      <Handle type="source" position={Position.Right} id="out" style={{ background: '#555' }} isConnectable={isConnectable} />
    </div>
  );
};


// --- Node Type Resolver ---
// Maps the 'type' string from your node data to the appropriate React component.
export const getNodeComponent = (type?: string): React.FC<NodeProps<HvacNodeData>> => {
  const safeType = (type || 'default').toLowerCase(); // Ensure type is lowercase and handle undefined

  // Extensive mapping of types/subtypes to components
   const typeMap: Record<string, React.FC<NodeProps<HvacNodeData>>> = {
    // Compressors
    compressor: CompressorNode,
    reciprocating_compressor: CompressorNode,
    piston_compressor: CompressorNode, // Alias
    scroll_compressor: CompressorNode,
    screw_compressor: CompressorNode,
    centrifugal_compressor: CompressorNode,

    // Heat Exchangers (Condensers, Evaporators, General)
    condenser: CondenserNode,
    air_cooled_condenser: CondenserNode,
    water_cooled_condenser: CondenserNode,
    evaporative_condenser: CondenserNode,
    shell_tube_condenser: CondenserNode, // Map to CondenserNode (handles S&T)
    plate_condenser: CondenserNode,     // Map to CondenserNode (handles Plate)

    evaporator: EvaporatorNode,
    dx_evaporator: EvaporatorNode,
    direct_expansion_evaporator: EvaporatorNode, // Alias
    flooded_evaporator: EvaporatorNode,
    shell_tube_evaporator: EvaporatorNode, // Map to EvaporatorNode (handles S&T)
    plate_evaporator: EvaporatorNode,     // Map to EvaporatorNode (handles Plate)
    cold_storage_evaporator: EvaporatorNode, // Map to EvaporatorNode (handles Cold Storage)
    unit_cooler: EvaporatorNode,          // Alias

    heat_exchanger: CondenserNode, // Default HX to CondenserNode (can show S&T/Plate)
    shell_tube_heat_exchanger: CondenserNode,
    plate_heat_exchanger: CondenserNode,

    // Valves (Comprehensive List)
    valve: ValveNode,
    ball_valve: ValveNode,
    gate_valve: ValveNode,
    globe_valve: ValveNode,
    butterfly_valve: ValveNode,
    check_valve: ValveNode,
    non_return_valve: ValveNode, // Alias
    solenoid_valve: ValveNode,
    expansion_valve: ValveNode,
    thermostatic_expansion_valve: ValveNode, // Alias (TEV)
    electronic_expansion_valve: ValveNode, // Alias (EEV)
    pressure_regulating_valve: ValveNode,
    back_pressure_regulator: ValveNode, // KVP etc.
    crankcase_pressure_regulator: ValveNode, // KVL etc.
    condenser_pressure_regulator: ValveNode, // KVR etc.
    evaporator_pressure_regulator: ValveNode, // KVP etc. (alias)
    safety_valve: ValveNode,
    relief_valve: ValveNode, // Alias
    control_valve: ValveNode,
    modulating_valve: ValveNode, // Alias
    three_way_valve: ValveNode,
    four_way_valve: ValveNode,
    reversing_valve: ValveNode, // Alias
    valve_station: ValveNode, // For ICF etc.
    icf_valve_station: ValveNode,

    // Pumps
    pump: PumpNode,
    centrifugal_pump: PumpNode,
    circulator_pump: PumpNode, // Alias
    positive_displacement_pump: PumpNode,
    gear_pump: PumpNode, // Specific PD type
    screw_pump: PumpNode, // Specific PD type
    inline_pump: PumpNode,

    // Vessels & Tanks
    vessel: VesselNode,
    receiver: VesselNode, // HP/LP Receiver
    liquid_receiver: VesselNode, // Alias
    separator: VesselNode,
    oil_separator: VesselNode,
    accumulator: VesselNode,
    suction_accumulator: VesselNode, // Alias
    expansion_tank: VesselNode,

    // Filters, Strainers, Driers
    filter: FilterNode,
    strainer: FilterNode, // Use FilterNode, will render Strainer SVG
    filter_drier: FilterNode,
    oil_filter: FilterNode,

    // HVAC Units
    fan_coil_unit: FanCoilNode,
    fcu: FanCoilNode, // Alias
    floor_fcu: FanCoilNode,
    ceiling_fcu: FanCoilNode,
    cassette_fcu: FanCoilNode,
    wall_fcu: FanCoilNode,
    duct_fcu: FanCoilNode,
    air_handling_unit: FanCoilNode, // Use FanCoilNode for AHU representation (duct type)
    ahu: FanCoilNode, // Alias
    boiler: BoilerNode,
    // chiller: ChillerNode, // Could create a complex ChillerNode later

    // Ventilation Components
    fan: FanNode,
    axial_fan: FanNode,
    centrifugal_fan: FanNode,
    damper: DamperNode,
    control_damper: DamperNode,
    fire_damper: DamperNode, // Could add specific symbol later
    // grille_diffuser: GrilleNode, // Could add later

    // Controls and Instruments
    controller: ControllerNode,
    pressure_controller: ControllerNode,
    temperature_controller: ControllerNode,
    plc: ControllerNode,
    sensor: ControllerNode, // Use ControllerNode, renders Sensor SVG
    pressure_sensor: ControllerNode,
    temperature_sensor: ControllerNode,
    humidity_sensor: ControllerNode,
    transmitter: ControllerNode, // Alias for sensor
    gauge: ControllerNode, // Use ControllerNode, renders Gauge SVG
    pressure_gauge: ControllerNode,
    temperature_gauge: ControllerNode,
    flow_meter: ControllerNode, // Use ControllerNode, renders Flow Meter SVG

    // Electrical Components
    electrical: ElectricalNode, // Generic entry
    motor: ElectricalNode,
    vfd: ElectricalNode,
    variable_frequency_drive: ElectricalNode, // Alias
    contactor: ElectricalNode,
    relay: ElectricalNode,
    circuit_breaker: ElectricalNode,
    transformer: ElectricalNode,

    // Piping Fittings
    piping_fitting: PipingFittingNode,
    elbow: PipingFittingNode,
    tee: PipingFittingNode,
    reducer: PipingFittingNode,
    cross: PipingFittingNode,

    // Special Nodes
    textLabel: TextLabelNode,
    text: TextLabelNode, // Alias

    // Default Fallback
    default: DefaultNode,
  };

  // Find the component in the map
  const Component = typeMap[safeType];

  // If not found directly, try matching prefixes (e.g., 'valve_ball' -> 'valve')
  if (!Component) {
      for (const key in typeMap) {
          if (safeType.startsWith(key + '_') || safeType.startsWith(key + '-')) {
             // console.warn(`Node type "${type}" mapped to prefix component "${key}"`);
             return typeMap[key];
          }
      }
       // console.warn(`Node type "${type}" not found, using DefaultNode.`);
      return DefaultNode;
  }

  return Component;
};