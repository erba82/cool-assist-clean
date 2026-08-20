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

        // Preserve only explicit SI inputs.  Zero is a valid operational value for
        // occupancy, lighting and door-open time; it must not become a hidden default.
        const finiteOrNull = (value) => {
            const number = Number(value);
            return Number.isFinite(number) ? number : null;
        };
        const nonNegativeOrZero = (value) => {
            const number = finiteOrNull(value);
            return number !== null && number >= 0 ? number : 0;
        };
        const safeRoom = {
            name: room.name || 'Room',
            length: finiteOrNull(room.length),
            width: finiteOrNull(room.width),
            height: finiteOrNull(room.height),
            temperature: finiteOrNull(room.temperature),
            type: room.type || 'storage',
            occupancy: nonNegativeOrZero(room.occupancy),
            occupancyHours: nonNegativeOrZero(room.occupancyHours),
            lightingPower: nonNegativeOrZero(room.lightingPower),
            lightingHours: nonNegativeOrZero(room.lightingHours),
            equipmentPower: nonNegativeOrZero(room.equipmentPower),
            equipmentHours: nonNegativeOrZero(room.equipmentHours),
            product: room.product || null,
            insulation: room.insulation || null,
            floorUFactor: finiteOrNull(room.floorUFactor),
            door: room.door || null,
            doorProtection: finiteOrNull(room.doorProtection),
            specifiedCoolingLoadKW: (() => {
                // A project-total load can govern one-room designs only.  For
                // multi-room projects, each room must carry an allocated design load.
                const projectTotalEligible = Array.isArray(project?.rooms) && project.rooms.length === 1
                    ? (project.specifiedCoolingLoadKW ?? project.capacity) : null;
                // `capacity` is retained as a legacy/API alias only when it is
                // explicitly present in the design request; it is never inferred.
                const value = finiteOrNull(room.specifiedCoolingLoadKW ?? room.coolingLoadKW ?? room.capacity ?? projectTotalEligible);
                return value !== null && value > 0 ? value : null;
            })(),
            designLoadBasis: room.designLoadBasis || null,
            loadAllowanceFactor: (() => {
                const value = finiteOrNull(room.loadAllowanceFactor ?? project.loadAllowanceFactor);
                return value !== null && value >= 1 ? value : 1;
            })()
        };
        const ambientTemp = finiteOrNull(project?.climate?.summerDB);
        const geometryIsComplete = [safeRoom.length, safeRoom.width, safeRoom.height].every((value) => value !== null && value > 0);
        const inputIssues = [];
        if (!geometryIsComplete) inputIssues.push('Room length, width and height in metres are required for component load calculation.');
        if (safeRoom.temperature === null) inputIssues.push('Room design temperature in °C is required for component load calculation.');
        if (ambientTemp === null) inputIssues.push('Site summer dry-bulb temperature in °C is required for component load calculation.');

        const results = {
            roomName: safeRoom.name,
            dimensions: geometryIsComplete ? {
                length: safeRoom.length,
                width: safeRoom.width,
                height: safeRoom.height,
                volume: safeRoom.length * safeRoom.width * safeRoom.height,
                floorArea: safeRoom.length * safeRoom.width,
                wallArea: 2 * (safeRoom.length + safeRoom.width) * safeRoom.height,
                ceilingArea: safeRoom.length * safeRoom.width
            } : null,
            temperature: safeRoom.temperature,
            ambientTemp,
            calculationStatus: inputIssues.length ? 'input-required' : 'calculated',
            inputIssues
        };

        // Never manufacture envelope, product or infiltration loads from defaults.
        if (inputIssues.length) {
            if (!safeRoom.specifiedCoolingLoadKW) {
                throw new Error(`Room ${safeRoom.name}: ${inputIssues.join(' ')}`);
            }
            results.transmission = { total: 0, status: 'input-required', issues: inputIssues };
            results.product = { total: 0, status: 'input-required', issues: inputIssues };
            results.infiltration = { total: 0, status: 'input-required', issues: inputIssues };
            results.internal = { total: 0, status: 'input-required', issues: inputIssues };
        } else {
            results.transmission = this._calculateTransmission(safeRoom, project);
            results.product = this._calculateProductLoad(safeRoom, project);
            results.infiltration = this._calculateInfiltration(safeRoom, project);
            results.internal = this._calculateInternalGains(safeRoom, project);
        }

        const componentIssues = [results.transmission, results.product, results.infiltration, results.internal]
            .filter((component) => component?.status === 'input-required')
            .flatMap((component) => component.issues || []);
        if (componentIssues.length) {
            results.calculationStatus = 'input-required';
            results.inputIssues = [...results.inputIssues, ...componentIssues];
        }

        // Sum only explicitly calculated components.  The status above prevents a
        // partial subtotal from being presented as a complete thermal load.
        results.subtotal =
            results.transmission.total +
            results.product.total +
            results.infiltration.total +
            results.internal.total;

        // A load allowance is a project-design decision, not an unstated generic
        // safety factor.  Use 1.0 unless the designer supplied a documented factor.
        results.safetyFactor = safeRoom.loadAllowanceFactor;
        results.total = results.subtotal * results.safetyFactor;

        // Round to 2 decimal places
        results.total = Math.round(results.total * 100) / 100;
        if (Number.isFinite(safeRoom.specifiedCoolingLoadKW) && safeRoom.specifiedCoolingLoadKW > 0) {
            results.calculatedThermalLoad = results.total;
            results.total = safeRoom.specifiedCoolingLoadKW;
            results.designLoad = {
                basis: safeRoom.designLoadBasis || 'user-specified-design-load',
                specifiedCoolingLoadKW: safeRoom.specifiedCoolingLoadKW,
                calculatedThermalLoadKW: results.calculatedThermalLoad,
                note: 'User-specified design cooling load governs equipment sizing; component heat-load calculation is retained for engineering review.'
            };
        }
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

        // Envelope U-values require declared material and thickness.  Do not use
        // an inferred panel type or thickness in an engineering calculation.
        const insulation = room.insulation;
        if (!insulation?.type || !Number.isFinite(Number(insulation.thickness)) || Number(insulation.thickness) <= 0) {
            return { walls: 0, ceiling: 0, floor: 0, total: 0, status: 'input-required', issues: ['Declared insulation type and thickness in mm are required for transmission load.'] };
        }
        const insulationProps = this.materials?.insulation?.[insulation.type];
        if (!insulationProps || !Number.isFinite(Number(insulationProps.thermalConductivity)) || Number(insulationProps.thermalConductivity) <= 0) {
            return { walls: 0, ceiling: 0, floor: 0, total: 0, status: 'input-required', issues: [`No validated thermal-conductivity record is available for insulation type ${insulation.type}.`] };
        }

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

        // Ground/floor boundary conditions must come from the project.  Keep the
        // wall/ceiling result visible, but mark the aggregate as input-required if
        // the floor state has not been supplied.
        const groundTemp = Number(project?.climate?.groundTemperatureC ?? project?.groundTemperatureC);
        const floorUFactor = Number(room.floorUFactor);
        const hasFloorInputs = Number.isFinite(groundTemp) && Number.isFinite(floorUFactor) && floorUFactor > 0;
        const floorDeltaT = hasFloorInputs ? groundTemp - roomTemp : null;
        const U_floor = hasFloorInputs ? U_wall * floorUFactor : null;
        const floorLoad = hasFloorInputs ? U_floor * floorArea * floorDeltaT / 1000 : 0;

        return {
            walls: Math.round(wallLoad * 100) / 100,
            ceiling: Math.round(ceilingLoad * 100) / 100,
            floor: Math.round(floorLoad * 100) / 100,
            total: Math.round((wallLoad + ceilingLoad + floorLoad) * 100) / 100,
            status: hasFloorInputs ? 'calculated' : 'input-required',
            issues: hasFloorInputs ? [] : ['Ground temperature and floor U-factor must be supplied before the total transmission load is complete.'],
            parameters: {
                U_value: Math.round(U_wall * 1000) / 1000,
                deltaT: deltaT,
                insulationType: insulation.type,
                insulationThickness: insulation.thickness,
                groundTemperatureC: hasFloorInputs ? groundTemp : null,
                floorUFactor: hasFloorInputs ? floorUFactor : null
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
        if (!product?.type) {
            return { total: 0, sensible: 0, latent: 0, status: 'input-required', issues: ['Product type and a traceable product-property source are required to calculate product load.'] };
        }

        const productProps = this._getProductProperties(product.type);
        if (!productProps) {
            return { total: 0, sensible: 0, latent: 0, status: 'input-required', issues: [`No validated thermal-property record is available for product type ${product.type}.`] };
        }

        // Product heat load requires an explicit mass basis.  Storage volume and
        // room type are not a defensible substitute for actual throughput.
        const batchMass = Number(product.mass ?? room.productMass);
        const dailyThroughput = Number(product.dailyThroughput ?? room.dailyThroughput);
        const explicitCycleTime = Number(product.cycleTime ?? room.cycleTime);
        let productMass = null;
        let cycleTime = null;
        let calculationMethod = null;
        if (Number.isFinite(batchMass) && batchMass > 0 && Number.isFinite(explicitCycleTime) && explicitCycleTime > 0) {
            productMass = batchMass;
            cycleTime = explicitCycleTime;
            calculationMethod = 'explicit-batch-mass-and-cycle-time';
        } else if (Number.isFinite(dailyThroughput) && dailyThroughput > 0) {
            productMass = dailyThroughput;
            cycleTime = 24;
            calculationMethod = 'explicit-daily-throughput';
        } else {
            return { total: 0, sensible: 0, latent: 0, status: 'input-required', issues: ['Provide batch mass with cycle time, or daily throughput, for product-load calculation.'], parameters: { productType: product.type } };
        }

        // Entry temperature must come from the process specification; it cannot
        // be inferred from room type.
        const entryTemp = Number(product.entryTemp ?? room.entryTemp);
        const exitTemp = Number(room.temperature);
        if (!Number.isFinite(entryTemp) || !Number.isFinite(exitTemp)) {
            return { total: 0, sensible: 0, latent: 0, status: 'input-required', issues: ['Explicit product entry temperature and room exit temperature are required for product-load calculation.'], parameters: { productType: product.type, productMass, cycleTime } };
        }
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

        // Unknown product properties are input-required; do not silently reuse
        // poultry values for another product or process.
        return null;
    }

    // ============================================================
    // INFILTRATION LOAD (Air exchange through doors)
    // ============================================================

    _calculateInfiltration(room, project) {
        const ambientTemp = project.climate?.summerDB || 35;
        const roomTemp = room.temperature;

        // Door opening geometry and operation are project inputs.  No generic
        // door, opening frequency or duration is injected into the calculation.
        const door = room.door;
        if (!door || ![door.width, door.height, door.openingsPerDay, door.openDuration].every((value) => Number.isFinite(Number(value)) && Number(value) >= 0)) {
            return { total: 0, status: 'input-required', issues: ['Door width, height, openings per day and open duration must be supplied for infiltration load.'] };
        }

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
        const protectionFactor = Number(room.doorProtection);
        if (!Number.isFinite(protectionFactor) || protectionFactor <= 0 || protectionFactor > 1) {
            return { total: 0, status: 'input-required', issues: ['Door protection factor in the range (0, 1] is required for infiltration load.'] };
        }

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
        const numPeople = Number(room.occupancy);
        const occupancyHours = Number(room.occupancyHours);

        // Get heat gain with fallback to prevent undefined errors
        const heatGain = this._getPeopleHeatGain(room.temperature) || { sensible: 200, latent: 100 };
        const peopleLoad = numPeople * ((heatGain.sensible || 200) + (heatGain.latent || 100)) *
            occupancyHours / 24 / 1000;

        // Lighting load
        const lightingPower = Number(room.lightingPower);  // W/m²
        const lightingHours = Number(room.lightingHours);
        const floorArea = Number(room.length) * Number(room.width);
        const lightingLoad = lightingPower * floorArea * lightingHours / 24 / 1000;

        // Equipment/forklift load
        const equipmentPower = Number(room.equipmentPower);  // kW
        const equipmentHours = Number(room.equipmentHours);
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
