/**
 * ISA-5.1-2009 Valve and Instrumentation Symbol Library
 * Professional P&ID symbols for process control
 * 
 * References:
 * - ISA-5.1-2009: Instrumentation Symbols and Identification
 * - ISO 14617: Graphical symbols for diagrams
 */

import React from 'react';

// ============================================================
// VALVE SYMBOLS - ISA-5.1-2009
// ============================================================

/**
 * Ball Valve Symbol (ISA-5.1)
 * Quarter-turn valve with circular ball representation
 */
export const BallValveSymbol: React.FC<{
    x: number;
    y: number;
    size?: number;
    rotation?: number; // 0=horizontal, 90=vertical
    tag?: string;
    showLabel?: boolean;
}> = ({ x, y, size = 30, rotation = 0, tag = 'BV', showLabel = true }) => {
    return (
        <g transform={`translate(${x}, ${y}) rotate(${rotation})`}>
            {/* Valve body - triangles pointing to each other */}
            <path
                d={`M ${-size / 2},0 L ${-size / 6},${size / 3} L ${-size / 6},${-size / 3} Z`}
                fill="white"
                stroke="black"
                strokeWidth={2}
            />
            <path
                d={`M ${size / 2},0 L ${size / 6},${size / 3} L ${size / 6},${-size / 3} Z`}
                fill="white"
                stroke="black"
                strokeWidth={2}
            />

            {/* Ball representation - circle */}
            <circle cx={0} cy={0} r={size / 6} fill="white" stroke="black" strokeWidth={1.5} />

            {/* Actuator stem */}
            <line x1={0} y1={-size / 6} x2={0} y2={-size / 2.5} stroke="black" strokeWidth={2} />
            <rect x={-size / 8} y={-size / 2.5} width={size / 4} height={size / 6} fill="gray" stroke="black" strokeWidth={1} />

            {/* Tag label */}
            {showLabel && (
                <text
                    x={0}
                    y={size / 2 + 12}
                    textAnchor="middle"
                    fontSize={10}
                    fontFamily="Arial"
                    fontWeight="bold"
                    transform={`rotate(${-rotation})`}
                >
                    {tag}
                </text>
            )}
        </g>
    );
};

/**
 * Globe Valve Symbol (ISA-5.1)
 * Linear motion valve with disk
 */
export const GlobeValveSymbol: React.FC<{
    x: number;
    y: number;
    size?: number;
    rotation?: number;
    tag?: string;
    showLabel?: boolean;
}> = ({ x, y, size = 30, rotation = 0, tag = 'GV', showLabel = true }) => {
    return (
        <g transform={`translate(${x}, ${y}) rotate(${rotation})`}>
            {/* Valve body - triangles */}
            <path
                d={`M ${-size / 2},0 L ${-size / 6},${size / 3} L ${-size / 6},${-size / 3} Z`}
                fill="white"
                stroke="black"
                strokeWidth={2}
            />
            <path
                d={`M ${size / 2},0 L ${size / 6},${size / 3} L ${size / 6},${-size / 3} Z`}
                fill="white"
                stroke="black"
                strokeWidth={2}
            />

            {/* Disk - filled circle */}
            <circle cx={0} cy={0} r={size / 7} fill="black" />

            {/* Stem */}
            <line x1={0} y1={-size / 7} x2={0} y2={-size / 2} stroke="black" strokeWidth={2.5} />

            {/* Handwheel */}
            <circle cx={0} cy={-size / 2} r={size / 8} fill="none" stroke="black" strokeWidth={2} />

            {/* Tag label */}
            {showLabel && (
                <text
                    x={0}
                    y={size / 2 + 12}
                    textAnchor="middle"
                    fontSize={10}
                    fontFamily="Arial"
                    fontWeight="bold"
                    transform={`rotate(${-rotation})`}
                >
                    {tag}
                </text>
            )}
        </g>
    );
};

/**
 * Check Valve Symbol (ISA-5.1)
 * One-way valve with swing disk
 */
export const CheckValveSymbol: React.FC<{
    x: number;
    y: number;
    size?: number;
    rotation?: number;
    tag?: string;
    showLabel?: boolean;
}> = ({ x, y, size = 30, rotation = 0, tag = 'CV', showLabel = true }) => {
    return (
        <g transform={`translate(${x}, ${y}) rotate(${rotation})`}>
            {/* Valve body - triangles */}
            <path
                d={`M ${-size / 2},0 L ${-size / 6},${size / 3} L ${-size / 6},${-size / 3} Z`}
                fill="white"
                stroke="black"
                strokeWidth={2}
            />
            <path
                d={`M ${size / 2},0 L ${size / 6},${size / 3} L ${size / 6},${-size / 3} Z`}
                fill="white"
                stroke="black"
                strokeWidth={2}
            />

            {/* Swing disk - angled line */}
            <line x1={-size / 8} y1={size / 4} x2={size / 12} y2={-size / 4} stroke="black" strokeWidth={2.5} />

            {/* Flow arrow */}
            <path
                d={`M ${size / 2 + 5},0 L ${size / 2 + 12},0 M ${size / 2 + 10},-3 L ${size / 2 + 12},0 L ${size / 2 + 10},3`}
                fill="none"
                stroke="black"
                strokeWidth={1.5}
            />

            {/* Tag label */}
            {showLabel && (
                <text
                    x={0}
                    y={size / 2 + 12}
                    textAnchor="middle"
                    fontSize={10}
                    fontFamily="Arial"
                    fontWeight="bold"
                    transform={`rotate(${-rotation})`}
                >
                    {tag}
                </text>
            )}
        </g>
    );
};

/**
 * Thermostatic Expansion Valve (TEV) Symbol
 * Specialized refrigeration valve with sensing bulb
 */
export const TEVSymbol: React.FC<{
    x: number;
    y: number;
    size?: number;
    rotation?: number;
    tag?: string;
    showLabel?: boolean;
}> = ({ x, y, size = 35, rotation = 0, tag = 'TEV', showLabel = true }) => {
    return (
        <g transform={`translate(${x}, ${y}) rotate(${rotation})`}>
            {/* Valve body - triangles */}
            <path
                d={`M ${-size / 2},0 L ${-size / 6},${size / 3} L ${-size / 6},${-size / 3} Z`}
                fill="white"
                stroke="black"
                strokeWidth={2}
            />
            <path
                d={`M ${size / 2},0 L ${size / 6},${size / 3} L ${size / 6},${-size / 3} Z`}
                fill="white"
                stroke="black"
                strokeWidth={2}
            />

            {/* Needle */}
            <line x1={-size / 8} y1={size / 4} x2={size / 8} y2={-size / 4} stroke="black" strokeWidth={2} />

            {/* Thermal bulb - circle above */}
            <circle cx={0} cy={-size / 1.8} r={size / 6} fill="lightblue" stroke="black" strokeWidth={1.5} />

            {/* Capillary tube */}
            <line x1={0} y1={-size / 2.5} x2={0} y2={-size / 3.5} stroke="black" strokeWidth={1} />

            {/* Tag label */}
            {showLabel && (
                <text
                    x={0}
                    y={size / 2 + 12}
                    textAnchor="middle"
                    fontSize={10}
                    fontFamily="Arial"
                    fontWeight="bold"
                    transform={`rotate(${-rotation})`}
                >
                    {tag}
                </text>
            )}
        </g>
    );
};

/**
 * Pressure Relief Valve Symbol (ISA-5.1)
 * Safety valve with spring
 */
export const PressureReliefValveSymbol: React.FC<{
    x: number;
    y: number;
    size?: number;
    tag?: string;
    showLabel?: boolean;
}> = ({ x, y, size = 35, tag = 'PSV', showLabel = true }) => {
    return (
        <g transform={`translate(${x}, ${y})`}>
            {/* Valve body - triangles */}
            <path
                d={`M ${-size / 2},0 L ${-size / 6},${size / 3} L ${-size / 6},${-size / 3} Z`}
                fill="white"
                stroke="black"
                strokeWidth={2}
            />
            <path
                d={`M ${size / 2},0 L ${size / 6},${size / 3} L ${size / 6},${-size / 3} Z`}
                fill="white"
                stroke="black"
                strokeWidth={2}
            />

            {/* Disk */}
            <circle cx={0} cy={0} r={size / 8} fill="black" />

            {/* Spring above */}
            <path
                d={`M 0,${-size / 8} Q ${-size / 12},${-size / 5} 0,${-size / 3.5} Q ${size / 12},${-size / 2.5} 0,${-size / 2.2} Q ${-size / 12},${-size / 1.9} 0,${-size / 1.7}`}
                fill="none"
                stroke="black"
                strokeWidth={1.5}
            />

            {/* Spring cap */}
            <rect x={-size / 6} y={-size / 1.7} width={size / 3} height={size / 12} fill="gray" stroke="black" strokeWidth={1} />

            {/* Discharge pipe */}
            <line x1={size / 6} y1={-size / 4} x2={size / 2.5} y2={-size / 2} stroke="black" strokeWidth={2} />
            <path
                d={`M ${size / 2.5},${-size / 2} L ${size / 2.2},${-size / 1.8} L ${size / 2.8},${-size / 1.8} Z`}
                fill="black"
            />

            {/* Tag label */}
            {showLabel && (
                <text
                    x={0}
                    y={size / 2 + 12}
                    textAnchor="middle"
                    fontSize={10}
                    fontFamily="Arial"
                    fontWeight="bold"
                >
                    {tag}
                </text>
            )}
        </g>
    );
};

/**
 * Solenoid Valve Symbol (ISA-5.1)
 * Electrically actuated valve
 */
export const SolenoidValveSymbol: React.FC<{
    x: number;
    y: number;
    size?: number;
    rotation?: number;
    tag?: string;
    showLabel?: boolean;
}> = ({ x, y, size = 30, rotation = 0, tag = 'SV', showLabel = true }) => {
    return (
        <g transform={`translate(${x}, ${y}) rotate(${rotation})`}>
            {/* Valve body - triangles */}
            <path
                d={`M ${-size / 2},0 L ${-size / 6},${size / 3} L ${-size / 6},${-size / 3} Z`}
                fill="white"
                stroke="black"
                strokeWidth={2}
            />
            <path
                d={`M ${size / 2},0 L ${size / 6},${size / 3} L ${size / 6},${-size / 3} Z`}
                fill="white"
                stroke="black"
                strokeWidth={2}
            />

            {/* Plunger */}
            <rect x={-size / 12} y={-size / 10} width={size / 6} height={size / 5} fill="gray" stroke="black" strokeWidth={1} />

            {/* Solenoid coil - rectangle with diagonal lines */}
            <rect x={-size / 5} y={-size / 2} width={size / 2.5} height={size / 3} fill="white" stroke="black" strokeWidth={1.5} />
            <line x1={-size / 5} y1={-size / 2} x2={size / 3.5} y2={-size / 6} stroke="black" strokeWidth={0.5} />
            <line x1={-size / 5} y1={-size / 3} x2={size / 3.5} y2={-size / 12} stroke="black" strokeWidth={0.5} />

            {/* Electrical connection */}
            <line x1={size / 3.5} y1={-size / 2.5} x2={size / 2.5} y2={-size / 2.5} stroke="black" strokeWidth={1} />
            <circle cx={size / 2.5} cy={-size / 2.5} r={2} fill="black" />

            {/* Tag label */}
            {showLabel && (
                <text
                    x={0}
                    y={size / 2 + 12}
                    textAnchor="middle"
                    fontSize={10}
                    fontFamily="Arial"
                    fontWeight="bold"
                    transform={`rotate(${-rotation})`}
                >
                    {tag}
                </text>
            )}
        </g>
    );
};

// ============================================================
// INSTRUMENTATION SYMBOLS - ISA-5.1-2009
// ============================================================

/**
 * Instrument Bubble - Base component for all instruments
 * Circle with tag identifier per ISA-5.1
 */
export const InstrumentBubble: React.FC<{
    x: number;
    y: number;
    tag: string;
    size?: number;
    lineConnection?: 'top' | 'bottom' | 'left' | 'right';
}> = ({ x, y, tag, size = 25, lineConnection = 'bottom' }) => {
    // Connection line points
    const connections = {
        top: { x1: x, y1: y - size, x2: x, y2: y - size - 15 },
        bottom: { x1: x, y1: y + size, x2: x, y2: y + size + 15 },
        left: { x1: x - size, y1: y, x2: x - size - 15, y2: y },
        right: { x1: x + size, y1: y, x2: x + size + 15, y2: y }
    };

    const conn = connections[lineConnection];

    return (
        <g>
            {/* Connection line to process */}
            <line x1={conn.x1} y1={conn.y1} x2={conn.x2} y2={conn.y2} stroke="black" strokeWidth={1} />

            {/* Instrument bubble */}
            <circle cx={x} cy={y} r={size} fill="white" stroke="black" strokeWidth={2} />

            {/* Tag text */}
            <text
                x={x}
                y={y + 5}
                textAnchor="middle"
                fontSize={11}
                fontFamily="Arial"
                fontWeight="bold"
            >
                {tag}
            </text>
        </g>
    );
};

/**
 * Pressure Transmitter (PT)
 */
export const PressureTransmitterSymbol: React.FC<{
    x: number;
    y: number;
    tag: string;
    showLabel?: boolean;
}> = ({ x, y, tag, showLabel = true }) => {
    return (
        <g>
            <InstrumentBubble x={x} y={y} tag={tag} lineConnection="bottom" />
            {showLabel && (
                <text x={x} y={y + 45} textAnchor="middle" fontSize={9} fontFamily="Arial">
                    Pressure
                </text>
            )}
        </g>
    );
};

/**
 * Temperature Transmitter (TT)
 */
export const TemperatureTransmitterSymbol: React.FC<{
    x: number;
    y: number;
    tag: string;
    showLabel?: boolean;
}> = ({ x, y, tag, showLabel = true }) => {
    return (
        <g>
            <InstrumentBubble x={x} y={y} tag={tag} lineConnection="bottom" />
            {/* Thermowell */}
            <line x1={x} y1={y + 25} x2={x} y2={y + 40} stroke="black" strokeWidth={3} />
            {showLabel && (
                <text x={x} y={y + 55} textAnchor="middle" fontSize={9} fontFamily="Arial">
                    Temperature
                </text>
            )}
        </g>
    );
};

/**
 * Level Transmitter (LT)
 */
export const LevelTransmitterSymbol: React.FC<{
    x: number;
    y: number;
    tag: string;
    showLabel?: boolean;
}> = ({ x, y, tag, showLabel = true }) => {
    return (
        <g>
            <InstrumentBubble x={x} y={y} tag={tag} lineConnection="left" />
            {showLabel && (
                <text x={x} y={y + 45} textAnchor="middle" fontSize={9} fontFamily="Arial">
                    Level
                </text>
            )}
        </g>
    );
};

/**
 * Flow Transmitter (FT)
 */
export const FlowTransmitterSymbol: React.FC<{
    x: number;
    y: number;
    tag: string;
    showLabel?: boolean;
}> = ({ x, y, tag, showLabel = true }) => {
    return (
        <g>
            <InstrumentBubble x={x} y={y} tag={tag} lineConnection="top" />
            {/* Orifice plate representation */}
            <circle cx={x} cy={y + 40} r={15} fill="none" stroke="black" strokeWidth={2} />
            <rect x={x - 2} y={y + 25} width={4} height={30} fill="gray" stroke="black" strokeWidth={1} />
            {showLabel && (
                <text x={x} y={y + 70} textAnchor="middle" fontSize={9} fontFamily="Arial">
                    Flow
                </text>
            )}
        </g>
    );
};

/**
 * Pressure Indicator (PI) - Local gauge
 */
export const PressureIndicatorSymbol: React.FC<{
    x: number;
    y: number;
    tag: string;
    showLabel?: boolean;
}> = ({ x, y, tag, showLabel = true }) => {
    return (
        <g>
            {/* Mounting line */}
            <line x1={x} y1={y + 25} x2={x} y2={y + 15} stroke="black" strokeWidth={1.5} />

            {/* Gauge circle */}
            <circle cx={x} cy={y} r={20} fill="white" stroke="black" strokeWidth={2} />

            {/* Gauge face markings */}
            <path d={`M ${x - 12},${y + 2} Q ${x},${y - 10} ${x + 12},${y + 2}`} fill="none" stroke="black" strokeWidth={1} />

            {/* Needle */}
            <line x1={x} y1={y} x2={x + 8} y2={y - 5} stroke="red" strokeWidth={1.5} />

            {/* Tag */}
            <text x={x} y={y + 5} textAnchor="middle" fontSize={9} fontFamily="Arial" fontWeight="bold">
                {tag}
            </text>

            {showLabel && (
                <text x={x} y={y + 40} textAnchor="middle" fontSize={9} fontFamily="Arial">
                    Pressure
                </text>
            )}
        </g>
    );
};

/**
 * Temperature Indicator (TI) - Local gauge
 */
export const TemperatureIndicatorSymbol: React.FC<{
    x: number;
    y: number;
    tag: string;
    showLabel?: boolean;
}> = ({ x, y, tag, showLabel = true }) => {
    return (
        <g>
            {/* Thermowell */}
            <line x1={x} y1={y + 20} x2={x} y2={y + 35} stroke="black" strokeWidth={3} />

            {/* Gauge circle */}
            <circle cx={x} cy={y} r={18} fill="white" stroke="black" strokeWidth={2} />

            {/* Scale */}
            <line x1={x - 8} y1={y} x2={x + 8} y2={y} stroke="black" strokeWidth={0.5} />
            <line x1={x} y1={y - 8} x2={x} y2={y + 8} stroke="black" strokeWidth={0.5} />

            {/* Mercury column indicator */}
            <rect x={x - 2} y={y - 6} width={4} height={8} fill="red" stroke="none" />

            {/* Tag */}
            <text x={x} y={y + 5} textAnchor="middle" fontSize={8} fontFamily="Arial" fontWeight="bold">
                {tag}
            </text>

            {showLabel && (
                <text x={x} y={y + 50} textAnchor="middle" fontSize={9} fontFamily="Arial">
                    Temperature
                </text>
            )}
        </g>
    );
};

export default {
    // Valves
    BallValveSymbol,
    GlobeValveSymbol,
    CheckValveSymbol,
    TEVSymbol,
    PressureReliefValveSymbol,
    SolenoidValveSymbol,
    // Instrumentation
    InstrumentBubble,
    PressureTransmitterSymbol,
    TemperatureTransmitterSymbol,
    LevelTransmitterSymbol,
    FlowTransmitterSymbol,
    PressureIndicatorSymbol,
    TemperatureIndicatorSymbol
};
