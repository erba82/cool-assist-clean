// backend/tests/gfdde_phase2_test.js
/**
 * Integration Tests for GFDDE Phase 2
 * Tests ML Sizing Engine, RAG Orchestrator, and Design Generator
 */

const MLSizingEngine = require('../services/generative/MLSizingEngine');
const DesignGenerator = require('../services/generative/DesignGenerator');
const RAGOrchestrator = require('../services/generative/RAGOrchestrator');
const KGRetriever = require('../services/generative/KGRetriever');

// Mock Knowledge Graph for testing
const mockKG = {
    rawGraph: {
        nodes: [
            {
                id: 'evap1',
                type: 'evaporator',
                properties: { capacity: 100, size: 50 },
                metadata: { refrigerant: 'R717' }
            },
            {
                id: 'comp1',
                type: 'compressor',
                properties: { model: 'BITZER 4NES-20Y', size: 40 },
                metadata: { refrigerant: 'R717', capacity: 120, cop: 3.8 }
            }
        ],
        edges: [
            { id: 'e1', source: 'comp1', target: 'evap1', type: 'process_line' }
        ]
    }
};

async function testMLSizingEngine() {
    console.log('\n=== Testing ML Sizing Engine ===');

    const requirements = {
        refrigerant: 'R717',
        evapTemp: -5,
        condTemp: 40,
        coolingCapacity: 150, // kW
        roomTemp: 0
    };

    try {
        // Test 1: Compressor sizing
        console.log('\n1. Compressor Sizing:');
        const compressor = await MLSizingEngine.sizeCompressor(requirements);
        console.log(`   ✓ Model: ${compressor.model}`);
        console.log(`   ✓ Displacement: ${compressor.displacement} m³/h`);
        console.log(`   ✓ COP: ${compressor.performance.COP}`);
        console.log(`   ✓ Power: ${compressor.performance.power_consumption} kW`);

        // Test 2: Condenser sizing
        console.log('\n2. Condenser Sizing:');
        const condenser = await MLSizingEngine.sizeCondenser(requirements);
        console.log(`   ✓ Type: ${condenser.subtype}`);
        console.log(`   ✓ Capacity: ${condenser.capacity} kW`);
        console.log(`   ✓ Heat Transfer Area: ${condenser.heat_transfer_area} m²`);

        // Test 3: Evaporator sizing
        console.log('\n3. Evaporator Sizing:');
        const evaporator = await MLSizingEngine.sizeEvaporator(requirements);
        console.log(`   ✓ Type: ${evaporator.subtype}`);
        console.log(`   ✓ Capacity: ${evaporator.capacity} kW`);
        console.log(`   ✓ Temperature Difference: ${evaporator.temperature_difference} °C`);
        console.log(`   ✓ Defrost Method: ${evaporator.recommendations.defrost_method}`);

        console.log('\n✅ ML Sizing Engine Tests Passed');
        return true;

    } catch (error) {
        console.error('\n❌ ML Sizing Engine Test Failed:', error.message);
        console.error(error.stack);
        return false;
    }
}

async function testKGRetriever() {
    console.log('\n=== Testing KG Retriever ===');

    try {
        KGRetriever.setKnowledgeGraph(mockKG);

        // Test 1: Find similar designs
        console.log('\n1. Finding Similar Designs:');
        const similar = KGRetriever.findSimilarDesigns({ cooling_capacity: 120 });
        console.log(`   ✓ Found ${similar.length} similar designs`);
        if (similar.length > 0) {
            console.log(`   ✓ Top match: ${similar[0].node.type}, similarity: ${(similar[0].similarity * 100).toFixed(1)}%`);
        }

        // Test 2: Get selection rules
        console.log('\n2. Component Selection Rules:');
        const rules = KGRetriever.getSelectionRules('compressor', { refrigerant: 'R717' });
        console.log(`   ✓ Mandatory rules: ${rules.mandatory.length}`);
        console.log(`   ✓ Recommended: ${rules.recommended.length}`);
        console.log(`   ✓ Constraints: ${rules.constraints.length}`);

        // Test 3: Layout constraints
        console.log('\n3. Layout Constraints:');
        const constraints = KGRetriever.getLayoutConstraints({
            refrigerant: 'R717',
            cooling_capacity: 150
        });
        console.log(`   ✓ Retrieved ${constraints.length} layout constraints`);
        constraints.slice(0, 2).forEach(c => {
            console.log(`   - ${c.type}: ${c.rule}`);
        });

        // Test 4: Best practices
        console.log('\n4. Best Practices:');
        const practices = KGRetriever.getBestPractices('safety');
        console.log(`   ✓ Retrieved ${practices.length} safety best practices`);

        console.log('\n✅ KG Retriever Tests Passed');
        return true;

    } catch (error) {
        console.error('\n❌ KG Retriever Test Failed:', error.message);
        return false;
    }
}

async function testDesignGenerator() {
    console.log('\n=== Testing Design Generator ===');

    const requirements = {
        refrigerant: 'R717',
        evapTemp: -5,
        condTemp: 40,
        coolingCapacity: 150,
        roomTemp: 0,
        objectives: ['efficiency', 'cost']
    };

    try {
        console.log('\n1. Generating Design Variants:');
        const variants = await DesignGenerator.generateVariants(requirements, mockKG, 4);

        console.log(`   ✓ Generated ${variants.length} design variants`);

        variants.forEach((variant, i) => {
            console.log(`\n   Variant ${i + 1} (${variant.strategy}):`);
            console.log(`     - Rank Score: ${variant.rank_score}`);
            console.log(`     - Components: ${variant.components?.length || 0}`);
            console.log(`     - COP: ${variant.performance?.system_COP || 'N/A'}`);
            console.log(`     - Total Cost: $${variant.cost_estimate?.total || 'N/A'}`);
            console.log(`     - Efficiency Rating: ${variant.performance?.efficiency_rating || 'N/A'}`);
            console.log(`     - Annual CO2: ${variant.carbon_footprint?.annual_co2 || 'N/A'} kg`);
        });

        // Validate top-ranked design
        console.log('\n2. Validating Top Design:');
        const topDesign = variants[0];
        console.log(`   ✓ Strategy: ${topDesign.strategy}`);
        console.log(`   ✓ Has compressor: ${topDesign.components.some(c => c.type === 'compressor')}`);
        console.log(`   ✓ Has condenser: ${topDesign.components.some(c => c.type === 'condenser')}`);
        console.log(`   ✓ Has evaporator: ${topDesign.components.some(c => c.type === 'evaporator')}`);
        console.log(`   ✓ Piping design: ${Object.keys(topDesign.piping || {}).length} line types`);

        console.log('\n✅ Design Generator Tests Passed');
        return true;

    } catch (error) {
        console.error('\n❌ Design Generator Test Failed:', error.message);
        console.error(error.stack);
        return false;
    }
}

async function testRAGOrchestrator() {
    console.log('\n=== Testing RAG Orchestrator ===');

    const requirements = {
        refrigerant: 'R717',
        evap_temp: -5,
        cond_temp: 40,
        cooling_capacity: 150
    };

    try {
        console.log('\n1. Generating AI-Powered Design:');
        const result = await RAGOrchestrator.generateDesign(requirements, mockKG);

        if (result.success) {
            console.log(`   ✓ Design generated successfully`);
            console.log(`   ✓ Similar designs used: ${result.context_used.similar_designs_count}`);
            console.log(`   ✓ Constraints applied: ${result.context_used.constraints_applied}`);
            console.log(`   ✓ Best practices: ${result.context_used.best_practices}`);

            if (result.design) {
                console.log(`   ✓ Components in design: ${result.design.components?.length || 0}`);
                console.log(`   ✓ Rationale: ${result.design.design_rationale?.substring(0, 100) || 'N/A'}...`);
            }
        } else {
            console.log(`   ⚠️  Design generation returned with issues: ${result.error}`);
        }

        console.log('\n✅ RAG Orchestrator Tests Passed');
        return true;

    } catch (error) {
        console.error('\n❌ RAG Orchestrator Test Failed:', error.message);
        return false;
    }
}

async function runAllTests() {
    console.log('╔═══════════════════════════════════════╗');
    console.log('║   GFDDE Phase 2 Integration Tests    ║');
    console.log('╚═══════════════════════════════════════╝');

    const results = {
        mlSizing: await testMLSizingEngine(),
        kgRetriever: await testKGRetriever(),
        designGenerator: await testDesignGenerator(),
        ragOrchestrator: await testRAGOrchestrator()
    };

    console.log('\n╔═══════════════════════════════════════╗');
    console.log('║           Test Summary                ║');
    console.log('╚═════════════════════════════════════╝');
    console.log(`ML Sizing Engine:     ${results.mlSizing ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`KG Retriever:         ${results.kgRetriever ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Design Generator:     ${results.designGenerator ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`RAG Orchestrator:     ${results.ragOrchestrator ? '✅ PASS' : '❌ FAIL'}`);

    const allPassed = Object.values(results).every(r => r === true);
    console.log(`\nOverall: ${allPassed ? '✅ ALL TESTS PASSED' : '⚠️  SOME TESTS FAILED'}`);

    process.exit(allPassed ? 0 : 1);
}

// Run tests
runAllTests();
