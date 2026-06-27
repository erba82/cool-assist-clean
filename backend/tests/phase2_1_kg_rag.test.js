/**
 * Phase 2.1: KG-RAG Framework - Integration Test
 * Tests RAG Orchestrator and Design Generator
 */

const RAGOrchestrator = require('../services/generative/RAGOrchestrator');
const DesignGenerator = require('../services/generative/DesignGenerator');
const KGRetriever = require('../services/generative/KGRetriever');
const KnowledgeGraphBuilder = require('../services/ingress/KnowledgeGraphBuilder');

async function runPhase21IntegrationTest() {
    console.log('🧪 Phase 2.1: KG-RAG Framework - Integration Test');
    console.log('='.repeat(70));

    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;

    // Test requirements
    const testRequirements = {
        cooling_capacity: 150,  // kW
        evap_temp: -10,         // °C
        cond_temp: 40,          // °C
        refrigerant: 'R717',
        application: 'cold_storage',
        room_volume: 100        // m³
    };

    // ============================================================
    // PART 1: KG Retriever (Existing)
    // ============================================================
    console.log('\n📚 PART 1: Knowledge Graph Retriever');
    console.log('-'.repeat(70));

    try {
        totalTests++;
        console.log('\n[Test 1.1] KGRetriever - Component Selection Rules');

        const compressorRules = KGRetriever.getSelectionRules('compressor', testRequirements);

        console.log(`   Mandatory rules: ${compressorRules.mandatory.length}`);
        console.log(`   Recommended rules: ${compressorRules.recommended.length}`);
        console.log(`   Constraints: ${compressorRules.constraints.length}`);

        if (compressorRules.constraints.length > 0) {
            console.log(`   ✅ PASS: Found R717 constraints`);
            passedTests++;
        } else {
            console.log(`   ❌ FAIL: Missing constraints`);
            failedTests++;
        }
    } catch (error) {
        console.log(`   ❌ FAIL: ${error.message}`);
        failedTests++;
    }

    try {
        totalTests++;
        console.log('\n[Test 1.2] KGRetriever - Layout Constraints');

        const layoutConstraints = KGRetriever.getLayoutConstraints(testRequirements);

        console.log(`   Found ${layoutConstraints.length} layout constraints`);
        layoutConstraints.slice(0, 3).forEach(c => {
            console.log(`      - [${c.type}] ${c.rule || c.value}`);
        });

        if (layoutConstraints.length >= 3) {
            console.log(`   ✅ PASS: Layout constraints retrieved`);
            passedTests++;
        } else {
            console.log(`   ❌ FAIL: Insufficient constraints`);
            failedTests++;
        }
    } catch (error) {
        console.log(`   ❌ FAIL: ${error.message}`);
        failedTests++;
    }

    try {
        totalTests++;
        console.log('\n[Test 1.3] KGRetriever - Best Practices');

        const safetyPractices = KGRetriever.getBestPractices('safety');
        const efficiencyPractices = KGRetriever.getBestPractices('efficiency');

        console.log(`   Safety practices: ${safetyPractices.length}`);
        console.log(`   Efficiency practices: ${efficiencyPractices.length}`);

        if (safetyPractices.length >= 3 && efficiencyPractices.length >= 3) {
            console.log(`   ✅ PASS: Best practices available`);
            passedTests++;
        } else {
            console.log(`   ❌ FAIL: Incomplete best practices`);
            failedTests++;
        }
    } catch (error) {
        console.log(`   ❌ FAIL: ${error.message}`);
        failedTests++;
    }

    // ============================================================
    // PART 2: RAG Orchestrator
    // ============================================================
    console.log('\n\n🤖 PART 2: RAG Orchestrator');
    console.log('-'.repeat(70));

    try {
        totalTests++;
        console.log('\n[Test 2.1] RAG - Context Preparation');

        // Create mock KG
        const mockKG = KnowledgeGraphBuilder.buildGraph({
            metadata: {},
            blocks: {},
            entities: { symbols: [], text: [], lines: [], polylines: [] },
            layers: {}
        });

        KGRetriever.setKnowledgeGraph(mockKG);

        const context = await RAGOrchestrator.prepareContext(testRequirements);

        console.log(`   Context sources: ${context.metadata.sources.join(', ')}`);
        console.log(`   Component rules: ${Object.keys(context.componentRules).length} types`);
        console.log(`   Layout constraints: ${context.layoutConstraints.length}`);
        console.log(`   Best practices: ${context.bestPractices.length} categories`);

        if (context.metadata.sources.length >= 3) {
            console.log(`   ✅ PASS: Context prepared with multiple sources`);
            passedTests++;
        } else {
            console.log(`   ❌ FAIL: Insufficient context sources`);
            failedTests++;
        }
    } catch (error) {
        console.log(`   ❌ FAIL: ${error.message}`);
        failedTests++;
    }

    try {
        totalTests++;
        console.log('\n[Test 2.2] RAG - LLM Prompt Formatting');

        const context = await RAGOrchestrator.prepareContext(testRequirements);
        const formattedPrompt = RAGOrchestrator.formatContextForLLM(context);

        console.log(`   Prompt length: ${formattedPrompt.length} characters`);
        console.log(`   Contains requirements: ${formattedPrompt.includes('Design Requirements')}`);
        console.log(`   Contains guidelines: ${formattedPrompt.includes('Component Selection')}`);
        console.log(`   Contains best practices: ${formattedPrompt.includes('Best Practices')}`);

        if (formattedPrompt.length > 500 && formattedPrompt.includes('Best Practices')) {
            console.log(`   ✅ PASS: Prompt formatted correctly`);
            passedTests++;
        } else {
            console.log(`   ❌ FAIL: Incomplete prompt`);
            failedTests++;
        }
    } catch (error) {
        console.log(`   ❌ FAIL: ${error.message}`);
        failedTests++;
    }

    // ============================================================
    // PART 3: Design Generator
    // ============================================================
    console.log('\n\n🏗️  PART 3: Design Generator');
    console.log('-'.repeat(70));

    try {
        totalTests++;
        console.log('\n[Test 3.1] DesignGen - Single Variant Generation');

        const variants = await DesignGenerator.generateVariants(testRequirements, {
            variantCount: 1,
            strategy: 'balanced',
            includeThermodynamics: true
        });

        const variant = variants[0];

        console.log(`   Variant ID: ${variant.id}`);
        console.log(`   Compressors: ${variant.components.compressors.length}`);
        console.log(`   Evaporators: ${variant.components.evaporators.length}`);
        console.log(`   Pipes: ${variant.piping.length}`);
        console.log(`   COP: ${variant.thermodynamics?.cop?.toFixed(2) || 'N/A'}`);
        console.log(`   Score: ${variant.score.toFixed(1)}`);

        if (variant.components.compressors.length > 0 && variant.piping.length > 0) {
            console.log(`   ✅ PASS: Variant generated successfully`);
            passedTests++;
        } else {
            console.log(`   ❌ FAIL: Incomplete variant`);
            failedTests++;
        }
    } catch (error) {
        console.log(`   ❌ FAIL: ${error.message}`);
        failedTests++;
    }

    try {
        totalTests++;
        console.log('\n[Test 3.2] DesignGen - Multiple Variants with Strategies');

        const variants = await DesignGenerator.generateVariants(testRequirements, {
            variantCount: 3,
            strategy: 'balanced',
            includeThermodynamics: false  // Skip for speed
        });

        console.log(`   Generated: ${variants.length} variants`);
        variants.forEach((v, i) => {
            console.log(`      ${i + 1}. ${v.id} - Score: ${v.score.toFixed(1)} - Evaps: ${v.components.evaporators.length}`);
        });

        const allValid = variants.every(v =>
            v.components.compressors.length > 0 &&
            v.components.evaporators.length > 0
        );

        if (variants.length === 3 && allValid) {
            console.log(`   ✅ PASS: All variants valid`);
            passedTests++;
        } else {
            console.log(`   ❌ FAIL: Some variants invalid`);
            failedTests++;
        }
    } catch (error) {
        console.log(`   ❌ FAIL: ${error.message}`);
        failedTests++;
    }

    try {
        totalTests++;
        console.log('\n[Test 3.3] DesignGen - Variant Ranking');

        const variants = await DesignGenerator.generateVariants(testRequirements, {
            variantCount: 3,
            includeThermodynamics: true
        });

        const isSorted = variants.every((v, i) =>
            i === 0 || v.score <= variants[i - 1].score
        );

        console.log(`   Variants sorted by score: ${isSorted}`);
        console.log(`   Top variant score: ${variants[0].score.toFixed(1)}`);
        console.log(`   Lowest variant score: ${variants[variants.length - 1].score.toFixed(1)}`);

        if (isSorted) {
            console.log(`   ✅ PASS: Variants properly ranked`);
            passedTests++;
        } else {
            console.log(`   ❌ FAIL: Ranking incorrect`);
            failedTests++;
        }
    } catch (error) {
        console.log(`   ❌ FAIL: ${error.message}`);
        failedTests++;
    }

    // ============================================================
    // PART 4: End-to-End RAG Pipeline
    // ============================================================
    console.log('\n\n🔗 PART 4: End-to-End RAG Pipeline');
    console.log('-'.repeat(70));

    try {
        totalTests++;
        console.log('\n[Test 4.1] Full RAG Pipeline - Design Generation');

        console.log('   Step 1: Initialize RAG');
        await RAGOrchestrator.initialize();

        console.log('   Step 2: Prepare context from KG');
        const context = await RAGOrchestrator.prepareContext(testRequirements);

        console.log('   Step 3: Generate designs');
        const variants = await DesignGenerator.generateVariants(testRequirements, {
            variantCount: 2,
            includeThermodynamics: true
        });

        console.log('   Step 4: Evaluate top variant');
        const topVariant = variants[0];
        const evaluation = RAGOrchestrator.evaluateDesign(topVariant, context);

        console.log(`   Evaluation score: ${evaluation.score}`);
        console.log(`   Passed checks: ${evaluation.passed.length}`);
        console.log(`   Warnings: ${evaluation.warnings.length}`);

        if (variants.length > 0 && evaluation.score > 0) {
            console.log(`   ✅ PASS: Full RAG pipeline operational`);
            passedTests++;
        } else {
            console.log(`   ❌ FAIL: Pipeline incomplete`);
            failedTests++;
        }
    } catch (error) {
        console.log(`   ❌ FAIL: ${error.message}`);
        failedTests++;
    }

    // ============================================================
    // SUMMARY
    // ============================================================
    console.log('\n\n' + '='.repeat(70));
    console.log('📊 PHASE 2.1 INTEGRATION TEST SUMMARY');
    console.log('='.repeat(70));

    console.log(`\n   Total Tests: ${totalTests}`);
    console.log(`   ✅ Passed: ${passedTests}`);
    console.log(`   ❌ Failed: ${failedTests}`);
    console.log(`   📈 Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

    console.log('\n📦 Component Status:');
    console.log(`   KGRetriever: ${passedTests >= 3 ? '✅ READY' : '⚠️  NEEDS WORK'}`);
    console.log(`   RAGOrchestrator: ${passedTests >= 5 ? '✅ READY' : '⚠️  NEEDS WORK'}`);
    console.log(`   DesignGenerator: ${passedTests >= 8 ? '✅ READY' : '⚠️  NEEDS WORK'}`);

    const allPassed = failedTests === 0;

    if (allPassed) {
        console.log('\n🎉 PHASE 2.1 VERIFIED - KG-RAG FRAMEWORK READY!');
        console.log('\n✅ All RAG components operational');
        console.log('✅ Context preparation working');
        console.log('✅ Design generation successful');
        console.log('✅ Ready for Phase 2.2 or deployment\n');
        process.exit(0);
    } else {
        console.log('\n⚠️  PHASE 2.1 NEEDS ATTENTION');
        console.log(`\n   ${failedTests} test(s) failed - review required\n`);
        process.exit(1);
    }
}

// Run the test
runPhase21IntegrationTest().catch(error => {
    console.error('\n❌ TEST EXECUTION ERROR:', error);
    console.error(error.stack);
    process.exit(1);
});
