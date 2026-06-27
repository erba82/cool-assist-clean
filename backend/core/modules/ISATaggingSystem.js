/**
 * ISATaggingSystem Module
 * 
 * Implements ISA 5.1 (ANSI/ISA-5.1-2009) standard for instrumentation symbols and identification
 * 
 * Tag Format: [Function][Loop Number]
 * - First letter: Measured/Initiating variable (T=Temperature, P=Pressure, F=Flow, L=Level)
 * - Subsequent letters: Modifier/Function (I=Indicator, C=Controller, V=Valve, S=Switch)
 * 
 * Examples from reference manual:
 * - TI: Temperature Indicator
 * - PI: Pressure Indicator
 * - PIC: Pressure Indicating Controller
 * - FCV: Flow Control Valve
 * - PSV: Pressure Safety Valve
 * - LC: Level Controller
 * 
 * For R-717 (Ammonia) systems, special attention to:
 * - PSV (Pressure Safety Valves) - critical for safety
 * - Emergency discharge lines
 * - Oil separation equipment
 * - Liquid level controls
 * 
 * @author GFDDE AI Engine
 * @version 1.0.0
 */

class ISATaggingSystem {
    constructor() {
        // ISA 5.1 First Letter (Measured/Initiating Variable)
        this.firstLetters = {
            'A': 'Analysis',
            'B': 'Burner/Combustion',
            'C': 'Conductivity',
            'D': 'Density/Specific Gravity',
            'E': 'Voltage',
            'F': 'Flow',
            'G': 'Gauging',
            'H': 'Hand (Manual)',
            'I': 'Current',
            'J': 'Power',
            'K': 'Time/Schedule',
            'L': 'Level',
            'M': 'Moisture/Humidity',
            'N': 'User Defined',
            'O': 'User Defined',
            'P': 'Pressure',
            'Q': 'Quantity',
            'R': 'Radiation',
            'S': 'Speed/Frequency',
            'T': 'Temperature',
            'U': 'Multivariable',
            'V': 'Vibration',
            'W': 'Weight/Force',
            'X': 'Unclassified',
            'Y': 'Event/State',
            'Z': 'Position/Dimension'
        };

        // ISA 5.1 Subsequent Letters (Modifier/Function)
        this.subsequentLetters = {
            'A': 'Alarm',
            'C': 'Controller',
            'D': 'Differential',
            'E': 'Element (Primary)',
            'F': 'Ratio',
            'G': 'Glass/Gauge',
            'H': 'High',
            'I': 'Indicator',
            'J': 'Scan',
            'K': 'Control Station',
            'L': 'Low',
            'M': 'Middle/Intermediate',
            'N': 'User Defined',
            'O': 'Orifice/Restriction',
            'P': 'Point (Test)',
            'Q': 'Integrate/Totalize',
            'R': 'Record',
            'S': 'Switch',
            'T': 'Transmit',
            'U': 'Multifunction',
            'V': 'Valve',
            'W': 'Well',
            'X': 'Unclassified',
            'Y': 'Relay/Compute',
            'Z': 'Driver/Actuator'
        };

        // Common instrument combinations
        this.commonTags = {
            // Temperature
            'TI': { name: 'Temperature Indicator', location: 'Local' },
            'TT': { name: 'Temperature Transmitter', location: 'Field' },
            'TIC': { name: 'Temperature Indicating Controller', location: 'Panel' },
            'TSH': { name: 'Temperature Switch High', location: 'Field' },
            'TSL': { name: 'Temperature Switch Low', location: 'Field' },

            // Pressure
            'PI': { name: 'Pressure Indicator', location: 'Local' },
            'PT': { name: 'Pressure Transmitter', location: 'Field' },
            'PIC': { name: 'Pressure Indicating Controller', location: 'Panel' },
            'PSV': { name: 'Pressure Safety Valve', location: 'Field', critical: true },
            'PSH': { name: 'Pressure Switch High', location: 'Field' },
            'PSL': { name: 'Pressure Switch Low', location: 'Field' },
            'PSHH': { name: 'Pressure Switch High High', location: 'Field', critical: true },

            // Flow
            'FI': { name: 'Flow Indicator', location: 'Local' },
            'FT': { name: 'Flow Transmitter', location: 'Field' },
            'FIC': { name: 'Flow Indicating Controller', location: 'Panel' },
            'FCV': { name: 'Flow Control Valve', location: 'Field' },

            // Level
            'LI': { name: 'Level Indicator', location: 'Local' },
            'LT': { name: 'Level Transmitter', location: 'Field' },
            'LIC': { name: 'Level Indicating Controller', location: 'Panel' },
            'LC': { name: 'Level Controller', location: 'Panel' },
            'LSH': { name: 'Level Switch High', location: 'Field' },
            'LSL': { name: 'Level Switch Low', location: 'Field' },
            'LSHH': { name: 'Level Switch High High', location: 'Field', critical: true },
            'LSLL': { name: 'Level Switch Low Low', location: 'Field', critical: true }
        };

        // Equipment tags (ISO 81346)
        this.equipmentTags = {
            'C': 'Compressor',
            'E': 'Heat Exchanger',
            'P': 'Pump',
            'V': 'Vessel/Tank',
            'SEP': 'Separator',
            'EVAP': 'Evaporator',
            'COND': 'Condenser',
            'COMP': 'Compressor',
            'REC': 'Receiver'
        };
    }

    /**
     * Generate instrument tag
     * @param {string} variable - Measured variable (T, P, F, L)
     * @param {string} function - Instrument function (I, C, V, S)
     * @param {number} loopNumber - Loop identification number
     * @param {string} modifier - Optional modifier (H, L, HH, LL)
     * @returns {Object} Tag information
     */
    generateTag(variable, functionCode, loopNumber, modifier = '') {
        const tagCode = variable + functionCode + modifier;
        const tag = `${tagCode}-${String(loopNumber).padStart(3, '0')}`;

        const info = this.commonTags[tagCode] || {
            name: `${this.firstLetters[variable]} ${this.subsequentLetters[functionCode]}`,
            location: 'Field'
        };

        return {
            tag,
            code: tagCode,
            loopNumber,
            variable: this.firstLetters[variable],
            function: this.subsequentLetters[functionCode],
            name: info.name,
            location: info.location,
            critical: info.critical || false
        };
    }

    /**
     * Generate equipment tag
     * @param {string} equipmentType - Equipment type code
     * @param {string} identifier - Equipment identifier
     * @returns {string} Equipment tag
     */
    generateEquipmentTag(equipmentType, identifier) {
        return `${equipmentType}-${identifier}`;
    }

    /**
     * Get R-717 (Ammonia) specific safety instrumentation
     * Based on reference manual requirements
     */
    getAmmoniaInstrumentation() {
        return {
            // Critical pressure safety
            pressureSafety: [
                this.generateTag('P', 'SV', 101),  // PSV-101: Compressor discharge
                this.generateTag('P', 'SV', 102),  // PSV-102: Receiver
                this.generateTag('P', 'SV', 103),  // PSV-103: Condenser
                this.generateTag('P', 'SHH', 101), // PSHH-101: High pressure alarm
            ],

            // Level controls (critical for oil separation)
            levelControls: [
                this.generateTag('L', 'IC', 101),  // LIC-101: Receiver level
                this.generateTag('L', 'IC', 102),  // LIC-102: Oil separator level
                this.generateTag('L', 'SHH', 101), // LSHH-101: High level alarm
                this.generateTag('L', 'SLL', 101), // LSLL-101: Low level alarm
            ],

            // Temperature monitoring
            temperatureMonitoring: [
                this.generateTag('T', 'I', 101),   // TI-101: Suction temperature
                this.generateTag('T', 'I', 102),   // TI-102: Discharge temperature
                this.generateTag('T', 'SH', 101),  // TSH-101: High temp alarm
            ],

            // Leak detection (critical for ammonia)
            leakDetection: [
                {
                    tag: 'AE-101',
                    name: 'Ammonia Leak Detector',
                    location: 'Compressor Room',
                    alarmLevel: '25 ppm',
                    critical: true
                },
                {
                    tag: 'AE-102',
                    name: 'Ammonia Leak Detector',
                    location: 'Machine Room',
                    alarmLevel: '25 ppm',
                    critical: true
                }
            ],

            // Emergency systems
            emergencySystems: [
                {
                    tag: 'XV-101',
                    name: 'Emergency Isolation Valve',
                    location: 'Main Refrigerant Line',
                    type: 'Solenoid',
                    failPosition: 'Closed'
                },
                {
                    tag: 'PV-101',
                    name: 'Emergency Vent Valve',
                    location: 'Discharge to Scrubber',
                    type: 'Manual/Remote'
                }
            ]
        };
    }

    /**
     * Validate tag format
     */
    validateTag(tag) {
        const pattern = /^[A-Z]{2,4}-\d{3}$/;
        return pattern.test(tag);
    }

    /**
     * Get tag description
     */
    getTagDescription(tagCode) {
        return this.commonTags[tagCode] || null;
    }
}

module.exports = ISATaggingSystem;
