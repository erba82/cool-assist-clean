// backend/services/AmmoniaDesignWizardService.js
// Complete Ammonia Refrigeration Design Service - Expert System

const { GoogleGenerativeAI } = require("@google/generative-ai");
const OllamaService = require('./OllamaService');
const AIServiceRouter = require('./AIServiceRouter'); // NEW: Add the AI Service Router
const HighPrecisionEngine = require("../services/HighPrecisionEngine");
const RegionResolver = require("../helpers/RegionResolver");
const EnergyOptimizer = require("../services/EnergyOptimizer");
const StandardSelector = require("../services/StandardSelector");
const EquipmentDatabase = require("../data/equipmentDatabase");
const ValveSelectionEngine = require("../services/ValveSelectionEngine");
const AIFlowDiagramEngine = require("../services/AIFlowDiagramEngine");
const { deterministicExtractParameters } = require("./DeterministicParser");

class AmmoniaDesignWizardService {
    constructor() {
        const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
        if (apiKey) {
            this.genAI = new GoogleGenerativeAI(apiKey);
            this.model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        }
        
        // Initialize Ollama as fallback
        this.ollamaService = new OllamaService();
        
        // NEW: Initialize AI Service Router for intelligent model selection
        this.aiServiceRouter = new AIServiceRouter();
        
        this.db = EquipmentDatabase;
        this.aiEngine = new AIFlowDiagramEngine(); // AI-Powered P&ID Engine
        this.requestCache = new Map(); // Simple in-memory cache for determinism
    }

    // =====================================================================
    // Main Process Request
    // =====================================================================
    async processRequest(prompt) {
        try {
            console.log('Processing Request:', prompt.substring(0, 50) + '...');

            // 1. AI extraction of parameters (Cached for Determinism)
            const specs = await this.extractParameters(prompt);

            // 2. High-precision load calculation
            let loads = this.calculateLoads(specs);

            // 2b. Verification & Correction
            loads = this.verifyAndCorrectLoads(loads, specs);

            // 3. Equipment selection (3 tiers) - OLD METHOD KEPT FOR BASE PROPOSAL
            const baseProposals = {
                economic: this.selectEquipment(loads, specs, 'economic'),
                best: this.selectEquipment(loads, specs, 'best'),
                premium: this.selectEquipment(loads, specs, 'premium')
            };

            // 🆕 3b. GFDDE: Generate AI-Optimized Design Variants
            const DesignGenerator = require('./generative/DesignGenerator');
            const mockKG = { rawGraph: { nodes: [], edges: [] } };
            const requirements = {
                cooling_capacity: loads.totalLoad,
                refrigerant: 'R717',
                evap_temp: specs.rooms[0]?.temp || -40,
                cond_temp: 35,
                application: specs.projectInfo.type || 'industrial',
                efficiency_priority: 0.7
            };

            let gfddeVariants = [];
            try {
                console.log('🚀 Generating GFDDE Design Variants...');
                gfddeVariants = await DesignGenerator.generateVariants(requirements, mockKG, 4);
                console.log(`✅ Generated ${gfddeVariants.length} GFDDE variants`);
            } catch (gfddeError) {
                console.warn('⚠️ GFDDE Generation failed:', gfddeError.message);
            }

            // Merge GFDDE variants with base proposals
            const proposals = {
                ...baseProposals,
                gfdde_variants: gfddeVariants // Add as new property
            };

            // 🆕 4. GFDDE P&ID Generation (Using Advanced PID Generator)
            const AdvancedPIDGenerator = require('./generative/AdvancedPIDGenerator');
            let diagram;

            try {
                console.log('🎨 Generating GFDDE P&ID Diagram...');

                // Use best GFDDE variant if available, fallback to proposal
                if (gfddeVariants && gfddeVariants.length > 0) {
                    const bestVariant = gfddeVariants.sort((a, b) => b.rank_score - a.rank_score)[0];
                    console.log(`Using GFDDE variant: ${bestVariant.strategy} (score: ${bestVariant.rank_score.toFixed(1)})`);
                    diagram = await AdvancedPIDGenerator.generateFromVariant(bestVariant, loads, specs);
                } else {
                    console.log('No GFDDE variants, using standard proposal');
                    diagram = AdvancedPIDGenerator.generateFromProposal(proposals.best, loads, specs);
                }

                console.log(`✅ GFDDE P&ID Generated: ${diagram.nodes.length} nodes, ${diagram.edges.length} edges`);
            } catch (pidError) {
                console.error('❌ GFDDE P&ID Generation failed:', pidError.message);
                // Ultimate fallback
                console.warn('⚠️ Using legacy P&ID fallback...');
                try {
                    diagram = await this.aiEngine.generateIntelligentPID(proposals.best, loads, specs);
                } catch {
                    diagram = this.generatePID(proposals.best, loads, specs);
                }
            }

            // 5. Energy optimization
            let optimization = {};
            try {
                optimization = await EnergyOptimizer.optimize(specs.projectInfo, loads, proposals.best);
            } catch (e) {
                console.warn("Energy Optimization failed, using fallback:", e.message);
                optimization = this.getFallbackOptimization(loads, proposals.best);
            }

            // 🆕 6. GFDDE: ASHRAE Compliance Validation
            const ASHRAEValidator = require('./standards/ASHRAEValidator');
            let gfddeCompliance = null;
            try {
                console.log('🔍 Running GFDDE ASHRAE Validation...');
                const designForValidation = {
                    refrigerant: 'R717',
                    charge_kg: proposals.best.totalCharge || 500,
                    room_volume_m3: 5000,
                    system_type: 'direct',
                    components: proposals.best.compressors || []
                };
                const siteInfo = {
                    occupancy_classification: 'industrial',
                    ventilation_cfm: 10000
                };
                const result15 = ASHRAEValidator.validateStandard15(designForValidation, siteInfo);
                const result34 = ASHRAEValidator.validateStandard34('R717');
                gfddeCompliance = { standard15: result15, standard34: result34 };
                console.log(`✅ ASHRAE Validation Complete: ${result15.compliant ? 'PASS' : 'FAIL'}`);
            } catch (validationError) {
                console.warn('⚠️ GFDDE Validation failed:', validationError.message);
            }

            // 6b. OLD Standards compliance (keep for compatibility)
            const standard = StandardSelector.resolveStandards(specs.projectInfo.location);
            const compliance = await StandardSelector.generateComplianceReport(standard, { projectInfo: specs.projectInfo, loads, proposals });

            // Add GFDDE compliance to the response
            if (gfddeCompliance) {
                compliance.gfdde_ashrae = gfddeCompliance;
            }

            return { projectInfo: specs.projectInfo, loads, proposals, diagram, optimization, compliance };
        } catch (error) {
            console.error('AmmoniaDesignWizardService Error:', error);
            throw error;
        }
    }

    // =====================================================================
    // Load Verification & Double-Check
    // =====================================================================
    verifyAndCorrectLoads(loads, specs) {
        console.log('\n=== DOUBLE-CHECK: Load Verification Started ===');

        const BENCHMARKS = {
            'tunnel': { min: 150, max: 400, typical: 250 },
            'blast': { min: 100, max: 300, typical: 180 },
            'storage': { min: 20, max: 80, typical: 40 },
            'chill': { min: 30, max: 100, typical: 50 },
            'precool': { min: 50, max: 150, typical: 80 }
        };

        let correctionsMade = 0;
        let warnings = [];

        specs.rooms.forEach((room, idx) => {
            const roomLoad = loads.rooms.find(r => r.name === room.name);
            if (!roomLoad) return;

            const vol = (room.L || 10) * (room.W || 10) * (room.H || 5);
            const densityCalc = (roomLoad.loadKW * 1000) / vol;

            const benchmark = BENCHMARKS[room.type] || BENCHMARKS.storage;

            // Verification Check 1: Below minimum threshold OR Invalid (Negative/Zero)
            if (densityCalc < benchmark.min || densityCalc <= 0) {
                let ratio = 0;
                if (densityCalc > 0) {
                    ratio = benchmark.min / densityCalc;
                } else {
                    ratio = 999; // Force correction for negative/zero
                }

                if (ratio > 2.0) {
                    const correctedLoad = (benchmark.typical * vol) / 1000;
                    console.log(`  ✓ CORRECTED ${room.name}: ${roomLoad.loadKW.toFixed(2)} → ${correctedLoad.toFixed(2)} kW`);
                    roomLoad.loadKW = correctedLoad;
                    roomLoad.notes = `Load corrected to industry standard ${benchmark.typical} W/m³`;
                    correctionsMade++;
                }
            }
        });

        // Re-sum totals after corrections
        loads.total.booster = loads.rooms
            .filter(r => r.temp <= -25)
            .reduce((sum, r) => sum + r.loadKW, 0);

        loads.total.highStage = loads.rooms
            .reduce((sum, r) => sum + r.loadKW, 0);

        return loads;
    }

    // =====================================================================
    // Fallback Optimization
    // =====================================================================
    getFallbackOptimization(loads, equipment) {
        const totalKW = loads.total.highStage;
        const savings = totalKW * 0.15;

        return {
            baselinePowerKW: totalKW / 3.5,
            optimizedPowerKW: (totalKW / 3.5) * 0.85,
            totalSavingsKW: (savings / 3.5).toFixed(1),
            annualSavingsUSD: ((savings / 3.5) * 0.12 * 6000).toFixed(0),
            measures: [
                {
                    title: "Floating Head Pressure",
                    description: "Reduce condensing pressure during cooler ambient conditions.",
                    savingsKW: (savings * 0.6 / 3.5).toFixed(1),
                    roiMonths: 8
                },
                {
                    title: "VFD on Compressors",
                    description: "Match compressor speed to actual load.",
                    savingsKW: (savings * 0.4 / 3.5).toFixed(1),
                    roiMonths: 14
                }
            ]
        };
    }

    // =====================================================================
    // AI Parameter Extraction (Deterministic & Enhanced)
    // =====================================================================
    async extractParameters(prompt) {
        // 1. Check Cache for Determinism
        const cacheKey = prompt.trim();
        if (this.requestCache.has(cacheKey)) {
            console.log('⚡ Using Cached AI Parameters for Determinism');
            return JSON.parse(JSON.stringify(this.requestCache.get(cacheKey)));
        }

        // If AI model not available, try Ollama as fallback, otherwise use deterministic parsing
        if (!this.model) {
            console.warn('⚠️ Google AI Model not initialized - trying Ollama as fallback');
            if (this.ollamaService && this.ollamaService.available) {
                console.log('🔄 Using Ollama for parameter extraction');
                return await this.extractParametersWithOllama(prompt);
            } else {
                console.warn('⚠️ Ollama not available - using deterministic parsing');
                return deterministicExtractParameters(prompt);
            }
        }

        const ProductProps = require('../data/ProductProperties');

        const instruction = `
You are an expert industrial refrigeration engineer analyzing a project requirement.
Extract ALL details with EXTREME PRECISION and CONSISTENCY.

**CRITICAL RULES FOR CONSISTENCY:**
1. ALWAYS translate to English
2. Use EXACT same room names for same descriptions
3. Use STANDARD dimensions if not specified (provide realistic industrial sizes)
4. Use STANDARD processing parameters from refrigeration engineering handbooks

**Product Type Detection (Persian to English):**
- "گوشت" / "گوسفند" → lamb
- "گاو" → beef  
- "مرغ" / "پرنده" → poultry
- "ماهی" → fish
- "میگو" → shrimp
- "شیر" → milk
- "سیب" → apples
- "سیب زمینی" → potatoes

**Room Type Detection (Persian to English):**
- "تونل انجماد" / "تونل فریز" → tunnel (blast freezing)
- "سردخانه انجماد" → blast (blast freezing room)
- "سردخانه نگهداری" / "سردخانه" → storage (cold storage)
- "کارگاه برش" / "سالن قصابی" → chill (cutting/processing room)
- "سالن کشتار" → precool (slaughter hall)

**Standard Dimensions (if not specified):**
- Tunnel: 25m L × 6m W × 4m H
- Blast Room: 15m × 10m × 5m
- Storage: 30m × 20m × 6m
- Chill Room: 20m × 10m × 4m

**Standard Daily Capacity (if not specified):**
- Slaughterhouse tunnel: 20,000 kg/day per tunnel
- Storage: Based on volume × 300 kg/m³

**Temperature Standards:**
- Deep freeze tunnel: -40°C
- Blast freezing: -35°C
- Frozen storage: -25°C to -18°C
- Chill storage: 0°C to +4°C
- Processing room: +8°C to +12°C

**IMPORTANT: MASS & COUNT EXTRACTION RULES**
1. **"4 tunnels with 20 tons capacity"** -> This usually means 20 tons **TOTAL** unless "each" is specified.
   - However, for safety in industrial design, if ambiguous, assume **PER ROOM** to avoid undersizing.
   - BETTER RULE: Look for keywords "Total" (کل) vs "Each" (هر کدام).
   - If user says "4 tunnels, 20 tons", assume **20,000 kg PER TUNNEL** (Total 80 tons).
   - If user says "4 tunnels, 20 tons total", assume **5,000 kg PER TUNNEL**.
   - **DEFAULT TO "PER ROOM" IF AMBIGUOUS.**

2. **Extract "mass" as the daily throughput PER SINGLE ROOM.**
   - Example: "4 tunnels, 20 tons each" -> mass: 20000
   - Example: "4 tunnels, 20 tons" -> mass: 20000 (Assume each)
   - Example: "4 tunnels, 80 tons total" -> mass: 20000

Output COMPLETE JSON with ALL fields:
{
    "projectInfo": {
        "name": "Project Name in English",
        "location": "City, Country in English",
        "ambientTemp": number (design temp for region: Iran=35, Europe=30, etc),
        "elevation": 0,
        "climate": "hot/moderate/cold"
    },
    "rooms": [
        {
            "name": "Room Name in English",
            "count": number (how many identical rooms),
            "type": "tunnel/blast/storage/chill/precool",
            "L": number (meters),
            "W": number (meters),
            "H": number (meters),
            "temp": number (°C, exact operating temperature),
            "product": {
                "type": "beef/lamb/poultry/fish/shrimp/milk/cheese/apples/potatoes/mixed",
                "mass": number (kg/day throughput PER ROOM),
                "entryTemp": number (°C, realistic entry temp),
                "targetTemp": number (°C, = room temp),
                "time": number (hours for complete process)
            }
        }
    ]
}

**IMPORTANT:** Be CONSISTENT - same input MUST produce same output!`;

        const result = await this.model.generateContent(
            instruction + "\n\nUser Request:\n" + prompt,
            {
                generationConfig: {
                    temperature: 0,  // DETERMINISTIC!
                    topP: 1,
                    topK: 1
                }
            }
        );

        const text = result.response.text().replace(/```json|```/g, "").trim();
        console.log("🔍 AI Extracted Specs:", text); // Log for debugging
        let specs = JSON.parse(text);

        // Sort rooms by name to ensure deterministic order
        specs.rooms.sort((a, b) => a.name.localeCompare(b.name));

        // Enhance with ProductProperties database
        specs.rooms = specs.rooms.map(room => {
            const productProps = ProductProps.getProductProperties(room.product.type);

            if (!room.product.entryTemp) {
                room.product.entryTemp = productProps.entryTemp;
            }
            if (!room.product.time) {
                room.product.time = ProductProps.getProcessingTime(
                    room.product.type,
                    room.product.entryTemp,
                    room.temp,
                    room.type
                );
            }

            room.product.properties = {
                freezingPoint: productProps.freezingPoint,
                specificHeatAbove: productProps.specificHeatAbove,
                specificHeatBelow: productProps.specificHeatBelow,
                latentHeat: productProps.latentHeat,
                density: productProps.density,
                respiration: productProps.respiration
            };

            return room;
        });

        // Store in Cache
        this.requestCache.set(cacheKey, specs);

        return specs;
    }

    // =====================================================================
    // AI Parameter Extraction with Ollama
    // =====================================================================
    async extractParametersWithOllama(prompt) {
        // Check Cache for Determinism
        const cacheKey = prompt.trim();
        if (this.requestCache.has(cacheKey)) {
            console.log('⚡ Using Cached Ollama Parameters for Determinism');
            return JSON.parse(JSON.stringify(this.requestCache.get(cacheKey)));
        }

        const ProductProps = require('../data/ProductProperties');

        const instruction = `
You are an expert industrial refrigeration engineer analyzing a project requirement.
Extract ALL details with EXTREME PRECISION and CONSISTENCY.

**CRITICAL RULES FOR CONSISTENCY:**
1. ALWAYS translate to English
2. Use EXACT same room names for same descriptions
3. Use STANDARD dimensions if not specified (provide realistic industrial sizes)
4. Use STANDARD processing parameters from refrigeration engineering handbooks

**Product Type Detection (Persian to English):**
- "گوشت" / "گوسفند" → lamb
- "گاو" → beef  
- "مرغ" / "پرنده" → poultry
- "ماهی" → fish
- "میگو" → shrimp
- "شیر" → milk
- "سیب" → apples
- "سیب زمینی" → potatoes

**Room Type Detection (Persian to English):**
- "تونل انجماد" / "تونل فریز" → tunnel (blast freezing)
- "سردخانه انجماد" → blast (blast freezing room)
- "سردخانه نگهداری" / "سردخانه" → storage (cold storage)
- "کارگاه برش" / "سالن قصابی" → chill (cutting/processing room)
- "سالن کشتار" → precool (slaughter hall)

**Standard Dimensions (if not specified):**
- Tunnel: 25m L × 6m W × 4m H
- Blast Room: 15m × 10m × 5m
- Storage: 30m × 20m × 6m
- Chill Room: 20m × 10m × 4m

**Standard Daily Capacity (if not specified):**
- Slaughterhouse tunnel: 20,000 kg/day per tunnel
- Storage: Based on volume × 300 kg/m³

**Temperature Standards:**
- Deep freeze tunnel: -40°C
- Blast freezing: -35°C
- Frozen storage: -25°C to -18°C
- Chill storage: 0°C to +4°C
- Processing room: +8°C to +12°C

**IMPORTANT: MASS & COUNT EXTRACTION RULES**
1. **"4 tunnels with 20 tons capacity"** -> This usually means 20 tons **TOTAL** unless "each" is specified.
   - However, for safety in industrial design, if ambiguous, assume **PER ROOM** to avoid undersizing.
   - BETTER RULE: Look for keywords "Total" (کل) vs "Each" (هر کدام).
   - If user says "4 tunnels, 20 tons", assume **20,000 kg PER TUNNEL** (Total 80 tons).
   - If user says "4 tunnels, 20 tons total", assume **5,000 kg PER TUNNEL**.
   - **DEFAULT TO "PER ROOM" IF AMBIGUOUS.**

2. **Extract "mass" as the daily throughput PER SINGLE ROOM.**
   - Example: "4 tunnels, 20 tons each" -> mass: 20000
   - Example: "4 tunnels, 20 tons" -> mass: 20000 (Assume each)
   - Example: "4 tunnels, 80 tons total" -> mass: 20000

Output COMPLETE JSON with ALL fields:
{
    "projectInfo": {
        "name": "Project Name in English",
        "location": "City, Country in English",
        "ambientTemp": number (design temp for region: Iran=35, Europe=30, etc),
        "elevation": 0,
        "climate": "hot/moderate/cold"
    },
    "rooms": [
        {
            "name": "Room Name in English",
            "count": number (how many identical rooms),
            "type": "tunnel/blast/storage/chill/precool",
            "L": number (meters),
            "W": number (meters),
            "H": number (meters),
            "temp": number (°C, exact operating temperature),
            "product": {
                "type": "beef/lamb/poultry/fish/shrimp/milk/cheese/apples/potatoes/mixed",
                "mass": number (kg/day throughput PER ROOM),
                "entryTemp": number (°C, realistic entry temp),
                "targetTemp": number (°C, = room temp),
                "time": number (hours for complete process)
            }
        }
    ]
}

**IMPORTANT:** Be CONSISTENT - same input MUST produce same output!

User Request:
` + prompt;

        try {
            // NEW: Use AI Service Router with parsing task type for intelligent model selection
            const result = await this.aiServiceRouter.chat(instruction, 'parsing');
            
            if (!result.success) {
                console.error('❌ Ollama extraction failed:', result.error);
                return deterministicExtractParameters(prompt);
            }
            
            let responseText = result.message;
            
            // Extract JSON from response if it contains code
            if (responseText.includes('{')) {
                const jsonMatch = responseText.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    responseText = jsonMatch[0];
                }
            }
            
            console.log("🔍 Ollama Extracted Specs:", responseText); // Log for debugging
            let specs = JSON.parse(responseText);

            // Sort rooms by name to ensure deterministic order
            specs.rooms.sort((a, b) => a.name.localeCompare(b.name));

            // Enhance with ProductProperties database
            specs.rooms = specs.rooms.map(room => {
                const productProps = ProductProps.getProductProperties(room.product.type);

                if (!room.product.entryTemp) {
                    room.product.entryTemp = productProps.entryTemp;
                }
                if (!room.product.time) {
                    room.product.time = ProductProps.getProcessingTime(
                        room.product.type,
                        room.product.entryTemp,
                        room.temp,
                        room.type
                    );
                }

                room.product.properties = {
                    freezingPoint: productProps.freezingPoint,
                    specificHeatAbove: productProps.specificHeatAbove,
                    specificHeatBelow: productProps.specificHeatBelow,
                    latentHeat: productProps.latentHeat,
                    density: productProps.density,
                    respiration: productProps.respiration
                };

                return room;
            });

            // Store in Cache
            this.requestCache.set(cacheKey, specs);

            return specs;
        } catch (error) {
            console.error('❌ Ollama parameter extraction error:', error.message);
            // Fallback to deterministic parsing
            return deterministicExtractParameters(prompt);
        }
    }

    // =====================================================================
    // Load Calculations
    // =====================================================================
    calculateLoads(specs) {
        const ambientTemp = specs.projectInfo.ambientTemp || 30;
        const roomLoads = [];
        let totalBooster = 0;
        let totalHighStage = 0;

        specs.rooms.forEach(room => {
            const count = room.count || 1;

            const loadBreakdown = HighPrecisionEngine.calculateRoomLoad(room, ambientTemp);

            const requiresBooster = room.temp <= -25;
            const stage = requiresBooster ? 'Booster' : 'High Stage';

            const loadPerRoom = loadBreakdown.totalLoad;
            const totalLoadForRooms = loadPerRoom * count;

            if (requiresBooster) {
                totalBooster += totalLoadForRooms;
            } else {
                totalHighStage += totalLoadForRooms;
            }

            const evapSelection = this.selectEvaporatorsForRoom(room, loadPerRoom);

            roomLoads.push({
                ...room,
                stage,
                loadBreakdown,
                loadKW: parseFloat(loadPerRoom.toFixed(2)),
                totalKW: parseFloat(totalLoadForRooms.toFixed(2)),
                evapSelection,
                temp: room.temp
            });
        });

        if (totalBooster > 0) {
            totalHighStage += totalBooster * 1.3;
        }

        return {
            rooms: roomLoads,
            total: {
                booster: parseFloat(totalBooster.toFixed(2)),
                highStage: parseFloat(totalHighStage.toFixed(2))
            }
        };
    }

    // =====================================================================
    // Evaporator Selection
    // =====================================================================
    selectEvaporatorsForRoom(room, loadKW) {
        const { L, W, temp } = room;
        const floorArea = L * W;

        const tempKey = temp <= -35 ? 'capacity_40C' : temp <= -25 ? 'capacity_30C' : 'capacity_25C';

        // Sort by capacity descending + model name for determinism
        const suitableEvaps = this.db.evaporators
            .filter(evap => {
                const capacity = evap[tempKey] || evap.capacity_30C;
                return capacity >= 15 && capacity <= loadKW * 1.5;
            })
            .sort((a, b) => {
                const capA = a[tempKey] || a.capacity_30C;
                const capB = b[tempKey] || b.capacity_30C;
                return (capB - capA) || a.model.localeCompare(b.model);
            });

        let selectedEvap = suitableEvaps[0];
        if (!selectedEvap) {
            selectedEvap = this.db.evaporators[0]; // Fallback
        }

        const evapCapacity = selectedEvap[tempKey] || selectedEvap.capacity_30C;

        // Calculate Qty
        const areaPerUnit = temp <= -15 ? 50 : 80;
        let qtyByArea = Math.ceil(floorArea / areaPerUnit);
        const qtyByLoad = Math.ceil(loadKW / evapCapacity);
        const qty = Math.max(qtyByArea, qtyByLoad);

        return {
            manufacturer: selectedEvap.manufacturer,
            model: selectedEvap.model,
            qty,
            capacityPerUnit: parseFloat(evapCapacity.toFixed(1)),
            fanPower: selectedEvap.fan_power || 1.5,
            fans: selectedEvap.fans || 2,
            fanDiameter: selectedEvap.fan_diameter || 630, // Default if missing
            totalPrice: selectedEvap.price_usd * qty
        };
    }

    // =====================================================================
    // Equipment Selection
    // =====================================================================
    selectEquipment(loads, specs, tier) {
        const selection = {
            compressors: [],
            condenser: null,
            vessels: [],
            pumps: [],
            evaporators: [],
            totalPrice: 0
        };

        let totalPrice = 0;

        // ----- BOOSTER COMPRESSORS -----
        if (loads.total.booster > 0) {
            const boosterSelection = this.selectCompressors(loads.total.booster, -40, 30, tier, 'Booster');
            selection.compressors.push(...boosterSelection.compressors);
            totalPrice += boosterSelection.price;

            // LPS Vessel
            const lpsVolume = Math.max(1000, loads.total.booster * 15);
            selection.vessels.push({
                tag: 'LPS-40',
                type: 'Surge Drum',
                subtype: 'Low Pressure Receiver',
                volume: lpsVolume,
                temperature: -40,
                price: Math.round(lpsVolume * 8)
            });
            totalPrice += lpsVolume * 8;

            // Ammonia Pumps (Booster Circuit)
            // Rule: Max 50 m3/h per pump, N+1 redundancy
            const pumpFlow = loads.total.booster * 0.25; // ~4:1 ratio
            const maxFlowPerPump = 50;
            const numPumps = Math.ceil(pumpFlow / maxFlowPerPump);
            const redundancy = 1; // N+1
            const totalPumps = numPumps + redundancy;
            const flowPerPump = pumpFlow / numPumps;

            const selectedPump = this.db.pumps.find(p => p.flow_max >= flowPerPump) || this.db.pumps[this.db.pumps.length - 1];

            for (let i = 0; i < totalPumps; i++) {
                selection.pumps.push({
                    tag: `P-B-${i + 1}`,
                    circuit: 'Booster',
                    ...selectedPump,
                    duty: i < numPumps ? 'Duty' : 'Standby'
                });
                totalPrice += selectedPump.price_usd;
            }
        }

        // ----- HIGH STAGE COMPRESSORS -----
        const highStageSelection = this.selectCompressors(loads.total.highStage, -10, 30, tier, 'High Stage');
        selection.compressors.push(...highStageSelection.compressors);
        totalPrice += highStageSelection.price;

        // ----- INTERCOOLER / MTS -----
        const mtsVolume = Math.max(800, loads.total.highStage * 12);
        selection.vessels.push({
            tag: 'MTS-10',
            type: 'Intercooler',
            subtype: 'Vertical Separator',
            volume: mtsVolume,
            temperature: -10,
            price: Math.round(mtsVolume * 10)
        });
        totalPrice += mtsVolume * 10;

        // ----- CONDENSER -----
        const heatRejection = loads.total.highStage * 1.25;
        const selectedCond = this.db.condensers
            .filter(c => c.capacity >= heatRejection)
            .sort((a, b) => (a.capacity - b.capacity) || a.model.localeCompare(b.model))[0]
            || this.db.condensers[this.db.condensers.length - 1];

        selection.condenser = {
            manufacturer: selectedCond.manufacturer,
            model: selectedCond.model,
            type: selectedCond.type,
            capacity: selectedCond.capacity,
            fans: selectedCond.fans || 2,
            fanPower: selectedCond.fan_power || 5.5,
            price: selectedCond.price_usd
        };
        totalPrice += selectedCond.price_usd;

        // ----- HIGH PRESSURE RECEIVER -----
        const hprVolume = Math.max(500, loads.total.highStage * 8);
        selection.vessels.push({
            tag: 'HPR',
            type: 'High Pressure Receiver',
            subtype: 'Horizontal Vessel',
            volume: hprVolume,
            temperature: 40,
            price: Math.round(hprVolume * 12)
        });
        totalPrice += hprVolume * 12;

        // ----- EVAPORATORS (Aggregated) -----
        loads.rooms.forEach(room => {
            if (room.evapSelection) {
                selection.evaporators.push({
                    roomName: room.name,
                    count: room.count,
                    ...room.evapSelection
                });
                totalPrice += room.evapSelection.totalPrice * room.count;
            }
        });

        selection.totalPrice = Math.round(totalPrice);
        return selection;
    }

    // =====================================================================
    // Compressor Selection Helper
    // =====================================================================
    selectCompressors(loadKW, evapTemp, condTemp, tier, stage) {
        const compressors = [];
        let totalPrice = 0;

        const tempKey = evapTemp <= -35 ? 'capacity_40C' : evapTemp <= -25 ? 'capacity_30C' : 'capacity_10C';
        const powerKey = evapTemp <= -35 ? 'power_40C' : 'power_10C';

        let candidateComps = this.db.compressors;
        if (tier === 'economic') {
            candidateComps = candidateComps.filter(c => c.type === 'Reciprocating' || c.price_usd < 40000);
        } else if (tier === 'premium') {
            candidateComps = candidateComps.filter(c => c.type === 'Screw' && (c.manufacturer === 'Mycom' || c.manufacturer === 'Howden'));
        }

        // Deterministic Sort: Capacity DESC, then Model Name ASC
        candidateComps.sort((a, b) => {
            const capA = a[tempKey] || 0;
            const capB = b[tempKey] || 0;
            return (capB - capA) || a.model.localeCompare(b.model);
        });

        let remainingLoad = loadKW;
        let compIndex = 0;

        while (remainingLoad > 0 && compIndex < candidateComps.length) {
            const comp = candidateComps[compIndex];
            const compCapacity = comp[tempKey] || comp.capacity_10C;

            if (compCapacity <= 0) {
                compIndex++;
                continue;
            }

            compressors.push({
                tag: `CMP-${stage === 'Booster' ? 'B' : 'H'}-${compressors.length + 1}`,
                manufacturer: comp.manufacturer,
                model: comp.model,
                type: comp.type,
                capacity: compCapacity, // Nominal at rating point
                capacityAtConditions: compCapacity, // For now same, could adjust
                power: comp[powerKey] || comp.power_10C,
                cop: (compCapacity / (comp[powerKey] || 1)).toFixed(2),
                price: comp.price_usd,
                stage
            });

            totalPrice += comp.price_usd;
            remainingLoad -= compCapacity;

            if (remainingLoad > 0 && compIndex === 0) {
                // Continue with same compressor
            } else {
                compIndex++;
            }

            if (compressors.length >= 6) break;
        }

        // N+1 redundancy for premium
        if (tier === 'premium' && compressors.length > 0) {
            const spareComp = { ...compressors[0] };
            spareComp.tag = `${spareComp.tag}-SPARE`;
            compressors.push(spareComp);
            totalPrice += spareComp.price;
        }

        return { compressors, price: totalPrice };
    }

    // =====================================================================
    // Pipe Sizing Helper (ASHRAE Guidelines)
    // =====================================================================
    calculatePipeSize(flowKW, refrigerantState) {
        // Rough estimation based on capacity
        // Liquid: 1.5 m/s, Suction: 12 m/s, Discharge: 18 m/s
        // Using simplified correlation: DN ≈ sqrt(kW) * factor

        let factor = 8; // Default
        if (refrigerantState === 'liquid') factor = 6;
        else if (refrigerantState === 'suction') factor = 9;
        else if (refrigerantState === 'discharge') factor = 7;

        const dn = Math.ceil(Math.sqrt(flowKW) * factor / 5) * 5; // Round to nearest 5

        // Clamp to standard sizes
        const standardSizes = [25, 32, 40, 50, 65, 80, 100, 125, 150, 200, 250];
        return standardSizes.find(s => s >= dn) || standardSizes[standardSizes.length - 1];
    }

    // =====================================================================
    // Enhanced P&ID Generation with Detailed Valve Stations
    // =====================================================================
    generatePID(equipment, loads, specs) {
        const nodes = [];
        const edges = [];
        let idCounter = 0;

        // Layout Configuration
        const LAYER_Y = {
            condenser: 80,
            hpr: 220,
            icf_high: 320,
            mts: 450,
            highStageComps: 600,
            icf_low: 750,
            lps: 900,
            boosterComps: 1050,
            pumps: 1200,
            evapValves: 1400,
            evaporators: 1550
        };

        const addNode = (id, type, x, y, label, data = {}) => {
            nodes.push({
                id,
                type: 'industrial',
                position: { x, y },
                data: { label, componentType: type, tag: id, ...data }
            });
        };

        const addEdge = (source, target, label, type = 'liquid', pipeSize = null) => {
            const labelText = pipeSize ? `${label} DN${pipeSize}` : label;
            edges.push({
                id: `e${idCounter++}`,
                source,
                target,
                label: labelText,
                type: type,
                animated: type === 'liquid',
                style: {
                    stroke: type === 'suction' ? '#2196F3' :
                        type === 'discharge' ? '#f44336' :
                            '#4CAF50',
                    strokeWidth: Math.max(2, (pipeSize || 50) / 30)
                }
            });
        };

        // Calculate center X for balanced layout
        const totalEquipmentWidth = Math.max(
            equipment.compressors.filter(c => c.stage === 'High Stage').length * 180,
            equipment.compressors.filter(c => c.stage === 'Booster').length * 180,
            loads.rooms.length * 200
        );
        const centerX = totalEquipmentWidth / 2;

        // ================================================================
        // HIGH SIDE - Condenser & HPR
        // ================================================================
        const condDN = this.calculatePipeSize(loads.total.highStage, 'discharge');
        addNode("COND", "evaporative_condenser", centerX + 200, LAYER_Y.condenser,
            `${equipment.condenser.manufacturer} ${equipment.condenser.model}`,
            { capacity: equipment.condenser.capacity, fans: equipment.condenser.fans });

        addNode("HPR", "receiver", centerX + 200, LAYER_Y.hpr, "HP Receiver",
            { volume: equipment.vessels.find(v => v.tag === 'HPR')?.volume || 500 });

        const liquidDN = this.calculatePipeSize(loads.total.highStage, 'liquid');
        addEdge("COND", "HPR", "Liquid", "liquid", liquidDN);

        // ================================================================
        // INTERMEDIATE STAGE - MTS & Expansion
        // ================================================================
        addNode("MTS", "separator", centerX, LAYER_Y.mts, "Intercooler -10°C",
            { volume: equipment.vessels.find(v => v.tag === 'MTS-10')?.volume || 800 });

        // ICF Station for MTS
        addNode("ICF-MTS", "valve_station", centerX + 100, LAYER_Y.icf_high, "ICF to MTS");
        addEdge("HPR", "ICF-MTS", "Liquid", "liquid", liquidDN);
        addEdge("ICF-MTS", "MTS", "Expansion", "liquid", Math.ceil(liquidDN * 0.8));

        // ================================================================
        // LOW SIDE - LPS, Pumps (if Booster exists)
        // ================================================================
        if (loads.total.booster > 0) {
            const boosterLiquidDN = this.calculatePipeSize(loads.total.booster, 'liquid');

            addNode("LPS", "separator", centerX - 300, LAYER_Y.lps, "LPS -40°C",
                { volume: equipment.vessels.find(v => v.tag === 'LPS-40')?.volume || 1000 });

            // ICF to LPS
            addNode("ICF-LPS", "valve_station", centerX - 150, LAYER_Y.icf_low, "ICF to LPS");
            addEdge("MTS", "ICF-LPS", "Liquid", "liquid", boosterLiquidDN);
            addEdge("ICF-LPS", "LPS", "Expansion", "liquid", Math.ceil(boosterLiquidDN * 0.8));

            // Ammonia Pumps
            const boosterPumps = equipment.pumps.filter(p => p.circuit === 'Booster');
            boosterPumps.forEach((p, i) => {
                const pumpX = centerX - 400 + i * 120;
                addNode(p.tag, "ammonia_pump", pumpX, LAYER_Y.pumps,
                    `${p.manufacturer} ${p.model}`,
                    { duty: p.duty, flow: p.flow_max });
                addEdge("LPS", p.tag, "Suction", "liquid", 65);
            });
        }

        // ================================================================
        // COMPRESSORS - High Stage
        // ================================================================
        const highStageComps = equipment.compressors.filter(c => c.stage === 'High Stage');
        const highStageSuctionDN = this.calculatePipeSize(loads.total.highStage, 'suction');
        const highStageDischargeDN = this.calculatePipeSize(loads.total.highStage, 'discharge');

        highStageComps.forEach((c, i) => {
            const compX = centerX - (highStageComps.length - 1) * 90 + i * 180;
            const compType = c.type === 'Screw' ? "screw_compressor" : "reciprocating_compressor";
            addNode(c.tag, compType, compX, LAYER_Y.highStageComps,
                `${c.manufacturer} ${c.model}`,
                { capacity: c.capacity, power: c.power, cop: c.cop });

            addEdge("MTS", c.tag, "Suction", "suction", highStageSuctionDN);
            addEdge(c.tag, "COND", "Discharge", "discharge", highStageDischargeDN);
        });

        // ================================================================
        // COMPRESSORS - Booster Stage
        // ================================================================
        if (loads.total.booster > 0) {
            const boosterComps = equipment.compressors.filter(c => c.stage === 'Booster');
            const boosterSuctionDN = this.calculatePipeSize(loads.total.booster, 'suction');
            const boosterDischargeDN = this.calculatePipeSize(loads.total.booster, 'discharge');

            boosterComps.forEach((c, i) => {
                const compX = centerX - 400 + i * 180;
                const compType = c.type === 'Screw' ? "screw_compressor" : "reciprocating_compressor";
                addNode(c.tag, compType, compX, LAYER_Y.boosterComps,
                    `${c.manufacturer} ${c.model}`,
                    { capacity: c.capacity, power: c.power, cop: c.cop });

                addEdge("LPS", c.tag, "Suction", "suction", boosterSuctionDN);
                addEdge(c.tag, "MTS", "Discharge", "discharge", boosterDischargeDN);
            });
        }

        // ================================================================
        // EVAPORATORS with DETAILED VALVE STATIONS
        // ================================================================
        const uniqueRooms = [...new Set(loads.rooms.map(r => r.name))];
        uniqueRooms.forEach((roomName, i) => {
            const room = loads.rooms.find(r => r.name === roomName);
            if (!room || !room.evapSelection) return;

            const evap = room.evapSelection;
            const isBooster = room.temp <= -25;
            const evapX = centerX - (uniqueRooms.length - 1) * 100 + i * 200;

            // Calculate pipe size for this evaporator
            const evapLoadKW = room.loadKW;
            const feedDN = this.calculatePipeSize(evapLoadKW, 'liquid');
            const suctionDN = this.calculatePipeSize(evapLoadKW, 'suction');

            // EVAPORATOR NODE
            const evapId = `EVAP-${roomName.replace(/\s+/g, '-')}`;
            addNode(evapId, "evaporator", evapX, LAYER_Y.evaporators,
                `${evap.manufacturer} ${evap.model}`,
                {
                    qty: evap.qty * room.count,
                    capacity: evap.capacityPerUnit,
                    fans: evap.fans,
                    fanDiameter: evap.fanDiameter,
                    roomTemp: room.temp
                });

            // ========== INTELLIGENT DANFOSS VALVE SELECTION ==========
            const valveStation = ValveSelectionEngine.selectCompleteValveStation(
                evapLoadKW,
                room.temp,
                feedDN,
                {
                    expansionType: room.temp <= -35 ? 'electronic' : 'automatic',
                    circulationRate: isBooster ? 3 : 4,
                    deltaP: 0.2,
                    systemPressure: isBooster ? 3 : 5
                }
            );

            // ========== DETAILED VALVE STATION COMPONENTS (Danfoss) ==========
            const strainerId = `STR-${evapId}`;
            const solenoidId = `SOV-${evapId}`;
            const expansionId = `EXV-${evapId}`;
            const checkId = `CHK-${evapId}`;

            // 1. STRAINER
            addNode(strainerId, "strainer", evapX - 90, LAYER_Y.evapValves - 80,
                `${valveStation.strainer.model}`,
                {
                    size: `DN${valveStation.strainer.size_dn}`,
                    meshSize: `${valveStation.strainer.meshSize_micron} μm`,
                    price: `$${valveStation.strainer.price_usd}`
                });

            // 2. SOLENOID VALVE (Danfoss EVRA)
            addNode(solenoidId, "solenoid_valve", evapX - 60, LAYER_Y.evapValves - 40,
                `${valveStation.solenoidValve.series} ${valveStation.solenoidValve.model}`,
                {
                    size: `DN${valveStation.solenoidValve.size_dn}`,
                    capacity: `${valveStation.solenoidValve.maxFlowCapacity_kW} kW`,
                    voltage: '24V DC',
                    price: `$${valveStation.solenoidValve.price_usd}`
                });

            // 3. EXPANSION VALVE (Danfoss AKV or ETS)
            const expValve = valveStation.expansionValve;
            addNode(expansionId, "expansion_valve", evapX - 30, LAYER_Y.evapValves,
                `${expValve.series} ${expValve.model}`,
                {
                    size: `DN${expValve.size_dn}`,
                    type: expValve.valveType,
                    capacity: `${expValve.capacity_kW_at_minus10C || expValve.capacity_kW_at_5C} kW`,
                    price: `$${expValve.price_usd}`
                });

            // 4. CHECK VALVE (Danfoss NRV)
            addNode(checkId, "check_valve", evapX, LAYER_Y.evapValves + 40,
                `${valveStation.checkValve.series} ${valveStation.checkValve.model}`,
                {
                    size: `DN${valveStation.checkValve.size_dn}`,
                    price: `$${valveStation.checkValve.price_usd}`
                });

            // Connect feed source to valve station
            if (isBooster && loads.total.booster > 0) {
                const pumpId = equipment.pumps.find(p => p.circuit === 'Booster')?.tag || "LPS";
                addEdge(pumpId, strainerId, "Liquid Feed", "liquid", feedDN);
            } else {
                addEdge("MTS", strainerId, "Liquid Feed", "liquid", feedDN);
            }

            // Valve station internal connections
            addEdge(strainerId, solenoidId, "", "liquid", feedDN);
            addEdge(solenoidId, expansionId, "", "liquid", feedDN);
            addEdge(expansionId, checkId, "Throttled", "liquid", Math.ceil(feedDN * 0.7));
            addEdge(checkId, evapId, "To Evap", "liquid", Math.ceil(feedDN * 0.7));

            // Suction return
            addEdge(evapId, isBooster ? "LPS" : "MTS", "Suction Return", "suction", suctionDN);

            // Store valve details in room data for equipment list
            if (!room.valveStation) {
                room.valveStation = {
                    strainer: valveStation.strainer,
                    solenoid: valveStation.solenoidValve,
                    expansion: valveStation.expansionValve,
                    check: valveStation.checkValve,
                    totalPrice: (valveStation.strainer.price_usd || 0) +
                        (valveStation.solenoidValve.price_usd || 0) +
                        (valveStation.expansionValve.price_usd || 0) +
                        (valveStation.checkValve.price_usd || 0)
                };
            }
        });

        return { initialNodes: nodes, initialEdges: edges };
    }
}

module.exports = new AmmoniaDesignWizardService();
