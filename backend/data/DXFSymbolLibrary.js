// backend/data/DXFSymbolLibrary.js
/**
 * Comprehensive P&ID Symbol Library
 * Maps DXF block names and geometries to component types
 * Based on ISO 14617 and industry standards
 */

const DXFSymbolLibrary = {
    // ========== COMPRESSORS ==========
    compressor: {
        patterns: ['CIRCLE + RADIAL_LINES', 'CIRCLE + TRIANGLE'],
        blockNames: ['COMP', 'COMPRESSOR', 'SCREW_COMP', 'RECIP_COMP', 'N320VLD-K'],
        isoSymbol: 'ISO 14617-8:2002',
        category: 'rotating_equipment',
        description: 'Compressor - general'
    },

    screw_compressor: {
        blockNames: ['SCREW', 'SCREW_COMP', 'N320', 'BITZER_SCREW'],
        isoSymbol: 'ISO 14617-8',
        category: 'rotating_equipment',
        description: 'Screw compressor'
    },

    reciprocating_compressor: {
        blockNames: ['RECIP', 'RECIP_COMP', 'PISTON'],
        isoSymbol: 'ISO 14617-8',
        category: 'rotating_equipment',
        description: 'Reciprocating compressor'
    },

    // ========== HEAT EXCHANGERS ==========
    condenser: {
        patterns: ['RECTANGLE + DIAGONAL_LINES', 'HORIZONTAL_VESSEL + TUBES'],
        blockNames: ['COND', 'CONDENSER', 'EVAP_COND', 'VXC'],
        isoSymbol: 'ISO 14617-9:2002',
        category: 'heat_exchanger',
        description: 'Condenser'
    },

    evaporative_condenser: {
        blockNames: ['EVAP_COND', 'EVAP-COND', 'VXC', 'BALTIMORE'],
        isoSymbol: 'ISO 14617-9',
        category: 'heat_exchanger',
        description: 'Evaporative condenser'
    },

    evaporator: {
        patterns: ['RECTANGLE + HORIZONTAL_LINES', 'COIL'],
        blockNames: ['EVAP', 'EVAPORATOR', 'COIL', 'UNIT_COOLER', 'OPTIGO', 'KBC'],
        isoSymbol: 'ISO 14617-9',
        category: 'heat_exchanger',
        description: 'Evaporator unit cooler'
    },

    shell_and_tube: {
        blockNames: ['SAT', 'SHELL_TUBE', 'HX'],
        isoSymbol: 'ISO 14617-9',
        category: 'heat_exchanger',
        description: 'Shell and tube heat exchanger'
    },

    // ========== VESSELS ==========
    receiver: {
        patterns: ['HORIZONTAL_CYLINDER', 'VERTICAL_CYLINDER'],
        blockNames: ['RECV', 'RECEIVER', 'HPR', 'LPR', 'REC'],
        isoSymbol: 'ISO 14617-10',
        category: 'vessel',
        description: 'Receiver vessel'
    },

    horizontal_vessel: {
        blockNames: ['HPR', 'H_VESSEL', 'HORIZ_VESSEL'],
        isoSymbol: 'ISO 14617-10',
        category: 'vessel',
        description: 'Horizontal pressure vessel'
    },

    vertical_vessel: {
        blockNames: ['V_VESSEL', 'VERT_VESSEL', 'SURGE'],
        isoSymbol: 'ISO 14617-10',
        category: 'vessel',
        description: 'Vertical pressure vessel'
    },

    separator: {
        blockNames: ['LPS', 'MTS', 'SEP', 'SEPARATOR', 'SURGE_DRUM'],
        isoSymbol: 'ISO 14617-10',
        category: 'vessel',
        description: 'Liquid-vapor separator'
    },

    // ========== VALVES ==========
    globe_valve: {
        patterns: ['TRIANGLE + STEM', 'DIAMOND + STEM'],
        blockNames: ['GLB', 'GLOBE', 'HAND_VALVE', 'HV'],
        isoSymbol: 'ISO 14617-6:2002',
        category: 'valve',
        description: 'Globe valve (hand operated)'
    },

    solenoid_valve: {
        blockNames: ['SOL', 'SOLENOID', 'EVR', 'EVRA', 'EV'],
        isoSymbol: 'ISO 14617-6',
        category: 'valve',
        description: 'Solenoid valve (electrically operated)'
    },

    expansion_valve: {
        blockNames: ['TEV', 'TXV', 'EXPANSION', 'EXP', 'THERMOSTATIC'],
        isoSymbol: 'ISO 14617-6',
        category: 'valve',
        description: 'Thermostatic expansion valve'
    },

    check_valve: {
        patterns: ['TRIANGLE + FLAP', 'ARROW + BARRIER'],
        blockNames: ['CHK', 'CHECK', 'NRV', 'NRVA', 'NON_RETURN'],
        isoSymbol: 'ISO 14617-6',
        category: 'valve',
        description: 'Check valve (non-return)'
    },

    stop_valve: {
        blockNames: ['STOP', 'SVA', 'SHUT_OFF', 'BALL', 'GATE'],
        isoSymbol: 'ISO 14617-6',
        category: 'valve',
        description: 'Stop valve'
    },

    regulating_valve: {
        blockNames: ['REG', 'REGULATING', 'CONTROL', 'MODULATING'],
        isoSymbol: 'ISO 14617-6',
        category: 'valve',
        description: 'Regulating valve'
    },

    relief_valve: {
        blockNames: ['PRV', 'RELIEF', 'SAFETY', 'PSV'],
        isoSymbol: 'ISO 14617-6',
        category: 'valve',
        description: 'Pressure relief/safety valve'
    },

    pilot_valve: {
        blockNames: ['ICS', 'ICM', 'PILOT', 'CPCE'],
        isoSymbol: 'ISO 14617-6',
        category: 'valve',
        description: 'Pilot-operated valve'
    },

    // ========== INSTRUMENTS ==========
    pressure_transmitter: {
        blockNames: ['PT', 'PRESS_TRANS', 'PRESSURE_TX'],
        isoSymbol: 'ISO 14617-7',
        category: 'instrument',
        measurementType: 'pressure',
        description: 'Pressure transmitter'
    },

    temperature_transmitter: {
        blockNames: ['TT', 'TEMP_TRANS', 'TEMPERATURE_TX'],
        isoSymbol: 'ISO 14617-7',
        category: 'instrument',
        measurementType: 'temperature',
        description: 'Temperature transmitter'
    },

    pressure_indicator: {
        blockNames: ['PI', 'PRESS_IND', 'GAUGE'],
        isoSymbol: 'ISO 14617-7',
        category: 'instrument',
        measurementType: 'pressure',
        description: 'Pressure indicator/gauge'
    },

    temperature_indicator: {
        blockNames: ['TI', 'TEMP_IND', 'THERMOMETER'],
        isoSymbol: 'ISO 14617-7',
        category: 'instrument',
        measurementType: 'temperature',
        description: 'Temperature indicator'
    },

    level_transmitter: {
        blockNames: ['LT', 'LEVEL_TRANS', 'LEVEL_TX'],
        isoSymbol: 'ISO 14617-7',
        category: 'instrument',
        measurementType: 'level',
        description: 'Level transmitter'
    },

    flow_transmitter: {
        blockNames: ['FT', 'FLOW_TRANS', 'FLOW_TX'],
        isoSymbol: 'ISO 14617-7',
        category: 'instrument',
        measurementType: 'flow',
        description: 'Flow transmitter'
    },

    // ========== FILTERS & ACCESSORIES ==========
    strainer: {
        patterns: ['Y_SHAPE', 'BASKET'],
        blockNames: ['FIA', 'STRAINER', 'Y_STRAINER', 'FILTER'],
        isoSymbol: 'ISO 14617-11',
        category: 'accessory',
        description: 'Strainer/filter'
    },

    filter_drier: {
        blockNames: ['DCL', 'DRIER', 'FILTER_DRIER', 'MOLECULAR_SIEVE'],
        isoSymbol: 'ISO 14617-11',
        category: 'accessory',
        description: 'Filter drier'
    },

    sight_glass: {
        blockNames: ['SGN', 'SGM', 'SIGHT_GLASS', 'MOISTURE_INDICATOR'],
        isoSymbol: 'ISO 14617-11',
        category: 'accessory',
        description: 'Sight glass'
    },

    // ========== PUMPS ==========
    liquid_pump: {
        patterns: ['CIRCLE + IMPELLER'],
        blockNames: ['PUMP', 'LIQ_PUMP', 'CENTRIFUGAL'],
        isoSymbol: 'ISO 14617-8',
        category: 'rotating_equipment',
        description: 'Liquid pump'
    }
};

/**
 * Helper functions for symbol matching
 */
const SymbolMatcher = {
    /**
     * Find symbol type by block name
     */
    findByBlockName(blockName) {
        if (!blockName) return null;

        const upper = blockName.toUpperCase().trim();

        for (const [symbolType, symbolData] of Object.entries(DXFSymbolLibrary)) {
            if (symbolData.blockNames) {
                for (const name of symbolData.blockNames) {
                    if (upper.includes(name) || name.includes(upper)) {
                        return {
                            type: symbolType,
                            ...symbolData
                        };
                    }
                }
            }
        }

        return null;
    },

    /**
     * Get all symbols of a category
     */
    getByCategory(category) {
        return Object.entries(DXFSymbolLibrary)
            .filter(([, data]) => data.category === category)
            .map(([type, data]) => ({ type, ...data }));
    },

    /**
     * Get symbol metadata
     */
    getMetadata(symbolType) {
        return DXFSymbolLibrary[symbolType] || null;
    },

    /**
     * List all categories
     */
    getCategories() {
        const categories = new Set();
        Object.values(DXFSymbolLibrary).forEach(symbol => {
            if (symbol.category) categories.add(symbol.category);
        });
        return Array.from(categories);
    }
};

module.exports = {
    DXFSymbolLibrary,
    SymbolMatcher
};
