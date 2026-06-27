// backend/services/ingress/DXFParser.js
const DxfParser = require('dxf-parser');
const fs = require('fs').promises;
const path = require('path');

/**
 * DXF Parser Service for GFDDE
 * Converts legacy P&ID drawings (DXF format) into structured data
 * for Knowledge Graph construction
 */
class DXFParserService {
    constructor() {
        this.parser = new DxfParser();

        // P&ID Symbol Classification Rules
        this.symbolPrefixes = {
            // Valves
            'SVA': 'stop_valve',
            'EVRA': 'solenoid_valve',
            'EVR': 'solenoid_valve',
            'NRVA': 'check_valve',
            'NRV': 'check_valve',
            'REG': 'regulating_valve',
            'ICS': 'pilot_valve',
            'ICM': 'pilot_valve',
            'SCV': 'stop_check_valve',
            'CVP': 'check_valve_pilot',

            // Equipment
            'COND': 'condenser',
            'EVAP': 'evaporator',
            'COMP': 'compressor',
            'RECV': 'receiver',
            'HPR': 'receiver',
            'LPS': 'separator',
            'MTS': 'separator',

            // Filters & Accessories
            'FIA': 'strainer',
            'DCL': 'filter_drier',
            'SGN': 'sight_glass',
            'SGM': 'sight_glass',

            // Instruments
            'PT': 'pressure_transmitter',
            'TT': 'temperature_transmitter',
            'FT': 'flow_transmitter',
            'LT': 'level_transmitter',
            'PI': 'pressure_indicator',
            'TI': 'temperature_indicator'
        };
    }

    /**
     * Parse DXF file and extract entities
     * @param {string} filePath - Path to DXF file
     * @returns {Promise<Object>} Parsed DXF data with categorized entities
     */
    async parseDXF(filePath) {
        try {
            console.log(`[DXF Parser] Reading file: ${filePath}`);
            const fileContent = await fs.readFile(filePath, 'utf-8');

            console.log(`[DXF Parser] Parsing DXF content...`);
            const dxf = this.parser.parseSync(fileContent);

            const extracted = {
                metadata: this.extractMetadata(dxf.header),
                blocks: this.extractBlocks(dxf.blocks),
                entities: this.extractEntities(dxf.entities),
                layers: this.extractLayers(dxf.tables?.layer),
                statistics: {}
            };

            // Calculate statistics
            extracted.statistics = {
                totalBlocks: Object.keys(extracted.blocks).length,
                totalSymbols: extracted.entities.symbols.length,
                totalLines: extracted.entities.lines.length,
                totalText: extracted.entities.text.length,
                symbolTypes: this.getSymbolTypeCounts(extracted.entities.symbols)
            };

            console.log(`[DXF Parser] ✅ Parsing complete:`, extracted.statistics);

            return extracted;

        } catch (error) {
            console.error(`[DXF Parser] ❌ Error:`, error.message);
            throw new Error(`DXF Parse Error: ${error.message}`);
        }
    }

    extractMetadata(header) {
        return {
            acadVersion: header?.$ACADVER,
            drawingUnits: header?.$INSUNITS,
            extMin: header?.$EXTMIN,
            extMax: header?.$EXTMAX,
            limMin: header?.$LIMMIN,
            limMax: header?.$LIMMAX
        };
    }

    extractBlocks(blocks) {
        const symbolBlocks = {};

        if (!blocks) return symbolBlocks;

        for (const [name, block] of Object.entries(blocks)) {
            const symbolType = this.classifySymbolType(name);

            if (symbolType !== 'unknown') {
                symbolBlocks[name] = {
                    name: name,
                    type: symbolType,
                    entities: block.entities?.length || 0,
                    basePoint: block.position,
                    layer: block.layer
                };
            }
        }

        console.log(`[DXF Parser] Found ${Object.keys(symbolBlocks).length} symbol block definitions`);
        return symbolBlocks;
    }

    extractEntities(entities) {
        const categorized = {
            lines: [],
            text: [],
            symbols: [],
            polylines: [],
            circles: [],
            arcs: []
        };

        if (!entities) return categorized;

        entities.forEach((entity, index) => {
            try {
                switch (entity.type) {
                    case 'LINE':
                        categorized.lines.push({
                            id: `line_${index}`,
                            start: entity.vertices?.[0] || { x: 0, y: 0, z: 0 },
                            end: entity.vertices?.[1] || { x: 0, y: 0, z: 0 },
                            layer: entity.layer,
                            lineType: entity.lineTypeName || 'CONTINUOUS',
                            color: entity.color
                        });
                        break;

                    case 'TEXT':
                    case 'MTEXT':
                        categorized.text.push({
                            id: `text_${index}`,
                            content: entity.text || '',
                            position: entity.startPoint || entity.position || { x: 0, y: 0, z: 0 },
                            height: entity.textHeight || 2.5,
                            rotation: entity.rotation || 0,
                            layer: entity.layer,
                            style: entity.styleName
                        });
                        break;

                    case 'INSERT':
                        // Symbol instance (valve, equipment, etc.)
                        const symbolType = this.classifySymbolType(entity.name);
                        categorized.symbols.push({
                            id: `symbol_${index}`,
                            blockName: entity.name,
                            type: symbolType,
                            position: entity.position || { x: 0, y: 0, z: 0 },
                            rotation: entity.rotation || 0,
                            scale: entity.scale || { x: 1, y: 1, z: 1 },
                            layer: entity.layer
                        });
                        break;

                    case 'POLYLINE':
                    case 'LWPOLYLINE':
                        categorized.polylines.push({
                            id: `polyline_${index}`,
                            vertices: entity.vertices || [],
                            closed: entity.shape || false,
                            layer: entity.layer,
                            lineType: entity.lineTypeName
                        });
                        break;

                    case 'CIRCLE':
                        categorized.circles.push({
                            id: `circle_${index}`,
                            center: entity.center || { x: 0, y: 0, z: 0 },
                            radius: entity.radius || 1,
                            layer: entity.layer
                        });
                        break;

                    case 'ARC':
                        categorized.arcs.push({
                            id: `arc_${index}`,
                            center: entity.center || { x: 0, y: 0, z: 0 },
                            radius: entity.radius || 1,
                            startAngle: entity.startAngle || 0,
                            endAngle: entity.endAngle || 360,
                            layer: entity.layer
                        });
                        break;
                }
            } catch (err) {
                console.warn(`[DXF Parser] Warning: Failed to process entity ${index}:`, err.message);
            }
        });

        return categorized;
    }

    extractLayers(layerTable) {
        const layers = {};

        if (!layerTable) return layers;

        for (const [name, layer] of Object.entries(layerTable)) {
            layers[name] = {
                name: name,
                color: layer.color,
                lineType: layer.lineTypeName,
                frozen: layer.frozen,
                visible: !layer.frozen
            };
        }

        return layers;
    }

    classifySymbolType(blockName) {
        if (!blockName) return 'unknown';

        const upper = blockName.toUpperCase().trim();

        // Check against known prefixes
        for (const [prefix, type] of Object.entries(this.symbolPrefixes)) {
            if (upper.startsWith(prefix) || upper.includes(prefix)) {
                return type;
            }
        }

        return 'unknown';
    }

    getSymbolTypeCounts(symbols) {
        const counts = {};

        symbols.forEach(symbol => {
            const type = symbol.type;
            counts[type] = (counts[type] || 0) + 1;
        });

        return counts;
    }

    /**
     * Export parsed data to JSON file
     */
    async exportToJSON(parsedData, outputPath) {
        try {
            await fs.writeFile(
                outputPath,
                JSON.stringify(parsedData, null, 2),
                'utf-8'
            );
            console.log(`[DXF Parser] Exported to: ${outputPath}`);
        } catch (error) {
            throw new Error(`Export Error: ${error.message}`);
        }
    }
}

module.exports = new DXFParserService();
