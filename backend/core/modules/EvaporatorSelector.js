/**
 * EvaporatorSelector Module
 * 
 * Selects optimal evaporators based on:
 * - Required cooling capacity
 * - Room dimensions (throw distance)
 * - Temperature difference (TD) - optimized per application
 * - Defrost requirements
 * - Fin spacing for frost management
 * 
 * TD Optimization (from reference manual):
 * - Low TD (3-5K): Above zero storage → High humidity preservation
 * - High TD (8-12K): Below zero storage → Cost reduction
 * 
 * Fin Spacing (from reference manual):
 * - Above zero: 4-6 mm
 * - -18°C: 8-10 mm
 * - -30°C: 10-16 mm
 * 
 * @author GFDDE AI Engine
 * @version 3.0.0
 */

class EvaporatorSelector {
    constructor(engine) {
        this.engine = engine;

        // Standard evaporator series (based on major manufacturers)
        this.evaporatorSeries = {
            // Ceiling mounted unit coolers
            'DD': { // Dual Discharge
                minCapacity: 2,
                maxCapacity: 50,
                fanCounts: [1, 2, 3, 4],
                airFlow: 2500,   // m³/h per fan
                throw: 15        // meters
            },
            'DJ': { // Industrial
                minCapacity: 20,
                maxCapacity: 150,
                fanCounts: [2, 3, 4, 6],
                airFlow: 4500,
                throw: 25
            },
            'DL': { // Large Industrial
                minCapacity: 50,
                maxCapacity: 500,
                fanCounts: [4, 6, 8],
                airFlow: 8000,
                throw: 35
            }
        };

        // TD recommendations by application (from reference manual)
        this.tdRecommendations = {
            'chilling': { min: 3, max: 5, recommended: 4, reason: 'High humidity preservation' },
            'storage': { min: 5, max: 8, recommended: 6, reason: 'Balance humidity and efficiency' },
            'processing': { min: 6, max: 10, recommended: 8, reason: 'Processing efficiency' },
            'freezer': { min: 8, max: 12, recommended: 10, reason: 'Cost reduction acceptable' },
            'blast': { min: 10, max: 15, recommended: 12, reason: 'Speed priority' },
            'tunnel': { min: 12, max: 18, recommended: 15, reason: 'Maximum speed' }
        };

        // Fin spacing recommendations (from reference manual)
        this.finSpacingRecommendations = {
            aboveZero: { spacing: 5, range: '4-6 mm', reason: 'No frost concern' },
            minus10: { spacing: 7, range: '6-8 mm', reason: 'Light frost' },
            minus18: { spacing: 9, range: '8-10 mm', reason: 'Moderate frost' },
            minus25: { spacing: 12, range: '10-14 mm', reason: 'Heavy frost' },
            minus30: { spacing: 14, range: '12-16 mm', reason: 'Very heavy frost' }
        };
    }

    /**
     * Select evaporator for a room
     * @param {Object} load - Room load data from LoadCalculator
     * @param {Object} project - Project context
     * @returns {Object} Evaporator selection
     */
    async select(load, project) {
        const room = load.room;
        const requiredCapacity = load.total;

        // Determine TD with optimization
        const roomType = this._getRoomType(room);
        const tdConfig = this.tdRecommendations[roomType];
        const dt = room.dt || tdConfig.recommended;

        // Validate TD is within recommended range
        const tdStatus = dt >= tdConfig.min && dt <= tdConfig.max ? 'OK' : 'WARNING';
        const tdRecommendation = tdStatus === 'WARNING' ?
            `Recommended: ${tdConfig.min}-${tdConfig.max}K (${tdConfig.reason})` : null;

        // Calculate evaporating temperature
        const evapTemp = room.temperature - dt;

        // Determine fin spacing based on temperature
        const finSpacing = this._getFinSpacing(room.temperature);

        // Determine number of evaporators based on room size
        const { count, throwRequired } = this._determineCount(room);

        // Capacity per evaporator
        const capacityPerUnit = requiredCapacity / count;

        // Select appropriate series and model
        const selection = this._selectModel(capacityPerUnit, throwRequired, evapTemp);

        // Calculate air circulation
        const roomVolume = room.length * room.width * room.height;
        const airChangesPerHour = (selection.airFlow * selection.fanCount * count) / roomVolume;

        return {
            count: count,
            model: selection.model,
            series: selection.series,
            capacityPerUnit: Math.round(capacityPerUnit * 100) / 100,
            totalCapacity: Math.round(requiredCapacity * 100) / 100,
            fanCount: selection.fanCount,
            fanDiameter: selection.fanDiameter,
            airFlow: selection.airFlow,
            throwDistance: selection.throw,
            defrostType: this._getDefrostType(room.temperature),
            evaporatingTemp: evapTemp,
            dt: dt,
            airChangesPerHour: Math.round(airChangesPerHour),
            motorPower: selection.motorPower,
            tag: `EVAP-${room.name?.replace(/\s+/g, '-').toUpperCase() || 'ROOM'}`,

            // Detailed Technical Specs
            technicalSpecs: {
                surfaceArea: Math.round(capacityPerUnit * 8), // m2
                finSpacing: finSpacing.spacing, // mm
                finSpacingRange: finSpacing.range,
                finSpacingReason: finSpacing.reason,
                tubeVolume: Math.round(capacityPerUnit * 1.5), // L
                connections: {
                    inlet: capacityPerUnit > 20 ? 'DN25' : 'DN20',
                    outlet: capacityPerUnit > 20 ? 'DN50' : 'DN40',
                    drain: 'DN40'
                },
                dimensions: {
                    length: Math.round(1500 + (selection.fanCount * 800)),
                    width: 800,
                    height: 800,
                    weight: Math.round(capacityPerUnit * 12)
                }
            },

            // Electrical Details
            electrical: {
                fans: {
                    voltage: '400V 3Ph 50Hz',
                    power: `${selection.fanCount} x ${selection.motorPower} kW`,
                    current: `${Math.round(selection.fanCount * selection.motorPower * 2.2)} A`
                },
                defrost: {
                    type: this._getDefrostType(room.temperature),
                    power: Math.round(capacityPerUnit * 0.75), // kW for electric defrost
                    voltage: '400V 3Ph 50Hz'
                }
            },

            procurement: {
                priceStatus: 'supplier-quotation-required',
                unitPrice: null,
                totalPrice: null,
                currency: null
            },
            manufacturer: 'LU-VE',

            parameters: {
                roomType: roomType,
                roomVolume: roomVolume,
                requiredThrow: throwRequired,
                tdOptimization: {
                    value: dt,
                    min: tdConfig.min,
                    max: tdConfig.max,
                    recommended: tdConfig.recommended,
                    status: tdStatus,
                    reason: tdConfig.reason,
                    recommendation: tdRecommendation
                }
            }
        };
    }

    /**
     * Get fin spacing based on temperature (from reference manual)
     */
    _getFinSpacing(temperature) {
        if (temperature >= 0) return this.finSpacingRecommendations.aboveZero;
        if (temperature >= -10) return this.finSpacingRecommendations.minus10;
        if (temperature >= -18) return this.finSpacingRecommendations.minus18;
        if (temperature >= -25) return this.finSpacingRecommendations.minus25;
        return this.finSpacingRecommendations.minus30;
    }

    _getRoomType(room) {
        const temp = room.temperature;
        if (temp >= 0) return 'chilling';
        if (temp >= -10) return 'processing';
        if (temp >= -25) return 'storage';
        if (temp >= -35) return 'freezer';
        return 'blast';
    }

    _determineCount(room) {
        const length = room.length;
        const width = room.width;
        const maxDim = Math.max(length, width);

        // Determine required throw distance
        let throwRequired;
        if (maxDim <= 10) throwRequired = maxDim;
        else if (maxDim <= 20) throwRequired = maxDim / 2 + 5;
        else throwRequired = 15;  // Multiple units needed

        // Determine count based on room size
        let count;
        const area = length * width;
        if (area <= 50) count = 1;
        else if (area <= 150) count = 2;
        else if (area <= 300) count = Math.ceil(area / 150);
        else count = Math.ceil(area / 200);

        // Adjust for room shape
        if (length / width > 3 || width / length > 3) {
            count = Math.ceil(count * 1.5);  // Long rooms need more units
        }

        return { count, throwRequired };
    }

    _selectModel(capacity, throwRequired, evapTemp) {
        // Find appropriate series
        let selectedSeries = 'DD';
        for (const [series, specs] of Object.entries(this.evaporatorSeries)) {
            if (capacity >= specs.minCapacity &&
                capacity <= specs.maxCapacity &&
                specs.throw >= throwRequired) {
                selectedSeries = series;
                break;
            }
        }

        const specs = this.evaporatorSeries[selectedSeries];

        // Determine fan count
        let fanCount = 2;
        if (capacity <= specs.minCapacity * 1.5) fanCount = specs.fanCounts[0];
        else if (capacity <= specs.maxCapacity * 0.5) fanCount = specs.fanCounts[1];
        else fanCount = specs.fanCounts[specs.fanCounts.length - 1];

        // Calculate fan diameter and motor power
        const fanDiameter = selectedSeries === 'DL' ? 800 :
            selectedSeries === 'DJ' ? 630 : 450;
        const motorPower = fanDiameter === 800 ? 1.5 :
            fanDiameter === 630 ? 0.75 : 0.37;

        return {
            series: selectedSeries,
            model: `${selectedSeries}-${Math.round(capacity)}-${fanCount}`,
            fanCount: fanCount,
            fanDiameter: fanDiameter,
            airFlow: specs.airFlow,
            throw: specs.throw,
            motorPower: motorPower
        };
    }

    _getDefrostType(temp) {
        if (temp > 0) return 'off-cycle';        // Above freezing - natural defrost
        if (temp > -10) return 'electric';       // Mild cold - electric
        if (temp > -25) return 'electric';       // Cold storage - electric
        return 'hot-gas';                         // Low temp - hot gas defrost
    }
}

module.exports = EvaporatorSelector;
