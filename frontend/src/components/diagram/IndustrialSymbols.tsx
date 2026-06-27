/*
 * IndustrialSymbols.tsx
 * Industry standard HVACR symbols based on international standards (ASHRAE, DIN, ISO)
 * Date: 2025-04-27 16:15:00
 * Path: C:\Users\Erfan\cool-assist-clean\frontend\src\components\diagram\IndustrialSymbols.tsx
 */

import React from 'react';

// Base symbol interface
export interface SymbolProps {
  width?: number;
  height?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  refrigerantType?: string; // Ammonia, CO2, R134a, R410A, etc.
  manufacturer?: string;    // Danfoss, York, Carrier, etc.
  className?: string;
  style?: React.CSSProperties;
}

// Standard colors based on refrigerant type
export const getRefrigerantColor = (type?: string): string => {
  if (!type) return '#000000';
  
  const typeLC = type.toLowerCase();
  
  if (typeLC.includes('ammonia') || typeLC.includes('nh3')) return '#355E3B'; // Forest Green
  if (typeLC.includes('co2') || typeLC.includes('r744')) return '#800020';    // Burgundy
  if (typeLC.includes('r134a')) return '#0047AB';                            // Cobalt Blue
  if (typeLC.includes('r410a')) return '#228B22';                            // Forest Green 
  if (typeLC.includes('r22')) return '#1E90FF';                              // Dodger Blue
  if (typeLC.includes('r404a')) return '#B8860B';                            // Dark Golden Rod
  if (typeLC.includes('r507')) return '#8A2BE2';                             // Blue Violet
  if (typeLC.includes('r407c')) return '#20B2AA';                            // Light Sea Green
  
  return '#000000'; // Default black
};

// Standard colors for temperature ranges (DIN standard)
export const getTemperatureColor = (temp?: number): string => {
  if (temp === undefined) return '#000000';
  
  // DIN 2403 standard pipe colors by temperature
  if (temp < -20) return '#0057b8';       // Deep Blue (Very low temp)
  if (temp < 0) return '#00a2ed';         // Light Blue (Low temp)
  if (temp < 20) return '#71bf44';        // Green (Cool)
  if (temp < 40) return '#fff200';        // Yellow (Warm)
  if (temp < 80) return '#f7941d';        // Orange (Hot)
  return '#ed1c24';                       // Red (Very hot)
};

/*******************************************
 * COMPRESSOR SYMBOLS
 *******************************************/

// Reciprocating Compressor (ASHRAE/ISO)
export const ReciprocatingCompressorSymbol: React.FC<SymbolProps> = ({
  width = 60, 
  height = 60, 
  fill = 'none', 
  stroke = '#000000', 
  strokeWidth = 2,
  refrigerantType,
  ...props
}) => {
  const refColor = refrigerantType ? getRefrigerantColor(refrigerantType) : stroke;
  
  return (
    <svg 
      width={width} 
      height={height} 
      viewBox="0 0 60 60" 
      fill={fill} 
      stroke={refColor}
      strokeWidth={strokeWidth}
      {...props}
    >
      {/* Main circle */}
      <circle cx="30" cy="30" r="25" />
      
      {/* Cross inside */}
      <path d="M15,30 H45 M30,15 V45" />
      
      {/* Connection points */}
      <circle cx="5" cy="30" r="3" fill={refColor} stroke="none" />
      <circle cx="55" cy="30" r="3" fill={refColor} stroke="none" />
    </svg>
  );
};

// Screw Compressor (ASHRAE/ISO)
export const ScrewCompressorSymbol: React.FC<SymbolProps> = ({
  width = 70, 
  height = 60, 
  fill = 'none', 
  stroke = '#000000', 
  strokeWidth = 2,
  refrigerantType,
  ...props
}) => {
  const refColor = refrigerantType ? getRefrigerantColor(refrigerantType) : stroke;
  
  return (
    <svg 
      width={width} 
      height={height} 
      viewBox="0 0 70 60" 
      fill={fill} 
      stroke={refColor}
      strokeWidth={strokeWidth}
      {...props}
    >
      {/* Main rounded rectangle */}
      <rect x="10" y="10" width="50" height="40" rx="5" ry="5" />
      
      {/* Screws representation */}
      <ellipse cx="25" cy="30" rx="5" ry="15" />
      <ellipse cx="45" cy="30" rx="5" ry="15" />
      
      {/* Connection points */}
      <circle cx="5" cy="30" r="3" fill={refColor} stroke="none" />
      <circle cx="65" cy="30" r="3" fill={refColor} stroke="none" />
    </svg>
  );
};

// Scroll Compressor (ASHRAE/ISO)
export const ScrollCompressorSymbol: React.FC<SymbolProps> = ({
  width = 60, 
  height = 60, 
  fill = 'none', 
  stroke = '#000000', 
  strokeWidth = 2,
  refrigerantType,
  ...props
}) => {
  const refColor = refrigerantType ? getRefrigerantColor(refrigerantType) : stroke;
  
  return (
    <svg 
      width={width} 
      height={height} 
      viewBox="0 0 60 60" 
      fill={fill} 
      stroke={refColor}
      strokeWidth={strokeWidth}
      {...props}
    >
      {/* Main circle */}
      <circle cx="30" cy="30" r="25" />
      
      {/* Spiral inside */}
      <path d="M30,30 m0,0 a10,10 0 0 1 10,-10 a10,10 0 0 1 -10,10" />
      <path d="M30,30 m0,0 a15,15 0 0 0 -15,15 a15,15 0 0 0 15,-15" />
      
      {/* Connection points */}
      <circle cx="5" cy="30" r="3" fill={refColor} stroke="none" />
      <circle cx="55" cy="30" r="3" fill={refColor} stroke="none" />
    </svg>
  );
};

// Centrifugal Compressor (ASHRAE/ISO)
export const CentrifugalCompressorSymbol: React.FC<SymbolProps> = ({
  width = 80, 
  height = 60, 
  fill = 'none', 
  stroke = '#000000', 
  strokeWidth = 2,
  refrigerantType,
  ...props
}) => {
  const refColor = refrigerantType ? getRefrigerantColor(refrigerantType) : stroke;
  
  return (
    <svg 
      width={width} 
      height={height} 
      viewBox="0 0 80 60" 
      fill={fill}
      stroke={refColor}
      strokeWidth={strokeWidth}
      {...props}
    >
      {/* Main oval */}
      <ellipse cx="40" cy="30" rx="30" ry="25" />
      
      {/* Impeller representation */}
      <circle cx="40" cy="30" r="15" />
      <path d="M25,30 H55" />
      <path d="M40,15 V45" />
      <path d="M30,20 L50,40" />
      <path d="M30,40 L50,20" />
      
      {/* Connection points */}
      <circle cx="5" cy="30" r="3" fill={refColor} stroke="none" />
      <circle cx="75" cy="30" r="3" fill={refColor} stroke="none" />
    </svg>
  );
};

/*******************************************
 * HEAT EXCHANGER SYMBOLS
 *******************************************/

// Shell and Tube Condenser (ASHRAE/ISO)
export const WaterCooledCondenserSymbol: React.FC<SymbolProps> = ({
  width = 100, 
  height = 60, 
  fill = 'none', 
  stroke = '#000000', 
  strokeWidth = 2,
  refrigerantType,
  ...props
}) => {
  const refColor = refrigerantType ? getRefrigerantColor(refrigerantType) : stroke;
  
  return (
    <svg 
      width={width} 
      height={height} 
      viewBox="0 0 100 60" 
      fill={fill}
      stroke={refColor}
      strokeWidth={strokeWidth}
      {...props}
    >
      {/* Main shell */}
      <rect x="10" y="10" width="80" height="40" rx="5" ry="20" />
      
      {/* Tubes */}
      <line x1="10" y1="25" x2="90" y2="25" />
      <line x1="10" y1="35" x2="90" y2="35" />
      
      {/* Water connections (blue) */}
      <line x1="20" y1="10" x2="20" y2="0" stroke="#0099ff" strokeWidth={strokeWidth} />
      <line x1="80" y1="50" x2="80" y2="60" stroke="#0099ff" strokeWidth={strokeWidth} />
      <circle cx="20" cy="5" r="3" fill="#0099ff" stroke="none" />
      <circle cx="80" cy="55" r="3" fill="#0099ff" stroke="none" />
      
      {/* Refrigerant connections */}
      <circle cx="5" cy="30" r="3" fill={refColor} stroke="none" />
      <circle cx="95" cy="30" r="3" fill={refColor} stroke="none" />
    </svg>
  );
};

// Air Cooled Condenser (ASHRAE/ISO)
export const AirCooledCondenserSymbol: React.FC<SymbolProps> = ({
  width = 120, 
  height = 80, 
  fill = 'none', 
  stroke = '#000000', 
  strokeWidth = 2,
  refrigerantType,
  ...props
}) => {
  const refColor = refrigerantType ? getRefrigerantColor(refrigerantType) : stroke;
  
  return (
    <svg 
      width={width} 
      height={height} 
      viewBox="0 0 120 80" 
      fill={fill}
      stroke={refColor}
      strokeWidth={strokeWidth}
      {...props}
    >
      {/* Main rectangle */}
      <rect x="10" y="10" width="100" height="40" />
      
      {/* Fins */}
      <line x1="20" y1="10" x2="20" y2="50" />
      <line x1="30" y1="10" x2="30" y2="50" />
      <line x1="40" y1="10" x2="40" y2="50" />
      <line x1="50" y1="10" x2="50" y2="50" />
      <line x1="60" y1="10" x2="60" y2="50" />
      <line x1="70" y1="10" x2="70" y2="50" />
      <line x1="80" y1="10" x2="80" y2="50" />
      <line x1="90" y1="10" x2="90" y2="50" />
      
      {/* Fan symbols */}
      <circle cx="35" cy="65" r="10" />
      <path d="M30,65 H40 M35,60 V70" />
      
      <circle cx="85" cy="65" r="10" />
      <path d="M80,65 H90 M85,60 V70" />
      
      {/* Refrigerant connections */}
      <circle cx="5" cy="30" r="3" fill={refColor} stroke="none" />
      <circle cx="115" cy="30" r="3" fill={refColor} stroke="none" />
    </svg>
  );
};

// Evaporative Condenser (ASHRAE/ISO)
export const EvaporativeCondenserSymbol: React.FC<SymbolProps> = ({
  width = 120, 
  height = 100, 
  fill = 'none', 
  stroke = '#000000', 
  strokeWidth = 2,
  refrigerantType,
  ...props
}) => {
  const refColor = refrigerantType ? getRefrigerantColor(refrigerantType) : stroke;
  
  return (
    <svg 
      width={width} 
      height={height} 
      viewBox="0 0 120 100" 
      fill={fill}
      stroke={refColor}
      strokeWidth={strokeWidth}
      {...props}
    >
      {/* Main casing */}
      <rect x="10" y="10" width="100" height="60" />
      
      {/* Coil/tubes */}
      <line x1="20" y1="10" x2="20" y2="70" />
      <line x1="30" y1="10" x2="30" y2="70" />
      <line x1="40" y1="10" x2="40" y2="70" />
      <line x1="50" y1="10" x2="50" y2="70" />
      <line x1="60" y1="10" x2="60" y2="70" />
      <line x1="70" y1="10" x2="70" y2="70" />
      <line x1="80" y1="10" x2="80" y2="70" />
      <line x1="90" y1="10" x2="90" y2="70" />
      
      {/* Water basin */}
      <rect x="10" y="70" width="100" height="20" />
      <path d="M20,80 Q30,90 40,80 Q50,70 60,80 Q70,90 80,80 Q90,70 100,80" stroke="#0099ff" strokeWidth="1" />
      
      {/* Water spray connection */}
      <line x1="60" y1="0" x2="60" y2="10" stroke="#0099ff" strokeWidth={strokeWidth} />
      <circle cx="60" cy="5" r="3" fill="#0099ff" stroke="none" />
      
      {/* Water drain */}
      <line x1="20" y1="90" x2="20" y2="100" stroke="#0099ff" strokeWidth={strokeWidth} />
      <circle cx="20" cy="95" r="3" fill="#0099ff" stroke="none" />
      
      {/* Refrigerant connections */}
      <circle cx="5" cy="30" r="3" fill={refColor} stroke="none" />
      <circle cx="115" cy="30" r="3" fill={refColor} stroke="none" />
    </svg>
  );
};

// Direct Expansion (DX) Evaporator (ASHRAE/ISO)
export const DXEvaporatorSymbol: React.FC<SymbolProps> = ({
  width = 100, 
  height = 60, 
  fill = 'none', 
  stroke = '#000000', 
  strokeWidth = 2,
  refrigerantType,
  ...props
}) => {
  const refColor = refrigerantType ? getRefrigerantColor(refrigerantType) : stroke;
  
  return (
    <svg 
      width={width} 
      height={height} 
      viewBox="0 0 100 60" 
      fill={fill}
      stroke={refColor}
      strokeWidth={strokeWidth}
      {...props}
    >
      {/* Main rectangle */}
      <rect x="10" y="10" width="80" height="40" />
      
      {/* Tube paths */}
      <path d="M10,20 H90 M10,30 H90 M10,40 H90" />
      
      {/* Fins */}
      <line x1="20" y1="10" x2="20" y2="50" strokeWidth="1" />
      <line x1="30" y1="10" x2="30" y2="50" strokeWidth="1" />
      <line x1="40" y1="10" x2="40" y2="50" strokeWidth="1" />
      <line x1="50" y1="10" x2="50" y2="50" strokeWidth="1" />
      <line x1="60" y1="10" x2="60" y2="50" strokeWidth="1" />
      <line x1="70" y1="10" x2="70" y2="50" strokeWidth="1" />
      <line x1="80" y1="10" x2="80" y2="50" strokeWidth="1" />
      
      {/* Refrigerant connections */}
      <circle cx="5" cy="30" r="3" fill={refColor} stroke="none" />
      <circle cx="95" cy="30" r="3" fill={refColor} stroke="none" />
    </svg>
  );
};

// Flooded Evaporator (ASHRAE/ISO)
export const FloodedEvaporatorSymbol: React.FC<SymbolProps> = ({
  width = 100, 
  height = 60, 
  fill = 'none', 
  stroke = '#000000', 
  strokeWidth = 2,
  refrigerantType,
  ...props
}) => {
  const refColor = refrigerantType ? getRefrigerantColor(refrigerantType) : stroke;
  
  return (
    <svg 
      width={width} 
      height={height} 
      viewBox="0 0 100 60" 
      fill={fill}
      stroke={refColor}
      strokeWidth={strokeWidth}
      {...props}
    >
      {/* Main vessel */}
      <rect x="10" y="10" width="80" height="40" rx="5" ry="5" />
      
      {/* Tube bundles */}
      <line x1="10" y1="25" x2="90" y2="25" />
      <line x1="10" y1="35" x2="90" y2="35" />
      
      {/* Liquid level */}
      <line x1="10" y1="40" x2="90" y2="40" strokeDasharray="5,3" />
      
      {/* Water connections */}
      <line x1="20" y1="0" x2="20" y2="10" stroke="#0099ff" strokeWidth={strokeWidth} />
      <line x1="80" y1="50" x2="80" y2="60" stroke="#0099ff" strokeWidth={strokeWidth} />
      <circle cx="20" cy="5" r="3" fill="#0099ff" stroke="none" />
      <circle cx="80" cy="55" r="3" fill="#0099ff" stroke="none" />
      
      {/* Refrigerant connections */}
      <circle cx="5" cy="20" r="3" fill={refColor} stroke="none" />  {/* Vapor */}
      <circle cx="95" cy="20" r="3" fill={refColor} stroke="none" /> {/* Liquid */}
    </svg>
  );
};

/*******************************************
 * VALVE SYMBOLS (DANFOSS)
 *******************************************/

// Ball Valve (Danfoss/ISO)
export const BallValveSymbol: React.FC<SymbolProps> = ({
  width = 50, 
  height = 50, 
  fill = 'none', 
  stroke = '#000000', 
  strokeWidth = 2,
  refrigerantType,
  manufacturer = '',
  ...props
}) => {
  const refColor = refrigerantType ? getRefrigerantColor(refrigerantType) : stroke;
  const isDanfoss = manufacturer.toLowerCase().includes('danfoss');
  
  return (
    <svg 
      width={width} 
      height={height} 
      viewBox="0 0 50 50" 
      fill={fill}
      stroke={isDanfoss ? '#e31837' : refColor}
      strokeWidth={strokeWidth}
      {...props}
    >
      {/* Main square */}
      <rect x="15" y="15" width="20" height="20" />
      
      {/* Diagonal line (ball) */}
      <line x1="15" y1="15" x2="35" y2="35" />
      
      {/* Connection lines */}
      <line x1="0" y1="25" x2="15" y2="25" />
      <line x1="35" y1="25" x2="50" y2="25" />
      
      {/* Connection points */}
      <circle cx="5" cy="25" r="3" fill={refColor} stroke="none" />
      <circle cx="45" cy="25" r="3" fill={refColor} stroke="none" />
      
      {/* Danfoss logo (if applicable) */}
      {isDanfoss && (
        <path d="M17,40 H33" stroke="#e31837" strokeWidth="1" />
      )}
    </svg>
  );
};

// Check Valve (Danfoss/ISO)
export const CheckValveSymbol: React.FC<SymbolProps> = ({
  width = 50, 
  height = 50, 
  fill = 'none', 
  stroke = '#000000', 
  strokeWidth = 2,
  refrigerantType,
  manufacturer = '',
  ...props
}) => {
  const refColor = refrigerantType ? getRefrigerantColor(refrigerantType) : stroke;
  const isDanfoss = manufacturer.toLowerCase().includes('danfoss');
  
  return (
    <svg 
      width={width} 
      height={height} 
      viewBox="0 0 50 50" 
      fill={fill}
      stroke={isDanfoss ? '#e31837' : refColor}
      strokeWidth={strokeWidth}
      {...props}
    >
      {/* Main triangle */}
      <polygon points="15,15 15,35 35,25" />
      
      {/* Connection lines */}
      <line x1="0" y1="25" x2="15" y2="25" />
      <line x1="35" y1="25" x2="50" y2="25" />
      
      {/* Connection points */}
      <circle cx="5" cy="25" r="3" fill={refColor} stroke="none" />
      <circle cx="45" cy="25" r="3" fill={refColor} stroke="none" />
      
      {/* Danfoss logo (if applicable) */}
      {isDanfoss && (
        <path d="M17,40 H33" stroke="#e31837" strokeWidth="1" />
      )}
    </svg>
  );
};

// Expansion Valve (Danfoss/ISO)
export const ExpansionValveSymbol: React.FC<SymbolProps> = ({
  width = 70, 
  height = 60, 
  fill = 'none', 
  stroke = '#000000', 
  strokeWidth = 2,
  refrigerantType,
  manufacturer = '',
  ...props
}) => {
  const refColor = refrigerantType ? getRefrigerantColor(refrigerantType) : stroke;
  const isDanfoss = manufacturer.toLowerCase().includes('danfoss');
  
  return (
    <svg 
      width={width} 
      height={height} 
      viewBox="0 0 70 60" 
      fill={fill}
      stroke={isDanfoss ? '#e31837' : refColor}
      strokeWidth={strokeWidth}
      {...props}
    >
      {/* Main body */}
      <rect x="20" y="15" width="30" height="20" />
      
      {/* Arrow inside */}
      <polygon points="25,25 45,15 45,35" fill={isDanfoss ? '#e31837' : 'none'} />
      
      {/* Temperature sensor bulb */}
      <circle cx="50" cy="45" r="5" />
      <path d="M50,35 V40" />
      <path d="M50,45 Q60,45 60,35 L60,25" />
      
      {/* Connection lines */}
      <line x1="0" y1="25" x2="20" y2="25" />
      <line x1="50" y1="25" x2="70" y2="25" />
      
      {/* Connection points */}
      <circle cx="5" cy="25" r="3" fill={refColor} stroke="none" />
      <circle cx="65" cy="25" r="3" fill={refColor} stroke="none" />
      
      {/* Danfoss logo (if applicable) */}
      {isDanfoss && (
        <path d="M25,45 H35" stroke="#e31837" strokeWidth="1" />
      )}
    </svg>
  );
};

// Solenoid Valve (Danfoss/ISO)
export const SolenoidValveSymbol: React.FC<SymbolProps> = ({
  width = 60, 
  height = 70, 
  fill = 'none', 
  stroke = '#000000', 
  strokeWidth = 2,
  refrigerantType,
  manufacturer = '',
  ...props
}) => {
  const refColor = refrigerantType ? getRefrigerantColor(refrigerantType) : stroke;
  const isDanfoss = manufacturer.toLowerCase().includes('danfoss');
  
  return (
    <svg 
      width={width} 
      height={height} 
      viewBox="0 0 60 70" 
      fill={fill}
      stroke={isDanfoss ? '#e31837' : refColor}
      strokeWidth={strokeWidth}
      {...props}
    >
      {/* Main body */}
      <rect x="15" y="25" width="30" height="20" />
      
      {/* Solenoid coil */}
      <rect x="15" y="5" width="30" height="20" rx="5" ry="5" />
      
      {/* Plunger */}
      <line x1="30" y1="25" x2="30" y2="45" />
      
      {/* Connection lines */}
      <line x1="0" y1="35" x2="15" y2="35" />
      <line x1="45" y1="35" x2="60" y2="35" />
      
      {/* Electrical connection */}
      <line x1="45" y1="15" x2="60" y2="15" stroke={isDanfoss ? '#e31837' : '#6b6b6b'} />
      <circle cx="55" cy="15" r="3" fill={isDanfoss ? '#e31837' : '#6b6b6b'} stroke="none" />
      
      {/* Connection points */}
      <circle cx="5" cy="35" r="3" fill={refColor} stroke="none" />
      <circle cx="55" cy="35" r="3" fill={refColor} stroke="none" />
      
      {/* Danfoss logo (if applicable) */}
      {isDanfoss && (
        <path d="M20,55 H40" stroke="#e31837" strokeWidth="1" />
      )}
    </svg>
  );
};

// Pressure Regulating Valve (Danfoss/ISO)
export const PressureRegulatingValveSymbol: React.FC<SymbolProps> = ({
  width = 80, 
  height = 70, 
  fill = 'none', 
  stroke = '#000000', 
  strokeWidth = 2,
  refrigerantType,
  manufacturer = '',
  ...props
}) => {
  const refColor = refrigerantType ? getRefrigerantColor(refrigerantType) : stroke;
  const isDanfoss = manufacturer.toLowerCase().includes('danfoss');
  
  return (
    <svg 
      width={width} 
      height={height} 
      viewBox="0 0 80 70" 
      fill={fill}
      stroke={isDanfoss ? '#e31837' : refColor}
      strokeWidth={strokeWidth}
      {...props}
    >
      {/* Main body */}
      <rect x="20" y="25" width="40" height="20" />
      
      {/* Spring */}
      <path d="M40,5 Q35,10 40,15 Q45,20 40,25" />
      
      {/* Arrow inside valve */}
      <polygon points="30,35 50,35 40,45" fill={isDanfoss ? '#e31837' : 'none'} />
      
      {/* Pressure sensing line */}
      <path d="M60,35 Q70,35 70,25 L70,15" strokeDasharray="3,2" />
      <circle cx="70" cy="15" r="3" />
      
      {/* Connection lines */}
      <line x1="0" y1="35" x2="20" y2="35" />
      <line x1="60" y1="35" x2="80" y2="35" />
      
      {/* Connection points */}
      <circle cx="5" cy="35" r="3" fill={refColor} stroke="none" />
      <circle cx="75" cy="35" r="3" fill={refColor} stroke="none" />
      
      {/* Danfoss logo (if applicable) */}
      {isDanfoss && (
        <path d="M30,55 H50" stroke="#e31837" strokeWidth="1" />
      )}
    </svg>
  );
};

/*******************************************
 * VESSEL SYMBOLS
 *******************************************/

// Receiver (ISO)
export const ReceiverSymbol: React.FC<SymbolProps> = ({
  width = 60, 
  height = 100, 
  fill = 'none', 
  stroke = '#000000', 
  strokeWidth = 2,
  refrigerantType,
  ...props
}) => {
  const refColor = refrigerantType ? getRefrigerantColor(refrigerantType) : stroke;
  
  return (
    <svg 
      width={width} 
      height={height} 
      viewBox="0 0 60 100" 
      fill={fill}
      stroke={refColor}
      strokeWidth={strokeWidth}
      {...props}
    >
      {/* Main vessel body - vertical cylinder */}
      <path d="M10,20 L10,80 C10,90 50,90 50,80 L50,20 C50,10 10,10 10,20 Z" />
      
      {/* Top and bottom ellipses */}
      <ellipse cx="30" cy="20" rx="20" ry="10" />
      <ellipse cx="30" cy="80" rx="20" ry="10" />
      
      {/* Liquid level indicator */}
      <line x1="15" y1="50" x2="45" y2="50" strokeDasharray="4,2" />
      
      {/* Connections */}
      <line x1="30" y1="0" x2="30" y2="10" /> {/* Top gas connection */}
      <line x1="30" y1="90" x2="30" y2="100" /> {/* Bottom liquid connection */}
      
      {/* Connection points */}
      <circle cx="30" cy="5" r="3" fill={refColor} stroke="none" />
      <circle cx="30" cy="95" r="3" fill={refColor} stroke="none" />
    </svg>
  );
};

// High Pressure Receiver (ISO)
export const HPReceiverSymbol: React.FC<SymbolProps> = ({
  width = 60, 
  height = 100, 
  fill = 'none', 
  stroke = '#000000', 
  strokeWidth = 2,
  refrigerantType,
  ...props
}) => {
  const refColor = refrigerantType ? getRefrigerantColor(refrigerantType) : stroke;
  
  return (
    <svg 
      width={width} 
      height={height} 
      viewBox="0 0 60 100" 
      fill={fill}
      stroke={refColor}
      strokeWidth={strokeWidth}
      {...props}
    >
      {/* Main vessel body - vertical cylinder */}
      <path d="M10,20 L10,80 C10,90 50,90 50,80 L50,20 C50,10 10,10 10,20 Z" />
      
      {/* Top and bottom ellipses */}
      <ellipse cx="30" cy="20" rx="20" ry="10" />
      <ellipse cx="30" cy="80" rx="20" ry="10" />
      
      {/* HP marking */}
      <text x="30" y="50" textAnchor="middle" stroke="none" fill={refColor} fontSize="16" fontWeight="bold">HP</text>
      
      {/* Liquid level indicator */}
      <line x1="15" y1="60" x2="45" y2="60" strokeDasharray="4,2" />
      
      {/* Safety valve */}
      <path d="M50,30 L60,20" />
      <circle cx="60" cy="20" r="3" />
      
      {/* Connections */}
      <line x1="30" y1="0" x2="30" y2="10" /> {/* Top gas connection */}
      <line x1="30" y1="90" x2="30" y2="100" /> {/* Bottom liquid connection */}
      
      {/* Connection points */}
      <circle cx="30" cy="5" r="3" fill={refColor} stroke="none" />
      <circle cx="30" cy="95" r="3" fill={refColor} stroke="none" />
    </svg>
  );
};

// Low Pressure Receiver (ISO)
export const LPReceiverSymbol: React.FC<SymbolProps> = ({
  width = 60, 
  height = 100, 
  fill = 'none', 
  stroke = '#000000', 
  strokeWidth = 2,
  refrigerantType,
  ...props
}) => {
  const refColor = refrigerantType ? getRefrigerantColor(refrigerantType) : stroke;
  
  return (
    <svg 
      width={width} 
      height={height} 
      viewBox="0 0 60 100" 
      fill={fill}
      stroke={refColor}
      strokeWidth={strokeWidth}
      {...props}
    >
      {/* Main vessel body - vertical cylinder */}
      <path d="M10,20 L10,80 C10,90 50,90 50,80 L50,20 C50,10 10,10 10,20 Z" />
      
      {/* Top and bottom ellipses */}
      <ellipse cx="30" cy="20" rx="20" ry="10" />
      <ellipse cx="30" cy="80" rx="20" ry="10" />
      
      {/* LP marking */}
      <text x="30" y="50" textAnchor="middle" stroke="none" fill={refColor} fontSize="16" fontWeight="bold">LP</text>
      
      {/* Liquid level indicator */}
      <line x1="15" y1="60" x2="45" y2="60" strokeDasharray="4,2" />
      
      {/* Connections */}
      <line x1="30" y1="0" x2="30" y2="10" /> {/* Top gas connection */}
      <line x1="30" y1="90" x2="30" y2="100" /> {/* Bottom liquid connection */}
      <line x1="50" y1="40" x2="60" y2="40" /> {/* Side connection */}
      
      {/* Connection points */}
      <circle cx="30" cy="5" r="3" fill={refColor} stroke="none" />
      <circle cx="30" cy="95" r="3" fill={refColor} stroke="none" />
      <circle cx="55" cy="40" r="3" fill={refColor} stroke="none" />
    </svg>
  );
};

// Oil Separator (ISO)
export const OilSeparatorSymbol: React.FC<SymbolProps> = ({
  width = 60, 
  height = 110, 
  fill = 'none', 
  stroke = '#000000', 
  strokeWidth = 2,
  refrigerantType,
  ...props
}) => {
  const refColor = refrigerantType ? getRefrigerantColor(refrigerantType) : stroke;
  
  return (
    <svg 
      width={width} 
      height={height} 
      viewBox="0 0 60 110" 
      fill={fill}
      stroke={refColor}
      strokeWidth={strokeWidth}
      {...props}
    >
      {/* Main vessel body - vertical cylinder */}
      <path d="M10,20 L10,80 C10,90 50,90 50,80 L50,20 C50,10 10,10 10,20 Z" />
      
      {/* Top and bottom ellipses */}
      <ellipse cx="30" cy="20" rx="20" ry="10" />
      <ellipse cx="30" cy="80" rx="20" ry="10" />
      
      {/* Baffle plate */}
      <path d="M15,40 L45,40" />
      <path d="M30,40 L30,60" />
      
      {/* Oil level */}
      <rect x="10" y="70" width="40" height="10" fill="#d4a373" fillOpacity="0.3" stroke="none" />
      <line x1="10" y1="70" x2="50" y2="70" strokeDasharray="2,1" />
      
      {/* Oil drain */}
      <line x1="30" y1="90" x2="30" y2="110" />
      <circle cx="30" cy="100" r="3" fill="#d4a373" stroke="none" />
      
      {/* Refrigerant connections */}
      <line x1="30" y1="0" x2="30" y2="10" /> {/* Top gas outlet */}
      <line x1="10" y1="30" x2="0" y2="30" /> {/* Side gas inlet */}
      
      {/* Connection points */}
      <circle cx="30" cy="5" r="3" fill={refColor} stroke="none" />
      <circle cx="5" cy="30" r="3" fill={refColor} stroke="none" />
    </svg>
  );
};

/*******************************************
 * FILTER SYMBOLS
 *******************************************/

// Filter Drier (Danfoss/ISO)
export const FilterDrierSymbol: React.FC<SymbolProps> = ({
  width = 50, 
  height = 70, 
  fill = 'none', 
  stroke = '#000000', 
  strokeWidth = 2,
  refrigerantType,
  manufacturer = '',
  ...props
}) => {
  const refColor = refrigerantType ? getRefrigerantColor(refrigerantType) : stroke;
  const isDanfoss = manufacturer.toLowerCase().includes('danfoss');
  
  return (
    <svg 
      width={width} 
      height={height} 
      viewBox="0 0 50 70" 
      fill={fill}
      stroke={isDanfoss ? '#e31837' : refColor}
      strokeWidth={strokeWidth}
      {...props}
    >
      {/* Main body */}
      <rect x="10" y="10" width="30" height="50" rx="5" ry="5" />
      
      {/* Filter elements */}
      <line x1="10" y1="20" x2="40" y2="20" />
      <line x1="10" y1="30" x2="40" y2="30" />
      <line x1="10" y1="40" x2="40" y2="40" />
      <line x1="10" y1="50" x2="40" y2="50" />
      
      {/* Cross pattern for drier */}
      <path d="M15,15 L35,55 M15,55 L35,15" />
      
      {/* Connection lines */}
      <line x1="25" y1="0" x2="25" y2="10" />
      <line x1="25" y1="60" x2="25" y2="70" />
      
      {/* Connection points */}
      <circle cx="25" cy="5" r="3" fill={refColor} stroke="none" />
      <circle cx="25" cy="65" r="3" fill={refColor} stroke="none" />
      
      {/* Flow direction indicator */}
      <polygon points="20,5 30,5 25,10" fill={refColor} stroke="none" />
      
      {/* Danfoss logo (if applicable) */}
      {isDanfoss && (
        <rect x="15" y="30" width="20" height="10" stroke="none" fill="#e31837" fillOpacity="0.1" />
      )}
    </svg>
  );
};

// Export all symbols as a collection
export const IndustrialSymbols = {
  // Compressors
  ReciprocatingCompressor: ReciprocatingCompressorSymbol,
  ScrewCompressor: ScrewCompressorSymbol,
  ScrollCompressor: ScrollCompressorSymbol,
  CentrifugalCompressor: CentrifugalCompressorSymbol,
  
  // Heat exchangers
  WaterCooledCondenser: WaterCooledCondenserSymbol,
  AirCooledCondenser: AirCooledCondenserSymbol,
  EvaporativeCondenser: EvaporativeCondenserSymbol,
  DXEvaporator: DXEvaporatorSymbol,
  FloodedEvaporator: FloodedEvaporatorSymbol,
  
  // Valves
  BallValve: BallValveSymbol,
  CheckValve: CheckValveSymbol,
  ExpansionValve: ExpansionValveSymbol,
  SolenoidValve: SolenoidValveSymbol,
  PressureRegulatingValve: PressureRegulatingValveSymbol,
  
  // Vessels
  Receiver: ReceiverSymbol,
  HPReceiver: HPReceiverSymbol, 
  LPReceiver: LPReceiverSymbol,
  OilSeparator: OilSeparatorSymbol,
  
  // Filters
  FilterDrier: FilterDrierSymbol,
};

export default IndustrialSymbols;