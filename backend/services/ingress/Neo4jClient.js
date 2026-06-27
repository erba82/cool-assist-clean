// backend/services/ingress/Neo4jClient.js
const neo4j = require('neo4j-driver');
const { GraphSchema } = require('./GraphSchema');

/**
 * Neo4j Database Client for GFDDE Knowledge Graph
 * Handles connection, querying, and data management
 */
class Neo4jClient {
    constructor(uri = null, username = null, password = null) {
        this.uri = uri || process.env.NEO4J_URI || 'bolt://localhost:7687';
        this.username = username || process.env.NEO4J_USERNAME || 'neo4j';
        this.password = password || process.env.NEO4J_PASSWORD || 'gfdde2024';

        this.driver = null;
        this.connected = false;
    }

    /**
     * Connect to Neo4j database
     */
    async connect() {
        try {
            this.driver = neo4j.driver(
                this.uri,
                neo4j.auth.basic(this.username, this.password),
                {
                    maxConnectionPoolSize: 50,
                    connectionAcquisitionTimeout: 60000
                }
            );

            // Verify connection
            await this.driver.verifyConnectivity();
            this.connected = true;

            console.log(`✅ Connected to Neo4j at ${this.uri}`);

            // Initialize schema
            await this.initializeSchema();

            return true;
        } catch (error) {
            console.error(`❌ Failed to connect to Neo4j: ${error.message}`);
            this.connected = false;
            throw error;
        }
    }

    /**
     * Initialize database schema (constraints and indexes)
     */
    async initializeSchema() {
        const session = this.driver.session();

        try {
            console.log('📋 Initializing Neo4j schema...');

            // Create constraints
            for (const query of GraphSchema.createConstraints) {
                try {
                    await session.run(query);
                } catch (error) {
                    // Ignore if constraint already exists
                    if (!error.message.includes('already exists')) {
                        console.warn(`Warning creating constraint: ${error.message}`);
                    }
                }
            }

            // Create indexes
            for (const query of GraphSchema.createIndexes) {
                try {
                    await session.run(query);
                } catch (error) {
                    if (!error.message.includes('already exists')) {
                        console.warn(`Warning creating index: ${error.message}`);
                    }
                }
            }

            console.log('✅ Schema initialized');
        } finally {
            await session.close();
        }
    }

    /**
     * Close connection
     */
    async close() {
        if (this.driver) {
            await this.driver.close();
            this.connected = false;
            console.log('🔒 Neo4j connection closed');
        }
    }

    /**
     * Create a Component node
     */
    async createComponent(componentData) {
        const session = this.driver.session();

        try {
            const query = `
                CREATE (c:Component {
                    id: $id,
                    type: $type,
                    tag: $tag,
                    manufacturer: $manufacturer,
                    model: $model,
                    capacity: $capacity,
                    refrigerant: $refrigerant,
                    position: $position,
                    layer: $layer,
                    blockName: $blockName,
                    category: $category,
                    isoSymbol: $isoSymbol,
                    createdAt: datetime()
                })
                RETURN c
            `;

            const result = await session.run(query, componentData);
            return result.records[0].get('c').properties;
        } finally {
            await session.close();
        }
    }

    /**
     * Create a Pipe node
     */
    async createPipe(pipeData) {
        const session = this.driver.session();

        try {
            const query = `
                CREATE (p:Pipe {
                    id: $id,
                    type: $type,
                    sizeDN: $sizeDN,
                    material: $material,
                    insulation: $insulation,
                    flowDirection: $flowDirection,
                    startPoint: $startPoint,
                    endPoint: $endPoint,
                    createdAt: datetime()
                })
                RETURN p
            `;

            const result = await session.run(query, pipeData);
            return result.records[0].get('p').properties;
        } finally {
            await session.close();
        }
    }

    /**
     * Create a relationship between nodes
     */
    async createRelationship(fromId, toId, relType, properties = {}) {
        const session = this.driver.session();

        try {
            const propsStr = Object.keys(properties).length > 0
                ? `{${Object.entries(properties).map(([k, v]) => `${k}: $${k}`).join(', ')}}`
                : '';

            const query = `
                MATCH (a {id: $fromId})
                MATCH (b {id: $toId})
                CREATE (a)-[r:${relType} ${propsStr}]->(b)
                RETURN r
            `;

            const params = { fromId, toId, ...properties };
            const result = await session.run(query, params);

            return result.records[0]?.get('r').properties || {};
        } finally {
            await session.close();
        }
    }

    /**
     * Find component by tag
     */
    async findComponentByTag(tag) {
        const session = this.driver.session();

        try {
            const query = 'MATCH (c:Component {tag: $tag}) RETURN c';
            const result = await session.run(query, { tag });

            if (result.records.length === 0) return null;
            return result.records[0].get('c').properties;
        } finally {
            await session.close();
        }
    }

    /**
     * Find all components of a specific type
     */
    async findComponentsByType(type) {
        const session = this.driver.session();

        try {
            const query = 'MATCH (c:Component {type: $type}) RETURN c';
            const result = await session.run(query, { type });

            return result.records.map(record => record.get('c').properties);
        } finally {
            await session.close();
        }
    }

    /**
     * Find refrigerant flow path between two components
     */
    async findFlowPath(startTag, endTag) {
        const session = this.driver.session();

        try {
            const query = `
                MATCH path = shortestPath(
                    (start:Component {tag: $startTag})-[:FLOWS_TO*]-(end:Component {tag: $endTag})
                )
                RETURN path
            `;

            const result = await session.run(query, { startTag, endTag });

            if (result.records.length === 0) return null;

            const path = result.records[0].get('path');
            return {
                nodes: path.segments.map(seg => seg.start.properties),
                relationships: path.segments.map(seg => seg.relationship.properties)
            };
        } finally {
            await session.close();
        }
    }

    /**
     * Find similar systems (for RAG)
     */
    async findSimilarSystems(criteria) {
        const session = this.driver.session();

        try {
            const query = `
                MATCH (s:System)
                WHERE s.refrigerant = $refrigerant
                  AND abs(s.totalCapacity - $capacity) < $tolerance
                RETURN s
                ORDER BY abs(s.totalCapacity - $capacity)
                LIMIT $limit
            `;

            const params = {
                refrigerant: criteria.refrigerant,
                capacity: criteria.totalCapacity,
                tolerance: criteria.tolerance || 100,
                limit: criteria.limit || 10
            };

            const result = await session.run(query, params);
            return result.records.map(record => record.get('s').properties);
        } finally {
            await session.close();
        }
    }

    /**
     * Get system statistics
     */
    async getSystemStats() {
        const session = this.driver.session();

        try {
            const query = `
                MATCH (c:Component)
                WITH count(c) as totalComponents, 
                     collect(DISTINCT c.type) as componentTypes
                OPTIONAL MATCH ()-[r]->()
                WITH totalComponents, componentTypes, count(r) as totalRelationships
                RETURN {
                    totalComponents: totalComponents,
                    totalRelationships: totalRelationships,
                    componentTypes: componentTypes
                } as stats
            `;

            const result = await session.run(query);
            return result.records[0]?.get('stats') || {};
        } finally {
            await session.close();
        }
    }

    /**
     * Delete all nodes and relationships (for testing)
     */
    async clearDatabase() {
        const session = this.driver.session();

        try {
            await session.run('MATCH (n) DETACH DELETE n');
            console.log('🗑️  Database cleared');
        } finally {
            await session.close();
        }
    }

    /**
     * Execute custom Cypher query
     */
    async executeQuery(query, params = {}) {
        const session = this.driver.session();

        try {
            const result = await session.run(query, params);
            return result.records;
        } finally {
            await session.close();
        }
    }

    /**
     * Health check
     */
    async healthCheck() {
        if (!this.driver) {
            return { status: 'disconnected', message: 'No driver instance' };
        }

        try {
            await this.driver.verifyConnectivity();
            const stats = await this.getSystemStats();

            return {
                status: 'healthy',
                uri: this.uri,
                stats: stats
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                error: error.message
            };
        }
    }
}

module.exports = Neo4jClient;
