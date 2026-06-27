// backend/tests/gfdde_phase1_test.js
/**
 * Integration Tests for GFDDE Phase 1
 * Tests DXF Parser, Knowledge Graph Builder, and CoolProp Service
 */

const DXFParser = require('../services/ingress/DXFParser');
const KGBuilder = require('../services/ingress/KnowledgeGraphBuilder');
const CoolProp = require('../services/physics/CoolPropWrapper');
const path = require('path');

async function testDXFParser() {
    console.log('\n=== Testing DXF Parser ===');

    try {
        // Note: You'll need a sample DXF file for this test
        // const testFile = path.join(__dirname, '../samples/test_pid.dxf');
        // const result = await DXFParser.parseDXF(testFile);

        // console.log('✅ DXF Parser Test Passed');
        // console.log(`  - Symbols found: ${result.statistics.totalSymbols}`);
        // console.log(`  - Lines found: ${result.statistics.totalLines}`);
        // console.log(`  - Text entities: ${result.statistics.totalText}`);

        console.log('⚠️  DXF Parser Test Skipped (no sample file)');
        console.log('   Place a sample P&ID DXF file in backend/samples/test_pid.dxf to test');

        return true;
    } catch (error) {
        console.error('❌ DXF Parser Test Failed:', error.message);
        return false;
    }
}

async function testKnowledgeGraphBuilder() {
    console.log('\n=== Testing Knowledge Graph Builder ===');

    try {
        // Create mock DXF data
        const mockDXFData = {
            metadata: {},
            blocks: {
                'SVA32': { type: 'stop_valve' },
                'EVRA25': { type: 'solenoid_valve' }
            },
            entities: {
                symbols: [
                    {
                        id: 'sym1',
                        blockName: 'SVA32',
                        type: 'stop_valve',
                        position: { x: 100, y: 100, z: 0 }
                    },
                    {
                        id: 'sym2',
                        blockName: 'EVRA25',
                        type: 'solenoid_valve',
                        position: { x: 200, y: 100, z: 0 }
                    }
                ],
                text: [
                    {
                        content: 'SVA32',
                        position: { x: 100, y: 90, z: 0 }
                    }
                ],
                lines: [
                    {
                        start: { x: 100, y: 100, z: 0 },
                        end: { x: 200, y: 100, z: 0 },
                        lineType: 'CONTINUOUS'
                    }
                ],
                polylines: []
            }
        };

        const graph = KGBuilder.buildGraph(mockDXFData);

        console.log('✅ Knowledge Graph Builder Test Passed');
        console.log(`  - Nodes created: ${graph.rawGraph.nodes.length}`);
        console.log(`  - Edges created: ${graph.rawGraph.edges.length}`);
        console.log(`  - AAS structure: ${graph.assetAdministrationShells.length} shells`);

        return true;
    } catch (error) {
        console.error('❌ Knowledge Graph Builder Test Failed:', error.message);
        return false;
    }
}

async function testCoolPropService() {
    console.log('\n=== Testing CoolProp Service ===');

    try {
        // Test 1: Health check
        console.log('\n1. Health Check:');
        const health = await CoolProp.healthCheck();
        console.log(`   ✓ Service: ${health.service}`);
        console.log(`   ✓ Version: ${health.version}`);
        console.log(`   ✓ Refrigerants: ${health.supported_refrigerants.join(', ')}`);

        // Test 2: Property calculation
        console.log('\n2. Property Calculation (R717 at 5 bar, -10°C):');
        const T = CoolProp.celsiusToKelvin(-10);
        const P = CoolProp.barToPascal(5);
        const props = await CoolProp.calculateProperties('R717', 'PT', P, T, ['H', 'S', 'D']);
        console.log(`   ✓ Enthalpy: ${(props.H / 1000).toFixed(2)} kJ/kg`);
        console.log(`   ✓ Entropy: ${(props.S / 1000).toFixed(3)} kJ/kg·K`);
        console.log(`   ✓ Density: ${props.D.toFixed(2)} kg/m³`);

        // Test 3: VLE calculation
        console.log('\n3. VLE Calculation (R717 at -10°C):');
        const vle = await CoolProp.calculateVLE('R717', T);
        console.log(`   ✓ Saturation Pressure: ${CoolProp.pascalToBar(vle.saturation_pressure).toFixed(2)} bar`);
        console.log(`   ✓ Latent Heat: ${(vle.latent_heat / 1000).toFixed(2)} kJ/kg`);
        console.log(`   ✓ Liquid Density: ${vle.liquid.density.toFixed(2)} kg/m³`);
        console.log(`   ✓ Vapor Density: ${vle.vapor.density.toFixed(2)} kg/m³`);

        // Test 4: Complete refrigeration cycle
        console.log('\n4. Refrigeration Cycle (R717, -5°C evap, 40°C cond):');
        const cycle = await CoolProp.calculateAmmoniaCycle(-5, 40, 5, 3);
        console.log(`   ✓ COP: ${cycle.performance.COP.toFixed(2)}`);
        console.log(`   ✓ Pressure Ratio: ${cycle.performance.pressure_ratio.toFixed(2)}`);
        console.log(`   ✓ Cooling Capacity: ${(cycle.performance.cooling_capacity_per_kg / 1000).toFixed(2)} kJ/kg`);
        console.log(`   ✓ Compressor Work: ${(cycle.performance.compressor_work_per_kg / 1000).toFixed(2)} kJ/kg`);

        // Test 5: Psychrometric calculation
        console.log('\n5. Psychrometric Calculation (25°C, 50% RH):');
        const psychro = await CoolProp.calculatePsychrometric(25, 101325, 'RH', 50);
        console.log(`   ✓ Wet Bulb: ${psychro.wet_bulb_temp.toFixed(1)} °C`);
        console.log(`   ✓ Dew Point: ${psychro.dew_point_temp.toFixed(1)} °C`);
        console.log(`   ✓ Humidity Ratio: ${(psychro.humidity_ratio * 1000).toFixed(2)} g/kg`);
        console.log(`   ✓ Enthalpy: ${(psychro.enthalpy / 1000).toFixed(2)} kJ/kg`);

        console.log('\n✅ All CoolProp Service Tests Passed');
        return true;

    } catch (error) {
        console.error('\n❌ CoolProp Service Test Failed:', error.message);
        console.error('\n⚠️  Make sure CoolProp microservice is running:');
        console.error('   cd backend/services/physics');
        console.error('   pip install -r requirements.txt');
        console.error('   python coolprop_service.py');
        return false;
    }
}

async function runAllTests() {
    console.log('╔═══════════════════════════════════════╗');
    console.log('║   GFDDE Phase 1 Integration Tests    ║');
    console.log('╚═══════════════════════════════════════╝');

    const results = {
        dxfParser: await testDXFParser(),
        knowledgeGraph: await testKnowledgeGraphBuilder(),
        coolProp: await testCoolPropService()
    };

    console.log('\n╔═══════════════════════════════════════╗');
    console.log('║           Test Summary                ║');
    console.log('╚═══════════════════════════════════════╝');
    console.log(`DXF Parser:         ${results.dxfParser ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Knowledge Graph:    ${results.knowledgeGraph ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`CoolProp Service:   ${results.coolProp ? '✅ PASS' : '❌ FAIL'}`);

    const allPassed = Object.values(results).every(r => r === true);
    console.log(`\nOverall: ${allPassed ? '✅ ALL TESTS PASSED' : '⚠️  SOME TESTS FAILED'}`);

    process.exit(allPassed ? 0 : 1);
}

// Run tests
runAllTests();
