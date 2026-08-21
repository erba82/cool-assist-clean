/**
 * Core Design API Route
 * 
 * Endpoints:
 * POST /api/core/design - Process design request
 * GET /api/core/status - Check engine status
 * 
 * @author GFDDE AI Engine
 * @version 2.0.0
 */

const express = require('express');
const router = express.Router();
const DesignOrchestrator = require('../core/ai/DesignOrchestrator');
const { capabilityFor, listCapabilities } = require('../core/engineering/RefrigerantCapabilityService');
const { getProviderStatus, validatePropertyRequest } = require('../core/engineering/ThermophysicalProviderRegistry');
const ThermophysicalParallelComparisonService = require('../core/engineering/ThermophysicalParallelComparisonService');
const { CoolPropSidecarClient } = require('../core/engineering/CoolPropSidecarClient');
const { readinessFor, listReadiness } = require('../core/engineering/MultiRefrigerantReadinessService');

// Initialize orchestrator
let orchestrator = null;

function getOrchestrator() {
    if (!orchestrator) {
        orchestrator = new DesignOrchestrator();
    }
    return orchestrator;
}

/**
 * POST /api/core/design
 * Process a refrigeration design request
 */
router.post('/design', async (req, res) => {
    try {
        const { message, refrigerant, location, options } = req.body;

        if (!message) {
            return res.status(400).json({
                success: false,
                error: 'Message is required'
            });
        }

        console.log('📨 Design request received:', message.substring(0, 100) + '...');
        if (refrigerant) {
            console.log(`   🧊 Refrigerant specified: ${refrigerant}`);
        }

        const orch = getOrchestrator();

        // Override refrigerant and/or location if explicitly provided
        let modifiedMessage = message;
        if (refrigerant || location) {
            // Create a modified message with explicit parameters for AI to consider
            if (refrigerant) {
                modifiedMessage += ` (specific refrigerant: ${refrigerant})`;
            }
            if (location) {
                modifiedMessage += ` (location: ${JSON.stringify(location)})`;
            }
        }

        // Use AI parsing (let the orchestrator handle parsing internally)
        const result = await orch.processRequest(modifiedMessage, false, null);

        // Generate summary text
        result.summaryText = orch.generateSummaryText(result);

        console.log('✅ Design completed in', result.executionTime, 'ms');

        res.json(result);

    } catch (error) {
        console.error('❌ Design API error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/core/chat
 * Intelligent conversational AI - responds to questions without calculations
 */
router.post('/chat', async (req, res) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({
                success: false,
                error: 'Message is required'
            });
        }

        console.log('💬 Chat message received:', message.substring(0, 100) + '...');

        // Knowledge base for intelligent responses
        const knowledgeBase = {
            greetings: ['سلام', 'hello', 'hi', 'درود', 'صبح بخیر', 'عصر بخیر'],
            ammonia: ['آمونیاک', 'ammonia', 'r717', 'nh3'],
            compressor: ['کمپرسور', 'compressor', 'فشرده'],
            evaporator: ['اواپراتور', 'evaporator', 'تبخیر'],
            condenser: ['کندانسور', 'condenser', 'تقطیر', 'میعان'],
            safety: ['ایمنی', 'safety', 'خطر', 'danger'],
            efficiency: ['راندمان', 'efficiency', 'بازده', 'مصرف انرژی'],
            coldStorage: ['سردخانه', 'cold storage', 'انبار', 'نگهداری'],
            help: ['کمک', 'help', 'راهنما', 'چطور', 'how']
        };

        const lowerMessage = message.toLowerCase();
        let response = '';

        // Check for greetings
        if (knowledgeBase.greetings.some(g => lowerMessage.includes(g))) {
            response = `Hello! 👋 I am your Ammonia Refrigeration Design Engineer.

I can help you with:
• Industrial refrigeration concepts
• Equipment info (compressors, evaporators, condensers)
• Ammonia safety standards (EN 378, ASHRAE 15)
• Cold storage design guidance

💡 To start a design, enable the "Calculate" button.`;
        }
        // Check for ammonia questions
        else if (knowledgeBase.ammonia.some(k => lowerMessage.includes(k))) {
            response = `🧊 **Ammonia (R717/NH3)** is a natural refrigerant with excellent thermodynamic properties.

**Advantages:**
• High COP (4-6)
• GWP = 0 (no greenhouse effect)
• Cost effective
• High efficiency at low temperatures

**Best Applications:**
• Industrial cold storage
• Slaughterhouses and food processing
• Large refrigerated warehouses

⚠️ **Note:** Due to toxicity, EN 378 safety standards must be followed.`;
        }
        // Check for compressor questions
        else if (knowledgeBase.compressor.some(k => lowerMessage.includes(k))) {
            response = `⚙️ **Ammonia Refrigeration Compressors:**

**Common Types:**
1. **Screw Compressor** - For high capacities (>100kW)
2. **Reciprocating Compressor** - For smaller capacities
3. **Centrifugal Compressor** - For very large systems

**Selection Parameters:**
• Cooling capacity (kW)
• Compression ratio
• Evaporating and condensing temperatures
• Isentropic efficiency

💡 In design, 2 compressors (1 standby) are recommended.`;
        }
        // Check for evaporator questions
        else if (knowledgeBase.evaporator.some(k => lowerMessage.includes(k))) {
            response = `❄️ **Evaporators (Air Coolers):**

**Types:**
• **Finned Tube** - Common for cold rooms
• **Plate Evaporator** - For liquids
• **Shell & Tube** - For closed systems

**Key Parameters:**
• Capacity (kW)
• Temperature difference (TD or ΔT)
• Air velocity and fan count
• Fin spacing (for low temperatures)

💡 For temperatures below -25°C, use wider fin spacing (defrost considerations).`;
        }
        // Check for condenser questions
        else if (knowledgeBase.condenser.some(k => lowerMessage.includes(k))) {
            response = `🌡️ **Condensers:**

**Types:**
1. **Evaporative** - High efficiency, uses water
2. **Air-Cooled** - Simple installation, lower efficiency
3. **Shell & Tube** - With cooling water

**Selection Based On:**
• Ambient temperature (Wet Bulb / Dry Bulb)
• Required heat rejection capacity
• Water availability
• Maintenance costs

💡 Evaporative condensers are 15-20% more efficient.`;
        }
        // Check for safety questions
        else if (knowledgeBase.safety.some(k => lowerMessage.includes(k))) {
            response = `⚠️ **Ammonia System Safety:**

**Standards:**
• **EN 378** - European standard
• **ASHRAE 15** - American standard
• **IIAR** - Industrial guidelines

**Safety Requirements:**
• Leak detection system
• Emergency ventilation
• Warning signs
• Personnel training
• Personal Protective Equipment (PPE)

⚠️ **Exposure Limits:** 25 ppm (TWA) and 35 ppm (STEL)`;
        }
        // Check for efficiency questions
        else if (knowledgeBase.efficiency.some(k => lowerMessage.includes(k))) {
            response = `📊 **Refrigeration System Efficiency:**

**Key Indicators:**
• **COP** (Coefficient of Performance) = Q_evap / W_comp
• **EER** (Energy Efficiency Ratio)
• **SEER** (Seasonal EER)

**Influencing Factors:**
• Proper equipment selection
• Smart controls (VFD, Economizer)
• Regular maintenance
• Intermediate temperature optimization

💡 Typical ammonia COP: 4-6 (depending on conditions)`;
        }
        // Check for cold storage questions
        else if (knowledgeBase.coldStorage.some(k => lowerMessage.includes(k))) {
            response = `🏢 **Cold Storage Design:**

**Temperature Categories:**
• **Chill:** +2°C to +8°C
• **Frozen:** -18°C to -25°C
• **Blast Freezing:** -35°C to -45°C

**Common Products:**
• Red meat: -18°C
• Poultry: -18°C
• Fruits & vegetables: +2°C to +4°C
• Ice cream: -25°C

💡 For accurate design, enable the "Calculate" button and describe your project.`;
        }
        // Check for help
        else if (knowledgeBase.help.some(k => lowerMessage.includes(k))) {
            response = `📖 **Usage Guide:**

**Chat Mode (Current):**
You can ask technical questions and I will explain.

**Calculate Mode:**
Enable the "🧮 Calculate" button, then describe your project:
• "500-ton cold storage in Dubai"
• "Poultry slaughterhouse with 4 freezing tunnels"
• "2000 sqm fruit warehouse"

**Outputs:**
✅ Heat load calculation
✅ Equipment selection
✅ P&ID diagram
✅ 3D model`;
        }
        // Default intelligent response
        else {
            response = `🤔 I understood your message.

**You can ask me about:**
• Ammonia and its properties
• Types of compressors, evaporators, condensers
• Safety standards (EN 378, ASHRAE)
• Cold storage design principles

**Or for design:**
Enable the "🧮 Calculate" button and describe your project.

Example: "1000-ton cold storage in Tehran for meat storage"`;
        }

        console.log('💬 Chat response sent');

        res.json({
            success: true,
            response: response,
            type: 'chat'
        });

    } catch (error) {
        console.error('❌ Chat API error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});


/**
 * GET /api/core/status
 * Check Core Engine status
 */
router.get('/status', (req, res) => {
    try {
        const orch = getOrchestrator();

        res.json({
            success: true,
            version: orch.engine.version,
            modules: Array.from(orch.engine.modules.keys()),
            refrigerants: orch.engine.constructor.SUPPORTED_REFRIGERANTS,
            ready: true
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            ready: false
        });
    }
});

/**
 * POST /api/core/calculate-load
 * Quick load calculation for a single room
 */
router.post('/calculate-load', async (req, res) => {
    try {
        const { room, climate } = req.body;

        if (!room) {
            return res.status(400).json({
                success: false,
                error: 'Room data is required'
            });
        }

        const orch = getOrchestrator();
        const loadModule = orch.engine.getModule('load');

        const project = {
            climate: climate || { summerDB: 35 }
        };

        const result = await loadModule.calculateRoom(room, project);

        res.json({
            success: true,
            load: result
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/core/refrigerant-capabilities
 * Return profile-specific cycle, equipment and calculation readiness without claiming final selection.
 */
router.get('/refrigerant-capabilities', (_req, res) => {
    try {
        res.json({ success: true, capabilities: listCapabilities(), policy: 'Profiles provide semantic design intent only. Property sources, manufacturer maps and procurement evidence remain review gates.' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/refrigerant-capabilities/:code', (req, res) => {
    const capability = capabilityFor(req.params.code);
    res.status(capability.supported ? 200 : 404).json({ success: capability.supported, capability });
});

/**
 * GET /api/core/multi-refrigerant-readiness
 * Read-only traceability matrix from profile through property and catalogue evidence.
 */
router.get('/multi-refrigerant-readiness', (_req, res) => {
    res.json({ success: true, refrigerants: listReadiness() });
});

router.get('/multi-refrigerant-readiness/:code', (req, res) => {
    const readiness = readinessFor(req.params.code);
    res.status(readiness.supported ? 200 : 404).json({ success: readiness.supported, readiness });
});

/**
 * GET /api/core/thermophysical-provider/status
 * Read-only provider readiness. This endpoint never performs an outbound property call.
 */
router.get('/thermophysical-provider/status', (_req, res) => {
    res.json({ success: true, provider: getProviderStatus() });
});

/**
 * POST /api/core/thermophysical-provider/validate-request
 * Validate the canonical SI property-request contract without querying a provider.
 */
router.post('/thermophysical-provider/validate-request', (req, res) => {
    const validation = validatePropertyRequest(req.body || {});
    res.status(validation.valid ? 200 : 400).json({ success: validation.valid, validation });
});

/**
 * POST /api/core/thermophysical-provider/compare-cycle
 * Executes an explicit, review-gated parallel comparison. It never promotes a result to final selection.
 */
router.post('/thermophysical-provider/compare-cycle', async (req, res) => {
    try {
        const service = new ThermophysicalParallelComparisonService();
        const comparison = await service.compareSimpleVaporCompression(req.body || {});
        res.json({ success: true, comparison });
    } catch (error) {
        const message = error.message || 'Thermophysical comparison failed.';
        const configurationIssue = /not explicitly configured|disabled by policy|not callable|loopback URL/i.test(message);
        res.status(configurationIssue ? 409 : 422).json({ success: false, error: message, reviewRequired: true });
    }
});

/**
 * POST /api/core/thermophysical-provider/r744-transcritical-booster
 * Runs the dedicated preliminary R744 architecture only with explicit pressure controls.
 */
router.post('/thermophysical-provider/r744-transcritical-booster', async (req, res) => {
    try {
        const result = await new CoolPropSidecarClient().calculateR744TranscriticalBoosterCycle(req.body || {});
        res.json({ success: true, result, reviewRequired: true, finalSelectionAllowed: false });
    } catch (error) {
        const message = error.message || 'R744 transcritical booster calculation failed.';
        const configurationIssue = /not explicitly configured|disabled by policy|not callable|loopback URL/i.test(message);
        res.status(configurationIssue ? 409 : 422).json({ success: false, error: message, reviewRequired: true });
    }
});

/**
 * GET /api/core/refrigerants
 * Get list of supported refrigerants
 */
router.get('/refrigerants', (req, res) => {
    try {
        const orch = getOrchestrator();
        const refrigerants = orch.engine.getData('refrigerants');

        res.json({
            success: true,
            refrigerants: Object.keys(refrigerants).map(code => ({
                code: code,
                name: refrigerants[code].name,
                type: refrigerants[code].type,
                gwp: refrigerants[code].gwp
            }))
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/core/products
 * Get list of product categories
 */
router.get('/products', (req, res) => {
    try {
        const orch = getOrchestrator();
        const products = orch.engine.getData('products');

        const categories = {};
        for (const [category, items] of Object.entries(products)) {
            categories[category] = Object.keys(items);
        }

        res.json({
            success: true,
            products: categories
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/core/climate/:city
 * Get climate data for a city
 */
router.get('/climate/:city', (req, res) => {
    try {
        const city = req.params.city;
        const orch = getOrchestrator();
        const climate = orch.engine.getData('climate');

        // Search in all countries
        for (const [country, cities] of Object.entries(climate)) {
            if (cities[city]) {
                return res.json({
                    success: true,
                    city: city,
                    country: country,
                    climate: cities[city]
                });
            }
        }

        // Return default
        res.json({
            success: true,
            city: city,
            country: 'Unknown',
            climate: climate.default
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/core/report
 * Generate professional calculation report
 */
router.post('/report', async (req, res) => {
    try {
        const { results, project, format } = req.body;

        if (!results || !project) {
            return res.status(400).json({
                success: false,
                error: 'Results and project data are required'
            });
        }

        console.log('📄 Generating report...');

        const ReportGenerator = require('../core/reporting/ReportGenerator');
        const HTMLReportFormatter = require('../core/reporting/HTMLReportFormatter');

        const generator = new ReportGenerator();
        const report = generator.generate(results, project);

        if (format === 'html') {
            const formatter = new HTMLReportFormatter();
            const html = formatter.format(report);

            res.setHeader('Content-Type', 'text/html');
            res.send(html);
        } else {
            // Return JSON by default
            res.json({
                success: true,
                report: report
            });
        }

    } catch (error) {
        console.error('❌ Report generation error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
