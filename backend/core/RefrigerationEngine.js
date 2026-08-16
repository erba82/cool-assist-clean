/**
 * RefrigerationEngine - The Brain of Cool-Assist
 * 
 * This is the core calculation engine that performs all
 * deterministic engineering calculations. AI is just the operator
 * that interprets user input and orchestrates this engine.
 * 
 * Standards Compliance:
 * - ASHRAE Handbook (Load Calculations)
 * - EN 378-2 (Ammonia Safety)
 * - ISO 14617 (P&ID Symbols)
 * - ISO 10628 (Flow Diagrams)
 * 
 * @author GFDDE AI Engine
 * @version 2.0.0
 */

const EventEmitter = require('events');
const FullSystemSynchronizer = require('./engineering/FullSystemSynchronizer');

class RefrigerationEngine extends EventEmitter {
    constructor(options = {}) {
        super();

        this.version = '2.0.0';
        this.modules = new Map();
        this.data = new Map();
        this.standards = {};
        this.options = {
            defaultRefrigerant: 'R717',
            defaultStandard: 'ISO',
            ...options
        };

        // Initialize data stores
        this._initializeData();

        // Load calculation modules
        this._loadModules();
        this.fullSystemSynchronizer = new FullSystemSynchronizer();

        console.log(`🧊 RefrigerationEngine v${this.version} initialized`);
    }

    // ============================================================
    // INITIALIZATION
    // ============================================================

    _initializeData() {
        // Refrigerant database
        this.data.set('refrigerants', require('./data/refrigerants.json'));

        // Product thermal properties
        this.data.set('products', require('./data/products.json'));

        // Climate data by region
        this.data.set('climate', require('./data/climate.json'));

        // Material properties (insulation, walls)
        this.data.set('materials', require('./data/materials.json'));
    }

    _loadModules() {
        // Core calculation modules
        this.loadModule('load', require('./modules/LoadCalculator'));
        this.loadModule('evaporator', require('./modules/EvaporatorSelector'));
        this.loadModule('compressor', require('./modules/CompressorSelector'));
        this.loadModule('condenser', require('./modules/CondenserSelector'));
        this.loadModule('vessel', require('./modules/VesselSelector'));
        this.loadModule('piping', require('./modules/PipingCalculator'));

        // Optimization
        this.loadModule('energy', require('./modules/EnergyOptimizer'));

        // Standards validators
        this.loadModule('safety', require('./standards/SafetyValidator'));
        this.loadModule('regional', require('./standards/RegionalStandards'));
    }

    /**
     * Load a calculation module
     * @param {string} name - Module identifier
     * @param {class} ModuleClass - Module class
     */
    loadModule(name, ModuleClass) {
        try {
            const instance = new ModuleClass(this);
            this.modules.set(name, instance);
            this.emit('module:loaded', { name, module: instance });
        } catch (error) {
            console.warn(`⚠️ Module ${name} not loaded:`, error.message);
        }
    }

    /**
     * Get a loaded module
     * @param {string} name - Module identifier
     * @returns {CalculationModule}
     */
    getModule(name) {
        return this.modules.get(name);
    }

    /**
     * Get data from a data store
     * @param {string} key - Data store key
     * @returns {any}
     */
    getData(key) {
        return this.data.get(key);
    }

    // ============================================================
    // MAIN CALCULATION PIPELINE
    // ============================================================

    /**
     * Main calculation entry point
     * @param {Project} project - Project definition
     * @returns {DesignResults} Complete design results
     */
    async calculate(project) {
        this.emit('calculation:start', project);

        const startTime = Date.now();
        const results = {
            project: project,
            timestamp: new Date().toISOString(),
            version: this.version,
            calculations: {}
        };

        try {
            // Step 1: Validate project input
            this._validateProject(project);

            // Step 2: Apply regional defaults
            project = this._applyDefaults(project);

            // Step 3: Calculate cooling loads for each room
            results.calculations.loads = await this._calculateLoads(project);

            // Step 4: Group by temperature levels
            results.calculations.temperatureLevels = this._groupByTemperature(results.calculations.loads, project);

            // Step 5: Select evaporators
            results.calculations.evaporators = await this._selectEvaporators(
                results.calculations.loads,
                project
            );

            // Step 6: Select separators (vessels)
            results.calculations.separators = await this._selectSeparators(
                results.calculations.temperatureLevels,
                project
            );

            // Step 7: Select compressors
            results.calculations.compressors = await this._selectCompressors(
                results.calculations.temperatureLevels,
                project
            );

            // Step 8: Select condensers
            results.calculations.condensers = await this._selectCondensers(
                results.calculations.compressors,
                project
            );

            // Step 8.5: Select high pressure receiver
            results.calculations.receiver = await this._selectReceiver(
                results.calculations,
                project
            );

            // Step 8.6: Select thermosiphon vessel (oil cooling for screw compressors)
            results.calculations.thermosiphon = await this._selectThermosiphon(
                results.calculations.compressors,
                project
            );

            // Step 9: Size piping
            results.calculations.piping = await this._sizePiping(
                results.calculations,
                project
            );

            // Step 10: Safety validation
            results.safety = await this._validateSafety(results, project);

            // Step 11: Generate equipment list
            results.equipmentList = this._generateEquipmentList(results.calculations);

            // Step 12: Calculate totals
            results.summary = this._calculateSummary(results);
            // This initial record is refreshed with generated P&ID data by DesignOrchestrator.
            results.synchronization = this.synchronizeFullSystem(results, null);

            results.executionTime = Date.now() - startTime;
            this.emit('calculation:complete', results);

            return results;

        } catch (error) {
            this.emit('calculation:error', error);
            throw error;
        }
    }

    // ============================================================
    // CALCULATION STEPS
    // ============================================================

    synchronizeFullSystem(results, pidData = null) {
        if (!results || !results.project || !results.calculations) {
            throw new Error('A calculated design result with project and calculations is required for synchronization.');
        }
        return this.fullSystemSynchronizer.synchronize({
            project: results.project,
            calculations: results.calculations,
            pidData
        });
    }
    _validateProject(project) {
        if (!project) throw new Error('Project data is required');
        if (!project.rooms || !Array.isArray(project.rooms) || project.rooms.length === 0) {
            throw new Error('At least one room is required');
        }
        if (!project.location) throw new Error('Project location is required');
        const refrigerants = this.getData('refrigerants') || {};
        if (project.refrigerant && !refrigerants[project.refrigerant]) {
            throw new Error(`Unsupported refrigerant: ${project.refrigerant}. Supported refrigerants: ${Object.keys(refrigerants).join(', ')}`);
        }
    }

    _applyDefaults(project) {
        // Apply refrigerant default
        if (!project.refrigerant) {
            project.refrigerant = this.options.defaultRefrigerant;
        }

        // Apply climate data from location
        const climateData = this.getData('climate');
        if (climateData && project.location.city) {
            project.climate = climateData[project.location.city] ||
                climateData[project.location.country] ||
                climateData.default;
        }

        // Apply safety factors
        if (!project.safetyFactor) {
            project.safetyFactor = 1.15; // 15% safety margin
        }

        return project;
    }

    async _calculateLoads(project) {
        const loadModule = this.getModule('load');
        if (!loadModule) {
            throw new Error('LoadCalculator module not loaded');
        }

        const roomLoads = [];
        for (const room of project.rooms) {
            const load = await loadModule.calculateRoom(room, project);
            roomLoads.push({
                room: room,
                ...load
            });
        }

        return roomLoads;
    }

    _groupByTemperature(loads, project) {
        const groups = {};

        for (const load of loads) {
            const explicitEvapTemp = Number(project?.operatingConditions?.evaporatingTemperatureC);
            const evapTemp = Number.isFinite(explicitEvapTemp)
                ? explicitEvapTemp
                : this._getEvaporatingTemp(load.room.temperature);
            const key = `T${evapTemp}`;

            if (!groups[key]) {
                groups[key] = {
                    evaporatingTemp: evapTemp,
                    rooms: [],
                    totalLoad: 0
                };
            }

            groups[key].rooms.push(load);
            groups[key].totalLoad += load.total;
        }

        return groups;
    }

    _getEvaporatingTemp(roomTemp) {
        // Evaporating temperature is typically 8-10K below room temp
        const dt = roomTemp <= -35 ? 5 : roomTemp <= -20 ? 7 : 10;
        return roomTemp - dt;
    }

    async _selectEvaporators(loads, project) {
        const evapModule = this.getModule('evaporator');
        if (!evapModule) return loads.map(() => ({ selected: false }));

        const selections = [];
        for (const load of loads) {
            const selection = await evapModule.select(load, project);
            selections.push(selection);
        }
        return selections;
    }

    async _selectSeparators(temperatureLevels, project) {
        const vesselModule = this.getModule('vessel');
        if (!vesselModule) return [];

        const separators = [];
        for (const [key, level] of Object.entries(temperatureLevels)) {
            const separator = await vesselModule.selectSeparator(level, project);
            separators.push({
                temperatureLevel: key,
                ...separator
            });
        }
        return separators;
    }

    async _selectCompressors(temperatureLevels, project) {
        const compModule = this.getModule('compressor');
        if (!compModule) return [];

        const compressors = [];
        for (const [key, level] of Object.entries(temperatureLevels)) {
            const selection = await compModule.select(level, project);
            compressors.push({
                temperatureLevel: key,
                ...selection
            });
        }
        return compressors;
    }

    async _selectCondensers(compressors, project) {
        const condModule = this.getModule('condenser');
        if (!condModule) return [];

        // Sum total heat rejection
        const totalHeatRejection = compressors.reduce((sum, c) =>
            sum + (c.heatRejection || 0), 0);

        return await condModule.select(totalHeatRejection, project);
    }

    async _selectReceiver(calculations, project) {
        const vesselModule = this.getModule('vessel');
        if (!vesselModule) return null;

        // Calculate total system load for receiver sizing
        const totalLoad = calculations.compressors?.reduce((sum, c) =>
            sum + (c.designLoad || c.capacityPerUnit || 0), 0) || 0;

        return await vesselModule.selectReceiver({ totalLoad }, project);
    }

    async _selectThermosiphon(compressors, project) {
        const vesselModule = this.getModule('vessel');
        if (!vesselModule) return null;

        // Calculate total compressor power for thermosiphon sizing
        const totalPower = compressors?.reduce((sum, c) =>
            sum + (c.motorPower || c.electrical?.ratedPower || 100), 0) || 0;

        return await vesselModule.selectThermosiphon({
            totalPower,
            compressorCount: compressors?.length || 1,
            oilType: 'mineral'
        });
    }

    async _sizePiping(calculations, project) {
        const pipingModule = this.getModule('piping');
        if (!pipingModule) return {};

        return await pipingModule.size(calculations, project);
    }

    async _validateSafety(results, project) {
        const safetyModule = this.getModule('safety');
        if (!safetyModule) return { validated: false };

        return await safetyModule.validate(results, project);
    }

    _generateEquipmentList(calculations) {
        const equipment = [];

        // Add evaporators
        if (calculations.evaporators) {
            calculations.evaporators.forEach((e, i) => {
                if (e.model) {
                    equipment.push({
                        category: 'Evaporator',
                        tag: `EVAP-${String(i + 1).padStart(2, '0')}`,
                        ...e
                    });
                }
            });
        }

        // Add compressors
        if (calculations.compressors) {
            calculations.compressors.forEach((c, i) => {
                if (c.model) {
                    equipment.push({
                        category: 'Compressor',
                        tag: `COMP-${String(i + 1).padStart(2, '0')}`,
                        ...c
                    });
                }
            });
        }

        // Add condensers
        if (calculations.condensers && calculations.condensers.model) {
            equipment.push({
                category: 'Condenser',
                tag: 'COND-01',
                ...calculations.condensers
            });
        }

        return equipment;
    }

    _calculateSummary(results) {
        const loads = results.calculations.loads || [];
        const totalLoad = loads.reduce((sum, l) => sum + (l.total || 0), 0);

        // Calculate total equipment cost
        const equipmentList = results.equipmentList || [];
        const totalCost = equipmentList.reduce((sum, eq) => {
            // Equipment may have price, cost, or priceUSD field
            const cost = eq.price || eq.cost || eq.priceUSD || 0;
            return sum + (typeof cost === 'number' ? cost : parseFloat(cost) || 0);
        }, 0);

        return {
            totalCoolingLoad: totalLoad,
            totalCoolingLoadTR: totalLoad / 3.517, // Convert kW to TR
            roomCount: loads.length,
            temperatureLevels: Object.keys(results.calculations.temperatureLevels || {}),
            equipmentCount: equipmentList.length,
            refrigerant: results.project.refrigerant,
            totalCost: Math.round(totalCost),
            currency: 'USD'
        };
    }

    // ============================================================
    // STATIC UTILITIES
    // ============================================================

    static get VERSION() {
        return '2.0.0';
    }

    static get SUPPORTED_REFRIGERANTS() {
        return ['R717', 'R744', 'R290', 'R404A', 'R410A', 'R134a', 'R32', 'R22'];
    }
}

module.exports = RefrigerationEngine;
