const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { GoogleGenerativeAI } = require("@google/generative-ai");

class IntelligentDesignService {
    constructor() {
        const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
        if (apiKey) {
            const genAI = new GoogleGenerativeAI(apiKey);
            this.model = genAI.getGenerativeModel({ 
                model: "gemini-2.0-flash",
                systemInstruction: `You are a Senior Refrigeration Engineer. 
                Extract project details from user text into JSON. 
                Identify room types: 'Blast Freezer' (-40C), 'Holding Store' (-18 to -25C), 'Chilling Room' (0 to 4C), 'Pre-Cooling'.
                Pay attention to QUANTITY of rooms.` 
            });
        }
        
        // دیتابیس تجهیزات واقعی
        this.equipmentDB = {
            compressors: [
                { model: "Mycom 200J-L", type: "Screw", capacity_40: 180, capacity_10: 450, price: 45000 },
                { model: "Mycom 250J-L", type: "Screw", capacity_40: 280, capacity_10: 680, price: 65000 },
                { model: "Howden XRV 163", type: "Screw", capacity_40: 150, capacity_10: 380, price: 42000 },
                { model: "Howden XRV 204", type: "Screw", capacity_40: 290, capacity_10: 720, price: 68000 },
                { model: "Grasso SP1", type: "Reciprocating", capacity_40: 80, capacity_10: 200, price: 25000 }
            ],
            condensers: [
                { model: "Baltimore VXC 205", type: "Evaporative", capacity: 800, price: 35000 },
                { model: "Baltimore VXC 357", type: "Evaporative", capacity: 1400, price: 55000 },
                { model: "Baltimore VXC 560", type: "Evaporative", capacity: 2200, price: 80000 }
            ],
            evaporators: [
                { model: "Guntner S-AGHN 080", capacity: 50, type: "Floor Mounted", price: 8000 },
                { model: "Guntner GGHN 050", capacity: 25, type: "Ceiling", price: 4500 }
            ]
        };
    }

    async processDesignRequest(userPrompt) {
        console.log("🚀 Processing Design Request...");

        // 1. استخراج دقیق با AI
        const specs = await this.extractParametersWithAI(userPrompt);
        
        // 2. محاسبات بار دقیق
        const calculations = this.performDetailedCalculations(specs);
        
        // 3. انتخاب تجهیزات از دیتابیس
        const equipment = this.selectEquipmentFromDB(calculations);
        
        // 4. تولید نقشه P&ID با سایزینگ
        const diagram = this.generateDetailedPID(equipment, calculations);

        return { projectInfo: specs.projectInfo, calculations, equipment, diagram };
    }

    async extractParametersWithAI(prompt) {
        if (!this.model) throw new Error("AI Model not initialized");
        const extractionPrompt = `
        Extract HVAC project data from: "${prompt}"
        
        Return JSON format:
        {
            "projectInfo": { "name": "string", "location": "string", "ambientTemp": 35 },
            "rooms": [
                { 
                  "name": "string", "count": number, "temp": number, 
                  "L": number, "W": number, "H": number, 
                  "productType": "string", "productMass": number (kg/day), 
                  "entryTemp": number, "targetTemp": number, "processTime": number (hours)
                }
            ]
        }
        Example logic: "4 blast freezers" -> count: 4.
        `;
        
        try {
            const result = await this.model.generateContent(extractionPrompt);
            const text = result.response.text().replace(/```json|```/g, '').trim();
            return JSON.parse(text);
        } catch (e) {
            console.error("AI Extract Error", e);
            throw new Error("Failed to parse input.");
        }
    }

    performDetailedCalculations(specs) {
        const results = {
            rooms: [],
            totalLoad: { booster: 0, highStage: 0 }
        };

        specs.rooms.forEach(roomData => {
            // تکرار برای تعداد اتاق‌ها
            const count = roomData.count || 1;
            
            // 1. بار انتقال حرارت
            const area = 2 * ((roomData.L * roomData.H) + (roomData.W * roomData.H) + (roomData.L * roomData.W));
            const uValue = roomData.temp < -10 ? 0.17 : 0.22;
            const dT = (specs.projectInfo.ambientTemp || 35) - roomData.temp;
            const qTrans = (area * uValue * dT) / 1000; // kW

            // 2. بار محصول (دقیق)
            let qProd = 0;
            if (roomData.productMass > 0) {
                const mass = roomData.productMass; // kg
                const tIn = roomData.entryTemp !== undefined ? roomData.entryTemp : 25;
                const tOut = roomData.targetTemp !== undefined ? roomData.targetTemp : roomData.temp;
                
                let h1, h2;
                // فرمول ساده شده آنتالپی گوشت/مرغ
                if (tIn > -1) h1 = 3.2 * tIn + 230; else h1 = 1.7 * tIn;
                if (tOut > -1) h2 = 3.2 * tOut + 230; else h2 = 1.7 * tOut;
                
                const deltaH = h1 - h2;
                const timeSec = (roomData.processTime || 24) * 3600;
                qProd = (mass * deltaH) / timeSec;
            }

            // 3. بارهای جانبی (فن، دیفراست، روشنایی) ~ 20%
            const qMisc = (qTrans + qProd) * 0.2;
            
            const totalRoomLoad = qTrans + qProd + qMisc;
            const stage = roomData.temp <= -25 ? 'Booster' : 'High Stage';

            // ذخیره تکی (برای لیست اتاق‌ها)
            for(let i=0; i<count; i++) {
                results.rooms.push({
                    name: `${roomData.name} ${i+1}`,
                    temp: roomData.temp,
                    load: totalRoomLoad.toFixed(1),
                    stage,
                    details: { trans: qTrans.toFixed(1), prod: qProd.toFixed(1), misc: qMisc.toFixed(1) }
                });
            }

            // جمع کل بارها
            if (stage === 'Booster') results.totalLoad.booster += totalRoomLoad * count;
            else results.totalLoad.highStage += totalRoomLoad * count;
        });
        
        // اضافه کردن بار بوستر به های-استیج (Heat Rejection)
        // Q_high_total = Q_high_rooms + Q_booster + W_booster
        // تقریب: Q_rej_booster ~= Q_booster * 1.3
        results.totalLoad.highStage += results.totalLoad.booster * 1.3;

        return results;
    }

    selectEquipmentFromDB(calcs) {
        const selection = { compressors: [], vessels: [], condenser: null, pumps: [], valves: [] };
        const USD_TO_TOMAN = 60000; // نرخ فرضی

        // --- 1. Booster Compressors ---
        if (calcs.totalLoad.booster > 0) {
            const load = calcs.totalLoad.booster;
            // انتخاب نزدیکترین مدل
            const model = this.equipmentDB.compressors.reduce((prev, curr) => 
                Math.abs(curr.capacity_40 - (load/2)) < Math.abs(prev.capacity_40 - (load/2)) ? curr : prev
            );
            const count = Math.ceil(load / model.capacity_40);
            
            for(let i=0; i<count; i++) {
                selection.compressors.push({
                    id: `CMP-B-${i+1}`,
                    brand: model.model.split(' ')[0],
                    model: model.model,
                    capacity: model.capacity_40,
                    stage: 'Booster',
                    price: (model.price * USD_TO_TOMAN).toLocaleString()
                });
            }
            
            // سپراتور افقی
            selection.vessels.push({
                id: 'LPS', type: 'separator_horizontal', label: '-40°C LPS',
                model: `LPS-${(load*5).toFixed(0)}L`, price: (15000 * USD_TO_TOMAN).toLocaleString()
            });

            // پمپ آمونیاک
            selection.pumps.push(
                { id: 'P1', type: 'ammonia_pump', label: 'Pump 1', model: 'CAM 2/3', brand: 'Hermetic' },
                { id: 'P2', type: 'ammonia_pump', label: 'Pump 2', model: 'CAM 2/3', brand: 'Hermetic' }
            );
        }

        // --- 2. High Stage Compressors ---
        const loadH = calcs.totalLoad.highStage;
        const modelH = this.equipmentDB.compressors.reduce((prev, curr) => 
             curr.capacity_10 > loadH/2 ? curr : prev // سعی کن مدل بزرگتر برداری
        );
        const countH = Math.ceil(loadH / modelH.capacity_10);

        for(let i=0; i<countH; i++) {
            selection.compressors.push({
                id: `CMP-H-${i+1}`,
                brand: modelH.model.split(' ')[0],
                model: modelH.model,
                capacity: modelH.capacity_10,
                stage: 'High Stage',
                price: (modelH.price * USD_TO_TOMAN).toLocaleString()
            });
        }

        // --- 3. Vessels ---
        selection.vessels.push({ id: 'ECO', type: 'separator_vertical', label: '-10°C Intercooler', model: 'V-ECO-3000' });
        selection.vessels.push({ id: 'HPR', type: 'receiver', label: 'HP Receiver', model: 'HPR-5000L' });

        // --- 4. Condenser ---
        const heatRejection = loadH * 1.25;
        const condModel = this.equipmentDB.condensers.find(c => c.capacity >= heatRejection) || this.equipmentDB.condensers[2];
        selection.condenser = {
            id: 'COND',
            type: 'evaporative_condenser',
            brand: 'Baltimore',
            model: condModel.model,
            capacity: condModel.capacity,
            price: (condModel.price * USD_TO_TOMAN).toLocaleString()
        };

        return selection;
    }

    generateDetailedPID(equip, calcs) {
        const nodes = [];
        const edges = [];
        
        // --- محاسبه سایز لوله (Pipe Sizing) ---
        const calcPipeSize = (kw, type) => {
            // فرمول‌های سرانگشتی مهندسی (Velocity based)
            if (type === 'suction_lt') return kw < 200 ? 'DN150' : kw < 500 ? 'DN200' : 'DN250';
            if (type === 'suction_mt') return kw < 400 ? 'DN150' : 'DN200';
            if (type === 'discharge') return kw < 300 ? 'DN100' : 'DN125';
            if (type === 'liquid') return kw < 500 ? 'DN50' : 'DN65';
            return 'DN50';
        };

        // 1. موتورخانه (Engine Room)
        const ROW_COND = 50;
        const ROW_REC = 200;
        const ROW_ECO = 400;
        const ROW_LPS = 600;

        // کندانسور و رسیور
        nodes.push({ id: 'COND', type: 'industrial', position: { x: 800, y: ROW_COND }, data: { label: equip.condenser.model, componentType: 'evaporative_condenser' } });
        nodes.push({ id: 'HPR', type: 'industrial', position: { x: 800, y: ROW_REC }, data: { label: 'Receiver', componentType: 'receiver' } });
        
        edges.push({ id: 'e1', source: 'COND', target: 'HPR', label: 'DN100 Liq', style: { stroke: '#FFA500', strokeWidth: 3 } });

        // اینترکولر و اکسپنشن
        nodes.push({ id: 'ECO', type: 'industrial', position: { x: 500, y: ROW_ECO }, data: { label: 'Intercooler', componentType: 'separator', subType: 'vertical' } });
        nodes.push({ id: 'EXP1', type: 'industrial', position: { x: 650, y: 300 }, data: { label: 'ICS+CVP', componentType: 'expansion_valve' } });
        
        edges.push({ id: 'e2', source: 'HPR', target: 'EXP1', style: { stroke: '#FFA500' } });
        edges.push({ id: 'e3', source: 'EXP1', target: 'ECO', style: { stroke: '#FFA500' } });

        // کمپرسورهای های-استیج
        equip.compressors.filter(c => c.stage === 'High Stage').forEach((c, i) => {
            const pos = { x: 800 + (i*180), y: ROW_ECO };
            nodes.push({ id: c.id, type: 'industrial', position: pos, data: { label: c.model, componentType: 'screw_compressor' } });
            
            const sucSize = calcPipeSize(c.capacity, 'suction_mt');
            edges.push({ id: `s-${c.id}`, source: 'ECO', target: c.id, label: sucSize, style: { stroke: '#2196F3', strokeDasharray: '5,5' } });
            edges.push({ id: `d-${c.id}`, source: c.id, target: 'COND', label: 'DN100', style: { stroke: '#F44336' } });
        });

        // مدار بوستر (اگر باشد)
        const boosters = equip.compressors.filter(c => c.stage === 'Booster');
        if (boosters.length > 0) {
            // سپراتور افقی
            nodes.push({ id: 'LPS', type: 'industrial', position: { x: 200, y: ROW_LPS }, data: { label: '-40 LPS', componentType: 'separator', subType: 'horizontal' } });
            
            // شیر انبساط مرحله دوم
            nodes.push({ id: 'EXP2', type: 'industrial', position: { x: 350, y: 500 }, data: { label: 'ICS+CVP', componentType: 'expansion_valve' } });
            edges.push({ id: 'e4', source: 'ECO', target: 'EXP2', style: { stroke: '#FFA500' } });
            edges.push({ id: 'e5', source: 'EXP2', target: 'LPS', style: { stroke: '#FFA500' } });

            // پمپ‌ها
            nodes.push({ id: 'P1', type: 'industrial', position: { x: 150, y: ROW_LPS + 100 }, data: { label: 'P-1', componentType: 'ammonia_pump' } });
            nodes.push({ id: 'P2', type: 'industrial', position: { x: 250, y: ROW_LPS + 100 }, data: { label: 'P-2', componentType: 'ammonia_pump' } });
            
            // بوسترها
            boosters.forEach((c, i) => {
                const pos = { x: 100 + (i*180), y: ROW_LPS - 150 };
                nodes.push({ id: c.id, type: 'industrial', position: pos, data: { label: c.model, componentType: 'screw_compressor' } });
                
                const sucSize = calcPipeSize(c.capacity, 'suction_lt');
                edges.push({ id: `s-${c.id}`, source: 'LPS', target: c.id, label: sucSize, style: { stroke: '#03A9F4', strokeDasharray: '5,5' } });
                edges.push({ id: `d-${c.id}`, source: c.id, target: 'ECO', label: 'DN100', style: { stroke: '#FF9800' } });
            });
        }

        // 2. مصرف کننده‌ها (اواپراتورها)
        calcs.rooms.forEach((room, i) => {
            const x = 50 + (i * 250);
            const y = 900;
            
            // Valve Station برای هر اتاق
            nodes.push({ id: `VS-${i}`, type: 'industrial', position: { x: x, y: y-80 }, data: { label: 'Valve St.', componentType: 'valve_station' } });
            
            // Evaporator
            nodes.push({ 
                id: `EV-${i}`, 
                type: 'industrial', 
                position: { x, y }, 
                data: { label: room.name, componentType: 'evaporator', capacity: `${Math.round(room.load)}kW` } 
            });

            // Connections
            let sourceVessel = room.temp <= -25 ? 'P1' : 'HPR';
            let returnVessel = room.temp <= -25 ? 'LPS' : 'ECO';
            
            // Liquid Line
            edges.push({ id: `l-${i}`, source: sourceVessel, target: `VS-${i}`, style: { stroke: '#FFA500', opacity: 0.3 }, animated: true });
            edges.push({ id: `vl-${i}`, source: `VS-${i}`, target: `EV-${i}`, style: { stroke: '#FFA500' } });
            
            // Suction Line
            edges.push({ id: `s-${i}`, source: `EV-${i}`, target: returnVessel, style: { stroke: '#2196F3', strokeDasharray: '5,5', opacity: 0.3 } });
        });

        return { initialNodes: nodes, initialEdges: edges };
    }
}

module.exports = new IntelligentDesignService();