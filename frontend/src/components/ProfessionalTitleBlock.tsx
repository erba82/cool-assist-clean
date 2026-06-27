/**
 * Professional P&ID Title Block
 * 
 * Standards-compliant title block following:
 * - ISO 7200: Technical drawings - Title blocks
 * - ISO 5457: Technical drawings - Sizes and layout of drawing sheets
 * 
 * Includes:
 * - Project Information
 * - Drawing Details
 * - Revision History
 * - Designer/Checker/Approver
 * - Company Logo area
 * 
 * @version 1.0.0
 */

import React from 'react';

interface TitleBlockProps {
    projectInfo: {
        client?: string;
        projectName: string;
        drawingTitle: string;
        drawingNo: string;
        designer?: string;
        checker?: string;
        approver?: string;
        date?: string;
        scale?: string;
        size?: string;
        revision?: string;
    };
    revisionHistory?: Array<{
        rev: string;
        date: string;
        description: string;
        by: string;
    }>;
    x?: number;
    y?: number;
    width?: number;
}

export const ProfessionalTitleBlock: React.FC<TitleBlockProps> = ({
    projectInfo,
    revisionHistory = [],
    x = 50,
    y = 700,
    width = 900
}) => {
    const blockHeight = 120;
    const revTableHeight = revisionHistory.length > 0 ? 80 : 0;
    const totalHeight = blockHeight + revTableHeight;

    return (
        <g transform={`translate(${x}, ${y})`}>
            {/* Main border */}
            <rect
                x="0"
                y="0"
                width={width}
                height={totalHeight}
                fill="white"
                stroke="black"
                strokeWidth="2"
            />

            {/* Company Logo Area */}
            <g>
                <rect x="0" y="0" width="150" height="60" fill="none" stroke="black" strokeWidth="1" />
                <text
                    x="75"
                    y="25"
                    fontSize="16"
                    fontFamily="Arial"
                    fontWeight="bold"
                    textAnchor="middle"
                >
                    GFDDE
                </text>
                <text
                    x="75"
                    y="40"
                    fontSize="10"
                    fontFamily="Arial"
                    textAnchor="middle"
                    fill="#666"
                >
                    AI Engineering
                </text>
                <text
                    x="75"
                    y="52"
                    fontSize="8"
                    fontFamily="Arial"
                    textAnchor="middle"
                    fill="#888"
                >
                    www.gfdde.ai
                </text>
            </g>

            {/* Client & Project Info */}
            <g>
                <rect x="0" y="60" width="150" height="30" fill="none" stroke="black" strokeWidth="1" />
                <text x="5" y="73" fontSize="8" fontFamily="Arial" fill="#555">CLIENT:</text>
                <text x="5" y="85" fontSize="10" fontFamily="Arial" fontWeight="bold">
                    {projectInfo.client || 'N/A'}
                </text>
            </g>

            <g>
                <rect x="0" y="90" width="150" height="30" fill="none" stroke="black" strokeWidth="1" />
                <text x="5" y="103" fontSize="8" fontFamily="Arial" fill="#555">PROJECT:</text>
                <text x="5" y="115" fontSize="9" fontFamily="Arial" fontWeight="600">
                    {projectInfo.projectName}
                </text>
            </g>

            {/* Drawing Title */}
            <g>
                <rect x="150" y="0" width={width - 150 - 200} height="50" fill="#f8f9fa" stroke="black" strokeWidth="1" />
                <text
                    x={150 + (width - 150 - 200) / 2}
                    y="30"
                    fontSize="18"
                    fontFamily="Arial"
                    fontWeight="bold"
                    textAnchor="middle"
                >
                    {projectInfo.drawingTitle}
                </text>
            </g>

            {/* Drawing Details Grid */}
            <g>
                {/* Row 1 */}
                <rect x="150" y="50" width="150" height="25" fill="none" stroke="black" strokeWidth="1" />
                <text x="155" y="62" fontSize="7" fontFamily="Arial" fill="#555">DESIGNED:</text>
                <text x="155" y="70" fontSize="9" fontFamily="Arial" fontWeight="600">
                    {projectInfo.designer || 'GFDDE AI'}
                </text>

                <rect x="300" y="50" width="100" height="25" fill="none" stroke="black" strokeWidth="1" />
                <text x="305" y="62" fontSize="7" fontFamily="Arial" fill="#555">DATE:</text>
                <text x="305" y="70" fontSize="9" fontFamily="Arial">
                    {projectInfo.date || new Date().toLocaleDateString()}
                </text>

                <rect x="400" y="50" width={width - 400 - 200} height="25" fill="none" stroke="black" strokeWidth="1" />
                <text x="405" y="62" fontSize="7" fontFamily="Arial" fill="#555">DWG NO:</text>
                <text x="405" y="70" fontSize="10" fontFamily="Arial" fontWeight="bold">
                    {projectInfo.drawingNo}
                </text>

                {/* Row 2 */}
                <rect x="150" y="75" width="150" height="23" fill="none" stroke="black" strokeWidth="1" />
                <text x="155" y="87" fontSize="7" fontFamily="Arial" fill="#555">CHECKED:</text>
                <text x="155" y="95" fontSize="9" fontFamily="Arial">
                    {projectInfo.checker || '-'}
                </text>

                <rect x="300" y="75" width="100" height="23" fill="none" stroke="black" strokeWidth="1" />
                <text x="305" y="87" fontSize="7" fontFamily="Arial" fill="#555">SCALE:</text>
                <text x="305" y="95" fontSize="9" fontFamily="Arial">
                    {projectInfo.scale || 'NTS'}
                </text>

                <rect x="400" y="75" width={width - 400 - 200} height="23" fill="none" stroke="black" strokeWidth="1" />
                <text x="405" y="87" fontSize="7" fontFamily="Arial" fill="#555">SIZE:</text>
                <text x="405" y="95" fontSize="9" fontFamily="Arial">
                    {projectInfo.size || 'A1'}
                </text>

                {/* Row 3 */}
                <rect x="150" y="98" width="150" height="22" fill="none" stroke="black" strokeWidth="1" />
                <text x="155" y="110" fontSize="7" fontFamily="Arial" fill="#555">APPROVED:</text>
                <text x="155" y="118" fontSize="9" fontFamily="Arial">
                    {projectInfo.approver || '-'}
                </text>

                <rect x="300" y="98" width="100" height="22" fill="none" stroke="black" strokeWidth="1" />
                <text x="305" y="110" fontSize="7" fontFamily="Arial" fill="#555">REV:</text>
                <text x="305" y="118" fontSize="12" fontFamily="Arial" fontWeight="bold">
                    {projectInfo.revision || 'A'}
                </text>

                <rect x="400" y="98" width={width - 400 - 200} height="22" fill="none" stroke="black" strokeWidth="1" />
                <text x="405" y="110" fontSize="7" fontFamily="Arial" fill="#555">SHEET:</text>
                <text x="405" y="118" fontSize="9" fontFamily="Arial">
                    1 of 1
                </text>
            </g>

            {/* Standards & Notes */}
            <g>
                <rect x={width - 200} y="0" width="200" height="60" fill="#f0f8ff" stroke="black" strokeWidth="1" />
                <text x={width - 195} y="15" fontSize="9" fontFamily="Arial" fontWeight="bold">
                    STANDARDS:
                </text>
                <text x={width - 195} y="28" fontSize="7" fontFamily="Arial">
                    • ISO 14617 - Symbols
                </text>
                <text x={width - 195} y="38" fontSize="7" fontFamily="Arial">
                    • EN 378 - Safety
                </text>
                <text x={width - 195} y="48" fontSize="7" fontFamily="Arial">
                    • ASHRAE 15 - Design
                </text>
                <text x={width - 195} y="58" fontSize="7" fontFamily="Arial">
                    • ISO 5167 - Measurement
                </text>
            </g>

            {/* Notes */}
            <g>
                <rect x={width - 200} y="60" width="200" height="60" fill="#fffef0" stroke="black" strokeWidth="1" />
                <text x={width - 195} y="73" fontSize="8" fontFamily="Arial" fontWeight="bold">
                    NOTES:
                </text>
                <text x={width - 195} y="84" fontSize="7" fontFamily="Arial">
                    1. All dimensions in millimeters
                </text>
                <text x={width - 195} y="93" fontSize="7" fontFamily="Arial">
                    2. Pipe sizes in DN (ISO 6708)
                </text>
                <text x={width - 195} y="102" fontSize="7" fontFamily="Arial">
                    3. All pressures in bar gauge
                </text>
                <text x={width - 195} y="111" fontSize="7" fontFamily="Arial">
                    4. Refrigerant: R717 (NH₃)
                </text>
            </g>

            {/* Revision History Table (if provided) */}
            {revisionHistory.length > 0 && (
                <g transform={`translate(0, ${blockHeight})`}>
                    <rect x="0" y="0" width={width} height={revTableHeight} fill="#fafafa" stroke="black" strokeWidth="1" />

                    {/* Table Header */}
                    <rect x="0" y="0" width="50" height="20" fill="#e9ecef" stroke="black" strokeWidth="0.5" />
                    <text x="25" y="13" fontSize="8" fontFamily="Arial" fontWeight="bold" textAnchor="middle">REV</text>

                    <rect x="50" y="0" width="100" height="20" fill="#e9ecef" stroke="black" strokeWidth="0.5" />
                    <text x="100" y="13" fontSize="8" fontFamily="Arial" fontWeight="bold" textAnchor="middle">DATE</text>

                    <rect x="150" y="0" width={width - 350} height="20" fill="#e9ecef" stroke="black" strokeWidth="0.5" />
                    <text x={150 + (width - 350) / 2} y="13" fontSize="8" fontFamily="Arial" fontWeight="bold" textAnchor="middle">DESCRIPTION</text>

                    <rect x={width - 200} y="0" width="100" height="20" fill="#e9ecef" stroke="black" strokeWidth="0.5" />
                    <text x={width - 150} y="13" fontSize="8" fontFamily="Arial" fontWeight="bold" textAnchor="middle">BY</text>

                    <rect x={width - 100} y="0" width="100" height="20" fill="#e9ecef" stroke="black" strokeWidth="0.5" />
                    <text x={width - 50} y="13" fontSize="8" fontFamily="Arial" fontWeight="bold" textAnchor="middle">CHECKED</text>

                    {/* Revision Rows */}
                    {revisionHistory.slice(0, 3).map((rev, i) => (
                        <g key={i} transform={`translate(0, ${20 + i * 20})`}>
                            <rect x="0" y="0" width="50" height="20" fill="white" stroke="black" strokeWidth="0.5" />
                            <text x="25" y="13" fontSize="9" fontFamily="Arial" fontWeight="bold" textAnchor="middle">{rev.rev}</text>

                            <rect x="50" y="0" width="100" height="20" fill="white" stroke="black" strokeWidth="0.5" />
                            <text x="100" y="13" fontSize="8" fontFamily="Arial" textAnchor="middle">{rev.date}</text>

                            <rect x="150" y="0" width={width - 350} height="20" fill="white" stroke="black" strokeWidth="0.5" />
                            <text x="155" y="13" fontSize="8" fontFamily="Arial">{rev.description}</text>

                            <rect x={width - 200} y="0" width="100" height="20" fill="white" stroke="black" strokeWidth="0.5" />
                            <text x={width - 150} y="13" fontSize="8" fontFamily="Arial" textAnchor="middle">{rev.by}</text>

                            <rect x={width - 100} y="0" width="100" height="20" fill="white" stroke="black" strokeWidth="0.5" />
                            <text x={width - 50} y="13" fontSize="8" fontFamily="Arial" textAnchor="middle">-</text>
                        </g>
                    ))}
                </g>
            )}
        </g>
    );
};

export default ProfessionalTitleBlock;
