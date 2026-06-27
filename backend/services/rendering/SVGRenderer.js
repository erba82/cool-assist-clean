// backend/services/rendering/SVGRenderer.js
/**
 * SVG Renderer Service for GFDDE
 * Generates high-fidelity, scalable vector graphics from system designs
 * Compliant with ISO 10628 symbols
 */

class SVGRenderer {
    constructor() {
        this.colors = {
            process: '#000000',
            ammonia: '#0000FF', // Blue for ammonia
            co2: '#00FF00',     // Green for CO2
            text: '#000000',
            background: '#FFFFFF'
        };

        this.styles = {
            processLine: 'stroke-width: 2; fill: none; stroke: #000000;',
            controlLine: 'stroke-width: 1; fill: none; stroke: #666666; stroke-dasharray: 4,4;',
            text: 'font-family: Arial, sans-serif; font-size: 12px; fill: #000000;',
            label: 'font-family: Arial, sans-serif; font-size: 10px; fill: #666666;'
        };
    }

    /**
     * Generate SVG from design object
     * @param {Object} design - The system design object
     * @returns {string} SVG string
     */
    renderDesign(design) {
        const width = 1200;
        const height = 800;

        let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" style="background-color: ${this.colors.background};">`;

        // Add definitions (markers, symbols)
        svg += this.generateDefs();

        // Add title block
        svg += this.generateTitleBlock(design, width, height);

        // Render components
        if (design.components) {
            design.components.forEach((comp, index) => {
                // Simple auto-layout for now (in production, use a layout engine like dagre)
                const x = 100 + (index % 3) * 300;
                const y = 150 + Math.floor(index / 3) * 250;
                svg += this.renderComponent(comp, x, y);
            });
        }

        // Render piping (simplified connections for now)
        svg += this.renderConnections(design.components);

        svg += '</svg>';
        return svg;
    }

    generateDefs() {
        return `
        <defs>
            <!-- Arrow Marker -->
            <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
                <path d="M0,0 L0,6 L9,3 z" fill="#000" />
            </marker>
        </defs>`;
    }

    renderComponent(component, x, y) {
        let symbol = '';
        const label = component.tag || component.type;

        switch (component.type) {
            case 'compressor':
                symbol = this.getCompressorSymbol(x, y);
                break;
            case 'condenser':
                symbol = this.getCondenserSymbol(x, y);
                break;
            case 'evaporator':
                symbol = this.getEvaporatorSymbol(x, y);
                break;
            case 'receiver':
                symbol = this.getReceiverSymbol(x, y);
                break;
            default:
                symbol = `<rect x="${x}" y="${y}" width="60" height="60" fill="none" stroke="black" stroke-width="2"/>`;
        }

        // Add label
        symbol += `<text x="${x + 30}" y="${y + 80}" text-anchor="middle" style="${this.styles.text}">${label}</text>`;

        // Add technical data
        if (component.capacity) {
            symbol += `<text x="${x + 30}" y="${y + 95}" text-anchor="middle" style="${this.styles.label}">${component.capacity} kW</text>`;
        }

        return `<g id="${component.id || component.type}">${symbol}</g>`;
    }

    getCompressorSymbol(x, y) {
        // Circle with triangle (ISO symbol)
        return `
            <circle cx="${x + 30}" cy="${y + 30}" r="25" fill="none" stroke="black" stroke-width="2"/>
            <path d="M${x + 45},${y + 30} L${x + 15},${y + 15} L${x + 15},${y + 45} Z" fill="none" stroke="black" stroke-width="2"/>
        `;
    }

    getCondenserSymbol(x, y) {
        // Heat exchanger symbol
        return `
            <circle cx="${x + 30}" cy="${y + 30}" r="25" fill="none" stroke="black" stroke-width="2"/>
            <path d="M${x + 10},${y + 20} L${x + 20},${y + 40} L${x + 30},${y + 20} L${x + 40},${y + 40} L${x + 50},${y + 20}" fill="none" stroke="black" stroke-width="2"/>
        `;
    }

    getEvaporatorSymbol(x, y) {
        // Box with fan
        return `
            <rect x="${x}" y="${y + 10}" width="60" height="40" fill="none" stroke="black" stroke-width="2"/>
            <path d="M${x + 10},${y + 20} L${x + 20},${y + 40} L${x + 30},${y + 20} L${x + 40},${y + 40} L${x + 50},${y + 20}" fill="none" stroke="black" stroke-width="1"/>
            <circle cx="${x + 30}" cy="${y - 5}" r="10" fill="none" stroke="black" stroke-width="1"/>
            <path d="M${x + 25},${y - 5} L${x + 35},${y - 5} M${x + 30},${y - 10} L${x + 30},${y}" stroke="black" stroke-width="1"/>
        `;
    }

    getReceiverSymbol(x, y) {
        // Capsule shape
        return `
            <rect x="${x + 10}" y="${y + 10}" width="40" height="40" fill="none" stroke="black" stroke-width="2"/>
            <path d="M${x + 10},${y + 10} A20,10 0 0,1 ${x + 50},${y + 10}" fill="none" stroke="black" stroke-width="2"/>
            <path d="M${x + 10},${y + 50} A20,10 0 0,0 ${x + 50},${y + 50}" fill="none" stroke="black" stroke-width="2"/>
        `;
    }

    renderConnections(components) {
        // Simplified connection logic (connect sequential components)
        if (!components || components.length < 2) return '';

        let paths = '';
        for (let i = 0; i < components.length - 1; i++) {
            const x1 = 100 + (i % 3) * 300 + 60; // Right side of current
            const y1 = 150 + Math.floor(i / 3) * 250 + 30;

            const x2 = 100 + ((i + 1) % 3) * 300; // Left side of next
            const y2 = 150 + Math.floor((i + 1) / 3) * 250 + 30;

            // Draw orthogonal path
            const midX = (x1 + x2) / 2;
            paths += `<path d="M${x1},${y1} L${midX},${y1} L${midX},${y2} L${x2},${y2}" style="${this.styles.processLine}" marker-end="url(#arrow)"/>`;
        }
        return paths;
    }

    generateTitleBlock(design, width, height) {
        const date = new Date().toISOString().split('T')[0];
        return `
        <g transform="translate(${width - 300}, ${height - 100})">
            <rect x="0" y="0" width="290" height="90" fill="none" stroke="black" stroke-width="2"/>
            <line x1="0" y1="30" x2="290" y2="30" stroke="black" stroke-width="1"/>
            <line x1="0" y1="60" x2="290" y2="60" stroke="black" stroke-width="1"/>
            
            <text x="10" y="20" style="font-family: Arial; font-weight: bold; font-size: 14px;">Project: GFDDE Design</text>
            <text x="10" y="50" style="font-family: Arial; font-size: 12px;">Refrigerant: ${design.refrigerant || 'R717'}</text>
            <text x="10" y="80" style="font-family: Arial; font-size: 12px;">Date: ${date}</text>
            <text x="150" y="80" style="font-family: Arial; font-size: 12px;">Rev: 1.0</text>
        </g>`;
    }
}

module.exports = new SVGRenderer();
