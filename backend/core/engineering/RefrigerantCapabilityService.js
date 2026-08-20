'use strict';

const propertyData = require('../data/refrigerants.json');
const { PROFILES, normalizeRefrigerant } = require('../data/RefrigerantProfiles');
const { resolveCycleTemplate } = require('../data/CycleTemplateRegistry');

const asCompressorFamily = (value) => /scroll/i.test(String(value || '')) ? 'scroll' : /recip|piston/i.test(String(value || '')) ? 'reciprocating' : /screw/i.test(String(value || '')) ? 'screw' : 'unknown';

function capabilityFor(refrigerant) {
    const code = normalizeRefrigerant(refrigerant);
    const profile = PROFILES[code];
    if (!profile) return { code, supported: false, status: 'unsupported', blocking: [`No engineering profile is registered for ${code || 'the requested refrigerant'}.`] };
    const compressorFamily = asCompressorFamily(profile.compressor?.family);
    const condenserType = profile.heatRejection?.type || 'unknown';
    const feedMethod = profile.feedMethod || 'unknown';
    const template = resolveCycleTemplate({ profile, compressorFamily, condenserType, feedMethod });
    const sourceProperties = propertyData[code];
    const hasInternalPropertyTable = Boolean(sourceProperties?.properties && Object.keys(sourceProperties.properties).length);
    const propertyStatus = hasInternalPropertyTable ? 'internal-table-review-required' : 'validated-property-provider-required';

    return {
        code,
        supported: true,
        status: template ? 'semantic-cycle-available-review-required' : 'profile-available-template-pending',
        profile: {
            family: profile.family,
            safetyClass: profile.safetyClass,
            cycle: profile.cycle,
            feedMethod,
            piping: profile.piping,
            safeguards: [...(profile.safeguards || [])],
            componentPolicy: profile.componentPolicy
        },
        defaultSelectionIntent: {
            compressorFamily,
            condenserType,
            liquidManagement: profile.liquidManagement,
            template
        },
        calculationReadiness: {
            propertyStatus,
            hasInternalPropertyTable,
            manufacturerMapStatus: 'manufacturer-performance-map-required',
            note: hasInternalPropertyTable
                ? 'Internal property tables may support preliminary checks only; source revision, applicability range and performance-map validation remain required.'
                : 'No internal property table is treated as sufficient for calculation. Attach an approved thermophysical-property source before final equipment selection.'
        },
        equipmentReadiness: {
            catalogueStatus: 'catalogue-match-required',
            note: 'A semantic equipment class is available. A real model, ports, DN, operating point, availability and supplier quotation must be confirmed before procurement.'
        }
    };
}

function listCapabilities() {
    return Object.keys(PROFILES).sort().map(capabilityFor);
}

module.exports = { capabilityFor, listCapabilities };
