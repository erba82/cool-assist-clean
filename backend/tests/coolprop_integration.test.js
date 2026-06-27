/**
 * CoolProp Service Integration Test
 * Tests all endpoints of the Physics microservice
 */

const axios = require('axios');

const COOLPROP_URL = 'http://127.0.0.1:5001';  // Force IPv4

async function testHealthEndpoint() {
    console.log('\n=== Testing /health endpoint ===');
    try {
        const response = await axios.get(`${COOLPROP_URL}/health`);
        console.log('✅ Health Check:', response.data);
        return response.data.status === 'healthy';
    } catch (error) {
        console.error('❌ Health check failed:', error.message);
        return false;
    }
}

async function testPropertiesEndpoint() {
    console.log('\n=== Testing /properties endpoint ===');
    try {
        const response = await axios.post(`${COOLPROP_URL}/properties`, {
            fluid: 'R717',  // Ammonia
            input_pair: 'PT',
            input1: 500000,  // 5 bar (Pa)
            input2: 273.15,  // 0°C (K)
            outputs: ['H', 'S', 'D', 'Q']
        });

        console.log('✅ Properties Response:', response.data);

        // Validate results
        const results = response.data.results;
        console.log('   Enthalpy:', results.H, 'J/kg');
        console.log('   Entropy:', results.S, 'J/kg/K');
        console.log('   Density:', results.D, 'kg/m³');
        console.log('   Quality:', results.Q);
        console.log('   Phase:', results.PhaseDescription);

        return response.data.success;
    } catch (error) {
        console.error('❌ Properties test failed:', error.message);
        return false;
    }
}

async function testVLEEndpoint() {
    console.log('\n=== Testing /vle endpoint ===');
    try {
        const response = await axios.post(`${COOLPROP_URL}/vle`, {
            fluid: 'R717',
            temperature: 273.15  // 0°C
        });

        console.log('✅ VLE Response:', response.data);

        const results = response.data.results;
        console.log('   Saturation Pressure:', (results.saturation_pressure / 1000).toFixed(2), 'kPa');
        console.log('   Liquid Enthalpy:', results.liquid.enthalpy.toFixed(2), 'J/kg');
        console.log('   Vapor Enthalpy:', results.vapor.enthalpy.toFixed(2), 'J/kg');
        console.log('   Latent Heat:', (results.latent_heat / 1000).toFixed(2), 'kJ/kg');

        return response.data.success;
    } catch (error) {
        console.error('❌ VLE test failed:', error.message);
        return false;
    }
}

async function testCycleEndpoint() {
    console.log('\n=== Testing /cycle endpoint ===');
    try {
        const response = await axios.post(`${COOLPROP_URL}/cycle`, {
            fluid: 'R717',
            evap_temp: 263.15,  // -10°C
            cond_temp: 313.15,   // 40°C
            superheat: 5,
            subcool: 3,
            isentropic_efficiency: 0.75
        });

        console.log('✅ Cycle Response:', response.data);

        const perf = response.data.performance;
        console.log('   COP:', perf.COP.toFixed(2));
        console.log('   Pressure Ratio:', perf.pressure_ratio.toFixed(2));
        console.log('   Cooling Capacity:', (perf.cooling_capacity_per_kg / 1000).toFixed(2), 'kJ/kg');
        console.log('   Compressor Work:', (perf.compressor_work_per_kg / 1000).toFixed(2), 'kJ/kg');

        // Validate state points
        const states = response.data.states;
        console.log('\n   State Points:');
        console.log('   1 (Comp Inlet):', (states['1_compressor_inlet'].T - 273.15).toFixed(1), '°C,', (states['1_compressor_inlet'].P / 100000).toFixed(2), 'bar');
        console.log('   2 (Comp Outlet):', (states['2_compressor_outlet'].T - 273.15).toFixed(1), '°C,', (states['2_compressor_outlet'].P / 100000).toFixed(2), 'bar');
        console.log('   3 (Cond Outlet):', (states['3_condenser_outlet'].T - 273.15).toFixed(1), '°C');
        console.log('   4 (Evap Inlet): Quality =', states['4_evaporator_inlet'].Q.toFixed(3));

        return response.data.success;
    } catch (error) {
        console.error('❌ Cycle test failed:', error.message);
        return false;
    }
}

async function testPsychrometricEndpoint() {
    console.log('\n=== Testing /psychrometric endpoint ===');
    try {
        const response = await axios.post(`${COOLPROP_URL}/psychrometric`, {
            dry_bulb_temp: 25,  // °C
            pressure: 101325,    // Pa
            input_type: 'RH',
            input_value: 50      // 50% RH
        });

        console.log('✅ Psychrometric Response:', response.data);

        const results = response.data.results;
        console.log('   Dry Bulb:', results.dry_bulb_temp, '°C');
        console.log('   Wet Bulb:', results.wet_bulb_temp.toFixed(2), '°C');
        console.log('   Dew Point:', results.dew_point_temp.toFixed(2), '°C');
        console.log('   RH:', results.relative_humidity.toFixed(1), '%');
        console.log('   Humidity Ratio:', results.humidity_ratio.toFixed(4), 'kg/kg');
        console.log('   Enthalpy:', (results.enthalpy / 1000).toFixed(2), 'kJ/kg');

        return response.data.success;
    } catch (error) {
        console.error('❌ Psychrometric test failed:', error.message);
        return false;
    }
}

async function runAllTests() {
    console.log('🧪 CoolProp Service Integration Tests');
    console.log('=====================================\n');

    const results = {
        health: await testHealthEndpoint(),
        properties: await testPropertiesEndpoint(),
        vle: await testVLEEndpoint(),
        cycle: await testCycleEndpoint(),
        psychrometric: await testPsychrometricEndpoint()
    };

    console.log('\n=====================================');
    console.log('📊 Test Summary:');
    console.log('   Health:', results.health ? '✅ PASS' : '❌ FAIL');
    console.log('   Properties:', results.properties ? '✅ PASS' : '❌ FAIL');
    console.log('   VLE:', results.vle ? '✅ PASS' : '❌ FAIL');
    console.log('   Cycle:', results.cycle ? '✅ PASS' : '❌ FAIL');
    console.log('   Psychrometric:', results.psychrometric ? '✅ PASS' : '❌ FAIL');

    const allPassed = Object.values(results).every(r => r);
    console.log('\n' + (allPassed ? '🎉 ALL TESTS PASSED!' : '⚠️  SOME TESTS FAILED'));

    process.exit(allPassed ? 0 : 1);
}

runAllTests();
