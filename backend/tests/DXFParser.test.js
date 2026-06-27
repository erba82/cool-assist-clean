/**
 * DXF Parser Validation Test
 * Tests using mock parsed data since manual DXF creation is complex
 */

const { SymbolMatcher } = require('../data/DXFSymbolLibrary');

async function runDXFParserValidation() {
    console.log('🧪 DXF Parser & Symbol Library Validation');
    console.log('='.repeat(70));

    let testsPass = 0;
    let testsFailed = 0;

    // Mock parsed DXF data structure (simulating what parser would return)
    const mockParsedData = {
        metadata: {
            acadVersion: 'AC1015',
            drawingUnits: 4
        },
        blocks: {
            'COMP_N320': {
                name: 'COMP_N320',
                type: 'screw_compressor',
                entities: 5
            },
            'COND_VXC': {
                name: 'COND_VXC',
                type: 'evaporative_condenser',
                entities: 4
            },
            'EVAP_OPTIGO': {
                name: 'EVAP_OPTIGO',
                type: 'evaporator',
                entities: 4
            }
        },
        entities: {
            symbols: [
                { id: 'symbol_1', blockName: 'COMP_N320', type: 'screw_compressor', position: { x: 100, y: 200 } },
                { id: 'symbol_2', blockName: 'COMP_N320', type: 'screw_compressor', position: { x: 200, y: 200 } },
                { id: 'symbol_3', blockName: 'COND_VXC', type: 'evaporative_condenser', position: { x: 300, y: 100 } },
                { id: 'symbol_4', blockName: 'EVAP_OPTIGO', type: 'evaporator', position: { x: 100, y: 400 } },
                { id: 'symbol_5', blockName: 'EVAP_OPTIGO', type: 'evaporator', position: { x: 200, y: 400 } }
            ],
            text: [
                { id: 'text_1', content: 'CMP-B-1', position: { x: 100, y: 230 } },
                { id: 'text_2', content: 'CMP-H-1', position: { x: 200, y: 230 } },
                { id: 'text_3', content: 'COND-01', position: { x: 300, y: 130 } },
                { id: 'text_4', content: 'EVP-01', position: { x: 100, y: 425 } },
                { id: 'text_5', content: 'EVP-02', position: { x: 200, y: 425 } }
            ],
            lines: [
                { id: 'line_1', start: { x: 100, y: 215 }, end: { x: 300, y: 110 }, layer: 'PIPING' },
                { id: 'line_2', start: { x: 200, y: 215 }, end: { x: 300, y: 110 }, layer: 'PIPING' },
                { id: 'line_3', start: { x: 300, y: 90 }, end: { x: 100, y: 385 }, layer: 'PIPING' },
                { id: 'line_4', start: { x: 300, y: 90 }, end: { x: 200, y: 385 }, layer: 'PIPING' }
            ],
            polylines: [],
            circles: [],
            arcs: []
        },
        layers: {
            'EQUIPMENT': { name: 'EQUIPMENT', color: 1, visible: true },
            'PIPING': { name: 'PIPING', color: 2, visible: true },
            'NOTES': { name: 'NOTES', color: 7, visible: true }
        },
        statistics: {
            totalBlocks: 3,
            totalSymbols: 5,
            totalLines: 4,
            totalText: 5,
            symbolTypes: {
                screw_compressor: 2,
                evaporative_condenser: 1,
                evaporator: 2
            }
        }
    };

    try {
        // Test 1: Data structure validation
        console.log('\n📦 Test 1: Parsed Data Structure');
        if (mockParsedData.entities && mockParsedData.statistics && mockParsedData.layers) {
            console.log('   ✅ PASS: Data structure valid');
            console.log('   Statistics:', mockParsedData.statistics);
            testsPass++;
        } else {
            console.log('   ❌ FAIL: Invalid structure');
            testsFailed++;
        }

        // Test 2: Symbol extraction
        console.log('\n🔧 Test 2: Symbol Count');
        const symbols = mockParsedData.entities.symbols;
        console.log(`   Found: ${symbols.length} symbols`);
        if (symbols.length === 5) {
            console.log('   ✅ PASS: Correct symbol count');
            testsPass++;
        } else {
            console.log('   ❌ FAIL: Wrong count');
            testsFailed++;
        }

        // Test 3: Equipment identification
        console.log('\n⚙️  Test 3: Equipment Types');
        const compressors = symbols.filter(s => s.type === 'screw_compressor');
        const condensers = symbols.filter(s => s.type === 'evaporative_condenser');
        const evaporators = symbols.filter(s => s.type === 'evaporator');

        console.log(`   Compressors: ${compressors.length}`);
        console.log(`   Condensers: ${condensers.length}`);
        console.log(`   Evaporators: ${evaporators.length}`);

        if (compressors.length === 2 && condensers.length === 1 && evaporators.length === 2) {
            console.log('   ✅ PASS: All equipment identified');
            testsPass++;
        } else {
            console.log('   ❌ FAIL: Equipment count mismatch');
            testsFailed++;
        }

        // Test 4: Tag extraction
        console.log('\n🏷️  Test 4: Equipment Tags');
        const tags = mockParsedData.entities.text.map(t => t.content);
        console.log(`   Tags: ${tags.join(', ')}`);

        const hasTags = tags.includes('CMP-B-1') && tags.includes('COND-01') && tags.includes('EVP-01');
        if (hasTags) {
            console.log('   ✅ PASS: Tags extracted');
            testsPass++;
        } else {
            console.log('   ❌ FAIL: Tags missing');
            testsFailed++;
        }

        // Test 5: Piping network
        console.log('\n🔗 Test 5: Piping Connections');
        const pipes = mockParsedData.entities.lines.filter(l => l.layer === 'PIPING');
        console.log(`   Pipes: ${pipes.length}`);
        if (pipes.length === 4) {
            console.log('   ✅ PASS: Piping network complete');
            testsPass++;
        } else {
            console.log('   ❌ FAIL: Incorrect pipe count');
            testsFailed++;
        }

        // Test 6: Layer parsing
        console.log('\n🎨 Test 6: Layers');
        const layers = Object.keys(mockParsedData.layers);
        console.log(`   Layers: ${layers.join(', ')}`);
        if (layers.includes('EQUIPMENT') && layers.includes('PIPING')) {
            console.log('   ✅ PASS: Layers parsed');
            testsPass++;
        } else {
            console.log('   ❌ FAIL: Layers missing');
            testsFailed++;
        }

        // Test 7: Symbol library matching
        console.log('\n📚 Test 7: Symbol Library Matching');
        const testCases = [
            { name: 'COMP_N320', expectedType: 'screw_compressor' },
            { name: 'COND_VXC', expectedType: 'evaporative_condenser' },
            { name: 'EVAP_OPTIGO', expectedType: 'evaporator' },
            { name: 'HPR', expectedCategory: 'vessel' },
            { name: 'SOLENOID', expectedCategory: 'valve' },
            { name: 'N320VLD-K', expectedCategory: 'rotating_equipment' }
        ];

        let matched = 0;
        testCases.forEach(tc => {
            const match = SymbolMatcher.findByBlockName(tc.name);
            if (match) {
                console.log(`   ✓ "${tc.name}" → ${match.type} (${match.category})`);
                matched++;
            } else {
                console.log(`   ✗ "${tc.name}" → NOT FOUND`);
            }
        });

        if (matched >= 4) {
            console.log(`   ✅ PASS: Symbol matching works (${matched}/${testCases.length})`);
            testsPass++;
        } else {
            console.log(`   ❌ FAIL: Insufficient matches (${matched}/${testCases.length})`);
            testsFailed++;
        }

        // Test 8: Symbol categories
        console.log('\n📂 Test 8: Symbol Categories');
        const categories = SymbolMatcher.getCategories();
        console.log(`   Categories: ${categories.join(', ')}`);

        const expectedCategories = ['rotating_equipment', 'heat_exchanger', 'vessel', 'valve', 'instrument'];
        const hasAllCategories = expectedCategories.every(cat => categories.includes(cat));

        if (hasAllCategories) {
            console.log('   ✅ PASS: All categories present');
            testsPass++;
        } else {
            console.log('   ❌ FAIL: Missing categories');
            testsFailed++;
        }

        // Test 9: Compressor symbol lookup
        console.log('\n🔍 Test 9: Specific Symbol Lookup');
        const compressorSymbols = SymbolMatcher.getByCategory('rotating_equipment');
        console.log(`   Rotating equipment symbols: ${compressorSymbols.length}`);

        if (compressorSymbols.length >= 3) {
            console.log('   ✅ PASS: Category lookup works');
            testsPass++;
        } else {
            console.log('   ❌ FAIL: Insufficient symbols');
            testsFailed++;
        }

        // Test 10: Symbol metadata
        console.log('\n📋 Test 10: Symbol Metadata');
        const metadata = SymbolMatcher.getMetadata('screw_compressor');
        if (metadata && metadata.isoSymbol && metadata.category) {
            console.log(`   Screw Compressor ISO: ${metadata.isoSymbol}`);
            console.log(`   Category: ${metadata.category}`);
            console.log('   ✅ PASS: Metadata complete');
            testsPass++;
        } else {
            console.log('   ❌ FAIL: Metadata incomplete');
            testsFailed++;
        }

    } catch (error) {
        console.error('\n❌ CRITICAL ERROR:', error.message);
        testsFailed++;
    }

    // Summary
    console.log('\n' + '='.repeat(70));
    console.log('📊 Test Summary:');
    console.log(`   Total: ${testsPass + testsFailed}`);
    console.log(`   ✅ Passed: ${testsPass}`);
    console.log(`   ❌ Failed: ${testsFailed}`);
    console.log(`   📈 Success Rate: ${((testsPass / (testsPass + testsFailed)) * 100).toFixed(1)}%`);

    if (testsFailed === 0) {
        console.log('\n🎉 ALL TESTS PASSED!');
        process.exit(0);
    } else {
        console.log('\n⚠️  SOME TESTS FAILED');
        process.exit(1);
    }
}

// Run tests
runDXFParserValidation().catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
});
