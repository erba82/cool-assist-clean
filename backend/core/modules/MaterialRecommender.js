/**
 * Material Recommender
 * Recommends insulation panels, doors, and floor materials
 * Based on temperature, climate zone, and regional standards
 */

const { getStandardsForLocation, getInsulationRecommendation } = require('../../data/standards/RegionalStandardsDB');

class MaterialRecommender {
    constructor() {
        // Panel specifications by temperature range
        this.panelSpecs = {
            ultraLow: {
                tempRange: [-50, -35],
                thickness: 200,
                type: 'PU (Polyurethane)',
                density: '42 kg/m³',
                kValue: 0.022,
                facing: 'Stainless Steel 0.6mm',
                color: 'White/RAL 9002'
            },
            frozen: {
                tempRange: [-35, -18],
                thickness: 150,
                type: 'PU (Polyurethane)',
                density: '40 kg/m³',
                kValue: 0.023,
                facing: 'Pre-painted Steel 0.5mm',
                color: 'White/RAL 9002'
            },
            deepChilled: {
                tempRange: [-18, -5],
                thickness: 120,
                type: 'PU (Polyurethane)',
                density: '40 kg/m³',
                kValue: 0.023,
                facing: 'Pre-painted Steel 0.5mm',
                color: 'White/RAL 9002'
            },
            chilled: {
                tempRange: [-5, 5],
                thickness: 100,
                type: 'PU (Polyurethane)',
                density: '38 kg/m³',
                kValue: 0.024,
                facing: 'Pre-painted Steel 0.5mm',
                color: 'White/RAL 9002'
            },
            cool: {
                tempRange: [5, 15],
                thickness: 80,
                type: 'PU (Polyurethane)',
                density: '38 kg/m³',
                kValue: 0.024,
                facing: 'Pre-painted Steel 0.45mm',
                color: 'White/RAL 9002'
            }
        };

        // Door specifications
        this.doorSpecs = {
            sliding: {
                name: 'Sliding Cold Room Door',
                types: {
                    manual: { maxWidth: 1500, maxHeight: 2500 },
                    automatic: { maxWidth: 3000, maxHeight: 4000 }
                },
                tempRanges: {
                    frozen: { thickness: 150, heater: true, heaterPower: '100W/m' },
                    chilled: { thickness: 100, heater: false }
                },
                materials: ['Stainless Steel', 'Galvanized Steel', 'Aluminum']
            },
            hinged: {
                name: 'Hinged Cold Room Door',
                types: {
                    single: { maxWidth: 1200, maxHeight: 2200 },
                    double: { maxWidth: 2400, maxHeight: 2500 }
                },
                tempRanges: {
                    frozen: { thickness: 120, heater: true, heaterPower: '80W/m' },
                    chilled: { thickness: 80, heater: false }
                }
            },
            rapid: {
                name: 'High-Speed Roll-Up Door',
                types: {
                    standard: { maxWidth: 4000, maxHeight: 5000 },
                    heavy_duty: { maxWidth: 6000, maxHeight: 6000 }
                },
                tempRanges: {
                    frozen: { thickness: 'N/A - uses curtain', heater: true },
                    chilled: { thickness: 'N/A', heater: false }
                },
                notes: 'Recommended for high-traffic areas'
            },
            dock: {
                name: 'Dock Door with Shelter',
                types: {
                    standard: { maxWidth: 3500, maxHeight: 4500 }
                },
                includes: ['Dock leveler', 'Dock shelter', 'Door pad']
            }
        };

        // Floor specifications
        this.floorSpecs = {
            frozen: {
                tempRange: [-50, -10],
                layers: [
                    { name: 'Concrete slab', thickness: '200mm', spec: 'C30/37 with reinforcement' },
                    { name: 'Vapor barrier', thickness: '0.2mm PE' },
                    { name: 'XPS Insulation', thickness: '200mm', density: '35 kg/m³' },
                    { name: 'Heating cables', spec: '30W/m² to prevent frost heave' },
                    { name: 'PE separation layer', thickness: '0.2mm' },
                    { name: 'Reinforced concrete', thickness: '150mm', spec: 'C35/45' },
                    { name: 'Epoxy coating', thickness: '3mm', spec: 'Anti-slip, food-grade' }
                ],
                heatingRequired: true,
                heatingNote: 'Under-floor heating required to prevent frost heave'
            },
            chilled: {
                tempRange: [-10, 10],
                layers: [
                    { name: 'Concrete slab', thickness: '150mm', spec: 'C25/30' },
                    { name: 'Vapor barrier', thickness: '0.2mm PE' },
                    { name: 'XPS Insulation', thickness: '100mm', density: '32 kg/m³' },
                    { name: 'PE separation layer', thickness: '0.2mm' },
                    { name: 'Reinforced concrete', thickness: '120mm', spec: 'C30/37' },
                    { name: 'Epoxy coating', thickness: '2mm', spec: 'Anti-slip, food-grade' }
                ],
                heatingRequired: false
            }
        };

        // Climate adjustments
        this.climateAdjustments = {
            hot_humid: { panelThicknessAdd: 20, vaporBarrier: 'Enhanced', advice: 'Extra vapor barrier recommended' },
            hot_dry: { panelThicknessAdd: 10, vaporBarrier: 'Standard', advice: 'Standard insulation with good sealing' },
            cold: { panelThicknessAdd: 30, vaporBarrier: 'Enhanced', advice: 'Enhanced insulation for heat recovery potential' },
            moderate: { panelThicknessAdd: 0, vaporBarrier: 'Standard', advice: 'Standard specifications apply' }
        };
    }

    /**
     * Recommend materials based on project parameters
     */
    recommend(params) {
        const {
            temperature,
            location,
            roomDimensions,
            applicationType,
            trafficLevel = 'normal' // normal, high, very_high
        } = params;

        // Get regional standards
        const standards = getStandardsForLocation(location || 'International');
        const insulationRec = getInsulationRecommendation(location, temperature);

        // Determine temperature category
        const tempCategory = this._getTempCategory(temperature);

        // Get climate adjustment
        const climate = this._getClimateType(standards);
        const adjustment = this.climateAdjustments[climate] || this.climateAdjustments.moderate;

        // Panel recommendation
        const basePanel = this.panelSpecs[tempCategory] || this.panelSpecs.frozen;
        const panel = {
            ...basePanel,
            thickness: Math.max(basePanel.thickness, insulationRec.thickness) + adjustment.panelThicknessAdd,
            standardCompliance: standards.refrigerationStandards?.code || 'ASHRAE',
            vaporBarrier: adjustment.vaporBarrier,
            climateNote: adjustment.advice
        };

        // Door recommendation
        const door = this._recommendDoor(temperature, roomDimensions, trafficLevel);

        // Floor recommendation
        const floor = this._recommendFloor(temperature, standards);

        return {
            panel: {
                walls: panel,
                ceiling: { ...panel, thickness: panel.thickness + 20, note: 'Ceiling typically 20mm thicker' },
                specification: this._generatePanelSpec(panel)
            },
            door,
            floor,
            summary: {
                totalArea: this._calculatePanelArea(roomDimensions),
                location: standards.country,
                standard: standards.refrigerationStandards?.code,
                climate,
                temperatureCategory: tempCategory
            }
        };
    }

    _getTempCategory(temp) {
        if (temp <= -35) return 'ultraLow';
        if (temp <= -18) return 'frozen';
        if (temp <= -5) return 'deepChilled';
        if (temp <= 5) return 'chilled';
        return 'cool';
    }

    _getClimateType(standards) {
        const cdd = standards.climate?.coolingDegreeDays || 1000;
        const hdd = standards.climate?.heatingDegreeDays || 1500;
        const rh = standards.climate?.summerDesign?.rh || 60;

        if (cdd > 3000 && rh > 60) return 'hot_humid';
        if (cdd > 3000 && rh <= 40) return 'hot_dry';
        if (hdd > 3000) return 'cold';
        return 'moderate';
    }

    _recommendDoor(temperature, dimensions, trafficLevel) {
        const isFrozen = temperature <= -10;
        const tempCategory = isFrozen ? 'frozen' : 'chilled';

        // Determine door type based on traffic and size
        let doorType;
        if (trafficLevel === 'very_high') {
            doorType = 'rapid';
        } else if (dimensions && dimensions.width > 2000) {
            doorType = 'sliding';
        } else {
            doorType = 'hinged';
        }

        const doorBase = this.doorSpecs[doorType];
        const tempSpec = doorBase.tempRanges?.[tempCategory] || doorBase.tempRanges?.frozen;

        return {
            type: doorType,
            name: doorBase.name,
            thickness: tempSpec?.thickness || 120,
            heater: tempSpec?.heater || false,
            heaterPower: tempSpec?.heaterPower,
            width: dimensions ? Math.min(dimensions.width, 2500) : 1500,
            height: dimensions ? Math.min(dimensions.height, 2500) : 2200,
            operation: trafficLevel === 'very_high' ? 'automatic' : 'manual',
            material: isFrozen ? 'Stainless Steel' : 'Galvanized Steel',
            notes: doorBase.notes
        };
    }

    _recommendFloor(temperature, standards) {
        const floorSpec = temperature <= -10 ? this.floorSpecs.frozen : this.floorSpecs.chilled;

        return {
            ...floorSpec,
            safetyFactor: standards.refrigerationStandards?.safetyFactor || 1.15,
            loadCapacity: '5000 kg/m² (forklift rated)',
            notes: floorSpec.heatingRequired ?
                'Under-floor heating mandatory to prevent frost heave and structural damage' :
                'Standard insulated floor construction'
        };
    }

    _generatePanelSpec(panel) {
        return `${panel.thickness}mm ${panel.type} Panel, ` +
            `K-value: ${panel.kValue} W/m·K, ` +
            `Density: ${panel.density}, ` +
            `Facing: ${panel.facing}`;
    }

    _calculatePanelArea(dimensions) {
        if (!dimensions) return null;
        const { length, width, height } = dimensions;

        const wallArea = 2 * (length * height + width * height);
        const ceilingArea = length * width;
        const floorArea = length * width;

        return {
            walls: parseFloat(wallArea.toFixed(1)),
            ceiling: parseFloat(ceilingArea.toFixed(1)),
            floor: parseFloat(floorArea.toFixed(1)),
            total: parseFloat((wallArea + ceilingArea).toFixed(1)),
            unit: 'm²'
        };
    }

    /**
     * Quick recommendation for simple queries
     */
    quickRecommend(temperatureC) {
        const category = this._getTempCategory(temperatureC);
        const panel = this.panelSpecs[category] || this.panelSpecs.frozen;

        return {
            panelThickness: panel.thickness,
            panelType: panel.type,
            doorThickness: temperatureC <= -10 ? 150 : 100,
            doorHeater: temperatureC <= -10,
            floorHeating: temperatureC <= -10,
            summary: `For ${temperatureC}°C: Use ${panel.thickness}mm ${panel.type} panels, ` +
                `${temperatureC <= -10 ? '150mm heated doors, floor heating required' : '100mm standard doors'}`
        };
    }
}

module.exports = MaterialRecommender;
