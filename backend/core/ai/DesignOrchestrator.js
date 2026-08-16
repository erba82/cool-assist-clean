/**
 * DesignOrchestrator - AI Operator for Core Engine
 * 
 * Orchestrates the design workflow:
 * 1. Classifies user intent (design vs question)
 * 2. Validates required information
 * 3. Generates smart recommendations
 * 4. Runs Core Engine calculations
 * 5. Generates output (reports, diagrams)
 * 
 * @author GFDDE AI Engine
 * @version 3.0.0 - Intelligent Conversation
 */

const RefrigerationEngine = require('../RefrigerationEngine');
const InputParser = require('./InputParser');
const IntentClassifier = require('./IntentClassifier');
const RequiredInfoValidator = require('./RequiredInfoValidator');
const GlobalDataFetcher = require('../../services/data/GlobalDataFetcher');
const InnovativeEnergyStrategies = require('../modules/InnovativeEnergyStrategies');
const RefrigerantRecommender = require('../modules/RefrigerantRecommender');
const MaterialRecommender = require('../modules/MaterialRecommender');
const { getStandardsForLocation } = require('../../data/standards/RegionalStandardsDB');
const GeminiService = require('../../services/GeminiService');
const OllamaService = require('../../services/OllamaService');

class DesignOrchestrator {
    constructor() {
        this.engine = new RefrigerationEngine();
        this.parser = new InputParser();
        this.intentClassifier = new IntentClassifier();
        this.infoValidator = new RequiredInfoValidator();
        this.refrigerantRecommender = new RefrigerantRecommender();
        this.materialRecommender = new MaterialRecommender();
        this.gemini = new GeminiService();
        this.ollama = new OllamaService();
        this.conversationState = new Map();

        console.log('🎯 DesignOrchestrator v4.0 initialized with AI Captain');
    }

    // 🚨 BUG FIX: Helper to fix the .reduce() error by ensuring arrays
    _normalizeArrays(results) {
        if (!results.calculations) return;
        const c = results.calculations;
        if (c.condensers && !Array.isArray(c.condensers)) c.condensers = [c.condensers];
        if (c.compressors && !Array.isArray(c.compressors)) c.compressors = [c.compressors];
        if (c.evaporators && !Array.isArray(c.evaporators)) c.evaporators = [c.evaporators];
    }

    async processRequest(userMessage, skipParsing = false, preParsedData = null) {
        const startTime = Date.now();

        try {
            // Step 0: Check if this is a room count response
            if (this._pendingProject && this._pendingCapacity) {
                const roomCountMatch = userMessage.match(/^(\d+)\s*(?:room|rooms|سالن|اتاق)?$/i);
                if (roomCountMatch) {
                    const roomCount = parseInt(roomCountMatch[1]);
                    this._pendingProject.roomCount = roomCount;
                    this._pendingProject.rooms = this._splitCapacityIntoRooms(this._pendingCapacity, roomCount, this._pendingProject);
                    
                    const project = this._pendingProject;
                    this._pendingProject = null;
                    this._pendingCapacity = null;

                    const results = await this.engine.calculate(project);
                    this._normalizeArrays(results); // 🚨 Apply Fix

                    const regionalData = await GlobalDataFetcher.fetchRegionalData(project.location);
                    const energyStrategies = await InnovativeEnergyStrategies.analyzeStrategies(
                        { summary: results.summary, loads: results.calculations?.loads || [], equipment: results.calculations },
                        regionalData
                    );

                    const response = this._generateResponse(results, null, null, project, regionalData, energyStrategies);
                    
                    console.log('🎨 Generating Advanced P&ID...');
                    response.pidData = await this._generatePIDData(results, project); // 🚨 Apply Async Fix
                    
                    response.executionTime = Date.now() - startTime;
                    return response;
                }
            }

            // Step 1: Parse natural language
            let project;
            if (skipParsing && preParsedData) {
                project = {
                    name: preParsedData.name || preParsedData.projectName || 'New Project',
                    location: preParsedData.location || { city: 'Dubai', country: 'UAE' },
                    refrigerant: preParsedData.refrigerant || 'R717',
                    product: preParsedData.product || { type: 'chicken' },
                    rooms: preParsedData.rooms || [],
                    requirements: preParsedData.requirements || [],
                    designIntent: preParsedData.designIntent || {},
                    wallMaterial: preParsedData.wallMaterial,
                    parsedAt: new Date().toISOString()
                };
            } else {
                project = await this._parseWithAI(userMessage);
                if (!project || !project.rooms || project.rooms.length === 0) {
                    project = await this.parser.parse(userMessage);
                }
            }

            // Step 1.5: Capacity check
            const totalCapacity = this._getTotalCapacity(project);
            if (totalCapacity > 500) {
                const hasRoomCount = project.roomCount || (project.rooms && project.rooms.length > 1);
                if (!hasRoomCount) {
                    const roomCountQuestion = this.infoValidator.generateRoomCountQuestion(totalCapacity, 'fa');
                    this._pendingProject = project;
                    this._pendingCapacity = totalCapacity;
                    return {
                        success: true, type: 'room_count_question', message: roomCountQuestion.text,
                        question: roomCountQuestion, awaitingRoomCount: true, totalCapacity: totalCapacity
                    };
                }
                if (project.roomCount && (!project.rooms || project.rooms.length <= 1)) {
                    project.rooms = this._splitCapacityIntoRooms(totalCapacity, project.roomCount, project);
                }
            }

            // Step 2: Run Calculations
            console.log('⚙️ Running calculations...');
            const results = await this.engine.calculate(project);
            
            // 🚨 CRITICAL FIX: Ensure equipment are arrays to prevent crash
            this._normalizeArrays(results);

            console.log('🌍 Fetching regional data...');
            const regionalData = await GlobalDataFetcher.fetchRegionalData(project.location);

            console.log('⚡ Analyzing innovative energy strategies...');
            const energyStrategies = await InnovativeEnergyStrategies.analyzeStrategies(
                { summary: results.summary, loads: results.calculations?.loads || [], equipment: results.calculations },
                regionalData
            ).catch(e => []);

            console.log('⚙️ Running energy optimization...');
            const energyModule = this.engine.getModule('energy');
            const energyAnalysis = energyModule ? await energyModule.analyze(results, project) : null;

            console.log('📜 Checking regional standards...');
            const regionalModule = this.engine.getModule('regional');
            const standards = regionalModule ? regionalModule.getStandards(project) : null;

            // Step 7: Generate response
            const response = this._generateResponse(results, energyAnalysis, standards, project, regionalData, energyStrategies);

            // 🌟 Add Async AI P&ID Data
            console.log('🎨 Generating AI P&ID...');
            response.pidData = await this._generatePIDData(results, project);

            response.executionTime = Date.now() - startTime;
            return response;

        } catch (error) {
            console.error('❌ Design error:', error.message);
            return { success: false, error: error.message, executionTime: Date.now() - startTime };
        }
    }

    _generateResponse(results, energyAnalysis, standards, project, regionalData, energyStrategies) {
        return {
            success: true,
            project: { name: project.name, location: project.location, refrigerant: project.refrigerant, roomCount: project.rooms?.length || 0 },
            summary: results.summary,
            projectInfo: { name: project.name, location: project.location, refrigerant: project.refrigerant, rooms: project.rooms || [] },
            calculations: results.calculations || {},
            compliance: { standards: standards || {}, safety: results.safety || {} },
            loads: (results.calculations?.loads || []).map(l => ({
                room: l.roomName, temperature: l.temperature, load: l.total,
                breakdown: { transmission: l.transmission?.total || 0, product: l.product?.total || 0, infiltration: l.infiltration?.total || 0, internal: l.internal?.total || 0 }
            })),
            equipment: {
                evaporators: results.calculations?.evaporators || [],
                compressors: results.calculations?.compressors || [],
                condensers: results.calculations?.condensers || [],
                separators: results.calculations?.separators || [],
                receiver: results.calculations?.receiver || null,
            },
            piping: results.calculations?.piping?.summary || {},
            regionalData: regionalData,
            innovativeEnergyStrategies: energyStrategies,
            energy: energyAnalysis,
            standards: standards,
            safety: results.safety || {},
            pidData: null, // Set externally via async
            fullResults: results
        };
    }

    async _generatePIDData(results, project) {
        try {
            // 🚨 Use correct path to generative Advanced Generator
            const AdvancedPIDGenerator = require('../../services/generative/AdvancedPIDGenerator');
            const generator = new AdvancedPIDGenerator();
            const layout = await generator.generate(results, project);

            return {
                equipment: layout.nodes, 
                pipes: layout.edges,
                valves: [],
                instruments: [],
                metadata: layout.metadata,
                refrigerant: project.refrigerant,
                projectName: project.name
            };
        } catch (error) {
            console.error('❌ PID Generation failed:', error.message);
            return { equipment: [], pipes: [], refrigerant: project.refrigerant, error: error.message };
        }
    }

    async handleMessage(userMessage, sessionId = 'default') {
        const startTime = Date.now();
        try {
            let conversation = this.conversationState.get(sessionId) || { history: [], parsedInfo: {}, awaitingInfo: false, awaitingConfirmation: false };
            const classification = this.intentClassifier.classify(userMessage, { awaitingInfo: conversation.awaitingInfo, awaitingConfirmation: conversation.awaitingConfirmation });
            const entities = classification.entities || {};
            let response;

            switch (classification.intent) {
                case 'GREETING': response = this._handleGreeting(classification.language); break;
                case 'QUESTION': response = await this._handleQuestion(userMessage, classification); break;
                case 'CLARIFICATION': response = await this._handleClarification(userMessage, entities, conversation, classification); break;
                case 'CONFIRMATION': response = await this._handleConfirmation(conversation, classification); break;
                case 'MODIFICATION': response = this._handleModification(conversation, classification); break;
                case 'DESIGN_REQUEST': response = await this._handleDesignRequest(userMessage, entities, classification, conversation); break;
                default: response = this._handleUnknown(classification.language); break;
            }

            conversation.history.push({ timestamp: new Date(), userMessage, intent: classification.intent, response: response.type });
            this.conversationState.set(sessionId, conversation);
            response.executionTime = Date.now() - startTime;
            response.sessionId = sessionId;
            return response;
        } catch (error) {
            console.error('❌ Message handling error:', error);
            return { success: false, type: 'error', error: error.message };
        }
    }

    _handleGreeting(lang) { return { success: true, type: 'greeting', message: 'Hello! I am ready to design.', language: lang }; }
    async _handleQuestion(msg, cls) { return { success: true, type: 'question_response', message: 'I can help with calculations.', language: cls.language }; }
    
    async _handleClarification(userMessage, entities, conversation, classification) {
        const fullInput = conversation.history.map(h => h.userMessage).join(' ') + ' ' + userMessage;
        const parsed = await this.parser.parse(fullInput);
        conversation.parsedInfo = { ...conversation.parsedInfo, ...parsed, entities: { ...conversation.parsedInfo.entities, ...entities } };
        
        if (entities.dimensions) conversation.parsedInfo.dimensions = entities.dimensions;
        if (entities.temperatures && entities.temperatures.length > 0) conversation.parsedInfo.temperature = entities.temperatures[0];
        if (entities.locations) conversation.parsedInfo.location = entities.locations;

        const validation = this.infoValidator.validate(conversation.parsedInfo);
        if (validation.isComplete) return await this._generateRecommendations(conversation, classification);
        else return this._askMissingInfo(validation, classification.language, conversation);
    }

    async _handleConfirmation(conversation, classification) {
        if (!conversation.parsedInfo || !conversation.recommendedRefrigerant) {
            return { success: false, type: 'error', message: 'No recommendations to confirm.', language: classification.language };
        }
        conversation.parsedInfo.refrigerant = conversation.recommendedRefrigerant.name || conversation.recommendedRefrigerant.id;
        conversation.parsedInfo.wallMaterial = conversation.recommendedMaterials;
        return await this.processRequest('', true, conversation.parsedInfo);
    }

    _handleModification(conversation, classification) {
        const entities = classification.entities || {};
        if (entities.refrigerant) {
            conversation.parsedInfo.refrigerant = entities.refrigerant;
            return this._generateRecommendations(conversation, classification);
        }
        return { success: true, type: 'refrigerant_selection', message: 'Select refrigerant:', awaitingRefrigerantSelection: true };
    }

    async _handleDesignRequest(userMessage, entities, classification, conversation) {
        const parsed = await this.parser.parse(userMessage);
        conversation.parsedInfo = { ...conversation.parsedInfo, ...parsed, entities: { ...conversation.parsedInfo.entities, ...entities } };
        
        const totalCapacity = this._getCapacityFromParsed(conversation.parsedInfo);
        if (totalCapacity > 500 && !conversation._roomCountAsked) {
            conversation._roomCountAsked = true;
            conversation._pendingCapacity = totalCapacity;
            return { success: true, type: 'room_count_question', message: 'Large capacity detected. How many rooms?', awaitingRoomCount: true };
        }

        const validation = this.infoValidator.validate(conversation.parsedInfo);
        if (validation.isComplete) return await this._generateRecommendations(conversation, classification);
        else return this._askMissingInfo(validation, classification.language, conversation);
    }

    async _generateRecommendations(conversation, classification) {
        const info = conversation.parsedInfo;
        let estimatedLoad = info.dimensions ? (info.dimensions.length || 10) * (info.dimensions.width || 10) * (info.dimensions.height || 3) * 2 : 100;
        const temperature = info.temperature || -20;
        const location = info.location || 'International';

        const matRec = this.materialRecommender.recommend({ temperature, location, roomDimensions: info.dimensions, applicationType: info.applicationType });
        const standards = getStandardsForLocation(location);

        let refRec;
        if (info.refrigerant || classification.entities?.refrigerant) {
            const req = info.refrigerant || classification.entities?.refrigerant;
            refRec = { recommended: { id: req, name: req, gwp: 0, safety: 'A1', userRequested: true }, alternatives: [] };
        } else {
            refRec = this.refrigerantRecommender.recommend({ coolingLoad: estimatedLoad, temperature, location, applicationType: info.applicationType });
        }

        conversation.recommendedRefrigerant = refRec.recommended;
        conversation.recommendedMaterials = matRec;
        conversation.awaitingConfirmation = true;
        conversation.awaitingInfo = false;

        return {
            success: true, type: 'recommendations', message: 'Recommendations ready. Type "confirm" to proceed.',
            projectSummary: { location: standards.country, temperature: `${temperature}°C`, estimatedLoad: `${estimatedLoad} kW` },
            refrigerant: refRec, materials: matRec, standards: standards, awaitingConfirmation: true
        };
    }

    _askMissingInfo(validation, language, conversation) {
        conversation.awaitingInfo = true;
        return { success: true, type: 'info_request', message: 'I need more information.', missing: validation.missing };
    }

    _handleUnknown(lang) { return { success: true, type: 'unknown', message: 'I did not understand.', language: lang }; }
    async _parseWithAI(msg) { return null; }
    _getTotalCapacity(project) { return project.capacity || 0; }
    _getCapacityFromParsed(info) { return info.capacity || 0; }
    _splitCapacityIntoRooms(total, count, project) {
        const rooms = []; const capPerRoom = Math.ceil(total / count);
        for(let i=0; i<count; i++) rooms.push({ name: `Room ${i+1}`, capacity: capPerRoom, temperature: -18 });
        return rooms;
    }
}

module.exports = DesignOrchestrator;