// backend/services/ingress/GraphSchema.js
/**
 * Knowledge Graph Schema for GFDDE
 * Defines node types, relationships, and properties for refrigeration systems
 * Based on ISO 14617 and ASHRAE standards
 */

const GraphSchema = {
    /**
     * NODE TYPES
     */
    nodeTypes: {
        // Equipment Nodes
        COMPONENT: {
            label: 'Component',
            description: 'Equipment component (compressor, vessel, heat exchanger, etc.)',
            requiredProperties: ['id', 'type', 'tag'],
            optionalProperties: [
                'manufacturer',
                'model',
                'capacity',          // kW
                'refrigerant',
                'position',          // {x, y, z}
                'layer',
                'blockName',         // From DXF
                'category',          // rotating_equipment, heat_exchanger, etc.
                'isoSymbol',         // ISO 14617 reference
                'specifications'     // JSON object
            ],
            constraints: [
                'UNIQUE (id)',
                'UNIQUE (tag)'
            ],
            indexes: ['type', 'category', 'refrigerant']
        },

        PIPE: {
            label: 'Pipe',
            description: 'Piping connection between components',
            requiredProperties: ['id', 'type'],
            optionalProperties: [
                'sizeDN',            // Nominal diameter
                'material',          // Steel, Copper, etc.
                'insulation',        // boolean
                'layer',
                'lineType',          // CONTINUOUS, DASHED, etc.
                'flowDirection',     // forward, reverse, bidirectional
                'startPoint',        // {x, y, z}
                'endPoint',          // {x, y, z}
                'length'             // meters
            ],
            types: ['discharge', 'liquid', 'suction', 'hot_gas', 'defrost'],
            indexes: ['type', 'sizeDN']
        },

        INSTRUMENT: {
            label: 'Instrument',
            description: 'Measurement and control instruments',
            requiredProperties: ['id', 'type', 'tag'],
            optionalProperties: [
                'measurement Measurement type (pressure, temperature, flow, level)',
                'range',             // Measurement range
                'units',
                'transmitter',       // boolean - is it a transmitter or indicator
                'position',
                'manufacturer',
                'model'
            ],
            types: ['pressure', 'temperature', 'flow', 'level'],
            indexes: ['type', 'measurementType']
        },

        VALVE: {
            label: 'Valve',
            description: 'Flow control valves',
            requiredProperties: ['id', 'type', 'tag'],
            optionalProperties: [
                'valveType',         // globe, solenoid, expansion, check, etc.
                'sizeDN',
                'actuationType',     // manual, electric, pneumatic
                'manufacturer',
                'model',
                'position',
                'normalPosition'     // NO, NC
            ],
            types: ['globe', 'solenoid', 'expansion', 'check', 'relief', 'regulating'],
            indexes: ['type', 'valveType']
        },

        SYSTEM: {
            label: 'System',
            description: 'Overall refrigeration system',
            requiredProperties: ['id', 'name'],
            optionalProperties: [
                'refrigerant',
                'totalCapacity',     // kW
                'stages',            // single, two-stage, cascade
                'application',       // cold storage, process cooling, etc.
                'designTemp',
                'ambientTemp',
                'cop',               // Coefficient of Performance
                'createdAt',
                'updatedAt'
            ],
            indexes: ['refrigerant', 'application']
        },

        ROOM: {
            label: 'Room',
            description: 'Cold room or refrigerated space',
            requiredProperties: ['id', 'name', 'temperature'],
            optionalProperties: [
                'volume',            // m³
                'loadKW',            // Cooling load
                'productType',       // meat, dairy, vegetables, etc.
                'storageType',       // blast freeze, holding, etc.
                'dimensions',        // {length, width, height}
                'evaporator Count'   // Number of evaporators
            ],
            indexes: ['temperature', 'productType']
        }
    },

    /**
     * RELATIONSHIP TYPES
     */
    relationshipTypes: {
        CONNECTED_TO: {
            type: 'CONNECTED_TO',
            description: 'Physical connection between components',
            direction: 'any',
            properties: {
                via: 'Pipe or connection type',
                connectionType: 'flange, weld, threaded, etc.'
            }
        },

        FLOWS_TO: {
            type: 'FLOWS_TO',
            description: 'Refrigerant flow direction',
            direction: 'directed',
            requiredProperties: ['flowType'],
            optionalProperties: [
                'flowRate',          // kg/s
                'pressure',          // Pa
                'temperature',       // K
                'enthalpy',          // J/kg
                'quality'            // 0-1 (vapor fraction)
            ],
            flowTypes: ['discharge', 'liquid', 'suction', 'hot_gas']
        },

        CONTROLLED_BY: {
            type: 'CONTROLLED_BY',
            description: 'Component controlled by valve or instrument',
            direction: 'directed',
            properties: {
                controlType: 'on/off, modulating, PID, etc.',
                setpoint: 'Control setpoint value'
            }
        },

        MEASURES: {
            type: 'MEASURES',
            description: 'Instrument measures component property',
            direction: 'directed',
            properties: {
                property: 'pressure, temperature, flow, level',
                location: 'inlet, outlet, body, etc.'
            }
        },

        SERVES: {
            type: 'SERVES',
            description: 'Component serves a room',
            direction: 'directed',
            properties: {
                capacity: 'kW serving this specific room',
                percentage: 'Percentage of total component capacity'
            }
        },

        PART_OF: {
            type: 'PART_OF',
            description: 'Component is part of a system',
            direction: 'directed',
            properties: {
                role: 'primary, backup, spare, etc.'
            }
        }
    },

    /**
     * CYPHER QUERIES FOR SCHEMA CREATION
     */
    createConstraints: [
        // Component constraints
        'CREATE CONSTRAINT component_id_unique IF NOT EXISTS FOR (c:Component) REQUIRE c.id IS UNIQUE',
        'CREATE CONSTRAINT component_tag_unique IF NOT EXISTS FOR (c:Component) REQUIRE c.tag IS UNIQUE',

        // Pipe constraints
        'CREATE CONSTRAINT pipe_id_unique IF NOT EXISTS FOR (p:Pipe) REQUIRE p.id IS UNIQUE',

        // Instrument constraints
        'CREATE CONSTRAINT instrument_id_unique IF NOT EXISTS FOR (i:Instrument) REQUIRE i.id IS UNIQUE',
        'CREATE CONSTRAINT instrument_tag_unique IF NOT EXISTS FOR (i:Instrument) REQUIRE i.tag IS UNIQUE',

        // Valve constraints
        'CREATE CONSTRAINT valve_id_unique IF NOT EXISTS FOR (v:Valve) REQUIRE v.id IS UNIQUE',
        'CREATE CONSTRAINT valve_tag_unique IF NOT EXISTS FOR (v:Valve) REQUIRE v.tag IS UNIQUE',

        // System constraints
        'CREATE CONSTRAINT system_id_unique IF NOT EXISTS FOR (s:System) REQUIRE s.id IS UNIQUE',

        // Room constraints
        'CREATE CONSTRAINT room_id_unique IF NOT EXISTS FOR (r:Room) REQUIRE r.id IS UNIQUE'
    ],

    createIndexes: [
        // Component indexes
        'CREATE INDEX component_type_idx IF NOT EXISTS FOR (c:Component) ON (c.type)',
        'CREATE INDEX component_category_idx IF NOT EXISTS FOR (c:Component) ON (c.category)',
        'CREATE INDEX component_refrigerant_idx IF NOT EXISTS FOR (c:Component) ON (c.refrigerant)',

        // Pipe indexes
        'CREATE INDEX pipe_type_idx IF NOT EXISTS FOR (p:Pipe) ON (p.type)',
        'CREATE INDEX pipe_size_idx IF NOT EXISTS FOR (p:Pipe) ON (p.sizeDN)',

        // Instrument indexes
        'CREATE INDEX instrument_type_idx IF NOT EXISTS FOR (i:Instrument) ON (i.type)',
        'CREATE INDEX instrument_measurement_idx IF NOT EXISTS FOR (i:Instrument) ON (i.measurementType)',

        // Valve indexes
        'CREATE INDEX valve_type_idx IF NOT EXISTS FOR (v:Valve) ON (v.type)',

        // Room indexes
        'CREATE INDEX room_temp_idx IF NOT EXISTS FOR (r:Room) ON (r.temperature)',
        'CREATE INDEX room_product_idx IF NOT EXISTS FOR (r:Room) ON (r.productType)'
    ],

    /**
     * EXAMPLE QUERIES
     */
    exampleQueries: {
        // Find all compressors
        findCompressors: 'MATCH (c:Component {type: "compressor"}) RETURN c',

        // Find refrigerant flow path
        findFlowPath: `
            MATCH path = (start:Component)-[:FLOWS_TO*]->(end:Component)
            WHERE start.type = 'evaporator' AND end.type = 'condenser'
            RETURN path
        `,

        // Find all components in a system
        findSystemComponents: `
            MATCH (s:System {id: $systemId})<-[:PART_OF]-(c:Component)
            RETURN c
        `,

        // Find instruments measuring a component
        findInstruments: `
            MATCH (i:Instrument)-[:MEASURES]->(c:Component {tag: $tag})
            RETURN i
        `,

        // Find similar systems (for RAG)
        findSimilarSystems: `
            MATCH (s:System)
            WHERE s.refrigerant = $refrigerant 
              AND abs(s.totalCapacity - $capacity) < 100
            RETURN s
        `
    }
};

/**
 * Helper function to generate Cypher for node creation
 */
function createNodeCypher(label, properties) {
    const props = Object.entries(properties)
        .map(([key, value]) => `${key}: $${key}`)
        .join(', ');

    return `CREATE (n:${label} {${props}}) RETURN n`;
}

/**
 * Helper function to generate Cypher for relationship creation
 */
function createRelationshipCypher(fromLabel, fromId, relType, toLabel, toId, properties = {}) {
    const props = Object.keys(properties).length > 0
        ? `{${Object.keys(properties).map(k => `${k}: $${k}`).join(', ')}}`
        : '';

    return `
        MATCH (a:${fromLabel} {id: $${fromId}})
        MATCH (b:${toLabel} {id: $${toId}})
        CREATE (a)-[r:${relType} ${props}]->(b)
        RETURN r
    `;
}

module.exports = {
    GraphSchema,
    createNodeCypher,
    createRelationshipCypher
};
