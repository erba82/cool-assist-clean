/**
 * Intelligent Valve Selection Engine
 * Danfoss valve selection based on capacity, temperature, pressure, and application type
 */

const DanfossValveDB = require('../data/DanfossValveDatabase');

class ValveSelectionEngine {
    /**
     * Select appropriate solenoid valve for a given application
     * @param {number} loadKW - Cooling capacity in kW
     * @param {string} application - 'liquid', 'suction', or 'discharge'
     * @param {number} deltaP - Pressure drop in bar (optional, default 0.5)
     * @returns {object} - Selected valve with specification
     */
    static selectSolenoidValve(loadKW, application = 'liquid', deltaP = 0.5) {
        const suitable = DanfossValveDB.solenoidValves.filter(v => {
            const appMatch = v.application.some(a => a.toLowerCase().includes(application.toLowerCase()));
            const capacityMatch = v.maxFlowCapacity_kW >= loadKW;
            return appMatch && capacityMatch;
        }).sort((a, b) => a.maxFlowCapacity_kW - b.maxFlowCapacity_kW);

        // Select the smallest valve that meets requirements (efficiency)
        return suitable[0] || DanfossValveDB.solenoidValves[DanfossValveDB.solenoidValves.length - 1];
    }

    /**
     * Select expansion valve based on evaporator load and temperature
     * @param {number} loadKW - Evaporator cooling capacity in kW
     * @param {number} evapTemp - Evaporation temperature in °C
     * @param {string} valveType - 'automatic' (AKV) or 'electronic' (ETS)
     * @returns {object} - Selected expansion valve
     */
    static selectExpansionValve(loadKW, evapTemp, valveType = 'automatic') {
        // Select capacity key based on temperature
        let capacityKey;
        if (evapTemp >= 0) capacityKey = 'capacity_kW_at_5C';
        else if (evapTemp >= -15) capacityKey = 'capacity_kW_at_minus10C';
        else capacityKey = 'capacity_kW_at_minus30C';

        // Choose database based on type
        const database = valveType === 'electronic'
            ? DanfossValveDB.expansionValves_ETS
            : DanfossValveDB.expansionValves_AKV;

        // Filter and sort by capacity
        const suitable = database.filter(v =>
            v[capacityKey] >= loadKW * 0.8 // 80% minimum to allow headroom
        ).sort((a, b) => a[capacityKey] - b[capacityKey]);

        return suitable[0] || database[database.length - 1];
    }

    /**
     * Select ICS or ICM valve for liquid line control
     * @param {number} loadKW - Required capacity in kW
     * @param {string} lineType - 'liquid' or 'suction'
     * @param {string} controlType - 'pilot' (ICS) or 'motor' (ICM)
     * @param {number} circulationRate - Liquid recirculation ratio (default 4)
     * @param {number} deltaP - Pressure drop in bar (default 0.2)
     * @returns {object} - Selected valve with corrected capacity
     */
    static selectICSorICM(loadKW, lineType = 'liquid', controlType = 'pilot', circulationRate = 4, deltaP = 0.2) {
        const database = controlType === 'motor' ? DanfossValveDB.icmValves : DanfossValveDB.icsValves;

        // Capacity key based on line type
        const capacityKey = lineType === 'liquid'
            ? 'nominalCapacity_liquid_kW'
            : 'nominalCapacity_wetSuction_kW';

        // Correction factors (from Danfoss documentation)
        const fDeltaP = this.getCorrectionFactor_DeltaP(deltaP);
        const fCirc = this.getCorrectionFactor_Circulation(circulationRate);

        // Required nominal capacity accounting for corrections
        const requiredNominal = loadKW / (fDeltaP * fCirc);

        // Filter and select
        const suitable = database.filter(v =>
            v[capacityKey] >= requiredNominal
        ).sort((a, b) => a[capacityKey] - b[capacityKey]);

        const selected = suitable[0] || database[database.length - 1];

        return {
            ...selected,
            actualCapacity_kW: selected[capacityKey] * fDeltaP * fCirc,
            correctionFactors: { deltaP: fDeltaP, circulation: fCirc }
        };
    }

    /**
     * Pressure drop correction factor (Danfoss table approximation)
     * @param {number} deltaP - Pressure drop in bar
     * @returns {number} - Correction factor
     */
    static getCorrectionFactor_DeltaP(deltaP) {
        if (deltaP >= 0.5) return 1.12;
        if (deltaP >= 0.4) return 1.06;
        if (deltaP >= 0.3) return 0.95;
        if (deltaP >= 0.2) return 1.0; // Nominal
        if (deltaP >= 0.1) return 0.71;
        return 0.5;
    }

    /**
     * Circulation rate correction factor
     * @param {number} circulationRate - Recirculation ratio
     * @returns {number} - Correction factor
     */
    static getCorrectionFactor_Circulation(circulationRate) {
        if (circulationRate >= 6) return 1.09;
        if (circulationRate >= 5) return 1.04;
        if (circulationRate >= 4) return 1.0; // Nominal
        if (circulationRate >= 3) return 0.90;
        if (circulationRate >= 2) return 0.75;
        return 0.6;
    }

    /**
     * Select check valve based on pipe size
     * @param {number} pipeSize_DN - Pipe nominal diameter
     * @returns {object} - Selected check valve
     */
    static selectCheckValve(pipeSize_DN) {
        const suitable = DanfossValveDB.checkValves.filter(v =>
            v.size_dn >= pipeSize_DN
        ).sort((a, b) => a.size_dn - b.size_dn);

        return suitable[0] || DanfossValveDB.checkValves[DanfossValveDB.checkValves.length - 1];
    }

    /**
     * Select strainer based on pipe size
     * @param {number} pipeSize_DN - Pipe nominal diameter
     * @returns {object} - Selected strainer
     */
    static selectStrainer(pipeSize_DN) {
        const suitable = DanfossValveDB.strainers.filter(v =>
            v.size_dn >= pipeSize_DN
        ).sort((a, b) => a.size_dn - b.size_dn);

        return suitable[0] || DanfossValveDB.strainers[DanfossValveDB.strainers.length - 1];
    }

    /**
     * Select safety relief valve based on system pressure and capacity
     * @param {number} systemPressure_bar - Maximum system pressure
     * @param {number} compressorCapacity_kW - Total compressor capacity
     * @returns {object} - Selected safety valve
     */
    static selectSafetyValve(systemPressure_bar, compressorCapacity_kW) {
        // Estimate required discharge capacity (kg/min)
        // Rough approximation: 1 kW ≈ 1 kg/min ammonia vapor
        const requiredDischarge = compressorCapacity_kW;

        // Select appropriate set pressure (typically 10% above system pressure)
        const setPressure = Math.ceil(systemPressure_bar * 1.1);

        const suitable = DanfossValveDB.safetyValves.filter(v => {
            const pressureMatch = v.setPressure_bar.some(p => p >= setPressure);
            const capacityMatch = v.dischargeCapacity_kgPerMin_at_24bar >= requiredDischarge;
            return pressureMatch && capacityMatch;
        }).sort((a, b) => a.dischargeCapacity_kgPerMin_at_24bar - b.dischargeCapacity_kgPerMin_at_24bar);

        const selected = suitable[0] || DanfossValveDB.safetyValves[DanfossValveDB.safetyValves.length - 1];

        return {
            ...selected,
            recommendedSetPressure_bar: setPressure
        };
    }

    /**
     * Complete valve station selection for a single evaporator
     * @param {number} evapLoadKW - Evaporator capacity in kW
     * @param {number} evapTemp - Evaporation temperature in °C
     * @param {number} feedPipeDN - Feed pipe size (DN)
     * @param {object} options - Additional options
     * @returns {object} - Complete valve station specification
     */
    static selectCompleteValveStation(evapLoadKW, evapTemp, feedPipeDN, options = {}) {
        const {
            expansionType = 'automatic', // or 'electronic'
            circulationRate = 4,
            deltaP = 0.2,
            systemPressure = 18
        } = options;

        return {
            strainer: this.selectStrainer(feedPipeDN),
            solenoidValve: this.selectSolenoidValve(evapLoadKW, 'liquid'),
            expansionValve: this.selectExpansionValve(evapLoadKW, evapTemp, expansionType),
            checkValve: this.selectCheckValve(feedPipeDN),
            totalPrice: 0 // Will be calculated
        };
    }
}

module.exports = ValveSelectionEngine;
