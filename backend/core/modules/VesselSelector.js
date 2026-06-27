/**
 * VesselSelector Module
 * 
 * Selects pressure vessels:
 * - Liquid separators (low pressure receivers)
 * - High pressure receiver
 * - Thermosiphon vessel (oil cooling)
 * - Economizer vessel
 * - Oil separator
 * 
 * Standards: PED 2014/68/EU, EN 378-2
 * 
 * @author GFDDE AI Engine
 * @version 2.0.0
 */

class VesselSelector {
    constructor(engine) {
        this.engine = engine;

        // Standard vessel sizes (liters)
        this.standardSizes = [
            100, 150, 200, 300, 500, 750, 1000,
            1500, 2000, 3000, 5000, 7500, 10000
        ];

        // Separator sizing factors
        this.separatorFactors = {
            liquidHoldTime: 180,    // seconds
            vaporDisengagementHeight: 0.3,  // 30% of vessel height
            liquidReserve: 0.2      // 20% reserve
        };
    }

    /**
     * Select separator vessel for a temperature level
     * @param {Object} tempLevel - Temperature level data
     * @param {Object} project - Project context
     * @returns {Object} Separator selection
     */
    async selectSeparator(tempLevel, project) {
        const evapTemp = tempLevel.evaporatingTemp;
        const totalLoad = tempLevel.totalLoad;
        const refrigerant = project.refrigerant || 'R717';

        // Get refrigerant properties
        const refData = this.engine.getData('refrigerants');
        const refProps = refData?.[refrigerant]?.properties?.[evapTemp.toString()];

        // Calculate liquid flow rate (kg/s)
        const latentHeat = refProps?.latentHeat || 1300;  // kJ/kg for ammonia
        const liquidFlowRate = totalLoad / latentHeat;

        // Calculate required volume
        const liquidDensity = refProps?.density_liquid || 650;  // kg/m³
        const volumeFlowRate = liquidFlowRate / liquidDensity * 1000;  // L/s

        // Hold time based volume
        const holdTimeVolume = volumeFlowRate * this.separatorFactors.liquidHoldTime;

        // Add reserve and design margin
        const requiredVolume = holdTimeVolume *
            (1 + this.separatorFactors.liquidReserve) * 1.15;

        // Select standard size
        const selectedSize = this._selectStandardSize(requiredVolume);

        // Calculate vessel dimensions (vertical, L/D ratio ~3)
        const dims = this._calculateDimensions(selectedSize);

        // Determine design pressure
        const designPressure = this._getDesignPressure(evapTemp);

        // Select pump(s) for liquid feed
        const pumps = this._selectPumps(volumeFlowRate, tempLevel.rooms?.length || 1);

        return {
            type: 'separator',
            temperatureLevel: tempLevel.temperatureLevel,
            evaporatingTemp: evapTemp,
            volume: selectedSize,
            dimensions: dims,
            designPressure: designPressure,
            testPressure: Math.round(designPressure * 1.5 * 10) / 10,
            material: 'Carbon Steel',
            refrigerant: refrigerant,
            liquidFlowRate: Math.round(liquidFlowRate * 1000) / 1000,
            pumps: pumps,
            connections: this._getConnections(dims.diameter),
            tag: `SEP-${evapTemp < 0 ? 'M' : 'P'}${Math.abs(evapTemp)}`,
            manufacturer: 'Fabricated'
        };
    }

    /**
     * Select high pressure receiver
     * @param {Object} systemData - System data
     * @param {Object} project - Project context
     * @returns {Object} Receiver selection
     */
    async selectReceiver(systemData, project) {
        const refrigerant = project.refrigerant || 'R717';

        // Calculate total refrigerant charge
        // Rule of thumb: 3-5 kg per kW for ammonia
        const totalLoad = systemData.totalLoad || 1000;
        const chargePerKW = refrigerant === 'R717' ? 4 : 2;
        const totalCharge = totalLoad * chargePerKW;

        // Receiver should hold ~80% of charge
        const receiverCharge = totalCharge * 0.8;

        // Convert to volume (at liquid density ~600 kg/m³)
        const liquidDensity = 600;
        const requiredVolume = (receiverCharge / liquidDensity) * 1000 * 1.3;  // 30% margin

        const selectedSize = this._selectStandardSize(requiredVolume);
        const dims = this._calculateDimensions(selectedSize, 'horizontal');

        return {
            type: 'receiver',
            volume: selectedSize,
            dimensions: dims,
            orientation: 'horizontal',
            designPressure: 25,  // Bar, for high side
            testPressure: 37.5,
            material: 'Carbon Steel',
            refrigerant: refrigerant,
            estimatedCharge: Math.round(totalCharge),
            tag: 'REC-01'
        };
    }

    /**
     * Select thermosiphon vessel (oil cooling for screw compressors)
     * @param {Object} compressorData - Compressor selection data
     * @returns {Object} Thermosiphon selection
     */
    async selectThermosiphon(compressorData) {
        // Thermosiphon capacity = ~15% of compressor motor power
        const totalMotorPower = compressorData.totalUnits * compressorData.motorPower;
        const coolingCapacity = totalMotorPower * 0.15;

        // Volume based on capacity (rule of thumb: 2L per kW)
        const requiredVolume = coolingCapacity * 2;
        const selectedSize = this._selectStandardSize(requiredVolume);

        return {
            type: 'thermosiphon',
            volume: selectedSize,
            coolingCapacity: Math.round(coolingCapacity * 10) / 10,
            designPressure: 25,
            tag: 'THS-01'
        };
    }

    _selectStandardSize(requiredVolume) {
        for (const size of this.standardSizes) {
            if (size >= requiredVolume) return size;
        }
        return this.standardSizes[this.standardSizes.length - 1];
    }

    _calculateDimensions(volume, orientation = 'vertical') {
        // L/D ratio
        const ratio = orientation === 'vertical' ? 3 : 4;

        // V = π/4 * D² * L = π/4 * D² * ratio * D = π/4 * ratio * D³
        // D³ = V * 4 / (π * ratio)
        const volumeM3 = volume / 1000;
        const D3 = volumeM3 * 4 / (Math.PI * ratio);
        const diameter = Math.pow(D3, 1 / 3);
        const length = diameter * ratio;

        return {
            diameter: Math.round(diameter * 1000),  // mm
            length: Math.round(length * 1000),      // mm
            orientation: orientation
        };
    }

    _getDesignPressure(evapTemp) {
        // Design pressure based on saturation pressure at max temp
        // Use standstill temperature = ambient + safety margin
        const standstillTemp = 45;  // °C assumed

        // Simplified pressure calculation (bar)
        // For ammonia: P ≈ 0.717 * exp(0.05 * (T + 40))
        const pressure = 0.717 * Math.exp(0.05 * (standstillTemp + 40));

        // Round up to standard pressure rating
        const standardPressures = [10, 16, 25, 40];
        for (const p of standardPressures) {
            if (p >= pressure) return p;
        }
        return 40;
    }

    _selectPumps(flowRate, roomCount) {
        // L/s to m³/h
        const flowM3h = flowRate * 3600 / 1000;

        // Determine pump count (N+1 redundancy)
        const operatingPumps = roomCount <= 4 ? 1 : 2;
        const standbyPumps = 1;

        // Flow per pump
        const flowPerPump = flowM3h / operatingPumps;

        // Head based on typical installation (15-25m)
        const head = 20;

        // Power estimate (kW)
        const power = (flowPerPump * head * 1000 * 9.81) / (3600 * 1000 * 0.65);

        return {
            operating: operatingPumps,
            standby: standbyPumps,
            total: operatingPumps + standbyPumps,
            flowPerPump: Math.round(flowPerPump * 10) / 10,
            head: head,
            power: Math.round(power * 10) / 10,
            type: 'Hermetic_Ammonia',
            tag: 'PUMP'
        };
    }

    _getConnections(diameter) {
        // Nozzle sizes based on vessel diameter
        const inletSize = diameter < 600 ? 'DN50' : diameter < 1000 ? 'DN80' : 'DN100';
        const outletSize = diameter < 600 ? 'DN40' : diameter < 1000 ? 'DN65' : 'DN80';
        const ventSize = 'DN25';
        const drainSize = 'DN25';

        return {
            liquidInlet: inletSize,
            liquidOutlet: outletSize,
            vaporOutlet: inletSize,
            vent: ventSize,
            drain: drainSize,
            levelGauge: 'DN15',
            pressureGauge: 'DN15'
        };
    }
}

module.exports = VesselSelector;
