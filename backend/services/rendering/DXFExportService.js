// backend/services/rendering/DXFExportService.js
/**
 * DXF Export Service for GFDDE
 * Generates .dxf files for CAD integration
 */

class DXFExportService {
    constructor() {
        this.header = `  0
SECTION
  2
HEADER
  9
$ACADVER
  1
AC1015
  0
ENDSEC
  0
SECTION
  2
TABLES
  0
ENDSEC
  0
SECTION
  2
BLOCKS
  0
ENDSEC
  0
SECTION
  2
ENTITIES
`;
        this.footer = `  0
ENDSEC
  0
EOF
`;
    }

    /**
     * Generate DXF content from design
     * @param {Object} design - System design object
     * @returns {string} DXF file content
     */
    generateDXF(design) {
        let content = this.header;

        // Add components
        if (design.components) {
            design.components.forEach((comp, index) => {
                const x = 100 + (index % 3) * 300;
                const y = 150 + Math.floor(index / 3) * 250;
                content += this.renderComponent(comp, x, y);
            });
        }

        // Add connections
        content += this.renderConnections(design.components);

        content += this.footer;
        return content;
    }

    renderComponent(component, x, y) {
        let entities = '';

        // Draw box for component (simplified)
        entities += this.drawRect(x, y, 60, 60);

        // Add label text
        entities += this.drawText(x + 10, y + 70, component.tag || component.type);

        return entities;
    }

    renderConnections(components) {
        if (!components || components.length < 2) return '';

        let entities = '';
        for (let i = 0; i < components.length - 1; i++) {
            const x1 = 100 + (i % 3) * 300 + 60;
            const y1 = 150 + Math.floor(i / 3) * 250 + 30;
            const x2 = 100 + ((i + 1) % 3) * 300;
            const y2 = 150 + Math.floor((i + 1) / 3) * 250 + 30;

            entities += this.drawLine(x1, y1, x2, y2);
        }
        return entities;
    }

    drawLine(x1, y1, x2, y2) {
        return `  0
LINE
  8
0
 10
${x1}
 20
${y1}
 30
0.0
 11
${x2}
 21
${y2}
 31
0.0
`;
    }

    drawRect(x, y, w, h) {
        let rect = '';
        rect += this.drawLine(x, y, x + w, y);
        rect += this.drawLine(x + w, y, x + w, y + h);
        rect += this.drawLine(x + w, y + h, x, y + h);
        rect += this.drawLine(x, y + h, x, y);
        return rect;
    }

    drawText(x, y, text) {
        return `  0
TEXT
  8
0
 10
${x}
 20
${y}
 30
0.0
 40
10.0
  1
${text}
`;
    }
}

module.exports = new DXFExportService();
