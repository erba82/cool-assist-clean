const axios = require('axios');

async function testRefrigerantAwareness() {
    console.log('=== Testing Refrigerant-Aware P&ID ===\n');

    // Test 1: CO2 Project (should NOT have pumps)
    console.log('1. Testing CO2 system...');
    try {
        const co2Res = await axios.post('http://localhost:5000/api/core/design', {
            message: '200 ton CO2 cold storage in Dubai',
            refrigerant: 'R744'
        }, { timeout: 60000 });

        const co2PID = co2Res.data.pidData || {};
        const co2Pumps = (co2PID.equipment || []).filter(e => e.type === 'pump');

        console.log(`   CO2 System:`);
        console.log(`   - Refrigerant: ${co2PID.metadata?.refrigerant}`);
        console.log(`   - System Type: ${co2PID.metadata?.systemType}`);
        console.log(`   - Pump count: ${co2Pumps.length}`);
        console.log(`   - Expected: 0 pumps (CO2 uses cascade/transcritical)`);
        console.log(`   - Result: ${co2Pumps.length === 0 ? '✅ PASS' : '❌ FAIL'}\n`);

    } catch (e) {
        console.log(`   ❌ Error: ${e.message}\n`);
    }

    // Test 2: Ammonia Project (SHOULD have pumps)
    console.log('2. Testing Ammonia system...');
    try {
        const nh3Res = await axios.post('http://localhost:5000/api/core/design', {
            message: '200 ton ammonia cold storage in Dubai',
            refrigerant: 'R717'
        }, { timeout: 60000 });

        const nh3PID = nh3Res.data.pidData || {};
        const nh3Pumps = (nh3PID.equipment || []).filter(e => e.type === 'pump');

        console.log(`   Ammonia System:`);
        console.log(`   - Refrigerant: ${nh3PID.metadata?.refrigerant}`);
        console.log(`   - System Type: ${nh3PID.metadata?.systemType}`);
        console.log(`   - Pump count: ${nh3Pumps.length}`);
        console.log(`   - Expected: 2 pumps (flooded system)`);
        console.log(`   - Result: ${nh3Pumps.length > 0 ? '✅ PASS' : '❌ FAIL'}\n`);

    } catch (e) {
        console.log(`   ❌ Error: ${e.message}\n`);
    }
}

testRefrigerantAwareness();
