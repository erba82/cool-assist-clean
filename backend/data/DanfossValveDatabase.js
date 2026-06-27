/**
 * Comprehensive Danfoss Valve Database for Ammonia Refrigeration
 * Based on official Danfoss catalogs and technical documentation
 * Includes: ICS, ICM/ICAD, EVR/EVRA, AKV, ETS, NRV, SFA valves
 */

const DanfossValveDatabase = {
    // ========================================================================
    // SOLENOID VALVES - EVR/EVRA Series (Ammonia R717)
    // ========================================================================
    solenoidValves: [
        {
            series: 'EVRA',
            model: 'EVRA 3',
            size_dn: 10,
            refrigerant: 'R717',
            application: ['Liquid Line', 'Suction Line', 'Hot Gas Line'],
            maxWorkingPressure_bar: 28,
            maxFlowCapacity_kW: 15,
            voltageOptions: ['24V AC/DC', '110V', '230V'],
            connectionType: 'Flare',
            actuatorType: 'Direct Acting',
            price_usd: 280,
            features: ['Manual opening stem', 'Hermetically sealed coil', 'Compact design'],
            operatingTempRange: { min: -60, max: 120 } // °C
        },
        {
            series: 'EVRA',
            model: 'EVRA 6',
            size_dn: 12,
            refrigerant: 'R717',
            application: ['Liquid Line', 'Suction Line', 'Hot Gas Line'],
            maxWorkingPressure_bar: 28,
            maxFlowCapacity_kW: 35,
            voltageOptions: ['24V AC/DC', '110V', '230V'],
            connectionType: 'Flare',
            actuatorType: 'Direct Acting',
            price_usd: 320,
            features: ['Manual opening stem', 'Hermetically sealed coil', 'Compact design'],
            operatingTempRange: { min: -60, max: 120 }
        },
        {
            series: 'EVRA',
            model: 'EVRA 10',
            size_dn: 16,
            refrigerant: 'R717',
            application: ['Liquid Line', 'Suction Line', 'Hot Gas Line'],
            maxWorkingPressure_bar: 28,
            maxFlowCapacity_kW: 65,
            voltageOptions: ['24V AC/DC', '110V', '230V'],
            connectionType: 'Flare',
            actuatorType: 'Direct Acting',
            price_usd: 380,
            features: ['Manual opening stem', 'Hermetically sealed coil'],
            operatingTempRange: { min: -60, max: 120 }
        },
        {
            series: 'EVRA',
            model: 'EVRA 15',
            size_dn: 20,
            refrigerant: 'R717',
            application: ['Liquid Line', 'Suction Line', 'Hot Gas Line'],
            maxWorkingPressure_bar: 28,
            maxFlowCapacity_kW: 110,
            voltageOptions: ['24V AC/DC', '110V', '230V'],
            connectionType: 'Flare',
            actuatorType: 'Direct Acting',
            price_usd: 450,
            operatingTempRange: { min: -60, max: 120 }
        },
        {
            series: 'EVRA',
            model: 'EVRA 25',
            size_dn: 28,
            refrigerant: 'R717',
            application: ['Liquid Line', 'Suction Line', 'Hot Gas Line'],
            maxWorkingPressure_bar: 28,
            maxFlowCapacity_kW: 200,
            voltageOptions: ['24V AC/DC', '110V', '230V'],
            connectionType: 'Flare',
            actuatorType: 'Pilot Operated',
            price_usd: 580,
            operatingTempRange: { min: -60, max: 120 }
        },
        {
            series: 'EVRA',
            model: 'EVRA 32',
            size_dn: 32,
            refrigerant: 'R717',
            application: ['Liquid Line', 'Suction Line', 'Hot Gas Line'],
            maxWorkingPressure_bar: 28,
            maxFlowCapacity_kW: 280,
            voltageOptions: ['24V AC/DC', '110V', '230V'],
            connectionType: 'Flare',
            actuatorType: 'Pilot Operated',
            price_usd: 680,
            operatingTempRange: { min: -60, max: 120 }
        }
    ],

    // ========================================================================
    // EXPANSION VALVES - AKV Series (Automatic/Electric)
    // ========================================================================
    expansionValves_AKV: [
        {
            series: 'AKV',
            model: 'AKV 10-1',
            size_dn: 10,
            refrigerant: 'R717',
            valveType: 'Automatic Expansion Valve',
            capacity_kW_at_5C: 25,
            capacity_kW_at_minus10C: 18,
            capacity_kW_at_minus30C: 10,
            maxWorkingPressure_bar: 28,
            connectionType: 'Flare',
            adjustmentRange_bar: '0.5 - 5.0',
            price_usd: 420,
            features: ['Constant pressure control', 'Manual adjustment', 'Built-in strainer']
        },
        {
            series: 'AKV',
            model: 'AKV 15-1',
            size_dn: 16,
            refrigerant: 'R717',
            valveType: 'Automatic Expansion Valve',
            capacity_kW_at_5C: 60,
            capacity_kW_at_minus10C: 42,
            capacity_kW_at_minus30C: 25,
            maxWorkingPressure_bar: 28,
            connectionType: 'Flare',
            adjustmentRange_bar: '0.5 - 5.0',
            price_usd: 520,
            features: ['Constant pressure control', 'Manual adjustment', 'Built-in strainer']
        },
        {
            series: 'AKV',
            model: 'AKV 20-1',
            size_dn: 20,
            refrigerant: 'R717',
            valveType: 'Automatic Expansion Valve',
            capacity_kW_at_5C: 100,
            capacity_kW_at_minus10C: 70,
            capacity_kW_at_minus30C: 40,
            maxWorkingPressure_bar: 28,
            connectionType: 'Flare',
            adjustmentRange_bar: '0.5 - 5.0',
            price_usd: 650,
            features: ['Constant pressure control', 'Manual adjustment', 'Built-in strainer']
        }
    ],

    // ========================================================================
    // ELECTRONIC EXPANSION VALVES - ETS Series
    // ========================================================================
    expansionValves_ETS: [
        {
            series: 'ETS',
            model: 'ETS 12.5',
            size_dn: 6,
            refrigerant: 'R717',
            valveType: 'Electronic Expansion Valve (Stepper Motor)',
            capacity_kW_at_5C: 12,
            capacity_kW_at_minus10C: 8,
            capacity_kW_at_minus30C: 5,
            maxWorkingPressure_bar: 52,
            connectionType: 'Flare',
            controlType: 'Digital PWM',
            price_usd: 580,
            features: ['Precise superheat control', 'Energy efficient', 'AKC controller compatible']
        },
        {
            series: 'ETS',
            model: 'ETS 25',
            size_dn: 10,
            refrigerant: 'R717',
            valveType: 'Electronic Expansion Valve (Stepper Motor)',
            capacity_kW_at_5C: 25,
            capacity_kW_at_minus10C: 18,
            capacity_kW_at_minus30C: 10,
            maxWorkingPressure_bar: 52,
            connectionType: 'Flare',
            controlType: 'Digital PWM',
            price_usd: 720,
            features: ['Precise superheat control', 'Energy efficient', 'AKC controller compatible']
        },
        {
            series: 'ETS',
            model: 'ETS 100',
            size_dn: 16,
            refrigerant: 'R717',
            valveType: 'Electronic Expansion Valve (Stepper Motor)',
            capacity_kW_at_5C: 100,
            capacity_kW_at_minus10C: 70,
            capacity_kW_at_minus30C: 40,
            maxWorkingPressure_bar: 52,
            connectionType: 'Flare',
            controlType: 'Digital PWM',
            price_usd: 950,
            features: ['Precise superheat control', 'Energy efficient', 'AKC controller compatible']
        }
    ],

    // ========================================================================
    // ICS VALVES - Industrial Control Servo Valves (Pilot Operated)
    // ========================================================================
    icsValves: [
        {
            series: 'ICS',
            model: 'ICS 25-10',
            size_dn: 25,
            refrigerant: 'R717',
            valveType: 'Pilot-Operated Servo Valve',
            // Capacity Table (Nominal: Circulation rate=4, ΔP=0.2 bar)
            nominalCapacity_liquid_kW: 117,
            nominalCapacity_wetSuction_kW: 50,
            maxWorkingPressure_bar: 52,
            connectionType: 'Flange',
            modulesCompatible: ['CVPP', 'CVP', 'CVC', 'ICAD'],
            price_usd: 1200,
            features: ['Modular design', 'Multiple control functions', 'Low pressure drop']
        },
        {
            series: 'ICS',
            model: 'ICS 32',
            size_dn: 32,
            refrigerant: 'R717',
            valveType: 'Pilot-Operated Servo Valve',
            nominalCapacity_liquid_kW: 190,
            nominalCapacity_wetSuction_kW: 60,
            maxWorkingPressure_bar: 52,
            connectionType: 'Flange',
            modulesCompatible: ['CVPP', 'CVP', 'CVC', 'ICAD'],
            price_usd: 1450,
            features: ['Modular design', 'Multiple control functions', 'Low pressure drop']
        },
        {
            series: 'ICS',
            model: 'ICS 40',
            size_dn: 40,
            refrigerant: 'R717',
            valveType: 'Pilot-Operated Servo Valve',
            nominalCapacity_liquid_kW: 300,
            nominalCapacity_wetSuction_kW: 95,
            maxWorkingPressure_bar: 52,
            connectionType: 'Flange',
            modulesCompatible: ['CVPP', 'CVP', 'CVC', 'ICAD'],
            price_usd: 1680,
            features: ['Modular design', 'Multiple control functions', 'Low pressure drop']
        },
        {
            series: 'ICS',
            model: 'ICS 50',
            size_dn: 50,
            refrigerant: 'R717',
            valveType: 'Pilot-Operated Servo Valve',
            nominalCapacity_liquid_kW: 480,
            nominalCapacity_wetSuction_kW: 150,
            maxWorkingPressure_bar: 52,
            connectionType: 'Flange',
            modulesCompatible: ['CVPP', 'CVP', 'CVC', 'ICAD'],
            price_usd: 2100,
            features: ['Modular design', 'Multiple control functions', 'Low pressure drop']
        },
        {
            series: 'ICS',
            model: 'ICS 65',
            size_dn: 65,
            refrigerant: 'R717',
            valveType: 'Pilot-Operated Servo Valve',
            nominalCapacity_liquid_kW: 750,
            nominalCapacity_wetSuction_kW: 240,
            maxWorkingPressure_bar: 52,
            connectionType: 'Flange',
            modulesCompatible: ['CVPP', 'CVP', 'CVC', 'ICAD'],
            price_usd: 2600,
            features: ['Modular design', 'Multiple control functions', 'Low pressure drop']
        },
        {
            series: 'ICS',
            model: 'ICS 80',
            size_dn: 80,
            refrigerant: 'R717',
            valveType: 'Pilot-Operated Servo Valve',
            nominalCapacity_liquid_kW: 1200,
            nominalCapacity_wetSuction_kW: 380,
            maxWorkingPressure_bar: 52,
            connectionType: 'Flange',
            modulesCompatible: ['CVPP', 'CVP', 'CVC', 'ICAD'],
            price_usd: 3200,
            features: ['Modular design', 'Multiple control functions', 'Low pressure drop']
        },
        {
            series: 'ICS',
            model: 'ICS 100',
            size_dn: 100,
            refrigerant: 'R717',
            valveType: 'Pilot-Operated Servo Valve',
            nominalCapacity_liquid_kW: 1900,
            nominalCapacity_wetSuction_kW: 600,
            maxWorkingPressure_bar: 52,
            connectionType: 'Flange',
            modulesCompatible: ['CVPP', 'CVP', 'CVC', 'ICAD'],
            price_usd: 4200,
            features: ['Modular design', 'Multiple control functions', 'Low pressure drop']
        },
        {
            series: 'ICS',
            model: 'ICS 125',
            size_dn: 125,
            refrigerant: 'R717',
            valveType: 'Pilot-Operated Servo Valve',
            nominalCapacity_liquid_kW: 2900,
            nominalCapacity_wetSuction_kW: 920,
            maxWorkingPressure_bar: 52,
            connectionType: 'Flange',
            modulesCompatible: ['CVPP', 'CVP', 'CVC', 'ICAD'],
            price_usd: 5400,
            features: ['Modular design', 'Multiple control functions', 'Low pressure drop']
        },
        {
            series: 'ICS',
            model: 'ICS 150',
            size_dn: 150,
            refrigerant: 'R717',
            valveType: 'Pilot-Operated Servo Valve',
            nominalCapacity_liquid_kW: 4200,
            nominalCapacity_wetSuction_kW: 1320,
            maxWorkingPressure_bar: 52,
            connectionType: 'Flange',
            modulesCompatible: ['CVPP', 'CVP', 'CVC', 'ICAD'],
            price_usd: 6800,
            features: ['Modular design', 'Multiple control functions', 'Low pressure drop']
        }
    ],

    // ========================================================================
    // ICM VALVES + ICAD ACTUATORS (Motor-Operated Valves)
    // ========================================================================
    icmValves: [
        {
            series: 'ICM',
            model: 'ICM 20',
            size_dn: 20,
            refrigerant: 'R717',
            valveType: 'Motor-Operated Control Valve',
            actuator: 'ICAD 1200 (Digital Stepper Motor)',
            nominalCapacity_liquid_kW: 80,
            maxWorkingPressure_bar: 52,
            connectionType: 'Flange',
            price_usd: 1850,
            features: ['Digital LCD display', 'Precise positioning', '0-100% modulation', 'Self-calibrating']
        },
        {
            series: 'ICM',
            model: 'ICM 32',
            size_dn: 32,
            refrigerant: 'R717',
            valveType: 'Motor-Operated Control Valve',
            actuator: 'ICAD 1200',
            nominalCapacity_liquid_kW: 190,
            maxWorkingPressure_bar: 52,
            connectionType: 'Flange',
            price_usd: 2100,
            features: ['Digital LCD display', 'Precise positioning', '0-100% modulation', 'Self-calibrating']
        },
        {
            series: 'ICM',
            model: 'ICM 50',
            size_dn: 50,
            refrigerant: 'R717',
            valveType: 'Motor-Operated Control Valve',
            actuator: 'ICAD 1200',
            nominalCapacity_liquid_kW: 480,
            maxWorkingPressure_bar: 52,
            connectionType: 'Flange',
            price_usd: 2850,
            features: ['Digital LCD display', 'Precise positioning', '0-100% modulation', 'Self-calibrating']
        },
        {
            series: 'ICM',
            model: 'ICM 65',
            size_dn: 65,
            refrigerant: 'R717',
            valveType: 'Motor-Operated Control Valve',
            actuator: 'ICAD 1200',
            nominalCapacity_liquid_kW: 750,
            maxWorkingPressure_bar: 52,
            connectionType: 'Flange',
            price_usd: 3400,
            features: ['Digital LCD display', 'Precise positioning', '0-100% modulation', 'Self-calibrating']
        },
        {
            series: 'ICM',
            model: 'ICM 100',
            size_dn: 100,
            refrigerant: 'R717',
            valveType: 'Motor-Operated Control Valve',
            actuator: 'ICAD 1200',
            nominalCapacity_liquid_kW: 1900,
            maxWorkingPressure_bar: 52,
            connectionType: 'Flange',
            price_usd: 5200,
            features: ['Digital LCD display', 'Precise positioning', '0-100% modulation', 'Self-calibrating']
        }
    ],

    // ========================================================================
    // CHECK VALVES - NRV Series (Non-Return Valves)
    // ========================================================================
    checkValves: [
        {
            series: 'NRV',
            model: 'NRV 15',
            size_dn: 15,
            refrigerant: 'R717',
            valveType: 'Check Valve (Spring Loaded)',
            maxWorkingPressure_bar: 52,
            connectionType: 'Flare',
            crackingPressure_bar: 0.05,
            price_usd: 120,
            features: ['Low pressure drop', 'Prevents reverse flow', 'Compact design']
        },
        {
            series: 'NRV',
            model: 'NRV 22',
            size_dn: 22,
            refrigerant: 'R717',
            valveType: 'Check Valve (Spring Loaded)',
            maxWorkingPressure_bar: 52,
            connectionType: 'Flare',
            crackingPressure_bar: 0.05,
            price_usd: 150,
            features: ['Low pressure drop', 'Prevents reverse flow', 'Compact design']
        },
        {
            series: 'NRV',
            model: 'NRV 28',
            size_dn: 28,
            refrigerant: 'R717',
            valveType: 'Check Valve (Spring Loaded)',
            maxWorkingPressure_bar: 52,
            connectionType: 'Flare',
            crackingPressure_bar: 0.05,
            price_usd: 180,
            features: ['Low pressure drop', 'Prevents reverse flow', 'Compact design']
        }
    ],

    // ========================================================================
    // SAFETY RELIEF VALVES - SFA Series
    // ========================================================================
    safetyValves: [
        {
            series: 'SFA',
            model: 'SFA-0015',
            size_dn: 15,
            refrigerant: 'R717',
            valveType: 'Safety Relief Valve',
            setPressure_bar: [16, 18, 20, 22, 24],
            dischargeCapacity_kgPerMin_at_24bar: 45,
            maxWorkingPressure_bar: 28,
            connectionType: 'Flare',
            price_usd: 380,
            features: ['Preset pressure', 'Quick response', 'Sealed cap', 'ASME/PED certified']
        },
        {
            series: 'SFA',
            model: 'SFA-0022',
            size_dn: 22,
            refrigerant: 'R717',
            valveType: 'Safety Relief Valve',
            setPressure_bar: [16, 18, 20, 22, 24],
            dischargeCapacity_kgPerMin_at_24bar: 90,
            maxWorkingPressure_bar: 28,
            connectionType: 'Flare',
            price_usd: 450,
            features: ['Preset pressure', 'Quick response', 'Sealed cap', 'ASME/PED certified']
        }
    ],

    // ========================================================================
    // STRAINERS - Y-Type and Basket Type
    // ========================================================================
    strainers: [
        {
            type: 'Y-Strainer',
            model: 'STR-15Y',
            size_dn: 15,
            refrigerant: 'R717',
            meshSize_micron: 600,
            maxWorkingPressure_bar: 52,
            connectionType: 'Flare',
            price_usd: 95,
            features: ['Removable screen', 'Blow-down port', 'Corrosion resistant']
        },
        {
            type: 'Y-Strainer',
            model: 'STR-22Y',
            size_dn: 22,
            refrigerant: 'R717',
            meshSize_micron: 600,
            maxWorkingPressure_bar: 52,
            connectionType: 'Flare',
            price_usd: 125,
            features: ['Removable screen', 'Blow-down port', 'Corrosion resistant']
        },
        {
            type: 'Y-Strainer',
            model: 'STR-28Y',
            size_dn: 28,
            refrigerant: 'R717',
            meshSize_micron: 600,
            maxWorkingPressure_bar: 52,
            connectionType: 'Flare',
            price_usd: 155,
            features: ['Removable screen', 'Blow-down port', 'Corrosion resistant']
        }
    ]
};

module.exports = DanfossValveDatabase;

