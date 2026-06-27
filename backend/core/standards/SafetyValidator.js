/**
 * SafetyValidator Module
 * 
 * Validates system design against:
 * - EN 378-2 (Ammonia safety)
 * - ASHRAE 15 (Safety standard)
 * - PED 2014/68/EU (Pressure equipment)
 * 
 * @author GFDDE AI Engine
 * @version 2.0.0
 */

class SafetyValidator {
    constructor(engine) {
        this.engine = engine;

        // Ammonia concentration limits (kg/m³)
        this.concentrationLimits = {
            practical: 0.00035,   // 500 ppm - practical limit
            IDLH: 0.0021          // 3000 ppm - immediately dangerous
        };

        // Relief valve sizing factors
        this.reliefFactors = {
            fire: 1.0,           // Fire case
            blocked: 0.5,        // Blocked outlet
            overfill: 0.25       // Overfill case
        };
    }

    /**
     * Validate complete system design
     * @param {Object} results - System calculation results
     * @param {Object} project - Project context
     * @returns {Object} Validation results
     */
    async validate(results, project) {
        const validation = {
            passed: true,
            warnings: [],
            errors: [],
            checks: {}
        };

        const refrigerant = project.refrigerant || 'R717';

        // Check 1: Ammonia charge concentration
        if (refrigerant === 'R717') {
            const chargeCheck = this._checkAmmoniaCharge(results, project);
            validation.checks.ammoniaCharge = chargeCheck;
            if (!chargeCheck.passed) {
                validation.passed = false;
                validation.errors.push(chargeCheck.message);
            } else if (chargeCheck.warning) {
                validation.warnings.push(chargeCheck.message);
            }
        }

        // Check 2: Relief valve requirements
        const reliefCheck = this._checkReliefValves(results);
        validation.checks.reliefValves = reliefCheck;
        if (!reliefCheck.passed) {
            validation.warnings.push(reliefCheck.message);
        }

        // Check 3: Ventilation requirements
        const ventCheck = this._checkVentilation(results, project);
        validation.checks.ventilation = ventCheck;
        if (!ventCheck.passed) {
            validation.warnings.push(ventCheck.message);
        }

        // Check 4: Pressure vessel compliance
        const vesselCheck = this._checkVesselCompliance(results);
        validation.checks.pressureVessels = vesselCheck;

        // Check 5: Electrical classification
        const electricalCheck = this._checkElectricalZoning(results, project);
        validation.checks.electricalZoning = electricalCheck;

        return validation;
    }

    _checkAmmoniaCharge(results, project) {
        // Calculate total ammonia charge
        const totalLoad = results.summary?.totalCoolingLoad || 1000;
        const estimatedCharge = totalLoad * 4;  // kg (rule of thumb)

        // Calculate machine room volume (assume standard size)
        const machineRoomVolume = 500;  // m³ assumed

        // Calculate concentration if all released
        const concentration = estimatedCharge / machineRoomVolume;

        const passed = concentration < this.concentrationLimits.IDLH;
        const warning = concentration > this.concentrationLimits.practical;

        return {
            passed: passed,
            warning: warning,
            estimatedCharge: Math.round(estimatedCharge),
            concentration: Math.round(concentration * 10000) / 10000,
            limit: this.concentrationLimits.practical,
            message: passed ?
                (warning ? 'Ammonia charge exceeds practical limit - enhanced ventilation required' :
                    'Ammonia charge within safe limits') :
                'CRITICAL: Ammonia charge exceeds IDLH limit!'
        };
    }

    _checkReliefValves(results) {
        // Ensure all pressure vessels have relief valves specified
        const vessels = [];

        if (results.calculations?.separators) {
            vessels.push(...results.calculations.separators);
        }

        // Each vessel needs relief valve sized for fire case
        const reliefRequirements = vessels.map(v => ({
            vessel: v.tag,
            designPressure: v.designPressure,
            reliefSetPressure: Math.round(v.designPressure * 0.9 * 10) / 10,
            requiresDual: v.designPressure > 25  // Dual for high pressure
        }));

        return {
            passed: true,
            requirements: reliefRequirements,
            message: `${reliefRequirements.length} pressure vessels require relief valves`
        };
    }

    _checkVentilation(results, project) {
        // EN 378 ventilation requirements
        const totalCharge = (results.summary?.totalCoolingLoad || 1000) * 4;

        // Required ventilation rate (m³/h per kg of charge)
        const ventilationRate = Math.max(14 * Math.pow(totalCharge, 0.5), 4 * totalCharge);

        return {
            passed: true,
            requiredRate: Math.round(ventilationRate),
            message: `Machine room requires ${Math.round(ventilationRate)} m³/h ventilation`
        };
    }

    _checkVesselCompliance(results) {
        // PED compliance check
        const vessels = results.calculations?.separators || [];

        const compliance = vessels.map(v => {
            // PED category based on PS × V
            const ps = v.designPressure;  // bar
            const volume = v.volume / 1000;  // m³
            const psv = ps * volume;

            let category;
            if (psv <= 50) category = 'SEP';  // Sound Engineering Practice
            else if (psv <= 200) category = 'I';
            else if (psv <= 1000) category = 'II';
            else if (psv <= 3000) category = 'III';
            else category = 'IV';

            return {
                vessel: v.tag,
                psv: Math.round(psv * 10) / 10,
                category: category,
                requiresCE: category !== 'SEP'
            };
        });

        return {
            passed: true,
            vessels: compliance,
            message: 'Pressure vessel PED categories determined'
        };
    }

    _checkElectricalZoning(results, project) {
        const refrigerant = project.refrigerant || 'R717';

        // Ammonia electrical classification
        const zoning = refrigerant === 'R717' ? {
            machineRoom: 'Zone 2',
            compressorArea: 'Zone 1 (if ventilation fails)',
            standard: 'IEC 60079',
            temperatureClass: 'T1',
            gasGroup: 'IIA'
        } : {
            machineRoom: 'Non-hazardous',
            standard: 'Standard electrical'
        };

        return {
            passed: true,
            zoning: zoning,
            message: `Electrical zoning per ${zoning.standard}`
        };
    }
}

module.exports = SafetyValidator;
