const { GoogleGenerativeAI } = require("@google/generative-ai");

class StandardSelector {
    constructor() {
        const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
        if (apiKey) {
            this.genAI = new GoogleGenerativeAI(apiKey);
            this.model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        }
    }

    /**
     * Determines the applicable standards based on the project location.
     * @param {string} location - Project location (e.g., "Texas, USA", "Berlin, Germany")
     * @returns {Object} Applicable standards and their description.
     */
    resolveStandards(location) {
        const loc = location.toLowerCase();
        if (loc.includes('usa') || loc.includes('america') || loc.includes('canada')) {
            return {
                code: 'IIAR-2',
                name: 'IIAR 2: Safe Design of Closed-Circuit Ammonia Refrigeration Systems',
                region: 'North America',
                safety_class: 'B2L'
            };
        } else if (loc.includes('europe') || loc.includes('germany') || loc.includes('uk') || loc.includes('france')) {
            return {
                code: 'EN-378',
                name: 'EN 378: Refrigerating systems and heat pumps - Safety and environmental requirements',
                region: 'Europe',
                safety_class: 'B2L'
            };
        } else if (loc.includes('australia') || loc.includes('nz')) {
            return {
                code: 'AS/NZS 5149',
                name: 'AS/NZS 5149: Refrigerating systems and heat pumps',
                region: 'Oceania',
                safety_class: 'B2L'
            };
        } else {
            // Default to ISO for other regions (e.g., Middle East, Asia)
            return {
                code: 'ISO-5149',
                name: 'ISO 5149: Refrigerating systems and heat pumps',
                region: 'International',
                safety_class: 'B2L'
            };
        }
    }

    /**
     * Generates a compliance checklist and safety recommendations.
     * @param {Object} standard - The standard object returned by resolveStandards.
     * @param {Object} design - The complete design object.
     * @returns {Promise<Object>} Compliance report.
     */
    async generateComplianceReport(standard, design) {
        const checklist = [];

        // Common checks
        checklist.push({
            item: "Ammonia Detection",
            status: "Required",
            detail: `Install NH3 detectors in machinery room and valve stations per ${standard.code}.`
        });

        checklist.push({
            item: "Emergency Ventilation",
            status: "Required",
            detail: "Mechanical ventilation capable of 30 air changes/hour upon leak detection."
        });

        checklist.push({
            item: "Pressure Relief Valves",
            status: "Critical",
            detail: "Dual relief valves on all vessels > 3 cu.ft with 3-way manifold."
        });

        // AI-Enhanced Specific Checks
        let aiCompliance = [];
        if (this.model) {
            try {
                const prompt = `
                Generate 3 specific safety compliance checks for an ammonia refrigeration system based on standard: ${standard.code} (${standard.name}).
                Project Context: ${design.projectInfo.name}, Location: ${design.projectInfo.location}.
                Focus on machinery room safety and piping.
                Format as JSON: [{ "item": "...", "status": "Recommended/Required", "detail": "..." }]
                `;

                const result = await this.model.generateContent(prompt);
                const text = result.response.text().replace(/```json|```/g, '').trim();
                aiCompliance = JSON.parse(text);
            } catch (e) {
                console.error("AI Compliance Error:", e);
            }
        }

        return {
            standard: standard,
            checklist: [...checklist, ...aiCompliance]
        };
    }
}

module.exports = new StandardSelector();
