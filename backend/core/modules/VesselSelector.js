'use strict';

/**
 * Governed vessel-selection gateway.
 *
 * Pressure-vessel volume, MAWP/design pressure, nozzle schedule, relief basis,
 * refrigerant inventory and pump duty cannot be created from rules of thumb.
 * This module deliberately returns an engineering dossier until a traceable
 * vessel/process calculation and manufacturer or fabricator evidence are attached.
 */
class VesselSelector {
    constructor(engine) {
        this.engine = engine;
    }

    _finitePositive(value) {
        return Number.isFinite(Number(value)) && Number(value) > 0 ? Number(value) : null;
    }

    _dossier({ type, tag, refrigerant, role, dutyKw = null, evaporatingTempC = null, requiredInputs = [], extra = {} }) {
        return {
            type,
            tag,
            refrigerant: refrigerant || null,
            role,
            designDutyKw: this._finitePositive(dutyKw),
            evaporatingTempC: Number.isFinite(Number(evaporatingTempC)) ? Number(evaporatingTempC) : null,
            selectionStatus: 'manufacturer-and-vessel-calculation-required',
            volume: null,
            dimensions: null,
            orientation: null,
            designPressure: null,
            testPressure: null,
            material: null,
            connections: null,
            pumps: null,
            manufacturer: null,
            model: null,
            manufacturerSelection: {
                status: 'manufacturer-map-required',
                selectedModel: null,
                evidence: null,
                reason: 'No traceable vessel sizing calculation, design pressure basis, nozzle schedule, relief basis or manufacturer/fabricator evidence has been supplied.'
            },
            requiredInputs: [
                ...requiredInputs,
                'Refrigerant inventory/charge calculation and operating liquid level.',
                'Design and relief pressure/temperature basis for the applicable operating and standstill scenarios.',
                'Vessel code, corrosion allowance, material, orientation, nozzle schedule and fabrication evidence.',
                'For pumped systems: vendor pump curve/NPSHr, suction nozzle elevation, liquid state and calculated suction-line losses.'
            ],
            ...extra
        };
    }

    /**
     * Produce a low-pressure separator dossier without deriving volume, pressure,
     * pump count, head, power or connection sizes from unapproved heuristics.
     */
    async selectSeparator(tempLevel = {}, project = {}) {
        const refrigerant = project.refrigerant || null;
        return this._dossier({
            type: 'separator',
            tag: tempLevel.tag || 'SEP-LP-01',
            refrigerant,
            role: 'low-pressure separator / surge drum for wet-return separation and pumped-liquid source',
            dutyKw: tempLevel.totalLoad,
            evaporatingTempC: tempLevel.evaporatingTemp,
            requiredInputs: [
                'Validated refrigerant mass-flow and phase-state calculation at the stated operating point.',
                'Required liquid residence/surge inventory and vapour disengagement criterion approved by the responsible engineer.',
                'Pump recirculation ratio, process load diversity, defrost behaviour and pump control/redundancy policy.',
                'Declared separator liquid level and pump centreline/nozzle elevations.'
            ],
            extra: { feedMethod: project.semanticCycle?.feedMethod || null }
        });
    }

    /**
     * Produce a high-pressure receiver dossier. Refrigerant charge is not inferred
     * from kW and no catalogue standard size is selected without evidence.
     */
    async selectReceiver(systemData = {}, project = {}) {
        return this._dossier({
            type: 'receiver',
            tag: systemData.tag || 'REC-HP-01',
            refrigerant: project.refrigerant || null,
            role: 'high-pressure liquid receiver / inventory management',
            dutyKw: systemData.totalLoad,
            requiredInputs: [
                'Component-by-component refrigerant charge inventory, including piping, vessels, evaporators and standby conditions.',
                'Required operating and pump-down liquid inventory, maximum fill level and transient operating cases.',
                'Selected high-side pressure basis, relief scenario and code jurisdiction.'
            ]
        });
    }

    /**
     * Produce a thermosiphon vessel dossier. The source elevation and loop loss
     * govern circulation; motor-power percentages and litres-per-kW are prohibited.
     */
    async selectThermosiphon(compressorData = {}, project = {}) {
        return this._dossier({
            type: 'thermosiphon',
            tag: compressorData.tag || 'TS-OC-01',
            refrigerant: project.refrigerant || null,
            role: 'thermosiphon refrigerant source for screw-compressor oil coolers',
            dutyKw: compressorData.oilCoolingDutyKw ?? null,
            requiredInputs: [
                'Compressor manufacturer oil-cooler duty, oil-cooler pressure-drop and allowable refrigerant-side operating conditions.',
                'Declared source liquid level, oil-cooler connection elevations and two-phase return routing.',
                'Calculated loop pressure loss and available circulation head for each operating case.'
            ]
        });
    }
}

module.exports = VesselSelector;
