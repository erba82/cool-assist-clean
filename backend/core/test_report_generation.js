/**
 * Test Phase 4: Report Generation
 */

const DesignOrchestrator = require('../core/ai/DesignOrchestrator');
const ReportGenerator = require('../core/reporting/ReportGenerator');
const HTMLReportFormatter = require('../core/reporting/HTMLReportFormatter');
const fs = require('fs');
const path = require('path');

async function testReportGeneration() {
    console.log('====================================');
    console.log('🧪 Phase 4: Report Generation Test');
    console.log('====================================\n');

    // 1. Run design workflow
    console.log('1️⃣ Running design workflow...\n');

    const orchestrator = new DesignOrchestrator();
    const userInput = `
        طراحی سردخانه کشتارگاه اردبیل با آمونیاک،
        1 سالن چیلینگ 20x8x4 متر برای -5 درجه،
        4 تونل انجماد 4x4x4 متر برای -40 درجه،
        4 سالن نگهداری 20x15x9 متر برای -18 درجه
    `;

    const result = await orchestrator.processRequest(userInput);

    if (!result.success) {
        console.error('❌ Design failed:', result.error);
        return;
    }

    console.log('✅ Design completed successfully!\n');

    // 2. Generate report
    console.log('2️⃣ Generating report...\n');

    const generator = new ReportGenerator();
    const report = generator.generate(result.fullResults, {
        name: result.project.name,
        location: result.project.location,
        refrigerant: result.project.refrigerant,
        rooms: result.fullResults.calculations.loads.length,
        client: 'Test Client Inc.'
    });

    console.log('📊 Report Summary:');
    console.log(`   Project: ${report.metadata.projectName}`);
    console.log(`   Project No: ${report.metadata.projectNumber}`);
    console.log(`   Total Load: ${report.summary.totalLoad.value} kW`);
    console.log(`   BOM Items: ${report.equipment.items.length}`);
    console.log(`   BOM Total: $${report.equipment.total.toLocaleString()}\n`);

    // 3. Generate HTML
    console.log('3️⃣ Generating HTML report...\n');

    const formatter = new HTMLReportFormatter();
    const html = formatter.format(report);

    // Save to file
    const outputDir = path.join(__dirname, '../output');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const htmlPath = path.join(outputDir, `report_${Date.now()}.html`);
    fs.writeFileSync(htmlPath, html, 'utf8');

    console.log(`✅ HTML report saved: ${htmlPath}`);
    console.log(`   File size: ${(html.length / 1024).toFixed(1)} KB\n`);

    // 4. Show BOM details
    console.log('4️⃣ Bill of Materials Preview:\n');
    console.log('   Category             | Tag        | Description                  | Total Price');
    console.log('   ' + '-'.repeat(85));

    report.equipment.items.slice(0, 5).forEach(item => {
        const category = item.category.padEnd(20);
        const tag = item.tag.padEnd(10);
        const desc = item.description.substring(0, 28).padEnd(28);
        const price = `$${item.totalPrice.toLocaleString()}`.padStart(12);
        console.log(`   ${category} | ${tag} | ${desc} | ${price}`);
    });

    console.log(`   ... and ${report.equipment.items.length - 5} more items\n`);
    console.log(`   Subtotal:        $${report.equipment.subtotal.toLocaleString()}`);
    console.log(`   Contingency 15%: $${report.equipment.contingencyAmount.toLocaleString()}`);
    console.log(`   TOTAL:           $${report.equipment.total.toLocaleString()}\n`);

    // 5. Energy report
    if (report.energy) {
        console.log('5️⃣ Energy Analysis:\n');
        console.log(`   Annual Consumption: ${report.energy.consumption.annual.toLocaleString()} kWh`);
        console.log(`   Annual Cost: $${report.energy.consumption.cost.toLocaleString()}`);
        console.log(`   Potential Savings: ${report.energy.optimization.potential_savings_percent}%`);
        console.log(`   Payback Period: ${report.energy.optimization.payback_period} years\n`);
    }

    console.log('====================================');
    console.log('✅ Phase 4 Test PASSED!');
    console.log('====================================');

    return htmlPath;
}

// Run test
testReportGeneration()
    .then(path => {
        console.log(`\n📁 Open report: ${path}`);
    })
    .catch(err => {
        console.error('❌ Test failed:', err);
    });
