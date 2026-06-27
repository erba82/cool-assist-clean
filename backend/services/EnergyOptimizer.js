const { GoogleGenerativeAI } = require("@google/generative-ai");

class EnergyOptimizer {
    constructor() {
        const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
        if (apiKey) {
            this.genAI = new GoogleGenerativeAI(apiKey);
            this.model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        }
    }

    /**
     * Analyzes the project and returns energy optimization recommendations.
     * @param {Object} projectInfo - Project details (location, ambient temp, etc.)
     * @param {Object} loads - Calculated loads
     * @param {Object} equipment - Selected equipment (Best/Premium tier)
     * @returns {Promise<Object>} Optimization report with ROI analysis
     */
    async optimize(projectInfo, loads, equipment) {
        const optimizations = [];
        let totalSavingsKW = 0;

        // 1. Floating Head Pressure Control
        // Effective in climates with varying ambient temperatures
        if (projectInfo.ambientTemp < 30 || projectInfo.location.toLowerCase().includes('north') || projectInfo.location.toLowerCase().includes('europe')) {
            const savings = loads.total.highStage * 0.12; // Approx 12% savings
            optimizations.push({
                title: "Floating Head Pressure Control",
                description: "Allow condensing pressure to drop with lower ambient temperatures.",
                savingsKW: savings.toFixed(1),
                costUSD: 2500, // Control system upgrade cost
                roiMonths: (2500 / (savings * 0.15 * 720)).toFixed(1) // Assuming $0.15/kWh, 720h/month
            });
            totalSavingsKW += savings;
        }

        // 2. VFD on Compressors
        // Recommended if load varies or multiple compressors are used
        const compPower = equipment.compressors.reduce((sum, c) => sum + (c.power || 100), 0); // Mock power if missing
        if (equipment.compressors.length > 1) {
            const savings = compPower * 0.15; // 15% part-load efficiency gain
            optimizations.push({
                title: "Variable Frequency Drives (VFD)",
                description: "Install VFDs on lead compressors to match capacity with load precisely.",
                savingsKW: savings.toFixed(1),
                costUSD: 5000 * equipment.compressors.length,
                roiMonths: ((5000 * equipment.compressors.length) / (savings * 0.15 * 720)).toFixed(1)
            });
            totalSavingsKW += savings;
        }

        // 3. Heat Recovery System
        // If there's a need for hot water (e.g., slaughterhouse cleaning)
        if (projectInfo.name.toLowerCase().includes('slaughter') || projectInfo.name.toLowerCase().includes('processing')) {
            const recoveredHeat = loads.total.highStage * 0.20; // Recover 20% of rejection
            optimizations.push({
                title: "Waste Heat Recovery",
                description: "Recover heat from oil cooling or discharge gas for wash-down water.",
                savingsKW: recoveredHeat.toFixed(1) + " (Thermal)",
                costUSD: 8000,
                roiMonths: 12 // Estimate
            });
        }

        // 4. AI-Driven Advanced Analysis
        let aiRecommendations = [];
        if (this.model) {
            try {
                const prompt = `
                Analyze this ammonia refrigeration project for energy efficiency:
                Location: ${projectInfo.location}, Ambient: ${projectInfo.ambientTemp}C
                Total Load: ${loads.total.highStage.toFixed(0)} kW
                Application: ${projectInfo.name}
                
                Suggest 2 specific, advanced energy saving measures beyond VFD and Floating Head Pressure.
                Format as JSON: [{ "title": "...", "description": "...", "estimatedSavings": "..." }]
                `;

                const result = await this.model.generateContent(prompt);
                const text = result.response.text().replace(/```json|```/g, '').trim();
                aiRecommendations = JSON.parse(text);
            } catch (e) {
                console.error("AI Optimization Error:", e);
                aiRecommendations = [{ title: "AI Analysis Unavailable", description: "Could not generate advanced insights." }];
            }
        }

        return {
            summary: {
                totalStrategies: [...optimizations, ...aiRecommendations].length,
                quickWins: optimizations.filter(m => parseFloat(m.roiMonths) < 12).length,
                totalInvestment: optimizations.reduce((s, m) => s + (m.costUSD || 0), 0),
                co2ReductionKg: (totalSavingsKW * 8760 * 0.5).toFixed(0) // kg CO2/year (0.5 kg/kWh avg)
            },
            baselinePowerKW: compPower,
            optimizedPowerKW: compPower - totalSavingsKW,
            totalSavingsKW: totalSavingsKW.toFixed(1),
            totalSavingsPercent: ((totalSavingsKW / compPower) * 100).toFixed(1),
            annualSavingsUSD: (totalSavingsKW * 0.15 * 8760).toFixed(0), // $0.15/kWh
            measures: [...optimizations, ...aiRecommendations]
        };
    }
}

module.exports = new EnergyOptimizer();
