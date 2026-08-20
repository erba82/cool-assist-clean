'use strict';

/**
 * Explicit semantic templates used only after the refrigerant profile and
 * confirmed cycle decisions have been resolved. They do not contain capacity,
 * DN, nozzle coordinates, relief settings, or manufacturer substitutions.
 */
const CYCLE_TEMPLATES = Object.freeze([
    Object.freeze({
        id: 'R717_PUMPED_SCREW_EVAPORATIVE',
        title: 'R717 pumped-recirculated screw plant with evaporative condenser',
        profileFamily: 'ammonia-industrial',
        compressorFamily: 'screw',
        feedMethod: 'pumped_recirculated',
        condenserTypes: ['evaporative_condenser'],
        expectedEquipment: ['oil_separator', 'evaporative_condenser', 'high_pressure_receiver', 'low_pressure_separator', 'liquid_pump'],
        optionalEquipment: ['thermosiphon_vessel', 'ammonia_valve_station', 'iqf_tunnel_evaporator'],
        reviewFocus: ['Confirm pump NPSH with selected pump data.', 'Confirm receiver/separator volume, relief system, elevations and structural supports with project data.']
    }),
    Object.freeze({
        id: 'R717_GRAVITY_RECIP',
        title: 'R717 gravity-fed reciprocating plant',
        profileFamily: 'ammonia-industrial',
        compressorFamily: 'reciprocating',
        feedMethod: 'gravity_flooded',
        condenserTypes: ['evaporative_condenser', 'air_cooled_condenser'],
        expectedEquipment: ['oil_separator', 'high_pressure_receiver'],
        optionalEquipment: ['ammonia_valve_station', 'blast_tunnel_evaporator'],
        reviewFocus: ['Confirm the selected gravity-feed arrangement, surge volume, elevations and liquid-control devices from the approved P&ID.']
    }),
    Object.freeze({
        id: 'DX_AIR_COOLED',
        title: 'Direct-expansion air-cooled refrigeration plant',
        profileFamily: 'hfc-dx',
        compressorFamily: null,
        feedMethod: 'direct_expansion',
        condenserTypes: ['air_cooled_condenser'],
        expectedEquipment: ['air_cooled_condenser', 'liquid_receiver', 'solenoid_valve', 'thermostatic_expansion_valve'],
        optionalEquipment: ['suction_accumulator'],
        reviewFocus: ['Confirm line sizing, TEV selection, receiver volume and defrost method with project conditions.']
    }),
    Object.freeze({
        id: 'R744_TRANSCRITICAL_BOOSTER',
        title: 'R744 transcritical booster refrigeration plant',
        profileFamily: 'co2-transcritical',
        compressorFamily: 'reciprocating',
        feedMethod: 'direct_expansion',
        condenserTypes: ['gas_cooler'],
        expectedEquipment: ['gas_cooler', 'high_pressure_control_valve', 'flash_gas_receiver', 'medium_temperature_compressor_group', 'low_temperature_compressor_group'],
        optionalEquipment: ['parallel_compressor_group', 'suction_accumulator'],
        reviewFocus: ['Confirm high-side control architecture, pressure rating, relief devices, flash-gas routing and manufacturer application envelope.']
    }),
    Object.freeze({
        id: 'R290_DX_AIR_COOLED',
        title: 'R290 direct-expansion air-cooled plant',
        profileFamily: 'propane-a3',
        compressorFamily: 'scroll',
        feedMethod: 'direct_expansion',
        condenserTypes: ['air_cooled_condenser'],
        expectedEquipment: ['air_cooled_condenser', 'liquid_receiver', 'filter_drier', 'thermostatic_expansion_valve'],
        optionalEquipment: ['suction_accumulator'],
        reviewFocus: ['Confirm charge limit, ignition-source control, ventilation, zoning and A3-rated component approvals.']
    }),
    Object.freeze({
        id: 'R32_DX_AIR_COOLED',
        title: 'R32 direct-expansion air-cooled plant',
        profileFamily: 'a2l-dx',
        compressorFamily: 'scroll',
        feedMethod: 'direct_expansion',
        condenserTypes: ['air_cooled_condenser'],
        expectedEquipment: ['air_cooled_condenser', 'liquid_receiver', 'filter_drier', 'thermostatic_expansion_valve'],
        optionalEquipment: ['suction_accumulator'],
        reviewFocus: ['Confirm A2L charge limit, ventilation, ignition-source control and approved A2L-rated components.']
    }),
    Object.freeze({
        id: 'R22_DX_AIR_COOLED_LEGACY',
        title: 'R22 legacy direct-expansion air-cooled plant',
        profileFamily: 'hcfc-legacy-dx',
        compressorFamily: 'reciprocating',
        feedMethod: 'direct_expansion',
        condenserTypes: ['air_cooled_condenser'],
        expectedEquipment: ['air_cooled_condenser', 'liquid_receiver', 'filter_drier', 'thermostatic_expansion_valve'],
        optionalEquipment: ['suction_accumulator'],
        reviewFocus: ['Confirm the refrigerant regulatory status, legal availability, line sizing and component compatibility for the project location.']
    })
]);

const copyTemplate = (template) => template ? {
    id: template.id,
    title: template.title,
    expectedEquipment: [...template.expectedEquipment],
    optionalEquipment: [...template.optionalEquipment],
    reviewFocus: [...template.reviewFocus]
} : null;

function resolveCycleTemplate({ profile, compressorFamily, condenserType, feedMethod }) {
    if (!profile) return null;
    const match = CYCLE_TEMPLATES.find((template) => {
        if (template.profileFamily !== profile.family) return false;
        if (template.feedMethod !== feedMethod) return false;
        if (!template.condenserTypes.includes(condenserType)) return false;
        return !template.compressorFamily || template.compressorFamily === compressorFamily;
    });
    return copyTemplate(match);
}

module.exports = { CYCLE_TEMPLATES, resolveCycleTemplate };
