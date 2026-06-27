const AmmoniaProperties = require('../utils/AmmoniaProperties');

/**
 * High-Precision Refrigeration Load Calculation Engine
 * Based on ASHRAE Refrigeration Handbook Standards
 * All calculations in SI units (kW, °C, kg, m)
 */

class HighPrecisionEngine {
    /**
     * Calculate transmission load through walls, floor, and ceiling
     * @param {Object} room - Room object with dimensions and temperature
     * @param {number} ambientTemp - External ambient temperature (°C)
     * @returns {number} Transmission load in kW
     */
    static calculateTransmissionLoad(room, ambientTemp = 30) {
        const { L, W, H, temp } = room;

        // Calculate surface areas
        const wallArea = 2 * (L * H + W * H);
        const floorArea = L * W;
        const ceilingArea = L * W;

        // Determine U-values based on room temperature (W/m²·K)
        // These are typical insulated panel values
        let uWall, uFloor, uCeiling;

        if (temp <= -30) {
            // Deep freeze: 200mm polyurethane
            uWall = 0.12;
            uFloor = 0.13;  // Floor slightly higher due to ground contact
            uCeiling = 0.11;
        } else if (temp <= -20) {
            // Freezer: 150mm polyurethane
            uWall = 0.15;
            uFloor = 0.16;
            uCeiling = 0.14;
        } else if (temp <= -5) {
            // Low temp storage: 120mm polyurethane
            uWall = 0.18;
            uFloor = 0.19;
            uCeiling = 0.17;
        } else {
            // Chiller: 100mm polyurethane
            uWall = 0.22;
            uFloor = 0.24;
            uCeiling = 0.21;
        }

        // Temperature differential
        const dT = ambientTemp - temp;

        // Calculate heat gain through each surface (W)
        const qWall = wallArea * uWall * dT;
        const qFloor = floorArea * uFloor * dT * 0.7;  // Ground temp is cooler
        const qCeiling = ceilingArea * uCeiling * dT;

        // Total transmission load in kW
        const totalLoad = (qWall + qFloor + qCeiling) / 1000;

        return totalLoad;
    }

    /**
     * Calculate product load (sensible + latent heat removal)
     * @param {Object} room - Room object with product details
     * @returns {number} Product load in kW
     */
    static calculateProductLoad(room) {
        if (!room.product || !room.product.mass || room.product.mass === 0) {
            return 0;
        }

        const { mass, entryTemp, targetTemp, time } = room.product;

        // Use properties from ProductProperties if available, else defaults
        const props = room.product.properties || {};
        const freezingPoint = props.freezingPoint || (room.product.type === 'meat' ? -1.5 : -2.0);

        // Calculate enthalpy change
        const enthalpyChange = AmmoniaProperties.calculateProductEnthalpyChange(
            entryTemp,
            targetTemp,
            freezingPoint,
            props // Pass full properties if available
        );

        // Time in seconds
        const timeSeconds = (time || 24) * 3600;

        // Product load in kW
        let productLoad = (mass * enthalpyChange) / timeSeconds;

        // Safety: Product load cannot be negative (we are cooling, not heating)
        if (productLoad < 0) productLoad = 0;

        // Add Packaging Load (ASHRAE: ~10-15% of product load for pallets/boxes)
        // Or calculate explicitly: Mass of packaging * Cp * dT
        const packagingMass = mass * 0.05; // 5% packaging mass
        const cpPackaging = 1.5; // Wood/Cardboard kJ/kg.K
        const packagingLoad = (packagingMass * cpPackaging * (entryTemp - targetTemp)) / timeSeconds;

        // Add Respiration Load for fruits/veg (if applicable)
        let respirationLoad = 0;
        if (props.respiration && targetTemp > freezingPoint) {
            // Respiration heat in W/kg -> kW
            respirationLoad = (mass * props.respiration) / 1000;
        }

        return productLoad + packagingLoad + respirationLoad;
    }

    /**
     * Calculate infiltration load from door openings and air exchange
     * @param {Object} room - Room object
     * @param {number} ambientTemp - External temperature
     * @param {number} ambientRH - Relative humidity (%)
     * @returns {number} Infiltration load in kW
     */
    static calculateInfiltrationLoad(room, ambientTemp = 30, ambientRH = 60) {
        const { L, W, H, temp, type } = room;
        const volume = L * W * H;

        // Air density at ambient conditions (kg/m³)
        const rhoAir = 1.2;

        // Specific heat of air (kJ/kg·K)
        const cpAir = 1.005;

        // Air change rate per 24 hours based on room type and usage
        let airChangesPerDay;
        if (type && type.includes('tunnel')) {
            airChangesPerDay = 15;  // High traffic
        } else if (type && type.includes('loading')) {
            airChangesPerDay = 12;
        } else if (temp <= -25) {
            airChangesPerDay = 3;   // Deep freeze, low traffic
        } else if (temp <= -5) {
            airChangesPerDay = 5;   // Freezer
        } else {
            airChangesPerDay = 8;   // Chiller
        }

        // Sensible heat from air infiltration
        const qSensible = (volume * rhoAir * cpAir * (ambientTemp - temp) * airChangesPerDay) / (24 * 3600);

        // Latent heat from moisture (approximate)
        // Enthalpy difference between ambient and room air (kJ/kg)
        const hAmbient = 1.005 * ambientTemp + (ambientRH / 100) * (2501 + 1.86 * ambientTemp);
        const hRoom = 1.005 * temp + 0.01 * (2501 + 1.86 * temp);  // Assuming very dry in cold room
        const dhMoisture = hAmbient - hRoom;

        const qLatent = (volume * rhoAir * dhMoisture * airChangesPerDay) / (24 * 3600);

        // Total infiltration load
        const infiltrationLoad = qSensible + qLatent;

        return infiltrationLoad;
    }

    /**
     * Calculate internal heat loads (lights, people, equipment)
     * @param {Object} room - Room object
     * @returns {number} Internal load in kW
     */
    static calculateInternalLoads(room) {
        const { L, W, H, temp, type } = room;
        const floorArea = L * W;

        // Lighting load (W/m²)
        const lightingDensity = temp <= -15 ? 8 : 10;  // Lower in freezers
        const qLighting = (floorArea * lightingDensity) / 1000;

        // People load (assume 1 person per 50 m² for normal operation)
        // Each person: 250 W sensible in cold environment
        const numPeople = Math.max(1, Math.floor(floorArea / 50));
        const qPeople = (numPeople * 0.25);  // kW

        // Forklift/equipment load (ASHRAE)
        // Electric Forklift: ~3-5 kW average heat gain
        let qEquipment = 0;
        const forkliftCount = room.usage?.forkliftCount || (floorArea > 200 ? 1 : 0);
        if (forkliftCount > 0) {
            qEquipment = forkliftCount * 3.5; // 3.5 kW per forklift
        }

        // Fan motors for evaporators (estimated, will be refined in equipment selection)
        // ASHRAE estimate: 1.5 - 2.0 W/m3 of room volume for air circulation
        const volume = L * W * H;
        const fanFactor = temp <= -20 ? 2.0 : 1.5; // Higher for freezers
        const qFans = (volume * fanFactor) / 1000;

        const totalInternal = qLighting + qPeople + qEquipment + qFans;

        return totalInternal;
    }

    /**
     * Apply safety factor and simultaneity adjustments
     * @param {Object} loads - Object containing all load components
     * @param {Object} room - Room object for context
     * @returns {number} Total adjusted load in kW
     */
    static applySimultaneityFactor(loads, room) {
        const { transmission, product, infiltration, internal } = loads;

        // Base total
        let total = transmission + product + infiltration + internal;

        // Safety factor (ASHRAE: 10% for uncertainty)
        total *= 1.10;

        // Defrost load (ASHRAE Method)
        // Heat added during defrost must be removed
        // Electric defrost efficiency ~50% (50% goes into room)
        // Hot gas defrost efficiency ~30% (30% goes into room)
        // Assume Electric for smaller, Hot Gas for larger
        // Simplified: Add 15% to total load to account for defrost heat recovery
        const defrostFactor = room.temp < 0 ? 0.15 : 0.05;
        const defrostLoad = total * defrostFactor;

        total += defrostLoad;

        return total;
    }

    /**
     * Complete load calculation for a single room
     * @param {Object} room - Room specification
     * @param {number} ambientTemp - Ambient temperature
     * @returns {Object} Detailed load breakdown
     */
    static calculateRoomLoad(room, ambientTemp = 30) {
        const transmission = this.calculateTransmissionLoad(room, ambientTemp);
        const product = this.calculateProductLoad(room);
        const infiltration = this.calculateInfiltrationLoad(room, ambientTemp);
        const internal = this.calculateInternalLoads(room);

        const totalLoad = this.applySimultaneityFactor({
            transmission,
            product,
            infiltration,
            internal
        }, room);

        return {
            transmission: parseFloat(transmission.toFixed(2)),
            product: parseFloat(product.toFixed(2)),
            infiltration: parseFloat(infiltration.toFixed(2)),
            internal: parseFloat(internal.toFixed(2)),
            totalLoad: parseFloat(totalLoad.toFixed(2))
        };
    }
}

module.exports = HighPrecisionEngine;
