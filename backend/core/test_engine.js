/**
 * Core Engine Test - Poultry Slaughterhouse Example
 * 
 * Tests the RefrigerationEngine with the user's example project
 */

const RefrigerationEngine = require('./RefrigerationEngine');

async function testEngine() {
    console.log('====================================');
    console.log('🧊 Cool-Assist Core Engine v2.0 Test');
    console.log('====================================\n');

    // Create engine instance
    const engine = new RefrigerationEngine();

    // Define project based on user's example
    const project = {
        name: 'کشتارگاه اردبیل',
        location: {
            city: 'Ardabil',
            country: 'Iran'
        },
        refrigerant: 'R717',

        // Product info
        product: {
            type: 'chicken',
            entryTemp: 25,    // Initial temp entering chilling room
            exitTemp: -18     // Final storage temp
        },

        // Room definitions
        rooms: [
            // Chilling Room
            {
                name: 'Chilling Room',
                type: 'chilling',
                length: 20,
                width: 8,
                height: 4,
                temperature: -5,
                product: { type: 'chicken', entryTemp: 25, exitTemp: 5 },
                cycleTime: 0.5,  // 30 minutes on rail
                occupancy: 1
            },

            // Pre-coolers (4 rooms)
            ...Array(4).fill(null).map((_, i) => ({
                name: `Pre-cooler ${i + 1}`,
                type: 'processing',
                length: 8,
                width: 10,
                height: 9,
                temperature: -5,
                product: { type: 'chicken', entryTemp: 5, exitTemp: -5 },
                cycleTime: 3,  // 3 hours
                occupancy: 1
            })),

            // Freezing Tunnels (4 tunnels)
            ...Array(4).fill(null).map((_, i) => ({
                name: `Freezing Tunnel ${i + 1}`,
                type: 'blast',
                length: 4,
                width: 4,
                height: 4,
                temperature: -40,
                product: { type: 'chicken', entryTemp: -5, exitTemp: -18 },
                cycleTime: 8,  // 8 hours
                occupancy: 1
            })),

            // Storage Rooms (4 rooms)
            ...Array(4).fill(null).map((_, i) => ({
                name: `Storage ${i + 1}`,
                type: 'storage',
                length: 20,
                width: 15,
                height: 9,
                temperature: -18,
                door: {
                    width: 2.5,
                    height: 2.8,
                    openingsPerDay: 10,
                    openDuration: 10
                },
                occupancy: 1
            }))
        ],

        // Insulation specs
        insulation: {
            type: 'polyurethane_40',
            thickness: 100  // mm for walls/ceiling
        }
    };

    try {
        console.log('📋 Project:', project.name);
        console.log('📍 Location:', project.location.city, ',', project.location.country);
        console.log('🧪 Refrigerant:', project.refrigerant);
        console.log('🏠 Rooms:', project.rooms.length);
        console.log('\n⏳ Running calculations...\n');

        // Run calculation
        const results = await engine.calculate(project);

        // Print results
        console.log('====================================');
        console.log('📊 CALCULATION RESULTS');
        console.log('====================================\n');

        // Summary
        console.log('📈 SUMMARY:');
        console.log(`   Total Cooling Load: ${results.summary.totalCoolingLoad.toFixed(0)} kW`);
        console.log(`   Total Cooling Load: ${results.summary.totalCoolingLoadTR.toFixed(0)} TR`);
        console.log(`   Room Count: ${results.summary.roomCount}`);
        console.log(`   Temperature Levels: ${results.summary.temperatureLevels.join(', ')}`);
        console.log(`   Equipment Count: ${results.summary.equipmentCount}`);
        console.log(`   Execution Time: ${results.executionTime} ms\n`);

        // Room loads
        console.log('🏠 ROOM LOADS:');
        for (const load of results.calculations.loads) {
            console.log(`   ${load.roomName}: ${load.total.toFixed(1)} kW`);
            console.log(`      - Transmission: ${load.transmission.total.toFixed(1)} kW`);
            console.log(`      - Product: ${load.product.total.toFixed(1)} kW`);
            console.log(`      - Infiltration: ${load.infiltration.total.toFixed(1)} kW`);
            console.log(`      - Internal: ${load.internal.total.toFixed(1)} kW`);
        }

        // Equipment
        console.log('\n📦 EQUIPMENT LIST:');
        for (const item of results.equipmentList) {
            console.log(`   ${item.tag}: ${item.category} - ${item.model || 'N/A'}`);
        }

        // Energy optimization
        const energyModule = engine.getModule('energy');
        if (energyModule) {
            const optimization = await energyModule.analyze(results, project);
            console.log('\n⚡ ENERGY OPTIMIZATION:');
            console.log(`   Annual Consumption: ${optimization.currentConsumption.annualConsumption.toLocaleString()} kWh`);
            console.log(`   Annual Cost: $${optimization.currentConsumption.annualCost.toLocaleString()}`);
            console.log(`   Potential Savings: ${optimization.potentialSavings.totalPercent}%`);
            console.log(`   Annual Savings: $${optimization.potentialSavings.annualSavings.toLocaleString()}`);
            console.log(`   Payback Period: ${optimization.potentialSavings.simplePayback} years`);
        }

        // Regional standards
        const regionalModule = engine.getModule('regional');
        if (regionalModule) {
            const standards = regionalModule.getStandards(project);
            console.log('\n📜 APPLICABLE STANDARDS:');
            console.log(`   Primary Framework: ${standards.primaryStandard}`);
            console.log(`   Design: ${standards.applicableStandards.design.join(', ')}`);
            console.log(`   Safety: ${standards.applicableStandards.safety.join(', ')}`);
            console.log(`   Refrigerant Status: ${standards.refrigerantStatus.status}`);
        }

        // Safety
        console.log('\n🛡️ SAFETY VALIDATION:');
        console.log(`   Passed: ${results.safety.passed}`);
        if (results.safety.warnings?.length > 0) {
            console.log(`   Warnings: ${results.safety.warnings.length}`);
        }

        console.log('\n✅ Test completed successfully!');

        return results;

    } catch (error) {
        console.error('❌ Error:', error.message);
        throw error;
    }
}

// Run if called directly
if (require.main === module) {
    testEngine()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}

module.exports = { testEngine };
