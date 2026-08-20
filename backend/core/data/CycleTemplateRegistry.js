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
