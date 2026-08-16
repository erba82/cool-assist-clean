/**
 * Professional P&ID Layout Engine
 * Grid-based intelligent positioning with collision detection
 * Following ISO 10628 spacing standards
 */

// ===== GRID CONFIGURATION =====
const GRID_CONFIG = {
    // Grid unit size (pixels) - Reduced for tighter layout
    UNIT: 40,
    // Canvas dimensions
    CANVAS: {
        WIDTH: 2000,
        HEIGHT: 1800,
        MARGIN: 100
    },
    // Equipment zones (row-based layout) - Tightened
    ZONES: {
        CONDENSER: { row: 2, colStart: 6, colEnd: 12 },
        RECEIVER_HP: { row: 4, colStart: 8, colEnd: 12 },
        RECEIVER_LP: { row: 10, colStart: 5, colEnd: 8 },
        COMPRESSOR: { row: 7, colStart: 2, colEnd: 5 },
        EVAPORATOR: { row: 13, colStart: 2, colEnd: 20 },
        INSTRUMENT: { row: 0, colStart: 0, colEnd: 25 }
    },
    // Minimum spacing between components (in grid units) - Tightened
    SPACING: {
        EQUIPMENT: 2,
        VALVE: 1,
        INSTRUMENT: 1,
        PIPE: 1
    },    // Component sizes (in grid units) - for collision detection
    SIZES: {
        COMPRESSOR: { width: 3, height: 2 },
        CONDENSER: { width: 4, height: 3 },
        RECEIVER_H: { width: 3, height: 2 },  // Horizontal
        RECEIVER_V: { width: 2, height: 3 },  // Vertical
        EVAPORATOR: { width: 3, height: 2 },
        VALVE: { width: 1, height: 1 },
        INSTRUMENT: { width: 1, height: 1 }
    },

    // Flow direcion (for auto-routing)
    FLOW_DIRECTION: {
        DISCHARGE: 'UP',      // Hot gas flows upward
        LIQUID: 'DOWN',       // Liquid flows downward
        SUCTION: 'UP_LEFT'    // Suction flows up and left
    }
};

/**
 * Layout Manager - Tracks occupied grid cells
 */
class GridLayoutManager {
    constructor() {
        // Grid cell occupation map: grid[row][col] = componentId | null
        this.grid = Array(100).fill(null).map(() => Array(100).fill(null));
        // Placed components registry
        this.components = {};
    }

    /**
     * Convert grid coordinates to pixel position
     */
    gridToPixel(row, col) {
        return {
            x: GRID_CONFIG.CANVAS.MARGIN + col * GRID_CONFIG.UNIT,
            y: GRID_CONFIG.CANVAS.MARGIN + row * GRID_CONFIG.UNIT
        };
    }

    /**
     * Check if a grid region is available
     */
    isAvailable(row, col, width, height) {
        for (let r = row; r < row + height; r++) {
            for (let c = col; c < col + width; c++) {
                if (r < 0 || r >= 100 || c < 0 || c >= 100) return false;
                if (this.grid[r][c] !== null) return false;
            }
        }
        return true;
    }

    /**
     * Reserve grid cells for a component
     */
    occupy(id, row, col, width, height) {
        for (let r = row; r < row + height; r++) {
            for (let c = col; c < col + width; c++) {
                this.grid[r][c] = id;
            }
        }

        this.components[id] = {
            row, col, width, height,
            pixel: this.gridToPixel(row, col)
        };
    }

    /**
     * Find next available position in a zone
     * Returns { row, col } or null if no space
     */
    findAvailableInZone(zone, width, height, spacing = GRID_CONFIG.SPACING.EQUIPMENT) {
        const totalWidth = width + spacing;
        const totalHeight = height + spacing;

        // Scan zone from left to right, top to bottom
        for (let col = zone.colStart; col <= zone.colEnd - width; col += 1) {
            for (let row = zone.row; row <= zone.row + 3; row++) {  // Allow 3 rows vertical flexibility
                if (this.isAvailable(row, col, totalWidth, totalHeight)) {
                    return { row, col };
                }
            }
        }

        return null;  // No space found
    }

    /**
     * Place component at specific grid position
     */
    placeComponent(id, type, row, col, customSize = null) {
        const size = customSize || GRID_CONFIG.SIZES[type.toUpperCase()] || { width: 2, height: 2 };

        if (!this.isAvailable(row, col, size.width, size.height)) {
            console.warn(`⚠️ Grid collision at (${row}, ${col}) for ${id}`);
            // Auto-shift to nearest available
            const shifted = this.findNearestAvailable(row, col, size.width, size.height);
            if (shifted) {
                row = shifted.row;
                col = shifted.col;
                console.log(`   → Auto-shifted to (${row}, ${col})`);
            }
        }

        this.occupy(id, row, col, size.width, size.height);
        return this.components[id].pixel;
    }

    /**
     * Find nearest available position (spiral search)
     */
    findNearestAvailable(startRow, startCol, width, height) {
        const maxRadius = 10;

        for (let radius = 1; radius <= maxRadius; radius++) {
            // Check positions in expanding square
            for (let dRow = -radius; dRow <= radius; dRow++) {
                for (let dCol = -radius; dCol <= radius; dCol++) {
                    const row = startRow + dRow;
                    const col = startCol + dCol;
                    if (this.isAvailable(row, col, width, height)) {
                        return { row, col };
                    }
                }
            }
        }

        return null;
    }

    /**
     * Auto-place component in its designated zone
     */
    autoPlace(id, componentType, zone) {
        const size = GRID_CONFIG.SIZES[componentType.toUpperCase()] || { width: 2, height: 2 };
        const position = this.findAvailableInZone(GRID_CONFIG.ZONES[zone], size.width, size.height);

        if (position) {
            return this.placeComponent(id, componentType, position.row, position.col);
        } else {
            console.error(`❌ No space in zone ${zone} for ${id}`);
            // Fallback to first available anywhere
            const fallback = this.findNearestAvailable(GRID_CONFIG.ZONES[zone].row, GRID_CONFIG.ZONES[zone].colStart, size.width, size.height);
            if (fallback) {
                return this.placeComponent(id, componentType, fallback.row, fallback.col);
            }
        }

        // Last resort - use specified zone default
        return this.gridToPixel(GRID_CONFIG.ZONES[zone].row, GRID_CONFIG.ZONES[zone].colStart);
    }
}

/**
 * Equipment Positioning Helper
 * Uses GridLayoutManager to place equipment intelligently
 */
class EquipmentPositioner {
    constructor() {
        this.layout = new GridLayoutManager();
        this.placements = [];
    }

    /**
     * Place condenser (top zone)
     */
    placeCondenser(id, data) {
        const pos = this.layout.autoPlace(id, 'CONDENSER', 'CONDENSER');
        this.placements.push({ id, type: 'condenser', position: pos, data });
        return { id, position: pos };
    }

    /**
     * Place receiver (high or low pressure)
     */
    placeReceiver(id, data, pressureLevel = 'HP') {
        const zone = pressureLevel === 'HP' ? 'RECEIVER_HP' : 'RECEIVER_LP';
        const pos = this.layout.autoPlace(id, 'RECEIVER_H', zone);
        this.placements.push({ id, type: 'receiver', position: pos, data });
        return { id, position: pos };
    }

    /**
     * Place compressor (middle-left zone)
     */
    placeCompressor(id, data, index = 0) {
        // Stack compressors vertically if multiple
        const zone = GRID_CONFIG.ZONES.COMPRESSOR;
        const row = zone.row + index * 3;  // 3 grid units spacing
        const col = zone.colStart;

        const pos = this.layout.placeComponent(id, 'COMPRESSOR', row, col);
        this.placements.push({ id, type: 'compressor', position: pos, data });
        return { id, position: pos };
    }

    /**
     * Place evaporator (bottom zone, spread horizontally)
     */
    placeEvaporator(id, data, index = 0, total = 1) {
        const zone = GRID_CONFIG.ZONES.EVAPORATOR;
        const spacing = (zone.colEnd - zone.colStart) / total;
        const col = zone.colStart + Math.floor(index * spacing);

        const pos = this.layout.placeComponent(id, 'EVAPORATOR', zone.row, col);
        this.placements.push({ id, type: 'evaporator', position: pos, data });
        return { id, position: pos };
    }

    /**
     * Place valve near equipment
     */
    placeValve(id, data, nearEquipmentId, offset = { row: 0, col: 2 }) {
        const equipment = this.layout.components[nearEquipmentId];
        if (!equipment) {
            console.warn(`Equipment ${nearEquipmentId} not found for valve placement`);
            return this.layout.gridToPixel(10, 10);  // Fallback
        }

        const row = equipment.row + offset.row;
        const col = equipment.col + offset.col;
        const pos = this.layout.placeComponent(id, 'VALVE', row, col);
        this.placements.push({ id, type: 'valve', position: pos, data });
        return { id, position: pos };
    }

    /**
     * Place instrument near equipment
     */
    placeInstrument(id, data, nearEquipmentId, offset = { row: -2, col: 1 }) {
        const equipment = this.layout.components[nearEquipmentId];
        if (!equipment) {
            console.warn(`Equipment ${nearEquipmentId} not found for instrument placement`);
            return this.layout.gridToPixel(1, 1);
        }

        const row = equipment.row + offset.row;
        const col = equipment.col + offset.col;
        const pos = this.layout.placeComponent(id, 'INSTRUMENT', row, col);
        this.placements.push({ id, type: 'instrument', position: pos, data });
        return { id, position: pos };
    }

    /**
     * Get all placements for review
     */
    getAllPlacements() {
        return {
            placements: this.placements,
            gridState: this.layout.grid,
            stats: {
                totalComponents: this.placements.length,
                byType: this.placements.reduce((acc, p) => {
                    acc[p.type] = (acc[p.type] || 0) + 1;
                    return acc;
                }, {})
            }
        };
    }
}

module.exports = {
    GRID_CONFIG,
    GridLayoutManager,
    EquipmentPositioner
};
