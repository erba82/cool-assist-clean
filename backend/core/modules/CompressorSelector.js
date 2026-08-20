/**
 * CompressorSelector Module
 * 
 * Selects optimal compressors based on:
 * - Evaporating temperature groups
 * - Total load per group
 * - Direct vs Booster configuration
 * - Economizer options
 * - Standby requirements
 * 
 * Now includes accurate thermodynamic cycle analysis:
 * - Uses ThermodynamicCycleAnalyzer for precise COP
 * - Calculates mass flow rate from enthalpy
 * - Provides superheat/subcool values
 * 
 * Manufacturers: Bitzer, Mycom, Frick, Howden
 * 
 * @author GFDDE AI Engine
 * @version 3.0.0
 */

const ThermodynamicCycleAnalyzer = require('./ThermodynamicCycleAnalyzer');
const { getRefrigerantProfile } = require('../data/RefrigerantProfiles');

class CompressorSelector {
    constructor(engine) {
        this.engine = engine;
        this.cycleAnalyzer = new ThermodynamicCycleAnalyzer(engine);

        // Screw compressor series (based on Bitzer/Mycom data)
        this.compressorSeries = {
            // Open drive screw compressors
            'OS': {
                type: 'screw_open',
                capacityRange: [50, 1500],  // kW
                speeds: [2950, 1450],       // RPM
                oilCooling: 'thermosiphon',
                economizer: true,
                vi: [2.6, 3.6, 4.8],        // Volume ratios
                models: {
                    small: { capacity: [50, 150], model: 'OS60', motor: [45, 90] },
                    medium: { capacity: [150, 400], model: 'OS85', motor: [90, 200] },
                    large: { capacity: [400, 800], model: 'OS175', motor: [200, 450] },
                    xlarge: { capacity: [800, 1500], model: 'OS250', motor: [450, 750] }
                }
            },
            // Semi-hermetic screw
            'HS': {
                type: 'screw_semi',
                capacityRange: [30, 500],
                speeds: [2950],
                oilCooling: 'liquid_injection',
                economizer: true,
                models: {
                    small: { capacity: [30, 100], model: 'HSK64', motor: [30, 75] },
                    medium: { capacity: [100, 250], model: 'HSK85', motor: [75, 160] },
                    large: { capacity: [250, 500], model: 'HSK95', motor: [160, 355] }
                }
            },
            // Reciprocating (for smaller loads)
            'REC': {
                type: 'reciprocating',
                capacityRange: [5, 100],
                speeds: [1450],
                oilCooling: 'splash',
                economizer: false,
                models: {
                    small: { capacity: [5, 25], model: '4G', motor: [5, 22] },
                    medium: { capacity: [25, 50], model: '6G', motor: [22, 45] },
                    large: { capacity: [50, 100], model: '8G', motor: [45, 90] }
                }
            }
        };

        // System configurations
        this.configurations = {
            'single_stage': {
                description: 'Direct compression',
                applicable: temp => temp >= -35,
                efficiencyFactor: 1.0
            },
            'booster': {
                description: 'Two-stage with booster',
                applicable: temp => temp < -35,
                efficiencyFactor: 1.15
            },
            'economizer': {
                description: 'Single stage with economizer',
                applicable: temp => temp >= -25 && temp < -10,
                efficiencyFactor: 1.1
            }
        };
    }

    /**
     * Select compressors for a temperature level
     * @param {Object} tempLevel - Temperature level data
     * @param {Object} project - Project context
     * @returns {Object} Compressor selection
     */
    async select(tempLevel, project) {
        const evapTemp = tempLevel.evaporatingTemp;
        const totalLoad = tempLevel.totalLoad;
        const refrigerant = project.refrigerant || 'R717';

        // Determine condensing temperature
        const condensingTemp = this._getCondensingTemp(project);

        // Get refrigerant properties
        const refrigerantData = this.engine.getData('refrigerants');
        const refProps = refrigerantData?.[refrigerant];

        // Determine system configuration
        const config = this._selectConfiguration(evapTemp);

        // Apply diversity factor
        const diversityFactor = this._getDiversityFactor(tempLevel.rooms?.length || 1);
        const designLoad = totalLoad * diversityFactor;

        // Calculate volumetric flow rate
        const { suctionPressure, dischargePressure, compressionRatio } =
            this._calculatePressures(evapTemp, condensingTemp, refProps);

        // Select compressor type and size
        const selection = this._selectCompressor(designLoad, evapTemp, compressionRatio, project);

        // Determine number of compressors + standby
        // SAFUGUARD: Ensure load is valid
        const safeLoad = (designLoad && designLoad > 0) ? designLoad : 10;
        const { operating, standby } = this._determineCount(safeLoad, selection);

        // Perform accurate thermodynamic cycle analysis
        let cycleAnalysis = null;
        let cop = 3.5; // Default fallback
        let heatRejection = designLoad * 1.3;
        let power = designLoad / cop;
        let massFlowRate = 0;
        let superheatSubcool = null;

        try {
            cycleAnalysis = this.cycleAnalyzer.analyzeCycle({
                evapTemp,
                condTemp: condensingTemp,
                superheat: 8,
                subcool: 4,
                refrigerant,
                coolingLoad: designLoad
            });

            cop = cycleAnalysis.performance.cop;
            massFlowRate = cycleAnalysis.performance.massFlowRate;
            power = cycleAnalysis.performance.compressorWork;
            heatRejection = cycleAnalysis.performance.heatRejection;
            superheatSubcool = this.cycleAnalyzer.getSuperheatSubcool(cycleAnalysis);
        } catch (error) {
            console.warn('Cycle analysis failed, using approximation:', error.message);
            // Fallback to old method
            const copData = this._estimateCOP(evapTemp, condensingTemp, config.name);
            cop = copData.value;
            heatRejection = designLoad * (1 + 1 / cop);
            power = designLoad / cop;
        }

        return {
            // Configuration
            configuration: config.name,
            configDescription: config.description,

            // Operating Conditions
            evaporatingTemp: evapTemp,
            condensingTemp: condensingTemp,
            compressionRatio: Math.round(compressionRatio * 100) / 100,
            suctionPressure: Math.round(suctionPressure * 100) / 100,
            dischargePressure: Math.round(dischargePressure * 100) / 100,

            // Load & Capacity
            designLoad: Math.round(designLoad * 100) / 100,
            diversityFactor: diversityFactor,
            capacityPerUnit: Math.round(selection.capacity * 100) / 100,

            // Equipment Quantity & Configuration
            operatingUnits: operating,
            standbyUnits: standby,
            totalUnits: operating + standby,
            configuration: {
                operating: operating,
                standby: standby,
                total: operating + standby,
                isSwing: standby > 0,
                swingCapacity: `${Math.round(100 / (operating + 1))}%-100%`,
                redundancy: `${operating}+${standby}`
            },

            // Manufacturer & Model Details
            manufacturer: this._selectManufacturer(selection.series),
            brand: this._selectManufacturer(selection.series),
            model: selection.model,
            fullModel: `${this._selectManufacturer(selection.series)} ${selection.model}`,
            series: selection.series,
            type: selection.type,

            // Electrical Specifications
            motorPower: selection.motor,
            electricalPower: Math.round(power * 100) / 100,
            electrical: {
                ratedPower: selection.motor,  // kW per unit
                totalPower: Math.round(power * 100) / 100,  // kW total system
                voltage: '400V 3Ph 50Hz',
                current: Math.round(selection.motor / (0.4 * Math.sqrt(3) * 0.9)),  // Approx current (A)
                powerFactor: 0.85,
                startingMethod: selection.motor > 50 ? 'Soft Start / VFD' : 'DOL'
            },

            // Performance
            cop: Math.round(cop * 100) / 100,
            heatRejection: Math.round(heatRejection * 100) / 100,
            massFlowRate: massFlowRate ? Math.round(massFlowRate * 1000) / 1000 : null,
            superheat: superheatSubcool?.superheat || null,
            subcool: superheatSubcool?.subcool || null,
            operatingPoint: {
                evapTemp: evapTemp,
                condTemp: condensingTemp,
                capacity: Math.round(selection.capacity * 100) / 100,  // kW per unit
                power: Math.round((selection.capacity / cop) * 100) / 100,  // kW per unit
                cop: Math.round(cop * 100) / 100,
                volumetricEfficiency: this._estimateVolumetricEfficiency(evapTemp, compressionRatio),
                isentropicEfficiency: 0.70
            },

            // Operational Details
            speed: selection.speed,
            oilCooling: selection.oilCooling,
            economizer: selection.economizer,
            refrigerant: refrigerant,

            // Oil Separator
            oilSeparator: {
                required: true,
                model: `SEP-${Math.round(selection.capacity / 100) * 100}`,
                efficiency: 99.9,  // %
                volume: Math.round(selection.capacity / 5),  // L (approx)
                pressureDrop: 0.2  // bar
            },

            // Physical Specifications
            technicalSpecs: {
                displacement: `${Math.round(selection.capacity * 2.5)} m³/h`,
                oilCharge: `${Math.round(selection.motor / 2)} L`,
                refrigerantCharge: `${Math.round(selection.capacity / 15)} kg`,
                weight: Math.round(selection.motor * 15),  // kg
                dimensions: {
                    length: selection.motor > 200 ? 2200 : selection.motor > 100 ? 1800 : 1400,  // mm
                    width: selection.motor > 200 ? 1000 : selection.motor > 100 ? 800 : 600,  // mm
                    height: selection.motor > 200 ? 1400 : selection.motor > 100 ? 1200 : 1000  // mm
                },
                soundLevel: Math.round(70 + Math.log10(selection.motor) * 10),  // dB(A)
                vibrationClass: 'Class B (ISO 10816)'
            },

            // Service & Maintenance
            service: {
                oilChange: '2000 hours',
                filterChange: '1000 hours',
                beltCheck: '500 hours',  // If belt driven
                annualService: 'Required',
                warranty: '24 months standard'
            },

            // Compliance
            compliance: {
                pressure: 'EN 378',
                electrical: 'IEC 60204-1',
                safety: 'CE marked',
                refrigerant: 'F-Gas compliant',
                efficiency: 'ErP 2021 compliant'
            },

            // Pricing (Estimated)
            // Pricing (Estimated with Scenarios)
            price: this._formatPriceRange(this._estimatePrice(selection, operating + standby).total),
            pricingScenarios: this._generateScenarios(selection, operating + standby, cop),
            currency: 'USD',
            leadTime: '8-10 weeks',

            // Tags & Identification
            tag: `COMP-${tempLevel.temperatureLevel?.replace('T', '') || evapTemp}`,

            // Thermodynamic Cycle Data (if available)
            cycleAnalysis: cycleAnalysis ? {
                cyclePoints: this.cycleAnalyzer.getCyclePointsTable(cycleAnalysis),
                performance: cycleAnalysis.performance
            } : null,

            // Additional Parameters
            parameters: {
                roomCount: tempLevel.rooms?.length || 0,
                refrigerantGWP: refProps?.gwp || 0,
                ambientTemp: project.climate?.summerDB || 35,
                altitude: project.location?.altitude || 0
            }
        };
    }

    _estimatePrice(selection, quantity) {
        // Base prices in USD
        let basePrice = 0;
        const capacity = selection.capacity; // kW

        if (selection.series === 'OS') { // Open Screw
            basePrice = 15000 + (capacity * 120);
        } else if (selection.series === 'HS') { // Semi-hermetic Screw
            basePrice = 12000 + (capacity * 100);
        } else { // Reciprocating
            basePrice = 5000 + (capacity * 80);
        }

        const pricePerUnit = Math.round(basePrice * 1.25); // +25% for accessories

        return {
            perUnit: pricePerUnit,
            total: pricePerUnit * quantity,
            currency: 'USD',
            breakdown: {
                equipment: Math.round(basePrice),
                accessories: Math.round(basePrice * 0.25)
            }
        };
    }

    _getCondensingTemp(project) {
        const specified = Number(project?.operatingConditions?.condensingTemperatureC);
        if (Number.isFinite(specified)) return specified;
        // Based on ambient and condenser type
        const ambientWB = project.climate?.summerWB || 24;
        const condenserType = project.condenserType || 'evaporative';

        if (condenserType === 'evaporative') {
            return ambientWB + 8;  // 8K approach
        } else {
            const ambientDB = project.climate?.summerDB || 35;
            return ambientDB + 12;  // 12K approach for air-cooled
        }
    }

    _selectConfiguration(evapTemp) {
        for (const [name, config] of Object.entries(this.configurations)) {
            if (config.applicable(evapTemp)) {
                return { name, ...config };
            }
        }
        return { name: 'single_stage', ...this.configurations.single_stage };
    }

    _getDiversityFactor(roomCount) {
        // Diversity factor based on number of rooms
        if (roomCount <= 2) return 1.0;
        if (roomCount <= 5) return 0.95;
        if (roomCount <= 10) return 0.90;
        return 0.85;
    }

    _calculatePressures(evapTemp, condTemp, refProps) {
        // Simplified pressure calculation for ammonia
        // In production, use CoolProp for accurate values
        const evapPressure = refProps?.properties?.[evapTemp.toString()]?.pressure ||
            0.717 * Math.exp(0.05 * (evapTemp + 40));
        const condPressure = refProps?.properties?.[condTemp.toString()]?.pressure ||
            0.717 * Math.exp(0.05 * (condTemp + 40));

        return {
            suctionPressure: evapPressure,
            dischargePressure: condPressure,
            compressionRatio: condPressure / evapPressure
        };
    }

    _selectCompressor(load, evapTemp, compressionRatio, project = {}) {
        const refrigerant = String(project.refrigerant || 'R717');
        const profile = getRefrigerantProfile(refrigerant);
        const byProfile = {
            R744: () => ({
                series: 'CO2_RECIP', type: 'reciprocating', manufacturer: 'BITZER',
                model: load <= 30 ? '4GTE-30K' : load <= 60 ? '6FTE-50K' : '8FTE-140K',
                capacity: load <= 30 ? 30 : load <= 60 ? 50 : 100,
                motor: load <= 30 ? 15 : load <= 60 ? 30 : 55,
                speed: 1450, oilCooling: 'profile-specific', economizer: false, profile
            }),
            R290: () => ({
                series: 'R290_SCROLL', type: 'scroll', manufacturer: 'Copeland',
                model: load <= 24 ? 'YH*1G R290 Scroll' : 'YH*1G R290 Parallel Scroll Pack',
                capacity: 24, motor: 12, speed: 2900, oilCooling: 'profile-specific', economizer: false, profile
            }),
            R32: () => ({
                series: 'R32_SCROLL', type: 'scroll', manufacturer: 'Copeland',
                model: load <= 40 ? 'YP R32 Scroll' : 'YPV R32 Variable-Speed Scroll',
                capacity: load <= 40 ? 40 : 60, motor: load <= 40 ? 15 : 22,
                speed: 2900, oilCooling: 'profile-specific', economizer: false, profile
            }),
            R410A: () => ({
                series: 'R410A_SCROLL', type: 'scroll', manufacturer: 'Copeland',
                model: 'ZP R410A Scroll', capacity: 45, motor: 18,
                speed: 2900, oilCooling: 'profile-specific', economizer: false, profile
            })
        };
        const key = profile?.id || refrigerant;
        if (byProfile[key]) return byProfile[key]();

        const isAmmonia = Boolean(profile?.family === 'ammonia-industrial');
        // A confirmed P&ID semantic contract has priority over any load-band fallback.
        // Do not let a low preliminary load silently convert a declared screw package
        // into a reciprocating machine.
        const requestedType = String(project?.semanticCycle?.compressorFamily || project?.designIntent?.compressorType || project?.compressorType || '').toLowerCase();
        let selectedSeries;
        let selectedSize;
        if (requestedType === 'screw') {
            selectedSeries = load >= 500 ? 'OS' : 'HS';
            selectedSize = selectedSeries === 'OS'
                ? load < 200 ? 'small' : load < 500 ? 'medium' : load < 1000 ? 'large' : 'xlarge'
                : load < 100 ? 'small' : load < 250 ? 'medium' : 'large';
        } else if (requestedType === 'reciprocating' || requestedType === 'piston') {
            selectedSeries = 'REC';
            selectedSize = load < 15 ? 'small' : load < 45 ? 'medium' : 'large';
        } else if (!isAmmonia && load <= 150) {
            selectedSeries = 'REC';
            selectedSize = load < 15 ? 'small' : load < 45 ? 'medium' : 'large';
        } else if (load < 30) {
            selectedSeries = 'REC';
            selectedSize = load < 15 ? 'small' : 'medium';
        } else if (load < 500) {
            selectedSeries = 'HS';
            selectedSize = load < 100 ? 'small' : load < 250 ? 'medium' : 'large';
        } else {
            selectedSeries = 'OS';
            selectedSize = load < 200 ? 'small' : load < 500 ? 'medium' : load < 1000 ? 'large' : 'xlarge';
        }
        const series = this.compressorSeries[selectedSeries];
        const model = series.models[selectedSize];
        return {
            series: selectedSeries, type: series.type, model: model.model,
            capacity: (model.capacity[0] + model.capacity[1]) / 2,
            motor: (model.motor[0] + model.motor[1]) / 2,
            speed: series.speeds[0], oilCooling: series.oilCooling,
            economizer: series.economizer, profile
        };
    }
    _determineCount(load, selection) {
        // Calculate number of operating units
        if (!load || load <= 0) return { operating: 1, standby: 0 };
        const cap = selection.capacity || 10;
        const operating = Math.ceil(load / cap);

        // Standby: 1 for <=3 operating, 2 for >3
        const standby = operating <= 3 ? 1 : 2;

        return { operating, standby };
    }

    _formatPriceRange(baseTotal) {
        const eco = Math.round(baseTotal * 0.85).toLocaleString();
        const std = Math.round(baseTotal).toLocaleString();
        const prem = Math.round(baseTotal * 1.35).toLocaleString();
        return `Eco: $${eco} | Std: $${std} | Prem: $${prem}`;
    }

    _generateScenarios(selection, qty, cop) {
        const basePrice = this._estimatePrice(selection, qty);
        return [
            {
                name: "Economical",
                description: "Standard Efficiency, Reciprocating/Screw, Basic Controls",
                price: Math.round(basePrice.total * 0.85),
                cop: Math.round(cop * 0.95 * 100) / 100
            },
            {
                name: "Best Value",
                description: "High Efficiency, Mycom/GEA Screw, Standard Controls",
                price: basePrice.total,
                cop: Math.round(cop * 100) / 100
            },
            {
                name: "Premium",
                description: "Top Tier Efficiency, VFD, Full Redundancy, Extended Warranty",
                price: Math.round(basePrice.total * 1.35),
                cop: Math.round(cop * 1.10 * 100) / 100
            }
        ];
    }

    _estimateCOP(evapTemp, condTemp, config) {
        // More accurate COP based on ASHRAE/manufacturer data
        // Real COP = Q / W = (h1 - h4) / (h2 - h1) * η_volumetric

        const T_evap_K = evapTemp + 273.15;
        const T_cond_K = condTemp + 273.15;

        // Carnot COP as theoretical maximum
        const carnotCOP = T_evap_K / (T_cond_K - T_evap_K);

        // Isentropic efficiency (based on compression ratio and compressor type)
        // Screw compressors: 70-85%, Reciprocating: 65-80%
        const compressionRatio = T_cond_K / T_evap_K;
        let eta_isentropic = 0.78 - 0.015 * (compressionRatio - 3);
        eta_isentropic = Math.max(0.60, Math.min(0.85, eta_isentropic));

        // Volumetric efficiency (affected by superheat and clearance)
        // η_vol = 1 - C × (PR^(1/n) - 1) where C=clearance, n=polytropic index
        const clearance = 0.04;  // 4% clearance ratio
        const n = 1.2;  // Polytropic index for NH3
        let eta_volumetric = 1 - clearance * (Math.pow(compressionRatio, 1 / n) - 1);
        eta_volumetric = Math.max(0.65, Math.min(0.95, eta_volumetric));

        // Motor efficiency
        const eta_motor = 0.93;

        // Configuration adjustments
        let configFactor = 1.0;
        if (config === 'economizer') configFactor = 1.12;  // 12% improvement
        if (config === 'booster') configFactor = 1.08;     // 8% improvement

        // Calculate real COP
        // COP_real ≈ COP_carnot × η_isentropic × η_volumetric × η_motor × config
        // But this overestimates, so we use empirical correction factor of 0.4-0.5
        const empiricalFactor = 0.45;
        let cop = carnotCOP * eta_isentropic * empiricalFactor * configFactor;

        // Apply temperature-based limits from manufacturer data
        // NH3 @ Te=-18°C, Tc=+35°C → COP ≈ 3.2-3.8
        // NH3 @ Te=-35°C, Tc=+35°C → COP ≈ 1.8-2.2
        // NH3 @ Te=-45°C, Tc=+35°C → COP ≈ 1.2-1.5
        const minCOP = evapTemp < -40 ? 1.0 : evapTemp < -30 ? 1.5 : evapTemp < -20 ? 2.5 : 3.0;
        const maxCOP = evapTemp < -40 ? 1.8 : evapTemp < -30 ? 2.5 : evapTemp < -20 ? 4.0 : 5.5;

        cop = Math.max(minCOP, Math.min(maxCOP, cop));

        return {
            value: Math.round(cop * 100) / 100,
            carnotCOP: Math.round(carnotCOP * 100) / 100,
            etaIsentropic: Math.round(eta_isentropic * 100) / 100,
            etaVolumetric: Math.round(eta_volumetric * 100) / 100,
            compressionRatio: Math.round(compressionRatio * 100) / 100
        };
    }

    _selectManufacturer(series) {
        // Select manufacturer based on series and market availability
        const manufacturers = {
            'OS': 'Mycom',      // Open screw - Mycom market leader
            'HS': 'GEA Bock',   // Semi-hermetic - GEA/Bock
            'REC': 'Bitzer'     // Reciprocating - Bitzer
        };
        return manufacturers[series] || 'Mycom';
    }

    _estimateVolumetricEfficiency(evapTemp, compressionRatio) {
        // Volumetric efficiency decreases with compression ratio
        let baseEfficiency = 0.85;

        // Adjust for temperature
        if (evapTemp < -30) baseEfficiency -= 0.05;
        if (evapTemp < -40) baseEfficiency -= 0.05;

        // Adjust for compression ratio
        baseEfficiency -= (compressionRatio - 2) * 0.03;

        return Math.max(0.60, Math.min(0.90, baseEfficiency));
    }
}

module.exports = CompressorSelector;
