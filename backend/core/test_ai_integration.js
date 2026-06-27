/**
 * Test AI Integration with Persian Input
 */

const DesignOrchestrator = require('./ai/DesignOrchestrator');

async function testPersianInput() {
    console.log('====================================');
    console.log('🧪 AI Integration Test - Persian Input');
    console.log('====================================\n');

    const orchestrator = new DesignOrchestrator();

    // User's example input in Persian
    const userInput = `
        برام سردخانه های یک کشتارگاه مرغ رو طراحی کن، 
        که یک سالن چیلینگ روم با ابعاد 20*8 متر و ارتفاع 4 متر داشته باشد برای دمای -5 درجه سانتی گراد،
        4 سالن تونل انجماد داشته باشد با ابعاد هر کدام 4*4 متر و ارتفاع 4 متر برای دمای -40 درجه سانتی گراد،
        با 4 سالن پیش سرد کن با ابعاد هر کدام 8*10 در ارتفاع 9 متر و دمای -5 درجه سانتی گراد
        و 4 سالن نگهداری به ابعاد هر کدام 20*15 متر و ارتفاع 9 متر در دمای -18 درجه سانتی گراد،
        در شهر اردبیل در ایران،
        اسم پروژه کشتارگاه اردبیل،
        مبرد آمونیاک
    `;

    console.log('📝 User Input (Persian):');
    console.log(userInput.trim().substring(0, 200) + '...\n');

    try {
        // Process the request
        const result = await orchestrator.processRequest(userInput);

        if (!result.success) {
            console.error('❌ Error:', result.error);
            return;
        }

        console.log('✅ Design completed successfully!\n');

        // Print results
        console.log('📋 PROJECT:');
        console.log(`   Name: ${result.project.name}`);
        console.log(`   Location: ${result.project.location.city}, ${result.project.location.country}`);
        console.log(`   Refrigerant: ${result.project.refrigerant}`);
        console.log(`   Rooms: ${result.project.roomCount}\n`);

        console.log('📊 SUMMARY:');
        console.log(`   Total Load: ${result.summary.totalCoolingLoad.toFixed(0)} kW`);
        console.log(`   Total Load: ${result.summary.totalCoolingLoadTR.toFixed(0)} TR`);
        console.log(`   Temperature Levels: ${result.summary.temperatureLevels.join(', ')}`);
        console.log(`   Equipment Count: ${result.summary.equipmentCount}\n`);

        console.log('🏠 ROOM LOADS:');
        for (const load of result.loads.slice(0, 5)) {
            console.log(`   ${load.room}: ${load.load.toFixed(0)} kW @ ${load.temperature}°C`);
        }
        if (result.loads.length > 5) {
            console.log(`   ... and ${result.loads.length - 5} more rooms\n`);
        }

        console.log('📦 EQUIPMENT:');
        console.log(`   Evaporators: ${result.equipment.evaporators.length}`);
        console.log(`   Compressors: ${result.equipment.compressors.length}`);
        console.log(`   Condensers: ${result.equipment.condensers.length}`);
        console.log(`   Separators: ${result.equipment.separators.length}\n`);

        if (result.energy) {
            console.log('⚡ ENERGY:');
            console.log(`   Annual Cost: $${result.energy.annualCost.toLocaleString()}`);
            console.log(`   Savings: ${result.energy.savingsPercent}%`);
            console.log(`   Payback: ${result.energy.paybackYears} years\n`);
        }

        if (result.standards) {
            console.log('📜 STANDARDS:');
            console.log(`   Primary: ${result.standards.primary}`);
            console.log(`   Design: ${result.standards.design.slice(0, 2).join(', ')}`);
            console.log(`   Safety: ${result.standards.safety.slice(0, 2).join(', ')}\n`);
        }

        console.log('📐 P&ID DATA:');
        console.log(`   Equipment items: ${result.pidData.equipment.length}`);
        console.log(`   Refrigerant: ${result.pidData.refrigerant}`);
        console.log(`   Project: ${result.pidData.projectName}\n`);

        console.log(`⏱️ Execution Time: ${result.executionTime} ms`);
        console.log('\n====================================');
        console.log('✅ Test PASSED!');
        console.log('====================================');

        return result;

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error(error.stack);
    }
}

// Run test
testPersianInput();
