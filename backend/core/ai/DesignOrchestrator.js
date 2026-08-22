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
const AIModelRouter = require('../../services/AIModelRouter');
const OllamaService = require('../../services/OllamaService');
const RefrigerationTopologyInterpreter = require('../engineering/RefrigerationTopologyInterpreter');
const LearningGovernanceService = require('./LearningGovernanceService');
const EnergyManagementService = require('../modules/EnergyManagementService');

class DesignOrchestrator {
    constructor({ learningStore = null } = {}) {
        this.engine = new RefrigerationEngine();
        this.parser = new InputParser();
        this.intentClassifier = new IntentClassifier();
        this.infoValidator = new RequiredInfoValidator();
        this.refrigerantRecommender = new RefrigerantRecommender();
        this.materialRecommender = new MaterialRecommender();
        this.gemini = new GeminiService();
        this.learningStore = learningStore;
        this.modelRouter = new AIModelRouter({ geminiService: this.gemini, learningStore });
        this.ollama = new OllamaService();
        this.topologyInterpreter = new RefrigerationTopologyInterpreter();
        this.learningGovernance = new LearningGovernanceService();
        this.energyManagement = new EnergyManagementService();
        this.conversationState = new Map();

        console.log('🎯 DesignOrchestrator v4.0 initialized with AI Captain');
    }

    async _parseIntakeWithProvenance(userMessage) {
        const deterministic = await this.parser.parse(userMessage);
        const aiProject = await this._parseWithAI(userMessage);
        if (aiProject?.aiProvenance?.provider) {
            console.log(`🤖 Design intake provider: ${aiProject.aiProvenance.provider} · ${aiProject.aiProvenance.model || 'configured model'} · ${aiProject.aiProvenance.profile || 'default profile'}`);
        } else {
            console.warn('⚠️ Design intake AI extraction returned no structured provenance; deterministic extraction remains active and missing fields will be requested.');
        }
        const aiLocation = aiProject && typeof aiProject.location === 'object' ? aiProject.location : null;
        const explicitLocation = deterministic.location || aiLocation || null;
        const explicitProduct = deterministic.product || (typeof aiProject?.product === 'string' ? { type: aiProject.product } : aiProject?.product) || null;
        const explicitRoomCount = deterministic.roomCount || Number(aiProject?.roomCount) || null;
        const explicitCapacityTons = deterministic.storageCapacityTons || Number(aiProject?.storageCapacityTons) || null;
        const explicitDimensions = deterministic.dimensions || aiProject?.dimensions || null;
        const explicitTemperature = deterministic.temperature ?? aiProject?.temperature ?? null;
        const explicitApplicationType = aiProject?.applicationType || deterministic.applicationType || null;
        const rawCoolingLoadPerRoomKW = [deterministic.coolingLoadPerRoomKW, aiProject?.coolingLoadPerRoomKW]
            .find((value) => Number.isFinite(Number(value)) && Number(value) > 0);
        const rawSpecifiedCoolingLoadKW = [deterministic.specifiedCoolingLoadKW, aiProject?.specifiedCoolingLoadKW]
            .find((value) => Number.isFinite(Number(value)) && Number(value) > 0);
        const aiOperatingConditions = aiProject?.operatingConditions && typeof aiProject.operatingConditions === 'object' ? aiProject.operatingConditions : {};

        return {
            ...deterministic,
            name: deterministic.name !== 'New Project' ? deterministic.name : (aiProject?.name || deterministic.name),
            location: explicitLocation,
            product: explicitProduct,
            roomCount: Number.isInteger(explicitRoomCount) && explicitRoomCount > 0 ? explicitRoomCount : null,
            storageCapacityTons: Number.isFinite(explicitCapacityTons) && explicitCapacityTons > 0 ? explicitCapacityTons : null,
            coolingLoadPerRoomKW: Number.isFinite(Number(rawCoolingLoadPerRoomKW)) && Number(rawCoolingLoadPerRoomKW) > 0 ? Number(rawCoolingLoadPerRoomKW) : null,
            dimensions: explicitDimensions,
            temperature: Number.isFinite(Number(explicitTemperature)) ? Number(explicitTemperature) : null,
            applicationType: explicitApplicationType,
            refrigerant: deterministic.refrigerant || aiProject?.refrigerant || null,
            specifiedCoolingLoadKW: Number.isFinite(Number(rawSpecifiedCoolingLoadKW)) && Number(rawSpecifiedCoolingLoadKW) > 0 ? Number(rawSpecifiedCoolingLoadKW) : null,
            operatingConditions: { ...aiOperatingConditions, ...(deterministic.operatingConditions || {}) },
            aiProvenance: aiProject?.aiProvenance || null
        };
    }

    async _persistSemanticObservation(project, semanticCycle) {
        if (!this.learningStore || typeof this.learningStore.record !== 'function') return;
        const evidence = {
            refrigerant: project?.refrigerant || null,
            cycleTemplate: semanticCycle?.template?.id || null,
            compressorFamily: semanticCycle?.compressorFamily || null,
            condenserType: semanticCycle?.condenserType || null,
            feedMethod: semanticCycle?.feedMethod || null,
            semanticValid: Boolean(semanticCycle?.validation?.valid),
            engineeringReviewRequired: Boolean(semanticCycle?.validation?.engineeringReviewRequired)
        };
        try {
            await this.learningStore.record({ kind: 'design-semantic-observation', source: 'design-orchestrator', evidence, metadata: { refrigerantSpecific: true, deterministicEngineRemainsAuthoritative: true } });
        } catch (error) {
            console.warn('Automatic design observation persistence failed:', error.message);
        }
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
                    location: preParsedData.location || null,
                    refrigerant: preParsedData.refrigerant || null,
                    product: preParsedData.product || null,
                    rooms: Array.isArray(preParsedData.rooms) ? preParsedData.rooms : [],
                    roomCount: Number.isInteger(preParsedData.roomCount) ? preParsedData.roomCount : null,
                    storageCapacityTons: Number.isFinite(Number(preParsedData.storageCapacityTons)) ? Number(preParsedData.storageCapacityTons) : null,
                    coolingLoadPerRoomKW: Number.isFinite(Number(preParsedData.coolingLoadPerRoomKW)) ? Number(preParsedData.coolingLoadPerRoomKW) : null,
                    dimensions: preParsedData.dimensions || null,
                    temperature: Number.isFinite(Number(preParsedData.temperature)) ? Number(preParsedData.temperature) : null,
                    applicationType: preParsedData.applicationType || null,
                    requirements: preParsedData.requirements || [],
                    designIntent: preParsedData.designIntent || {},
                    capacity: Number(preParsedData.specifiedCoolingLoadKW) || null,
                    specifiedCoolingLoadKW: Number(preParsedData.specifiedCoolingLoadKW) || null,
                    operatingConditions: preParsedData.operatingConditions || {},
                    climate: preParsedData.climate || null,
                    plantLayout: preParsedData.plantLayout || null,
                    designBasis: preParsedData.designBasis || null,
                    wallMaterial: preParsedData.wallMaterial,
                    aiProvenance: preParsedData.aiProvenance || null,
                    parsedAt: new Date().toISOString()
                };
            } else {
                project = await this._parseWithAI(userMessage);
                if (!project || !project.rooms || project.rooms.length === 0) {
                    project = await this.parser.parse(userMessage);
                }
            }

            // Step 1.25: Preserve explicit process/cycle intent as a deterministic
            // semantic contract before any load-based equipment fallback runs.
            project.semanticCycle = this.topologyInterpreter.interpret(project);
            // The database records observed semantic patterns automatically. The legacy
            // proposal remains only for controlled engineering-rule or skill promotion.
            await this._persistSemanticObservation(project, project.semanticCycle);
            project.learningProposal = this.learningGovernance.propose({ project, semanticCycle: project.semanticCycle });

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
            const synchronization = this.engine.synchronizeFullSystem(results, response.pidData);
            results.synchronization = synchronization;
            response.synchronization = synchronization;
            response.bom = synchronization.bom;
            response.equipmentRegister = synchronization.equipment;
            response.pipingRegister = synchronization.piping;

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
            project: { name: project.name, location: project.location, refrigerant: project.refrigerant, roomCount: project.rooms?.length || 0, designBasisStatus: project.designBasis?.status || 'not-provided' },
            designBasis: project.designBasis || null,
            semanticCycle: project.semanticCycle || null,
            learningProposal: project.learningProposal || null,
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
            energyManagement: this.energyManagement.build(results, project),
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
            let conversation = this.conversationState.get(sessionId) || { history: [], parsedInfo: {}, awaitingInfo: false, awaitingRoomCount: false, awaitingConfirmation: false };
            const classification = this.intentClassifier.classify(userMessage, { awaitingInfo: conversation.awaitingInfo, awaitingRoomCount: conversation.awaitingRoomCount, awaitingConfirmation: conversation.awaitingConfirmation });
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
        if (conversation.awaitingDesignBasisAmendment && conversation.designBasisProposal) {
            conversation.designBasisProposal = this._applyDesignBasisAmendment(conversation.designBasisProposal, userMessage);
            conversation.awaitingDesignBasisAmendment = false;
            conversation.awaitingInfo = false;
            conversation.awaitingConfirmation = true;
            return {
                success: true,
                type: 'design_basis_proposal',
                message: 'Design Basis revised. Review the marked user amendments and confirm to run the preliminary component-load calculation.',
                designBasis: conversation.designBasisProposal,
                refrigerant: { recommended: conversation.recommendedRefrigerant || null },
                aiProvenance: conversation.parsedInfo.aiProvenance || null,
                awaitingConfirmation: true
            };
        }
        const fullInput = conversation.history.map(h => h.userMessage).join(' ') + ' ' + userMessage;
        const parsed = await this.parser.parse(fullInput);
        conversation.parsedInfo = {
            ...conversation.parsedInfo,
            ...parsed,
            entities: { ...conversation.parsedInfo.entities, ...entities },
            location: parsed.location || conversation.parsedInfo.location || null,
            product: parsed.product || conversation.parsedInfo.product || null,
            refrigerant: parsed.refrigerant || entities.refrigerant || conversation.parsedInfo.refrigerant || null,
            roomCount: entities.roomCount || parsed.roomCount || conversation.parsedInfo.roomCount || null,
            coolingLoadPerRoomKW: entities.coolingLoadPerRoomKW || parsed.coolingLoadPerRoomKW || conversation.parsedInfo.coolingLoadPerRoomKW || null,
            dimensions: entities.dimensions || parsed.dimensions || conversation.parsedInfo.dimensions || null,
            temperature: entities.temperatures?.[0] ?? parsed.temperature ?? conversation.parsedInfo.temperature ?? null,
            applicationType: entities.applicationType || parsed.applicationType || conversation.parsedInfo.applicationType || null,
            aiProvenance: conversation.parsedInfo.aiProvenance || null
        };
        if (conversation.parsedInfo.roomCount) conversation.awaitingRoomCount = false;
        if (entities.locations) conversation.parsedInfo.location = { city: entities.locations, country: null };

        const validation = this.infoValidator.validate(conversation.parsedInfo);
        if (validation.isComplete) return await this._generateRecommendations(conversation, classification);
        return this._askMissingInfo(validation, classification.language, conversation);
    }

    _canonicalRefrigerantCode(value) {
        const normalized = String(value || '').trim().toUpperCase().replace(/\s+/g, '').replace(/^R-/, 'R');
        const supported = new Set(['R717', 'R744', 'R290', 'R32', 'R404A', 'R410A', 'R134A', 'R22']);
        if (!supported.has(normalized)) return null;
        return normalized === 'R134A' ? 'R134a' : normalized;
    }

    _materializeExplicitRooms(info) {
        const existingRooms = Array.isArray(info?.rooms) ? info.rooms.filter(Boolean) : [];
        const declaredPerRoomLoad = Number(info?.coolingLoadPerRoomKW);
        const hasDeclaredPerRoomLoad = Number.isFinite(declaredPerRoomLoad) && declaredPerRoomLoad > 0;
        if (existingRooms.length) {
            return existingRooms.map((room) => {
                const roomLoad = Number(room.specifiedCoolingLoadKW);
                const hasRoomLoad = Number.isFinite(roomLoad) && roomLoad > 0;
                return {
                    ...room,
                    specifiedCoolingLoadKW: hasRoomLoad ? roomLoad : (hasDeclaredPerRoomLoad ? declaredPerRoomLoad : null),
                    designLoadBasis: hasRoomLoad ? (room.designLoadBasis || 'user-specified-room-design-load') : (hasDeclaredPerRoomLoad ? 'user-specified-per-room-design-load' : null)
                };
            });
        }
        const dimensions = info?.dimensions;
        const length = Number(dimensions?.length);
        const width = Number(dimensions?.width);
        const height = Number(dimensions?.height);
        const temperature = Number(info?.temperature);
        if (![length, width, height, temperature].every(Number.isFinite) || length <= 0 || width <= 0 || height <= 0) return [];
        const requestedCount = Number(info?.roomCount);
        const count = Number.isInteger(requestedCount) && requestedCount > 0 ? requestedCount : 1;
        return Array.from({ length: count }, (_, index) => ({
            id: `intake-room-${index + 1}`,
            name: `User-defined Room ${index + 1}`,
            type: info.applicationType || 'cold_storage_frozen',
            length,
            width,
            height,
            temperature,
            specifiedCoolingLoadKW: Number.isFinite(Number(info.coolingLoadPerRoomKW)) && Number(info.coolingLoadPerRoomKW) > 0 ? Number(info.coolingLoadPerRoomKW) : null,
            designLoadBasis: Number.isFinite(Number(info.coolingLoadPerRoomKW)) && Number(info.coolingLoadPerRoomKW) > 0 ? 'user-specified-per-room-design-load' : null,
            source: 'user-explicit-intake'
        }));
    }

    _askPerRoomDesignLoad(conversation, language) {
        conversation.awaitingConfirmation = false;
        conversation.awaitingInfo = true;
        const prompts = {
            fa: 'برای اجرای محاسبات، بار برودتی طراحی هر اتاق را بر حسب kW وارد کنید. ظرفیت ذخیره‌سازی (تن) جایگزین بار برودتی نیست.',
            en: 'To run calculations, provide the design cooling load for each room in kW. Storage capacity in tonnes is not a substitute for cooling load.',
            ar: 'لتنفيذ الحسابات، أدخل حمل التبريد التصميمي لكل غرفة بوحدة kW. سعة التخزين بالطن ليست بديلاً عن حمل التبريد.'
        };
        return {
            success: true,
            type: 'info_request',
            message: prompts[language] || prompts.en,
            completeness: 100,
            filled: [],
            missing: [{ field: 'coolingLoadPerRoomKW' }],
            questions: [{
                field: 'coolingLoadPerRoomKW',
                text: prompts[language] || prompts.en,
                placeholder: 'e.g., 150 kW per room',
                required: true
            }]
        };
    }

    async _handleConfirmation(conversation, classification) {
        if (!conversation.parsedInfo || !conversation.recommendedRefrigerant) {
            return { success: false, type: 'error', message: 'No Design Basis proposal is available to confirm.', language: classification.language };
        }
        const basis = conversation.designBasisProposal;
        if (!basis || basis.status !== 'approval-required') {
            return { success: false, type: 'error', message: 'Design Basis approval is required before calculation.', language: classification.language };
        }
        const rooms = this._materializeDesignBasisRooms(conversation.parsedInfo, basis);
        if (!rooms.length) {
            return { success: false, type: 'error', message: 'Explicit room length, width, height and temperature are required before the approved Design Basis can be calculated.', language: classification.language };
        }
        // The calculation engine accepts canonical refrigerant codes (for example
        // R717), never a display label such as Ammonia (NH₃) or a dashed R-717 alias.
        const refrigerant = this._canonicalRefrigerantCode(conversation.recommendedRefrigerant.id || conversation.recommendedRefrigerant.name);
        if (!refrigerant) {
            return { success: false, type: 'error', message: 'The recommended refrigerant does not map to a supported canonical code.', language: classification.language };
        }
        const approvedBasis = {
            ...basis,
            status: 'user-confirmed',
            approvedAt: new Date().toISOString(),
            assumptions: basis.assumptions.map((assumption) => ({ ...assumption, status: 'user-confirmed' }))
        };
        conversation.parsedInfo = {
            ...conversation.parsedInfo,
            rooms,
            refrigerant,
            wallMaterial: conversation.recommendedMaterials,
            climate: approvedBasis.calculationInputs.climate,
            operatingConditions: { ...conversation.parsedInfo.operatingConditions, ...approvedBasis.calculationInputs.operatingConditions },
            plantLayout: approvedBasis.calculationInputs.plantLayout,
            designBasis: approvedBasis
        };
        conversation.designBasisProposal = approvedBasis;
        return await this.processRequest('', true, conversation.parsedInfo);
    }

    _handleModification(conversation, classification) {
        const entities = classification.entities || {};
        if (entities.refrigerant) {
            conversation.parsedInfo.refrigerant = entities.refrigerant;
            return this._generateRecommendations(conversation, classification);
        }
        if (conversation.designBasisProposal) {
            conversation.awaitingDesignBasisAmendment = true;
            conversation.awaitingInfo = true;
            conversation.awaitingConfirmation = false;
            return {
                success: true,
                type: 'info_request',
                message: 'Describe the Design Basis change. State the parameter and unit; for example: "summer dry bulb 32 C; door openings 12 per day; insulation 175 mm".',
                completeness: 100,
                filled: [{ field: 'designBasis', value: 'proposal available' }],
                missing: [{ field: 'designBasisAmendment' }],
                questions: [{ field: 'designBasisAmendment', text: 'Which Design Basis parameters should change? Include values and units.', required: true, placeholder: 'e.g., summer dry bulb 32 C; door openings 12 per day; insulation 175 mm' }]
            };
        }
        return { success: true, type: 'refrigerant_selection', message: 'Select refrigerant:', awaitingRefrigerantSelection: true };
    }

    async _handleDesignRequest(userMessage, entities, classification, conversation) {
        const parsed = await this._parseIntakeWithProvenance(userMessage);
        conversation.parsedInfo = {
            ...conversation.parsedInfo,
            ...parsed,
            entities: { ...conversation.parsedInfo.entities, ...entities },
            refrigerant: parsed.refrigerant || entities.refrigerant || conversation.parsedInfo.refrigerant || null,
            roomCount: entities.roomCount || parsed.roomCount || conversation.parsedInfo.roomCount || null,
            coolingLoadPerRoomKW: entities.coolingLoadPerRoomKW || parsed.coolingLoadPerRoomKW || conversation.parsedInfo.coolingLoadPerRoomKW || null,
            dimensions: entities.dimensions || parsed.dimensions || conversation.parsedInfo.dimensions || null,
            temperature: entities.temperatures?.[0] ?? parsed.temperature ?? conversation.parsedInfo.temperature ?? null,
            applicationType: entities.applicationType || parsed.applicationType || conversation.parsedInfo.applicationType || null
        };

        const totalCapacity = this._getCapacityFromParsed(conversation.parsedInfo);
        if (totalCapacity > 500 && !conversation.parsedInfo.roomCount) {
            conversation._roomCountAsked = true;
            conversation.awaitingRoomCount = true;
            conversation._pendingCapacity = totalCapacity;
            const question = this.infoValidator.generateRoomCountQuestion(totalCapacity, classification.language);
            return { success: true, type: 'room_count_question', message: question?.text || 'Large capacity detected. How many rooms?', question, awaitingRoomCount: true, totalCapacity };
        }

        const validation = this.infoValidator.validate(conversation.parsedInfo);
        if (validation.isComplete) return await this._generateRecommendations(conversation, classification);
        return this._askMissingInfo(validation, classification.language, conversation);
    }

    _designBasisAssumption(id, label, value, unit, source, affects, requiredForFinalSelection = true) {
        return { id, label, value, unit, source, affects, status: 'assumption-proposed', editable: true, requiredForFinalSelection };
    }

    _proposedInsulationThicknessMm(temperatureC) {
        if (temperatureC <= -35) return 200;
        if (temperatureC <= -25) return 175;
        if (temperatureC <= -18) return 150;
        if (temperatureC <= -10) return 120;
        return 100;
    }

    _applyDesignBasisAmendment(basis, userMessage) {
        const amended = JSON.parse(JSON.stringify(basis));
        const message = String(userMessage || '');
        const numberAfter = (...patterns) => {
            for (const pattern of patterns) {
                const match = message.match(pattern);
                if (match && Number.isFinite(Number(match[1]))) return Number(match[1]);
            }
            return null;
        };
        const markAmended = (id, value) => {
            const assumption = amended.assumptions?.find((item) => item.id === id);
            if (assumption) {
                assumption.value = value;
                assumption.status = 'user-amended';
                assumption.source = `User amendment: ${message}`;
            }
        };
        const dryBulb = numberAfter(/(?:summer\s*(?:dry\s*bulb|db)|ambient\s*(?:dry\s*bulb)?|دمای\s*خشک)\s*(?:=|:|to)?\s*(-?\d+(?:\.\d+)?)/i);
        if (dryBulb !== null) { amended.calculationInputs.climate.summerDB = dryBulb; markAmended('climate-summer-db', dryBulb); }
        const wetBulb = numberAfter(/(?:summer\s*(?:wet\s*bulb|wb)|دمای\s*تر)\s*(?:=|:|to)?\s*(-?\d+(?:\.\d+)?)/i);
        if (wetBulb !== null) { amended.calculationInputs.climate.summerWB = wetBulb; markAmended('climate-summer-wb', wetBulb); }
        const ground = numberAfter(/(?:ground\s*(?:temperature)?|دمای\s*زمین)\s*(?:=|:|to)?\s*(-?\d+(?:\.\d+)?)/i);
        if (ground !== null) { amended.calculationInputs.climate.groundTemperatureC = ground; markAmended('ground-temperature', ground); }
        const insulation = numberAfter(/(?:insulation|panel|عایق|پنل)\s*(?:=|:|to)?\s*(\d+(?:\.\d+)?)\s*(?:mm|میلی)/i);
        if (insulation !== null) { amended.calculationInputs.room.insulation.thickness = insulation; markAmended('insulation', amended.calculationInputs.room.insulation); }
        const floorFactor = numberAfter(/(?:floor\s*(?:u[-\s]?factor|factor)|ضریب\s*کف)\s*(?:=|:|to)?\s*(\d+(?:\.\d+)?)/i);
        if (floorFactor !== null && floorFactor > 0) { amended.calculationInputs.room.floorUFactor = floorFactor; markAmended('floor-u-factor', floorFactor); }
        const openings = numberAfter(/(?:door\s*openings?|openings?\s*per\s*day|دفعات\s*باز\s*شدن)\s*(?:=|:|to)?\s*(\d+(?:\.\d+)?)/i);
        if (openings !== null && openings >= 0) { amended.calculationInputs.room.door.openingsPerDay = openings; markAmended('door-operation', { ...amended.calculationInputs.room.door, protectionFactor: amended.calculationInputs.room.doorProtection }); }
        const openDuration = numberAfter(/(?:open\s*duration|door\s*duration|مدت\s*باز\s*بودن)\s*(?:=|:|to)?\s*(\d+(?:\.\d+)?)/i);
        if (openDuration !== null && openDuration >= 0) { amended.calculationInputs.room.door.openDuration = openDuration; markAmended('door-operation', { ...amended.calculationInputs.room.door, protectionFactor: amended.calculationInputs.room.doorProtection }); }
        const protection = numberAfter(/(?:door\s*protection|protection\s*factor|ضریب\s*حفاظت)\s*(?:=|:|to)?\s*(0?(?:\.\d+)?|1(?:\.0+)?)/i);
        if (protection !== null && protection > 0 && protection <= 1) { amended.calculationInputs.room.doorProtection = protection; markAmended('door-operation', { ...amended.calculationInputs.room.door, protectionFactor: protection }); }
        const evaporating = numberAfter(/(?:evaporating\s*(?:temperature|temp)?|te\b|دمای\s*تبخیر)\s*(?:=|:|to)?\s*(-?\d+(?:\.\d+)?)/i);
        if (evaporating !== null) { amended.calculationInputs.operatingConditions.evaporatingTemperatureC = evaporating; markAmended('cycle-setpoints', { ...amended.assumptions.find((item) => item.id === 'cycle-setpoints')?.value, evaporatingTemperatureC: evaporating }); }
        const condensing = numberAfter(/(?:condensing\s*(?:temperature|temp)?|tc\b|دمای\s*تقطیر)\s*(?:=|:|to)?\s*(-?\d+(?:\.\d+)?)/i);
        if (condensing !== null) { amended.calculationInputs.operatingConditions.condensingTemperatureC = condensing; markAmended('cycle-setpoints', { ...amended.assumptions.find((item) => item.id === 'cycle-setpoints')?.value, condensingTemperatureC: condensing }); }
        amended.status = 'approval-required';
        amended.amendedAt = new Date().toISOString();
        amended.amendmentSource = message;
        return amended;
    }

    async _buildDesignBasisProposal(info, language) {
        const regionalData = await GlobalDataFetcher.fetchRegionalData(info.location);
        const roomTemperatureC = Number(info.temperature);
        const regionalClimate = regionalData?.climate || {};
        const summerDesign = regionalClimate.summerDesign || {};
        const ambientDryBulbC = Number.isFinite(Number(summerDesign.temp)) ? Number(summerDesign.temp) : null;
        const ambientWetBulbC = Number.isFinite(Number(summerDesign.wetBulb)) ? Number(summerDesign.wetBulb) : null;
        const groundTemperatureC = Number.isFinite(Number(regionalClimate.avgTemp)) ? Number(regionalClimate.avgTemp) : null;
        const insulationThicknessMm = this._proposedInsulationThicknessMm(roomTemperatureC);
        const evaporatingTemperatureC = Number.isFinite(roomTemperatureC) ? roomTemperatureC - 8 : null;
        const condensingTemperatureC = ambientWetBulbC !== null ? ambientWetBulbC + 10 : null;
        const locationSource = regionalData?.dataSource ? `GlobalRegionalData (${regionalData.dataSource}; location key: ${regionalData.location || 'unknown'})` : 'location data unavailable';
        const productType = info.product?.type || info.productType || null;
        const roomInputs = {
            insulation: { type: 'polyurethane_40', thickness: insulationThicknessMm },
            floorUFactor: 1,
            door: { width: 2.5, height: 3, openingsPerDay: 20, openDuration: 2 },
            doorProtection: 0.15,
            occupancy: 2,
            occupancyHours: 8,
            lightingPower: 10,
            lightingHours: 12,
            equipmentPower: 2,
            equipmentHours: 8,
            product: { type: productType, dailyThroughput: 0, entryTemp: roomTemperatureC }
        };
        const assumptions = [
            this._designBasisAssumption('climate-summer-db', 'Outdoor summer dry-bulb', ambientDryBulbC, '°C', locationSource, ['transmission', 'infiltration']),
            this._designBasisAssumption('climate-summer-wb', 'Outdoor summer wet-bulb', ambientWetBulbC, '°C', locationSource, ['condensing-setpoint']),
            this._designBasisAssumption('ground-temperature', 'Ground boundary temperature', groundTemperatureC, '°C', `${locationSource}; proposed as annual-average proxy`, ['floor-transmission']),
            this._designBasisAssumption('insulation', 'Wall and ceiling insulation', roomInputs.insulation, 'material / mm', 'Cool-Assist material library; thickness is a proposed design assumption', ['transmission']),
            this._designBasisAssumption('floor-u-factor', 'Floor U-factor multiplier relative to wall U-value', roomInputs.floorUFactor, 'ratio', 'Proposed pending construction detail', ['floor-transmission']),
            this._designBasisAssumption('door-operation', 'Door operating profile per room', { ...roomInputs.door, protectionFactor: roomInputs.doorProtection }, 'm / events/day / min / factor', 'Proposed operational profile; strip-curtain factor is an assumption', ['infiltration']),
            this._designBasisAssumption('internal-gains', 'Internal gains per room', { occupancy: roomInputs.occupancy, occupancyHours: roomInputs.occupancyHours, lightingPower: roomInputs.lightingPower, lightingHours: roomInputs.lightingHours, equipmentPower: roomInputs.equipmentPower, equipmentHours: roomInputs.equipmentHours }, 'people / h/day / W·m⁻² / kW', 'Proposed operational profile', ['internal-load']),
            this._designBasisAssumption('product-throughput', 'Product process basis', roomInputs.product, 'kg/day / °C', 'Proposed frozen-storage basis: no daily product pull-down; change for receiving, freezing, blast or IQF duty', ['product-load']),
            this._designBasisAssumption('cycle-setpoints', 'Preliminary cycle setpoints', { evaporatingTemperatureC, condensingTemperatureC, evaporatorTDK: 8, evaporativeCondenserApproachK: 10 }, '°C / K', 'Proposed for confirmation; not a manufacturer selection point', ['thermophysical-cycle']),
            this._designBasisAssumption('redundancy-control', 'Redundancy and control policy', { policy: 'N+1 pending owner confirmation', control: 'capacity-staging-and-VFD-pending-map' }, 'policy', 'Owner/design review required', ['equipment-train', 'energy']),
            this._designBasisAssumption('layout-npsh', 'BIM elevation and pump NPSH data', { datum: null, equipmentElevations: null, pumpNPSHr: null, suctionLineLoss: null }, 'm / m liquid / Pa', 'User/supplier input required; no automatic elevation placement is permitted', ['BIM-layout', 'pump-hydraulics'])
        ];
        return {
            schemaVersion: '1.0.0',
            id: `design-basis-${Date.now()}`,
            status: 'approval-required',
            proposalMode: 'component-load-calculation',
            language,
            parsedFacts: { location: info.location || null, product: productType, applicationType: info.applicationType || null, roomCount: info.roomCount || null, roomDimensions: info.dimensions || null, storageTemperatureC: Number.isFinite(roomTemperatureC) ? roomTemperatureC : null, requestedRefrigerant: info.refrigerant || null, declaredCoolingLoadKW: Number.isFinite(Number(info.coolingLoadPerRoomKW)) && Number(info.coolingLoadPerRoomKW) > 0 ? Number(info.coolingLoadPerRoomKW) : null },
            assumptions,
            calculationInputs: {
                climate: { summerDB: ambientDryBulbC, summerWB: ambientWetBulbC, groundTemperatureC },
                room: roomInputs,
                operatingConditions: { evaporatingTemperatureC, condensingTemperatureC },
                plantLayout: { datumElevationM: null, equipment: {}, pumpHydraulics: { npshRequiredM: null, suctionLineLossPa: null }, status: 'layout-input-required' }
            },
            gates: { calculation: 'user-confirmation-required', manufacturerSelection: 'manufacturer-performance-map-required', pipingSizing: 'hydraulic-input-required', BIMLayout: 'declared-elevation-and-NPSH-required' },
            statement: 'The proposed inputs are transparent, editable assumptions. Confirmation authorises a preliminary component-load calculation only; it does not approve procurement, final equipment selection, pipe DN or BIM elevations.'
        };
    }

    _materializeDesignBasisRooms(info, basis) {
        const rooms = this._materializeExplicitRooms(info);
        const roomInputs = basis?.calculationInputs?.room;
        if (!roomInputs) return [];
        return rooms.map((room) => ({
            ...room,
            insulation: roomInputs.insulation,
            floorUFactor: roomInputs.floorUFactor,
            door: roomInputs.door,
            doorProtection: roomInputs.doorProtection,
            occupancy: roomInputs.occupancy,
            occupancyHours: roomInputs.occupancyHours,
            lightingPower: roomInputs.lightingPower,
            lightingHours: roomInputs.lightingHours,
            equipmentPower: roomInputs.equipmentPower,
            equipmentHours: roomInputs.equipmentHours,
            product: { ...roomInputs.product, type: room.product?.type || roomInputs.product.type || info.product?.type || info.productType || null },
            designLoadBasis: room.designLoadBasis || 'approved-design-basis-component-calculation'
        }));
    }

    async _generateRecommendations(conversation, classification) {
        const info = conversation.parsedInfo;
        const rawEvaporatingTemperature = info.operatingConditions?.evaporatingTemperatureC;
        const explicitEvaporatingTemperature = rawEvaporatingTemperature === null || rawEvaporatingTemperature === undefined ? null : Number(rawEvaporatingTemperature);
        const explicitStorageTemperature = Number(info.temperature);
        const temperature = Number.isFinite(explicitEvaporatingTemperature) ? explicitEvaporatingTemperature : (Number.isFinite(explicitStorageTemperature) ? explicitStorageTemperature : null);
        const location = info.location || 'International';
        const standards = getStandardsForLocation(location);
        const matRec = this.materialRecommender.recommend({ temperature, location, roomDimensions: info.dimensions, applicationType: info.applicationType });
        let refRec;
        if (info.refrigerant || classification.entities?.refrigerant) {
            const req = info.refrigerant || classification.entities?.refrigerant;
            refRec = { recommended: { id: req, name: req, userRequested: true }, alternatives: [] };
        } else {
            refRec = this.refrigerantRecommender.recommend({ coolingLoad: null, temperature, location, applicationType: info.applicationType });
        }
        conversation.recommendedRefrigerant = refRec.recommended;
        conversation.recommendedMaterials = matRec;
        conversation.designBasisProposal = await this._buildDesignBasisProposal(info, classification.language);
        conversation.awaitingConfirmation = true;
        conversation.awaitingInfo = false;
        return {
            success: true,
            type: 'design_basis_proposal',
            message: 'Design Basis proposed. Review or change assumptions, then type "confirm" to calculate.',
            projectSummary: { location: standards.country, temperature: `${temperature}°C`, declaredCoolingLoad: info.coolingLoadPerRoomKW || null },
            refrigerant: refRec,
            materials: matRec,
            standards,
            designBasis: conversation.designBasisProposal,
            aiProvenance: info.aiProvenance || null,
            awaitingConfirmation: true
        };
    }

    _askMissingInfo(validation, language, conversation) {
        conversation.awaitingInfo = true;
        return {
            success: true,
            type: 'info_request',
            message: 'I need more information.',
            completeness: Math.round(Math.max(0, Math.min(1, validation.completenessScore || 0)) * 100),
            filled: validation.filled.map((item) => ({ field: item.field, value: item.value })),
            missing: validation.missing,
            questions: validation.missing.map((item) => this.infoValidator.generateQuestion(item.field, language))
        };
    }

    _handleUnknown(lang) { return { success: true, type: 'unknown', message: 'I did not understand.', language: lang }; }
    async _parseWithAI(msg) { return this.modelRouter.structuredProject(msg); }
    _getTotalCapacity(project) { return Number(project.storageCapacityTons) || 0; }
    _getCapacityFromParsed(info) { return Number(info.storageCapacityTons) || 0; }
    _splitCapacityIntoRooms(total, count, project) {
        const rooms = []; const capPerRoom = Math.ceil(total / count);
        for(let i=0; i<count; i++) rooms.push({ name: `Room ${i+1}`, capacity: capPerRoom, temperature: -18 });
        return rooms;
    }
}

module.exports = DesignOrchestrator;