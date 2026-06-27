// backend/services/ingress/KnowledgeGraphBuilder.js
const { v4: uuidv4 } = require('uuid');
const Neo4jClient = require('./Neo4jClient');

/**
 * Knowledge Graph Builder for GFDDE
 * Converts parsed DXF entities into a semantic Knowledge Graph
 * Maps to Asset Administration Shell (AAS) standard
 */
class KnowledgeGraphBuilder {
    constructor() {
        this.graph = {
            nodes: new Map(),
            edges: new Map()
        };

        this.config = {
            proximityThreshold: 50, // Units for text-to-symbol association
            connectionTolerance: 5, // Units for line-to-symbol snapping
            flowDetectionRadius: 20 // Units for arrow detection
        };

        // Neo4j client for database storage
        this.neo4jClient = null;
    }

    /**
     * Build Knowledge Graph from parsed DXF data
     * @param {Object} dxfData - Output from DXFParserService
     * @returns {Object} Knowledge Graph with AAS mapping
     */
    buildGraph(dxfData) {
        console.log('[KG Builder] Starting Knowledge Graph construction...');

        // Clear previous graph
        this.graph.nodes.clear();
        this.graph.edges.clear();

        // Step 1: Create nodes from symbols
        console.log('[KG Builder] Step 1: Creating nodes from symbols...');
        this.createNodesFromSymbols(dxfData.entities.symbols, dxfData.blocks);

        // Step 2: Associate text labels with symbols
        console.log('[KG Builder] Step 2: Associating text labels...');
        this.associateTextLabels(dxfData.entities.text);

        // Step 3: Trace line connectivity
        console.log('[KG Builder] Step 3: Tracing connectivity...');
        this.traceConnectivity(dxfData.entities.lines, dxfData.entities.polylines);

        // Step 4: Detect and propagate flow direction
        console.log('[KG Builder] Step 4: Propagating flow direction...');
        this.detectFlowDirections(dxfData.entities);
        this.propagateFlowDirection();

        // Step 5: Classify line types (process vs control)
        console.log('[KG Builder] Step 5: Classifying line systems...');
        this.classifyLineSystems();

        // Step 6: Export to AAS format
        console.log('[KG Builder] Step 6: Mapping to AAS...');
        const aasGraph = this.toAASFormat();

        console.log(`[KG Builder] ✅ Graph complete: ${this.graph.nodes.size} nodes, ${this.graph.edges.size} edges`);

        return aasGraph;
    }

    createNodesFromSymbols(symbols, blockDefinitions) {
        symbols.forEach((symbol, index) => {
            const nodeId = symbol.id || uuidv4();
            const blockDef = blockDefinitions[symbol.blockName];

            this.graph.nodes.set(nodeId, {
                id: nodeId,
                type: symbol.type,
                blockName: symbol.blockName,
                position: symbol.position,
                rotation: symbol.rotation,
                scale: symbol.scale,
                layer: symbol.layer,
                properties: {
                    tag: null, // Will be filled by text association
                    size: null,
                    manufacturer: null,
                    model: null
                },
                connections: {
                    inlet: [],
                    outlet: []
                }
            });
        });

        console.log(`[KG Builder]   Created ${this.graph.nodes.size} nodes`);
    }

    associateTextLabels(textEntities) {
        let associatedCount = 0;

        textEntities.forEach(text => {
            let nearestNode = null;
            let minDistance = Infinity;

            // Find closest symbol
            for (const [nodeId, node] of this.graph.nodes) {
                const distance = this.calculateDistance(text.position, node.position);
                if (distance < minDistance && distance < this.config.proximityThreshold) {
                    minDistance = distance;
                    nearestNode = nodeId;
                }
            }

            if (nearestNode) {
                const node = this.graph.nodes.get(nearestNode);
                const parsed = this.parseTextLabel(text.content);
                node.properties = { ...node.properties, ...parsed };
                associatedCount++;
            }
        });

        console.log(`[KG Builder]   Associated ${associatedCount} text labels`);
    }

    parseTextLabel(text) {
        const cleanText = text.trim().toUpperCase();
        const result = {};

        // Extract size from various formats
        // Examples: "SVA32", "DN80", "1 1/2\"", "2\""

        // DN format
        const dnMatch = cleanText.match(/DN\s*(\d+)/);
        if (dnMatch) {
            result.size = parseInt(dnMatch[1]);
            result.sizeFormat = 'DN';
        }

        // Numeric suffix (e.g., SVA32 -> 32)
        const numMatch = cleanText.match(/(\d+)$/);
        if (numMatch && !result.size) {
            result.size = parseInt(numMatch[1]);
        }

        // Fractional inches (e.g., 1 1/2")
        const inchMatch = cleanText.match(/(\d+\s*\d*\/?\d*)\s*["]/);
        if (inchMatch) {
            result.sizeInches = inchMatch[1];
        }

        // Extract tag (full text if starts with known prefix)
        const tagPrefixes = ['SVA', 'EVRA', 'NRVA', 'ICS', 'FIA', 'REG', 'COND', 'EVAP', 'COMP'];
        const hasPrefix = tagPrefixes.some(prefix => cleanText.startsWith(prefix));
        if (hasPrefix) {
            result.tag = cleanText;
        }

        return result;
    }

    traceConnectivity(lines, polylines) {
        let connectionCount = 0;

        // Process straight lines
        lines.forEach(line => {
            const sourceNode = this.findNodeNearPoint(line.start, this.config.connectionTolerance);
            const targetNode = this.findNodeNearPoint(line.end, this.config.connectionTolerance);

            if (sourceNode && targetNode && sourceNode !== targetNode) {
                this.createEdge(sourceNode, targetNode, line);
                connectionCount++;
            }
        });

        // Process polylines (multi-segment lines)
        polylines.forEach(polyline => {
            for (let i = 0; i < polyline.vertices.length - 1; i++) {
                const start = polyline.vertices[i];
                const end = polyline.vertices[i + 1];

                const sourceNode = this.findNodeNearPoint(start, this.config.connectionTolerance);
                const targetNode = this.findNodeNearPoint(end, this.config.connectionTolerance);

                if (sourceNode && targetNode && sourceNode !== targetNode) {
                    this.createEdge(sourceNode, targetNode, { ...polyline, start, end });
                    connectionCount++;
                }
            }
        });

        console.log(`[KG Builder]   Created ${connectionCount} connections`);
    }

    createEdge(sourceId, targetId, lineData) {
        const edgeId = uuidv4();

        this.graph.edges.set(edgeId, {
            id: edgeId,
            source: sourceId,
            target: targetId,
            type: this.classifyLineType(lineData.lineType),
            layer: lineData.layer,
            flowDirection: null, // Will be determined later
            properties: {
                pipeSize: null,
                material: null,
                service: this.inferService(lineData.layer)
            }
        });

        // Update node connections
        const sourceNode = this.graph.nodes.get(sourceId);
        const targetNode = this.graph.nodes.get(targetId);

        if (sourceNode) sourceNode.connections.outlet.push(edgeId);
        if (targetNode) targetNode.connections.inlet.push(edgeId);
    }

    classifyLineType(lineTypeName) {
        if (!lineTypeName) return 'process_line';

        const lower = lineTypeName.toLowerCase();
        if (lower.includes('dash') || lower.includes('dot') || lower.includes('hidden')) {
            return 'control_line';
        }
        return 'process_line';
    }

    inferService(layerName) {
        if (!layerName) return 'unknown';

        const lower = layerName.toLowerCase();
        if (lower.includes('liquid') || lower.includes('liq')) return 'liquid';
        if (lower.includes('suction') || lower.includes('suc')) return 'suction';
        if (lower.includes('discharge') || lower.includes('disc') || lower.includes('hot')) return 'discharge';
        if (lower.includes('vapor') || lower.includes('gas')) return 'vapor';

        return 'unknown';
    }

    detectFlowDirections(entities) {
        // Look for arrow symbols, arrowheads, or directional indicators
        // This is a simplified implementation
        // Real implementation would use pattern matching on polylines/blocks

        entities.polylines?.forEach(polyline => {
            // Check if polyline forms an arrow shape
            if (this.isArrowShape(polyline)) {
                // Find nearest edge and set direction
                const midpoint = this.calculatePolylineMidpoint(polyline);
                const nearestEdge = this.findEdgeNearPoint(midpoint, this.config.flowDetectionRadius);

                if (nearestEdge) {
                    const edge = this.graph.edges.get(nearestEdge);
                    edge.flowDirection = 'forward';
                }
            }
        });
    }

    isArrowShape(polyline) {
        // Simplified: Check if it has few vertices (3-4) forming a V or triangle
        return polyline.vertices?.length >= 3 && polyline.vertices.length <= 5;
    }

    calculatePolylineMidpoint(polyline) {
        const vertices = polyline.vertices || [];
        if (vertices.length === 0) return { x: 0, y: 0, z: 0 };

        const sum = vertices.reduce((acc, v) => ({
            x: acc.x + v.x,
            y: acc.y + v.y,
            z: acc.z + (v.z || 0)
        }), { x: 0, y: 0, z: 0 });

        return {
            x: sum.x / vertices.length,
            y: sum.y / vertices.length,
            z: sum.z / vertices.length
        };
    }

    findEdgeNearPoint(point, tolerance) {
        let nearestEdge = null;
        let minDistance = Infinity;

        for (const [edgeId, edge] of this.graph.edges) {
            const sourceNode = this.graph.nodes.get(edge.source);
            const targetNode = this.graph.nodes.get(edge.target);

            if (sourceNode && targetNode) {
                const edgeMidpoint = {
                    x: (sourceNode.position.x + targetNode.position.x) / 2,
                    y: (sourceNode.position.y + targetNode.position.y) / 2,
                    z: 0
                };

                const distance = this.calculateDistance(point, edgeMidpoint);
                if (distance < minDistance && distance < tolerance) {
                    minDistance = distance;
                    nearestEdge = edgeId;
                }
            }
        }

        return nearestEdge;
    }

    propagateFlowDirection() {
        // Identify source nodes (condensers, receivers, vessels)
        const sourceTypes = ['condenser', 'receiver', 'separator'];
        const sources = Array.from(this.graph.nodes.entries())
            .filter(([id, node]) => sourceTypes.includes(node.type))
            .map(([id]) => id);

        console.log(`[KG Builder]   Found ${sources.length} potential flow sources`);

        const visited = new Set();

        sources.forEach(sourceId => {
            this.dfsPropagate(sourceId, 'forward', visited);
        });

        // Count edges with flow direction
        const directedEdges = Array.from(this.graph.edges.values())
            .filter(e => e.flowDirection !== null).length;
        console.log(`[KG Builder]   Propagated flow to ${directedEdges} edges`);
    }

    dfsPropagate(nodeId, direction, visited) {
        if (visited.has(nodeId)) return;
        visited.add(nodeId);

        const node = this.graph.nodes.get(nodeId);
        if (!node) return;

        // Propagate through outlet edges
        node.connections.outlet.forEach(edgeId => {
            const edge = this.graph.edges.get(edgeId);
            if (edge && !edge.flowDirection) {
                edge.flowDirection = direction;
                this.dfsPropagate(edge.target, direction, visited);
            }
        });
    }

    classifyLineSystems() {
        // Group edges into systems (liquid, suction, discharge)
        const systems = {
            liquid: [],
            suction: [],
            discharge: [],
            control: [],
            unknown: []
        };

        for (const [edgeId, edge] of this.graph.edges) {
            const service = edge.properties.service;
            if (systems[service]) {
                systems[service].push(edgeId);
            } else {
                systems.unknown.push(edgeId);
            }
        }

        return systems;
    }

    findNodeNearPoint(point, tolerance) {
        for (const [nodeId, node] of this.graph.nodes) {
            const distance = this.calculateDistance(point, node.position);
            if (distance <= tolerance) {
                return nodeId;
            }
        }
        return null;
    }

    calculateDistance(p1, p2) {
        const dx = (p2.x || 0) - (p1.x || 0);
        const dy = (p2.y || 0) - (p1.y || 0);
        const dz = (p2.z || 0) - (p1.z || 0);
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    /**
     * Store graph in Neo4j database
     * @param {Object} systemInfo - System metadata (name, refrigerant, capacity, etc.)
     * @returns {Promise<Object>} Storage result with statistics
     */
    async storeInNeo4j(systemInfo = {}) {
        console.log('[KG Builder] Storing graph in Neo4j...');

        if (!this.neo4jClient) {
            this.neo4jClient = new Neo4jClient();
            await this.neo4jClient.connect();
        }

        try {
            const stats = {
                componentsCreated: 0,
                pipesCreated: 0,
                relationshipsCreated: 0,
                errors: []
            };

            // Create component nodes
            for (const [nodeId, node] of this.graph.nodes) {
                try {
                    await this.neo4jClient.createComponent({
                        id: nodeId,
                        type: node.type,
                        tag: node.properties.tag || `UNTAGGED_${nodeId.slice(0, 8)}`,
                        blockName: node.blockName,
                        category: this.categorizeComponent(node.type),
                        position: JSON.stringify(node.position),
                        layer: node.layer,
                        manufacturer: node.properties.manufacturer,
                        model: node.properties.model,
                        refrigerant: systemInfo.refrigerant || 'R717'
                    });
                    stats.componentsCreated++;
                } catch (error) {
                    stats.errors.push(`Component ${nodeId}: ${error.message}`);
                }
            }

            // Create pipe nodes and relationships
            for (const [edgeId, edge] of this.graph.edges) {
                try {
                    // Create pipe node
                    await this.neo4jClient.createPipe({
                        id: edgeId,
                        type: edge.properties.service || edge.type,
                        sizeDN: edge.properties.pipeSize,
                        flowDirection: edge.flowDirection || 'unknown'
                    });
                    stats.pipesCreated++;

                    // Create CONNECTED_TO relationships
                    await this.neo4jClient.createRelationship(
                        edge.source,
                        edge.target,
                        'CONNECTED_TO',
                        { via: edgeId }
                    );

                    // Create FLOWS_TO relationship if direction known
                    if (edge.flowDirection === 'forward') {
                        await this.neo4jClient.createRelationship(
                            edge.source,
                            edge.target,
                            'FLOWS_TO',
                            { flowType: edge.properties.service }
                        );
                    }

                    stats.relationshipsCreated += edge.flowDirection ? 2 : 1;
                } catch (error) {
                    stats.errors.push(`Edge ${edgeId}: ${error.message}`);
                }
            }

            console.log(`[KG Builder] ✅ Neo4j storage complete:`, stats);
            return stats;
        } catch (error) {
            console.error(`[KG Builder] ❌ Neo4j storage ERROR:`, error.message);
            throw error;
        }
    }

    /**
     * Categorize component for Neo4j schema
     */
    categorizeComponent(type) {
        const categories = {
            compressor: 'rotating_equipment',
            screw_compressor: 'rotating_equipment',
            reciprocating_compressor: 'rotating_equipment',
            condenser: 'heat_exchanger',
            evaporator: 'heat_exchanger',
            evaporative_condenser: 'heat_exchanger',
            shell_and_tube: 'heat_exchanger',
            receiver: 'vessel',
            separator: 'vessel',
            globe_valve: 'valve',
            solenoid_valve: 'valve',
            expansion_valve: 'valve',
            check_valve: 'valve',
            pressure_transmitter: 'instrument',
            temperature_transmitter: 'instrument',
            pressure_indicator: 'instrument',
            temperature_indicator: 'instrument'
        };
        return categories[type] || 'unknown';
    }

    /**
     * Convert to Asset Administration Shell format
     */
    toAASFormat() {
        const nodeArray = Array.from(this.graph.nodes.values());
        const edgeArray = Array.from(this.graph.edges.values());

        return {
            assetAdministrationShells: [{
                id: `AAS_P&ID_${Date.now()}`,
                idShort: 'HVACR_System_P&ID',
                assetInformation: {
                    assetKind: 'Instance',
                    globalAssetId: `urn:gfdde:pid:${Date.now()}`
                },
                submodels: [
                    {
                        id: 'SM_Topology',
                        idShort: 'SystemTopology',
                        kind: 'Instance',
                        semanticId: {
                            type: 'ExternalReference',
                            keys: [{
                                type: 'GlobalReference',
                                value: 'https://gfdde.io/ontology/topology/1.0'
                            }]
                        },
                        submodelElements: this.convertNodesToAASElements(nodeArray)
                    },
                    {
                        id: 'SM_Connectivity',
                        idShort: 'PipingConnectivity',
                        kind: 'Instance',
                        submodelElements: this.convertEdgesToAASElements(edgeArray)
                    }
                ]
            }],
            conceptDescriptions: this.generateConceptDescriptions(),
            rawGraph: {
                nodes: nodeArray,
                edges: edgeArray,
                statistics: {
                    totalNodes: nodeArray.length,
                    totalEdges: edgeArray.length,
                    nodeTypes: this.getNodeTypeCounts(nodeArray),
                    edgeTypes: this.getEdgeTypeCounts(edgeArray)
                }
            }
        };
    }

    convertNodesToAASElements(nodes) {
        return nodes.map(node => ({
            idShort: node.properties.tag || `${node.type}_${node.id.slice(0, 8)}`,
            modelType: 'SubmodelElementCollection',
            value: [
                {
                    idShort: 'ComponentType',
                    modelType: 'Property',
                    valueType: 'xs:string',
                    value: node.type
                },
                {
                    idShort: 'Position',
                    modelType: 'Property',
                    valueType: 'xs:string',
                    value: JSON.stringify(node.position)
                },
                {
                    idShort: 'Tag',
                    modelType: 'Property',
                    valueType: 'xs:string',
                    value: node.properties.tag || ''
                },
                {
                    idShort: 'Size',
                    modelType: 'Property',
                    valueType: 'xs:int',
                    value: node.properties.size || null
                }
            ],
            semanticId: {
                type: 'ExternalReference',
                keys: [{
                    type: 'ConceptDescription',
                    value: `HVACR_${node.type.toUpperCase()}`
                }]
            }
        }));
    }

    convertEdgesToAASElements(edges) {
        return edges.map(edge => ({
            idShort: `Connection_${edge.id.slice(0, 8)}`,
            modelType: 'RelationshipElement',
            first: {
                type: 'ModelReference',
                keys: [{
                    type: 'SubmodelElement',
                    value: edge.source
                }]
            },
            second: {
                type: 'ModReference',
                keys: [{
                    type: 'SubmodelElement',
                    value: edge.target
                }]
            }
        }));
    }

    generateConceptDescriptions() {
        // Placeholder for ECLASS or custom ontology mapping
        return [];
    }

    getNodeTypeCounts(nodes) {
        const counts = {};
        nodes.forEach(node => {
            counts[node.type] = (counts[node.type] || 0) + 1;
        });
        return counts;
    }

    getEdgeTypeCounts(edges) {
        const counts = {};
        edges.forEach(edge => {
            counts[edge.type] = (counts[edge.type] || 0) + 1;
        });
        return counts;
    }
}

module.exports = new KnowledgeGraphBuilder();
