/**
 * Direct P&ID test - bypass chat flow
 */

const DesignOrchestrator = require('./core/ai/DesignOrchestrator');

async function test() {
    console.log('=== Direct P&ID Generation Test ===\n');

    const orchestrator = new DesignOrchestrator();

    // Simple test project
    const result = await orchestrator.processRequest(
        'Design a 10x10x4m cold storage at -18C with ammonia refrigerant in Dubai'
    );

    console.log('1. Result success:', result.success);
    console.log('2. Total load:', result.summary?.totalCoolingLoad, 'kW');

    if (result.pidData) {
        console.log('\n3. P&ID Data found!');
        console.log('   Equipment:', result.pidData.equipment?.length || 0);
        console.log('   Pipes:', result.pidData.pipes?.length || 0);
        console.log('   Valves:', result.pidData.valves?.length || 0);
        console.log('   Instruments:', result.pidData.instruments?.length || 0);

        if (result.pidData.valves?.length > 0) {
            console.log('\n4. Sample Valves:');
            result.pidData.valves.slice(0, 5).forEach((v, i) => {
                console.log(`   ${i + 1}. ${v.type} -> symbolType: ${v.symbolType}, tag: ${v.tag}`);
            });
        }
    } else {
        console.log('\n❌ NO pidData in result!');
        console.log('   Keys:', Object.keys(result).join(', '));
    }
}

test().catch(err => console.error('Error:', err.message));
