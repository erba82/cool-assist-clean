/**
 * SVG Symbol Library for P&ID Diagrams
 * ISO 14617 Compliant Symbols
 * Pure SVG vector graphics for professional CAD-compatible output
 */

class SVGSymbolLibrary {
    constructor() {
        this.symbols = this.initializeSymbols();
    }

    initializeSymbols() {
        return {
            // ============================================================
            // EQUIPMENT - ISO 14617-6
            // ============================================================

            'compressor_reciprocating': {
                id: 'compressor_reciprocating',
                name: 'Reciprocating Compressor',
                category: 'equipment',
                standard: 'ISO 14617-6',
                width: 60,
                height: 60,
                svg: `
                    <g id="compressor_reciprocating">
                        <circle cx="30" cy="30" r="25" stroke="black" stroke-width="2" fill="none"/>
                        <path d="M 15,20 L 30,30 L 15,40" stroke="black" stroke-width="2" fill="none"/>
                        <path d="M 30,30 L 45,20 M 30,30 L 45,40" stroke="black" stroke-width="2" fill="none"/>
                    </g>
                `,
                connectionPoints: [
                    { id: 'suction', x: 5, y: 30, direction: 'left', type: 'inlet' },
                    { id: 'discharge', x: 55, y: 30, direction: 'right', type: 'outlet' }
                ]
            },

            'compressor_screw': {
                id: 'compressor_screw',
                name: 'Screw Compressor',
                category: 'equipment',
                standard: 'ISO 14617-6',
                width: 60,
                height: 60,
                svg: `
                    <g id="compressor_screw">
                        <circle cx="30" cy="30" r="25" stroke="black" stroke-width="2" fill="none"/>
                        <path d="M 20,15 Q 25,25 20,35 M 25,15 Q 30,25 25,35 M 30,15 Q 35,25 30,35 M 35,15 Q 40,25 35,35" 
                              stroke="black" stroke-width="1.5" fill="none"/>
                    </g>
                `,
                connectionPoints: [
                    { id: 'suction', x: 5, y: 30, direction: 'left', type: 'inlet' },
                    { id: 'discharge', x: 55, y: 30, direction: 'right', type: 'outlet' }
                ]
            },

            'heat_exchanger_shell_tube': {
                id: 'heat_exchanger_shell_tube',
                name: 'Shell & Tube Heat Exchanger',
                category: 'equipment',
                standard: 'ISO 14617-6',
                width: 80,
                height: 50,
                svg: `
                    <g id="heat_exchanger_shell_tube">
                        <ellipse cx="40" cy="25" rx="35" ry="20" stroke="black" stroke-width="2" fill="none"/>
                        <line x1="10" y1="10" x2="70" y2="10" stroke="black" stroke-width="1.5"/>
                        <line x1="10" y1="15" x2="70" y2="15" stroke="black" stroke-width="1.5"/>
                        <line x1="10" y1="20" x2="70" y2="20" stroke="black" stroke-width="1.5"/>
                        <line x1="10" y1="30" x2="70" y2="30" stroke="black" stroke-width="1.5"/>
                        <line x1="10" y1="35" x2="70" y2="35" stroke="black" stroke-width="1.5"/>
                        <line x1="10" y1="40" x2="70" y2="40" stroke="black" stroke-width="1.5"/>
                    </g>
                `,
                connectionPoints: [
                    { id: 'shell_in', x: 0, y: 25, direction: 'left', type: 'inlet' },
                    { id: 'shell_out', x: 80, y: 25, direction: 'right', type: 'outlet' },
                    { id: 'tube_in', x: 40, y: 0, direction: 'top', type: 'inlet' },
                    { id: 'tube_out', x: 40, y: 50, direction: 'bottom', type: 'outlet' }
                ]
            },

            'evaporator': {
                id: 'evaporator',
                name: 'Evaporator',
                category: 'equipment',
                standard: 'ISO 14617-6',
                width: 70,
                height: 50,
                svg: `
                    <g id="evaporator">
                        <rect x="5" y="10" width="60" height="30" stroke="black" stroke-width="2" fill="none"/>
                        <path d="M 10,15 Q 15,20 10,25 M 15,15 Q 20,20 15,25 M 20,15 Q 25,20 20,25 
                                 M 30,15 Q 35,20 30,25 M 35,15 Q 40,20 35,25 M 40,15 Q 45,20 40,25
                                 M 50,15 Q 55,20 50,25 M 55,15 Q 60,20 55,25" 
                              stroke="black" stroke-width="1" fill="none"/>
                        <text x="35" y="48" font-size="10" text-anchor="middle" font-family="Arial">EVP</text>
                    </g>
                `,
                connectionPoints: [
                    { id: 'inlet', x: 0, y: 25, direction: 'left', type: 'inlet' },
                    { id: 'outlet', x: 70, y: 25, direction: 'right', type: 'outlet' }
                ]
            },

            'condenser': {
                id: 'condenser',
                name: 'Condenser',
                category: 'equipment',
                standard: 'ISO 14617-6',
                width: 70,
                height: 50,
                svg: `
                    <g id="condenser">
                        <rect x="5" y="10" width="60" height="30" stroke="black" stroke-width="2" fill="none"/>
                        <line x1="10" y1="15" x2="10" y2="35" stroke="black" stroke-width="1.5"/>
                        <line x1="15" y1="15" x2="15" y2="35" stroke="black" stroke-width="1.5"/>
                        <line x1="20" y1="15" x2="20" y2="35" stroke="black" stroke-width="1.5"/>
                        <line x1="30" y1="15" x2="30" y2="35" stroke="black" stroke-width="1.5"/>
                        <line x1="40" y1="15" x2="40" y2="35" stroke="black" stroke-width="1.5"/>
                        <line x1="50" y1="15" x2="50" y2="35" stroke="black" stroke-width="1.5"/>
                        <line x1="55" y1="15" x2="55" y2="35" stroke="black" stroke-width="1.5"/>
                        <line x1="60" y1="15" x2="60" y2="35" stroke="black" stroke-width="1.5"/>
                        <text x="35" y="48" font-size="10" text-anchor="middle" font-family="Arial">COND</text>
                    </g>
                `,
                connectionPoints: [
                    { id: 'inlet', x: 0, y: 25, direction: 'left', type: 'inlet' },
                    { id: 'outlet', x: 70, y: 25, direction: 'right', type: 'outlet' }
                ]
            },

            'vessel_horizontal': {
                id: 'vessel_horizontal',
                name: 'Horizontal Vessel',
                category: 'equipment',
                standard: 'ISO 14617-6',
                width: 80,
                height: 50,
                svg: `
                    <g id="vessel_horizontal">
                        <ellipse cx="40" cy="25" rx="38" ry="23" stroke="black" stroke-width="2" fill="none"/>
                        <line x1="2" y1="25" x2="78" y2="25" stroke="black" stroke-width="1" stroke-dasharray="3,3"/>
                    </g>
                `,
                connectionPoints: [
                    { id: 'top', x: 40, y: 0, direction: 'top', type: 'outlet' },
                    { id: 'bottom', x: 40, y: 50, direction: 'bottom', type: 'inlet' },
                    { id: 'left', x: 0, y: 25, direction: 'left', type: 'inlet' },
                    { id: 'right', x: 80, y: 25, direction: 'right', type: 'outlet' }
                ]
            },

            // ============================================================
            // VALVES - ISO 14617-7
            // ============================================================

            'valve_manual': {
                id: 'valve_manual',
                name: 'Manual Valve',
                category: 'valves',
                standard: 'ISO 14617-7',
                width: 40,
                height: 40,
                svg: `
                    <g id="valve_manual">
                        <path d="M 0,20 L 20,0 L 40,20 L 20,40 Z" stroke="black" stroke-width="2" fill="none"/> 
                        <line x1="20" y1="-10" x2="20" y2="0" stroke="black" stroke-width="2"/>
                        <circle cx="20" cy="-15" r="3" stroke="black" stroke-width="1.5" fill="none"/>
                    </g>
                `,
                connectionPoints: [
                    { id: 'inlet', x: 0, y: 20, direction: 'left', type: 'inlet' },
                    { id: 'outlet', x: 40, y: 20, direction: 'right', type: 'outlet' }
                ]
            },

            'valve_check': {
                id: 'valve_check',
                name: 'Check Valve',
                category: 'valves',
                standard: 'ISO 14617-7',
                width: 40,
                height: 40,
                svg: `
                    <g id="valve_check">
                        <path d="M 0,20 L 20,0 L 40,20 L 20,40 Z" stroke="black" stroke-width="2" fill="none"/>
                        <circle cx="20" cy="20" r="8" stroke="black" stroke-width="1.5" fill="none"/>
                        <path d="M 12,20 L 20,12 L 28,20" stroke="black" stroke-width="2" fill="none"/>
                    </g>
                `,
                connectionPoints: [
                    { id: 'inlet', x: 0, y: 20, direction: 'left', type: 'inlet' },
                    { id: 'outlet', x: 40, y: 20, direction: 'right', type: 'outlet' }
                ]
            },

            'valve_relief': {
                id: 'valve_relief',
                name: 'Relief Valve',
                category: 'valves',
                standard: 'ISO 14617-7',
                width: 40,
                height: 50,
                svg: `
                    <g id="valve_relief">
                        <path d="M 0,25 L 20,5 L 40,25 L 20,45 Z" stroke="black" stroke-width="2" fill="none"/>
                        <path d="M 20,5 L 20,-5 M 15,-5 L 25,-5 M 17,-2 L 23,-2" stroke="black" stroke-width="2"/>
                        <text x="20" y="58" font-size="8" text-anchor="middle" font-family="Arial">PRV</text>
                    </g>
                `,
                connectionPoints: [
                    { id: 'inlet', x: 0, y: 25, direction: 'left', type: 'inlet' },
                    { id: 'outlet', x: 40, y: 25, direction: 'right', type: 'outlet' },
                    { id: 'relief', x: 20, y: 0, direction: 'top', type: 'outlet' }
                ]
            },

            'valve_solenoid': {
                id: 'valve_solenoid',
                name: 'Solenoid Valve',
                category: 'valves',
                standard: 'ISO 14617-7',
                width: 40,
                height: 45,
                svg: `
                    <g id="valve_solenoid">
                        <path d="M 0,25 L 20,5 L 40,25 L 20,45 Z" stroke="black" stroke-width="2" fill="none"/>
                        <rect x="15" y="-8" width="10" height="12" stroke="black" stroke-width="1.5" fill="none"/>
                        <line x1="20" y1="4" x2="20" y2="5" stroke="black" stroke-width="2"/>
                    </g>
                `,
                connectionPoints: [
                    { id: 'inlet', x: 0, y: 25, direction: 'left', type: 'inlet' },
                    { id: 'outlet', x: 40, y: 25, direction: 'right', type: 'outlet' }
                ]
            },

            'valve_expansion': {
                id: 'valve_expansion',
                name: 'Expansion Valve',
                category: 'valves',
                standard: 'ISO 14617-7',
                width: 40,
                height: 50,
                svg: `
                    <g id="valve_expansion">
                        <path d="M 0,25 L 20,5 L 40,25 L 20,45 Z" stroke="black" stroke-width="2" fill="none"/>
                        <path d="M 10,25 L 20,15 L 30,25 L 20,35 Z" stroke="black" stroke-width="1.5" fill="white"/>
                        <text x="20" y="58" font-size="8" text-anchor="middle" font-family="Arial">TXV</text>
                    </g>
                `,
                connectionPoints: [
                    { id: 'inlet', x: 0, y: 25, direction: 'left', type: 'inlet' },
                    { id: 'outlet', x: 40, y: 25, direction: 'right', type: 'outlet' }
                ]
            },

            // ============================================================
            // INSTRUMENTS - ISO 14617-13
            // ============================================================

            'temperature_sensor': {
                id: 'temperature_sensor',
                name: 'Temperature Sensor',
                category: 'instruments',
                standard: 'ISO 14617-13',
                width: 30,
                height: 30,
                svg: `
                    <g id="temperature_sensor">
                        <circle cx="15" cy="15" r="13" stroke="black" stroke-width="2" fill="none"/>
                        <text x="15" y="20" font-size="12" text-anchor="middle" font-family="Arial" font-weight="bold">T</text>
                    </g>
                `,
                connectionPoints: [
                    { id: 'process', x: 15, y: 30, direction: 'bottom', type: 'measurement' }
                ]
            },

            'pressure_sensor': {
                id: 'pressure_sensor',
                name: 'Pressure Sensor',
                category: 'instruments',
                standard: 'ISO 14617-13',
                width: 30,
                height: 30,
                svg: `
                    <g id="pressure_sensor">
                        <circle cx="15" cy="15" r="13" stroke="black" stroke-width="2" fill="none"/>
                        <text x="15" y="20" font-size="12" text-anchor="middle" font-family="Arial" font-weight="bold">P</text>
                    </g>
                `,
                connectionPoints: [
                    { id: 'process', x: 15, y: 30, direction: 'bottom', type: 'measurement' }
                ]
            },

            'level_sensor': {
                id: 'level_sensor',
                name: 'Level Sensor',
                category: 'instruments',
                standard: 'ISO 14617-13',
                width: 30,
                height: 30,
                svg: `
                    <g id="level_sensor">
                        <circle cx="15" cy="15" r="13" stroke="black" stroke-width="2" fill="none"/>
                        <text x="15" y="20" font-size="12" text-anchor="middle" font-family="Arial" font-weight="bold">L</text>
                    </g>
                `,
                connectionPoints: [
                    { id: 'process', x: 15, y: 30, direction: 'bottom', type: 'measurement' }
                ]
            },

            'flow_meter': {
                id: 'flow_meter',
                name: 'Flow Meter',
                category: 'instruments',
                standard: 'ISO 14617-13',
                width: 40,
                height: 40,
                svg: `
                    <g id="flow_meter">
                        <circle cx="20" cy="20" r="18" stroke="black" stroke-width="2" fill="none"/>
                        <text x="20" y="25" font-size="14" text-anchor="middle" font-family="Arial" font-weight="bold">F</text>
                        <path d="M 10,20 L 30,20" stroke="black" stroke-width="1.5"/>
                        <path d="M 26,16 L 30,20 L 26,24" stroke="black" stroke-width="1.5" fill="none"/>
                    </g>
                `,
                connectionPoints: [
                    { id: 'inlet', x: 0, y: 20, direction: 'left', type: 'inlet' },
                    { id: 'outlet', x: 40, y: 20, direction: 'right', type: 'outlet' }
                ]
            },

            // ============================================================
            // PIPING COMPONENTS
            // ============================================================

            'pipe_horizontal': {
                id: 'pipe_horizontal',
                name: 'Horizontal Pipe',
                category: 'piping',
                width: 100,
                height: 4,
                svg: `
                    <line x1="0" y1="2" x2="100" y2="2" stroke="black" stroke-width="3"/>
                `,
                connectionPoints: [
                    { id: 'start', x: 0, y: 2, direction: 'left', type: 'connection' },
                    { id: 'end', x: 100, y: 2, direction: 'right', type: 'connection' }
                ]
            },

            'pipe_vertical': {
                id: 'pipe_vertical',
                name: 'Vertical Pipe',
                category: 'piping',
                width: 4,
                height: 100,
                svg: `
                    <line x1="2" y1="0" x2="2" y2="100" stroke="black" stroke-width="3"/>
                `,
                connectionPoints: [
                    { id: 'start', x: 2, y: 0, direction: 'top', type: 'connection' },
                    { id: 'end', x: 2, y: 100, direction: 'bottom', type: 'connection' }
                ]
            },

            'flow_arrow': {
                id: 'flow_arrow',
                name: 'Flow Direction Arrow',
                category: 'piping',
                width: 20,
                height: 12,
                svg: `
                    <g id="flow_arrow">
                        <path d="M 0,6 L 15,6" stroke="black" stroke-width="2"/>
                        <path d="M 10,1 L 15,6 L 10,11" stroke="black" stroke-width="2" fill="none"/>
                    </g>
                `
            }
        };
    }

    /**
     * Get symbol by ID
     */
    getSymbol(id) {
        return this.symbols[id] || null;
    }

    /**
     * Get all symbols in a category
     */
    getByCategory(category) {
        return Object.values(this.symbols).filter(s => s.category === category);
    }

    /**
     * Search symbols by name
     */
    searchByName(query) {
        const lowerQuery = query.toLowerCase();
        return Object.values(this.symbols).filter(s =>
            s.name.toLowerCase().includes(lowerQuery)
        );
    }

    /**
     * Get all symbol IDs
     */
    getAllSymbolIds() {
        return Object.keys(this.symbols);
    }

    /**
     * Get SVG definitions block for all symbols
     */
    getSVGDefinitions() {
        return Object.values(this.symbols)
            .map(symbol => symbol.svg)
            .join('\n');
    }

    /**
     * Get connection point for symbol
     */
    getConnectionPoint(symbolId, pointId) {
        const symbol = this.getSymbol(symbolId);
        if (!symbol) return null;

        return symbol.connectionPoints?.find(p => p.id === pointId) || null;
    }
}

module.exports = SVGSymbolLibrary;
