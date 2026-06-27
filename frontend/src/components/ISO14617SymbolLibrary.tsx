/**
 * ISO 14617 Symbol Library - Professional P&ID Components
 * 
 * Comprehensive library for:
 * - Refrigeration (Ammonia, Freon, CO2, Hydrocarbons)
 * - HVAC (Air Handling Units, Chillers, Heat Pumps)
 * - Ventilation (Fans, Dampers, Filters)
 * - Heating (Boilers, Heat Exchangers)
 * 
 * Standards:
 * - ISO 14617-8: Valves and Actuators
 * - ISO 14617-6: Measurement and Control
 * - ISO 14617-9: Pumps and Compressors
 * - ISO 14617-3: Piping Connections
 * 
 * @version 1.0.0
 */

import React from 'react';

// ============================================================
// VALVE SYMBOLS (ISO 14617-8)
// ============================================================

/**
 * Globe Valve (Manual)
 * ISO 14617-8: Basic shut-off valve
 */
export const GlobeValve: React.FC<{
    x: number;
    y: number;
    size: string;
    tag?: string;
    rotation?: number;
}> = ({ x, y, size, tag, rotation = 0 }) => (
    <g transform={`translate(${x}, ${y}) rotate(${rotation})`}>
        {/* Valve body - diamond shape */}
        <path
            d="M 0,-8 L 8,0 L 0,8 L -8,0 Z"
            fill="white"
            stroke="black"
            strokeWidth="1.5"
        />
        {/* Stem */}
        <line x1="0" y1="-8" x2="0" y2="-16" stroke="black" strokeWidth="1.5" />
        {/* Hand wheel */}
        <circle cx="0" cy="-16" r="4" fill="none" stroke="black" strokeWidth="1.2" />
        <line x1="-3" y1="-16" x2="3" y2="-16" stroke="black" strokeWidth="1" />

        {/* Size label */}
        {size && (
            <text x="12" y="4" fontSize="8" fontFamily="Arial" fontWeight="bold">
                {size}
            </text>
        )}

        {/* Tag */}
        {tag && (
            <text x="0" y="20" fontSize="7" fontFamily="Arial" textAnchor="middle">
                {tag}
            </text>
        )}
    </g>
);

/**
 * Solenoid Valve (Electrically Actuated)
 * ISO 14617-8: Valve with electromagnetic actuator
 */
export const SolenoidValve: React.FC<{
    x: number;
    y: number;
    size: string;
    tag?: string;
    normally?: 'open' | 'closed';
    rotation?: number;
}> = ({ x, y, size, tag, normally = 'closed', rotation = 0 }) => (
    <g transform={`translate(${x}, ${y}) rotate(${rotation})`}>
        {/* Valve body */}
        <path
            d="M 0,-8 L 8,0 L 0,8 L -8,0 Z"
            fill="white"
            stroke="black"
            strokeWidth="1.5"
        />

        {/* Solenoid coil */}
        <rect
            x="-6"
            y="-22"
            width="12"
            height="10"
            fill="none"
            stroke="black"
            strokeWidth="1.2"
            rx="1"
        />

        {/* Coil windings indicator */}
        <path
            d="M -4,-20 Q -2,-18 0,-20 Q 2,-22 4,-20"
            fill="none"
            stroke="black"
            strokeWidth="0.8"
        />

        {/* Plunger */}
        <line x1="0" y1="-12" x2="0" y2="-8" stroke="black" strokeWidth="1.5" />

        {/* Normally state indicator */}
        {normally === 'open' && (
            <text x="0" y="-26" fontSize="6" fontFamily="Arial" textAnchor="middle">NO</text>
        )}
        {normally === 'closed' && (
            <text x="0" y="-26" fontSize="6" fontFamily="Arial" textAnchor="middle">NC</text>
        )}

        {/* Size label */}
        {size && (
            <text x="12" y="4" fontSize="8" fontFamily="Arial" fontWeight="bold">
                {size}
            </text>
        )}

        {/* Tag */}
        {tag && (
            <text x="0" y="20" fontSize="7" fontFamily="Arial" textAnchor="middle" fontWeight="bold">
                {tag}
            </text>
        )}
    </g>
);

/**
 * Electronic Expansion Valve (Thermostatic)
 * ISO 14617-8: Expansion valve for refrigeration
 */
export const ExpansionValve: React.FC<{
    x: number;
    y: number;
    size: string;
    tag?: string;
    model?: string;
    rotation?: number;
}> = ({ x, y, size, tag, model, rotation = 0 }) => (
    <g transform={`translate(${x}, ${y}) rotate(${rotation})`}>
        {/* Valve body */}
        <path
            d="M 0,-8 L 8,0 L 0,8 L -8,0 Z"
            fill="white"
            stroke="black"
            strokeWidth="1.5"
        />

        {/* Thermal bulb (top) */}
        <circle cx="0" cy="-18" r="5" fill="lightblue" stroke="black" strokeWidth="1" />

        {/* Capillary tube */}
        <line x1="0" y1="-13" x2="0" y2="-8" stroke="black" strokeWidth="1" strokeDasharray="2,1" />

        {/* TX indicator */}
        <text x="0" y="-16" fontSize="6" fontFamily="Arial" textAnchor="middle" fontWeight="bold">
            TX
        </text>

        {/* Size label */}
        {size && (
            <text x="12" y="4" fontSize="8" fontFamily="Arial" fontWeight="bold">
                {size}
            </text>
        )}

        {/* Tag */}
        {tag && (
            <text x="0" y="20" fontSize="7" fontFamily="Arial" textAnchor="middle" fontWeight="bold">
                {tag}
            </text>
        )}

        {/* Model */}
        {model && (
            <text x="0" y="28" fontSize="6" fontFamily="Arial" textAnchor="middle" fill="#666">
                {model}
            </text>
        )}
    </g>
);

/**
 * Check Valve (Non-Return)
 * ISO 14617-8: One-way flow valve
 */
export const CheckValve: React.FC<{
    x: number;
    y: number;
    size: string;
    rotation?: number;
}> = ({ x, y, size, rotation = 0 }) => (
    <g transform={`translate(${x}, ${y}) rotate(${rotation})`}>
        {/* Body - circle */}
        <circle cx="0" cy="0" r="8" fill="white" stroke="black" strokeWidth="1.5" />

        {/* Disc/flapper */}
        <path
            d="M -4,-6 L -4,6 L 4,0 Z"
            fill="white"
            stroke="black"
            strokeWidth="1.2"
        />

        {/* Flow direction arrow */}
        <path
            d="M -12,0 L -8,0 M 8,0 L 12,0"
            stroke="black"
            strokeWidth="1.2"
        />
        <path
            d="M 10,-2 L 12,0 L 10,2"
            fill="black"
        />

        {/* Size label */}
        {size && (
            <text x="0" y="20" fontSize="8" fontFamily="Arial" fontWeight="bold" textAnchor="middle">
                {size}
            </text>
        )}
    </g>
);

/**
 * Safety Valve (Pressure Relief)
 * ISO 14617-8: Spring-loaded relief valve
 */
export const SafetyValve: React.FC<{
    x: number;
    y: number;
    size: string;
    tag?: string;
    setPressure?: string;
}> = ({ x, y, size, tag, setPressure }) => (
    <g transform={`translate(${x}, ${y})`}>
        {/* Body */}
        <path
            d="M 0,-8 L 8,0 L 0,8 L -8,0 Z"
            fill="white"
            stroke="black"
            strokeWidth="1.5"
        />

        {/* Spring */}
        <path
            d="M 0,-8 L 0,-10 M 0,-10 L -2,-12 L 2,-14 L -2,-16 L 2,-18 L 0,-20"
            fill="none"
            stroke="black"
            strokeWidth="1"
        />

        {/* Spring cap */}
        <rect x="-4" y="-24" width="8" height="4" fill="white" stroke="black" strokeWidth="1" />

        {/* Adjustment screw */}
        <line x1="0" y1="-24" x2="0" y2="-28" stroke="black" strokeWidth="1.5" />

        {/* Size label */}
        {size && (
            <text x="12" y="4" fontSize="8" fontFamily="Arial" fontWeight="bold">
                {size}
            </text>
        )}

        {/* Tag */}
        {tag && (
            <text x="0" y="20" fontSize="7" fontFamily="Arial" textAnchor="middle" fontWeight="bold">
                {tag}
            </text>
        )}

        {/* Set pressure */}
        {setPressure && (
            <text x="0" y="28" fontSize="6" fontFamily="Arial" textAnchor="middle" fill="#666">
                {setPressure}
            </text>
        )}
    </g>
);

/**
 * Ball Valve
 * ISO 14617-8: Quarter-turn valve
 */
export const BallValve: React.FC<{
    x: number;
    y: number;
    size: string;
    tag?: string;
    rotation?: number;
}> = ({ x, y, size, tag, rotation = 0 }) => (
    <g transform={`translate(${x}, ${y}) rotate(${rotation})`}>
        {/* Body - circle */}
        <circle cx="0" cy="0" r="8" fill="white" stroke="black" strokeWidth="1.5" />

        {/* Ball indicator */}
        <circle cx="0" cy="0" r="4" fill="lightgray" stroke="black" strokeWidth="1" />

        {/* Port */}
        <line x1="-4" y1="0" x2="4" y2="0" stroke="black" strokeWidth="1.5" />

        {/* Lever/handle */}
        <line x1="0" y1="0" x2="0" y2="-12" stroke="black" strokeWidth="1.5" />
        <path d="M -2,-12 L 0,-14 L 2,-12 Z" fill="black" />

        {/* Size label */}
        {size && (
            <text x="12" y="4" fontSize="8" fontFamily="Arial" fontWeight="bold">
                {size}
            </text>
        )}

        {/* Tag */}
        {tag && (
            <text x="0" y="20" fontSize="7" fontFamily="Arial" textAnchor="middle">
                {tag}
            </text>
        )}
    </g>
);

/**
 * Butterfly Valve
 * ISO 14617-8: Rotary disc valve
 */
export const ButterflyValve: React.FC<{
    x: number;
    y: number;
    size: string;
    tag?: string;
    rotation?: number;
}> = ({ x, y, size, tag, rotation = 0 }) => (
    <g transform={`translate(${x}, ${y}) rotate(${rotation})`}>
        {/* Body - rectangle */}
        <rect x="-8" y="-8" width="16" height="16" fill="white" stroke="black" strokeWidth="1.5" rx="2" />

        {/* Disc (butterfly) */}
        <ellipse cx="0" cy="0" rx="6" ry="1.5" fill="gray" stroke="black" strokeWidth="1" />

        {/* Shaft */}
        <line x1="0" y1="-8" x2="0" y2="-14" stroke="black" strokeWidth="2" />

        {/* Operator box */}
        <rect x="-3" y="-18" width="6" height="4" fill="white" stroke="black" strokeWidth="1" />

        {/* Size label */}
        {size && (
            <text x="12" y="4" fontSize="8" fontFamily="Arial" fontWeight="bold">
                {size}
            </text>
        )}

        {/* Tag */}
        {tag && (
            <text x="0" y="22" fontSize="7" fontFamily="Arial" textAnchor="middle">
                {tag}
            </text>
        )}
    </g>
);

/**
 * Regulating Valve (Control Valve)
 * ISO 14617-8: Modulating flow control
 */
export const RegulatingValve: React.FC<{
    x: number;
    y: number;
    size: string;
    tag?: string;
    actuator?: 'pneumatic' | 'electric' | 'manual';
    rotation?: number;
}> = ({ x, y, size, tag, actuator = 'manual', rotation = 0 }) => (
    <g transform={`translate(${x}, ${y}) rotate(${rotation})`}>
        {/* Valve body */}
        <path
            d="M 0,-8 L 8,0 L 0,8 L -8,0 Z"
            fill="white"
            stroke="black"
            strokeWidth="1.5"
        />

        {/* Plug/stem */}
        <line x1="0" y1="-8" x2="0" y2="-12" stroke="black" strokeWidth="1.5" />

        {/* Actuator */}
        {actuator === 'pneumatic' && (
            <>
                <circle cx="0" cy="-18" r="6" fill="lightblue" stroke="black" strokeWidth="1.2" />
                <text x="0" y="-16" fontSize="5" fontFamily="Arial" textAnchor="middle">A</text>
            </>
        )}
        {actuator === 'electric' && (
            <>
                <rect x="-5" y="-22" width="10" height="8" fill="lightyellow" stroke="black" strokeWidth="1.2" />
                <text x="0" y="-16" fontSize="5" fontFamily="Arial" textAnchor="middle">M</text>
            </>
        )}
        {actuator === 'manual' && (
            <>
                <circle cx="0" cy="-16" r="4" fill="none" stroke="black" strokeWidth="1.2" />
                <line x1="-3" y1="-16" x2="3" y2="-16" stroke="black" strokeWidth="1" />
            </>
        )}

        {/* Size label */}
        {size && (
            <text x="12" y="4" fontSize="8" fontFamily="Arial" fontWeight="bold">
                {size}
            </text>
        )}

        {/* Tag */}
        {tag && (
            <text x="0" y="20" fontSize="7" fontFamily="Arial" textAnchor="middle" fontWeight="bold">
                {tag}
            </text>
        )}
    </g>
);

/**
 * Filter / Strainer
 * ISO 14617-8: Y-type strainer
 */
export const Filter: React.FC<{
    x: number;
    y: number;
    size: string;
    tag?: string;
    rotation?: number;
}> = ({ x, y, size, tag, rotation = 0 }) => (
    <g transform={`translate(${x}, ${y}) rotate(${rotation})`}>
        {/* Main body - Y shape */}
        <path
            d="M -10,0 L 0,-6 L 0,6 L -10,0 L 10,0"
            fill="white"
            stroke="black"
            strokeWidth="1.5"
        />

        {/* Strainer mesh indication */}
        <line x1="-3" y1="-3" x2="3" y2="3" stroke="black" strokeWidth="0.8" />
        <line x1="-3" y1="0" x2="3" y2="0" stroke="black" strokeWidth="0.8" />
        <line x1="-3" y1="3" x2="3" y2="-3" stroke="black" strokeWidth="0.8" />

        {/* Size label */}
        {size && (
            <text x="14" y="4" fontSize="8" fontFamily="Arial" fontWeight="bold">
                {size}
            </text>
        )}

        {/* Tag */}
        {tag && (
            <text x="0" y="18" fontSize="7" fontFamily="Arial" textAnchor="middle">
                {tag}
            </text>
        )}
    </g>
);

// ============================================================
// INSTRUMENTATION (ISO 14617-6)
// ============================================================

/**
 * Pressure Indicator
 * ISO 14617-6: Pressure measurement
 */
export const PressureIndicator: React.FC<{
    x: number;
    y: number;
    tag: string;
    withAlarm?: boolean;
    withTransmitter?: boolean;
}> = ({ x, y, tag, withAlarm = false, withTransmitter = false }) => (
    <g transform={`translate(${x}, ${y})`}>
        {/* Instrument circle */}
        <circle cx="0" cy="0" r="10" fill="white" stroke="black" strokeWidth="1.5" />

        {/* PI label */}
        <text x="0" y="4" fontSize="7" fontFamily="Arial" textAnchor="middle" fontWeight="bold">
            PI
        </text>

        {/* Alarm indicator */}
        {withAlarm && (
            <path
                d="M 6,-6 L 10,-10 M 10,-6 L 6,-10"
                stroke="red"
                strokeWidth="1.5"
            />
        )}

        {/* Transmitter indicator */}
        {withTransmitter && (
            <circle cx="0" cy="0" r="12" fill="none" stroke="black" strokeWidth="1" strokeDasharray="2,2" />
        )}

        {/* Tag */}
        <text x="0" y="22" fontSize="7" fontFamily="Arial" textAnchor="middle" fontWeight="bold">
            {tag}
        </text>
    </g>
);

/**
 * Temperature Indicator
 * ISO 14617-6: Temperature measurement
 */
export const TemperatureIndicator: React.FC<{
    x: number;
    y: number;
    tag: string;
    withAlarm?: boolean;
    withTransmitter?: boolean;
}> = ({ x, y, tag, withAlarm = false, withTransmitter = false }) => (
    <g transform={`translate(${x}, ${y})`}>
        {/* Instrument circle */}
        <circle cx="0" cy="0" r="10" fill="white" stroke="black" strokeWidth="1.5" />

        {/* TI label */}
        <text x="0" y="4" fontSize="7" fontFamily="Arial" textAnchor="middle" fontWeight="bold">
            TI
        </text>

        {/* Thermowell/sensor */}
        <line x1="0" y1="10" x2="0" y2="18" stroke="black" strokeWidth="1.2" />
        <circle cx="0" cy="20" r="2" fill="black" />

        {/* Alarm indicator */}
        {withAlarm && (
            <path
                d="M 6,-6 L 10,-10 M 10,-6 L 6,-10"
                stroke="red"
                strokeWidth="1.5"
            />
        )}

        {/* Transmitter indicator */}
        {withTransmitter && (
            <circle cx="0" cy="0" r="12" fill="none" stroke="black" strokeWidth="1" strokeDasharray="2,2" />
        )}

        {/* Tag */}
        <text x="0" y="-18" fontSize="7" fontFamily="Arial" textAnchor="middle" fontWeight="bold">
            {tag}
        </text>
    </g>
);

/**
 * Level Indicator
 * ISO 14617-6: Level measurement
 */
export const LevelIndicator: React.FC<{
    x: number;
    y: number;
    tag: string;
    type?: 'sight_glass' | 'float' | 'electronic';
}> = ({ x, y, tag, type = 'sight_glass' }) => (
    <g transform={`translate(${x}, ${y})`}>
        {type === 'sight_glass' ? (
            <>
                {/* Sight glass */}
                <rect x="-4" y="-15" width="8" height="30" fill="lightblue" stroke="black" strokeWidth="1.5" rx="1" />
                <line x1="-4" y1="0" x2="4" y2="0" stroke="blue" strokeWidth="1" strokeDasharray="2,1" />
            </>
        ) : (
            <>
                {/* Electronic level indicator */}
                <circle cx="0" cy="0" r="10" fill="white" stroke="black" strokeWidth="1.5" />
                <text x="0" y="4" fontSize="7" fontFamily="Arial" textAnchor="middle" fontWeight="bold">
                    LI
                </text>
            </>
        )}

        {/* Tag */}
        <text x="0" y="25" fontSize="7" fontFamily="Arial" textAnchor="middle" fontWeight="bold">
            {tag}
        </text>
    </g>
);

/**
 * Flow Indicator
 * ISO 14617-6: Flow measurement
 */
export const FlowIndicator: React.FC<{
    x: number;
    y: number;
    tag: string;
    withTransmitter?: boolean;
}> = ({ x, y, tag, withTransmitter = false }) => (
    <g transform={`translate(${x}, ${y})`}>
        {/* Instrument circle */}
        <circle cx="0" cy="0" r="10" fill="white" stroke="black" strokeWidth="1.5" />

        {/* FI label */}
        <text x="0" y="4" fontSize="7" fontFamily="Arial" textAnchor="middle" fontWeight="bold">
            FI
        </text>

        {/* Flow arrow */}
        <path
            d="M -4,0 L 4,0 M 2,-2 L 4,0 L 2,2"
            stroke="black"
            strokeWidth="1"
        />

        {/* Transmitter indicator */}
        {withTransmitter && (
            <circle cx="0" cy="0" r="12" fill="none" stroke="black" strokeWidth="1" strokeDasharray="2,2" />
        )}

        {/* Tag */}
        <text x="0" y="22" fontSize="7" fontFamily="Arial" textAnchor="middle" fontWeight="bold">
            {tag}
        </text>
    </g>
);

export default {
    // Valves
    GlobeValve,
    SolenoidValve,
    ExpansionValve,
    CheckValve,
    SafetyValve,
    BallValve,
    ButterflyValve,
    RegulatingValve,
    Filter,

    // Instrumentation
    PressureIndicator,
    TemperatureIndicator,
    LevelIndicator,
    FlowIndicator
};
