/**
 * LoadCalculator Module
 * 
 * Calculates cooling loads for refrigerated spaces based on:
 * - ASHRAE Handbook of Refrigeration
 * - EN 13215 (Heat exchangers)
 * 
 * Components:
 * 1. Transmission Load (walls, floor, ceiling)
 * 2. Product Load (sensible + latent heat)
 * 3. Infiltration Load (door openings, air exchange)
 * 4. Internal Gains (people, lights, motors, equipment)
 * 
 * @author GFDDE AI Engine
 * @version 2.0.0
 */

class LoadCalculator {
    constructor(engine) {
        this.engine = engine;
        this.materials = null;
        this.products = null;

        // Safety factors by application
        this.safetyFactors = {
            'storage': 1.10,      // 10% safety
            'processing': 1.15,   // 15% for processing areas
            'blast': 1.20,        // 20% for blast freezers
            'tunnel': 1.25        // 25% for tunnels
        };

        // People heat gain (W per person)
        this.peopleHeatGain = {
            '+10': { sensible: 150, latent: 150 },
            '0': { sensible: 170, latent: 130 },
            '-10': { sensible: 190, latent: 110 },
            '-20': { sensible: 210, latent: 90 },
            '-30': { sensible: 230, latent: 70 },
            '-40': { sensible: 240, latent: 60 }
        };
    }

    /**
     * Calculate complete cooling load for a room
     * @param {Object} room - Room definition
     * @param {Object} project - Project context
     * @returns {Object} Detailed load breakdown
     */
    async calculateRoom(room, project) {
        // Load data if not cached
        if (!this.materials) {
            this.materials = this.engine.getData('materials');
        }
        if (!this.products) {
            this.products = this.engine.getData('products');
        }

        // Normalize room with defaults to prevent undefined errors
        const safeRoom = {
            name: room.name || 'Room',
            length: Number(room.length) || 10,
            width: Number(room.width) || 10,
            height: Number(room.height) || 4,
            temperature: Number(room.temperature) || -18,
            type: room.type || 'storage',
            // Optional properties with defaults
            occupancy: Number(room.occupancy) || 1,
            occupancyHours: Number(room.occupancyHours) || 8,
            lightingPower: Number(room.lightingPower) || 5,
            lightingHours: Number(room.lightingHours) || 12,
            equipmentPower: Number(room.equipmentPower) || 0,
            equipmentHours: Number(room.equipmentHours) || 4,
            product: room.product || null,
            insulation: room.insulation || null,
            door: room.door || null,
            doorProtection: room.doorProtection || 0.7 // Strip curtain default
        };

        const results = {
            roomName: safeRoom.name,
            dimensions: {
                length: safeRoom.length,
                width: safeRoom.width,
                height: safeRoom.height,
                volume: safeRoom.length * safeRoom.width * safeRoom.height,
                floorArea: safeRoom.length * safeRoom.width,
                wallArea: 2 * (safeRoom.length + safeRoom.width) * safeRoom.height,
                ceilingArea: safeRoom.length * safeRoom.width
            },
            temperature: safeRoom.temperature,
            ambientTemp: project.climate?.summerDB || 35
        };

        // Calculate each component using normalized safeRoom
        results.transmission = this._calculateTransmission(safeRoom, project);
        results.product = this._calculateProductLoad(safeRoom, project);
        results.infiltration = this._calculateInfiltration(safeRoom, project);
        results.internal = this._calculateInternalGains(safeRoom, project);

        // Sum components
        results.subtotal =
            results.transmission.total +
            results.product.total +
            results.infiltration.total +
            results.internal.total;

        // Apply safety factor
        const roomType = safeRoom.type;
        results.safetyFactor = this.safetyFactors[roomType] || 1.15;
        results.total = results.subtotal * results.safetyFactor;

        // Round to 2 decimal places
        results.total = Math.round(results.total * 100) / 100;
        results.totalTR = Math.round((results.total / 3.517) * 100) / 100;

        return results;
    }

    // ============================================================
    // TRANSMISSION LOAD (Q = U × A × ΔT)
    // ============================================================

    _calculateTransmission(room, project) {
        const ambientTemp = project.climate?.summerDB || 35;
        const roomTemp = room.temperature;
        const deltaT = ambientTemp - roomTemp;

        // Get insulation properties
        const insulation = room.insulation || {
            type: 'polyurethane_40',
            thickness: this._getRecommendedThickness(roomTemp)
        };

        const insulationProps = this.materials?.insulation?.[insulation.type] || {
            thermalConductivity: 0.024
        };

        // Calculate U-value for sandwich panel
        // U = 1 / (Rsi + R_insulation + Rse)
        const Rsi = 0.13;  // Internal surface resistance
        const Rse = 0.04;  // External surface resistance
        const R_insulation = insulation.thickness / 1000 / insulationProps.thermalConductivity;
        const U_wall = 1 / (Rsi + R_insulation + Rse);

        // Wall area calculation
        const wallArea = 2 * (room.length + room.width) * room.height;
        const ceilingArea = room.length * room.width;
        const floorArea = room.length * room.width;

        // Calculate loads
        const wallLoad = U_wall * wallArea * deltaT / 1000;  // kW
        const ceilingLoad = U_wall * ceilingArea * deltaT / 1000;

        // Floor load (ground factor)
        const groundTemp = 15;  // Assumed ground temperature
        const floorDeltaT = groundTemp - roomTemp;
        const U_floor = U_wall * 0.8;  // Floor has additional insulation from ground
        const floorLoad = U_floor * floorArea * floorDeltaT / 1000;

        return {
            walls: Math.round(wallLoad * 100) / 100,
            ceiling: Math.round(ceilingLoad * 100) / 100,
            floor: Math.round(floorLoad * 100) / 100,
            total: Math.round((wallLoad + ceilingLoad + floorLoad) * 100) / 100,
            parameters: {
                U_value: Math.round(U_wall * 1000) / 1000,
                deltaT: deltaT,
                insulationType: insulation.type,
                insulationThickness: insulation.thickness
            }
        };
    }

    _getRecommendedThickness(roomTemp) {
        if (roomTemp >= 0) return 100;
        if (roomTemp >= -10) return 100;
        if (roomTemp >= -18) return 120;
        if (roomTemp >= -25) return 150;
        if (roomTemp >= -35) return 175;
        return 200;  // For -40 and below
    }

    // ============================================================
    // PRODUCT LOAD (Sensible + Latent) - ASHRAE Based
    // ============================================================

    _calculateProductLoad(room, project) {
        const product = room.product || project.product;
        if (!product) {
            return { total: 0, sensible: 0, latent: 0, note: 'No product specified' };
        }

        // Get product properties from database
        let productProps = this._getProductProperties(product.type);

        // INTELLIGENT PRODUCT MASS CALCULATION based on room type
        // Instead of using unrealistic stacking density, use practical throughput
        const volume = room.length * room.width * room.height;
        let productMass = 0;
        let cycleTime = 24; // default 24 hours
        let calculationMethod = '';

        // Check if user provided explicit product mass/throughput
        if (product.mass || product.dailyThroughput || room.dailyThroughput) {
            productMass = product.mass || product.dailyThroughput || room.dailyThroughput;
            calculationMethod = 'user_specified';
        } else {
            // Intelligent estimation based on room type
            const roomType = room.type?.toLowerCase() || 'storage';

            switch (roomType) {
                case 'tunnel':
                case 'blast':
                    // Blast freezer: High turnover, 2-4 hour cycles
                    // Typical capacity: 50-100 kg/m³ floor area per batch
                    const floorArea = room.length * room.width;
                    productMass = floorArea * 80; // 80 kg per m² floor
                    cycleTime = room.cycleTime || 4; // 4 hour default for blast
                    calculationMethod = 'blast_freezer_estimate';
                    break;

                case 'chilling':
                case 'chill':
                    // Chilling room: Continuous flow, based on production
                    // For slaughterhouse: ~50kg/m² floor, 12-24h cycle
                    productMass = (room.length * room.width) * 50;
                    cycleTime = room.cycleTime || 12;
                    calculationMethod = 'chilling_estimate';
                    break;

                case 'precooler':
                case 'precool':
                    // Pre-cooler: High turnover, 6-12 hour cycles
                    productMass = (room.length * room.width) * 60;
                    cycleTime = room.cycleTime || 8;
                    calculationMethod = 'precooler_estimate';
                    break;

                case 'storage':
                case 'holding':
                default:
                    // Storage: Low turnover - 5-10% of static capacity per day
                    // Static capacity: ~300 kg/m³, Daily turnover: 5%
                    const staticCapacity = volume * 0.6 * 300; // 60% utilization, 300 kg/m³
                    const dailyTurnover = 0.05; // 5% daily
                    productMass = staticCapacity * dailyTurnover;
                    cycleTime = 24;
                    calculationMethod = 'storage_turnover_estimate';
                    break;
            }
        }

        // Entry and exit temperatures
        const entryTemp = product.entryTemp || room.entryTemp ||
            (room.type === 'tunnel' ? 5 : 25); // Tunnel gets pre-chilled product
        const exitTemp = room.temperature;
        const freezingPoint = productProps.freezingPoint || -2;

        let sensibleLoad = 0;
        let latentLoad = 0;

        if (entryTemp > freezingPoint && exitTemp < freezingPoint) {
            // Cooling + Freezing (phase change)
            // Above freezing: Q1 = m × Cp_above × (T_entry - T_freeze)
            sensibleLoad += productMass * productProps.specificHeatAboveFreezing *
                (entryTemp - freezingPoint);
            // Latent heat of freezing: Q2 = m × hf
            latentLoad = productMass * productProps.latentHeat;
            // Below freezing: Q3 = m × Cp_below × (T_freeze - T_exit)
            sensibleLoad += productMass * productProps.specificHeatBelowFreezing *
                (freezingPoint - exitTemp);
        } else if (entryTemp > exitTemp) {
            // Cooling only (no phase change)
            const Cp = entryTemp > freezingPoint ?
                productProps.specificHeatAboveFreezing :
                productProps.specificHeatBelowFreezing;
            sensibleLoad = productMass * Cp * (entryTemp - exitTemp);
        }

        // Convert to kW (divide by cycle time in seconds)
        // Q (kJ) / time (s) = kW
        const cycleTimeSeconds = cycleTime * 3600;
        sensibleLoad = sensibleLoad / cycleTimeSeconds;
        latentLoad = latentLoad / cycleTimeSeconds;

        // Add respiration heat if applicable (for fruits/vegetables at temps > -2°C)
        let respirationLoad = 0;
        if (productProps.respirationRate && room.temperature > -2) {
            respirationLoad = productMass * productProps.respirationRate / 1000 / 24;
        }

        return {
            sensible: Math.round(sensibleLoad * 100) / 100,
            latent: Math.round(latentLoad * 100) / 100,
            respiration: Math.round(respirationLoad * 100) / 100,
            total: Math.round((sensibleLoad + latentLoad + respirationLoad) * 100) / 100,
            parameters: {
                productType: product.type,
                productMass: Math.round(productMass),
                entryTemp: entryTemp,
                exitTemp: exitTemp,
                cycleTime: cycleTime,
                calculationMethod: calculationMethod
            }
        };
    }

    _getProductProperties(productType) {
        // ASHRAE Handbook of Refrigeration, Chapter 9 - Thermal Properties
        const productDb = {
            // Meat products
            'beef': { specificHeatAboveFreezing: 3.08, specificHeatBelowFreezing: 1.67, latentHeat: 233, freezingPoint: -2.2, waterContent: 0.68 },
            'pork': { specificHeatAboveFreezing: 2.85, specificHeatBelowFreezing: 1.63, latentHeat: 213, freezingPoint: -2.1, waterContent: 0.60 },
            'chicken': { specificHeatAboveFreezing: 3.31, specificHeatBelowFreezing: 1.55, latentHeat: 247, freezingPoint: -2.8, waterContent: 0.74 },
            'poultry': { specificHeatAboveFreezing: 3.31, specificHeatBelowFreezing: 1.55, latentHeat: 247, freezingPoint: -2.8, waterContent: 0.74 },
            'fish': { specificHeatAboveFreezing: 3.60, specificHeatBelowFreezing: 1.76, latentHeat: 269, freezingPoint: -2.0, waterContent: 0.80 },

            // Dairy
            'milk': { specificHeatAboveFreezing: 3.89, specificHeatBelowFreezing: 1.84, latentHeat: 289, freezingPoint: -0.6, waterContent: 0.87 },
            'butter': { specificHeatAboveFreezing: 1.38, specificHeatBelowFreezing: 1.05, latentHeat: 53, freezingPoint: -0.6, waterContent: 0.16 },
            'cheese': { specificHeatAboveFreezing: 2.51, specificHeatBelowFreezing: 1.42, latentHeat: 136, freezingPoint: -5.6, waterContent: 0.40 },

            // Fruits & Vegetables
            'apple': { specificHeatAboveFreezing: 3.81, specificHeatBelowFreezing: 1.80, latentHeat: 279, freezingPoint: -1.5, waterContent: 0.84, respirationRate: 0.02 },
            'potato': { specificHeatAboveFreezing: 3.52, specificHeatBelowFreezing: 1.72, latentHeat: 254, freezingPoint: -1.7, waterContent: 0.76, respirationRate: 0.015 },
            'tomato': { specificHeatAboveFreezing: 3.98, specificHeatBelowFreezing: 1.87, latentHeat: 314, freezingPoint: -0.6, waterContent: 0.94, respirationRate: 0.025 },

            // Ice cream & Frozen foods
            'icecream': { specificHeatAboveFreezing: 3.27, specificHeatBelowFreezing: 1.67, latentHeat: 211, freezingPoint: -5.5, waterContent: 0.63 },
            'frozen_vegetables': { specificHeatAboveFreezing: 3.73, specificHeatBelowFreezing: 1.77, latentHeat: 273, freezingPoint: -1.0, waterContent: 0.82 }
        };

        // Try to find in local database first
        if (productDb[productType?.toLowerCase()]) {
            return productDb[productType.toLowerCase()];
        }

        // Try external products database
        if (this.products) {
            for (const category of Object.values(this.products)) {
                if (category[productType]) {
                    return category[productType];
                }
            }
        }

        // Default properties (chicken/poultry - most common cold storage)
        return {
            specificHeatAboveFreezing: 3.31,  // kJ/kg·K (ASHRAE)
            specificHeatBelowFreezing: 1.55,  // kJ/kg·K (ASHRAE)
            latentHeat: 247,                   // kJ/kg (ASHRAE)
            freezingPoint: -2.5,               // °C
            waterContent: 0.74                 // fraction
        };
    }

    // ============================================================
    // INFILTRATION LOAD (Air exchange through doors)
    // ============================================================

    _calculateInfiltration(room, project) {
        const ambientTemp = project.climate?.summerDB || 35;
        const roomTemp = room.temperature;

        // Door specifications
        const door = room.door || {
            width: 2.5,     // meters
            height: 2.8,    // meters
            openingsPerDay: 10,
            openDuration: 10  // minutes per opening
        };

        // Calculate total open time per day
        const totalOpenTime = door.openingsPerDay * door.openDuration;  // minutes

        // If door never opens, no infiltration
        if (totalOpenTime === 0) {
            return {
                total: 0,
                parameters: {
                    airChangesPerDay: 0,
                    doorOpenTimeMinutes: 0,
                    enthalpyDifference: 0,
                    protectionFactor: 1.0
                }
            };
        }

        // Calculate air change rate using Gosney-Olama equation
        const doorArea = door.width * door.height;
        const roomVolume = room.length * room.width * room.height;

        // Density factor - use absolute value to avoid NaN
        const rhoOut = 1.2;  // kg/m³ at ambient
        const rhoIn = this._getAirDensity(roomTemp);
        const densityRatio = Math.abs(rhoOut - rhoIn) / (rhoOut + rhoIn);
        const densityFactor = Math.sqrt(densityRatio);

        // Flow rate through door (m³/s)
        const Cd = 0.8;  // Discharge coefficient
        const g = 9.81;  // gravity
        const Q_door = Cd * doorArea * Math.sqrt(g * door.height) * densityFactor / 3;

        // Air changes per day
        const airChanges = Q_door * totalOpenTime * 60 / roomVolume;

        // Enthalpy difference - simplified for very low temps
        const h_out = this._getAirEnthalpy(ambientTemp, 50);  // 50% RH outside
        const h_in = this._getAirEnthalpy(Math.max(roomTemp, -40), 90);  // Limit to -40 for calculation
        const delta_h = Math.abs(h_out - h_in);

        // Infiltration load
        const infiltrationLoad = roomVolume * airChanges * rhoIn * delta_h / (24 * 3600);

        // Door protection factor (strip curtain, air curtain, etc.)
        const protectionFactor = room.doorProtection || 1.0;

        return {
            total: Math.round(infiltrationLoad * protectionFactor * 100) / 100,
            parameters: {
                airChangesPerDay: Math.round(airChanges * 10) / 10,
                doorOpenTimeMinutes: totalOpenTime,
                enthalpyDifference: Math.round(delta_h * 10) / 10,
                protectionFactor: protectionFactor
            }
        };
    }

    _getAirDensity(temp) {
        // Simplified air density calculation
        return 1.293 * 273 / (273 + temp);
    }

    _getAirEnthalpy(temp, rh) {
        // Simplified enthalpy calculation (kJ/kg)
        // h = Cp_air * T + w * (2501 + Cp_vapor * T)
        const pSat = 0.611 * Math.exp(17.27 * temp / (temp + 237.3));
        const w = 0.622 * rh / 100 * pSat / (101.325 - rh / 100 * pSat);
        return 1.006 * temp + w * (2501 + 1.86 * temp);
    }

    // ============================================================
    // INTERNAL GAINS (People, Lights, Equipment)
    // ============================================================

    _calculateInternalGains(room, project) {
        // People load
        const numPeople = room.occupancy || 1;
        const occupancyHours = room.occupancyHours || 8;

        // Get heat gain with fallback to prevent undefined errors
        const heatGain = this._getPeopleHeatGain(room.temperature) || { sensible: 200, latent: 100 };
        const peopleLoad = numPeople * ((heatGain.sensible || 200) + (heatGain.latent || 100)) *
            occupancyHours / 24 / 1000;

        // Lighting load
        const lightingPower = room.lightingPower || 0;  // W/m²
        const lightingHours = room.lightingHours || 12;
        const floorArea = (room.length || 10) * (room.width || 10); // Default dimensions if not provided
        const lightingLoad = lightingPower * floorArea * lightingHours / 24 / 1000;

        // Equipment/forklift load
        const equipmentPower = room.equipmentPower || 0;  // kW
        const equipmentHours = room.equipmentHours || 4;
        const equipmentLoad = equipmentPower * equipmentHours / 24;

        // Fan motor heat (evaporator fans)
        // This is typically added later after evaporator selection
        const fanLoad = 0;

        return {
            people: Math.round(peopleLoad * 100) / 100,
            lighting: Math.round(lightingLoad * 100) / 100,
            equipment: Math.round(equipmentLoad * 100) / 100,
            fans: fanLoad,
            total: Math.round((peopleLoad + lightingLoad + equipmentLoad + fanLoad) * 100) / 100,
            parameters: {
                numPeople: numPeople,
                occupancyHours: occupancyHours,
                lightingPower: lightingPower,
                equipmentPower: equipmentPower
            }
        };
    }

    _getPeopleHeatGain(roomTemp) {
        // Find closest temperature match
        // Note: Keys include '+10', '0', '-10', etc.
        const keyMap = {};
        for (const key of Object.keys(this.peopleHeatGain)) {
            keyMap[Number(key)] = key; // Map numeric value to original string key
        }
        const temps = Object.keys(keyMap).map(Number).sort((a, b) => b - a);

        for (const t of temps) {
            if (roomTemp >= t) {
                const originalKey = keyMap[t];
                return this.peopleHeatGain[originalKey];
            }
        }
        return this.peopleHeatGain['-40'];
    }

    // ============================================================
    // UTILITY METHODS
    // ============================================================

    /**
     * Calculate quick estimate for room load (kW/m³)
     * Based on ASHRAE Handbook typical values for cold storage
     * 
     * Typical ranges (W/m³):
     * - Chiller (0-5°C): 25-35 W/m³
     * - Cold storage (-18°C): 30-45 W/m³  
     * - Deep freeze (-25°C): 35-55 W/m³
     * - Blast freeze (-35 to -40°C): 50-80 W/m³
     * 
     * @param {number} roomTemp - Room temperature °C
     * @param {number} ambientTemp - Ambient temperature °C
     * @returns {number} Load factor kW/m³
     */
    getQuickLoadFactor(roomTemp, ambientTemp = 35) {
        const deltaT = ambientTemp - roomTemp;

        // ASHRAE-based empirical factors (W/m³ per degree)
        // Adjusted for typical insulation quality and operating conditions
        let baseLoad;  // W/m³

        if (roomTemp >= 5) {
            // Above 5°C (cooling only): 25-30 W/m³
            baseLoad = 25 + (deltaT * 0.3);
        } else if (roomTemp >= 0) {
            // Chiller (0-5°C): 28-35 W/m³
            baseLoad = 28 + (deltaT * 0.35);
        } else if (roomTemp >= -18) {
            // Cold storage (-1 to -18°C): 30-45 W/m³
            baseLoad = 32 + (deltaT * 0.25);
        } else if (roomTemp >= -25) {
            // Deep freeze (-18 to -25°C): 40-55 W/m³
            baseLoad = 40 + (deltaT * 0.2);
        } else if (roomTemp >= -35) {
            // Low temp (-25 to -35°C): 50-70 W/m³
            baseLoad = 50 + (deltaT * 0.22);
        } else {
            // Blast/Ultra-low (-35 to -45°C): 60-90 W/m³
            baseLoad = 60 + (deltaT * 0.25);
        }

        return baseLoad / 1000;  // Convert to kW/m³
    }
}

module.exports = LoadCalculator;
