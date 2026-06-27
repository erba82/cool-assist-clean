/**
 * DXF Exporter  
 * Export P&ID diagrams to AutoCAD DXF format
 * Compatible with AutoCAD 2000 and later
 */

const Drawing = require('dxf-writer');
const SVGSymbolLibrary = require('./SVGSymbolLibrary');

class DXFExporter {
    constructor() {
        this.symbolLibrary = new SVGSymbolLibrary();

        // Layer colors (AutoCAD Color Index)
        this.layerColors = {
            EQUIPMENT: Drawing.ACI.GREEN,
            PIPING: Drawing.ACI.BLUE,
            VALVES: Drawing.ACI.RED,
            INSTRUMENTS: Drawing.ACI.MAGENTA,
            TEXT: Drawing.ACI.WHITE,
            DIMENSIONS: Drawing.ACI.CYAN
        };
    }

    /**
     * Export P&ID to DXF format
     */
    export(pidData) {
        console.log('[DXFExporter] Generating DXF file...');

        const drawing = new Drawing();

        // Set up drawing units and properties
        drawing.setUnits('Millimeters');

        // Create layers
        this.setupLayers(drawing);

        // Add equipment
        this.addEquipment(drawing, pidData);

        // Add piping
        this.addPiping(drawing, pidData);

        // Add valves
        this.addValves(drawing, pidData);

        // Add text annotations
        this.addTextAnnotations(drawing, pidData);

        // Add title block
        this.addTitleBlock(drawing, pidData);

        console.log('[DXFExporter] ✅ DXF generated successfully');

        return drawing.toDxfString();
    }

    /**
     * Set up drawing layers
     */
    setupLayers(drawing) {
        Object.entries(this.layerColors).forEach(([name, color]) => {
            drawing.addLayer(name, color, 'CONTINUOUS');
        });
    }

    /**
     * Add equipment to drawing
     */
    addEquipment(drawing, pidData) {
        drawing.setActiveLayer('EQUIPMENT');

        // Add compressors
        if (pidData.components?.compressors) {
            pidData.components.compressors.forEach((comp, index) => {
                const pos = comp.position || this.calculatePosition('compressor', index);
                const symbol = this.symbolLibrary.getSymbol(
                    comp.type === 'screw' ? 'compressor_screw' : 'compressor_reciprocating'
                );

                // Draw symbol (simplified for DXF)
                this.drawCompressor(drawing, pos.x, pos.y, symbol.width);

                // Add tag
                drawing.setActiveLayer('TEXT');
                drawing.drawText(
                    pos.x + symbol.width / 2,
                    pos.y + symbol.height + 5,
                    3,  // Height
                    0,  // Rotation
                    comp.tag || `CMP-${index + 1}`
                );

                // Add capacity
                if (comp.capacity) {
                    drawing.drawText(
                        pos.x + symbol.width / 2,
                        pos.y + symbol.height + 10,
                        2.5,
                        0,
                        `${comp.capacity} kW`
                    );
                }

                drawing.setActiveLayer('EQUIPMENT');
            });
        }

        // Add evaporators
        if (pidData.components?.evaporators) {
            pidData.components.evaporators.forEach((evap, index) => {
                const pos = evap.position || this.calculatePosition('evaporator', index);
                this.drawEvaporator(drawing, pos.x, pos.y, 70, 50);

                drawing.setActiveLayer('TEXT');
                drawing.drawText(pos.x + 35, pos.y + 55, 3, 0, evap.tag || `EVP-${index + 1}`);
                drawing.setActiveLayer('EQUIPMENT');
            });
        }

        // Add condensers
        if (pidData.components?.condensers) {
            pidData.components.condensers.forEach((cond, index) => {
                const pos = cond.position || this.calculatePosition('condenser', index);
                this.drawCondenser(drawing, pos.x, pos.y, 70, 50);

                drawing.setActiveLayer('TEXT');
                drawing.drawText(pos.x + 35, pos.y + 55, 3, 0, cond.tag || `COND-${index + 1}`);
                drawing.setActiveLayer('EQUIPMENT');
            });
        }

        // Add vessels
        if (pidData.components?.vessels) {
            pidData.components.vessels.forEach((vessel, index) => {
                const pos = vessel.position || this.calculatePosition('vessel', index);
                this.drawVessel(drawing, pos.x, pos.y, 80, 50);

                drawing.setActiveLayer('TEXT');
                drawing.drawText(pos.x + 40, pos.y + 55, 3, 0, vessel.tag || `V-${index + 1}`);
                drawing.setActiveLayer('EQUIPMENT');
            });
        }
    }

    /**
     * Draw compressor symbol
     */
    drawCompressor(drawing, x, y, width) {
        const radius = width / 2;
        const cx = x + radius;
        const cy = y + radius;

        // Circle
        drawing.drawCircle(cx, cy, radius);

        // Impeller lines (simplified)
        drawing.drawLine(cx - radius * 0.5, cy - radius * 0.3, cx, cy);
        drawing.drawLine(cx - radius * 0.5, cy + radius * 0.3, cx, cy);
        drawing.drawLine(cx, cy, cx + radius * 0.5, cy - radius * 0.3);
        drawing.drawLine(cx, cy, cx + radius * 0.5, cy + radius * 0.3);
    }

    /**
     * Draw evaporator symbol
     */
    drawEvaporator(drawing, x, y, width, height) {
        // Outer rectangle
        drawing.drawRect(x + 5, y + 10, width - 10, height - 20);

        // Internal wavy lines (simplified as straight lines)
        const lines = 8;
        for (let i = 0; i < lines; i++) {
            const lineX = x + 10 + (i * (width - 20) / lines);
            drawing.drawLine(lineX, y + 15, lineX, y + height - 15);
        }
    }

    /**
     * Draw condenser symbol
     */
    drawCondenser(drawing, x, y, width, height) {
        // Outer rectangle
        drawing.drawRect(x + 5, y + 10, width - 10, height - 20);

        // Vertical lines
        const lines = 10;
        for (let i = 0; i < lines; i++) {
            const lineX = x + 10 + (i * (width - 20) / lines);
            drawing.drawLine(lineX, y + 15, lineX, y + height - 15);
        }
    }

    /**
     * Draw vessel symbol
     */
    drawVessel(drawing, x, y, width, height) {
        // Simplified as rounded rectangle (ellipse approximation)
        const cx = x + width / 2;
        const cy = y + height / 2;
        const rx = width / 2 - 2;
        const ry = height / 2 - 2;

        drawing.drawEllipse(cx, cy, rx, ry);

        // Horizontal liquid level line
        drawing.drawLine(x + 2, cy, x + width - 2, cy);
    }

    /**
     * Add piping to drawing
     */
    addPiping(drawing, pidData) {
        drawing.setActiveLayer('PIPING');

        if (pidData.piping) {
            pidData.piping.forEach(pipe => {
                // Draw pipe as polyline
                if (pipe.waypoints && pipe.waypoints.length > 0) {
                    const points = [pipe.from, ...pipe.waypoints, pipe.to];

                    for (let i = 0; i < points.length - 1; i++) {
                        drawing.drawLine(
                            points[i].x,
                            points[i].y,
                            points[i + 1].x,
                            points[i + 1].y
                        );
                    }
                } else {
                    // Direct line with orthogonal routing
                    const dx = pipe.to.x - pipe.from.x;
                    const dy = pipe.to.y - pipe.from.y;

                    if (Math.abs(dx) > Math.abs(dy)) {
                        // Horizontal first
                        const midX = pipe.from.x + dx / 2;
                        drawing.drawLine(pipe.from.x, pipe.from.y, midX, pipe.from.y);
                        drawing.drawLine(midX, pipe.from.y, midX, pipe.to.y);
                        drawing.drawLine(midX, pipe.to.y, pipe.to.x, pipe.to.y);
                    } else {
                        // Vertical first
                        const midY = pipe.from.y + dy / 2;
                        drawing.drawLine(pipe.from.x, pipe.from.y, pipe.from.x, midY);
                        drawing.drawLine(pipe.from.x, midY, pipe.to.x, midY);
                        drawing.drawLine(pipe.to.x, midY, pipe.to.x, pipe.to.y);
                    }
                }

                // Add pipe label
                if (pipe.label) {
                    const midX = (pipe.from.x + pipe.to.x) / 2;
                    const midY = (pipe.from.y + pipe.to.y) / 2;

                    drawing.setActiveLayer('TEXT');
                    drawing.drawText(midX, midY - 2, 2, 0, pipe.label);
                    drawing.setActiveLayer('PIPING');
                }
            });
        }
    }

    /**
     * Add valves to drawing
     */
    addValves(drawing, pidData) {
        drawing.setActiveLayer('VALVES');

        if (pidData.valves) {
            pidData.valves.forEach((valve, index) => {
                this.drawValve(drawing, valve.position.x, valve.position.y, valve.type);

                drawing.setActiveLayer('TEXT');
                drawing.drawText(
                    valve.position.x + 20,
                    valve.position.y + 50,
                    2.5,
                    0,
                    valve.tag || `V-${index + 1}`
                );
                drawing.setActiveLayer('VALVES');
            });
        }
    }

    /**
     * Draw valve symbol
     */
    drawValve(drawing, x, y, type) {
        // Diamond shape for valve body
        const points = [
            [x, y + 20],
            [x + 20, y],
            [x + 40, y + 20],
            [x + 20, y + 40],
            [x, y + 20]  // Close path
        ];

        for (let i = 0; i < points.length - 1; i++) {
            drawing.drawLine(points[i][0], points[i][1], points[i + 1][0], points[i + 1][1]);
        }

        // Add type-specific details
        if (type === 'manual') {
            // Stem
            drawing.drawLine(x + 20, y - 10, x + 20, y);
            // Handwheel
            drawing.drawCircle(x + 20, y - 15, 3);
        } else if (type === 'check') {
            // Internal flap (simplified)
            drawing.drawCircle(x + 20, y + 20, 8);
        }
    }

    /**
     * Add text annotations
     */
    addTextAnnotations(drawing, pidData) {
        drawing.setActiveLayer('TEXT');

        if (pidData.annotations) {
            pidData.annotations.forEach(annotation => {
                drawing.drawText(
                    annotation.position.x,
                    annotation.position.y,
                    annotation.size || 3,
                    annotation.rotation || 0,
                    annotation.text
                );
            });
        }
    }

    /**
     * Add title block
     */
    addTitleBlock(drawing, pidData) {
        const x = 1000;
        const y = 50;
        const width = 300;
        const height = 100;

        drawing.setActiveLayer('TEXT');

        // Border
        drawing.drawRect(x, y, width, height);

        // Title
        drawing.drawText(
            x + 10,
            y + height - 20,
            5,
            0,
            pidData.metadata?.title || 'Ammonia Refrigeration System'
        );

        // Project details
        const details = [
            `Capacity: ${pidData.requirements?.cooling_capacity || 'N/A'} kW`,
            `Refrigerant: ${pidData.requirements?.refrigerant || 'R717'}`,
            `Date: ${new Date().toLocaleDateString()}`
        ];

        details.forEach((text, i) => {
            drawing.drawText(x + 10, y + height - 40 - (i * 12), 3, 0, text);
        });
    }

    /**
     * Calculate default position
     */
    calculatePosition(type, index) {
        const baseY = 400;
        const spacing = 250;

        const positions = {
            compressor: { x: 150, y: baseY },
            condenser: { x: 450, y: baseY - 150 },
            vessel: { x: 650, y: baseY },
            evaporator: { x: 850 + (index * spacing), y: baseY + 150 }
        };

        return positions[type] || { x: 100 + (index * spacing), y: baseY };
    }
}

module.exports = DXFExporter;
