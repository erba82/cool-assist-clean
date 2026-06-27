// Test GFDDE Integration End-to-End
const AmmoniaDesignWizardService = require('./services/AmmoniaDesignWizardService');

async function testGFDDEIntegration() {
    console.log('\n=== GFDDE Integration Test ===\n');

    const testPrompt = `طراحی یک سیستم تبرید آمونیاک صنعتی برای کارخانه کشتار با مشخصات زیر:
    - سردخانه 4 اتاق
    - اتاق 1: Chill Room (x1 rooms), دمای -5°C
    - اتاق 2: Precool Room (x1 rooms), دمای -5°C  
    - اتاق 3: Storage (x1 rooms), دمای -18°C
    - اتاق 4: Tunnel (x1 rooms), دمای -40°C
    - بار کل تبرید: 295 کیلووات`;

    try {
        console.log('📝 Test Prompt:', testPrompt.substring(0, 100) + '...\n');

        const result = await AmmoniaDesignWizardService.processRequest(testPrompt);

        console.log('\n✅ Service Response Received\n');
        console.log('='.repeat(60));

        // Check GFDDE Variants
        if (result.proposals && result.proposals.gfdde_variants) {
            console.log(`\n🎯 GFDDE Variants: ${result.proposals.gfdde_variants.length}`);
            result.proposals.gfdde_variants.forEach((v, i) => {
                console.log(`   ${i + 1}. ${v.strategy.toUpperCase()}: Score=${v.rank_score.toFixed(1)}, COP=${v.performance.system_COP.toFixed(2)}`);
            });
        } else {
            console.log('\n❌ NO GFDDE VARIANTS FOUND!');
        }

        // Check P&ID Diagram
        console.log(`\n📐 P&ID Diagram:`);
        console.log(`   Nodes: ${result.diagram?.nodes?.length || 0}`);
        console.log(`   Edges: ${result.diagram?.edges?.length || 0}`);

        if (result.diagram?.metadata) {
            console.log(`   Generator: ${result.diagram.metadata.generator || 'Unknown'}`);
            console.log(`   Strategy: ${result.diagram.metadata.strategy || 'N/A'}`);
        }

        // Sample Nodes
        if (result.diagram?.nodes && result.diagram.nodes.length > 0) {
            console.log(`\n📋 Sample Nodes (first 5):`);
            result.diagram.nodes.slice(0, 5).forEach(node => {
                console.log(`   - ${node.data.tag || node.id}: ${node.data.componentType} (${node.data.label})`);
            });
        }

        // Sample Edges
        if (result.diagram?.edges && result.diagram.edges.length > 0) {
            console.log(`\n🔗 Sample Edges (first 5):`);
            result.diagram.edges.slice(0, 5).forEach(edge => {
                console.log(`   - ${edge.source} → ${edge.target}: ${edge.type} (${edge.label || 'no label'})`);
            });
        }

        // Equipment Summary
        console.log(`\n🔧 Equipment (BEST tier):`);
        console.log(`   Compressors: ${result.proposals.best?.compressors?.length || 0}`);
        console.log(`   Evaporators: ${result.proposals.best?.evaporators?.length || 0}`);
        console.log(`   Total Price: $${result.proposals.best?.totalPrice?.toLocaleString() || '?'}`);

        console.log('\n' + '='.repeat(60));
        console.log('✅ TEST COMPLETED SUCCESSFULLY\n');

        return result;

    } catch (error) {
        console.error('\n❌ TEST FAILED:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

// Run test
testGFDDEIntegration().then(() => {
    console.log('Exiting...');
    process.exit(0);
}).catch(err => {
    console.error('Unhandled error:', err);
    process.exit(1);
});
