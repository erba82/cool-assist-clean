/**
 * ISO 10628-2:2012 Symbol Library for P&ID Diagrams
 * Professional-grade SVG symbols following international standards
 * 
 * References:
 * - ISO 10628-2:2012: Diagrams for chemical engineering
 * - ISO 14617: Graphical symbols for diagrams
 * - ISA-5.1-2009: Instrumentation symbols and identification
 */

import React from 'react';

// ============================================================
// EQUIPMENT SYMBOLS - ISO 14617
// ============================================================

/**
 * Screw Compressor Symbol (ISO 14617 Group 16)
 * Twin-rotor representation with inlet/outlet nozzles
 */
export const ScrewCompressorSymbol: React.FC<{
    x: number;
    y: number;
    width?: number;
    height?: number;
    tag?: string;
    showLabel?: boolean;
}> = ({ x, y, width = 80, height = 60, tag = 'COMP', showLabel = true }) => {
    return (
        <g transform={`translate(${x}, ${y})`}>
            {/* Main body - rectangular housing */}
            <rect
                x={0}
                y={0}
                width={width}
                height={height}
                fill="white"
                stroke="black"
                strokeWidth={2}
            />

            {/* Twin screw rotors representation */}
            <circle cx={width * 0.35} cy={height * 0.5} r={height * 0.25} fill="none" stroke="black" strokeWidth={1.5} />
            <circle cx={width * 0.65} cy={height * 0.5} r={height * 0.25} fill="none" stroke="black" strokeWidth={1.5} />

            {/* Rotor centerline indicators */}
            <line x1={width * 0.35} y1={height * 0.25} x2={width * 0.35} y2={height * 0.75} stroke="black" strokeWidth={1} />
            <line x1={width * 0.65} y1={height * 0.25} x2={width * 0.65} y2={height * 0.75} stroke="black" strokeWidth={1} />

            {/* Suction nozzle - left */}
            <rect x={-10} y={height * 0.3} width={10} height={height * 0.4} fill="white" stroke="black" strokeWidth={1.5} />

            {/* Discharge nozzle - right */}
            <rect x={width} y={height * 0.3} width={10} height={height * 0.4} fill="white" stroke="black" strokeWidth={1.5} />

            {/* Motor drive indicator */}
            <circle cx={width * 0.5} cy={-8} r={6} fill="black" />

            {/* Tag label */}
            {showLabel && (
                <text
                    x={width / 2}
                    y={height + 18}
                    textAnchor="middle"
                    fontSize={12}
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
 * Reciprocating Compressor Symbol (ISO 14617 Group 16)
 * Piston representation with cylinder
 */
export const ReciprocatingCompressorSymbol: React.FC<{
    x: number;
    y: number;
    width?: number;
    height?: number;
    tag?: string;
    showLabel?: boolean;
}> = ({ x, y, width = 80, height = 70, tag = 'COMP', showLabel = true }) => {
    return (
        <g transform={`translate(${x}, ${y})`}>
            {/* Crankcase - main body */}
            <rect
                x={width * 0.15}
                y={height * 0.5}
                width={width * 0.7}
                height={height * 0.35}
                fill="white"
                stroke="black"
                strokeWidth={2}
            />

            {/* Cylinder */}
            <rect
                x={width * 0.35}
                y={height * 0.15}
                width={width * 0.3}
                height={height * 0.4}
                fill="white"
                stroke="black"
                strokeWidth={2}
            />

            {/* Piston head */}
            <rect
                x={width * 0.37}
                y={height * 0.25}
                width={width * 0.26}
                height={height * 0.08}
                fill="gray"
                stroke="black"
                strokeWidth={1}
            />

            {/* Piston rod */}
            <line
                x1={width * 0.5}
                y1={height * 0.33}
                x2={width * 0.5}
                y2={height * 0.5}
                stroke="black"
                strokeWidth={2}
            />

            {/* Suction valve - left cylinder head */}
            <circle cx={width * 0.37} cy={height * 0.15} r={4} fill="white" stroke="black" strokeWidth={1} />

            {/* Discharge valve - right cylinder head */}
            <circle cx={width * 0.63} cy={height * 0.15} r={4} fill="white" stroke="black" strokeWidth={1} />

            {/* Flywheel/motor */}
            <circle cx={width * 0.85} cy={height * 0.67} r={height * 0.15} fill="none" stroke="black" strokeWidth={2} />

            {/* Tag label */}
            {showLabel && (
                <text
                    x={width / 2}
                    y={height + 18}
                    textAnchor="middle"
                    fontSize={12}
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
 * Evaporative Condenser Symbol (ISO 14617 Group 3 - Heat Exchanger)
 * Square tower with spray header and fan on top
 */
export const EvaporativeCondenserSymbol: React.FC<{
    x: number;
    y: number;
    width?: number;
    height?: number;
    tag?: string;
    showLabel?: boolean;
}> = ({ x, y, width = 70, height = 100, tag = 'COND', showLabel = true }) => {
    return (
        <g transform={`translate(${x}, ${y})`}>
            {/* Tower body */}
            <rect
                x={0}
                y={0}
                width={width}
                height={height}
                fill="white"
                stroke="black"
                strokeWidth={2}
            />

            {/* Spray header - top */}
            <line x1={width * 0.2} y1={height * 0.15} x2={width * 0.8} y2={height * 0.15} stroke="black" strokeWidth={2} />

            {/* Spray nozzles */}
            {[0.3, 0.5, 0.7].map((pos, i) => (
                <React.Fragment key={i}>
                    <line x1={width * pos} y1={height * 0.15} x2={width * pos} y2={height * 0.2} stroke="black" strokeWidth={1} />
                    <circle cx={width * pos} cy={height * 0.2} r={2} fill="black" />
                </React.Fragment>
            ))}

            {/* Heat exchange coils representation */}
            {[0.35, 0.5, 0.65].map((yPos, i) => (
                <path
                    key={i}
                    d={`M ${width * 0.15},${height * yPos} Q ${width * 0.35},${height * (yPos - 0.03)} ${width * 0.5},${height * yPos} T ${width * 0.85},${height * yPos}`}
                    fill="none"
                    stroke="black"
                    strokeWidth={1}
                />
            ))}

            {/* Basin at bottom */}
            <rect
                x={0}
                y={height * 0.85}
                width={width}
                height={height * 0.15}
                fill="lightgray"
                stroke="black"
                strokeWidth={1.5}
            />

            {/* Fan on top */}
            <circle cx={width / 2} cy={-10} r={width * 0.35} fill="none" stroke="black" strokeWidth={2} />

            {/* Fan blades */}
            {[0, 60, 120, 180, 240, 300].map((angle, i) => {
                const rad = (angle * Math.PI) / 180;
                return (
                    <line
                        key={i}
                        x1={width / 2}
                        y1={-10}
                        x2={width / 2 + Math.cos(rad) * width * 0.3}
                        y2={-10 + Math.sin(rad) * width * 0.3}
                        stroke="black"
                        strokeWidth={1.5}
                    />
                );
            })}

            {/* Tag label */}
            {showLabel && (
                <text
                    x={width / 2}
                    y={height + 18}
                    textAnchor="middle"
                    fontSize={12}
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
 * Shell-and-Tube Heat Exchanger (ISO 14617 Group 3)
 * Horizontal vessel with tube bundle
 */
export const ShellTubeHeatExchangerSymbol: React.FC<{
    x: number;
    y: number;
    width?: number;
    height?: number;
    tag?: string;
    showLabel?: boolean;
}> = ({ x, y, width = 100, height = 50, tag = 'HX', showLabel = true }) => {
    return (
        <g transform={`translate(${x}, ${y})`}>
            {/* Shell */}
            <ellipse
                cx={width / 2}
                cy={height / 2}
                rx={width / 2}
                ry={height / 2}
                fill="white"
                stroke="black"
                strokeWidth={2}
            />

            {/* Tube bundle - parallel lines */}
            {[0.3, 0.5, 0.7].map((yPos, i) => (
                <line
                    key={i}
                    x1={width * 0.1}
                    y1={height * yPos}
                    x2={width * 0.9}
                    y2={height * yPos}
                    stroke="black"
                    strokeWidth={1}
                />
            ))}

            {/* Nozzles */}
            {/* Shell side inlet - top left */}
            <rect x={width * 0.2} y={-8} width={12} height={8} fill="white" stroke="black" strokeWidth={1.5} />

            {/* Shell side outlet - bottom right */}
            <rect x={width * 0.7} y={height} width={12} height={8} fill="white" stroke="black" strokeWidth={1.5} />

            {/* Tube side inlet - left */}
            <rect x={-8} y={height * 0.4} width={8} height={12} fill="white" stroke="black" strokeWidth={1.5} />

            {/* Tube side outlet - right */}
            <rect x={width} y={height * 0.4} width={8} height={12} fill="white" stroke="black" strokeWidth={1.5} />

            {/* Tag label */}
            {showLabel && (
                <text
                    x={width / 2}
                    y={height + 22}
                    textAnchor="middle"
                    fontSize={12}
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
 * Horizontal Vessel (ISO 14617 Group 1)
 * Cylindrical tank with support legs
 */
export const HorizontalVesselSymbol: React.FC<{
    x: number;
    y: number;
    width?: number;
    height?: number;
    tag?: string;
    volume?: string;
    showLabel?: boolean;
}> = ({ x, y, width = 100, height = 50, tag = 'REC', volume = '500L', showLabel = true }) => {
    return (
        <g transform={`translate(${x}, ${y})`}>
            {/* Vessel body - horizontal cylinder */}
            <ellipse
                cx={width / 2}
                cy={height / 2}
                rx={width / 2}
                ry={height / 2}
                fill="white"
                stroke="black"
                strokeWidth={2}
            />

            {/* End dish - left */}
            <ellipse
                cx={width * 0.05}
                cy={height / 2}
                rx={width * 0.05}
                ry={height / 2}
                fill="white"
                stroke="black"
                strokeWidth={2}
            />

            {/* End dish - right */}
            <ellipse
                cx={width * 0.95}
                cy={height / 2}
                rx={width * 0.05}
                ry={height / 2}
                fill="white"
                stroke="black"
                strokeWidth={2}
            />

            {/* Support saddle - left */}
            <path
                d={`M ${width * 0.25},${height * 0.85} L ${width * 0.15},${height + 10} L ${width * 0.35},${height + 10} Z`}
                fill="black"
                stroke="black"
                strokeWidth={1}
            />

            {/* Support saddle - right */}
            <path
                d={`M ${width * 0.75},${height * 0.85} L ${width * 0.65},${height + 10} L ${width * 0.85},${height + 10} Z`}
                fill="black"
                stroke="black"
                strokeWidth={1}
            />

            {/* Liquid level indicator */}
            <line
                x1={width * 0.1}
                y1={height * 0.6}
                x2={width * 0.9}
                y2={height * 0.6}
                stroke="blue"
                strokeWidth={1}
                strokeDasharray="4,2"
            />

            {/* Tag label */}
            {showLabel && (
                <>
                    <text
                        x={width / 2}
                        y={-8}
                        textAnchor="middle"
                        fontSize={12}
                        fontFamily="Arial"
                        fontWeight="bold"
                    >
                        {tag}
                    </text>
                    <text
                        x={width / 2}
                        y={height + 25}
                        textAnchor="middle"
                        fontSize={10}
                        fontFamily="Arial"
                    >
                        {volume}
                    </text>
                </>
            )}
        </g>
    );
};

/**
 * Vertical Vessel (ISO 14617 Group 1)
 * Cylindrical tank with support skirt
 */
export const VerticalVesselSymbol: React.FC<{
    x: number;
    y: number;
    width?: number;
    height?: number;
    tag?: string;
    volume?: string;
    showLabel?: boolean;
}> = ({ x, y, width = 50, height = 100, tag = 'VES', volume = '1000L', showLabel = true }) => {
    return (
        <g transform={`translate(${x}, ${y})`}>
            {/* Vessel body - vertical cylinder */}
            <rect
                x={width * 0.15}
                y={height * 0.1}
                width={width * 0.7}
                height={height * 0.75}
                fill="white"
                stroke="black"
                strokeWidth={2}
            />

            {/* Top head - elliptical */}
            <ellipse
                cx={width / 2}
                cy={height * 0.1}
                rx={width * 0.35}
                ry={height * 0.08}
                fill="white"
                stroke="black"
                strokeWidth={2}
            />

            {/* Bottom head - elliptical */}
            <ellipse
                cx={width / 2}
                cy={height * 0.85}
                rx={width * 0.35}
                ry={height * 0.08}
                fill="white"
                stroke="black"
                strokeWidth={2}
            />

            {/* Support skirt */}
            <path
                d={`M ${width * 0.25},${height * 0.85} L ${width * 0.3},${height * 0.98} L ${width * 0.7},${height * 0.98} L ${width * 0.75},${height * 0.85}`}
                fill="gray"
                stroke="black"
                strokeWidth={1.5}
            />

            {/* Liquid level */}
            <line
                x1={width * 0.15}
                y1={height * 0.6}
                x2={width * 0.85}
                y2={height * 0.6}
                stroke="blue"
                strokeWidth={1.5}
                strokeDasharray="4,2"
            />

            {/* Tag label */}
            {showLabel && (
                <>
                    <text
                        x={width / 2}
                        y={-5}
                        textAnchor="middle"
                        fontSize={12}
                        fontFamily="Arial"
                        fontWeight="bold"
                    >
                        {tag}
                    </text>
                    <text
                        x={width / 2}
                        y={height + 15}
                        textAnchor="middle"
                        fontSize={10}
                        fontFamily="Arial"
                    >
                        {volume}
                    </text>
                </>
            )}
        </g>
    );
};

/**
 * Air-Cooled Evaporator / Unit Cooler (ISO 14617 Group 3)
 * Finned coil with fan
 */
export const AirCooledEvaporatorSymbol: React.FC<{
    x: number;
    y: number;
    width?: number;
    height?: number;
    tag?: string;
    capacity?: string;
    showLabel?: boolean;
}> = ({ x, y, width = 80, height = 60, tag = 'EVAP', capacity = '50kW', showLabel = true }) => {
    return (
        <g transform={`translate(${x}, ${y})`}>
            {/* Housing */}
            <rect
                x={0}
                y={0}
                width={width}
                height={height}
                fill="white"
                stroke="black"
                strokeWidth={2}
            />

            {/* Finned coil - zigzag pattern */}
            {[0.25, 0.4, 0.55, 0.7].map((yPos, i) => (
                <path
                    key={i}
                    d={`M ${width * 0.1},${height * yPos} L ${width * 0.3},${height * (yPos - 0.05)} L ${width * 0.5},${height * yPos} L ${width * 0.7},${height * (yPos - 0.05)} L ${width * 0.9},${height * yPos}`}
                    fill="none"
                    stroke="black"
                    strokeWidth={1.5}
                />
            ))}

            {/* Fins - vertical lines */}
            {Array.from({ length: 8 }, (_, i) => (
                <line
                    key={i}
                    x1={width * 0.15 + i * (width * 0.7 / 7)}
                    y1={height * 0.2}
                    x2={width * 0.15 + i * (width * 0.7 / 7)}
                    y2={height * 0.75}
                    stroke="gray"
                    strokeWidth={0.5}
                />
            ))}

            {/* Axial fan */}
            <circle cx={width / 2} cy={height + 15} r={width * 0.25} fill="none" stroke="black" strokeWidth={2} />

            {/* Fan blades */}
            {[0, 90, 180, 270].map((angle, i) => {
                const rad = (angle * Math.PI) / 180;
                return (
                    <line
                        key={i}
                        x1={width / 2}
                        y1={height + 15}
                        x2={width / 2 + Math.cos(rad) * width * 0.2}
                        y2={height + 15 + Math.sin(rad) * width * 0.2}
                        stroke="black"
                        strokeWidth={2}
                    />
                );
            })}

            {/* Refrigerant inlet nozzle */}
            <rect x={-8} y={height * 0.3} width={8} height={10} fill="white" stroke="black" strokeWidth={1.5} />

            {/* Refrigerant outlet nozzle */}
            <rect x={width} y={height * 0.6} width={8} height={10} fill="white" stroke="black" strokeWidth={1.5} />

            {/* Tag label */}
            {showLabel && (
                <>
                    <text
                        x={width / 2}
                        y={-5}
                        textAnchor="middle"
                        fontSize={12}
                        fontFamily="Arial"
                        fontWeight="bold"
                    >
                        {tag}
                    </text>
                    <text
                        x={width / 2}
                        y={height + 45}
                        textAnchor="middle"
                        fontSize={10}
                        fontFamily="Arial"
                    >
                        {capacity}
                    </text>
                </>
            )}
        </g>
    );
};

export default {
    ScrewCompressorSymbol,
    ReciprocatingCompressorSymbol,
    EvaporativeCondenserSymbol,
    ShellTubeHeatExchangerSymbol,
    HorizontalVesselSymbol,
    VerticalVesselSymbol,
    AirCooledEvaporatorSymbol
};
