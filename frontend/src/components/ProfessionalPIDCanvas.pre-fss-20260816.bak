/**
 * Professional P&ID Canvas - CAD Quality Rendering
 * ISO 14617 Compliant - Professional Industrial Standard
 *
 * Features:
 * - ISO 14617 symbol library
 * - DN pipe sizing
 * - Valve placement
 * - Instrumentation
 * - Professional title block
 *
 * @version 2.0.0
 */

import React, { useRef, useState, useMemo } from 'react';
import { Box, IconButton, Button, Tooltip, Typography } from '@mui/material';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import DownloadIcon from '@mui/icons-material/Download';

// ISO 14617 Symbol Libraries
import * as ValveSymbols from './ISO14617SymbolLibrary';
import * as EquipmentSymbols from './ISO14617EquipmentLibrary';
import ProfessionalTitleBlock from './ProfessionalTitleBlock';

// PIPE COLORS - TABADOL SAZAN Standard
const PIPE_COLORS: Record<string, string> = {
    hotGas: '#FF0000',
    liquid: '#FFD700',
    suction: '#0066FF',
    oil: '#00CCCC',
    return: '#FF8C00',
    default: '#333333'
};

interface ProjectInfo {
    client: string;
    projectName: string;
    drawingTitle: string;
    drawingNo: string;
    designer: string;
    date: string;
}

interface ProfessionalPIDCanvasProps {
    data?: any;
    projectInfo?: ProjectInfo;
    width?: number;
    height?: number;
}

// ============================================================
// EQUIPMENT CALLOUT BOX
// ============================================================
const EquipmentCallout: React.FC<{
    x: number;
    y: number;
    title: string;
    lines: string[];
}> = ({ x, y, title, lines }) => {
    const boxWidth = 180;
    const lineHeight = 14;
    const boxHeight = 20 + lines.length * lineHeight;

    return (
        <g transform={`translate(${x}, ${y})`}>
            <rect
                x={0} y={0}
                width={boxWidth} height={boxHeight}
                fill="white"
                stroke="black"
                strokeWidth={1.5}
            />
            <text x={5} y={14} fontSize={11} fontWeight="bold" fontFamily="Arial">
                {title}
            </text>
            <line x1={0} y1={18} x2={boxWidth} y2={18} stroke="black" strokeWidth={0.5} />
            {lines.map((line, i) => (
                <text key={i} x={5} y={32 + i * lineHeight} fontSize={9} fontFamily="Arial">
                    {line}
                </text>
            ))}
        </g>
    );
};

// ============================================================
// THERMODYNAMIC STATE TABLE - ISO/EN 4314 Compliant
// Shows T, P, h, s at 4 cycle points
// ============================================================
const ThermodynamicStateTable: React.FC<{
    x: number;
    y: number;
    cycleData?: any;
    refrigerant?: string;
}> = ({ x, y, cycleData, refrigerant = 'R-717' }) => {
    const colWidths = [30, 80, 50, 50, 70, 70];
    const rowHeight = 16;
    const headerHeight = 20;
    const tableWidth = colWidths.reduce((a, b) => a + b, 0);

    // Default cycle points if not provided
    const defaultPoints = [
        { point: '1', location: 'Evap Exit', T: '-18', P: '2.6', h: '1405', state: 'Superheat 5K' },
        { point: '2', location: 'Comp Exit', T: '+85', P: '18', h: '1520', state: 'Superheated' },
        { point: '3', location: 'Cond Exit', T: '+40', P: '18', h: '396', state: 'Subcool 4K' },
        { point: '4', location: 'EXV Exit', T: '-26', P: '2.6', h: '396', state: '2-Phase' },
    ];

    const points = cycleData?.points || defaultPoints;
    const totalHeight = headerHeight + (points.length * rowHeight) + 20;

    return (
        <g transform={`translate(${x}, ${y})`}>
            {/* Table border */}
            <rect
                x={0} y={0}
                width={tableWidth} height={totalHeight}
                fill="white"
                stroke="black"
                strokeWidth={1.5}
            />

            {/* Title */}
            <text x={tableWidth / 2} y={-5} fontSize={10} fontWeight="bold" fontFamily="Arial" textAnchor="middle">
                CYCLE STATE POINTS ({refrigerant})
            </text>

            {/* Header row */}
            <rect x={0} y={0} width={tableWidth} height={headerHeight} fill="#E0E0E0" stroke="black" strokeWidth={0.5} />
            {['Pt', 'Location', 'T(°C)', 'P(bar)', 'h(kJ/kg)', 'State'].map((header, i) => {
                const xPos = colWidths.slice(0, i).reduce((a, b) => a + b, 0) + colWidths[i] / 2;
                return (
                    <text key={i} x={xPos} y={14} fontSize={8} fontWeight="bold" fontFamily="Arial" textAnchor="middle">
                        {header}
                    </text>
                );
            })}

            {/* Data rows */}
            {points.map((point: any, rowIndex: number) => {
                const yPos = headerHeight + (rowIndex * rowHeight);
                const values = [point.point, point.location, point.T, point.P, point.h, point.state];

                return (
                    <g key={rowIndex}>
                        <line x1={0} y1={yPos} x2={tableWidth} y2={yPos} stroke="black" strokeWidth={0.3} />
                        {values.map((val, colIndex) => {
                            const xPos = colWidths.slice(0, colIndex).reduce((a, b) => a + b, 0) + colWidths[colIndex] / 2;
                            return (
                                <text key={colIndex} x={xPos} y={yPos + 12} fontSize={8} fontFamily="Arial" textAnchor="middle">
                                    {val}
                                </text>
                            );
                        })}
                    </g>
                );
            })}

            {/* Column separators */}
            {colWidths.slice(0, -1).map((_, i) => {
                const xPos = colWidths.slice(0, i + 1).reduce((a, b) => a + b, 0);
                return <line key={i} x1={xPos} y1={0} x2={xPos} y2={totalHeight} stroke="black" strokeWidth={0.3} />;
            })}
        </g>
    );
};

// ============================================================
// PROFESSIONAL TITLE BLOCK - TABADOL SAZAN Style
// ============================================================
const TitleBlock: React.FC<{
    x: number;
    y: number;
    info: ProjectInfo;
}> = ({ x, y, info }) => (
    <g transform={`translate(${x}, ${y})`}>
        {/* Main outer frame */}
        <rect x={0} y={0} width={700} height={120} fill="white" stroke="black" strokeWidth={2} />

        {/* Left section - Client and Project */}
        <rect x={0} y={0} width={350} height={40} fill="none" stroke="black" strokeWidth={1} />
        <text x={5} y={15} fontSize={8} fontFamily="Arial">CLIENT:</text>
        <text x={5} y={32} fontSize={14} fontWeight="bold" fontFamily="Arial">{info.client || 'CLIENT NAME'}</text>

        {/* DWG Title */}
        <rect x={0} y={40} width={350} height={25} fill="none" stroke="black" strokeWidth={1} />
        <text x={5} y={52} fontSize={8} fontFamily="Arial">DWG. TITLE:</text>
        <text x={70} y={58} fontSize={10} fontWeight="bold" fontFamily="Arial">{info.drawingTitle || 'GENERAL PIPING DIAGRAM'}</text>

        {/* Project Title */}
        <rect x={0} y={65} width={350} height={25} fill="none" stroke="black" strokeWidth={1} />
        <text x={5} y={78} fontSize={8} fontFamily="Arial">PROJECT TITLE:</text>
        <text x={80} y={83} fontSize={9} fontFamily="Arial">{info.projectName || 'PROJECT NAME'}</text>

        {/* File No */}
        <rect x={0} y={90} width={350} height={30} fill="none" stroke="black" strokeWidth={1} />
        <text x={5} y={110} fontSize={8} fontFamily="Arial">FILE NO:</text>

        {/* Company Logo Section */}
        <rect x={350} y={0} width={200} height={40} fill="none" stroke="black" strokeWidth={1} />
        <text x={360} y={25} fontSize={16} fontWeight="bold" fontFamily="Arial">GFDDE AI ENGINE</text>
        <text x={360} y={37} fontSize={8} fontFamily="Arial">Mechanical Design</text>

        {/* Info Grid */}
        {/* Header row */}
        <rect x={350} y={40} width={60} height={15} fill="#E0E0E0" stroke="black" strokeWidth={0.5} />
        <rect x={410} y={40} width={50} height={15} fill="#E0E0E0" stroke="black" strokeWidth={0.5} />
        <rect x={460} y={40} width={60} height={15} fill="#E0E0E0" stroke="black" strokeWidth={0.5} />
        <rect x={520} y={40} width={50} height={15} fill="#E0E0E0" stroke="black" strokeWidth={0.5} />
        <rect x={570} y={40} width={60} height={15} fill="#E0E0E0" stroke="black" strokeWidth={0.5} />
        <text x={355} y={51} fontSize={7} fontFamily="Arial">DESIGNER</text>
        <text x={415} y={51} fontSize={7} fontFamily="Arial">DATE</text>
        <text x={465} y={51} fontSize={7} fontFamily="Arial">DRAWER</text>
        <text x={525} y={51} fontSize={7} fontFamily="Arial">DATE</text>
        <text x={575} y={51} fontSize={7} fontFamily="Arial">FIELD.</text>

        {/* Data row 1 */}
        <rect x={350} y={55} width={60} height={20} fill="none" stroke="black" strokeWidth={0.5} />
        <rect x={410} y={55} width={50} height={20} fill="none" stroke="black" strokeWidth={0.5} />
        <rect x={460} y={55} width={60} height={20} fill="none" stroke="black" strokeWidth={0.5} />
        <rect x={520} y={55} width={50} height={20} fill="none" stroke="black" strokeWidth={0.5} />
        <rect x={570} y={55} width={60} height={20} fill="none" stroke="black" strokeWidth={0.5} />
        <text x={355} y={68} fontSize={8} fontFamily="Arial">{info.designer || 'AI'}</text>
        <text x={415} y={68} fontSize={7} fontFamily="Arial">{info.date}</text>
        <text x={465} y={68} fontSize={8} fontFamily="Arial">GFDDE</text>
        <text x={525} y={68} fontSize={7} fontFamily="Arial">{info.date}</text>
        <text x={575} y={68} fontSize={7} fontFamily="Arial">Mechanical</text>

        {/* Header row 2 */}
        <rect x={350} y={75} width={60} height={15} fill="#E0E0E0" stroke="black" strokeWidth={0.5} />
        <rect x={410} y={75} width={50} height={15} fill="#E0E0E0" stroke="black" strokeWidth={0.5} />
        <rect x={460} y={75} width={60} height={15} fill="#E0E0E0" stroke="black" strokeWidth={0.5} />
        <rect x={520} y={75} width={50} height={15} fill="#E0E0E0" stroke="black" strokeWidth={0.5} />
        <rect x={570} y={75} width={60} height={15} fill="#E0E0E0" stroke="black" strokeWidth={0.5} />
        <text x={355} y={86} fontSize={7} fontFamily="Arial">CHECKED</text>
        <text x={415} y={86} fontSize={7} fontFamily="Arial">DATE</text>
        <text x={465} y={86} fontSize={7} fontFamily="Arial">APPROVED</text>
        <text x={525} y={86} fontSize={7} fontFamily="Arial">DATE</text>
        <text x={575} y={86} fontSize={7} fontFamily="Arial">DWG NO.</text>

        {/* Data row 2 */}
        <rect x={350} y={90} width={60} height={20} fill="none" stroke="black" strokeWidth={0.5} />
        <rect x={410} y={90} width={50} height={20} fill="none" stroke="black" strokeWidth={0.5} />
        <rect x={460} y={90} width={60} height={20} fill="none" stroke="black" strokeWidth={0.5} />
        <rect x={520} y={90} width={50} height={20} fill="none" stroke="black" strokeWidth={0.5} />
        <rect x={570} y={90} width={60} height={20} fill="none" stroke="black" strokeWidth={0.5} />
        <text x={355} y={103} fontSize={8} fontFamily="Arial">-</text>
        <text x={415} y={103} fontSize={7} fontFamily="Arial">-</text>
        <text x={465} y={103} fontSize={8} fontFamily="Arial">-</text>
        <text x={525} y={103} fontSize={7} fontFamily="Arial">-</text>
        <text x={575} y={103} fontSize={8} fontFamily="Arial">{info.drawingNo}</text>

        {/* Size/Rev/Scale box */}
        <rect x={630} y={40} width={35} height={40} fill="none" stroke="black" strokeWidth={1} />
        <rect x={665} y={40} width={35} height={40} fill="none" stroke="black" strokeWidth={1} />
        <text x={632} y={55} fontSize={7} fontFamily="Arial">SIZE</text>
        <text x={640} y={72} fontSize={14} fontWeight="bold" fontFamily="Arial">A1</text>
        <text x={668} y={55} fontSize={7} fontFamily="Arial">REV.</text>
        <text x={675} y={72} fontSize={14} fontWeight="bold" fontFamily="Arial">00</text>

        {/* Scale */}
        <rect x={630} y={80} width={70} height={30} fill="none" stroke="black" strokeWidth={1} />
        <text x={632} y={95} fontSize={7} fontFamily="Arial">SCL.</text>
        <text x={655} y={100} fontSize={10} fontFamily="Arial">N.T.S</text>
    </g>
);


// ============================================================
// EQUIPMENT LIST TABLE
// ============================================================
const EquipmentList: React.FC<{
    x: number;
    y: number;
    equipment: { tag: string; type: string; specs?: string }[];
}> = ({ x, y, equipment }) => (
    <g transform={`translate(${x}, ${y})`}>
        {/* Header */}
        <rect x={0} y={0} width={180} height={18} fill="#E0E0E0" stroke="black" strokeWidth={1} />
        <text x={5} y={13} fontSize={9} fontWeight="bold" fontFamily="Arial">EQUIPMENT LIST</text>

        {/* Table Header */}
        <rect x={0} y={18} width={60} height={14} fill="#F5F5F5" stroke="black" strokeWidth={0.5} />
        <rect x={60} y={18} width={60} height={14} fill="#F5F5F5" stroke="black" strokeWidth={0.5} />
        <rect x={120} y={18} width={60} height={14} fill="#F5F5F5" stroke="black" strokeWidth={0.5} />
        <text x={5} y={28} fontSize={7} fontWeight="bold" fontFamily="Arial">TAG</text>
        <text x={65} y={28} fontSize={7} fontWeight="bold" fontFamily="Arial">TYPE</text>
        <text x={125} y={28} fontSize={7} fontWeight="bold" fontFamily="Arial">NOTES</text>

        {/* Equipment rows */}
        {equipment.slice(0, 8).map((eq, i) => (
            <g key={i}>
                <rect x={0} y={32 + i * 12} width={60} height={12} fill="white" stroke="black" strokeWidth={0.3} />
                <rect x={60} y={32 + i * 12} width={60} height={12} fill="white" stroke="black" strokeWidth={0.3} />
                <rect x={120} y={32 + i * 12} width={60} height={12} fill="white" stroke="black" strokeWidth={0.3} />
                <text x={5} y={40 + i * 12} fontSize={6} fontFamily="Arial">{eq.tag}</text>
                <text x={65} y={40 + i * 12} fontSize={6} fontFamily="Arial">{eq.type}</text>
                <text x={125} y={40 + i * 12} fontSize={6} fontFamily="Arial">{eq.specs || ''}</text>
            </g>
        ))}
    </g>
);

// ============================================================

// SCREW COMPRESSOR
// ============================================================
const ScrewCompressor: React.FC<{
    x: number;
    y: number;
    tag: string;
    model?: string;
    power?: string;
}> = ({ x, y, tag, model = 'N320VLD-K', power = '500KW' }) => (
    <g transform={`translate(${x}, ${y})`}>
        {/* Main body */}
        <rect x={0} y={10} width={100} height={50} fill="white" stroke="black" strokeWidth={2} />

        {/* Internal screw indication */}
        <ellipse cx={30} cy={35} rx={15} ry={12} fill="none" stroke="black" strokeWidth={1.5} />
        <ellipse cx={70} cy={35} rx={15} ry={12} fill="none" stroke="black" strokeWidth={1.5} />

        {/* Motor */}
        <rect x={100} y={20} width={30} height={30} fill="white" stroke="black" strokeWidth={2} />
        <text x={108} y={40} fontSize={8} fontFamily="Arial">M</text>

        {/* Inlet/Outlet */}
        <line x1={-15} y1={35} x2={0} y2={35} stroke="black" strokeWidth={2} />
        <line x1={50} y1={0} x2={50} y2={10} stroke="black" strokeWidth={2} />

        {/* Tag */}
        <text x={50} y={-5} textAnchor="middle" fontSize={10} fontWeight="bold" fontFamily="Arial">
            {tag}
        </text>

        {/* Callout */}
        <EquipmentCallout
            x={-20}
            y={70}
            title="SCREW COMPRESSOR"
            lines={[
                `DRIVE MOTOR RATING ${power}`,
                `MODEL:MYCOM ${model}`
            ]}
        />
    </g>
);

// ============================================================
// EVAPORATIVE CONDENSER
// ============================================================
const EvaporativeCondenser: React.FC<{
    x: number;
    y: number;
    tag: string;
    model?: string;
    capacity?: string;
}> = ({ x, y, tag, model = 'TXC-125-3', capacity = '1100 kW' }) => (
    <g transform={`translate(${x}, ${y})`}>
        {/* Main body */}
        <rect x={0} y={0} width={120} height={80} fill="white" stroke="black" strokeWidth={2} />

        {/* Coils */}
        <path d="M 20 20 Q 30 15, 40 20 Q 50 25, 60 20 Q 70 15, 80 20 Q 90 25, 100 20"
            fill="none" stroke="black" strokeWidth={1.5} />
        <path d="M 20 35 Q 30 30, 40 35 Q 50 40, 60 35 Q 70 30, 80 35 Q 90 40, 100 35"
            fill="none" stroke="black" strokeWidth={1.5} />

        {/* Fans */}
        <circle cx={40} cy={65} r={10} fill="none" stroke="black" strokeWidth={1.5} />
        <line x1={35} y1={60} x2={45} y2={70} stroke="black" strokeWidth={1} />
        <line x1={45} y1={60} x2={35} y2={70} stroke="black" strokeWidth={1} />

        <circle cx={80} cy={65} r={10} fill="none" stroke="black" strokeWidth={1.5} />
        <line x1={75} y1={60} x2={85} y2={70} stroke="black" strokeWidth={1} />
        <line x1={85} y1={60} x2={75} y2={70} stroke="black" strokeWidth={1} />

        {/* Connections */}
        <line x1={20} y1={-10} x2={20} y2={0} stroke="black" strokeWidth={2} />
        <line x1={100} y1={-10} x2={100} y2={0} stroke="black" strokeWidth={2} />

        {/* Tag */}
        <text x={60} y={-15} textAnchor="middle" fontSize={10} fontWeight="bold" fontFamily="Arial">
            {tag}
        </text>

        {/* Callout */}
        <EquipmentCallout
            x={130}
            y={10}
            title="EVAPORATIVE CONDENSER"
            lines={[
                `MODEL ${model}`,
                `CAPACITY ${capacity}`
            ]}
        />
    </g>
);

// ============================================================
// AIR COOLER / EVAPORATOR
// ============================================================
const AirCooler: React.FC<{
    x: number;
    y: number;
    tag: string;
    capacity?: string;
}> = ({ x, y, tag, capacity = '50 kW' }) => (
    <g transform={`translate(${x}, ${y})`}>
        {/* Main body */}
        <rect x={0} y={0} width={140} height={60} fill="white" stroke="black" strokeWidth={2} />

        {/* Coil tubes */}
        {[15, 30, 45].map((yPos, i) => (
            <line key={i} x1={10} y1={yPos} x2={130} y2={yPos} stroke="black" strokeWidth={1.5} />
        ))}

        {/* Fans */}
        {[35, 70, 105].map((xPos, i) => (
            <g key={i}>
                <circle cx={xPos} cy={75} r={12} fill="none" stroke="black" strokeWidth={1.5} />
                <line x1={xPos - 6} y1={69} x2={xPos + 6} y2={81} stroke="black" strokeWidth={1} />
                <line x1={xPos + 6} y1={69} x2={xPos - 6} y2={81} stroke="black" strokeWidth={1} />
            </g>
        ))}

        {/* Inlet/Outlet */}
        <line x1={-10} y1={30} x2={0} y2={30} stroke="black" strokeWidth={2} />
        <line x1={140} y1={30} x2={150} y2={30} stroke="black" strokeWidth={2} />

        {/* Tag */}
        <text x={70} y={-10} textAnchor="middle" fontSize={10} fontWeight="bold" fontFamily="Arial">
            {tag}
        </text>
    </g>
);

// ============================================================
// VERTICAL VESSEL (Receiver/Separator)
// ============================================================
const VerticalVessel: React.FC<{
    x: number;
    y: number;
    tag: string;
    type?: string;
    volume?: string;
}> = ({ x, y, tag, type = 'AMMONIA RECEIVER', volume = '450 L' }) => (
    <g transform={`translate(${x}, ${y})`}>
        {/* Vessel body */}
        <ellipse cx={30} cy={10} rx={25} ry={8} fill="white" stroke="black" strokeWidth={2} />
        <rect x={5} y={10} width={50} height={100} fill="white" stroke="black" strokeWidth={2} />
        <ellipse cx={30} cy={110} rx={25} ry={8} fill="white" stroke="black" strokeWidth={2} />

        {/* Liquid level indicator */}
        <line x1={10} y1={70} x2={50} y2={70} stroke="blue" strokeWidth={1} strokeDasharray="3,2" />

        {/* Connections */}
        <line x1={30} y1={-10} x2={30} y2={2} stroke="black" strokeWidth={2} />
        <line x1={55} y1={50} x2={65} y2={50} stroke="black" strokeWidth={2} />
        <line x1={55} y1={90} x2={65} y2={90} stroke="black" strokeWidth={2} />

        {/* Tag */}
        <text x={30} y={-20} textAnchor="middle" fontSize={10} fontWeight="bold" fontFamily="Arial">
            {tag}
        </text>

        {/* Callout */}
        <EquipmentCallout
            x={70}
            y={30}
            title={type}
            lines={[
                `MODEL:LR-95-${volume}`,
                `VOLUME: ${volume}`
            ]}
        />
    </g>
);

// ============================================================
// OIL SEPARATOR
// ============================================================
const OilSeparator: React.FC<{
    x: number;
    y: number;
    tag: string;
}> = ({ x, y, tag }) => (
    <g transform={`translate(${x}, ${y})`}>
        {/* Vessel body */}
        <ellipse cx={25} cy={8} rx={20} ry={6} fill="white" stroke="black" strokeWidth={2} />
        <rect x={5} y={8} width={40} height={80} fill="white" stroke="black" strokeWidth={2} />
        <ellipse cx={25} cy={88} rx={20} ry={6} fill="white" stroke="black" strokeWidth={2} />

        {/* Internal baffle */}
        <line x1={15} y1={30} x2={35} y2={30} stroke="black" strokeWidth={1} />
        <line x1={10} y1={50} x2={40} y2={50} stroke="black" strokeWidth={1} />

        {/* Connections */}
        <line x1={25} y1={-10} x2={25} y2={2} stroke="black" strokeWidth={2} />
        <line x1={45} y1={40} x2={55} y2={40} stroke="black" strokeWidth={2} />

        {/* Tag */}
        <text x={25} y={-20} textAnchor="middle" fontSize={10} fontWeight="bold" fontFamily="Arial">
            {tag}
        </text>
    </g>
);

// ============================================================
// CENTRIFUGAL PUMP - ISO 14617 Compliant
// ============================================================
const CentrifugalPump: React.FC<{
    x: number;
    y: number;
    tag?: string;
    model?: string;
    capacity?: string;
    status?: string;
}> = ({ x, y, tag = 'P-01', model = 'Hermetic', capacity = '50 m³/h', status = 'Operating' }) => (
    <g transform={`translate(${x}, ${y})`}>
        {/* Pump circle body */}
        <circle cx={0} cy={0} r={25} fill="white" stroke="black" strokeWidth={2} />

        {/* Impeller blades */}
        <path d="M 0,-15 L 0,15 M -12,-8 L 12,8 M -12,8 L 12,-8" stroke="black" strokeWidth={1.5} />

        {/* Discharge nozzle (right) */}
        <rect x={25} y={-5} width={15} height={10} fill="white" stroke="black" strokeWidth={1.5} />

        {/* Flow direction triangle */}
        <polygon points="35,-3 38,0 35,3" fill="black" />

        {/* Suction nozzle (left) */}
        <rect x={-40} y={-5} width={15} height={10} fill="white" stroke="black" strokeWidth={1.5} />

        {/* Tag */}
        <text x={0} y={-35} textAnchor="middle" fontSize={10} fontWeight="bold">{tag}</text>

        {/* Model */}
        <text x={0} y={45} textAnchor="middle" fontSize={8}>{model}</text>

        {/* Status indicator */}
        <circle cx={20} cy={-20} r={4} fill={status === 'Operating' ? '#00FF00' : '#888888'} stroke="black" strokeWidth={0.5} />
    </g>
);

// ============================================================
// PIPE SEGMENT - ISO 14617 Compliant

// ============================================================
const PipeSegment: React.FC<{
    points: Array<{ x: number; y: number }>;
    fluidType: string;
    size?: string;
    showArrow?: boolean;
}> = ({ points, fluidType, size, showArrow = false }) => {
    // Null check for points array
    if (!points || !Array.isArray(points) || points.length < 2) return null;


    const color = PIPE_COLORS[fluidType] || PIPE_COLORS.default;

    // ISO 14617 line styles
    const getLineStyle = (type: string) => {
        switch (type) {
            case 'suction':
                return { strokeWidth: 3, dashArray: '10,5' };  // Dashed for low pressure
            case 'discharge':
            case 'hotGas':
                return { strokeWidth: 4, dashArray: 'none' };  // Thick solid for high pressure
            case 'liquid':
                return { strokeWidth: 3, dashArray: 'none' };  // Solid for liquid
            case 'twoPhase':
                return { strokeWidth: 3, dashArray: '15,3,3,3' };  // Dash-dot for 2-phase
            default:
                return { strokeWidth: 2, dashArray: 'none' };
        }
    };

    const lineStyle = getLineStyle(fluidType);

    // Build path
    const pathData = points.map((p, i) =>
        `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
    ).join(' ');

    // Arrow at end
    const lastTwo = points.slice(-2);
    const dx = lastTwo[1].x - lastTwo[0].x;
    const dy = lastTwo[1].y - lastTwo[0].y;
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;

    // Calculate label position (middle of pipe)
    const labelX = (points[0].x + points[points.length - 1].x) / 2;
    const labelY = (points[0].y + points[points.length - 1].y) / 2;

    return (
        <g>
            <path
                d={pathData}
                fill="none"
                stroke={color}
                strokeWidth={lineStyle.strokeWidth}
                strokeDasharray={lineStyle.dashArray}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            {showArrow && (
                <polygon
                    points="-8,-4 0,0 -8,4"
                    fill={color}
                    transform={`translate(${lastTwo[1].x}, ${lastTwo[1].y}) rotate(${angle})`}
                />
            )}
            {size && (
                <g>
                    {/* Background for readability */}
                    <rect
                        x={labelX - 20}
                        y={labelY - 18}
                        width={40}
                        height={14}
                        fill="white"
                        stroke={color}
                        strokeWidth={0.5}
                        rx={2}
                    />
                    <text
                        x={labelX}
                        y={labelY - 8}
                        fontSize={9}
                        fontFamily="Arial"
                        fontWeight="bold"
                        fill={color}
                        textAnchor="middle"
                    >
                        {size}
                    </text>
                </g>
            )}
        </g>
    );
};

// ============================================================
// MAIN CANVAS COMPONENT
// ============================================================
const ProfessionalPIDCanvas: React.FC<ProfessionalPIDCanvasProps> = ({
    data,
    projectInfo = {
        client: 'CLIENT NAME',
        projectName: 'AMMONIA REFRIGERATION SYSTEM',
        drawingTitle: 'GENERAL PIPING DIAGRAM',
        drawingNo: 'PID-001',
        designer: 'GFDDE AI',
        date: new Date().toLocaleDateString()
    },
    width = 3500,   // Wide canvas - matches backend
    height = 2200   // Compact height - matches backend
}) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [zoom, setZoom] = useState(0.3);  // 30% zoom for full overview





    // Pan state for mouse drag
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsPanning(true);
        setPanStart({ x: e.clientX, y: e.clientY });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isPanning || !containerRef.current) return;
        const dx = e.clientX - panStart.x;
        const dy = e.clientY - panStart.y;
        containerRef.current.scrollLeft -= dx;
        containerRef.current.scrollTop -= dy;
        setPanStart({ x: e.clientX, y: e.clientY });
    };

    const handleMouseUp = () => setIsPanning(false);

    // Generate demo layout if no data provided
    const demoLayout = useMemo(() => {
        // Create a sample ammonia refrigeration system layout
        const compressors = [
            { x: 400, y: 450, tag: 'CMP-01', model: 'N320VLD-K', power: '500KW' },
            { x: 400, y: 600, tag: 'CMP-02', model: 'N320VLD-K', power: '500KW' }
        ];

        const condensers = [
            { x: 750, y: 80, tag: 'COND-01', model: 'TXC-125-3', capacity: '1100 kW' }
        ];

        const evaporators = [
            { x: 100, y: 80, tag: 'COLD STORE NO 1', capacity: '180 kW' },
            { x: 100, y: 200, tag: 'COLD STORE NO 2', capacity: '180 kW' }
        ];

        const vessels = [
            { x: 600, y: 300, tag: 'REC-01', type: 'AMMONIA RECEIVER', volume: '450' }
        ];

        const oilSeparators = [
            { x: 300, y: 280, tag: 'OS-01' }
        ];

        // Piping connections
        const pipes = [
            // Discharge (Hot Gas) - Red
            {
                points: [{ x: 530, y: 480 }, { x: 600, y: 480 }, { x: 600, y: 120 }, { x: 770, y: 120 }],
                fluidType: 'hotGas', size: '2"'
            },
            {
                points: [{ x: 530, y: 630 }, { x: 580, y: 630 }, { x: 580, y: 480 }],
                fluidType: 'hotGas', size: '2"'
            },

            // Liquid - Yellow
            {
                points: [{ x: 870, y: 120 }, { x: 950, y: 120 }, { x: 950, y: 330 }, { x: 665, y: 330 }],
                fluidType: 'liquid', size: '1 1/2"'
            },
            {
                points: [{ x: 600, y: 380 }, { x: 600, y: 450 }, { x: 250, y: 450 }, { x: 250, y: 110 }],
                fluidType: 'liquid', size: '1"'
            },

            // Suction - Blue
            {
                points: [{ x: 100, y: 110 }, { x: 50, y: 110 }, { x: 50, y: 500 }, { x: 385, y: 500 }],
                fluidType: 'suction', size: '3"'
            },
            {
                points: [{ x: 100, y: 230 }, { x: 30, y: 230 }, { x: 30, y: 500 }],
                fluidType: 'suction', size: '3"'
            }
        ];

        return { compressors, condensers, evaporators, vessels, oilSeparators, pipes };
    }, []);

    const layout = useMemo(() => {
        console.log('[PIDCanvas] Received data:', data);
        if (!data) return demoLayout;

        // Normalize the two real P&ID contracts without inventing equipment.
        // DesignOrchestrator emits { equipment, pipes }; imported GFDDE emits { nodes, edges }.
        const pidTopology = data?.pidData || data?.pidData2D || data?.diagram || data;
        const nodes = Array.isArray(pidTopology?.nodes)
            ? pidTopology.nodes
            : (Array.isArray(pidTopology?.equipment) ? pidTopology.equipment : []);
        const edges = Array.isArray(pidTopology?.edges)
            ? pidTopology.edges
            : (Array.isArray(pidTopology?.pipes) ? pidTopology.pipes : []);
        if (nodes.length > 0 || edges.length > 0) {
            console.log('[PIDCanvas] Mapping P&ID topology:', nodes.length, 'equipment nodes and', edges.length, 'pipe edges');
            return {
                compressors: nodes.filter((n: any) => n.data?.componentType?.includes('compressor')).map((n: any) => ({ x: n.position.x * 2.5 + 200, y: n.position.y * 2.5 + 100, tag: n.data.tag, model: n.data.label, power: n.data.details })),
                condensers: nodes.filter((n: any) => n.data?.componentType === 'evaporative_condenser').map((n: any) => ({ x: n.position.x * 2.5 + 200, y: n.position.y * 2.5 + 100, tag: n.data.tag, model: n.data.label, capacity: n.data.details })),
                evaporators: nodes.filter((n: any) => n.data?.componentType === 'evaporator').map((n: any) => ({ x: n.position.x * 2.5 + 200, y: n.position.y * 2.5 + 100, tag: n.data.tag, capacity: n.data.details })),
                vessels: nodes.filter((n: any) => n.data?.componentType?.includes('vessel')).map((n: any) => ({ x: n.position.x * 2.5 + 200, y: n.position.y * 2.5 + 100, tag: n.data.tag, type: n.data.label, volume: n.data.details })),
                oilSeparators: nodes.filter((n: any) => n.data?.componentType === 'oil_separator').map((n: any) => ({ x: n.position.x * 2.5 + 200, y: n.position.y * 2.5 + 100, tag: n.data.tag })),
                pumps: nodes.filter((n: any) => n.data?.componentType === 'pump').map((n: any) => ({ x: n.position.x * 2.5 + 200, y: n.position.y * 2.5 + 100, tag: n.data.tag, model: n.data.label })),

                pipes: edges.map((e: any) => {
                    const sourceNode = nodes.find((n: any) => n.id === e.source);
                    const targetNode = nodes.find((n: any) => n.id === e.target);
                    let points = e.style?.points || [];

                    if (points.length === 0 && sourceNode && targetNode) {
                        // Generate simple orthogonal path if no points provided
                        const sx = sourceNode.position.x * 2.5 + 200;
                        const sy = sourceNode.position.y * 2.5 + 100;
                        const tx = targetNode.position.x * 2.5 + 200;
                        const ty = targetNode.position.y * 2.5 + 100;

                        points = [
                            {x: sx, y: sy},
                            {x: sx, y: ty},
                            {x: tx, y: ty}
                        ];
                    } else if (points.length > 0) {
                        // Scale existing points
                        points = points.map((p: any) => ({
                            x: p.x * 2.5 + 200,
                            y: p.y * 2.5 + 100
                        }));
                    }

                    return {
                        points,
                        fluidType: e.style?.stroke === '#c62828' ? 'hotGas' : (e.style?.stroke === '#1e88e5' ? 'suction' : 'liquid'),
                        size: e.label || ''
                    };
                }),

                valves: nodes.filter((n: any) => n.data?.componentType?.includes('valve') || n.data?.componentType === 'tev').map((n: any) => ({ x: n.position.x * 2.5 + 200, y: n.position.y * 2.5 + 100, tag: n.data.tag, symbolType: n.data.componentType === 'tev' ? 'ExpansionValve' : 'GlobeValve' })),
                instruments: nodes.filter((n: any) => n.data?.componentType === 'instrument').map((n: any) => ({ x: n.position.x * 2.5 + 200, y: n.position.y * 2.5 + 100, tag: n.data.tag, type: n.data.label }))
            };
        }
        // Avoid a renderer crash for incomplete source data; do not substitute a generic P&ID.
        return {
            compressors: [], condensers: [], evaporators: [], vessels: [],
            oilSeparators: [], pumps: [], pipes: [], valves: [], instruments: []
        };    }, [data, demoLayout]);

    const handleDownload = () => {
        if (!svgRef.current) return;
        const svgData = new XMLSerializer().serializeToString(svgRef.current);
        const blob = new Blob([svgData], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${projectInfo.drawingNo}_${projectInfo.drawingTitle.replace(/\s+/g, '_')}.svg`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <Box sx={{ width: '100%', height: '100%', bgcolor: '#f5f5f5', position: 'relative' }}>
            {/* Toolbar */}
            <Box sx={{
                position: 'absolute', top: 10, right: 10, zIndex: 10,
                bgcolor: 'white', borderRadius: 1, boxShadow: 2, p: 0.5
            }}>
                <Tooltip title="Zoom In">
                    <IconButton size="small" onClick={() => setZoom(z => Math.min(z + 0.1, 2))}>
                        <ZoomInIcon />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Zoom Out">
                    <IconButton size="small" onClick={() => setZoom(z => Math.max(z - 0.1, 0.3))}>
                        <ZoomOutIcon />
                    </IconButton>
                </Tooltip>
                <Typography variant="caption" sx={{ px: 1, minWidth: 40, textAlign: 'center' }}>
                    {Math.round(zoom * 100)}%
                </Typography>
                <Tooltip title="Fit to Screen (50%)">
                    <IconButton size="small" onClick={() => setZoom(0.5)}>
                        <span style={{ fontSize: 12, fontWeight: 'bold' }}>FIT</span>
                    </IconButton>
                </Tooltip>
                <Tooltip title="Reset Zoom (100%)">
                    <IconButton size="small" onClick={() => setZoom(1)}>
                        <span style={{ fontSize: 12, fontWeight: 'bold' }}>1:1</span>
                    </IconButton>
                </Tooltip>
                <Tooltip title="Download SVG">
                    <IconButton size="small" onClick={handleDownload}>
                        <DownloadIcon />
                    </IconButton>
                </Tooltip>
            </Box>

            {/* Legend */}
            <Box sx={{
                position: 'absolute', top: 10, left: 10, zIndex: 10,
                bgcolor: 'white', borderRadius: 1, boxShadow: 2, p: 1
            }}>
                <Typography variant="caption" fontWeight="bold" display="block" mb={0.5}>
                    PIPE LEGEND
                </Typography>
                {Object.entries(PIPE_COLORS).filter(([k]) => k !== 'default').map(([key, color]) => (
                    <Box key={key} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.3 }}>
                        <Box sx={{ width: 30, height: 3, bgcolor: color }} />
                        <Typography variant="caption">
                            {key === 'hotGas' ? 'Hot Gas' :
                                key === 'liquid' ? 'Liquid' :
                                    key === 'suction' ? 'Suction' :
                                        key === 'oil' ? 'Oil' : 'Return'}
                        </Typography>
                    </Box>
                ))}
            </Box>

            {/* Main SVG Canvas - Scrollable + Pannable Container */}
            <Box
                ref={containerRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                sx={{
                    width: '100%',
                    height: 'calc(100% - 20px)',
                    overflow: 'auto',
                    bgcolor: '#e8e8e8',
                    cursor: isPanning ? 'grabbing' : 'grab',
                    userSelect: 'none',
                    p: 2
                }}>
                <svg
                    ref={svgRef}
                    width={width * zoom}
                    height={height * zoom}
                    viewBox={`0 0 ${width} ${height}`}
                    style={{
                        background: 'white',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                        border: '2px solid #333',
                        display: 'block',
                        minWidth: width * zoom,
                        minHeight: height * zoom
                    }}
                >
                    {/* Professional Drawing Border */}
                    <rect x={0} y={0} width={width} height={height}
                        fill="white" stroke="black" strokeWidth={3} />
                    <rect x={30} y={30} width={width - 60} height={height - 180}
                        fill="none" stroke="black" strokeWidth={2} />

                    {/* Grid Reference Numbers (Top) - 1 to 10 */}
                    {Array.from({ length: 10 }, (_, i) => {
                        const colWidth = (width - 60) / 10;
                        return (
                            <g key={`col-${i}`}>
                                <rect x={30 + i * colWidth} y={10} width={colWidth} height={20}
                                    fill="none" stroke="black" strokeWidth={0.5} />
                                <text
                                    x={30 + i * colWidth + colWidth / 2}
                                    y={24}
                                    textAnchor="middle"
                                    fontSize={10}
                                    fontFamily="Arial"
                                >{i + 1}</text>
                            </g>
                        );
                    })}

                    {/* Grid Reference Letters (Left) - A to G */}
                    {Array.from({ length: 7 }, (_, i) => {
                        const rowHeight = (height - 180) / 7;
                        const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
                        return (
                            <g key={`row-${i}`}>
                                <rect x={5} y={30 + i * rowHeight} width={25} height={rowHeight}
                                    fill="none" stroke="black" strokeWidth={0.5} />
                                <text
                                    x={17}
                                    y={30 + i * rowHeight + rowHeight / 2 + 4}
                                    textAnchor="middle"
                                    fontSize={10}
                                    fontFamily="Arial"
                                >{letters[i]}</text>
                            </g>
                        );
                    })}

                    {/* Faint grid lines inside drawing area */}
                    <g opacity={0.05}>
                        {Array.from({ length: 10 }, (_, i) => {
                            const x = 30 + ((width - 60) / 10) * (i + 1);
                            return <line key={`v${i}`} x1={x} y1={30} x2={x} y2={height - 150} stroke="black" />;
                        })}
                        {Array.from({ length: 7 }, (_, i) => {
                            const y = 30 + ((height - 180) / 7) * (i + 1);
                            return <line key={`h${i}`} x1={30} y1={y} x2={width - 30} y2={y} stroke="black" />;
                        })}
                    </g>


                    {/* Main Drawing Content - Offset to align with border */}
                    <g transform="translate(30, 30)">
                        {/* Pipes (draw first so they're behind equipment) */}
                        {layout.pipes?.map((pipe: any, i: number) => (
                            <PipeSegment
                                key={`pipe-${i}`}
                                points={pipe.points}
                                fluidType={pipe.fluidType}
                                size={pipe.size}
                                showArrow={true}
                            />
                        ))}

                        {/* Equipment */}

                        {layout.compressors?.map((c: any, i: number) => (
                            <ScrewCompressor key={`comp-${i}`} {...c} />
                        ))}

                        {layout.condensers?.map((c: any, i: number) => (
                            <EvaporativeCondenser key={`cond-${i}`} {...c} />
                        ))}

                        {layout.evaporators?.map((e: any, i: number) => (
                            <AirCooler key={`evap-${i}`} {...e} />
                        ))}

                        {layout.vessels?.map((v: any, i: number) => (
                            <VerticalVessel key={`vessel-${i}`} {...v} />
                        ))}

                        {layout.oilSeparators?.map((o: any, i: number) => (
                            <OilSeparator key={`os-${i}`} {...o} />
                        ))}

                        {/* Ammonia Circulation Pumps */}
                        {layout.pumps?.map((p: any, i: number) => (
                            <CentrifugalPump key={`pump-${i}`} {...p} />
                        ))}

                        {/* Equipment Callout Boxes - Professional Spec Display */}
                        {layout.compressors?.map((c: any, i: number) => (
                            <EquipmentCallout
                                key={`callout-comp-${i}`}
                                x={c.x + 60}
                                y={c.y - 80}
                                title={c.tag}
                                lines={[
                                    `Model: ${c.model || 'N/A'}`,
                                    `Power: ${c.power || 'N/A'}`,
                                    `Type: Screw Compressor`
                                ]}
                            />
                        ))}

                        {layout.condensers?.map((c: any, i: number) => (
                            <EquipmentCallout
                                key={`callout-cond-${i}`}
                                x={c.x + 70}
                                y={c.y - 70}
                                title={c.tag}
                                lines={[
                                    `Model: ${c.model || 'N/A'}`,
                                    `Capacity: ${c.capacity || 'N/A'}`,
                                    `Type: Evaporative`
                                ]}
                            />
                        ))}

                        {layout.evaporators?.map((e: any, i: number) => (
                            <EquipmentCallout
                                key={`callout-evap-${i}`}
                                x={e.x + 60}
                                y={e.y - 70}
                                title={e.tag}
                                lines={[
                                    `Capacity: ${e.capacity || 'N/A'}`,
                                    `Type: Air Cooler`
                                ]}
                            />
                        ))}

                        {/* Valves - ISO 14617 Symbols */}


                        {(layout.valves || []).map((valve: any, i: number) => {
                            const ValveComponent = (ValveSymbols as any)[valve.symbolType] || ValveSymbols.GlobeValve;
                            return (
                                <ValveComponent
                                    key={`valve-${i}`}
                                    x={valve.x}
                                    y={valve.y}
                                    size={valve.size || 'DN50'}
                                    tag={valve.tag}
                                    rotation={valve.rotation || 0}
                                    {...valve.specs}
                                />
                            );
                        })}

                        {/* Instrumentation */}
                        {(layout.instruments || []).map((inst: any, i: number) => {
                            if (inst.type === 'PI') {
                                return (
                                    <ValveSymbols.PressureIndicator
                                        key={`inst-${i}`}
                                        x={inst.x}
                                        y={inst.y}
                                        tag={inst.tag}
                                        withAlarm={inst.withAlarm}
                                        withTransmitter={inst.withTransmitter}
                                    />
                                );
                            } else if (inst.type === 'TI') {
                                return (
                                    <ValveSymbols.TemperatureIndicator
                                        key={`inst-${i}`}
                                        x={inst.x}
                                        y={inst.y}
                                        tag={inst.tag}
                                        withAlarm={inst.withAlarm}
                                        withTransmitter={inst.withTransmitter}
                                    />
                                );
                            } else if (inst.type === 'LI') {
                                return (
                                    <ValveSymbols.LevelIndicator
                                        key={`inst-${i}`}
                                        x={inst.x}
                                        y={inst.y}
                                        tag={inst.tag}
                                    />
                                );
                            }
                            return null;
                        })}
                    </g>

                    {/* Title Block - Professional TABADOL SAZAN Style */}

                    <TitleBlock
                        x={30}
                        y={height - 145}
                        info={projectInfo}
                    />


                    {/* Equipment List Table - Bottom Left */}
                    <EquipmentList
                        x={20}
                        y={height - 150}
                        equipment={[
                            ...layout.compressors?.map((c: any) => ({ tag: c.tag, type: 'Compressor', specs: c.model })) || [],
                            ...layout.condensers?.map((c: any) => ({ tag: c.tag, type: 'Condenser', specs: c.capacity })) || [],
                            ...layout.evaporators?.map((e: any) => ({ tag: e.tag, type: 'Evaporator', specs: e.capacity })) || [],
                            ...layout.vessels?.map((v: any) => ({ tag: v.tag, type: v.type, specs: v.volume })) || [],
                            ...layout.pumps?.map((p: any) => ({ tag: p.tag, type: 'Pump', specs: p.capacity })) || []
                        ]}
                    />

                    {/* Drawing Notes */}
                    <g transform={`translate(20, ${height - 80})`}>
                        <text fontSize={9} fontWeight="bold" fontFamily="Arial">NOTE:</text>
                        <text x={0} y={14} fontSize={8} fontFamily="Arial">
                            ALL DIMENSIONS ARE IN MILLIMETERS
                        </text>
                        <text x={0} y={26} fontSize={8} fontFamily="Arial">
                            * Pipe sizing per ASHRAE velocity criteria
                        </text>
                        <text x={0} y={38} fontSize={8} fontFamily="Arial">
                            * Ammonia system - follow EN 378 safety requirements
                        </text>
                    </g>

                </svg>
            </Box>
        </Box>
    );
};

export default ProfessionalPIDCanvas;
