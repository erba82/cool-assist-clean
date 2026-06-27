// backend/tests/gfdde_phase5_test.js
/**
 * Integration Tests for GFDDE Phase 5
 * Tests OpenFOAM Interface and Heat Transfer Solver
 */

const OpenFOAMInterface = require('../services/simulation/OpenFOAMInterface');
const HeatTransferSolver = require('../services/simulation/HeatTransferSolver');
const fs = require('fs');
const path = require('path');

async function testOpenFOAMInterface() {
    console.log('\n=== Testing OpenFOAM Interface ===');

    const component = {
        id: 'test_pipe_01',
        type: 'pipe_segment',
        dimensions: { length: 2.0, diameter: 0.1 }
    };

    const conditions = {
        velocity: 3.5,
        pressure: 150000,
        temperature: 298
    };

    try {
        const result = OpenFOAMInterface.generateCase(component, conditions);

        console.log(`   ✓ Case path: ${result.casePath}`);

        // Validate generated files
        const files = Object.keys(result.files);
        console.log(`   ✓ Generated ${files.length} dictionary files`);

        if (!files.includes('system/blockMeshDict') || !files.includes('system/controlDict')) {
            throw new Error('Missing core system dictionaries');
        }

        if (!files.includes('0/U') || !files.includes('0/p') || !files.includes('0/T')) {
            throw new Error('Missing boundary condition files');
        }

        // Check content of a file
        const uFile = result.files['0/U'];
        if (!uFile.includes('internalField   uniform (3.5 0 0)')) {
            throw new Error('Velocity boundary condition incorrect');
        }

        console.log('   ✓ Boundary conditions verified');
        console.log('\n✅ OpenFOAM Interface Tests Passed');
        return true;

    } catch (error) {
        console.error('\n❌ OpenFOAM Interface Test Failed:', error.message);
        return false;
    }
}

async function testHeatTransferSolver() {
    console.log('\n=== Testing Heat Transfer Solver ===');

    // Test Case 1: Insulated Ammonia Pipe
    const pipe = {
        innerDiameter: 0.08, // DN80
        wallThickness: 0.005,
        insulationThickness: 0.05, // 50mm
        material: 'steel',
        insulationMaterial: 'insulation_pu',
        length: 10.0
    };

    const conditions = {
        fluidTemp: 263, // -10°C
        ambientTemp: 298, // 25°C
        windSpeed: 2.0
    };

    try {
        console.log('\n1. Insulated Pipe Heat Gain:');
        const result = HeatTransferSolver.calculatePipeHeatLoss(pipe, conditions);

        console.log(`   ✓ Heat Gain: ${result.heatLossWatts.toFixed(2)} W`);
        console.log(`   ✓ Linear Heat Gain: ${result.heatLossPerMeter.toFixed(2)} W/m`);
        console.log(`   ✓ Surface Temp: ${(result.surfaceTemp - 273.15).toFixed(1)}°C`);

        // Validation logic
        if (result.heatLossWatts < 0) throw new Error('Negative heat loss calculated');
        if (result.surfaceTemp < conditions.fluidTemp) throw new Error('Surface temp lower than fluid temp (impossible for gain)');

        // Test Case 2: Heat Exchanger
        console.log('\n2. Heat Exchanger Performance:');
        const hx = { area: 20, u_value: 600 };
        const streams = {
            hotIn: 313, // 40°C
            hotOut: 308, // 35°C
            coldIn: 298, // 25°C
            coldOut: 303 // 30°C
        };

        const hxResult = HeatTransferSolver.calculateHXPerformance(hx, streams);
        console.log(`   ✓ LMTD: ${hxResult.lmtd.toFixed(2)} K`);
        console.log(`   ✓ Heat Transfer Rate: ${(hxResult.heatTransferRate / 1000).toFixed(2)} kW`);

        console.log('\n✅ Heat Transfer Solver Tests Passed');
        return true;

    } catch (error) {
        console.error('\n❌ Heat Transfer Solver Test Failed:', error.message);
        console.error(error.stack);
        return false;
    }
}

async function runAllTests() {
    console.log('╔═══════════════════════════════════════╗');
    console.log('║   GFDDE Phase 5 Integration Tests    ║');
    console.log('╚═══════════════════════════════════════╝');

    const results = {
        openfoam: await testOpenFOAMInterface(),
        heatTransfer: await testHeatTransferSolver()
    };

    console.log('\n╔═══════════════════════════════════════╗');
    console.log('║           Test Summary                ║');
    console.log('╚═══════════════════════════════════════╝');
    console.log(`OpenFOAM Interface:   ${results.openfoam ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Heat Transfer Solver: ${results.heatTransfer ? '✅ PASS' : '❌ FAIL'}`);

    const allPassed = Object.values(results).every(r => r === true);
    console.log(`\nOverall: ${allPassed ? '✅ ALL TESTS PASSED' : '⚠️  SOME TESTS FAILED'}`);

    process.exit(allPassed ? 0 : 1);
}

// Run tests
runAllTests();
