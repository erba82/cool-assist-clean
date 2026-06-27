// Simple test to directly call the service
const AmmoniaDesignWizardService = require('./services/AmmoniaDesignWizardService');

const testPrompt = `طراحی یک سیستم تبرید آمونیاک صنعتی برای کارخانه کشتار با مشخصات زیر:
- سردخانه 4 اتاق
- اتاق 1: Chill Room، دمای -5°C
- اتاق 2: Precool Room، دمای -5°C  
- اتاق 3: Storage، دمای -18°C
- اتاق 4: Tunnel، دمای -40°C`;

console.log('\n=== DIRECT SERVICE TEST ===\n');
console.log('Calling AmmoniaDesignWizardService.processRequest()...\n');

AmmoniaDesignWizardService.processRequest(testPrompt)
    .then(result => {
        console.log('\n=== SUCCESS ===\n');
        console.log('GFDDE Variants:', result.proposals?.gfdde_variants?.length || 0);
        console.log('P&ID Nodes:', result.diagram?.nodes?.length || 0);
        console.log('P&ID Edges:', result.diagram?.edges?.length || 0);
        console.log('Diagram Generator:', result.diagram?.metadata?.generator || 'Unknown');
        process.exit(0);
    })
    .catch(err => {
        console.error('\n=== ERROR ===\n');
        console.error(err.message);
        console.error(err.stack);
        process.exit(1);
    });
