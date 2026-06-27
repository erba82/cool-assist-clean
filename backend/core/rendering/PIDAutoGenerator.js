/**
 * PIDAutoGenerator - Automatic P&ID Layout Generator
 * 
 * Converts Core Engine calculation results into
 * a professional P&ID diagram layout with:
 * - Equipment positioning
 * - Pipe routing (orthogonal)
 * - ISO 14617 symbols
 * - ISA 5.1 instrument tagging
 * - Equipment tags (ISO 81346)
 * - Valve placement
 * - DN pipe sizing
 * - P/T annotations at key points
 * - R-717 safety instrumentation
 * 
 * @author GFDDE AI Engine
 * @version 3.0.0
 */

const PipeSizingCalculator = require('./PipeSizingCalculator');
const ISATaggingSystem = require('../modules/ISATaggingSystem');

// 🆕 Import new Grid Layout Engine for collision detection
let GridLayoutManager;
try {
    GridLayoutManager = require('../../services/generative/PIDLayoutEngine').GridLayoutManager;
} catch (e) {
    // Fallback if module not available
    GridLayoutManager = null;
}

class PIDAutoGenerator {
    constructor() {
        // Layout constants - Safe margin from border
        this.layout = {
            margin: 100,                 // Safe margin inside border
            equipmentSpacing: 600,       // Increased from 500 - Better horizontal spacing
            verticalSpacing: 300,        // Increased from 250 - Better vertical spacing
            minGap: 80,                  // NEW: Minimum gap between any equipment
            gridSize: 50,
            maxItemsPerRow: 4,           // 4 items per row (was 3)
            canvasWidth: 3500,           // Wide canvas
            canvasHeight: 2200           // Compact height for zones
        };




        // Equipment dimensions (for collision detection)
        this.dimensions = {
            evaporator: { width: 120, height: 80 },
            separator: { width: 60, height: 100 },
            compressor: { width: 100, height: 100 },
            condenser: { width: 140, height: 100 },
            receiver: { width: 80, height: 60 },
            vessel: { width: 60, height: 100 }
        };

        // 🆕 Initialize grid layout for collision detection
        if (GridLayoutManager) {
            this.gridLayout = new GridLayoutManager(
                this.layout.canvasWidth,
                this.layout.canvasHeight,
                this.layout.gridSize
            );
            console.log('✅ PIDAutoGenerator: Using GridLayoutManager for collision detection');
        } else {
            this.gridLayout = null;
        }

        // Initialize pipe sizing calculator
        this.pipeSizing = new PipeSizingCalculator();

        // Initialize ISA tagging system
        this.isaTagging = new ISATaggingSystem();

        // Loop counters for instrument tags
        this.loopCounters = {
            temperature: 100,
            pressure: 100,
            level: 100,
            flow: 100
        };
    }

    /**
     * 🆕 Get collision-free position using GridLayoutManager
     * @param {number} x - Initial X position
     * @param {number} y - Initial Y position
     * @param {string} equipmentType - Type of equipment for dimension lookup
     * @returns {{x: number, y: number}} Collision-free position
     */
    _getCollisionFreePosition(x, y, equipmentType) {
        if (!this.gridLayout) {
            // No grid manager, return original position
            return { x, y };
        }

        const dim = this.dimensions[equipmentType] || { width: 100, height: 100 };
        const gridSize = this.layout.gridSize;

        // ===== BOUNDS CLAMPING FIRST =====
        // Ensure equipment stays within canvas before collision detection
        const maxY = this.layout.canvasHeight - 220; // Reserve for title block + margin
        const maxX = this.layout.canvasWidth - 150;  // Right margin

        // Clamp Y position
        if (y + dim.height > maxY) {
            y = maxY - dim.height;
            console.log(`⚠️ Y clamped to ${y} (maxY: ${maxY})`);
        }

        // Clamp X position
        if (x + dim.width > maxX) {
            x = maxX - dim.width;
            console.log(`⚠️ X clamped to ${x} (maxX: ${maxX})`);
        }

        // Ensure minimum margin
        if (x < this.layout.margin) x = this.layout.margin;
        if (y < this.layout.margin) y = this.layout.margin;

        // ===== COLLISION DETECTION =====
        // Convert pixel position to grid cells
        const gridCol = Math.floor(x / gridSize);
        const gridRow = Math.floor(y / gridSize);
        const widthCells = Math.ceil(dim.width / gridSize);
        const heightCells = Math.ceil(dim.height / gridSize);

        // Check if position is available
        if (this.gridLayout.isAvailable(gridRow, gridCol, widthCells, heightCells)) {
            // Mark as occupied and return
            this.gridLayout.occupy(gridRow, gridCol, widthCells, heightCells);
            return { x, y };
        }

        // Position is taken, find nearest available
        console.log(`⚠️ Grid collision at (${gridRow}, ${gridCol}) - finding alternative`);

        // Spiral search for available position
        for (let distance = 1; distance < 20; distance++) {
            for (let dr = -distance; dr <= distance; dr++) {
                for (let dc = -distance; dc <= distance; dc++) {
                    if (Math.abs(dr) !== distance && Math.abs(dc) !== distance) continue;

                    const newRow = gridRow + dr;
                    const newCol = gridCol + dc;

                    if (newRow < 0 || newCol < 0) continue;

                    if (this.gridLayout.isAvailable(newRow, newCol, widthCells, heightCells)) {
                        this.gridLayout.occupy(newRow, newCol, widthCells, heightCells);
                        const newX = newCol * gridSize;
                        const newY = newRow * gridSize;
                        console.log(`   → Auto-shifted to (${newRow}, ${newCol}) = (${newX}, ${newY})px`);
                        return { x: newX, y: newY };
                    }
                }
            }
        }

        // Fallback: return original position with offset
        console.log(`   → No available position found, using fallback offset`);
        return { x: x + 150, y: y + 150 };
    }

    /**
     * Determine system architecture type based on refrigerant
     * @param {string} refrigerant - Refrigerant designation (R717, R744, etc.)
     * @returns {string} System type
     */
    _getSystemType(refrigerant) {
        const r = String(refrigerant).toUpperCase();

        if (r.includes('717') || r.includes('NH3') || r.includes('AMMONIA')) {
            return 'Ammonia Flooded/Pumped';
        } else if (r.includes('744') || r.includes('CO2')) {
            return 'CO2 Cascade/Transcritical';
        } else if (r.includes('404') || r.includes('134') || r.includes('407') || r.includes('410')) {
            return 'HFC DX System';
        } else {
            return 'Standard Refrigeration';
        }
    }

    /**
     * Generate complete P&ID layout from calculation results
     * @param {Object} results - Core Engine calculation results
     * @param {Object} project - Project data
     * @returns {Object} P&ID layout data
     */
    generate(results, project) {
        // Get refrigerant type for system-specific P&ID
        const refrigerant = project.refrigerant || 'R717';
        const systemType = this._getSystemType(refrigerant);

        const layout = {
            equipment: [],
            pipes: [],
            valves: [],
            instruments: [],
            metadata: {
                projectName: project.name,
                refrigerant: refrigerant,
                systemType: systemType,
                date: new Date().toLocaleDateString(),
                drawingNo: 'PID-001',
                revision: 'A',
                designer: 'GFDDE AI Engine'
            }
        };

        console.log(`📐 Generating P&ID for ${refrigerant} (${systemType})`);

        // 🆕 ISO 10628 Zone-Based Layout:
        // TOP = High pressure / Hot side (Condenser, Receiver)
        // MIDDLE = Compressors
        // BOTTOM = Low pressure / Cold side (Separators, Evaporators)
        // Note: Leave 200px at bottom for title block

        const ZONE_Y = {
            CONDENSER: 120,        // +40 from old 80 - Better top margin
            RECEIVER: 400,         // +50 from old 350 - Increased gap
            COMPRESSORS: 720,      // +20 from old 700 - Slight adjustment
            SEPARATORS: 1080,      // -20 from old 1100 - Compressed slightly
            EVAPORATORS: 1350      // -150 from old 1500 - More bottom space (650px to title)
        };




        console.log('📐 Using ISO 10628 Zone-Based Layout');

        // 1. Position CONDENSER at TOP (High Pressure Zone)
        if (results.calculations?.condensers) {
            const cond = this._positionCondenser(
                results.calculations.condensers,
                ZONE_Y.CONDENSER
            );
            layout.equipment.push(cond);
            console.log('   → Condenser in TOP zone (HP)');
        }

        // 2. Position RECEIVER below condenser
        const receiver = this._positionReceiver(ZONE_Y.RECEIVER);
        layout.equipment.push(receiver);
        console.log('   → Receiver below condenser');

        // 3. Position COMPRESSORS in middle zone
        if (results.calculations?.compressors) {
            const comps = this._positionCompressors(
                results.calculations.compressors,
                ZONE_Y.COMPRESSORS
            );
            layout.equipment.push(...comps);
            console.log(`   → ${comps.length} Compressors in MIDDLE zone`);
        }

        // 4. Position SEPARATORS below compressors
        if (results.calculations?.separators) {
            const seps = this._positionSeparators(
                results.calculations.separators,
                ZONE_Y.SEPARATORS
            );
            layout.equipment.push(...seps);
            console.log(`   → ${seps.length} Separators in lower-middle zone`);
        }

        // 5. Position EVAPORATORS at BOTTOM (Low Pressure Zone)
        if (results.calculations?.evaporators) {
            const evaps = this._positionEvaporators(
                results.calculations.evaporators,
                results.calculations.loads,
                ZONE_Y.EVAPORATORS
            );
            layout.equipment.push(...evaps);
            console.log(`   → ${evaps.length} Evaporators in BOTTOM zone (LP)`);
        }

        // 6. Position AMMONIA PUMPS (ONLY for ammonia flooded/pumped systems)
        // CO2 and HFC systems use different architectures (DX or cascade)
        if (refrigerant === 'R717' || refrigerant.toUpperCase().includes('NH3') || refrigerant.toUpperCase().includes('AMMONIA')) {
            const ammoniaPumps = this._positionAmmoniaPumps(ZONE_Y.EVAPORATORS + 120);
            layout.equipment.push(...ammoniaPumps);
            if (ammoniaPumps.length > 0) {
                console.log(`   → ${ammoniaPumps.length} Ammonia Pumps added (flooded system)`);
            }
        } else {
            console.log(`   → Skipping pumps (${refrigerant} uses ${systemType})`);
        }

        // 6. Generate pipes with DN sizing
        layout.pipes = this._generatePipes(layout.equipment, results);

        // 7. Generate valves for each pipe
        layout.pipes.forEach(pipe => {
            const valves = this.pipeSizing.generateValves(pipe, layout.equipment);
            layout.valves.push(...valves);
        });
        console.log(`[PIDAutoGenerator] Generated ${layout.valves.length} valves`);

        // 8. Generate instrumentation with ISA 5.1 tags
        const instrumentation = this._generateInstrumentation(layout.equipment, layout.pipes, results);
        layout.instruments.push(...instrumentation);
        console.log(`[PIDAutoGenerator] Generated ${layout.instruments.length} instruments`);

        // 9. Add P/T annotations at key points
        layout.annotations = this._generatePTAnnotations(layout.equipment, layout.pipes, results);
        console.log(`[PIDAutoGenerator] Generated ${layout.annotations.length} P/T annotations`);

        // 10. Add R-717 specific safety instrumentation if ammonia
        if (project.refrigerant === 'R717') {
            const safetyInst = this._generateAmmoniaSafetyInstrumentation(layout.equipment);
            layout.instruments.push(...safetyInst);
            console.log(`[PIDAutoGenerator] Added ${safetyInst.length} ammonia safety instruments`);
        }

        return layout;
    }

    /**
     * Position evaporators in a grid - grouped by temperature level
     * ISO 10628: Equipment should be grouped logically
     * 🆕 Uses GridLayoutManager for collision detection
     */
    _positionEvaporators(evaporators, loads, startY) {
        const equipment = [];
        const itemsPerRow = this.layout.maxItemsPerRow || 3;

        // Group evaporators by temperature for better organization
        const grouped = this._groupByTemperature(evaporators, loads);
        let currentY = startY;
        let globalIndex = 0;

        // Process each temperature group
        Object.keys(grouped).sort((a, b) => parseFloat(a) - parseFloat(b)).forEach(temp => {
            const group = grouped[temp];

            group.forEach((item, i) => {
                const row = Math.floor(i / itemsPerRow);
                const col = i % itemsPerRow;

                // Calculate initial position
                let x = this.layout.margin + (col * this.layout.equipmentSpacing);
                let y = currentY + (row * this.layout.verticalSpacing);

                // 🆕 Use GridLayoutManager for collision-free placement
                const position = this._getCollisionFreePosition(x, y, 'evaporator');
                x = position.x;
                y = position.y;

                equipment.push({
                    id: item.evap.tag || `EVAP-${globalIndex + 1}`,
                    type: 'evaporator',
                    symbol: 'air_cooler',
                    x,
                    y,
                    label: item.evap.tag || `EVAP-${globalIndex + 1}`,
                    temperatureLevel: parseFloat(temp),
                    specs: {
                        model: item.evap.model,
                        capacity: `${item.evap.capacityPerUnit?.toFixed(0) || '50'} kW`,
                        evapTemp: `${item.evap.evaporatingTemp || temp}°C`,
                        room: item.load?.roomName || '',
                        fanCount: item.evap.fanCount || 2
                    },
                    connections: {
                        liquidIn: 'left',
                        vaporOut: 'right'
                    }
                });

                globalIndex++;
            });

            // Move to next temperature group row
            const rowsInGroup = Math.ceil(group.length / itemsPerRow);
            currentY += rowsInGroup * this.layout.verticalSpacing + 100; // Extra gap between temp groups
        });

        return equipment;
    }

    /**
     * Group evaporators by temperature level
     */
    _groupByTemperature(evaporators, loads) {
        const grouped = {};

        evaporators.forEach((evap, i) => {
            const temp = evap.evaporatingTemp || (loads?.[i]?.temperature) || -18;
            const key = temp.toString();

            if (!grouped[key]) {
                grouped[key] = [];
            }
            grouped[key].push({ evap, load: loads?.[i] });
        });

        return grouped;
    }

    /**
     * Position separators by temperature level
     */
    _positionSeparators(separators, startY) {
        const equipment = [];
        const spacing = 250;

        separators.forEach((sep, i) => {
            // 🆕 Use collision-free positioning
            let x = this.layout.margin + (i * spacing) + 100;
            let y = startY;
            const pos = this._getCollisionFreePosition(x, y, 'separator');

            equipment.push({
                id: sep.tag || `SEP-${i + 1}`,
                type: 'separator',
                symbol: 'vertical_vessel',
                x: pos.x,
                y: pos.y,
                label: sep.tag || `SEP-${i + 1}`,
                specs: {
                    volume: `${sep.volume} L`,
                    pressure: `${sep.designPressure} bar`,
                    evapTemp: `${sep.evaporatingTemp}°C`,
                    tempLevel: sep.temperatureLevel || ''
                },
                connections: {
                    vaporOut: 'top',
                    liquidOut: 'bottom',
                    liquidReturn: 'left'
                },
                metadata: {
                    temperatureLevel: sep.temperatureLevel,
                    evapTemp: sep.evaporatingTemp
                }
            });
        });

        return equipment;
    }

    /**
     * Position compressors
     */
    _positionCompressors(compressors, startY) {
        const equipment = [];
        const spacing = 200;

        compressors.forEach((comp, i) => {
            // 🆕 Use collision-free positioning
            let x = this.layout.margin + (i * spacing) + 150;
            let y = startY;
            const pos = this._getCollisionFreePosition(x, y, 'compressor');

            equipment.push({
                id: comp.tag || `COMP-${i + 1}`,
                type: 'compressor',
                symbol: 'screw_compressor',
                x: pos.x,
                y: pos.y,
                label: comp.tag || `COMP-${i + 1}`,
                specs: {
                    model: comp.model,
                    capacity: `${comp.designLoad?.toFixed(0)} kW`,
                    power: `${comp.electricalPower?.toFixed(0)} kW`,
                    cop: comp.cop?.toFixed(2),
                    units: `${comp.operatingUnits}+${comp.standbyUnits}`
                },
                connections: {
                    suctionIn: 'left',
                    dischargeOut: 'right'
                },
                metadata: {
                    temperatureLevel: comp.temperatureLevel
                }
            });
        });

        return equipment;
    }

    /**
     * Position condenser
     */
    _positionCondenser(condenser, startY) {
        // 🆕 Use collision-free positioning for condenser
        const pos = this._getCollisionFreePosition(900, startY + 50, 'condenser');

        return {
            id: condenser.tag || 'COND-01',
            type: 'condenser',
            symbol: condenser.type === 'evaporative' ? 'evaporative_condenser' : 'air_cooled_condenser',
            x: pos.x,
            y: pos.y,
            label: condenser.tag || 'COND-01',
            specs: {
                model: condenser.model,
                capacity: `${condenser.totalCapacity?.toFixed(0)} kW`,
                type: condenser.type,
                count: condenser.count || 1
            },
            connections: {
                hotGasIn: 'left',
                liquidOut: 'bottom'
            }
        };
    }

    /**
     * Position receiver
     */
    _positionReceiver(startY) {
        // 🆕 Use collision-free positioning for receiver
        const pos = this._getCollisionFreePosition(900, startY, 'receiver');

        return {
            id: 'REC-01',
            type: 'receiver',
            symbol: 'horizontal_vessel',
            x: pos.x,
            y: pos.y,
            label: 'REC-01',

            specs: {
                volume: '2000 L',
                pressure: '25 bar'
            },
            connections: {
                liquidIn: 'top',
                liquidOut: 'left'
            }
        };
    }

    /**
     * Position Ammonia Pumps for liquid recirculation systems
     * Typically 1 operating + 1 standby per temperature level
     */
    _positionAmmoniaPumps(startY) {
        const pumps = [];
        const pumpCount = 2; // 1 operating + 1 standby
        const spacing = 150;

        for (let i = 0; i < pumpCount; i++) {
            const pos = this._getCollisionFreePosition(
                this.layout.margin + 400 + (i * spacing),
                startY,
                'compressor' // Use compressor dimensions as approximation
            );

            pumps.push({
                id: `PUMP-${i + 1}`,
                tag: `PUMP-${i + 1}`,  // Required for pipe matching
                type: 'pump',
                symbol: 'centrifugal_pump',
                x: pos.x,
                y: pos.y,
                label: `P-${i + 1}`,
                specs: {
                    model: 'Hermetic CNH-10',
                    capacity: '50 m³/h',
                    head: '25 m',
                    power: '7.5 kW',
                    status: i === 0 ? 'Operating' : 'Standby'
                },
                connections: {
                    suctionIn: 'left',
                    dischargeOut: 'right'
                }
            });
        }

        return pumps;
    }

    /**

     * Generate pipe connections with proper DN sizing using ASHRAE velocity criteria
     */
    _generatePipes(equipment, results) {
        const pipes = [];
        const refrigerant = results.project?.refrigerant || 'R717';

        // Find equipment by type
        const evaporators = equipment.filter(e => e.type === 'evaporator');
        const separators = equipment.filter(e => e.type === 'separator');
        const compressors = equipment.filter(e => e.type === 'compressor');
        const condenser = equipment.find(e => e.type === 'condenser');
        const receiver = equipment.find(e => e.type === 'receiver');

        // Calculate total system capacity for main headers
        const totalCapacity = compressors.reduce((sum, c) =>
            sum + (parseFloat(c.specs?.capacity) || 100), 0);
        const avgEvapTemp = evaporators.length > 0 ?
            evaporators.reduce((sum, e) => sum + (parseFloat(e.specs?.evapTemp) || -18), 0) / evaporators.length : -18;

        // 1. Connect evaporators to separators (vapor suction lines)
        evaporators.forEach(evap => {
            const separator = this._findMatchingSeparator(evap, separators);
            if (separator) {
                const capacity = parseFloat(evap.specs?.capacity) || 50;
                const evapTemp = parseFloat(evap.specs?.evapTemp) || -18;
                const sizing = this.pipeSizing.calculateDN(capacity, 'suction', evapTemp, refrigerant);

                pipes.push({
                    id: `PIPE-${evap.id}-${separator.id}`,
                    from: evap.id,
                    to: separator.id,
                    type: 'suction',
                    fluidType: 'vapor',
                    color: '#4169E1',
                    points: this._routePipe(evap, separator, 'right', 'left'),
                    size: sizing.dn,
                    label: `${sizing.dn} (${sizing.velocity} m/s)`,
                    nominalSize: sizing.nominalSize,
                    velocity: sizing.velocity,
                    massFlow: sizing.massFlow,
                    capacity: capacity
                });
            }
        });

        // 2. Connect separators to compressors (main suction header)
        separators.forEach((sep, i) => {
            const comp = compressors[i] || compressors[0];
            if (comp) {
                const capacity = parseFloat(comp.specs?.capacity) || 100;
                const evapTemp = parseFloat(sep.specs?.evapTemp) || -18;
                const sizing = this.pipeSizing.calculateDN(capacity, 'suction', evapTemp, refrigerant);

                pipes.push({
                    id: `PIPE-${sep.id}-${comp.id}`,
                    from: sep.id,
                    to: comp.id,
                    type: 'suction',
                    fluidType: 'vapor',
                    color: '#4169E1',
                    points: this._routePipe(sep, comp, 'top', 'left'),
                    size: sizing.dn,
                    label: `${sizing.dn} (${sizing.velocity} m/s)`,
                    nominalSize: sizing.nominalSize,
                    velocity: sizing.velocity,
                    massFlow: sizing.massFlow
                });
            }
        });

        // 3. Connect compressors to condenser (discharge - hot gas)
        if (condenser) {
            const dischargeCapacity = totalCapacity * 1.25; // Add heat of compression
            const sizing = this.pipeSizing.calculateDN(dischargeCapacity, 'hotGas', avgEvapTemp, refrigerant);

            compressors.forEach(comp => {
                pipes.push({
                    id: `PIPE-${comp.id}-${condenser.id}`,
                    from: comp.id,
                    to: condenser.id,
                    type: 'discharge',
                    fluidType: 'hotGas',
                    color: '#DC143C',
                    points: this._routePipe(comp, condenser, 'right', 'left'),
                    size: sizing.dn,
                    label: `${sizing.dn} (${sizing.velocity} m/s)`,
                    nominalSize: sizing.nominalSize,
                    velocity: sizing.velocity,
                    massFlow: sizing.massFlow,
                    temperature: '+85°C'
                });
            });
        }

        // 4. Connect condenser to receiver (liquid line)
        if (condenser && receiver) {
            const sizing = this.pipeSizing.calculateDN(totalCapacity, 'liquid', 35, refrigerant);

            pipes.push({
                id: `PIPE-${condenser.id}-${receiver.id}`,
                from: condenser.id,
                to: receiver.id,
                type: 'liquid',
                fluidType: 'liquid',
                color: '#228B22', // Green for high-pressure liquid
                points: this._routePipe(condenser, receiver, 'bottom', 'top'),
                size: sizing.dn,
                label: `${sizing.dn} (${sizing.velocity} m/s)`,
                nominalSize: sizing.nominalSize,
                velocity: sizing.velocity,
                massFlow: sizing.massFlow,
                temperature: '+35°C'
            });
        }

        // 5. Connect receiver to separators (liquid feed)
        if (receiver) {
            separators.forEach(sep => {
                const sepCapacity = parseFloat(sep.specs?.capacity) || (totalCapacity / separators.length);
                const sizing = this.pipeSizing.calculateDN(sepCapacity, 'liquid', avgEvapTemp, refrigerant);

                pipes.push({
                    id: `PIPE-${receiver.id}-${sep.id}`,
                    from: receiver.id,
                    to: sep.id,
                    type: 'liquid',
                    fluidType: 'liquid',
                    color: '#FFD700', // Yellow for liquid feed
                    points: this._routePipe(receiver, sep, 'left', 'bottom'),
                    size: sizing.dn,
                    label: `${sizing.dn} (${sizing.velocity} m/s)`,
                    nominalSize: sizing.nominalSize,
                    velocity: sizing.velocity,
                    massFlow: sizing.massFlow
                });
            });
        }

        // 6. Connect PUMPS to separators (suction) and evaporators (discharge)
        // This implements the liquid recirculation system
        const pumps = equipment.filter(e => e.type === 'pump');

        if (pumps.length > 0 && separators.length > 0) {
            // Find the primary LP separator for pump suction
            const primarySeparator = separators[0];
            const pumpCapacity = totalCapacity / pumps.length;

            pumps.forEach((pump, index) => {
                // Suction line: LP Separator → Pump
                const suctionSizing = this.pipeSizing.calculateDN(pumpCapacity, 'liquid', avgEvapTemp, refrigerant);

                pipes.push({
                    id: `PIPE-${primarySeparator.id}-${pump.id}-SUCTION`,
                    from: primarySeparator.id,
                    to: pump.id,
                    type: 'suction',
                    fluidType: 'liquid',
                    color: '#4169E1', // Blue for suction
                    points: this._routePipe(primarySeparator, pump, 'bottom', 'left'),
                    size: suctionSizing.dn,
                    label: `${suctionSizing.dn} (SUCTION)`,
                    nominalSize: suctionSizing.nominalSize,
                    velocity: suctionSizing.velocity,
                    massFlow: suctionSizing.massFlow,
                    temperature: `${avgEvapTemp}°C`
                });

                // Discharge line: Pump → Evaporators (recirculation header)
                if (evaporators.length > 0) {
                    // Connect pump to first evaporator as header
                    const targetEvap = evaporators[index % evaporators.length];
                    const dischargeSizing = this.pipeSizing.calculateDN(pumpCapacity, 'liquid', avgEvapTemp, refrigerant);

                    pipes.push({
                        id: `PIPE-${pump.id}-${targetEvap.id}-DISCHARGE`,
                        from: pump.id,
                        to: targetEvap.id,
                        type: 'discharge',
                        fluidType: 'liquid',
                        color: '#FFD700', // Yellow for liquid discharge
                        points: this._routePipe(pump, targetEvap, 'right', 'bottom'),
                        size: dischargeSizing.dn,
                        label: `${dischargeSizing.dn} (RECIRC)`,
                        nominalSize: dischargeSizing.nominalSize,
                        velocity: dischargeSizing.velocity,
                        massFlow: dischargeSizing.massFlow,
                        temperature: `${avgEvapTemp}°C`
                    });
                }
            });

            console.log(`[PIDAutoGenerator] Connected ${pumps.length} pumps to separator and evaporators`);
        }

        return pipes;

    }

    /**
     * Find matching separator for evaporator by temperature
     */
    _findMatchingSeparator(evap, separators) {
        const evapTemp = parseFloat(evap.specs.evapTemp);

        // Find separator with closest matching temperature
        let closest = separators[0];
        let minDiff = Math.abs(closest.metadata.evapTemp - evapTemp);

        for (const sep of separators) {
            const diff = Math.abs(sep.metadata.evapTemp - evapTemp);
            if (diff < minDiff) {
                minDiff = diff;
                closest = sep;
            }
        }

        return closest;
    }

    /**
     * Route pipe with orthogonal path
     */
    _routePipe(from, to, fromSide, toSide) {
        const fromX = from.x + (fromSide === 'right' ? 60 : fromSide === 'left' ? -10 : 30);
        const fromY = from.y + (fromSide === 'bottom' ? 60 : fromSide === 'top' ? -10 : 40);

        const toX = to.x + (toSide === 'right' ? 60 : toSide === 'left' ? -10 : 30);
        const toY = to.y + (toSide === 'bottom' ? 60 : toSide === 'top' ? -10 : 40);

        // Simple orthogonal routing (can be enhanced)
        const midX = (fromX + toX) / 2;

        return [
            { x: fromX, y: fromY },
            { x: midX, y: fromY },
            { x: midX, y: toY },
            { x: toX, y: toY }
        ];
    }

    /**
     * Determine pipe size based on capacity
     */
    _getPipeSize(capacity, lineType) {
        const cap = parseFloat(capacity);

        if (lineType === 'suction') {
            if (cap < 50) return 'DN50';
            if (cap < 150) return 'DN80';
            if (cap < 300) return 'DN100';
            if (cap < 600) return 'DN150';
            return 'DN200';
        } else if (lineType === 'discharge') {
            if (cap < 50) return 'DN40';
            if (cap < 150) return 'DN65';
            if (cap < 300) return 'DN80';
            return 'DN100';
        } else {  // liquid
            if (cap < 100) return 'DN25';
            if (cap < 300) return 'DN40';
            return 'DN50';
        }
    }

    /**
     * Generate instrumentation with ISA 5.1 tags
     */
    _generateInstrumentation(equipment, pipes, results) {
        const instruments = [];

        // Temperature indicators on key equipment
        equipment.forEach(eq => {
            if (eq.type === 'compressor') {
                // Suction temperature
                instruments.push({
                    ...this.isaTagging.generateTag('T', 'I', this.loopCounters.temperature++),
                    equipment: eq.id,
                    position: 'suction',
                    x: eq.x - 40,
                    y: eq.y + 20,
                    value: `${eq.specs.evapTemp || '-18'}°C`
                });

                // Discharge temperature
                instruments.push({
                    ...this.isaTagging.generateTag('T', 'I', this.loopCounters.temperature++),
                    equipment: eq.id,
                    position: 'discharge',
                    x: eq.x + 120,
                    y: eq.y + 20,
                    value: '+85°C'
                });
            }

            if (eq.type === 'separator' || eq.type === 'receiver') {
                // Level indicator
                instruments.push({
                    ...this.isaTagging.generateTag('L', 'I', this.loopCounters.level++),
                    equipment: eq.id,
                    position: 'side',
                    x: eq.x + 70,
                    y: eq.y + 50
                });
            }
        });

        // Pressure indicators on key pipes
        pipes.forEach(pipe => {
            if (pipe.type === 'suction' || pipe.type === 'discharge') {
                const midPoint = pipe.points[Math.floor(pipe.points.length / 2)];
                instruments.push({
                    ...this.isaTagging.generateTag('P', 'I', this.loopCounters.pressure++),
                    pipe: pipe.id,
                    x: midPoint.x,
                    y: midPoint.y - 30,
                    value: pipe.type === 'discharge' ? '18 bar' : '2 bar'
                });
            }
        });

        return instruments;
    }

    /**
     * Generate P/T annotations at key points
     */
    _generatePTAnnotations(equipment, pipes, results) {
        const annotations = [];

        // Annotate key cycle points from thermodynamic analysis
        equipment.forEach(eq => {
            if (eq.type === 'compressor') {
                const compData = results.calculations?.compressors?.find(c => c.tag === eq.id);
                if (compData?.cycleAnalysis) {
                    const points = compData.cycleAnalysis.cyclePoints.rows;

                    // Point 1: Evaporator outlet (suction)
                    annotations.push({
                        type: 'cycle_point',
                        point: '1',
                        x: eq.x - 60,
                        y: eq.y - 20,
                        temperature: `${points[0].temperature}°C`,
                        pressure: `${points[0].pressure} bar`,
                        enthalpy: `${points[0].enthalpy} kJ/kg`,
                        state: points[0].state
                    });

                    // Point 2: Compressor outlet (discharge)
                    annotations.push({
                        type: 'cycle_point',
                        point: '2',
                        x: eq.x + 140,
                        y: eq.y - 20,
                        temperature: `${points[1].temperature}°C`,
                        pressure: `${points[1].pressure} bar`,
                        enthalpy: `${points[1].enthalpy} kJ/kg`,
                        state: points[1].state
                    });
                }
            }
        });

        // Annotate condenser and receiver
        const condenser = equipment.find(e => e.type === 'condenser');
        const receiver = equipment.find(e => e.type === 'receiver');

        if (condenser) {
            annotations.push({
                type: 'equipment_condition',
                equipment: condenser.id,
                x: condenser.x,
                y: condenser.y - 40,
                temperature: '+35°C',
                pressure: '18 bar',
                label: 'Condensing'
            });
        }

        if (receiver) {
            annotations.push({
                type: 'equipment_condition',
                equipment: receiver.id,
                x: receiver.x,
                y: receiver.y + 100,
                temperature: '+35°C',
                pressure: '18 bar',
                label: 'Subcooled Liquid'
            });
        }

        return annotations;
    }

    /**
     * Generate ammonia-specific safety instrumentation
     */
    _generateAmmoniaSafetyInstrumentation(equipment) {
        const safetyInst = [];
        const ammoniaInst = this.isaTagging.getAmmoniaInstrumentation();

        // Add PSVs to compressors
        equipment.forEach(eq => {
            if (eq.type === 'compressor') {
                safetyInst.push({
                    ...ammoniaInst.pressureSafety[0],
                    equipment: eq.id,
                    x: eq.x + 50,
                    y: eq.y - 50,
                    symbol: 'PSV',
                    setPoint: '22 bar',
                    discharge: 'To Scrubber'
                });
            }

            if (eq.type === 'receiver') {
                // PSV on receiver
                safetyInst.push({
                    ...ammoniaInst.pressureSafety[1],
                    equipment: eq.id,
                    x: eq.x + 40,
                    y: eq.y - 50,
                    symbol: 'PSV',
                    setPoint: '20 bar'
                });

                // Level controls
                safetyInst.push({
                    ...ammoniaInst.levelControls[0],
                    equipment: eq.id,
                    x: eq.x + 90,
                    y: eq.y + 30,
                    symbol: 'LIC',
                    range: '20-80%'
                });
            }
        });

        // Add leak detectors (shown as notes)
        ammoniaInst.leakDetection.forEach((detector, i) => {
            safetyInst.push({
                ...detector,
                x: 100,
                y: 50 + (i * 40),
                symbol: 'AE',
                type: 'leak_detector'
            });
        });

        return safetyInst;
    }
}

module.exports = PIDAutoGenerator;
