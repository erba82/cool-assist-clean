/**
 * Comprehensive Equipment Database for Ammonia Refrigeration Systems
 * All data based on real manufacturers and industry standards
 * Organized by equipment type with detailed specifications
 */

const EquipmentDatabase = {
    // ========================================================================
    // COMPRESSORS - Ammonia Screw & Reciprocating Compressors
    // ========================================================================
    compressors: [
        // RECIPROCATING COMPRESSORS - Grasso
        {
            manufacturer: 'Grasso',
            model: 'V-300',
            type: 'Reciprocating',
            refrigerant: 'R717',
            capacity_40C: 45,    // kW at -40°C evap, 30°C cond
            capacity_35C: 55,
            capacity_30C: 65,
            capacity_25C: 75,
            capacity_10C: 120,
            capacity_5C: 145,
            capacity_0C: 170,
            power_40C: 38,       // kW motor power
            power_10C: 52,
            displacement: 76,    // m³/h
            price_usd: 18000,
            region: 'global',
            efficiency: 0.85
        },
        {
            manufacturer: 'Grasso',
            model: 'V-450',
            type: 'Reciprocating',
            refrigerant: 'R717',
            capacity_40C: 65,
            capacity_35C: 80,
            capacity_30C: 95,
            capacity_25C: 110,
            capacity_10C: 180,
            capacity_5C: 215,
            capacity_0C: 250,
            power_40C: 55,
            power_10C: 78,
            displacement: 114,
            price_usd: 24000,
            region: 'global',
            efficiency: 0.86
        },

        // SCREW COMPRESSORS - Bitzer
        {
            manufacturer: 'Bitzer',
            model: 'OSKA 8451-K',
            type: 'Screw',
            refrigerant: 'R717',
            capacity_40C: 110,
            capacity_35C: 135,
            capacity_30C: 160,
            capacity_25C: 185,
            capacity_10C: 280,
            capacity_5C: 320,
            capacity_0C: 365,
            power_40C: 95,
            power_10C: 125,
            displacement: 450,
            price_usd: 38000,
            region: 'global',
            efficiency: 0.88
        },
        {
            manufacturer: 'Bitzer',
            model: 'OSKA 8561-K',
            type: 'Screw',
            refrigerant: 'R717',
            capacity_40C: 145,
            capacity_35C: 175,
            capacity_30C: 210,
            capacity_25C: 245,
            capacity_10C: 370,
            capacity_5C: 425,
            capacity_0C: 485,
            power_40C: 125,
            power_10C: 165,
            displacement: 590,
            price_usd: 45000,
            region: 'global',
            efficiency: 0.89
        },

        // SCREW COMPRESSORS - Howden
        {
            manufacturer: 'Howden',
            model: 'XRV 203',
            type: 'Screw',
            refrigerant: 'R717',
            capacity_40C: 180,
            capacity_35C: 220,
            capacity_30C: 265,
            capacity_25C: 310,
            capacity_10C: 480,
            capacity_5C: 550,
            capacity_0C: 625,
            power_40C: 155,
            power_10C: 205,
            displacement: 750,
            price_usd: 52000,
            region: 'global',
            efficiency: 0.90
        },
        {
            manufacturer: 'Howden',
            model: 'XRV 305',
            type: 'Screw',
            refrigerant: 'R717',
            capacity_40C: 280,
            capacity_35C: 340,
            capacity_30C: 410,
            capacity_25C: 480,
            capacity_10C: 750,
            capacity_5C: 860,
            capacity_0C: 980,
            power_40C: 240,
            power_10C: 320,
            displacement: 1180,
            price_usd: 68000,
            region: 'global',
            efficiency: 0.91
        },

        // SCREW COMPRESSORS - Mycom
        {
            manufacturer: 'Mycom',
            model: 'N200VLD-K',
            type: 'Screw',
            refrigerant: 'R717',
            capacity_40C: 320,
            capacity_35C: 390,
            capacity_30C: 470,
            capacity_25C: 550,
            capacity_10C: 860,
            capacity_5C: 985,
            capacity_0C: 1120,
            power_40C: 275,
            power_10C: 365,
            displacement: 1350,
            price_usd: 78000,
            region: 'global',
            efficiency: 0.92
        },
        {
            manufacturer: 'Mycom',
            model: 'N320VLD-K',
            type: 'Screw',
            refrigerant: 'R717',
            capacity_40C: 510,
            capacity_35C: 620,
            capacity_30C: 750,
            capacity_25C: 880,
            capacity_10C: 1370,
            capacity_5C: 1570,
            capacity_0C: 1790,
            power_40C: 440,
            power_10C: 585,
            displacement: 2150,
            price_usd: 95000,
            region: 'global',
            efficiency: 0.93
        }
    ],

    // ========================================================================
    // EVAPORATORS - Air Unit Coolers
    // ========================================================================
    evaporators: [
        {
            manufacturer: 'Guntner',
            model: 'GACC 050',
            type: 'Air Cooler',
            refrigerant: 'R717',
            capacity_30C: 25,
            capacity_25C: 30,
            capacity_10C: 45,
            capacity_0C: 55,
            air_throw: 25,
            fans: 1,
            fan_diameter: 500,
            fan_power: 0.55,
            fin_spacing: 7,
            defrost: 'Hot Gas',
            price_usd: 4500,
            region: 'global'
        },
        {
            manufacturer: 'Guntner',
            model: 'GACC 065',
            type: 'Air Cooler',
            refrigerant: 'R717',
            capacity_30C: 40,
            capacity_25C: 48,
            capacity_10C: 70,
            capacity_0C: 85,
            air_throw: 35,
            fans: 2,
            fan_diameter: 500,
            fan_power: 1.1,
            fin_spacing: 7,
            defrost: 'Hot Gas',
            price_usd: 6800,
            region: 'global'
        },
        {
            manufacturer: 'Kelvion',
            model: 'KBC 40',
            type: 'Blast Freezer',
            refrigerant: 'R717',
            capacity_40C: 35,
            capacity_35C: 42,
            capacity_30C: 50,
            air_throw: 30,
            fans: 2,
            fan_diameter: 630,
            fan_power: 3.0,
            fin_spacing: 10,
            defrost: 'Hot Gas',
            price_usd: 8500,
            region: 'global'
        },
        {
            manufacturer: 'Kelvion',
            model: 'KBC 60',
            type: 'Blast Freezer',
            refrigerant: 'R717',
            capacity_40C: 55,
            capacity_35C: 65,
            capacity_30C: 75,
            air_throw: 40,
            fans: 3,
            fan_diameter: 630,
            fan_power: 4.5,
            fin_spacing: 10,
            defrost: 'Hot Gas',
            price_usd: 12000,
            region: 'global'
        },
        {
            manufacturer: 'Alfa Laval',
            model: 'Optigo 50',
            type: 'Air Cooler',
            refrigerant: 'R717',
            capacity_30C: 50,
            capacity_25C: 60,
            capacity_10C: 90,
            capacity_0C: 110,
            air_throw: 38,
            fans: 2,
            fan_diameter: 630,
            fan_power: 1.5,
            fin_spacing: 7,
            defrost: 'Hot Gas',
            price_usd: 7500,
            region: 'global'
        },
        {
            manufacturer: 'Alfa Laval',
            model: 'Optigo 80',
            type: 'Air Cooler',
            refrigerant: 'R717',
            capacity_30C: 80,
            capacity_25C: 95,
            capacity_10C: 140,
            capacity_0C: 170,
            air_throw: 45,
            fans: 3,
            fan_diameter: 630,
            fan_power: 2.2,
            fin_spacing: 7,
            defrost: 'Hot Gas',
            price_usd: 11000,
            region: 'global'
        }
    ],

    // ========================================================================
    condensers: [
        {
            manufacturer: 'Baltimore Aircoil',
            model: 'VXC 205',
            type: 'Evaporative',
            refrigerant: 'R717',
            capacity: 650,       // kW rejection at 35°C ambient
            fans: 2,
            fan_power: 5.5,      // kW per fan
            pump_power: 3.7,     // kW
            water_flow: 45,      // m³/h
            air_flow: 85000,     // m³/h
            price_usd: 32000,
            region: 'global'
        },
        {
            manufacturer: 'Baltimore Aircoil',
            model: 'VXC 355',
            type: 'Evaporative',
            refrigerant: 'R717',
            capacity: 1100,
            fans: 2,
            fan_power: 7.5,
            pump_power: 5.5,
            water_flow: 78,
            air_flow: 145000,
            price_usd: 45000,
            region: 'global'
        },
        {
            manufacturer: 'Baltimore Aircoil',
            model: 'VXC 560',
            type: 'Evaporative',
            refrigerant: 'R717',
            capacity: 1850,
            fans: 3,
            fan_power: 7.5,
            pump_power: 7.5,
            water_flow: 128,
            air_flow: 240000,
            price_usd: 68000,
            region: 'global'
        },
        {
            manufacturer: 'Evapco',
            model: 'AT 73',
            type: 'Evaporative',
            refrigerant: 'R717',
            capacity: 850,
            fans: 2,
            fan_power: 5.5,
            pump_power: 4.0,
            water_flow: 60,
            air_flow: 110000,
            price_usd: 38000,
            region: 'global'
        },
        {
            manufacturer: 'Local Manufacturer',
            model: 'Generic-500kW',
            type: 'Evaporative',
            refrigerant: 'R717',
            capacity: 500,
            fans: 2,
            fan_power: 4.0,
            pump_power: 3.0,
            water_flow: 35,
            air_flow: 65000,
            price_usd: 18000,
            region: 'local'
        }
    ],

    // ========================================================================
    // PUMPS - Ammonia Liquid Pumps
    // ========================================================================
    pumps: [
        {
            manufacturer: 'Hermetic',
            model: 'CAM 2/3',
            type: 'Centrifugal',
            refrigerant: 'R717',
            flow_min: 3,         // m³/h
            flow_max: 8,
            head: 40,            // meters
            power: 2.2,          // kW
            price_usd: 4200,
            region: 'global'
        },
        {
            manufacturer: 'Hermetic',
            model: 'CAM 4/6',
            type: 'Centrifugal',
            refrigerant: 'R717',
            flow_min: 5,
            flow_max: 12,
            head: 45,
            power: 3.7,
            price_usd: 5500,
            region: 'global'
        },
        {
            manufacturer: 'Witt',
            model: 'HRP 5040',
            type: 'Centrifugal',
            refrigerant: 'R717',
            flow_min: 4,
            flow_max: 10,
            head: 50,
            power: 3.0,
            price_usd: 4800,
            region: 'global'
        },
        {
            manufacturer: 'Witt',
            model: 'HRP 8060',
            type: 'Centrifugal',
            refrigerant: 'R717',
            flow_min: 7,
            flow_max: 16,
            head: 60,
            power: 5.5,
            price_usd: 6200,
            region: 'global'
        }
    ],

    // ========================================================================
    // VESSELS - Pressure Vessels
    // ========================================================================
    vessels: [
        {
            type: 'Surge Drum',
            subtype: 'Low Pressure Receiver',
            temperature_design: -40,
            pressure_design: 6,  // bar
            volume_range: [500, 1000, 1500, 2000, 3000],  // liters
            price_per_liter: 8,  // USD
            region: 'global'
        },
        {
            type: 'Intercooler',
            subtype: 'Vertical Separator',
            temperature_design: -10,
            pressure_design: 8,
            volume_range: [800, 1200, 1800, 2500],
            price_per_liter: 10,
            region: 'global'
        },
        {
            type: 'High Pressure Receiver',
            subtype: 'Horizontal Vessel',
            temperature_design: 40,
            pressure_design: 20,
            volume_range: [500, 800, 1200, 1800, 2500],
            price_per_liter: 12,
            region: 'global'
        }
    ]
};

module.exports = EquipmentDatabase;
