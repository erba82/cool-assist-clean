/**
 * ISO 14617 Equipment Symbol Library - Part 2
 * 
 * Equipment symbols for:
 * - Compressors (Screw, Reciprocating, Scroll, Centrifugal)
 * - Heat Exchangers (Shell-tube, Plate, Air-cooled, Evaporative)
 * - Vessels (Separators, Receivers, Accumulators)
 * - Pumps (Centrifugal, Positive Displacement)
 * - Fans and Air Handling
 * - Filters and Strainers
 * 
 * Standards:
 * - ISO 14617-9: Pumps and Compressors
 * - ISO 14617-7: Heat Exchangers
 * - ISO 14617-10: Vessels
 * 
 * @version 1.0.0
 */

import React from 'react';

// ============================================================
// COMPRESSORS (ISO 14617-9)
// ============================================================

/**
 * Screw Compressor
 * ISO 14617-9: Rotary screw type
 */
export const ScrewCompressor: React.FC<{
    x: number;
    y: number;
    tag: string;
    model?: string;
    power?: string;
    capacity?: string;
}> = ({ x, y, tag, model, power, capacity }) => (
    <g transform={`translate(${x}, ${y})`}>
        {/* Main body - rectangle with rounded corners */}
        <rect
            x="-40"
            y="-25"
            width="80"
            height="50"
            fill="white"
            stroke="black"
            strokeWidth="2"
            rx="4"
        />

        {/* Screw rotors indicator */}
        <g>
            {/* Left rotor */}
            <circle cx="-15" cy="0" r="12" fill="lightgray" stroke="black" strokeWidth="1.5" />
            <path
                d="M -15,-12 L -15,12"
                stroke="black"
                strokeWidth="2"
            />

            {/* Right rotor */}
            <circle cx="15" cy="0" r="12" fill="lightgray" stroke="black" strokeWidth="1.5" />
            <path
                d="M 15,-12 L 15,12"
                stroke="black"
                strokeWidth="2"
            />

            {/* Meshing lines */}
            <path
                d="M -3,-8 L 3,-8 M -3,0 L 3,0 M -3,8 L 3,8"
                stroke="black"
                strokeWidth="1"
            />
        </g>

        {/* Suction port (left) */}
        <circle cx="-40" cy="-10" r="4" fill="blue" stroke="black" strokeWidth="1" />
        <text x="-50" y="-8" fontSize="6" fontFamily="Arial">SUC</text>

        {/* Discharge port (right) */}
        <circle cx="40" cy="-10" r="4" fill="red" stroke="black" strokeWidth="1" />
        <text x="45" y="-8" fontSize="6" fontFamily="Arial">DIS</text>

        {/* Oil separator indication */}
        <rect x="25" y="-20" width="10" height="15" fill="lightyellow" stroke="black" strokeWidth="1" />
        <text x="30" y="-8" fontSize="5" fontFamily="Arial" textAnchor="middle">OIL</text>

        {/* Motor */}
        <circle cx="0" cy="0" r="8" fill="yellow" stroke="black" strokeWidth="1.5" />
        <text x="0" y="3" fontSize="6" fontFamily="Arial" textAnchor="middle" fontWeight="bold">M</text>

        {/* Tag */}
        <text x="0" y="-35" fontSize="9" fontFamily="Arial" textAnchor="middle" fontWeight="bold">
            {tag}
        </text>

        {/* Model */}
        {model && (
            <text x="0" y="35" fontSize="7" fontFamily="Arial" textAnchor="middle">
                {model}
            </text>
        )}

        {/* Capacity and Power */}
        {capacity && (
            <text x="0" y="45" fontSize="6" fontFamily="Arial" textAnchor="middle" fill="#666">
                {capacity}
            </text>
        )}
        {power && (
            <text x="0" y="53" fontSize="6" fontFamily="Arial" textAnchor="middle" fill="#666">
                {power}
            </text>
        )}
    </g>
);

/**
 * Reciprocating Compressor
 * ISO 14617-9: Piston type
 */
export const ReciprocatingCompressor: React.FC<{
    x: number;
    y: number;
    tag: string;
    cylinders?: number;
    model?: string;
}> = ({ x, y, tag, cylinders = 4, model }) => (
    <g transform={`translate(${x}, ${y})`}>
        {/* Crankcase */}
        <rect
            x="-35"
            y="-20"
            width="70"
            height="40"
            fill="white"
            stroke="black"
            strokeWidth="2"
            rx="3"
        />

        {/* Cylinders */}
        {Array.from({ length: cylinders }).map((_, i) => {
            const spacing = 60 / cylinders;
            const xPos = -30 + i * spacing + spacing / 2;
            return (
                <g key={i}>
                    <rect
                        x={xPos - 6}
                        y="-35"
                        width="12"
                        height="15"
                        fill="lightgray"
                        stroke="black"
                        strokeWidth="1.5"
                    />
                    {/* Piston */}
                    <rect
                        x={xPos - 4}
                        y="-25"
                        width="8"
                        height="5"
                        fill="darkgray"
                        stroke="black"
                        strokeWidth="1"
                    />
                </g>
            );
        })}

        {/* Crankshaft */}
        <line x1="-30" y1="0" x2="30" y2="0" stroke="black" strokeWidth="3" />
        <circle cx="-20" cy="0" r="4" fill="gray" stroke="black" strokeWidth="1" />
        <circle cx="0" cy="0" r="4" fill="gray" stroke="black" strokeWidth="1" />
        <circle cx="20" cy="0" r="4" fill="gray" stroke="black" strokeWidth="1" />

        {/* Motor */}
        <circle cx="40" cy="0" r="10" fill="yellow" stroke="black" strokeWidth="1.5" />
        <text x="40" y="3" fontSize="7" fontFamily="Arial" textAnchor="middle" fontWeight="bold">M</text>

        {/* Tag */}
        <text x="0" y="-45" fontSize="9" fontFamily="Arial" textAnchor="middle" fontWeight="bold">
            {tag}
        </text>

        {/* Model */}
        {model && (
            <text x="0" y="35" fontSize="7" fontFamily="Arial" textAnchor="middle">
                {model}
            </text>
        )}
    </g>
);

/**
 * Scroll Compressor
 * ISO 14617-9: Scroll type
 */
export const ScrollCompressor: React.FC<{
    x: number;
    y: number;
    tag: string;
    model?: string;
}> = ({ x, y, tag, model }) => (
    <g transform={`translate(${x}, ${y})`}>
        {/* Outer shell */}
        <circle cx="0" cy="0" r="25" fill="white" stroke="black" strokeWidth="2" />

        {/* Scroll spirals */}
        <path
            d="M 0,0 Q 8,-8 12,-4 Q 10,4 4,8 Q -4,6 -8,0 Q -6,-8 0,-10"
            fill="none"
            stroke="black"
            strokeWidth="1.5"
        />
        <path
            d="M 0,2 Q 6,-6 10,-2 Q 8,6 2,10 Q -6,8 -10,2"
            fill="none"
            stroke="black"
            strokeWidth="1.5"
        />

        {/* Motor indication */}
        <circle cx="0" cy="20" r="6" fill="yellow" stroke="black" strokeWidth="1" />
        <text x="0" y="23" fontSize="5" fontFamily="Arial" textAnchor="middle">M</text>

        {/* Tag */}
        <text x="0" y="-35" fontSize="9" fontFamily="Arial" textAnchor="middle" fontWeight="bold">
            {tag}
        </text>

        {/* Model */}
        {model && (
            <text x="0" y="40" fontSize="7" fontFamily="Arial" textAnchor="middle">
                {model}
            </text>
        )}
    </g>
);

// ============================================================
// HEAT EXCHANGERS (ISO 14617-7)
// ============================================================

/**
 * Shell and Tube Heat Exchanger
 * ISO 14617-7: Shell-tube type
 */
export const ShellTubeHeatExchanger: React.FC<{
    x: number;
    y: number;
    tag: string;
    length?: number;
    type?: 'condenser' | 'evaporator' | 'oil_cooler';
}> = ({ x, y, tag, length = 80, type = 'condenser' }) => (
    <g transform={`translate(${x}, ${y})`}>
        {/* Shell */}
        <ellipse
            cx="0"
            cy="0"
            rx={length / 2}
            ry="15"
            fill="white"
            stroke="black"
            strokeWidth="2"
        />

        {/* Tubes */}
        <line x1={-length / 2 + 5} y1="-8" x2={length / 2 - 5} y2="-8" stroke="black" strokeWidth="1" />
        <line x1={-length / 2 + 5} y1="0" x2={length / 2 - 5} y2="0" stroke="black" strokeWidth="1" />
        <line x1={-length / 2 + 5} y1="8" x2={length / 2 - 5} y2="8" stroke="black" strokeWidth="1" />

        {/* Tube sheets */}
        <line x1={-length / 2 + 5} y1="-15" x2={-length / 2 + 5} y2="15" stroke="black" strokeWidth="1.5" />
        <line x1={length / 2 - 5} y1="-15" x2={length / 2 - 5} y2="15" stroke="black" strokeWidth="1.5" />

        {/* Shell side nozzles */}
        <circle cx={-length / 3} cy="-15" r="4" fill={type === 'condenser' ? 'red' : 'blue'} stroke="black" strokeWidth="1" />
        <circle cx={length / 3} cy="15" r="4" fill={type === 'condenser' ? 'orange' : 'lightblue'} stroke="black" strokeWidth="1" />

        {/* Tube side nozzles */}
        <rect x={-length / 2 - 8} y="-6" width="8" height="12" fill="lightgray" stroke="black" strokeWidth="1" />
        <rect x={length / 2} y="-6" width="8" height="12" fill="lightgray" stroke="black" strokeWidth="1" />

        {/* Tag */}
        <text x="0" y="-28" fontSize="9" fontFamily="Arial" textAnchor="middle" fontWeight="bold">
            {tag}
        </text>

        {/* Type label */}
        <text x="0" y="30" fontSize="7" fontFamily="Arial" textAnchor="middle">
            {type.replace('_', ' ').toUpperCase()}
        </text>
    </g>
);

/**
 * Air-Cooled Heat Exchanger (Air Cooler/Evaporator)
 * ISO 14617-7: Finned coil with fans
 */
export const AirCooledHeatExchanger: React.FC<{
    x: number;
    y: number;
    tag: string;
    fans?: number;
    model?: string;
}> = ({ x, y, tag, fans = 2, model }) => (
    <g transform={`translate(${x}, ${y})`}>
        {/* Coil block with fins */}
        <rect
            x="-50"
            y="-30"
            width="100"
            height="60"
            fill="white"
            stroke="black"
            strokeWidth="2"
            rx="3"
        />

        {/* Fin lines */}
        {Array.from({ length: 8 }).map((_, i) => (
            <line
                key={i}
                x1={-45 + i * 12}
                y1="-25"
                x2={-45 + i * 12}
                y2="25"
                stroke="lightgray"
                strokeWidth="1"
            />
        ))}

        {/* Refrigerant tubes (serpentine) */}
        <path
            d="M -40,-20 L 40,-20 L 40,-10 L -40,-10 L -40,0 L 40,0 L 40,10 L -40,10 L -40,20 L 40,20"
            fill="none"
            stroke="blue"
            strokeWidth="2"
        />

        {/* Fans */}
        <g>
            {Array.from({ length: fans }).map((_, i) => {
                const fanX = -50 + (100 / (fans + 1)) * (i + 1);
                return (
                    <g key={i} transform={`translate(${fanX}, -45)`}>
                        {/* Fan circle */}
                        <circle cx="0" cy="0" r="12" fill="lightyellow" stroke="black" strokeWidth="1.5" />
                        {/* Blades */}
                        <path d="M -8,0 L 8,0 M 0,-8 L 0,8 M -6,-6 L 6,6 M -6,6 L 6,-6" stroke="black" strokeWidth="1" />
                        {/* Motor */}
                        <circle cx="0" cy="0" r="4" fill="yellow" stroke="black" strokeWidth="1" />
                    </g>
                );
            })}
        </g>

        {/* Drip pan */}
        <rect x="-48" y="30" width="96" height="8" fill="lightblue" stroke="black" strokeWidth="1" />
        <line x1="-48" y1="35" x2="48" y2="35" stroke="blue" strokeWidth="1" strokeDasharray="2,1" />

        {/* Connections */}
        <circle cx="-50" cy="0" r="4" fill="blue" stroke="black" strokeWidth="1" />
        <circle cx="50" cy="0" r="4" fill="lightblue" stroke="black" strokeWidth="1" />

        {/* Tag */}
        <text x="0" y="-65" fontSize="9" fontFamily="Arial" textAnchor="middle" fontWeight="bold">
            {tag}
        </text>

        {/* Model */}
        {model && (
            <text x="0" y="50" fontSize="7" fontFamily="Arial" textAnchor="middle">
                {model}
            </text>
        )}
    </g>
);

/**
 * Evaporative Condenser
 * ISO 14617-7: Water-cooled with spray
 */
export const EvaporativeCondenser: React.FC<{
    x: number;
    y: number;
    tag: string;
    model?: string;
}> = ({ x, y, tag, model }) => (
    <g transform={`translate(${x}, ${y})`}>
        {/* Main tower body */}
        <rect
            x="-40"
            y="-60"
            width="80"
            height="120"
            fill="white"
            stroke="black"
            strokeWidth="2"
            rx="4"
        />

        {/* Spray headers */}
        <line x1="-35" y1="-50" x2="35" y2="-50" stroke="blue" strokeWidth="2" />
        <circle cx="-25" cy="-50" r="2" fill="blue" />
        <circle cx="0" cy="-50" r="2" fill="blue" />
        <circle cx="25" cy="-50" r="2" fill="blue" />

        {/* Coil bundle (hatched area) */}
        <rect x="-35" y="-40" width="70" height="50" fill="none" stroke="black" strokeWidth="1" />
        {Array.from({ length: 8 }).map((_, i) => (
            <line
                key={i}
                x1={-35 + i * 10}
                y1="-40"
                x2={-35 + i * 10 + 5}
                y2="10"
                stroke="gray"
                strokeWidth="0.5"
            />
        ))}

        {/* Refrigerant inlet/outlet */}
        <circle cx="-40" cy="-20" r="4" fill="red" stroke="black" strokeWidth="1" />
        <text x="-52" y="-18" fontSize="6" fontFamily="Arial">HOT</text>
        <circle cx="40" cy="0" r="4" fill="orange" stroke="black" strokeWidth="1" />
        <text x="4" y="2" fontSize="6" fontFamily="Arial">LIQ</text>

        {/* Water basin */}
        <rect x="-38" y="15" width="76" height="15" fill="lightblue" stroke="black" strokeWidth="1.5" />
        <line x1="-38" y1="22" x2="38" y2="22" stroke="blue" strokeWidth="1" strokeDasharray="2,1" />

        {/* Pump */}
        <circle cx="0" cy="40" r="6" fill="lightgray" stroke="black" strokeWidth="1.5" />
        <path d="M -3,40 L 3,40 M 1,38 L 3,40 L 1,42" stroke="black" strokeWidth="1" />

        {/* Fan */}
        <g transform="translate(0, -75)">
            <circle cx="0" cy="0" r="15" fill="lightyellow" stroke="black" strokeWidth="1.5" />
            <path d="M -10,0 L 10,0 M 0,-10 L 0,10 M -7,-7 L 7,7 M -7,7 L 7,-7" stroke="black" strokeWidth="1.5" />
            <circle cx="0" cy="0" r="5" fill="yellow" stroke="black" strokeWidth="1" />
            <text x="0" y="3" fontSize="5" fontFamily="Arial" textAnchor="middle">M</text>
        </g>

        {/* Tag */}
        <text x="0" y="-95" fontSize="9" fontFamily="Arial" textAnchor="middle" fontWeight="bold">
            {tag}
        </text>

        {/* Model */}
        {model && (
            <text x="0" y="70" fontSize="7" fontFamily="Arial" textAnchor="middle">
                {model}
            </text>
        )}
    </g>
);

// ============================================================
// VESSELS (ISO 14617-10)
// ============================================================

/**
 * Vertical Separator/Receiver
 * ISO 14617-10: Pressure vessel
 */
export const VerticalVessel: React.FC<{
    x: number;
    y: number;
    tag: string;
    height?: number;
    diameter?: number;
    type?: 'separator' | 'receiver' | 'accumulator';
    withLevelGlass?: boolean;
}> = ({ x, y, tag, height = 80, diameter = 40, type = 'separator', withLevelGlass = true }) => (
    <g transform={`translate(${x}, ${y})`}>
        {/* Vessel body */}
        <rect
            x={-diameter / 2}
            y={-height / 2}
            width={diameter}
            height={height}
            fill="white"
            stroke="black"
            strokeWidth="2"
            rx="3"
        />

        {/* Top head (elliptical) */}
        <ellipse
            cx="0"
            cy={-height / 2}
            rx={diameter / 2}
            ry="8"
            fill="white"
            stroke="black"
            strokeWidth="2"
        />

        {/* Bottom head (elliptical) */}
        <ellipse
            cx="0"
            cy={height / 2}
            rx={diameter / 2}
            ry="8"
            fill="white"
            stroke="black"
            strokeWidth="2"
        />

        {/* Liquid level */}
        <line
            x1={-diameter / 2}
            y1="10"
            x2={diameter / 2}
            y2="10"
            stroke="blue"
            strokeWidth="1.5"
            strokeDasharray="4,2"
        />

        {/* Level glass */}
        {withLevelGlass && (
            <g transform={`translate(${diameter / 2 + 5}, 0)`}>
                <rect x="0" y="-25" width="6" height="50" fill="lightblue" stroke="black" strokeWidth="1" />
                <line x1="0" y1="10" x2="6" y2="10" stroke="blue" strokeWidth="1.5" />
                <text x="10" y="3" fontSize="6" fontFamily="Arial">LG</text>
            </g>
        )}

        {/* Nozzles */}
        {/* Vapor inlet (top) */}
        <circle cx="0" cy={-height / 2 - 8} r="4" fill="blue" stroke="black" strokeWidth="1" />
        <text x="-15" y={-height / 2 - 6} fontSize="6" fontFamily="Arial">IN</text>

        {/* Vapor outlet (top side) */}
        <circle cx={diameter / 2} cy={-height / 2 + 10} r="4" fill="lightblue" stroke="black" strokeWidth="1" />
        <text x={diameter / 2 + 8} y={-height / 2 + 12} fontSize="6" fontFamily="Arial">VAP</text>

        {/* Liquid outlet (bottom) */}
        <circle cx="0" cy={height / 2 + 8} r="4" fill="orange" stroke="black" strokeWidth="1" />
        <text x="8" y={height / 2 + 10} fontSize="6" fontFamily="Arial">LIQ</text>

        {/* Oil drain (if separator) */}
        {type === 'separator' && (
            <circle cx={-diameter / 2} cy={height / 2} r="3" fill="cyan" stroke="black" strokeWidth="1" />
        )}

        {/* Tag */}
        <text x="0" y={-height / 2 - 20} fontSize="9" fontFamily="Arial" textAnchor="middle" fontWeight="bold">
            {tag}
        </text>

        {/* Type label */}
        <text x="0" y={height / 2 + 25} fontSize="7" fontFamily="Arial" textAnchor="middle">
            {type.toUpperCase()}
        </text>
    </g>
);

/**
 * Horizontal Receiver
 * ISO 14617-10: Horizontal pressure vessel
 */
export const HorizontalReceiver: React.FC<{
    x: number;
    y: number;
    tag: string;
    length?: number;
    diameter?: number;
}> = ({ x, y, tag, length = 100, diameter = 40 }) => (
    <g transform={`translate(${x}, ${y})`}>
        {/* Vessel body */}
        <rect
            x={-length / 2}
            y={-diameter / 2}
            width={length}
            height={diameter}
            fill="white"
            stroke="black"
            strokeWidth="2"
            rx="3"
        />

        {/* Left head */}
        <ellipse
            cx={-length / 2}
            cy="0"
            rx="8"
            ry={diameter / 2}
            fill="white"
            stroke="black"
            strokeWidth="2"
        />

        {/* Right head */}
        <ellipse
            cx={length / 2}
            cy="0"
            rx="8"
            ry={diameter / 2}
            fill="white"
            stroke="black"
            strokeWidth="2"
        />

        {/* Liquid level */}
        <line
            x1={-length / 2}
            y1="8"
            x2={length / 2}
            y2="8"
            stroke="blue"
            strokeWidth="1.5"
            strokeDasharray="4,2"
        />

        {/* Saddle supports */}
        <path d={`M ${-length / 3},${diameter / 2} L ${-length / 3},${diameter / 2 + 10} L ${-length / 3 + 10},${diameter / 2 + 10}`} stroke="black" strokeWidth="2" fill="none" />
        <path d={`M ${length / 3},${diameter / 2} L ${length / 3},${diameter / 2 + 10} L ${length / 3 - 10},${diameter / 2 + 10}`} stroke="black" strokeWidth="2" fill="none" />

        {/* Nozzles */}
        <circle cx={-length / 2 + 20} cy={-diameter / 2} r="4" fill="blue" stroke="black" strokeWidth="1" />
        <circle cx={length / 2 - 20} cy={-diameter / 2} r="4" fill="lightblue" stroke="black" strokeWidth="1" />
        <circle cx="0" cy={diameter / 2} r="4" fill="orange" stroke="black" strokeWidth="1" />

        {/* Tag */}
        <text x="0" y={-diameter / 2 - 15} fontSize="9" fontFamily="Arial" textAnchor="middle" fontWeight="bold">
            {tag}
        </text>
    </g>
);

// ============================================================
// PUMPS (ISO 14617-9)
// ============================================================

/**
 * Centrifugal Pump
 * ISO 14617-9: Rotodynamic pump
 */
export const CentrifugalPump: React.FC<{
    x: number;
    y: number;
    tag: string;
    withMotor?: boolean;
}> = ({ x, y, tag, withMotor = true }) => (
    <g transform={`translate(${x}, ${y})`}>
        {/* Pump casing (volute) */}
        <path
            d="M 0,-12 A 12,12 0 1,1 0,12 L 8,8 L 8,-8 Z"
            fill="white"
            stroke="black"
            strokeWidth="2"
        />

        {/* Impeller */}
        <circle cx="-4" cy="0" r="8" fill="lightgray" stroke="black" strokeWidth="1.5" />
        <path
            d="M -4,-6 L -4,6 M -8,0 L 0,0"
            stroke="black"
            strokeWidth="1.5"
        />

        {/* Suction nozzle */}
        <circle cx="0" cy="-12" r="3" fill="blue" stroke="black" strokeWidth="1" />

        {/* Discharge nozzle */}
        <circle cx="8" cy="0" r="3" fill="lightblue" stroke="black" strokeWidth="1" />

        {/* Motor */}
        {withMotor && (
            <>
                <rect x="-20" y="-6" width="12" height="12" fill="yellow" stroke="black" strokeWidth="1.5" rx="2" />
                <text x="-14" y="3" fontSize="6" fontFamily="Arial" textAnchor="middle" fontWeight="bold">M</text>

                {/* Shaft */}
                <line x1="-8" y1="0" x2="-4" y2="0" stroke="black" strokeWidth="2" />
            </>
        )}

        {/* Base */}
        <line x1="-20" y1="12" x2="8" y2="12" stroke="black" strokeWidth="2" />

        {/* Tag */}
        <text x="0" y="-25" fontSize="9" fontFamily="Arial" textAnchor="middle" fontWeight="bold">
            {tag}
        </text>
    </g>
);

/**
 * Filter/Strainer
 * ISO 14617-3: Filtration device
 */
export const Filter: React.FC<{
    x: number;
    y: number;
    tag: string;
    type?: 'Y' | 'basket' | 'inline';
}> = ({ x, y, tag, type = 'Y' }) => (
    <g transform={`translate(${x}, ${y})`}>
        {type === 'Y' ? (
            <>
                {/* Y-strainer body */}
                <path
                    d="M -15,0 L 0,0 L 10,15 L 8,18 L -2,3 Z"
                    fill="white"
                    stroke="black"
                    strokeWidth="1.5"
                />

                {/* Screen */}
                <line x1="0" y1="2" x2="8" y2="16" stroke="gray" strokeWidth="1" strokeDasharray="1,1" />

                {/* Drain plug */}
                <circle cx="9" cy="17" r="2" fill="gray" stroke="black" strokeWidth="1" />
            </>
        ) : (
            <>
                {/* Inline filter */}
                <rect x="-10" y="-8" width="20" height="16" fill="white" stroke="black" strokeWidth="1.5" rx="2" />

                {/* Filter element */}
                <rect x="-6" y="-6" width="12" height="12" fill="lightgray" stroke="black" strokeWidth="1" />
                <line x1="-6" y1="-4" x2="6" y2="-4" stroke="gray" strokeWidth="0.5" />
                <line x1="-6" y1="0" x2="6" y2="0" stroke="gray" strokeWidth="0.5" />
                <line x1="-6" y1="4" x2="6" y2="4" stroke="gray" strokeWidth="0.5" />
            </>
        )}

        {/* Tag */}
        <text x="0" y="-20" fontSize="8" fontFamily="Arial" textAnchor="middle" fontWeight="bold">
            {tag}
        </text>
    </g>
);

export default {
    // Compressors
    ScrewCompressor,
    ReciprocatingCompressor,
    ScrollCompressor,

    // Heat Exchangers
    ShellTubeHeatExchanger,
    AirCooledHeatExchanger,
    EvaporativeCondenser,

    // Vessels
    VerticalVessel,
    HorizontalReceiver,

    // Pumps and Filters
    CentrifugalPump,
    Filter
};
