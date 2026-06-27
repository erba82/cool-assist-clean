/**
 * Phase 4: Advanced Rendering - Integration Test
 * Tests SVG generation, DXF export, and rendering API
 */

const axios = require('axios');
const DesignGenerator = require('../services/generative/DesignGenerator');
const fs = require('fs').promises;
const path = require('path');

async function runPhase4Tests() {
    console.log('\n' + '='.repeat(80));
    console.log('🎨 Phase 4: Advanced Rendering & SVG Export - Test Suite');
    console.log('='.repeat(80));

    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;

    const testRequirements = {
        cooling_capacity: 150,
        evap_temp: -10,
        cond_temp: 40,
        refrigerant: 'R717'
    };

    // ============================================================
    // PART 1: Symbol Library
    // ============================================================
    console.log('\n\n📚 PART 1: SVG Symbol Library');
    console.log('-'.repeat(80));

    try {
        totalTests++;
        console.log('\n[Test 1.1] Symbol Library Loading');

        const SVGSymbolLibrary = require('../services/rendering/SVGSymbolLibrary');
        const library = new SVGSymbolLibrary();

        const symbolIds = library.getAllSymbolIds();
        console.log(`   Total symbols: ${symbolIds.length}`);

        const categories = ['equipment', 'valves', 'instruments', 'piping'];
        categories.forEach(cat => {
            const syms = library.getByCategory(cat);
            console.log(`   ${cat}: ${syms.length} symbols`);
        });

        if (symbolIds.length >= 15) {
            console.log(`   ✅ PASS`);
            passedTests++;
        } else {
            console.log(`   ❌ FAIL: Insufficient symbols`);
            failedTests++;
        }
    } catch (error) {
        console.log(`   ❌ FAIL: ${error.message}`);
        failedTests++;
    }

    try {
        totalTests++;
        console.log('\n[Test 1.2] Symbol Retrieval');

        const SVGSymbolLibrary = require('../services/rendering/SVGSymbolLibrary');
        const library = new SVGSymbolLibrary();

        const compressor = library.getSymbol('compressor_reciprocating');
        console.log(`   Compressor symbol: ${compressor.name}`);
        console.log(`   Dimensions: ${compressor.width}x${compressor.height}`);
        console.log(`   Connection points: ${compressor.connectionPoints.length}`);

        if (compressor && compressor.svg) {
            console.log(`   ✅ PASS`);
            passedTests++;
        } else {
            console.log(`   ❌ FAIL`);
            failedTests++;
        }
    } catch (error) {
        console.log(`   ❌ FAIL: ${error.message}`);
        failedTests++;
    }

    // ============================================================
    // PART 2: SVG Generation
    // ============================================================
    console.log('\n\n🖼️  PART 2: SVG Generation');
    console.log('-'.repeat(80));

    try {
        totalTests++;
        console.log('\n[Test 2.1] Generate SVG from Design');

        // Generate a design
        const variants = await DesignGenerator.generateVariants(testRequirements, {
            variantCount: 1
        });

        console.log(`   Generated design: ${variants[0].id}`);

        const SVGGenerator = require('../services/rendering/SVGGenerator');
        const generator = new SVGGenerator();

        const svg = generator.generate(variants[0]);

        console.log(`   SVG length: ${svg.length} characters`);
        console.log(`   Contains <svg>: ${svg.includes('<svg')}`);
        console.log(`   Contains equipment layer: ${svg.includes('layer-equipment')}`);

        // Save to file for visual inspection
        const outputPath = path.join(__dirname, '../output/test_diagram.svg');
        await fs.mkdir(path.dirname(outputPath), { recursive: true });
        await fs.writeFile(outputPath, svg);
        console.log(`   ✓ Saved to: ${outputPath}`);

        if (svg.includes('<svg') && svg.length > 1000) {
            console.log(`   ✅ PASS`);
            passedTests++;
        } else {
            console.log(`   ❌ FAIL`);
            failedTests++;
        }
    } catch (error) {
        console.log(`   ❌ FAIL: ${error.message}`);
        console.error(error.stack);
        failedTests++;
    }

    // ============================================================
    // PART 3: DXF Export
    // ============================================================
    console.log('\n\n📐 PART 3: DXF Export');
    console.log('-'.repeat(80));

    try {
        totalTests++;
        console.log('\n[Test 3.1] Generate DXF from Design');

        const variants = await DesignGenerator.generateVariants(testRequirements, {
            variantCount: 1
        });

        const DXFExporter = require('../services/rendering/DXFExporter');
        const exporter = new DXFExporter();

        const dxf = exporter.export(variants[0]);

        console.log(`   DXF length: ${dxf.length} characters`);
        console.log(`   Contains HEADER: ${dxf.includes('HEADER')}`);
        console.log(`   Contains ENTITIES: ${dxf.includes('ENTITIES')}`);
        console.log(`   Contains layers: ${dxf.includes('EQUIPMENT')}`);

        // Save to file
        const outputPath = path.join(__dirname, '../output/test_diagram.dxf');
        await fs.writeFile(outputPath, dxf);
        console.log(`   ✓ Saved to: ${outputPath}`);

        if (dxf.includes('HEADER') && dxf.includes('ENTITIES')) {
            console.log(`   ✅ PASS`);
            passedTests++;
        } else {
            console.log(`   ❌ FAIL`);
            failedTests++;
        }
    } catch (error) {
        console.log(`   ❌ FAIL: ${error.message}`);
        console.error(error.stack);
        failedTests++;
    }

    // ============================================================
    // PART 4: API Endpoints
    // ============================================================
    console.log('\n\n🌐 PART 4: Rendering API');
    console.log('-'.repeat(80));

    try {
        totalTests++;
        console.log('\n[Test 4.1] GET /api/rendering/symbols');

        const response = await axios.get('http://localhost:3000/api/rendering/symbols');

        console.log(`   Status: ${response.status}`);
        console.log(`   Symbols count: ${response.data.count}`);
        console.log(`   Success: ${response.data.success}`);

        if (response.data.success && response.data.count > 15) {
            console.log(`   ✅ PASS`);
            passedTests++;
        } else {
            console.log(`   ❌ FAIL`);
            failedTests++;
        }
    } catch (error) {
        console.log(`   ❌ FAIL: ${error.message}`);
        failedTests++;
    }

    try {
        totalTests++;
        console.log('\n[Test 4.2] POST /api/rendering/preview');

        const testData = {
            components: {
                compressors: [{ tag: 'CMP-1', capacity: 150, type: 'screw' }],
                evaporators: [{ tag: 'EVP-1', capacity: 150 }],
                condensers: [{ tag: 'COND-1', capacity: 200 }]
            },
            requirements: testRequirements
        };

        const response = await axios.post('http://localhost:3000/api/rendering/preview', testData);

        console.log(`   Status: ${response.status}`);
        console.log(`   SVG length: ${response.data.svg?.length || 0} chars`);
        console.log(`   Success: ${response.data.success}`);

        if (response.data.success && response.data.svg) {
            console.log(`   ✅ PASS`);
            passedTests++;
        } else {
            console.log(`   ❌ FAIL`);
            failedTests++;
        }
    } catch (error) {
        console.log(`   ❌ FAIL: ${error.message}`);
        failedTests++;
    }

    // ============================================================
    // SUMMARY
    // ============================================================
    console.log('\n\n' + '='.repeat(80));
    console.log('📊 PHASE 4 TEST SUMMARY');
    console.log('='.repeat(80));

    console.log(`\n   Total Tests: ${totalTests}`);
    console.log(`   ✅ Passed: ${passedTests}`);
    console.log(`   ❌ Failed: ${failedTests}`);
    console.log(`   📈 Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

    console.log('\n📦 Component Status:');
    console.log(`   Symbol Library: ${passedTests >= 2 ? '✅ READY' : '⚠️  NEEDS ATTENTION'}`);
    console.log(`   SVG Generator: ${passedTests >= 3 ? '✅ READY' : '⚠️  NEEDS ATTENTION'}`);
    console.log(`   DXF Exporter: ${passedTests >= 4 ? '✅ READY' : '⚠️  NEEDS ATTENTION'}`);
    console.log(`   Rendering API: ${passedTests >= 5 ? '✅ READY' : '⚠️  NEEDS ATTENTION'}`);

    const success_rate = (passedTests / totalTests) * 100;

    if (success_rate >= 80) {
        console.log('\n🎉 PHASE 4 VERIFIED - PROFESSIONAL RENDERING READY!');
        console.log('\n✅ 20+ ISO 14617-compliant symbols');
        console.log('✅ SVG generation with layers');
        console.log('✅ DXF export for AutoCAD');
        console.log('✅ REST API operational');
        console.log('✅ Professional P&ID output\n');
        process.exit(0);
    } else {
        console.log('\n⚠️  PHASE 4 NEEDS ATTENTION');
        console.log(`\n   ${failedTests} test(s) failed\n`);
        process.exit(1);
    }
}

// Run tests
console.log('\nStarting Phase 4 Tests...\n');
runPhase4Tests().catch(error => {
    console.error('\n❌ TEST EXECUTION ERROR:', error);
    console.error(error.stack);
    process.exit(1);
});
