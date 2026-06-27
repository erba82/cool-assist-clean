// backend/tests/gfdde_phase4_test.js
/**
 * Integration Tests for GFDDE Phase 4
 * Tests SVG Renderer and DXF Export Service
 */

const SVGRenderer = require('../services/rendering/SVGRenderer');
const DXFExportService = require('../services/rendering/DXFExportService');
const fs = require('fs');
const path = require('path');

// Mock Design Data
const mockDesign = {
    refrigerant: 'R717',
    components: [
        { id: 'comp1', type: 'compressor', tag: 'C-101', capacity: 150 },
        { id: 'cond1', type: 'condenser', tag: 'E-101', capacity: 180 },
        { id: 'evap1', type: 'evaporator', tag: 'E-201', capacity: 150 },
        { id: 'rec1', type: 'receiver', tag: 'V-101', capacity: 500 }
    ]
};

async function testSVGRenderer() {
    console.log('\n=== Testing SVG Renderer ===');

    try {
        const svg = SVGRenderer.renderDesign(mockDesign);

        // Basic validation
        if (!svg.startsWith('<svg') || !svg.endsWith('</svg>')) {
            throw new Error('Invalid SVG format');
        }

        if (!svg.includes('C-101') || !svg.includes('E-101')) {
            throw new Error('Missing component tags in SVG');
        }

        // Save to file for inspection
        const outputPath = path.join(__dirname, 'output_test.svg');
        fs.writeFileSync(outputPath, svg);
        console.log(`   ✓ SVG generated successfully (${svg.length} bytes)`);
        console.log(`   ✓ Saved to: ${outputPath}`);

        return true;
    } catch (error) {
        console.error('\n❌ SVG Renderer Test Failed:', error.message);
        return false;
    }
}

async function testDXFExport() {
    console.log('\n=== Testing DXF Export ===');

    try {
        const dxf = DXFExportService.generateDXF(mockDesign);

        // Basic validation
        if (!dxf.includes('SECTION') || !dxf.includes('EOF')) {
            throw new Error('Invalid DXF format');
        }

        if (!dxf.includes('C-101')) {
            throw new Error('Missing component tags in DXF');
        }

        // Save to file
        const outputPath = path.join(__dirname, 'output_test.dxf');
        fs.writeFileSync(outputPath, dxf);
        console.log(`   ✓ DXF generated successfully (${dxf.length} bytes)`);
        console.log(`   ✓ Saved to: ${outputPath}`);

        return true;
    } catch (error) {
        console.error('\n❌ DXF Export Test Failed:', error.message);
        return false;
    }
}

async function runAllTests() {
    console.log('╔═══════════════════════════════════════╗');
    console.log('║   GFDDE Phase 4 Integration Tests    ║');
    console.log('╚═══════════════════════════════════════╝');

    const results = {
        svg: await testSVGRenderer(),
        dxf: await testDXFExport()
    };

    console.log('\n╔═══════════════════════════════════════╗');
    console.log('║           Test Summary                ║');
    console.log('╚═══════════════════════════════════════╝');
    console.log(`SVG Renderer:       ${results.svg ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`DXF Export:         ${results.dxf ? '✅ PASS' : '❌ FAIL'}`);

    const allPassed = Object.values(results).every(r => r === true);
    console.log(`\nOverall: ${allPassed ? '✅ ALL TESTS PASSED' : '⚠️  SOME TESTS FAILED'}`);

    process.exit(allPassed ? 0 : 1);
}

// Run tests
runAllTests();
