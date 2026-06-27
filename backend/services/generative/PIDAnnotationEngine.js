/**
 * P&ID Annotation Engine
 * Auto-generates professional labels, tags, and specifications
 * Following ISA-5.1-2009 and ISO 10628 standards
 */

// ===== ANNOTATION CONFIGURATION =====
const ANNOTATION_CONFIG = {
    // Equipment tag format: TYPE-NN
    EQUIPMENT_TAG: {
        PREFIX_MAP: {
            screw_compressor: 'COMP',
            reciprocating_compressor: 'COMP',
            evaporative_condenser: 'COND',
            horizontal_vessel: 'REC',
            vertical_vessel: 'VES',
            evaporator: 'EVAP',
            shell_tube_hx: 'HX'
        },
        POSITION_OFFSET: { x: 0, y: -40 }  // Above equipment
    },

    // Pipe label format: LINE-ID DN-SIZE
    PIPE_LABEL: {
        PREFIX_MAP: {
            discharge: 'DIS',
            liquid: 'LIQ',
            suction: 'SUC',
            oil: 'OIL',
            twoPhase: '2PH'
        },
        DN_SIZES: {
            discharge: 'DN125',
            liquid: 'DN80',
            suction: 'DN150',
            oil: 'DN25',
            twoPhase: 'DN50'
        },
        POSITION: 'MID_SEGMENT',  // Place at middle of long pipes
        MIN_LENGTH: 150  // Only label pipes longer than this (px)
    },

    // Instrument tag format: XX-NNN-Y (ISA-5.1)
    INSTRUMENT_TAG: {
        TYPE_CODES: {
            pressure_transmitter: 'PT',
            temperature_transmitter: 'TT',
            level_transmitter: 'LT',
            flow_transmitter: 'FT',
            pressure_indicator: 'PI',
            temperature_indicator: 'TI',
            level_indicator: 'LI'
        },
        LOOP_START: 100,  // Start numbering from 100
        POSITION_OFFSET: { x: 0, y: 30 }  // Below instrument bubble
    },

    // Flow arrows
    FLOW_ARROW: {
        SPACING: 300,  // Place arrow every 300px along pipe
        SIZE: 15,
        STYLE: {
            stroke: 'black',
            strokeWidth: 2,
            fill: 'black'
        }
    },

    // Text styles
    TEXT_STYLE: {
        EQUIPMENT: {
            fontSize: 14,
            fontWeight: 'bold',
            fontFamily: 'Arial',
            fill: 'black'
        },
        PIPE: {
            fontSize: 11,
            fontWeight: 'normal',
            fontFamily: 'Arial',
            fill: 'black'
        },
        INSTRUMENT: {
            fontSize: 10,
            fontWeight: 'bold',
            fontFamily: 'Arial',
            fill: 'black'
        }
    }
};

/**
 * Annotation Generator
 */
class PIDAnnotationGenerator {
    constructor() {
        this.annotations = {
            equipmentTags: [],
            pipeLabels: [],
            instrumentTags: [],
            flowArrows: []
        };
        this.equipmentCounters = {};
        this.instrumentLoopCounter = ANNOTATION_CONFIG.INSTRUMENT_TAG.LOOP_START;
    }

    /**
     * Generate equipment tag
     */
    generateEquipmentTag(componentType, customTag = null) {
        const prefix = ANNOTATION_CONFIG.EQUIPMENT_TAG.PREFIX_MAP[componentType] || 'EQP';

        if (customTag) return customTag;

        // Auto-increment counter for this type
        this.equipmentCounters[prefix] = (this.equipmentCounters[prefix] || 0) + 1;
        const number = String(this.equipmentCounters[prefix]).padStart(2, '0');

        return `${prefix}-${number}`;
    }

    /**
     * Add equipment tag annotation
     */
    addEquipmentTag(id, position, componentType, customTag = null, capacity = null) {
        const tag = this.generateEquipmentTag(componentType, customTag);
        const offset = ANNOTATION_CONFIG.EQUIPMENT_TAG.POSITION_OFFSET;

        this.annotations.equipmentTags.push({
            id,
            tag,
            position: {
                x: position.x + offset.x,
                y: position.y + offset.y
            },
            componentType,
            capacity,
            style: ANNOTATION_CONFIG.TEXT_STYLE.EQUIPMENT
        });

        return tag;
    }

    /**
     * Generate pipe label with DN sizing
     */
    generatePipeLabel(pipeType, index = 1) {
        const prefix = ANNOTATION_CONFIG.PIPE_LABEL.PREFIX_MAP[pipeType] || 'PIPE';
        const dn = ANNOTATION_CONFIG.PIPE_LABEL.DN_SIZES[pipeType] || 'DN50';
        const number = String(index).padStart(3, '0');

        return `${prefix}-${number} ${dn}`;
    }

    /**
     * Add pipe label annotation
     */
    addPipeLabel(pipeRoute, index = 1) {
        if (pipeRoute.length < ANNOTATION_CONFIG.PIPE_LABEL.MIN_LENGTH) {
            return null;  // Skip short pipes
        }

        const label = this.generatePipeLabel(pipeRoute.type, index);

        // Position at mid-point of pipe
        const midIndex = Math.floor(pipeRoute.pixelPath.length / 2);
        const position = pipeRoute.pixelPath[midIndex];

        this.annotations.pipeLabels.push({
            pipeId: pipeRoute.id,
            label,
            position,
            pipeType: pipeRoute.type,
            style: ANNOTATION_CONFIG.TEXT_STYLE.PIPE
        });

        return label;
    }

    /**
     * Generate instrument tag (ISA-5.1 format)
     */
    generateInstrumentTag(instrumentType, suffix = '') {
        const typeCode = ANNOTATION_CONFIG.INSTRUMENT_TAG.TYPE_CODES[instrumentType] || 'XX';
        const loopNum = this.instrumentLoopCounter++;

        return suffix ? `${typeCode}-${loopNum}-${suffix}` : `${typeCode}-${loopNum}`;
    }

    /**
     * Add instrument tag annotation
     */
    addInstrumentTag(id, position, instrumentType, customTag = null, suffix = '') {
        const tag = customTag || this.generateInstrumentTag(instrumentType, suffix);
        const offset = ANNOTATION_CONFIG.INSTRUMENT_TAG.POSITION_OFFSET;

        this.annotations.instrumentTags.push({
            id,
            tag,
            position: {
                x: position.x + offset.x,
                y: position.y + offset.y
            },
            instrumentType,
            style: ANNOTATION_CONFIG.TEXT_STYLE.INSTRUMENT
        });

        return tag;
    }

    /**
     * Generate flow arrows along pipe path
     */
    addFlowArrows(pipeRoute) {
        const spacing = ANNOTATION_CONFIG.FLOW_ARROW.SPACING;
        const arrowSize = ANNOTATION_CONFIG.FLOW_ARROW.SIZE;
        let accumulatedLength = 0;

        for (let i = 1; i < pipeRoute.pixelPath.length; i++) {
            const start = pipeRoute.pixelPath[i - 1];
            const end = pipeRoute.pixelPath[i];

            const dx = end.x - start.x;
            const dy = end.y - start.y;
            const segmentLength = Math.sqrt(dx * dx + dy * dy);

            // Place arrows at regular intervals
            let distanceAlongSegment = spacing - (accumulatedLength % spacing);

            while (distanceAlongSegment < segmentLength) {
                const t = distanceAlongSegment / segmentLength;
                const position = {
                    x: start.x + dx * t,
                    y: start.y + dy * t
                };

                // Arrow angle (pointing in direction of flow)
                const angle = Math.atan2(dy, dx) * (180 / Math.PI);

                this.annotations.flowArrows.push({
                    pipeId: pipeRoute.id,
                    position,
                    angle,
                    size: arrowSize,
                    style: ANNOTATION_CONFIG.FLOW_ARROW.STYLE
                });

                distanceAlongSegment += spacing;
            }

            accumulatedLength += segmentLength;
        }
    }

    /**
     * Get all annotations
     */
    getAllAnnotations() {
        return {
            ...this.annotations,
            stats: {
                totalEquipmentTags: this.annotations.equipmentTags.length,
                totalPipeLabels: this.annotations.pipeLabels.length,
                totalInstrumentTags: this.annotations.instrumentTags.length,
                totalFlowArrows: this.annotations.flowArrows.length
            }
        };
    }

    /**
     * Export to SVG text elements (for frontend rendering)
     */
    exportToSVG() {
        const svgElements = [];

        // Equipment tags
        this.annotations.equipmentTags.forEach(tag => {
            svgElements.push({
                type: 'text',
                x: tag.position.x,
                y: tag.position.y,
                content: tag.tag,
                ...tag.style
            });
            if (tag.capacity) {
                svgElements.push({
                    type: 'text',
                    x: tag.position.x,
                    y: tag.position.y + 15,
                    content: tag.capacity,
                    fontSize: 10,
                    fontWeight: 'normal'
                });
            }
        });

        // Pipe labels
        this.annotations.pipeLabels.forEach(label => {
            svgElements.push({
                type: 'text',
                x: label.position.x,
                y: label.position.y - 10,
                content: label.label,
                ...label.style
            });
        });

        // Instrument tags
        this.annotations.instrumentTags.forEach(tag => {
            svgElements.push({
                type: 'text',
                x: tag.position.x,
                y: tag.position.y,
                content: tag.tag,
                ...tag.style
            });
        });

        // Flow arrows
        this.annotations.flowArrows.forEach(arrow => {
            svgElements.push({
                type: 'arrow',
                x: arrow.position.x,
                y: arrow.position.y,
                angle: arrow.angle,
                size: arrow.size,
                ...arrow.style
            });
        });

        return svgElements;
    }
}

module.exports = {
    ANNOTATION_CONFIG,
    PIDAnnotationGenerator
};
