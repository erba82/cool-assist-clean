/**
 * Complete Demo Test with Manual Data
 * Shows the full system working with Ardabil Poultry Slaughterhouse example
 */

const IntelligentDesignService = require('./services/intelligentDesignService');

// Since AI is not available, create the parsed data manually from your example
const manualParsedData = {
    projectInfo: {
        name: 'کشتارگاه اردبیل (Ardabil Poultry Slaughterhouse)',
        location: 'اردبیل, ایران',
        refrigerant: 'NH3'
    },
    rooms: [
        // 1. Chilling Room
        {
            id: 'room-1',
            name: 'Chilling Room',
            type: 'chilling',
            dimensions: { length: 20, width: 8, height: 4 },
            temperature: -5,
            quantity: 1,
            productFlow: {
                type: 'chicken',
                inletTemp: 25,
                outletTemp: 5,
                residenceTime: 0.5 // 30 minutes
            },
            insulation: {
                type: 'Polyurethane Foam',
                thickness: 10, // cm
                density: 40,
                floor: { type: 'Reinforced Concrete', reinforced: true }
            },
            doors: {
                quantity: 1,
                dimensions: { height: 280, width: 250, thickness: 15 },
                openingsPerDay: 0, // Doesn't open during shift
                openDuration: 0
            },
            people: 1,
            lighting: 0
        },
        // 2-5. Freezing Tunnels (4x)
        {
            id: 'room-2',
            name: 'Freezing Tunnel 1',
            type: 'freezing_tunnel',
            dimensions: { length: 4, width: 4, height: 4 },
            temperature: -40,
            quantity: 1,
            productFlow: {
                type: 'chicken',
                inletTemp: -5,
                outletTemp: -18,
                residenceTime: 8 // 8 hours
            },
            insulation: {
                type: 'Polyurethane Foam',
                thickness: 10,
                density: 40,
                floor: { type: 'Reinforced Concrete', reinforced: true }
            },
            doors: {
                quantity: 1,
                dimensions: { height: 280, width: 250, thickness: 15 },
                openingsPerDay: 0,
                openDuration: 0
            },
            people: 1,
            lighting: 0
        },
        {
            id: 'room-3',
            name: 'Freezing Tunnel 2',
            type: 'freezing_tunnel',
            dimensions: { length: 4, width: 4, height: 4 },
            temperature: -40,
            quantity: 1,
            productFlow: {
                type: 'chicken',
                inletTemp: -5,
                outletTemp: -18,
                residenceTime: 8
            },
            insulation: {
                type: 'Polyurethane Foam',
                thickness: 10,
                density: 40,
                floor: { type: 'Reinforced Concrete', reinforced: true }
            },
            doors: {
                quantity: 1,
                dimensions: { height: 280, width: 250, thickness: 15 },
                openingsPerDay: 0,
                openDuration: 0
            },
            people: 1,
            lighting: 0
        },
        {
            id: 'room-4',
            name: 'Freezing Tunnel 3',
            type: 'freezing_tunnel',
            dimensions: { length: 4, width: 4, height: 4 },
            temperature: -40,
            quantity: 1,
            productFlow: {
                type: 'chicken',
                inletTemp: -5,
                outletTemp: -18,
                residenceTime: 8
            },
            insulation: {
                type: 'Polyurethane Foam',
                thickness: 10,
                density: 40,
                floor: { type: 'Reinforced Concrete', reinforced: true }
            },
            doors: {
                quantity: 1,
                dimensions: { height: 280, width: 250, thickness: 15 },
                openingsPerDay: 0,
                openDuration: 0
            },
            people: 1,
            lighting: 0
        },
        {
            id: 'room-5',
            name: 'Freezing Tunnel 4',
            type: 'freezing_tunnel',
            dimensions: { length: 4, width: 4, height: 4 },
            temperature: -40,
            quantity: 1,
            productFlow: {
                type: 'chicken',
                inletTemp: -5,
                outletTemp: -18,
                residenceTime: 8
            },
            insulation: {
                type: 'Polyurethane Foam',
                thickness: 10,
                density: 40,
                floor: { type: 'Reinforced Concrete', reinforced: true }
            },
            doors: {
                quantity: 1,
                dimensions: { height: 280, width: 250, thickness: 15 },
                openingsPerDay: 0,
                openDuration: 0
            },
            people: 1,
            lighting: 0
        },
        // 6-9. Pre-cooling Rooms (4x)
        {
            id: 'room-6',
            name: 'Pre-cooling Room 1',
            type: 'pre_cooling',
            dimensions: { length: 10, width: 8, height: 9 },
            temperature: -5,
            quantity: 1,
            productFlow: {
                type: 'chicken',
                inletTemp: 5,
                outletTemp: -5,
                residenceTime: 3 // 3 hours
            },
            insulation: {
                type: 'Polyurethane Foam',
                thickness: 10,
                density: 40,
                floor: { type: 'Reinforced Concrete', reinforced: true }
            },
            doors: {
                quantity: 1,
                dimensions: { height: 280, width: 250, thickness: 15 },
                openingsPerDay: 10,
                openDuration: 10
            },
            people: 1,
            lighting: 0
        },
        {
            id: 'room-7',
            name: 'Pre-cooling Room 2',
            type: 'pre_cooling',
            dimensions: { length: 10, width: 8, height: 9 },
            temperature: -5,
            quantity: 1,
            productFlow: {
                type: 'chicken',
                inletTemp: 5,
                outletTemp: -5,
                residenceTime: 3
            },
            insulation: {
                type: 'Polyurethane Foam',
                thickness: 10,
                density: 40,
                floor: { type: 'Reinforced Concrete', reinforced: true }
            },
            doors: {
                quantity: 1,
                dimensions: { height: 280, width: 250, thickness: 15 },
                openingsPerDay: 10,
                openDuration: 10
            },
            people: 1,
            lighting: 0
        },
        {
            id: 'room-8',
            name: 'Pre-cooling Room 3',
            type: 'pre_cooling',
            dimensions: { length: 10, width: 8, height: 9 },
            temperature: -5,
            quantity: 1,
            productFlow: {
                type: 'chicken',
                inletTemp: 5,
                outletTemp: -5,
                residenceTime: 3
            },
            insulation: {
                type: 'Polyurethane Foam',
                thickness: 10,
                density: 40,
                floor: { type: 'Reinforced Concrete', reinforced: true }
            },
            doors: {
                quantity: 1,
                dimensions: { height: 280, width: 250, thickness: 15 },
                openingsPerDay: 10,
                openDuration: 10
            },
            people: 1,
            lighting: 0
        },
        {
            id: 'room-9',
            name: 'Pre-cooling Room 4',
            type: 'pre_cooling',
            dimensions: { length: 10, width: 8, height: 9 },
            temperature: -5,
            quantity: 1,
            productFlow: {
                type: 'chicken',
                inletTemp: 5,
                outletTemp: -5,
                residenceTime: 3
            },
            insulation: {
                type: 'Polyurethane Foam',
                thickness: 10,
                density: 40,
                floor: { type: 'Reinforced Concrete', reinforced: true }
            },
            doors: {
                quantity: 1,
                dimensions: { height: 280, width: 250, thickness: 15 },
                openingsPerDay: 10,
                openDuration: 10
            },
            people: 1,
            lighting: 0
        },
        // 10-13. Storage Rooms (4x)
        {
            id: 'room-10',
            name: 'Storage Room 1',
            type: 'storage',
            dimensions: { length: 20, width: 15, height: 9 },
            temperature: -18,
            quantity: 1,
            insulation: {
                type: 'Polyurethane Foam',
                thickness: 10,
                density: 40,
                floor: { type: 'Reinforced Concrete', reinforced: true }
            },
            doors: {
                quantity: 1,
                dimensions: { height: 280, width: 250, thickness: 15 },
                openingsPerDay: 10,
                openDuration: 10
            },
            people: 1,
            lighting: 0
        },
        {
            id: 'room-11',
            name: 'Storage Room 2',
            type: 'storage',
            dimensions: { length: 20, width: 15, height: 9 },
            temperature: -18,
            quantity: 1,
            insulation: {
                type: 'Polyurethane Foam',
                thickness: 10,
                density: 40,
                floor: { type: 'Reinforced Concrete', reinforced: true }
            },
            doors: {
                quantity: 1,
                dimensions: { height: 280, width: 250, thickness: 15 },
                openingsPerDay: 10,
                openDuration: 10
            },
            people: 1,
            lighting: 0
        },
        {
            id: 'room-12',
            name: 'Storage Room 3',
            type: 'storage',
            dimensions: { length: 20, width: 15, height: 9 },
            temperature: -18,
            quantity: 1,
            insulation: {
                type: 'Polyurethane Foam',
                thickness: 10,
                density: 40,
                floor: { type: 'Reinforced Concrete', reinforced: true }
            },
            doors: {
                quantity: 1,
                dimensions: { height: 280, width: 250, thickness: 15 },
                openingsPerDay: 10,
                openDuration: 10
            },
            people: 1,
            lighting: 0
        },
        {
            id: 'room-13',
            name: 'Storage Room 4',
            type: 'storage',
            dimensions: { length: 20, width: 15, height: 9 },
            temperature: -18,
            quantity: 1,
            insulation: {
                type: 'Polyurethane Foam',
                thickness: 10,
                density: 40,
                floor: { type: 'Reinforced Concrete', reinforced: true }
            },
            doors: {
                quantity: 1,
                dimensions: { height: 280, width: 250, thickness: 15 },
                openingsPerDay: 10,
                openDuration: 10
            },
            people: 1,
            lighting: 0
        }
    ],
    ambientConditions: {
        outsideTemp: 25, // Inside warehouse
        relativeHumidity: 40
    }
};

async function runCompleteDemo() {
    console.log('\n' + '='.repeat(100));
    console.log('🏭 ARDABIL POULTRY SLAUGHTERHOUSE - COMPLETE REFRIGERATION DESIGN ANALYSIS');
    console.log('='.repeat(100));

    const service = new IntelligentDesignService(null);

    // Apply regional defaults
    console.log('\n📍 STEP 1: DETECTING REGION AND APPLYING STANDARDS...');
    const enrichedData = service.applyRegionalDefaults(manualParsedData);

    console.log('\n   ✓ Location: Ardabil, Iran');
    console.log('   ✓ Region Detected: ' + enrichedData.designCriteria.region.replace(/_/g, ' ').toUpperCase());
    console.log('   ✓ Safety Factor: ' + enrichedData.designCriteria.safetyFactor);
    console.log('\n   📋 Applied Standards:');
    console.log('      • Piping: ' + enrichedData.designCriteria.standards.piping);
    console.log('      • Safety: ' + enrichedData.designCriteria.standards.safety);
    console.log('      • Refrigeration: ' + enrichedData.designCriteria.standards.refrigeration);
    console.log('      • Pressure Vessels: ' + enrichedData.designCriteria.standards.pressure_vessels);
    console.log('      • Electrical: ' + enrichedData.designCriteria.standards.electrical);

    // Calculate loads for each room
    console.log('\n\n🔬 STEP 2: CALCULATING DETAILED LOADS FOR EACH ROOM...\n');
    const roomLoads = [];
    let totalLoad = 0;

    for (const room of enrichedData.rooms) {
        const loads = await service.calculateDetailedLoad(
            room,
            enrichedData.ambientConditions,
            enrichedData.designCriteria
        );

        const evaporators = await service.selectEvaporator(loads.total, room.type, room.dimensions);

        roomLoads.push({
            name: room.name,
            type: room.type,
            dimensions: room.dimensions,
            temperature: room.temperature,
            loads: loads,
            evaporators: evaporators
        });

        totalLoad += loads.total;

        console.log(`   ${room.name} (${room.temperature}°C)`);
        console.log(`   └─ ${room.dimensions.length}m × ${room.dimensions.width}m × ${room.dimensions.height}m`);
        console.log(`      ├─ Transmission: ${loads.transmission.toFixed(2)} kW`);
        console.log(`      ├─ Product: ${loads.product.toFixed(2)} kW`);
        console.log(`      ├─ Infiltration: ${loads.infiltration.toFixed(2)} kW`);
        console.log(`      ├─ Internal: ${loads.internal.toFixed(2)} kW`);
        console.log(`      ├─ Subtotal: ${loads.subtotal.toFixed(2)} kW`);
        console.log(`      ├─ Safety (${loads.safetyFactor}x): +${(loads.total - loads.subtotal).toFixed(2)} kW`);
        console.log(`      └─ TOTAL: ${loads.total.toFixed(2)} kW ⚡\n`);
    }

    // Calculate simultaneity factor
    const simultaneityFactor = service.calculateSimultaneityFactor(enrichedData.rooms);
    const designLoad = totalLoad * simultaneityFactor;

    console.log('\n' + '─'.repeat(100));
    console.log('   📊 TOTAL LOAD (all rooms): ' + totalLoad.toFixed(1) + ' kW');
    console.log('   🔄 Simultaneity Factor: ' + (simultaneityFactor * 100).toFixed(0) + '%');
    console.log('   🎯 DESIGN LOAD: ' + designLoad.toFixed(1) + ' kW');
    console.log('─'.repeat(100));

    // Group by temperature ranges
    console.log('\n\n🌡️  STEP 3: GROUPING BY TEMPERATURE RANGES...\n');
    const tempRanges = {};
    for (const room of roomLoads) {
        const temp = room.temperature;
        let rangeKey;
        if (temp >= 0) rangeKey = 'above_zero';
        else if (temp >= -15) rangeKey = 'medium_temp';
        else if (temp >= -30) rangeKey = 'low_temp';
        else rangeKey = 'ultra_low_temp';

        if (!tempRanges[rangeKey]) {
            tempRanges[rangeKey] = { rooms: [], totalLoad: 0 };
        }
        tempRanges[rangeKey].rooms.push(room);
        tempRanges[rangeKey].totalLoad += room.loads.total;
    }

    Object.entries(tempRanges).forEach(([range, data]) => {
        console.log(`   ${range.replace(/_/g, ' ').toUpperCase()}: ${data.totalLoad.toFixed(1)} kW (${data.rooms.length} rooms)`);
    });

    // Compressor configuration
    console.log('\n\n⚙️  STEP 4: DETERMINING COMPRESSOR CONFIGURATION...\n');
    const tempRangeArray = Object.keys(tempRanges).map(key => ({
        name: key,
        load: tempRanges[key].totalLoad
    }));
    const compressorConfig = service.determineCompressorConfiguration(designLoad, tempRangeArray);

    Object.entries(compressorConfig).forEach(([range, config]) => {
        console.log(`   ${range.replace(/_/g, ' ').toUpperCase()}:`);
        console.log(`      • Total Load: ${config.totalLoad.toFixed(1)} kW`);
        console.log(`      • Base Compressors: ${config.baseCompressors}x units`);
        console.log(`      • Swing: ${config.swingCompressor ? 'Yes (1 unit)' : 'No'}`);
        console.log(`      • Reserve: ${config.reserveCompressor ? 'Yes (1 unit)' : 'No'}`);
        console.log(`      • Total Units: ${config.totalUnits}`);
        console.log(`      • Configuration: ${config.configuration}\n`);
    });

    // Detailed evaporator specifications
    console.log('\n\n❄️  STEP 5: EVAPORATOR SPECIFICATIONS...\n');
    roomLoads.forEach((room, idx) => {
        if (room.evaporators && room.evaporators.length > 0) {
            const evap = room.evaporators[0];
            console.log(`   ${idx + 1}. ${room.name}:`);
            console.log(`      • Quantity: ${room.evaporators.length}x ${evap.model}`);
            console.log(`      • Capacity: ${evap.capacity.toFixed(1)} kW each`);
            console.log(`      • Total Capacity: ${(evap.capacity * room.evaporators.length).toFixed(1)} kW`);
            console.log(`      • Fans: ${evap.fans.quantity}x @ ${evap.fans.motorPower} kW`);
            console.log(`      • Airflow: ${evap.fans.airflow} m³/h`);
            console.log(`      • Throw Distance: ${evap.fans.throwDistance}m`);
            console.log(`      • Fan Diameter: Ø${evap.fans.diameter}mm\n`);
        }
    });

    console.log('\n' + '='.repeat(100));
    console.log('✅ COMPLETE DESIGN ANALYSIS FINISHED!');
    console.log('='.repeat(100));
    console.log('\n💡 Summary:');
    console.log('   • Total Rooms: 13');
    console.log('   • Total Refrigeration Load: ' + totalLoad.toFixed(1) + ' kW');
    console.log('   • Design Load (with simultaneity): ' + designLoad.toFixed(1) + ' kW');
    console.log('   • Applied Standards: ASME B31.5 / ISO 5149 (Middle East)');
    console.log('   • Safety Factor: 1.25 (higher for harsh climate)');
    console.log('   • Temperature Ranges: ' + Object.keys(tempRanges).length);
    console.log('\n');
}

runCompleteDemo().catch(console.error);
