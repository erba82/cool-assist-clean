// backend/tests/gfdde_phase3_test.js
/**
 * Integration Tests for GFDDE Phase 3
 * Tests ASHRAE compliance validation
 */

const ASHRAEValidator = require('../services/standards/ASHRAEValidator');

async function testStandard34Classification() {
    console.log('\n=== Testing ASHRAE Standard 34 Classification ===');

    const refrigerants = ['R717', 'R22', 'R410A', 'R32', 'R134a', 'R744'];

    try {
        refrigerants.forEach(ref => {
            console.log(`\n${ref}:`);
            const result = ASHRAEValidator.validateStandard34(ref);

            if (result.valid) {
                console.log(`   ✓ Safety Class: ${result.safety_classification}`);
                console.log(`   ✓ Description: ${result.description}`);
                console.log(`   ✓ GWP: ${result.gwp}`);
                console.log(`   ✓ Status: ${result.regulatory_status.status}`);
            }
        });

        console.log('\n✅ Standard 34 Classification Tests Passed');
        return true;

    } catch (error) {
        console.error('\n❌ Standard 34 Test Failed:', error.message);
        return false;
    }
}

async function testStandard15Compliance() {
    console.log('\n=== Testing ASHRAE Standard 15 Compliance ===');

    const testCases = [
        {
            name: 'Ammonia System (B2L)',
            design: {
                refrigerant: 'R717',
                components: [
                    { type: 'compressor', capacity: 150 },
                    { type: 'condenser', capacity: '190' },
                    { type: 'evaporator', capacity: 150 },
                    { type: 'receiver', capacity: 100 }
                ]
            },
            siteInfo: {
                room_volume: 200, // m³
                machinery_room: true
            }
        },
        {
            name: 'R32 System (A2L)',
            design: {
                refrigerant: 'R32',
                components: [
                    { type: 'compressor', capacity: 50 },
                    { type: 'condenser', capacity: '60' },
                    { type: 'evaporator', capacity: 50 }
                ]
            },
            siteInfo: {
                room_volume: 30, // m³ (small residential unit)
                machinery_room: false
            }
        },
        {
            name: 'R410A System (A1)',
            design: {
                refrigerant: 'R410A',
                components: [
                    { type: 'compressor', capacity: 100 },
                    { type: 'condenser', capacity: '120' },
                    { type: 'evaporator', capacity: 100 }
                ]
            },
            siteInfo: {
                room_volume: 50, // m³
                machinery_room: false
            }
        }
    ];

    try {
        testCases.forEach(testCase => {
            console.log(`\n${testCase.name}:`);
            const result = ASHRAEValidator.validateStandard15(testCase.design, testCase.siteInfo);

            console.log(`   ✓ Compliant: ${result.compliant ? 'YES' : 'NO'}`);
            console.log(`   ✓ Safety Class: ${result.refrigerant_info.safety_class}`);

            if (result.charge_analysis) {
                console.log(`   ✓ Max Charge: ${result.charge_analysis.max_charge_kg.toFixed(2)} kg`);
                console.log(`   ✓ LFL Safety Factor: ${result.charge_analysis.safety_factor * 100}%`);
            }

            if (result.errors.length > 0) {
                console.log(`   ⚠️  Errors: ${result.errors.length}`);
                result.errors.forEach(err => {
                    console.log(`      - ${err.message || err.code}`);
                });
            }

            if (result.warnings.length > 0) {
                console.log(`   ⚠️  Warnings: ${result.warnings.length}`);
            }

            console.log(`   ✓ Recommendations: ${result.recommendations.length}`);
        });

        console.log('\n✅ Standard 15 Compliance Tests Passed');
        return true;

    } catch (error) {
        console.error('\n❌ Standard 15 Test Failed:', error.message);
        console.error(error.stack);
        return false;
    }
}

async function testChargeLimitCalculations() {
    console.log('\n=== Testing A2L Charge Limit Calculations ===');

    const testScenarios = [
        { refrigerant: 'R32', roomVolume: 25, description: 'Small bedroom' },
        { refrigerant: 'R32', roomVolume: 50, description: 'Large living room' },
        { refrigerant: 'R32', roomVolume: 100, description: 'Open plan area' }
    ];

    try {
        const RefrigerantDatabase = require('../data/RefrigerantDatabase');

        testScenarios.forEach(scenario => {
            const refData = RefrigerantDatabase.getRefrigerant(scenario.refrigerant);
            const result = ASHRAEValidator.calculateChargeLimitA2L(
                scenario.refrigerant,
                refData,
                scenario.roomVolume
            );

            console.log(`\n${scenario.description} (${scenario.roomVolume} m³):`);
            console.log(`    ✓ Max Charge: ${result.max_charge_kg.toFixed(2)} kg`);
            console.log(`   ✓ LFL: ${result.LFL_ppm} ppm`);
            console.log(`   ✓ Safe Concentration: ${result.max_concentration_ppm} ppm`);
            console.log(`   ✓ Method: ${result.compliance_method}`);
        });

        console.log('\n✅ Charge Limit Calculation Tests Passed');
        return true;

    } catch (error) {
        console.error('\n❌ Charge Limit Test Failed:', error.message);
        return false;
    }
}

async function runAllTests() {
    console.log('╔═══════════════════════════════════════╗');
    console.log('║   GFDDE Phase 3 Integration Tests    ║');
    console.log('╚═══════════════════════════════════════╝');

    const results = {
        standard34: await testStandard34Classification(),
        standard15: await testStandard15Compliance(),
        chargeLimit: await testChargeLimitCalculations()
    };

    console.log('\n╔═══════════════════════════════════════╗');
    console.log('║           Test Summary                ║');
    console.log('╚═══════════════════════════════════════╝');
    console.log(`Standard 34 Classification:  ${results.standard34 ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Standard 15 Compliance:      ${results.standard15 ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`A2L Charge Limits:           ${results.chargeLimit ? '✅ PASS' : '❌ FAIL'}`);

    const allPassed = Object.values(results).every(r => r === true);
    console.log(`\nOverall: ${allPassed ? '✅ ALL TESTS PASSED' : '⚠️  SOME TESTS FAILED'}`);

    process.exit(allPassed ? 0 : 1);
}

// Run tests
runAllTests();
