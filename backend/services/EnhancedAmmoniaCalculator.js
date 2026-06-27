/**
 * EnhancedAmmoniaCalculator.js
 * Advanced calculation engine for Ammonia (NH3) Refrigeration Systems
 * Implements accurate load calculations, equipment selection, and pricing
 */

const EQUIPMENT_DATABASE = require('../data/equipmentDatabase');
const { getRegionalFactor } = require('../data/regionalPricing');

class EnhancedAmmoniaCalculator {
    constructor() {
        this.constants = {
            airDensity: 1.2, // kg/m3
            airSpecificHeat: 1.005, // kJ/kg.K
            moistureLatentHeat: 2501, // kJ/kg
            safetyFactor: 1.10, // 10% safety margin
            simultaneityFactor: 0.85 // 85% diversity factor for central plant
        };
    }

    /**
     * Main entry point for comprehensive system calculation
     */
    async calculateProject(projectData) {
        console.log('🚀 Starting Enhanced Ammonia Calculation for:', projectData.project?.name);

        // 1. Calculate Loads for Each Room
        const roomCalculations = this.calculateRoomLoads(projectData.rooms, projectData.ambient);

        // 2. Aggregate Loads by Temperature Level
        const systemLoads = this.aggregateSystemLoads(roomCalculations);

        // 3. Select Equipment
        const equipment = this.selectSystemEquipment(systemLoads, roomCalculations, projectData.ambient);

        // 4. Calculate Pricing
        const pricing = this.calculateProjectPricing(equipment, projectData.project?.location);

        // 5. Generate Piping Schedule
        const piping = this.calculatePipingSchedule(systemLoads, equipment);

        return {
            project: projectData.project,
            designConditions: projectData.ambient,
            roomCalculations,
            systemLoads,
            equipment,
            piping,
            pricing,
            summary: this.generateSummary(systemLoads, pricing)
        };
    }

    // ==============================================================================
    // LOAD CALCULATIONS
    // ==============================================================================

    calculateRoomLoads(rooms, ambient) {
        return rooms.map(room => {
            // Default dimensions if missing
            const L = room.dimensions?.length || 10;
            const W = room.dimensions?.width || 10;
            const H = room.dimensions?.height || 6;
            const Vol = L * W * H;
            const Area = 2 * (L * W + L * H + W * H); // Total surface area

            const T_room = room.temperature || 0;
            const T_ambient = ambient.summerTemp || 35;
            const dT = T_ambient - T_room;

            // 1. Transmission Load
            // Q = U * A * dT
            // U-value approx: 0.22 W/m2K for 100mm PU, 0.15 for 150mm
            const insulationThickness = room.insulation?.thickness || 100; // mm
            const U_value = 0.022 / (insulationThickness / 1000); // k=0.022 W/mK for PU
            const q_trans = (U_value * Area * dT) / 1000; // kW

            // 2. Infiltration Load
            // Simplified: Volume * AirChanges * EnthalpyDiff
            let airChanges = 0;
            if (Vol < 100) airChanges = 8;
            else if (Vol < 500) airChanges = 4;
            else airChanges = 2;

            // Add door opening factor
            if (room.doorOpenings?.count > 0) {
                airChanges += (room.doorOpenings.count * 0.5);
            }

            // Enthalpy difference approx (kJ/m3)
            const enthalpyFactor = (dT * 1.5);
            const q_inf = (Vol * airChanges * enthalpyFactor) / (24 * 3600); // kW

            // 3. Product Load
            let q_prod = 0;
            if (room.productLoad) {
                const m = room.productLoad.mass || 0; // kg
                const t_in = room.productLoad.initialTemp || T_ambient;
                const t_out = room.productLoad.finalTemp || T_room;
                const time = room.productLoad.timeHours || 24;

                // Specific heats
                const cp_above = 3.2; // kJ/kgK (meat/poultry approx)
                const cp_below = 1.7;
                const h_latent = 235; // kJ/kg
                const t_freeze = -2; // Freezing point

                let heat_total = 0;

                if (t_in > t_freeze && t_out > t_freeze) {
                    // Cooling only
                    heat_total = m * cp_above * (t_in - t_out);
                } else if (t_in > t_freeze && t_out < t_freeze) {
                    // Freezing complete
                    const q_sens_1 = m * cp_above * (t_in - t_freeze);
                    const q_lat = m * h_latent;
                    const q_sens_2 = m * cp_below * (t_freeze - t_out);
                    heat_total = q_sens_1 + q_lat + q_sens_2;
                } else {
                    // Subcooling frozen
                    heat_total = m * cp_below * (t_in - t_out);
                }

                q_prod = heat_total / (time * 3600); // kW
            }

            // 4. Internal Loads
            // Lighting: 10 W/m2
            const q_light = (L * W * 10) / 1000;
            // People: 250W per person
            const people = Math.ceil((L * W) / 100); // 1 person per 100m2
            const q_people = (people * 250) / 1000;
            // Fans: 15% of other loads approx
            const q_fans = (q_trans + q_inf + q_prod + q_light + q_people) * 0.15;

            const total_raw = q_trans + q_inf + q_prod + q_light + q_people + q_fans;
            const total_load = total_raw * this.constants.safetyFactor;

            return {
                id: room.id || room.name,
                name: room.name,
                temperature: T_room,
                dimensions: { L, W, H, Vol },
                loads: {
                    transmission: parseFloat(q_trans.toFixed(2)),
                    infiltration: parseFloat(q_inf.toFixed(2)),
                    product: parseFloat(q_prod.toFixed(2)),
                    internal: parseFloat((q_light + q_people).toFixed(2)),
                    fans: parseFloat(q_fans.toFixed(2)),
                    total: parseFloat(total_load.toFixed(2))
                }
            };
        });
    }

    aggregateSystemLoads(roomCalculations) {
        const loads = {
            highTemp: { load: 0, rooms: [], temp: -10 }, // Chilling / Docks (+5 to -5) -> Evap -10
            lowTemp: { load: 0, rooms: [], temp: -30 },  // Storage (-18 to -25) -> Evap -30
            freezing: { load: 0, rooms: [], temp: -40 }  // Blast Freezing (-35 to -40) -> Evap -45
        };

        roomCalculations.forEach(room => {
            if (room.temperature < -30) {
                loads.freezing.load += room.loads.total;
                loads.freezing.rooms.push(room.id);
            } else if (room.temperature < -10) {
                loads.lowTemp.load += room.loads.total;
                loads.lowTemp.rooms.push(room.id);
            } else {
                loads.highTemp.load += room.loads.total;
                loads.highTemp.rooms.push(room.id);
            }
        });

        // Apply simultaneity factor for compressor sizing
        return {
            highTemp: { ...loads.highTemp, compressorLoad: loads.highTemp.load * this.constants.simultaneityFactor },
            lowTemp: { ...loads.lowTemp, compressorLoad: loads.lowTemp.load * this.constants.simultaneityFactor },
            freezing: { ...loads.freezing, compressorLoad: loads.freezing.load * this.constants.simultaneityFactor },
            totalPlantLoad: (loads.highTemp.load + loads.lowTemp.load + loads.freezing.load) * this.constants.simultaneityFactor
        };
    }

    // ==============================================================================
    // EQUIPMENT SELECTION
    // ==============================================================================

    selectSystemEquipment(systemLoads, roomCalculations, ambient) {
        const equipment = {
            evaporators: [],
            compressors: [],
            condensers: [],
            vessels: [],
            pumps: [],
            valves: []
        };

        // 1. Select Evaporators per Room
        roomCalculations.forEach(room => {
            const selectedEvaps = this.selectEvaporatorsForRoom(room);
            equipment.evaporators.push(...selectedEvaps);
        });

        // 2. Select Compressors per Circuit
        if (systemLoads.highTemp.compressorLoad > 0) {
            equipment.compressors.push(...this.selectCompressorSet(systemLoads.highTemp.compressorLoad, -10, 'High Stage'));
        }
        if (systemLoads.lowTemp.compressorLoad > 0) {
            equipment.compressors.push(...this.selectCompressorSet(systemLoads.lowTemp.compressorLoad, -30, 'Low Stage'));
        }
        if (systemLoads.freezing.compressorLoad > 0) {
            equipment.compressors.push(...this.selectCompressorSet(systemLoads.freezing.compressorLoad, -40, 'Booster Stage'));
        }

        // 3. Select Condensers
        const totalHeatRejection = systemLoads.totalPlantLoad * 1.3; // Approx THR factor
        equipment.condensers.push(...this.selectCondenserSet(totalHeatRejection, ambient));

        // 4. Select Vessels (Separators & Receivers)
        equipment.vessels.push(...this.selectVessels(systemLoads));

        // 5. Select Pumps
        equipment.pumps.push(...this.selectPumps(systemLoads));

        // 6. Select Valves
        equipment.valves.push(...this.selectValves(roomCalculations, equipment.vessels));

        return equipment;
    }

    selectEvaporatorsForRoom(room) {
        const requiredCap = room.loads.total;
        const temp = room.temperature;

        let type = 'chilling';
        if (temp < -30) type = 'blastFreezing';
        else if (temp < -10) type = 'freezing';

        const available = EQUIPMENT_DATABASE.evaporators[type];

        // Strategy: Try to fit with 1, 2, or 4 units
        // Prefer fewer units, but ensure coverage (throw)

        // Simple selection: Find unit that matches capacity/qty
        // Try 1 unit
        let bestFit = null;
        let qty = 1;

        // Try to find single unit
        let candidate = available.find(e => e.capacity >= requiredCap);

        if (!candidate) {
            // Try 2 units
            qty = 2;
            candidate = available.find(e => e.capacity >= requiredCap / 2);
        }

        if (!candidate) {
            // Try 4 units
            qty = 4;
            candidate = available.find(e => e.capacity >= requiredCap / 4);
        }

        // Fallback to largest
        if (!candidate) {
            candidate = available[available.length - 1];
            qty = Math.ceil(requiredCap / candidate.capacity);
        }

        return [{
            roomName: room.name,
            roomId: room.id,
            ...candidate,
            quantity: qty,
            totalCapacity: candidate.capacity * qty
        }];
    }

    selectCompressorSet(load, evapTemp, stageName) {
        // Select compressors to meet load with N+1 redundancy if possible
        // Or at least split load for reliability

        const tempKey = evapTemp <= -35 ? '-40C' : evapTemp <= -25 ? '-30C' : '-10C';
        const available = EQUIPMENT_DATABASE.compressors.screw; // Prefer screw for industrial

        // Sort by capacity at this temp
        const sorted = [...available].sort((a, b) => a.capacity[tempKey] - b.capacity[tempKey]);

        // Strategy: Select 2 or 3 compressors to share load
        // Target: 50% x 2 or 33% x 3

        let selected = [];
        let remainingLoad = load;

        // Simple logic: Use largest available until load met
        while (remainingLoad > 0) {
            // Find smallest compressor that is > 40% of remaining load (to avoid tiny compressors)
            let comp = sorted.find(c => c.capacity[tempKey] >= remainingLoad * 0.4);
            if (!comp) comp = sorted[sorted.length - 1]; // Use largest if none big enough

            selected.push({
                ...comp,
                stage: stageName,
                dutyCapacity: comp.capacity[tempKey],
                dutyPower: comp.power[tempKey]
            });

            remainingLoad -= comp.capacity[tempKey];

            // Safety break
            if (selected.length > 6) break;
        }

        // Add 1 redundant compressor (same as largest selected)
        if (selected.length > 0) {
            selected.push({
                ...selected[0],
                stage: stageName,
                role: 'Standby',
                dutyCapacity: selected[0].dutyCapacity,
                dutyPower: selected[0].dutyPower
            });
        }

        return selected;
    }

    selectCondenserSet(heatRejection, ambient) {
        // Decide type: Evaporative if humidity not too high, Air Cooled if water scarce or small plant
        // For industrial (>500kW), usually Evaporative

        const type = 'evaporative'; // Default for this scale
        const available = EQUIPMENT_DATABASE.condensers[type];

        // Select to meet THR
        let candidate = available.find(c => c.capacity >= heatRejection);
        let qty = 1;

        if (!candidate) {
            // Try multiple
            candidate = available[available.length - 1]; // Largest
            qty = Math.ceil(heatRejection / candidate.capacity);
        }

        return [{
            ...candidate,
            quantity: qty,
            totalCapacity: candidate.capacity * qty
        }];
    }

    selectVessels(systemLoads) {
        const vessels = [];
        const sepDB = EQUIPMENT_DATABASE.vessels.separators;
        const recDB = EQUIPMENT_DATABASE.vessels.receivers;

        // 1. Separators for each active circuit
        if (systemLoads.highTemp.load > 0) {
            // Rule of thumb: Volume (L) approx 10x Load (kW) for surge
            // Or use diameter based on velocity. Using simplified volume match here.
            const targetVol = systemLoads.highTemp.load * 2; // Simplified
            const sep = sepDB.find(s => s.volume >= targetVol) || sepDB[sepDB.length - 1];
            vessels.push({ ...sep, service: 'High Temp Separator (-10C)', quantity: 1 });
        }

        if (systemLoads.lowTemp.load > 0) {
            const targetVol = systemLoads.lowTemp.load * 3;
            const sep = sepDB.find(s => s.volume >= targetVol) || sepDB[sepDB.length - 1];
            vessels.push({ ...sep, service: 'Low Temp Separator (-30C)', quantity: 1 });
        }

        if (systemLoads.freezing.load > 0) {
            const targetVol = systemLoads.freezing.load * 3;
            const sep = sepDB.find(s => s.volume >= targetVol) || sepDB[sepDB.length - 1];
            vessels.push({ ...sep, service: 'Booster Separator (-40C)', quantity: 1 });
        }

        // 2. High Pressure Receiver
        // Capacity to hold charge of largest circuit + condenser
        const totalLoad = systemLoads.totalPlantLoad;
        const targetRecVol = totalLoad * 1.5; // Simplified
        const rec = recDB.find(r => r.volume >= targetRecVol) || recDB[recDB.length - 1];
        vessels.push({ ...rec, service: 'High Pressure Receiver', quantity: 1 });

        return vessels;
    }

    selectPumps(systemLoads) {
        const pumps = [];
        const pumpDB = EQUIPMENT_DATABASE.pumps.ammonia;

        // Select pumps for each separator (N+1)
        ['highTemp', 'lowTemp', 'freezing'].forEach(circuit => {
            if (systemLoads[circuit].load > 0) {
                // Circulation rate 3:1 or 4:1
                // Mass flow m_dot = Q / dH_vap approx
                // Vol flow V_dot = m_dot / rho
                // Simplified: 1 m3/h per 100 kW approx for 4:1
                const flowReq = (systemLoads[circuit].load / 100) * 4;

                const pump = pumpDB.find(p => p.flow >= flowReq) || pumpDB[pumpDB.length - 1];

                pumps.push({
                    ...pump,
                    service: `${circuit} Circulation Pump`,
                    quantity: 2 // 1 Duty + 1 Standby
                });
            }
        });

        return pumps;
    }

    selectValves(roomCalculations, vessels) {
        const valves = [];
        const valveDB = EQUIPMENT_DATABASE.valves;

        // 1. Evaporator Valve Stations (1 per evap)
        // Solenoid + Check + Stop + Regulating
        roomCalculations.forEach(room => {
            // Simplified sizing based on load
            // < 20kW: DN20, < 50kW: DN32, < 100kW: DN50
            let size = 'DN20';
            if (room.loads.total > 100) size = 'DN65';
            else if (room.loads.total > 50) size = 'DN50';
            else if (room.loads.total > 20) size = 'DN32';

            valves.push({
                station: `Evap Station - ${room.name}`,
                items: [
                    { ...valveDB.solenoid.find(v => v.size === size), qty: 1 },
                    { ...valveDB.stop.find(v => v.size === size), qty: 3 }, // Inlet, Outlet, Bypass
                    { ...valveDB.control.find(v => v.size === size), qty: 1 } // Suction regulator
                ]
            });
        });

        return valves;
    }

    // ==============================================================================
    // PRICING & PIPING
    // ==============================================================================

    calculateProjectPricing(equipment, location) {
        const factor = getRegionalFactor(location).factor;

        const totals = {
            economic: 0,
            best: 0,
            premium: 0
        };

        const itemized = [];

        // Helper to process list
        const processList = (list, category) => {
            list.forEach(item => {
                if (!item.pricing) return;

                const qty = item.quantity || 1;
                const eco = item.pricing.economic * qty * factor;
                const best = item.pricing.best * qty * factor;
                const prem = item.pricing.premium * qty * factor;

                totals.economic += eco;
                totals.best += best;
                totals.premium += prem;

                itemized.push({
                    category,
                    name: `${item.manufacturer || ''} ${item.model || item.service}`,
                    quantity: qty,
                    unitPrice: {
                        economic: item.pricing.economic * factor,
                        best: item.pricing.best * factor,
                        premium: item.pricing.premium * factor
                    },
                    totalPrice: {
                        economic: eco,
                        best: best,
                        premium: prem
                    }
                });
            });
        };

        processList(equipment.compressors, 'Compressors');
        processList(equipment.evaporators, 'Evaporators');
        processList(equipment.condensers, 'Condensers');
        processList(equipment.vessels, 'Vessels');
        processList(equipment.pumps, 'Pumps');

        // Flatten valve stations
        equipment.valves.forEach(station => {
            station.items.forEach(v => {
                if (v.pricing) {
                    const qty = v.qty || 1;
                    const eco = v.pricing.economic * qty * factor;
                    const best = v.pricing.best * qty * factor;
                    const prem = v.pricing.premium * qty * factor;

                    totals.economic += eco;
                    totals.best += best;
                    totals.premium += prem;

                    itemized.push({
                        category: 'Valves',
                        name: `${v.model} (${station.station})`,
                        quantity: qty,
                        unitPrice: {
                            economic: v.pricing.economic * factor,
                            best: v.pricing.best * factor,
                            premium: v.pricing.premium * factor
                        },
                        totalPrice: {
                            economic: eco,
                            best: best,
                            premium: prem
                        }
                    });
                }
            });
        });

        return { totals, itemized, currency: 'USD' };
    }

    calculatePipingSchedule(systemLoads, equipment) {
        // Simplified piping schedule generation
        return [
            { service: 'Suction Line - Low Temp', size: 'DN200', material: 'Carbon Steel Sch 40' },
            { service: 'Suction Line - High Temp', size: 'DN150', material: 'Carbon Steel Sch 40' },
            { service: 'Liquid Line - Main', size: 'DN100', material: 'Carbon Steel Sch 80' },
            { service: 'Hot Gas Line', size: 'DN125', material: 'Carbon Steel Sch 40' },
            { service: 'Water Lines', size: 'DN150', material: 'Galvanized Steel' }
        ];
    }

    generateSummary(systemLoads, pricing) {
        return {
            totalCoolingCapacity: systemLoads.totalPlantLoad.toFixed(1) + ' kW',
            estimatedCost: `$${(pricing.totals.best).toLocaleString()} (Best Value)`,
            powerConsumption: 'Approx. ' + (systemLoads.totalPlantLoad / 3.5).toFixed(0) + ' kW' // COP approx 3.5
        };
    }
}

module.exports = new EnhancedAmmoniaCalculator();
