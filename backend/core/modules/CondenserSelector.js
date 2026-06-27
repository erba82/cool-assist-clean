/**
 * CondenserSelector Module
 * 
 * Selects optimal condensers based on:
 * - Total heat rejection load
 * - Ambient conditions (wet bulb/dry bulb)
 * - Condenser type (evaporative/air-cooled)
 * - Fouling and altitude factors
 * 
 * Manufacturers: BAC, Evapco, Güntner
 * 
 * @author GFDDE AI Engine
 * @version 2.0.0
 */

class CondenserSelector {
    constructor(engine) {
        this.engine = engine;

        // Evaporative condenser series
        this.evaporativeCondensers = {
            'CXV': {  // Crossflow, single fan
                capacityRange: [100, 500],
                approach: 8,       // K above WB
                fanPower: [3.7, 7.5],
                pumpPower: [1.5, 3],
                models: ['CXV-100', 'CXV-200', 'CXV-350', 'CXV-500']
            },
            'VXT': {  // Crossflow, multi-fan
                capacityRange: [500, 2000],
                approach: 7,
                fanPower: [11, 30],
                pumpPower: [5.5, 11],
                models: ['VXT-500', 'VXT-800', 'VXT-1200', 'VXT-2000']
            },
            'PFI': {  // Induced draft, industrial
                capacityRange: [2000, 8000],
                approach: 6,
                fanPower: [45, 90],
                pumpPower: [15, 30],
                models: ['PFI-2000', 'PFI-4000', 'PFI-6000', 'PFI-8000']
            }
        };

        // Air-cooled condensers
        this.airCooledCondensers = {
            'ACF': {  // Forced draft
                capacityRange: [20, 200],
                approach: 12,
                fanPower: [1.5, 7.5],
                models: ['ACF-20', 'ACF-50', 'ACF-100', 'ACF-200']
            },
            'ACI': {  // Induced draft, larger
                capacityRange: [200, 1000],
                approach: 10,
                fanPower: [7.5, 30],
                models: ['ACI-200', 'ACI-400', 'ACI-700', 'ACI-1000']
            }
        };
    }

    /**
     * Select condenser(s) for the system
     * @param {number} totalHeatRejection - Total HR from all compressors (kW)
     * @param {Object} project - Project context
     * @returns {Object} Condenser selection
     */
    async select(totalHeatRejection, project) {
        const climate = project.climate || {};
        const wetBulb = climate.summerWB || 24;
        const dryBulb = climate.summerDB || 35;
        const altitude = climate.altitude || 0;

        // Determine condenser type
        const type = this._selectType(project, wetBulb, dryBulb);

        // Apply correction factors
        const altitudeFactor = this._getAltitudeFactor(altitude);
        const foulingFactor = 1.15;  // 15% fouling allowance

        // Design capacity with factors
        const designCapacity = totalHeatRejection * foulingFactor * altitudeFactor;

        // Select model(s)
        const selection = this._selectModel(designCapacity, type);

        // Calculate condensing temperature
        const condensingTemp = type === 'evaporative' ?
            wetBulb + selection.approach :
            dryBulb + selection.approach;

        return {
            type: type,
            model: selection.model,
            series: selection.series,
            count: selection.count,
            capacityPerUnit: Math.round(selection.capacityPerUnit * 100) / 100,
            totalCapacity: Math.round(designCapacity * 100) / 100,
            heatRejection: Math.round(totalHeatRejection * 100) / 100,
            condensingTemp: condensingTemp,
            approach: selection.approach,
            fanCount: selection.fanCount,
            fanPowerPerUnit: selection.fanPower,
            pumpPowerPerUnit: selection.pumpPower || 0,
            totalElectricalPower: Math.round(
                (selection.fanPower + (selection.pumpPower || 0)) * selection.count * 100
            ) / 100,
            correctionFactors: {
                altitude: Math.round(altitudeFactor * 1000) / 1000,
                fouling: foulingFactor
            },
            designConditions: {
                wetBulb: wetBulb,
                dryBulb: dryBulb,
                altitude: altitude
            },
            tag: 'COND-01',
            manufacturer: type === 'evaporative' ? 'BAC' : 'GÜNTNER',

            // Detailed Technical Specs
            technicalSpecs: {
                waterConsumption: type === 'evaporative' ? Math.round(designCapacity * 1.6) : 0, // l/h (approx 1.6 l/kWh)
                dimensions: {
                    length: 3600,
                    width: 2400,
                    height: 3100,
                    operatingWeight: 4500 // kg
                },
                connections: {
                    inlet: 'DN100',
                    outlet: 'DN100',
                    water: 'DN50'
                },
                soundLevel: type === 'evaporative' ? 82 : 75 // dB(A)
            },

            // Electrical Details
            electrical: {
                voltage: '400V 3Ph 50Hz',
                protection: 'IP55',
                fanMotor: `${selection.fanCount} x ${Math.round(selection.fanPower / selection.fanCount)} kW`,
                pumpMotor: selection.pumpPower ? `${selection.pumpPower} kW` : 'N/A'
            },

            // Pricing (Estimated)
            price: this._estimatePrice(type, selection.params?.capacityPerUnit || designCapacity / selection.count, selection.count),
            currency: 'USD',
            leadTime: '10-12 weeks'
        };
    }

    _estimatePrice(type, capacityPerUnit, quantity) {
        // Base prices in USD
        let basePrice = 0;

        if (type === 'evaporative') {
            // ~$80 per kW for evaporative
            basePrice = 8000 + (capacityPerUnit * 80);
        } else {
            // ~$60 per kW for air cooled
            basePrice = 5000 + (capacityPerUnit * 60);
        }

        const pricePerUnit = Math.round(basePrice);

        return {
            perUnit: pricePerUnit,
            total: pricePerUnit * quantity,
            currency: 'USD',
            breakdown: {
                equipment: Math.round(basePrice * 0.9),
                freight: Math.round(basePrice * 0.1)
            }
        };
    }

    _selectType(project, wetBulb, dryBulb) {
        // If user specified, use that
        if (project.condenserType) return project.condenserType;

        // Auto-select based on conditions
        // Evaporative is more efficient when WB is much lower than DB
        const deltaT = dryBulb - wetBulb;

        if (deltaT >= 10) return 'evaporative';  // Good wet bulb depression
        if (deltaT <= 5) return 'air_cooled';    // High humidity

        // Consider water availability in region
        const region = project.climate?.region || 'default';
        if (region === 'middle_east') return 'evaporative';  // Water treatment needed but efficient

        return 'evaporative';  // Default to evaporative
    }

    _getAltitudeFactor(altitude) {
        // Air density decreases with altitude
        // This affects air-cooled more than evaporative
        return 1 + (altitude / 10000) * 0.15;
    }

    _selectModel(capacity, type) {
        const condensers = type === 'evaporative' ?
            this.evaporativeCondensers : this.airCooledCondensers;

        // Find appropriate series
        let selectedSeries = null;
        for (const [series, specs] of Object.entries(condensers)) {
            if (capacity >= specs.capacityRange[0] &&
                capacity <= specs.capacityRange[1] * 2) {
                selectedSeries = { name: series, ...specs };
                break;
            }
        }

        // Default to largest if no match
        if (!selectedSeries) {
            const keys = Object.keys(condensers);
            const largest = keys[keys.length - 1];
            selectedSeries = { name: largest, ...condensers[largest] };
        }

        // Determine count
        const maxCapacity = selectedSeries.capacityRange[1];
        const count = Math.ceil(capacity / maxCapacity);
        const capacityPerUnit = capacity / count;

        // Select specific model
        const modelIndex = selectedSeries.models.length - 1;
        const model = selectedSeries.models[Math.min(
            modelIndex,
            Math.floor(capacityPerUnit / (maxCapacity / selectedSeries.models.length))
        )];

        // Calculate fan count (assume 2+1 per size step)
        const fanCount = Math.ceil(capacityPerUnit / (maxCapacity / 3)) + 1;

        return {
            series: selectedSeries.name,
            model: model,
            count: count,
            capacityPerUnit: capacityPerUnit,
            approach: selectedSeries.approach,
            fanCount: fanCount,
            fanPower: (selectedSeries.fanPower[0] + selectedSeries.fanPower[1]) / 2,
            pumpPower: selectedSeries.pumpPower ?
                (selectedSeries.pumpPower[0] + selectedSeries.pumpPower[1]) / 2 : 0
        };
    }
}

module.exports = CondenserSelector;
