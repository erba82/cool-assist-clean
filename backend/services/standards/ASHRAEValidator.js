// backend/services/standards/ASHRAEValidator.js
/**
 * ASHRAE Standards Validator for GFDDE
 * Implements ASHRAE Standard 15 (Safety) and Standard 34 (Refrigerant Classification)
 */

const RefrigerantDatabase = require('../../data/RefrigerantDatabase');

class ASHRAEValidator {
    constructor() {
        this.standard15_version = '2022';
        this.standard34_version = '2022';
    }

    /**
     * Validate complete system design against ASHRAE Standard 15
     * @param {Object} design - System design with components and layout
     * @param {Object} siteInfo - Site information (room volumes, occupancy, etc.)
     * @returns {Object} Validation results with compliance status
     */
    validateStandard15(design, siteInfo) {
        const refrigerant = design.refrigerant || 'R717';
        const refData = RefrigerantDatabase.getRefrigerant(refrigerant);

        if (!refData) {
            return {
                compliant: false,
                errors: [`Unknown refrigerant: ${refrigerant}`]
            };
        }

        const results = {
            compliant: true,
            errors: [],
            warnings: [],
            recommendations: [],
            refrigerant_info: {
                name: refData.name,
                safety_class: refData.safetyClass,
                toxicity: refData.toxicity,
                flammability: refData.flammability
            }
        };

        // Check 1: Refrigerant detection requirements
        if (refData.safety.requiresDetection) {
            results.warnings.push({
                code: 'ASHRAE_15_7.4',
                message: `${refrigerant} requires leak detection system`,
                threshold: `${refData.safety.detectionThreshold} ppm`
            });
        }

        // Check 2: Charge limit calculation (especially for A2L refrigerants)
        if (refData.flammability === '2L' || refData.flammability === '2') {
            const chargeLimit = this.calculateChargeLimitA2L(
                refrigerant,
                refData,
                siteInfo.room_volume || 50
            );

            const estimatedCharge = this.estimateSystemCharge(design);

            if (estimatedCharge > chargeLimit.max_charge_kg) {
                results.compliant = false;
                results.errors.push({
                    code: 'ASHRAE_15_7.2',
                    message: `Refrigerant charge exceeds safe limit for A2L refrigerant`,
                    estimated_charge: `${estimatedCharge.toFixed(2)} kg`,
                    max_allowed: `${chargeLimit.max_charge_kg.toFixed(2)} kg`,
                    room_volume: `${siteInfo.room_volume} m³`
                });
            }

            results.charge_analysis = chargeLimit;
        }

        // Check 3: Ventilation requirements
        if (refData.safety.requiresVentilation) {
            const ventRate = this.calculateVentilationRate(refrigerant, refData, siteInfo);
            results.recommendations.push({
                code: 'ASHRAE_15_8',
                message: 'Emergency mechanical ventilation required',
                ventilation_rate: `${ventRate} CFM`,
                activation: 'Triggered by leak detector or manual'
            });
        }

        // Check 4: Pressure relief valves
        const maxPressure = this.calculateMaxOperatingPressure(design);
        results.recommendations.push({
            code: 'ASHRAE_15_9',
            message: 'Install pressure relief valves on all pressure vessels',
            set_pressure: `${(maxPressure * 1.1).toFixed(1)} bar (110% of max operating)`
        });

        // Check 5: Material compatibility (for ammonia)
        if (refrigerant === 'R717') {
            const incompatible = this.checkMaterialCompatibility(design, refData);
            if (incompatible.length > 0) {
                results.compliant = false;
                results.errors.push({
                    code: 'ASHRAE_15_6',
                    message: 'Incompatible materials detected for ammonia',
                    components: incompatible
                });
            }
        }

        // Check 6: Machinery room classification
        if (siteInfo.machinery_room) {
            results.recommendations.push({
                code: 'ASHRAE_15_8.11',
                message: 'Machinery room requirements',
                requirements: [
                    'Separate from occupied spaces',
                    'Vapor detector with alarm',
                    'Emergency shut-off switch outside room',
                    'Self-closing door opening outward',
                    'Mechanical ventilation (0.5 CFM/ft²)'
                ]
            });
        }

        return results;
    }

    /**
     * Calculate charge limit for A2L refrigerants per ASHRAE 15.2-2022
     */
    calculateChargeLimitA2L(refrigerant, refData, roomVolume) {
        // Based on ASHRAE 15 Table 7.2.1
        // m = V × LFL × h / (4 × A_floor)
        // Simplified: For residential, charge must keep concentration below 25% of LFL

        const LFL = refData.safety.lowerFlammabilityLimit; // ppm
        const safetyFactor = 0.25; // 25% of LFL
        const concentration_limit = LFL * safetyFactor; // ppm

        // Get refrigerant molecular weight
        const MW = refData.properties.molarMass; // g/mol

        // Calculate maximum charge
        // Concentration (ppm) = (mass_kg × 10^6) / (volume_m³ × air_density × MW/29)
        // Rearranging: mass_kg = (concentration × volume × 29) / (10^6)

        const max_charge_kg = (concentration_limit * roomVolume * MW) / (1000000 * 1.2);

        return {
            refrigerant,
            room_volume_m3: roomVolume,
            LFL_ppm: LFL,
            safety_factor: safetyFactor,
            max_concentration_ppm: concentration_limit,
            max_charge_kg: max_charge_kg,
            compliance_method: 'ASHRAE 15.2-2022 Table 7.2.1'
        };
    }

    /**
     * Estimate total system refrigerant charge
     */
    estimateSystemCharge(design) {
        let charge = 0;

        // Compressor charge (typical: 0.5 kg per kW capacity)
        const compCapacity = design.components
            ?.filter(c => c.type === 'compressor')
            .reduce((sum, c) => sum + (c.capacity || 0), 0) || 100;
        charge += compCapacity * 0.5;

        // Condenser charge (typical: 0.3 kg per kW)
        const condCapacity = design.components
            ?.filter(c => c.type === 'condenser')
            .reduce((sum, c) => sum + parseFloat(c.capacity || 0), 0) || 100;
        charge += condCapacity * 0.3;

        // Evaporator charge (typical: 0.2 kg per kW)
        const evapCapacity = design.components
            ?.filter(c => c.type === 'evaporator')
            .reduce((sum, c) => sum + (c.capacity || 0), 0) || 100;
        charge += evapCapacity * 0.2;

        // Receiver charge (if present)
        const receivers = design.components?.filter(c => c.type === 'receiver') || [];
        receivers.forEach(r => {
            charge += (r.capacity || 10) * 0.6; // kg per liter
        });

        // Piping charge (estimated 10% of total)
        charge *= 1.1;

        return charge;
    }

    /**
     * Calculate required ventilation rate
     */
    calculateVentilationRate(refrigerant, refData, siteInfo) {
        const roomVolume = siteInfo.room_volume || 50; // m³
        const airChangesPerHour = refrigerant === 'R717' ? 30 : 20;

        // CFM = (Volume_m³ × ACH) / 1.699
        const cfm = (roomVolume * airChangesPerHour) / 1.699;

        return Math.ceil(cfm);
    }

    /**
     * Calculate maximum operating pressure
     */
    calculateMaxOperatingPressure(design) {
        // Simplified: use condensing pressure + margin
        // In production, this would calculate from actual operating conditions
        return 25; // bar (typical for ammonia at 40°C condensing)
    }

    /**
     * Check material compatibility
     */
    checkMaterialCompatibility(design, refData) {
        const incompatible = [];

        if (refData.compatibility?.materials?.avoid) {
            const avoidMaterials = refData.compatibility.materials.avoid;

            // Check piping
            if (design.piping) {
                Object.entries(design.piping).forEach(([lineType, spec]) => {
                    if (spec.material && avoidMaterials.includes(spec.material)) {
                        incompatible.push(`${lineType}: ${spec.material} (use ${refData.compatibility.materials.suitable.join(' or ')})`);
                    }
                });
            }
        }

        return incompatible;
    }

    /**
     * Validate refrigerant classification per ASHRAE Standard 34
     */
    validateStandard34(refrigerant) {
        const refData = RefrigerantDatabase.getRefrigerant(refrigerant);

        if (!refData) {
            return {
                valid: false,
                error: `Refrigerant ${refrigerant} not found in database`
            };
        }

        return {
            valid: true,
            designation: refData.id,
            safety_classification: refData.safetyClass,
            toxicity_class: refData.toxicity,
            flammability_class: refData.flammability,
            description: this.getSafetyClassDescription(refData.safetyClass),
            gwp: refData.properties.globalWarmingPotential,
            odp: refData.properties.ozoneDeplectionPotential,
            regulatory_status: this.getRegulatoryStatus(refData)
        };
    }

    getSafetyClassDescription(safetyClass) {
        const descriptions = {
            'A1': 'Lower toxicity, no flame propagation (safest)',
            'A2': 'Lower toxicity, lower flammability',
            'A2L': 'Lower toxicity, mildly flammable (low burning velocity)',
            'A3': 'Lower toxicity, higher flammability',
            'B1': 'Higher toxicity, no flame propagation',
            'B2': 'Higher toxicity, lower flammability',
            'B2L': 'Higher toxicity, mildly flammable',
            'B3': 'Higher toxicity, higher flammability'
        };

        return descriptions[safetyClass] || 'Unknown classification';
    }

    getRegulatoryStatus(refData) {
        if (refData.phaseOut) {
            return {
                status: 'Restricted',
                reason: refData.phaseOut.reason,
                deadline: refData.phaseOut.deadline
            };
        }

        if (refData.properties.ozoneDeplectionPotential > 0) {
            return {
                status: 'Regulated',
                reason: 'Contains ODP substance (Montreal Protocol)'
            };
        }

        if (refData.properties.globalWarmingPotential > 2500) {
            return {
                status: 'High-GWP',
                reason: 'Subject to phase-down under Kigali Amendment'
            };
        }

        return {
            status: 'Approved',
            reason: 'Meets current environmental regulations'
        };
    }
}

module.exports = new ASHRAEValidator();
