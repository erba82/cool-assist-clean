/**
 * ISO 14617 Standard P&ID Symbols for Ammonia Refrigeration
 * All symbols are SVG-based and follow international standards
 */

import React from 'react';

// ==================================================================
// COMPRESSOR SYMBOLS
// ==================================================================

export const ScrewCompressorSymbol: React.FC<{ size?: number }> = ({ size = 60 }) => (
    <svg width={size} height={size} viewBox="0 0 60 60">
        <circle cx="30" cy="30" r="25" fill="none" stroke="black" strokeWidth="2" />
        {/* Screw profile indication */}
        <path d="M 15 25 Q 22 30, 15 35" fill="none" stroke="black" strokeWidth="1.5" />
        <path d="M 22 25 Q 29 30, 22 35" fill="none" stroke="black" strokeWidth="1.5" />
        <path d="M 29 25 Q 36 30, 29 35" fill="none" stroke="black" strokeWidth="1.5" />
        <path d="M 36 25 Q 43 30, 36 35" fill="none" stroke="black" strokeWidth="1.5" />
        {/* Shaft */}
        <line x1="0" y1="30" x2="15" y2="30" stroke="black" strokeWidth="2" />
        <line x1="45" y1="30" x2="60" y2="30" stroke="black" strokeWidth="2" />
    </svg>
);

export const ReciprocatingCompressorSymbol: React.FC<{ size?: number }> = ({ size = 60 }) => (
    <svg width={size} height={size} viewBox="0 0 60 60">
        <circle cx="30" cy="30" r="25" fill="none" stroke="black" strokeWidth="2" />
        {/* Piston */}
        <rect x="20" y="20" width="20" height="20" fill="none" stroke="black" strokeWidth="1.5" />
        <line x1="30" y1="15" x2="30" y2="25" stroke="black" strokeWidth="2" />
        {/* Connecting rod */}
        <circle cx="30" cy="45" r="3" fill="black" />
        <line x1="30" y1="40" x2="30" y2="42" stroke="black" strokeWidth="2" />
    </svg>
);

// ==================================================================
// VESSEL SYMBOLS
// ==================================================================

export const HorizontalVesselSymbol: React.FC<{ width?: number; height?: number }> = ({ width = 80, height = 40 }) => (
    <svg width={width} height={height} viewBox="0 0 80 40">
        <ellipse cx="10" cy="20" rx="10" ry="18" fill="none" stroke="black" strokeWidth="2" />
        <line x1="10" y1="2" x2="70" y2="2" stroke="black" strokeWidth="2" />
        <line x1="10" y1="38" x2="70" y2="38" stroke="black" strokeWidth="2" />
        <ellipse cx="70" cy="20" rx="10" ry="18" fill="none" stroke="black" strokeWidth="2" />
        {/* Liquid level */}
        <line x1="10" y1="28" x2="70" y2="28" stroke="blue" strokeWidth="1.5" strokeDasharray="3,3" />
    </svg>
);

export const VerticalVesselSymbol: React.FC<{ width?: number; height?: number }> = ({ width = 50, height = 100 }) => (
    <svg width={width} height={height} viewBox="0 0 50 100">
        <ellipse cx="25" cy="10" rx="20" ry="8" fill="none" stroke="black" strokeWidth="2" />
        <line x1="5" y1="10" x2="5" y2="90" stroke="black" strokeWidth="2" />
        <line x1="45" y1="10" x2="45" y2="90" stroke="black" strokeWidth="2" />
        <ellipse cx="25" cy="90" rx="20" ry="8" fill="none" stroke="black" strokeWidth="2" />
        {/* Liquid level */}
        <line x1="5" y1="70" x2="45" y2="70" stroke="blue" strokeWidth="1.5" strokeDasharray="3,3" />
    </svg>
);

// ==================================================================
// HEAT EXCHANGER SYMBOLS
// ==================================================================

export const EvaporatorSymbol: React.FC<{ width?: number; height?: number }> = ({ width = 80, height = 50 }) => (
    <svg width={width} height={height} viewBox="0 0 80 50">
        {/* Rectangular outline */}
        <rect x="5" y="10" width="70" height="30" fill="none" stroke="black" strokeWidth="2" />
        {/* Coil representation */}
        <path d="M 15 20 L 15 30" stroke="black" strokeWidth="1.5" />
        <path d="M 25 20 L 25 30" stroke="black" strokeWidth="1.5" />
        <path d="M 35 20 L 35 30" stroke="black" strokeWidth="1.5" />
        <path d="M 45 20 L 45 30" stroke="black" strokeWidth="1.5" />
        <path d="M 55 20 L 55 30" stroke="black" strokeWidth="1.5" />
        <path d="M 65 20 L 65 30" stroke="black" strokeWidth="1.5" />
        {/* Fins indication */}
        <line x1="10" y1="15" x2="70" y2="15" stroke="black" strokeWidth="0.5" />
        <line x1="10" y1="35" x2="70" y2="35" stroke="black" strokeWidth="0.5" />
        {/* Fan symbol */}
        <circle cx="40" cy="45" r="3" fill="none" stroke="black" strokeWidth="1" />
        <path d="M 38 43 L 42 47 M 42 43 L 38 47" stroke="black" strokeWidth="1" />
    </svg>
);

export const EvaporativeCondenserSymbol: React.FC<{ width?: number; height?: number }> = ({ width = 80, height = 80 }) => (
    <svg width={width} height={height} viewBox="0 0 80 80">
        {/* Outer shell */}
        <rect x="10" y="10" width="60" height="60" fill="none" stroke="black" strokeWidth="2" />
        {/* Coil */}
        <path d="M 20 20 Q 25 15, 30 20 Q 35 25, 40 20 Q 45 15, 50 20 Q 55 25, 60 20" fill="none" stroke="black" strokeWidth="1.5" />
        <path d="M 20 30 Q 25 25, 30 30 Q 35 35, 40 30 Q 45 25, 50 30 Q 55 35, 60 30" fill="none" stroke="black" strokeWidth="1.5" />
        <path d="M 20 40 Q 25 35, 30 40 Q 35 45, 40 40 Q 45 35, 50 40 Q 55 45, 60 40" fill="none" stroke="black" strokeWidth="1.5" />
        {/* Water spray */}
        <circle cx="25" cy="15" r="1" fill="blue" />
        <circle cx="35" cy="18" r="1" fill="blue" />
        <circle cx="45" cy="15" r="1" fill="blue" />
        <circle cx="55" cy="18" r="1" fill="blue" />
        {/* Fan at bottom */}
        <circle cx="40" cy="65" r="4" fill="none" stroke="black" strokeWidth="1.5" />
        <path d="M 37 63 L 43 67 M 43 63 L 37 67" stroke="black" strokeWidth="1.5" />
    </svg>
);

// ==================================================================
// VALVE SYMBOLS (ISO 14617-5)
// ==================================================================

export const GlobeValveSymbol: React.FC<{ size?: number; open?: boolean }> = ({ size = 30, open = false }) => (
    <svg width={size} height={size} viewBox="0 0 30 30">
        <line x1="0" y1="15" x2="8" y2="15" stroke="black" strokeWidth="2" />
        <line x1="22" y1="15" x2="30" y2="15" stroke="black" strokeWidth="2" />
        <path d="M 8 15 L 12 8 L 18 8 L 22 15 L 18 22 L 12 22 Z" fill="none" stroke="black" strokeWidth="2" />
        {/* Stem */}
        <line x1="15" y1="0" x2="15" y2="8" stroke="black" strokeWidth="1.5" />
        {/* Disc */}
        {open ? (
            <circle cx="15" cy="10" r="2" fill="white" stroke="black" strokeWidth="1" />
        ) : (
            <circle cx="15" cy="15" r="2" fill="black" />
        )}
    </svg>
);

export const CheckValveSymbol: React.FC<{ size?: number }> = ({ size = 30 }) => (
    <svg width={size} height={size} viewBox="0 0 30 30">
        <line x1="0" y1="15" x2="8" y2="15" stroke="black" strokeWidth="2" />
        <line x1="22" y1="15" x2="30" y2="15" stroke="black" strokeWidth="2" />
        <circle cx="15" cy="15" r="7" fill="none" stroke="black" strokeWidth="2" />
        {/* Hinged disc */}
        <path d="M 15 10 L 18 15 L 15 20" fill="none" stroke="black" strokeWidth="1.5" />
        <line x1="11" y1="10" x2="11" y2="20" stroke="black" strokeWidth="1.5" />
    </svg>
);

export const SolenoidValveSymbol: React.FC<{ size?: number }> = ({ size = 35 }) => (
    <svg width={size} height={size} viewBox="0 0 35 35">
        <line x1="0" y1="20" x2="10" y2="20" stroke="black" strokeWidth="2" />
        <line x1="25" y1="20" x2="35" y2="20" stroke="black" strokeWidth="2" />
        {/* Valve body */}
        <rect x="10" y="15" width="15" height="10" fill="none" stroke="black" strokeWidth="2" />
        {/* Solenoid coil */}
        <rect x="12" y="5" width="11" height="8" fill="none" stroke="black" strokeWidth="1.5" />
        <path d="M 14 7 L 14 11 M 16 7 L 16 11 M 18 7 L 18 11 M 20 7 L 20 11" stroke="black" strokeWidth="1" />
        {/* Electrical connection */}
        <line x1="17.5" y1="0" x2="17.5" y2="5" stroke="black" strokeWidth="1" />
    </svg>
);

export const ReliefValveSymbol: React.FC<{ size?: number }> = ({ size = 35 }) => (
    <svg width={size} height={size} viewBox="0 0 35 35">
        <line x1="0" y1="25" x2="10" y2="25" stroke="black" strokeWidth="2" />
        <line x1="25" y1="25" x2="35" y2="25" stroke="black" strokeWidth="2" />
        {/* Valve body */}
        <path d="M 10 25 L 15 15 L 20 15 L 25 25 Z" fill="none" stroke="black" strokeWidth="2" />
        {/* Spring */}
        <path d="M 17.5 0 L 17.5 5 M 16 6 L 19 6 M 16 8 L 19 8 M 16 10 L 19 10 M 16 12 L 19 12 M 17.5 13 L 17.5 15" stroke="black" strokeWidth="1.5" />
        {/* Vent */}
        <line x1="17.5" y1="5" x2="17.5" y2="0" stroke="black" strokeWidth="1.5" />
        <path d="M 15 2 L 17.5 0 L 20 2" fill="none" stroke="black" strokeWidth="1" />
    </svg>
);

export const BallValveSymbol: React.FC<{ size?: number }> = ({ size = 30 }) => (
    <svg width={size} height={size} viewBox="0 0 30 30">
        <line x1="0" y1="15" x2="8" y2="15" stroke="black" strokeWidth="2" />
        <line x1="22" y1="15" x2="30" y2="15" stroke="black" strokeWidth="2" />
        <circle cx="15" cy="15" r="7" fill="none" stroke="black" strokeWidth="2" />
        {/* Ball */}
        <circle cx="15" cy="15" r="4" fill="white" stroke="black" strokeWidth="1.5" />
        {/* Flow port */}
        <line x1="11" y1="15" x2="19" y2="15" stroke="black" strokeWidth="2" />
        {/* Stem */}
        <line x1="15" y1="8" x2="15" y2="0" stroke="black" strokeWidth="1.5" />
    </svg>
);

// ==================================================================
// PUMP SYMBOL
// ==================================================================

export const PumpSymbol: React.FC<{ size?: number }> = ({ size = 50 }) => (
    <svg width={size} height={size} viewBox="0 0 50 50">
        <circle cx="25" cy="25" r="20" fill="none" stroke="black" strokeWidth="2" />
        {/* Impeller */}
        <circle cx="25" cy="25" r="8" fill="none" stroke="black" strokeWidth="1.5" />
        <path d="M 25 25 L 30 20" stroke="black" strokeWidth="1.5" />
        <path d="M 25 25 L 33 25" stroke="black" strokeWidth="1.5" />
        <path d="M 25 25 L 30 30" stroke="black" strokeWidth="1.5" />
        <path d="M 25 25 L 25 33" stroke="black" strokeWidth="1.5" />
        <path d="M 25 25 L 20 30" stroke="black" strokeWidth="1.5" />
        <path d="M 25 25 L 17 25" stroke="black" strokeWidth="1.5" />
        {/* Inlet/Outlet */}
        <line x1="0" y1="25" x2="5" y2="25" stroke="black" strokeWidth="2" />
        <line x1="45" y1="25" x2="50" y2="25" stroke="black" strokeWidth="2" />
        {/* Motor indication */}
        <rect x="20" y="0" width="10" height="8" fill="black" />
    </svg>
);

// ==================================================================
// INSTRUMENT SYMBOLS
// ==================================================================

export const TemperatureIndicatorSymbol: React.FC<{ size?: number }> = ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 20 20">
        <circle cx="10" cy="10" r="8" fill="none" stroke="black" strokeWidth="1.5" />
        <text x="10" y="14" fontSize="10" textAnchor="middle" fontWeight="bold">T</text>
    </svg>
);

export const PressureIndicatorSymbol: React.FC<{ size?: number }> = ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 20 20">
        <circle cx="10" cy="10" r="8" fill="none" stroke="black" strokeWidth="1.5" />
        <text x="10" y="14" fontSize="10" textAnchor="middle" fontWeight="bold">P</text>
    </svg>
);

export const LiquidLevelIndicatorSymbol: React.FC<{ size?: number }> = ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 20 20">
        <circle cx="10" cy="10" r="8" fill="none" stroke="black" strokeWidth="1.5" />
        <text x="10" y="14" fontSize="10" textAnchor="middle" fontWeight="bold">L</text>
    </svg>
);

// ==================================================================
// FLOW DIRECTION ARROW
// ==================================================================

export const FlowArrow: React.FC<{ size?: number; direction?: 'right' | 'left' | 'up' | 'down' }> = ({
    size = 30,
    direction = 'right'
}) => {
    const rotations = { right: 0, down: 90, left: 180, up: 270 };
    return (
        <svg width={size} height={size} viewBox="0 0 30 30" transform={`rotate(${rotations[direction]})`}>
            <line x1="5" y1="15" x2="22" y2="15" stroke="black" strokeWidth="2" />
            <path d="M 18 10 L 25 15 L 18 20" fill="black" />
        </svg>
    );
};

// ==================================================================
// PIPE SIZE LABEL
// ==================================================================

export const PipeSizeLabel: React.FC<{ dn: number }> = ({ dn }) => (
    <text fontSize="10" fontWeight="bold" fill="black">
        DN{dn}
    </text>
);
