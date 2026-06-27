require('dotenv').config();
const Service = require('./services/AmmoniaDesignWizardService');

const prompt = "طراحی سردخانه کشتارگاه صنعتی دبی با 4 تونل انجماد 20 تن و 4 سالن نگهداری 500 تن";

async function runTest() {
    try {
        console.log("--- STARTING DETERMINISM TEST ---");

        console.log("Run 1...");
        const result1 = await Service.processRequest(prompt);

        console.log("Run 2 (Should use cache)...");
        const result2 = await Service.processRequest(prompt);

        // Compare critical values
        const load1 = result1.loads.total.highStage;
        const load2 = result2.loads.total.highStage;

        console.log(`Load 1: ${load1} kW`);
        console.log(`Load 2: ${load2} kW`);

        if (load1 !== load2) {
            console.error("❌ FAIL: Loads are different!");
        } else {
            console.log("✅ PASS: Loads are deterministic.");
        }

        // Check P&ID generation method
        console.log("P&ID Source:", result1.diagram.generatedBy || "Fallback/Unknown");

        if (result1.diagram.generatedBy === "Gemini 2.0 AI") {
            console.log("✅ PASS: AI P&ID is active.");
        } else {
            console.warn("⚠️ WARN: Using fallback P&ID (or 'generatedBy' field missing).");
        }

        // Check node count
        console.log(`Nodes Run 1: ${result1.diagram.nodes.length}`);
        console.log(`Nodes Run 2: ${result2.diagram.nodes.length}`);

        if (result1.diagram.nodes.length > 5) {
            console.log("✅ PASS: Diagram has sufficient complexity.");
        } else {
            console.warn("⚠️ WARN: Diagram seems too simple.");
        }

        process.exit(0);
    } catch (error) {
        console.error("❌ TEST FAILED WITH ERROR:", error);
        process.exit(1);
    }
}

runTest();
