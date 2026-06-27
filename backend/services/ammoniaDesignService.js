/**
 * Ammonia Refrigeration System Design Service
 * Comprehensive design tool for industrial ammonia refrigeration systems
 */

class AmmoniaDesignService {
    constructor() {
        this.designPhases = {
            DATA_COLLECTION: 'data_collection',
            LOAD_CALCULATION: 'load_calculation',
            EQUIPMENT_SELECTION: 'equipment_selection',
            CALCULATION_BOOK: 'calculation_book',
            PID_DRAWING: 'pid_drawing',
            WIRING_DIAGRAM: 'wiring_diagram',
            PLC_PROGRAMMING: 'plc_programming'
        };

        // Equipment database from the documents
        this.equipmentDatabase = this.initializeEquipmentDatabase();
        
        // Technical standards from documents
        this.technicalStandards = this.initializeTechnicalStandards();
    }

    /**
     * Initialize equipment database from provided documents
     */
    initializeEquipmentDatabase() {
        return {
            compressors: {
                'BITZER_OSKA95103K': {
                    manufacturer: 'BITZER',
                    model: 'OSKA95103-K',
                    type: 'Screw Compressor',
                    motor: '260 kW',
                    capacity: {
                        '-10C': '899 kW',
                        '-30C': '383 kW',
                        '-40C': '228 kW'
                    },
                    refrigerant: 'NH3',
                    priceRange: { economic: 45000, best: 55000, premium: 65000 }
                },
                'HOWDEN_WRV204': {
                    manufacturer: 'HOWDEN',
                    model: 'WRV204/165',
                    type: 'Screw Compressor',
                    displacement: '1221 m³/h @ 3000rpm',
                    maxPressure: '260 psig (18 bar)',
                    priceRange: { economic: 35000, best: 42000, premium: 50000 }
                },
                'HOWDEN_WRV255': {
                    manufacturer: 'HOWDEN',
                    model: 'WRVi255/165',
                    type: 'Variable Vi Screw Compressor',
                    displacement: '2400 m³/h @ 3000rpm',
                    viRange: '2.2 - 5.0',
                    maxPressure: '260 psig (18 bar)',
                    priceRange: { economic: 48000, best: 58000, premium: 70000 }
                },
                'HOWDEN_WRV321': {
                    manufacturer: 'HOWDEN',
                    model: 'WRVi321/165',
                    type: 'Variable Vi Screw Compressor',
                    displacement: '4799 m³/h @ 3000rpm',
                    viRange: '2.2 - 5.0',
                    maxPressure: '260 psig (18 bar)',
                    priceRange: { economic: 65000, best: 78000, premium: 95000 }
                }
            },
            separators: {
                'TLPS_120_450': {
                    model: 'TLPS-120-450',
                    type: 'Low Pressure Separator',
                    volume: '120L',
                    height: '450cm',
                    temperatures: ['-30°C', '-40°C'],
                    priceRange: { economic: 8000, best: 10000, premium: 13000 }
                },
                'TLPS_140_450': {
                    model: 'TLPS-140-450',
                    type: 'Low Pressure Separator',
                    volume: '140L',
                    height: '450cm',
                    priceRange: { economic: 9500, best: 12000, premium: 15000 }
                },
                'TLPS_180_600': {
                    model: 'TLPS-180-600',
                    type: 'Low Pressure Separator',
                    volume: '180L',
                    height: '600cm',
                    priceRange: { economic: 12000, best: 15000, premium: 19000 }
                }
            },
            receivers: {
                'TLR_95_400': {
                    model: 'TLR-95-400',
                    type: 'Ammonia Receiver',
                    volume: '95L',
                    height: '400cm',
                    priceRange: { economic: 7000, best: 9000, premium: 11500 }
                },
                'TLR_160_600': {
                    model: 'TLR-160-600',
                    type: 'Ammonia Receiver',
                    volume: '160L',
                    height: '600cm',
                    priceRange: { economic: 11000, best: 14000, premium: 18000 }
                }
            },
            condensers: {
                'TXC_180_3DE': {
                    model: 'TXC-180-3 DE',
                    type: 'Evaporative Condenser',
                    capacity: '180 kW',
                    fans: 3,
                    waterPump: '4 inch',
                    priceRange: { economic: 22000, best: 28000, premium: 35000 }
                }
            },
            evaporators: {
                'TSA_12_123_240SP': {
                    model: 'TSA 12-123-240 SP',
                    type: 'Air Cooler',
                    nominalCapacity: '25 kW',
                    application: 'Cold Storage',
                    priceRange: { economic: 3500, best: 4200, premium: 5000 }
                },
                'TSA_12_123_360SP': {
                    model: 'TSA 12-123-360 SP',
                    type: 'Air Cooler',
                    nominalCapacity: '61 kW',
                    application: 'Cold Storage',
                    priceRange: { economic: 5500, best: 6800, premium: 8200 }
                },
                'TSA_14_123_410SP': {
                    model: 'TSA 14-123-410 SP',
                    type: 'Air Cooler',
                    nominalCapacity: '59 kW',
                    application: 'Below Zero Storage',
                    priceRange: { economic: 5200, best: 6500, premium: 7900 }
                }
            },
            valves: {
                // Danfoss Control Valves
                'ICS1_25': { type: 'Servo Valve', size: 'DN25', manufacturer: 'Danfoss', price: 850 },
                'ICS1_32': { type: 'Servo Valve', size: 'DN32', manufacturer: 'Danfoss', price: 1050 },
                'ICS1_40': { type: 'Servo Valve', size: 'DN40', manufacturer: 'Danfoss', price: 1250 },
                'ICS1_50': { type: 'Servo Valve', size: 'DN50', manufacturer: 'Danfoss', price: 1550 },
                'ICS1_65': { type: 'Servo Valve', size: 'DN65', manufacturer: 'Danfoss', price: 1850 },
                'ICS3_65': { type: 'Servo Valve', size: 'DN65', manufacturer: 'Danfoss', price: 1950 },
                'ICS3_80': { type: 'Servo Valve', size: 'DN80', manufacturer: 'Danfoss', price: 2350 },
                'ICS3_100': { type: 'Servo Valve', size: 'DN100', manufacturer: 'Danfoss', price: 2850 },
                
                // Solenoid Valves
                'EVRA3': { type: 'Solenoid Valve', size: 'DN3', manufacturer: 'Danfoss', price: 180 },
                'EVRA20': { type: 'Solenoid Valve', size: 'DN20', manufacturer: 'Danfoss', price: 320 },
                'EVRA25': { type: 'Solenoid Valve', size: 'DN25', manufacturer: 'Danfoss', price: 380 },
                'EVRA32': { type: 'Solenoid Valve', size: 'DN32', manufacturer: 'Danfoss', price: 480 },
                'EVRA40': { type: 'Solenoid Valve', size: 'DN40', manufacturer: 'Danfoss', price: 620 },
                
                // Regulating Valves
                'REG15': { type: 'Regulating Valve', size: 'DN15', manufacturer: 'Danfoss', price: 420 },
                'REG20': { type: 'Regulating Valve', size: 'DN20', manufacturer: 'Danfoss', price: 480 },
                'REG25': { type: 'Regulating Valve', size: 'DN25', manufacturer: 'Danfoss', price: 550 },
                'REG32': { type: 'Regulating Valve', size: 'DN32', manufacturer: 'Danfoss', price: 680 },
                'REG40': { type: 'Regulating Valve', size: 'DN40', manufacturer: 'Danfoss', price: 820 },
                
                // Check Valves
                'NRVA15': { type: 'Check Valve', size: 'DN15', manufacturer: 'Danfoss', price: 220 },
                'NRVA20': { type: 'Check Valve', size: 'DN20', manufacturer: 'Danfoss', price: 280 },
                'NRVA25': { type: 'Check Valve', size: 'DN25', manufacturer: 'Danfoss', price: 350 },
                'NRVA32': { type: 'Check Valve', size: 'DN32', manufacturer: 'Danfoss', price: 450 },
                'NRVA40': { type: 'Check Valve', size: 'DN40', manufacturer: 'Danfoss', price: 580 },
                
                // Safety Valves
                'SFV20': { type: 'Safety Relief Valve', setting: '21 bar', manufacturer: 'Danfoss', price: 650 },
                'SFV25': { type: 'Safety Relief Valve', setting: '18-21 bar', manufacturer: 'Danfoss', price: 720 },
                
                // Stop Valves (SVA - Ammonia compatible)
                'SVA10': { type: 'Stop Valve', size: 'DN10', angle: true, price: 85 },
                'SVA15': { type: 'Stop Valve', size: 'DN15', angle: true, price: 120 },
                'SVA20': { type: 'Stop Valve', size: 'DN20', angle: true, price: 165 },
                'SVA25': { type: 'Stop Valve', size: 'DN25', angle: true, price: 210 },
                'SVA32': { type: 'Stop Valve', size: 'DN32', angle: true, price: 280 },
                'SVA40': { type: 'Stop Valve', size: 'DN40', angle: true, price: 380 },
                'SVA50': { type: 'Stop Valve', size: 'DN50', angle: true, price: 520 },
                'SVA65': { type: 'Stop Valve', size: 'DN65', angle: true, price: 720 },
                'SVA80': { type: 'Stop Valve', size: 'DN80', angle: true, price: 980 },
                'SVA100': { type: 'Stop Valve', size: 'DN100', angle: true, price: 1350 },
                'SVA125': { type: 'Stop Valve', size: 'DN125', angle: true, price: 1850 },
                'SVA150': { type: 'Stop Valve', size: 'DN150', angle: true, price: 2450 },
                'SVA200': { type: 'Stop Valve', size: 'DN200', angle: true, price: 3850 },
                'SVA250': { type: 'Stop Valve', size: 'DN250', angle: true, price: 5200 },
                'SVA300': { type: 'Stop Valve', size: 'DN300', angle: true, price: 6800 }
            },
            pumps: {
                'WITT_GP52': {
                    model: 'WITT GP52',
                    type: 'Ammonia Pump',
                    manufacturer: 'WITT',
                    flow: 'Variable',
                    priceRange: { economic: 4500, best: 5500, premium: 6800 }
                },
                'CNF': {
                    model: 'CNF Series',
                    type: 'Ammonia Pump',
                    manufacturer: 'CNF',
                    application: 'Industrial',
                    priceRange: { economic: 3800, best: 4800, premium: 6200 }
                }
            },
            controllers: {
                'EKC347': { type: 'Liquid Level Controller', manufacturer: 'Danfoss', price: 850 },
                'ICAD600': { type: 'Actuator with UPS', manufacturer: 'Danfoss', price: 1200 },
                'ICM25A': { type: 'Motor Valve 25mm', manufacturer: 'Danfoss', price: 950 },
                'ICM32A': { type: 'Motor Valve 32mm', manufacturer: 'Danfoss', price: 1150 },
                'AKS33': { type: 'Pressure Transmitter', manufacturer: 'Danfoss', price: 380 },
                'AKS38': { type: 'Float Switch', manufacturer: 'Danfoss', price: 420 },
                'AKS41': { type: 'Liquid Level Transmitter', manufacturer: 'Danfoss', price: 680 },
                'CVPP': { type: 'Constant Pressure Valve Pilot', manufacturer: 'Danfoss', price: 320 },
                'CVMD': { type: 'Constant Pressure Valve', manufacturer: 'Danfoss', price: 580 },
                'RT260A': { type: 'Differential Pressure Control', manufacturer: 'Danfoss', price: 720 }
            },
            accessories: {
                'OIL_DRAIN_TANK_TODT30': { model: 'TODT-30-70', type: 'Oil Drain Tank', price: 2200 },
                'THERMOSYPHON_TTS80': { model: 'TTS-80-200', type: 'Thermosyphon', price: 3500 },
                'THERMOSYPHON_TTS120': { model: 'TTS-120-400', type: 'Thermosyphon', price: 4800 },
                'ECONOMIZER_TLVS60': { model: 'TLVS-60-250', type: 'Economizer', price: 5500 },
                'PURGER_GRASSO': { model: 'Grasso Self-Limiting', type: 'Auto Purger', refrigerant: 'R404A', price: 3200 },
                'FILTER_FIA': { type: 'Filter', sizes: ['DN20-DN150'], pricePerSize: 180 },
                'STRAINER_STR': { type: 'Strainer', sizes: ['DN25-DN80'], pricePerSize: 220 }
            }
        };
    }

    /**
     * Initialize technical standards from ASME B31.5 and other documents
     */
    initializeTechnicalStandards() {
        return {
            refrigerantProperties: {
                NH3: {
                    name: 'Ammonia',
                    chemicalFormula: 'NH3',
                    molecularWeight: 17.03,
                    classification: 'B2L',
                    safetyGroup: 'B2',
                    ozoneDepleting: false,
                    gwp: 0,
                    saturatedPressure: {
                        '-40C': 0.717, // bar absolute
                        '-30C': 1.195,
                        '-20C': 1.901,
                        '-10C': 2.908,
                        '0C': 4.294,
                        '10C': 6.150,
                        '20C': 8.576,
                        '30C': 11.67,
                        '35C': 13.53,
                        '40C': 15.55
                    },
                    specificHeat: {
                        liquid: 4.7, // kJ/kg·K
                        vapor: 2.2
                    },
                    density: {
                        liquid: 638, // kg/m³ at -10°C
                        vapor: 2.28 // kg/m³ at -10°C
                    }
                }
            },
            pipingStandards: {
                ASME_B31_5: {
                    allowableStress: {
                        carbonSteel: {
                            A106GrB: { temp20C: 138, temp100C: 138 }, // MPa
                            A53GrB: { temp20C: 117, temp100C: 117 }
                        },
                        stainlessSteel: {
                            A312TP304: { temp20C: 138, temp100C: 129 }
                        }
                    },
                    designPressure: {
                        lowPressure: { min: -1, max: 2 }, // bar gauge
                        mediumPressure: { min: 2, max: 15 },
                        highPressure: { min: 15, max: 30 }
                    },
                    safetyFactors: {
                        design: 1.5,
                        test: 1.5
                    }
                },
                lineNumbering: {
                    format: 'Size-Service-Number-Branch-Material-Rating',
                    example: '6"-P-1001-A-CS150-HT',
                    serviceCodes: {
                        P: 'Process/Refrigerant',
                        W: 'Water',
                        S: 'Steam',
                        A: 'Air',
                        O: 'Oil',
                        HG: 'Hot Gas',
                        LL: 'Liquid Line',
                        SL: 'Suction Line',
                        DL: 'Discharge Line'
                    }
                }
            },
            safetyRequirements: {
                reliefValves: {
                    setting: 'MAWP or design pressure',
                    discharge: 'To atmosphere or collection system',
                    capacity: '110% of maximum flow'
                },
                emergencyShutoff: {
                    locations: ['Room exits', 'Machinery room', 'Remote location'],
                    type: 'Manually operated'
                },
                ventilation: {
                    machineryRoom: {
                        normal: '30 air changes/hour',
                        emergency: 'Activation by NH3 detector'
                    },
                    detectors: {
                        alarm: '25 ppm',
                        shutdown: '150 ppm'
                    }
                },
                pressureVessels: {
                    code: 'ASME Section VIII Div 1',
                    testPressure: '1.5 × MAWP',
                    inspection: 'Annual internal inspection recommended'
                }
            },
            designTemperatures: {
                coldStorage: {
                    aboveZero: { min: 0, max: 10, typical: 2 },
                    belowZero: { min: -40, max: -18, typical: -25 },
                    deepFreeze: { min: -50, max: -35, typical: -40 }
                },
                ambient: {
                    design: 35, // °C for condensing
                    min: -15 // Minimum ambient for oil management
                }
            }
        };
    }

    /**
     * Phase 1: Analyze user input and collect required data
     */
    async analyzeUserInput(userInput) {
        const requiredData = {
            project: {
                name: null,
                location: null,
                client: null
            },
            capacity: {
                coldStorageRooms: [],
                totalCoolingLoad: null,
                designTemperatures: []
            },
            ambient: {
                summerTemp: null,
                winterTemp: null,
                location: null
            },
            special: {
                quickFreeze: false,
                multiTemp: false,
                heatRecovery: false
            }
        };

        // Extract information from user input using AI analysis
        const analysis = this.extractDesignParameters(userInput);
        
        const missingFields = this.identifyMissingData(analysis, requiredData);
        
        return {
            extractedData: analysis,
            missingFields: missingFields,
            questions: this.generateQuestions(missingFields),
            completeness: this.calculateCompleteness(analysis, requiredData)
        };
    }

    /**
     * Extract design parameters from text input
     */
    extractDesignParameters(input) {
        // This would integrate with AI to extract structured data
        // For now, return a template structure
        return {
            rooms: [],
            temperatures: [],
            loads: [],
            location: null,
            specialRequirements: []
        };
    }

    /**
     * Identify missing data fields
     */
    identifyMissingData(analysis, required) {
        const missing = [];
        
        if (!analysis.location) {
            missing.push({
                field: 'location',
                question: 'What is the geographical location of the project? (City, Country)',
                importance: 'critical'
            });
        }
        
        if (!analysis.rooms || analysis.rooms.length === 0) {
            missing.push({
                field: 'rooms',
                question: 'How many cold storage rooms do you need? Please specify dimensions and temperatures.',
                importance: 'critical'
            });
        }
        
        if (!analysis.temperatures || analysis.temperatures.length === 0) {
            missing.push({
                field: 'temperatures',
                question: 'What are the required storage temperatures? (e.g., -25°C, -10°C, +2°C)',
                importance: 'critical'
            });
        }
        
        return missing;
    }

    /**
     * Generate clarifying questions
     */
    generateQuestions(missingFields) {
        return missingFields.map(field => ({
            id: field.field,
            question: field.question,
            type: field.importance === 'critical' ? 'required' : 'optional',
            helpText: this.getHelpText(field.field)
        }));
    }

    /**
     * Get help text for fields
     */
    getHelpText(field) {
        const helpTexts = {
            location: 'Location helps determine ambient conditions and equipment availability',
            rooms: 'Specify: dimensions (L×W×H), temperature, usage (storage/processing)',
            temperatures: 'Common: +2°C (chilled), -25°C (frozen), -40°C (deep freeze)',
            loads: 'If unknown, we can calculate based on room dimensions and usage'
        };
        return helpTexts[field] || '';
    }

    /**
     * Calculate data completeness percentage
     */
    calculateCompleteness(analysis, required) {
        let total = 0;
        let filled = 0;
        
        // Count required fields
        const checkFields = ['location', 'rooms', 'temperatures', 'loads'];
        total = checkFields.length;
        
        checkFields.forEach(field => {
            if (analysis[field] && (Array.isArray(analysis[field]) ? analysis[field].length > 0 : true)) {
                filled++;
            }
        });
        
        return Math.round((filled / total) * 100);
    }

    /**
     * Phase 2: Calculate refrigeration loads
     */
    async calculateLoads(designData) {
        const calculations = {
            transmissionLoad: 0,
            productLoad: 0,
            infiltrationLoad: 0,
            internalLoad: 0,
            safetyFactor: 1.15,
            totalLoad: 0
        };

        // Calculate for each room
        for (const room of designData.rooms) {
            const roomLoad = await this.calculateRoomLoad(room, designData.ambient);
            calculations.rooms = calculations.rooms || [];
            calculations.rooms.push(roomLoad);
            
            calculations.transmissionLoad += roomLoad.transmission;
            calculations.productLoad += roomLoad.product;
            calculations.infiltrationLoad += roomLoad.infiltration;
            calculations.internalLoad += roomLoad.internal;
        }

        // Apply safety factor
        const subtotal = calculations.transmissionLoad + calculations.productLoad + 
                        calculations.infiltrationLoad + calculations.internalLoad;
        calculations.totalLoad = subtotal * calculations.safetyFactor;

        return calculations;
    }

    /**
     * Calculate load for individual room
     */
    async calculateRoomLoad(room, ambient) {
        const { length, width, height, temperature, insulation } = room;
        
        // Transmission load through walls, floor, ceiling
        const surfaceArea = {
            walls: 2 * (length * height + width * height),
            floor: length * width,
            ceiling: length * width
        };

        // U-values based on insulation type (W/m²·K)
        const uValues = insulation || {
            walls: 0.25,
            floor: 0.20,
            ceiling: 0.22
        };

        const deltaT = (ambient.summerTemp || 35) - temperature;
        
        const transmission = (
            surfaceArea.walls * uValues.walls +
            surfaceArea.floor * uValues.floor +
            surfaceArea.ceiling * uValues.ceiling
        ) * deltaT / 1000; // Convert to kW

        // Product load (if specified)
        const product = this.calculateProductLoad(room);

        // Infiltration load
        const volume = length * width * height;
        const airChanges = this.getAirChangesPerDay(temperature);
        const infiltration = this.calculateInfiltrationLoad(volume, airChanges, temperature, ambient.summerTemp);

        // Internal loads (lights, forklifts, people)
        const internal = this.calculateInternalLoads(room);

        return {
            roomId: room.id || 'Room',
            dimensions: { length, width, height, volume },
            temperature,
            transmission,
            product,
            infiltration,
            internal,
            subtotal: transmission + product + infiltration + internal
        };
    }

    /**
     * Calculate product cooling load
     */
    calculateProductLoad(room) {
        if (!room.product) return 0;

        const { mass, initialTemp, finalTemp, specificHeat, freezingPoint, latentHeat, timeHours } = room.product;
        
        let load = 0;

        // Sensible cooling above freezing
        if (initialTemp > freezingPoint && finalTemp >= freezing) {
            load += mass * specificHeat * (initialTemp - finalTemp);
        }
        
        // Latent heat if freezing occurs
        if (initialTemp > freezingPoint && finalTemp < freezingPoint) {
            load += mass * latentHeat;
        }
        
        // Sensible cooling below freezing
        if (finalTemp < freezingPoint) {
            const belowFreezing = Math.min(initialTemp, freezingPoint) - finalTemp;
            load += mass * specificHeat * 0.5 * belowFreezing; // Reduced specific heat below freezing
        }

        // Convert to kW based on time
        return load / (timeHours * 3600) / 1000;
    }

    /**
     * Get air changes per day based on temperature
     */
    getAirChangesPerDay(temperature) {
        if (temperature > 0) return 10;
        if (temperature > -20) return 4;
        return 2;
    }

    /**
     * Calculate infiltration load
     */
    calculateInfiltrationLoad(volume, airChanges, insideTemp, outsideTemp) {
        const airDensity = 1.2; // kg/m³
        const specificHeat = 1.005; // kJ/kg·K
        const latentHeat = 2501; // kJ/kg for moisture
        const humidityRatio = 0.01; // Approximate

        const airFlow = volume * airChanges / 24 / 3600; // m³/s
        const sensible = airFlow * airDensity * specificHeat * (outsideTemp - insideTemp);
        const latent = airFlow * airDensity * humidityRatio * latentHeat;

        return (sensible + latent) / 1000; // Convert to kW
    }

    /**
     * Calculate internal loads
     */
    calculateInternalLoads(room) {
        let load = 0;

        // Lighting (10 W/m² typical)
        const floorArea = room.length * room.width;
        load += floorArea * 10 / 1000; // kW

        // People (350 W per person, estimated based on room size)
        const people = Math.ceil(floorArea / 100); // 1 person per 100 m²
        load += people * 0.35;

        // Equipment (forklifts, etc. - if specified)
        if (room.equipment) {
            load += room.equipment.reduce((sum, eq) => sum + eq.power, 0);
        }

        return load;
    }

    /**
     * Phase 3: Select equipment with pricing tiers
     */
    async selectEquipment(calculatedLoads, designData, location) {
        const selections = {
            economic: { total: 0, items: [] },
            best: { total: 0, items: [] },
            premium: { total: 0, items: [] }
        };

        // Select compressors
        const compressorSelection = this.selectCompressors(calculatedLoads.totalLoad, designData.temperatures);
        this.addToSelections(selections, 'Compressor', compressorSelection);

        // Select separators
        const separatorSelection = this.selectSeparators(calculatedLoads.totalLoad, designData.temperatures);
        this.addToSelections(selections, 'Separator', separatorSelection);

        // Select condensers
        const condenserSelection = this.selectCondensers(calculatedLoads.totalLoad, designData.ambient);
        this.addToSelections(selections, 'Condenser', condenserSelection);

        // Select evaporators for each room
        for (const room of calculatedLoads.rooms) {
            const evapSelection = this.selectEvaporator(room.subtotal, room.temperature);
            this.addToSelections(selections, `Evaporator - ${room.roomId}`, evapSelection);
        }

        // Select valves and controls
        const valveList = this.selectValves(designData);
        this.addToSelections(selections, 'Valves & Controls', valveList);

        // Add location-based price adjustment
        const locationFactor = await this.getLocationPriceFactor(location);
        Object.keys(selections).forEach(tier => {
            selections[tier].total *= locationFactor;
        });

        return selections;
    }

    /**
     * Select compressors based on load
     */
    selectCompressors(totalLoad, temperatures) {
        const compressors = this.equipmentDatabase.compressors;
        const selections = { economic: null, best: null, premium: null };

        // Determine temperature level
        const minTemp = Math.min(...temperatures);
        const tempKey = minTemp <= -35 ? '-40C' : minTemp <= -25 ? '-30C' : '-10C';

        // Find suitable compressors
        const suitable = Object.values(compressors).filter(comp => {
            if (comp.capacity && comp.capacity[tempKey]) {
                const capacity = parseFloat(comp.capacity[tempKey]);
                return capacity >= totalLoad * 0.8 && capacity <= totalLoad * 1.5;
            }
            return false;
        });

        if (suitable.length > 0) {
            // Sort by price
            suitable.sort((a, b) => a.priceRange.best - b.priceRange.best);
            
            selections.economic = { equipment: suitable[0], price: suitable[0].priceRange.economic, quantity: Math.ceil(totalLoad / parseFloat(suitable[0].capacity[tempKey])) };
            selections.best = { equipment: suitable[Math.floor(suitable.length / 2)] || suitable[0], price: (suitable[Math.floor(suitable.length / 2)] || suitable[0]).priceRange.best, quantity: 1 };
            selections.premium = { equipment: suitable[suitable.length - 1], price: suitable[suitable.length - 1].priceRange.premium, quantity: 1 };
        }

        return selections;
    }

    /**
     * Select separators
     */
    selectSeparators(totalLoad, temperatures) {
        const separators = this.equipmentDatabase.separators;
        const selections = { economic: null, best: null, premium: null };

        // Select based on load (rule of thumb: 1L per 10kW)
        const requiredVolume = totalLoad / 10;

        const suitable = Object.values(separators).filter(sep => {
            const volume = parseInt(sep.model.split('-')[1]);
            return volume >= requiredVolume * 0.8;
        });

        if (suitable.length > 0) {
            suitable.sort((a, b) => a.priceRange.best - b.priceRange.best);
            
            selections.economic = { equipment: suitable[0], price: suitable[0].priceRange.economic, quantity: temperatures.length };
            selections.best = { equipment: suitable[Math.floor(suitable.length / 2)] || suitable[0], price: (suitable[Math.floor(suitable.length / 2)] || suitable[0]).priceRange.best, quantity: temperatures.length };
            selections.premium = { equipment: suitable[suitable.length - 1], price: suitable[suitable.length - 1].priceRange.premium, quantity: temperatures.length };
        }

        return selections;
    }

    /**
     * Select condensers
     */
    selectCondensers(totalLoad, ambient) {
        const condensers = this.equipmentDatabase.condensers;
        const selections = { economic: null, best: null, premium: null };

        // Condensing load is typically 1.2-1.3 times evaporator load
        const condensingLoad = totalLoad * 1.25;

        const suitable = Object.values(condensers).filter(cond => {
            const capacity = parseFloat(cond.capacity);
            return capacity >= condensingLoad * 0.8;
        });

        if (suitable.length > 0) {
            const quantity = Math.ceil(condensingLoad / parseFloat(suitable[0].capacity));
            
            suitable.forEach(cond => {
                selections.economic = { equipment: cond, price: cond.priceRange.economic, quantity };
                selections.best = { equipment: cond, price: cond.priceRange.best, quantity };
                selections.premium = { equipment: cond, price: cond.priceRange.premium, quantity };
            });
        }

        return selections;
    }

    /**
     * Select evaporator for room
     */
    selectEvaporator(roomLoad, temperature) {
        const evaporators = this.equipmentDatabase.evaporators;
        const selections = { economic: null, best: null, premium: null };

        const suitable = Object.values(evaporators).filter(evap => {
            const capacity = parseFloat(evap.nominalCapacity);
            return capacity >= roomLoad * 0.8 && capacity <= roomLoad * 1.5;
        });

        if (suitable.length > 0) {
            const quantity = Math.ceil(roomLoad / parseFloat(suitable[0].nominalCapacity));
            
            suitable.forEach(evap => {
                selections.economic = { equipment: evap, price: evap.priceRange.economic, quantity };
                selections.best = { equipment: evap, price: evap.priceRange.best, quantity };
                selections.premium = { equipment: evap, price: evap.priceRange.premium, quantity };
            });
        }

        return selections;
    }

    /**
     * Select valves and controls
     */
    selectValves(designData) {
        // This would generate a complete valve list based on the P&ID logic
        // For now, return a template
        const valveList = {
            economic: { items: [], total: 0 },
            best: { items: [], total: 0 },
            premium: { items: [], total: 0 }
        };

        // Example: Add control valves for each room
        designData.rooms.forEach(room => {
            const size = this.selectValveSize(room);
            Object.keys(valveList).forEach(tier => {
                valveList[tier].items.push({
                    type: 'ICS Control Valve',
                    size,
                    quantity: 1,
                    price: this.equipmentDatabase.valves[`ICS1_${size}`]?.price || 500
                });
            });
        });

        // Calculate totals
        Object.keys(valveList).forEach(tier => {
            valveList[tier].total = valveList[tier].items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        });

        return valveList;
    }

    /**
     * Select valve size based on room load
     */
    selectValveSize(room) {
        const load = room.subtotal;
        if (load < 30) return '25';
        if (load < 50) return '32';
        if (load < 80) return '40';
        if (load < 120) return '50';
        return '65';
    }

    /**
     * Add equipment to selection tiers
     */
    addToSelections(selections, category, equipment) {
        Object.keys(selections).forEach(tier => {
            if (equipment[tier]) {
                selections[tier].items.push({
                    category,
                    ...equipment[tier]
                });
                const itemTotal = equipment[tier].price * (equipment[tier].quantity || 1);
                selections[tier].total += itemTotal;
            }
        });
    }

    /**
     * Get location-based price adjustment factor
     */
    async getLocationPriceFactor(location) {
        // This would query a database or API for location-specific factors
        // For now, return regional estimates
        const factors = {
            'iran': 1.0,
            'turkey': 1.15,
            'uae': 1.25,
            'europe': 1.35,
            'usa': 1.40
        };

        const region = location.toLowerCase();
        for (const [key, factor] of Object.entries(factors)) {
            if (region.includes(key)) return factor;
        }

        return 1.10; // Default
    }

    /**
     * Phase 4: Generate calculation book
     */
    async generateCalculationBook(designData, calculations, equipment) {
        const book = {
            projectInfo: designData.project,
            tableOfContents: [],
            sections: []
        };

        // Section 1: Design Criteria
        book.sections.push({
            number: 1,
            title: 'Design Criteria and Basis',
            content: this.generateDesignCriteria(designData)
        });

        // Section 2: Load Calculations
        book.sections.push({
            number: 2,
            title: 'Refrigeration Load Calculations',
            content: this.generateLoadCalculations(calculations)
        });

        // Section 3: Equipment Selection
        book.sections.push({
            number: 3,
            title: 'Equipment Selection and Specifications',
            content: this.generateEquipmentSpecs(equipment)
        });

        // Section 4: Piping Design
        book.sections.push({
            number: 4,
            title: 'Piping Design and Sizing',
            content: this.generatePipingDesign(calculations, equipment)
        });

        // Section 5: Safety and Controls
        book.sections.push({
            number: 5,
            title: 'Safety Systems and Control Philosophy',
            content: this.generateSafetyControls(designData)
        });

        return book;
    }

    /**
     * Generate design criteria section
     */
    generateDesignCriteria(designData) {
        return {
            climateData: designData.ambient,
            temperatureRequirements: designData.temperatures,
            refrigerant: 'NH3 (Ammonia R-717)',
            standards: ['ASME B31.5', 'IIAR 2', 'EN 378'],
            safetyClass: 'L2 (Medium probability, high consequence)'
        };
    }

    /**
     * Generate load calculations section
     */
    generateLoadCalculations(calculations) {
        return {
            summary: calculations,
            roomByRoom: calculations.rooms,
            peakLoad: calculations.totalLoad,
            averageLoad: calculations.totalLoad * 0.75,
            diversityFactor: 0.75
        };
    }

    /**
     * Generate equipment specifications
     */
    generateEquipmentSpecs(equipment) {
        return {
            compressors: equipment.best.items.filter(i => i.category.includes('Compressor')),
            condensers: equipment.best.items.filter(i => i.category.includes('Condenser')),
            evaporators: equipment.best.items.filter(i => i.category.includes('Evaporator')),
            vessels: equipment.best.items.filter(i => i.category.includes('Separator')),
            controls: equipment.best.items.filter(i => i.category.includes('Valves'))
        };
    }

    /**
     * Generate piping design
     */
    generatePipingDesign(calculations, equipment) {
        // This would calculate pipe sizes based on flow rates
        return {
            suctionLines: [],
            dischargeLineslines: [],
            liquidLines: [],
            hotGasDefrost: []
        };
    }

    /**
     * Generate safety and controls section
     */
    generateSafetyControls(designData) {
        return {
            safetyDevices: [
                'Pressure relief valves on all pressure vessels',
                'NH3 gas detectors in machinery room and occupied spaces',
                'Emergency ventilation system',
                'Emergency shutoff valves'
            ],
            controlStrategy: 'PLC-based control with remote monitoring',
            alarms: [
                'High/Low pressure',
                'High discharge temperature',
                'NH3 gas detection',
                'Equipment failure'
            ]
        };
    }

    /**
     * Phase 5: Generate P&ID drawing data
     */
    async generatePIDDrawing(designData, equipment, calculations) {
        // This generates the data structure for the P&ID drawing
        // The actual drawing would be rendered by a front-end component
        
        const pid = {
            projectInfo: designData.project,
            equipment: [],
            pipingLines: [],
            instruments: [],
            valves: []
        };

        // Add equipment symbols
        equipment.best.items.forEach(item => {
            pid.equipment.push({
                tag: this.generateEquipmentTag(item),
                type: item.category,
                spec: item.equipment.model,
                position: null // Would be calculated or manually positioned
            });
        });

        // Generate piping lines based on refrigeration cycle
        pid.pipingLines = this.generatePipingLines(equipment, designData.temperatures);

        // Add instrumentation
        pid.instruments = this.generateInstrumentation(equipment);

        // Add valves
        pid.valves = this.generateValveList(equipment);

        return pid;
    }

    /**
     * Generate equipment tag
     */
    generateEquipmentTag(item) {
        const prefixes = {
            'Compressor': 'K',
            'Condenser': 'E',
            'Separator': 'V',
            'Evaporator': 'E',
            'Pump': 'P',
            'Receiver': 'V'
        };

        const prefix = prefixes[item.category] || 'X';
        const number = '001'; // Would increment based on count

        return `${prefix}-${number}`;
    }

    /**
     * Generate piping lines
     */
    generatePipingLines(equipment, temperatures) {
        const lines = [];

        temperatures.forEach((temp, idx) => {
            // Suction line
            lines.push({
                number: `SL-${idx + 1}`,
                service: 'Suction',
                temperature: temp,
                from: `Evaporator ${temp}°C`,
                to: 'Compressor',
                size: this.calculatePipeSize('suction', temp),
                material: 'Carbon Steel',
                insulation: 'Required'
            });

            // Liquid line
            lines.push({
                number: `LL-${idx + 1}`,
                service: 'Liquid',
                temperature: temp,
                from: 'Receiver',
                to: `Evaporator ${temp}°C`,
                size: this.calculatePipeSize('liquid', temp),
                material: 'Carbon Steel',
                insulation: 'Required'
            });
        });

        // Discharge line
        lines.push({
            number: 'DL-001',
            service: 'Discharge',
            from: 'Compressor',
            to: 'Condenser',
            size: this.calculatePipeSize('discharge'),
            material: 'Carbon Steel',
            insulation: 'Not Required'
        });

        return lines;
    }

    /**
     * Calculate pipe size based on service and temperature
     */
    calculatePipeSize(service, temperature = null) {
        // Simplified pipe sizing - in reality would use velocity and pressure drop calculations
        const sizes = {
            suction: {
                '-40': 'DN100',
                '-30': 'DN80',
                '-10': 'DN65'
            },
            discharge: 'DN65',
            liquid: 'DN50'
        };

        if (service === 'suction' && temperature) {
            const tempKey = temperature <= -35 ? '-40' : temperature <= -25 ? '-30' : '-10';
            return sizes.suction[tempKey];
        }

        return sizes[service] || 'DN50';
    }

    /**
     * Generate instrumentation list
     */
    generateInstrumentation(equipment) {
        return [
            { tag: 'PT-001', type: 'Pressure Transmitter', location: 'Compressor Suction', range: '-1 to 10 bar' },
            { tag: 'PT-002', type: 'Pressure Transmitter', location: 'Compressor Discharge', range: '0 to 25 bar' },
            { tag: 'TT-001', type: 'Temperature Transmitter', location: 'Compressor Discharge', range: '0 to 150°C' },
            { tag: 'LT-001', type: 'Level Transmitter', location: 'Receiver', range: '0 to 100%' },
            { tag: 'GT-001', type: 'Gas Detector', location: 'Machinery Room', range: '0 to 1000 ppm NH3' }
        ];
    }

    /**
     * Generate valve list
     */
    generateValveList(equipment) {
        // This would generate a complete valve list based on the P&ID
        return [];
    }

    /**
     * Phase 6: Generate wiring diagram
     */
    async generateWiringDiagram(equipment, pid) {
        const wiring = {
            powerDistribution: [],
            controlWiring: [],
            safetyCircuits: [],
            plcIO: []
        };

        // Generate power distribution
        equipment.best.items.forEach(item => {
            if (item.equipment.motor) {
                wiring.powerDistribution.push({
                    equipment: item.category,
                    tag: this.generateEquipmentTag(item),
                    motor: item.equipment.motor,
                    starter: 'Soft Starter',
                    protection: 'Motor Protection Relay',
                    cable: this.selectCableSize(item.equipment.motor)
                });
            }
        });

        // Generate control wiring from instruments
        pid.instruments.forEach(inst => {
            wiring.controlWiring.push({
                instrument: inst.tag,
                signal: '4-20mA',
                destination: 'PLC AI Module',
                cable: '2×1.5mm² Shielded'
            });
        });

        // Safety circuits
        wiring.safetyCircuits = [
            { circuit: 'Emergency Stop', type: 'Hardwired', category: 'SIL 2' },
            { circuit: 'NH3 Detection Shutdown', type: 'Hardwired', category: 'SIL 2' },
            { circuit: 'High Pressure Shutdown', type: 'Hardwired', category: 'SIL 1' }
        ];

        // PLC I/O allocation
        wiring.plcIO = this.allocatePLCIO(equipment, pid);

        return wiring;
    }

    /**
     * Select cable size based on motor power
     */
    selectCableSize(motorPower) {
        const power = parseFloat(motorPower);
        if (power <= 5) return '3×2.5mm²';
        if (power <= 15) return '3×4mm²';
        if (power <= 30) return '3×10mm²';
        if (power <= 75) return '3×25mm²';
        if (power <= 150) return '3×50mm²';
        return '3×95mm²';
    }

    /**
     * Allocate PLC I/O points
     */
    allocatePLCIO(equipment, pid) {
        const io = {
            digitalInputs: [],
            digitalOutputs: [],
            analogInputs: [],
            analogOutputs: []
        };

        // Digital inputs from status contacts
        equipment.best.items.forEach(item => {
            if (item.category.includes('Compressor')) {
                io.digitalInputs.push({ tag: `${item.category} Run Status`, type: 'DI', address: 'I0.0' });
                io.digitalInputs.push({ tag: `${item.category} Alarm`, type: 'DI', address: 'I0.1' });
            }
        });

        // Digital outputs to starters/valves
        equipment.best.items.forEach(item => {
            if (item.category.includes('Compressor')) {
                io.digitalOutputs.push({ tag: `${item.category} Start`, type: 'DO', address: 'Q0.0' });
            }
        });

        // Analog inputs from transmitters
        pid.instruments.forEach((inst, idx) => {
            io.analogInputs.push({
                tag: inst.tag,
                type: 'AI',
                signal: '4-20mA',
                address: `IW${idx * 2}`
            });
        });

        return io;
    }

    /**
     * Phase 7: Generate PLC program
     */
    async generatePLCProgram(equipment, wiring, designData) {
        const program = {
            platform: 'Siemens S7-1200', // or Allen-Bradley, etc.
            language: 'Ladder Logic + SCL',
            organization: [],
            dataBlocks: [],
            functions: []
        };

        // Main cycle OB
        program.organization.push({
            name: 'Main_Cycle',
            type: 'OB1',
            description: 'Main program cycle',
            callOrder: [
                'FB_Compressor_Control',
                'FB_Temperature_Control',
                'FB_Safety_Monitor',
                'FB_Defrost_Sequence'
            ]
        });

        // Compressor control function block
        program.functions.push({
            name: 'FB_Compressor_Control',
            type: 'FB',
            inputs: [
                { name: 'Start_Command', type: 'BOOL' },
                { name: 'Suction_Pressure', type: 'REAL' },
                { name: 'Discharge_Pressure', type: 'REAL' },
                { name: 'Discharge_Temp', type: 'REAL' }
            ],
            outputs: [
                { name: 'Run_Output', type: 'BOOL' },
                { name: 'Alarm', type: 'BOOL' },
                { name: 'Status', type: 'INT' }
            ],
            logic: this.generateCompressorLogic()
        });

        // Temperature control function block
        program.functions.push({
            name: 'FB_Temperature_Control',
            type: 'FB',
            inputs: [
                { name: 'Room_Temp', type: 'REAL' },
                { name: 'Setpoint', type: 'REAL' },
                { name: 'Enable', type: 'BOOL' }
            ],
            outputs: [
                { name: 'Valve_Position', type: 'REAL' },
                { name: 'Alarm', type: 'BOOL' }
            ],
            logic: this.generateTemperatureControlLogic()
        });

        // Safety monitoring function block
        program.functions.push({
            name: 'FB_Safety_Monitor',
            type: 'FB',
            inputs: [
                { name: 'NH3_Level', type: 'REAL' },
                { name: 'High_Pressure', type: 'BOOL' },
                { name: 'Emergency_Stop', type: 'BOOL' }
            ],
            outputs: [
                { name: 'System_Shutdown', type: 'BOOL' },
                { name: 'Alarm_Code', type: 'INT' }
            ],
            logic: this.generateSafetyLogic()
        });

        // Data blocks for configuration
        program.dataBlocks.push({
            name: 'DB_Configuration',
            type: 'DB',
            structure: [
                { name: 'Suction_Pressure_Setpoint', type: 'REAL', value: designData.temperatures[0] },
                { name: 'Discharge_Pressure_Max', type: 'REAL', value: 18.0 },
                { name: 'NH3_Alarm_Level', type: 'REAL', value: 25.0 },
                { name: 'NH3_Shutdown_Level', type: 'REAL', value: 150.0 }
            ]
        });

        return program;
    }

    /**
     * Generate compressor control logic
     */
    generateCompressorLogic() {
        return `
// Compressor Control Logic
// Start conditions
IF #Start_Command AND NOT #Alarm THEN
    // Check safe operating conditions
    IF #Suction_Pressure > -1.0 AND #Discharge_Pressure < 20.0 THEN
        #Run_Output := TRUE;
    END_IF;
END_IF;

// Stop conditions
IF #Discharge_Pressure > 22.0 OR #Discharge_Temp > 120.0 THEN
    #Run_Output := FALSE;
    #Alarm := TRUE;
    #Status := 1; // High pressure alarm
END_IF;

// Normal operation monitoring
IF #Run_Output THEN
    IF #Discharge_Temp > 100.0 THEN
        #Status := 2; // High temperature warning
    ELSE
        #Status := 0; // Normal operation
    END_IF;
END_IF;
`;
    }

    /**
     * Generate temperature control logic
     */
    generateTemperatureControlLogic() {
        return `
// PID Temperature Control
// Simple PID implementation
#Error := #Setpoint - #Room_Temp;
#P_Term := #Kp * #Error;
#I_Sum := #I_Sum + (#Ki * #Error * #Cycle_Time);
#D_Term := #Kd * (#Error - #Last_Error) / #Cycle_Time;

#Valve_Position := #P_Term + #I_Sum + #D_Term;

// Limit output
IF #Valve_Position > 100.0 THEN
    #Valve_Position := 100.0;
ELSIF #Valve_Position < 0.0 THEN
    #Valve_Position := 0.0;
END_IF;

#Last_Error := #Error;

// Alarm if temperature deviation is too large
IF ABS(#Error) > 5.0 THEN
    #Alarm := TRUE;
END_IF;
`;
    }

    /**
     * Generate safety logic
     */
    generateSafetyLogic() {
        return `
// Safety Monitoring Logic
#System_Shutdown := FALSE;

// Emergency stop check
IF #Emergency_Stop THEN
    #System_Shutdown := TRUE;
    #Alarm_Code := 1; // Emergency stop activated
END_IF;

// NH3 gas detection
IF #NH3_Level > 150.0 THEN
    #System_Shutdown := TRUE;
    #Alarm_Code := 2; // High NH3 level shutdown
ELSIF #NH3_Level > 25.0 THEN
    #Alarm_Code := 3; // NH3 warning
END_IF;

// High pressure check
IF #High_Pressure THEN
    #System_Shutdown := TRUE;
    #Alarm_Code := 4; // High pressure shutdown
END_IF;
`;
    }

    /**
     * Export complete project package
     */
    async exportProject(projectId) {
        // This would package all the generated files for download
        return {
            calculationBook: 'PDF',
            pidDrawing: 'DWG/PDF',
            wiringDiagram: 'DWG/PDF',
            plcProgram: 'S7P/ACD',
            equipmentList: 'XLSX',
            valveList: 'XLSX',
            specifications: 'PDF'
        };
    }
}

module.exports = new AmmoniaDesignService();
