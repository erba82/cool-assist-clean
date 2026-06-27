/**
 * Orthogonal Pipe Routing Algorithm for P&ID
 * Based on A* pathfinding with ISO 10628 compliance
 * 
 * Features:
 * - Orthogonal routing (horizontal + vertical only)
 * - Obstacle avoidance (equipment bounds)
 * - Elbow generation at corners
 * - Pipe bundling for parallel lines
 * - DN pipe sizing integration
 */

const { GRID_CONFIG } = require('./PIDLayoutEngine');

// ===== PIPE ROUTING CONFIGURATION =====
const ROUTING_CONFIG = {
    // Grid-based routing (aligned to layout grid)
    GRID_UNIT: GRID_CONFIG.UNIT,

    // Routing modes
    MODE: {
        ORTHOGONAL: 'orthogonal',      // H+V only (ISO standard)
        MANHATTAN: 'manhattan',         // 90° angles
        DIRECT: 'direct'                // Straight line (for short connections)
    },

    // Pipe spacing for bundling
    BUNDLE_SPACING: 0.3,  // Grid units between parallel pipes

    // Cost weights for A* algorithm
    WEIGHTS: {
        DISTANCE: 1.0,        // Cost per grid unit
        TURN: 2.0,            // Cost for 90° turn
        CROSSING: 5.0,        // Cost for crossing another pipe
        OBSTACLE: 999         // Blocked cell
    },

    // Elbow configuration
    ELBOW: {
        MIN_LENGTH: 0.5,      // Minimum straight segment before elbow (grid units)
        RADIUS_FACTOR: 1.5    // Elbow radius = pipe_diameter * factor
    }
};

// ===== DIRECTION VECTORS =====
const DIRECTIONS = {
    UP: { dx: 0, dy: -1, name: 'UP' },
    DOWN: { dx: 0, dy: 1, name: 'DOWN' },
    LEFT: { dx: -1, dy: 0, name: 'LEFT' },
    RIGHT: { dx: 1, dy: 0, name: 'RIGHT' }
};

/**
 * A* Node for pathfinding
 */
class PathNode {
    constructor(row, col, g = 0, h = 0, parent = null, direction = null) {
        this.row = row;
        this.col = col;
        this.g = g;  // Cost from start
        this.h = h;  // Heuristic to goal
        this.f = g + h;  // Total cost
        this.parent = parent;
        this.direction = direction;
    }

    get key() {
        return `${this.row},${this.col}`;
    }
}

/**
 * Orthogonal Pipe Router - A* pathfinding
 */
class OrthogonalPipeRouter {
    constructor(gridLayoutManager) {
        this.grid = gridLayoutManager;
        this.routes = [];  // All calculated routes
    }

    /**
     * Manhattan distance heuristic
     */
    heuristic(row1, col1, row2, col2) {
        return Math.abs(row2 - row1) + Math.abs(col2 - col1);
    }

    /**
     * Check if grid cell is walkable
     */
    isWalkable(row, col) {
        if (row < 0 || row >= 100 || col < 0 || col >= 100) return false;

        // Check if occupied by equipment (not walkable)
        const occupant = this.grid.grid[row][col];
        if (occupant && occupant.startsWith('node-')) {
            return false;  // Equipment blocks pipes
        }

        return true;  // Pipes can cross other pipes
    }

    /**
     * Calculate turn cost (penalize direction changes)
     */
    getTurnCost(currentDir, newDir) {
        if (!currentDir) return 0;
        if (currentDir.name === newDir.name) return 0;
        return ROUTING_CONFIG.WEIGHTS.TURN;
    }

    /**
     * A* pathfinding - find orthogonal route
     */
    findPath(startRow, startCol, endRow, endCol) {
        const openSet = new Map();  // key -> PathNode
        const closedSet = new Set();

        const startNode = new PathNode(
            startRow, startCol,
            0,
            this.heuristic(startRow, startCol, endRow, endCol)
        );
        openSet.set(startNode.key, startNode);

        while (openSet.size > 0) {
            // Get node with lowest f score
            let current = null;
            let lowestF = Infinity;
            for (const node of openSet.values()) {
                if (node.f < lowestF) {
                    lowestF = node.f;
                    current = node;
                }
            }

            // Reached goal
            if (current.row === endRow && current.col === endCol) {
                return this.reconstructPath(current);
            }

            openSet.delete(current.key);
            closedSet.add(current.key);

            // Explore neighbors (4 orthogonal directions)
            for (const dir of Object.values(DIRECTIONS)) {
                const newRow = current.row + dir.dy;
                const newCol = current.col + dir.dx;
                const key = `${newRow},${newCol}`;

                if (closedSet.has(key)) continue;
                if (!this.isWalkable(newRow, newCol)) continue;

                const turnCost = this.getTurnCost(current.direction, dir);
                const g = current.g + ROUTING_CONFIG.WEIGHTS.DISTANCE + turnCost;
                const h = this.heuristic(newRow, newCol, endRow, endCol);

                const neighbor = new PathNode(newRow, newCol, g, h, current, dir);

                const existing = openSet.get(key);
                if (!existing || g < existing.g) {
                    openSet.set(key, neighbor);
                }
            }
        }

        // No path found - use direct line as fallback
        console.warn(`⚠️ No orthogonal path found from (${startRow},${startCol}) to (${endRow},${endCol}), using direct line`);
        return [[startRow, startCol], [endRow, endCol]];
    }

    /**
     * Reconstruct path from A* result
     */
    reconstructPath(endNode) {
        const path = [];
        let current = endNode;

        while (current) {
            path.unshift([current.row, current.col]);
            current = current.parent;
        }

        return path;
    }

    /**
     * Simplify path - remove redundant intermediate points
     * Keep only points where direction changes
     */
    simplifyPath(path) {
        if (path.length <= 2) return path;

        const simplified = [path[0]];

        for (let i = 1; i < path.length - 1; i++) {
            const prev = path[i - 1];
            const curr = path[i];
            const next = path[i + 1];

            // Direction from prev to curr
            const dir1 = [curr[0] - prev[0], curr[1] - prev[1]];
            // Direction from curr to next
            const dir2 = [next[0] - curr[0], next[1] - curr[1]];

            // If direction changes, keep this point (it's a corner)
            if (dir1[0] !== dir2[0] || dir1[1] !== dir2[1]) {
                simplified.push(curr);
            }
        }

        simplified.push(path[path.length - 1]);
        return simplified;
    }

    /**
     * Convert grid path to pixel coordinates
     */
    pathToPixels(gridPath) {
        return gridPath.map(([row, col]) => this.grid.gridToPixel(row, col));
    }

    /**
     * Route a pipe between two equipment nodes
     */
    routePipe(fromEquipmentId, toEquipmentId, pipeType = 'discharge') {
        const fromEquip = this.grid.components[fromEquipmentId];
        const toEquip = this.grid.components[toEquipmentId];

        if (!fromEquip || !toEquip) {
            console.error(`Cannot route pipe: equipment not found`);
            return null;
        }

        // Start at edge of source equipment (exit point)
        const startRow = fromEquip.row + Math.floor(fromEquip.height / 2);
        const startCol = fromEquip.col + fromEquip.width;

        // End at edge of target equipment (entry point)
        const endRow = toEquip.row + Math.floor(toEquip.height / 2);
        const endCol = toEquip.col;

        // Find orthogonal path
        const gridPath = this.findPath(startRow, startCol, endRow, endCol);
        const simplifiedPath = this.simplifyPath(gridPath);
        const pixelPath = this.pathToPixels(simplifiedPath);

        // Generate elbows at corners
        const elbows = this.generateElbows(simplifiedPath);

        const route = {
            id: `pipe-${fromEquipmentId}-${toEquipmentId}`,
            from: fromEquipmentId,
            to: toEquipmentId,
            type: pipeType,
            gridPath: simplifiedPath,
            pixelPath: pixelPath,
            elbows: elbows,
            length: this.calculateLength(simplifiedPath)
        };

        this.routes.push(route);
        return route;
    }

    /**
     * Generate elbow positions at path corners
     */
    generateElbows(gridPath) {
        const elbows = [];

        for (let i = 1; i < gridPath.length - 1; i++) {
            const prev = gridPath[i - 1];
            const curr = gridPath[i];
            const next = gridPath[i + 1];

            // Check if this is a corner (direction change)
            const dir1 = [curr[0] - prev[0], curr[1] - prev[1]];
            const dir2 = [next[0] - curr[0], next[1] - curr[1]];

            if (dir1[0] !== dir2[0] || dir1[1] !== dir2[1]) {
                const pixelPos = this.grid.gridToPixel(curr[0], curr[1]);

                // Determine elbow angle
                let rotation = 0;
                if (dir1[0] === 0 && dir1[1] < 0 && dir2[0] > 0 && dir2[1] === 0) rotation = 0;       // UP→RIGHT
                else if (dir1[0] === 0 && dir1[1] < 0 && dir2[0] < 0 && dir2[1] === 0) rotation = 90;  // UP→LEFT
                else if (dir1[0] === 0 && dir1[1] > 0 && dir2[0] > 0 && dir2[1] === 0) rotation = 270; // DOWN→RIGHT
                else if (dir1[0] === 0 && dir1[1] > 0 && dir2[0] < 0 && dir2[1] === 0) rotation = 180; // DOWN→LEFT
                else if (dir1[0] < 0 && dir1[1] === 0 && dir2[0] === 0 && dir2[1] > 0) rotation = 270; // LEFT→DOWN
                else if (dir1[0] < 0 && dir1[1] === 0 && dir2[0] === 0 && dir2[1] < 0) rotation = 0;   // LEFT→UP
                else if (dir1[0] > 0 && dir1[1] === 0 && dir2[0] === 0 && dir2[1] > 0) rotation = 180; // RIGHT→DOWN
                else if (dir1[0] > 0 && dir1[1] === 0 && dir2[0] === 0 && dir2[1] < 0) rotation = 90;  // RIGHT→UP

                elbows.push({
                    position: pixelPos,
                    rotation: rotation,
                    gridPos: [curr[0], curr[1]]
                });
            }
        }

        return elbows;
    }

    /**
     * Calculate total pipe length (in grid units)
     */
    calculateLength(gridPath) {
        let length = 0;
        for (let i = 1; i < gridPath.length; i++) {
            const [r1, c1] = gridPath[i - 1];
            const [r2, c2] = gridPath[i];
            length += Math.abs(r2 - r1) + Math.abs(c2 - c1);
        }
        return length * ROUTING_CONFIG.GRID_UNIT;  // Convert to pixels
    }

    /**
     * Get all routes
     */
    getAllRoutes() {
        return {
            routes: this.routes,
            totalLength: this.routes.reduce((sum, r) => sum + r.length, 0),
            stats: {
                totalRoutes: this.routes.length,
                byType: this.routes.reduce((acc, r) => {
                    acc[r.type] = (acc[r.type] || 0) + 1;
                    return acc;
                }, {})
            }
        };
    }
}

module.exports = {
    ROUTING_CONFIG,
    OrthogonalPipeRouter
};
