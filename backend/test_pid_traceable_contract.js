'use strict';

const assert = require('assert');
const AdvancedPIDGenerator = require('./services/generative/AdvancedPIDGenerator');

(async () => {
    const generator = new AdvancedPIDGenerator();
    const project = {
        refrigerant: 'R717',
        rooms: [{ id: 'iqf-01', name: 'IQF', type: 'iqf_tunnel', temperature: -35 }],
        designIntent: { valveStationModel: 'DANFOSS_ICF_25_40_4', valveStationDN: 32 },
        semanticCycle: {
            source: 'user-confirmed', compressorFamily: 'screw', condenserType: 'evaporative_condenser', feedMethod: 'pumped_recirculated',
            equipmentPolicy: { includeHighPressureReceiver: true, includeOilSeparator: true, includeLowPressureSeparator: true, includeThermosiphon: true, includeAmmoniaValveStation: true },
            processAreas: [{ id: 'iqf-01', type: 'iqf_tunnel' }]
        }
    };
    const layout = await generator.generate({ summary: { totalCoolingLoad: 500 }, calculations: { compressors: [{ model: 'OS175', capacity: 500, manufacturer: 'Catalogue-verified' }], condensers: [{ model: 'ACI-700', capacity: 700 }], evaporators: [{ roomId: 'iqf-01', model: 'IQF Air Unit', capacity: 500, roomType: 'iqf_tunnel' }] } }, project);
    const station = layout.nodes.find((node) => node.data?.componentType === 'ammonia_valve_station');
    assert(station, 'A pumped R717 IQF branch must include a valve station node.');
    assert.strictEqual(station.data.details.catalogueModelId, 'DANFOSS_ICF_25_40_4');
    assert.strictEqual(station.data.details.nominalDiameter, 32);
    assert(layout.edges.some((edge) => edge.dn === 32 && edge.data.sizingStatus === 'traceable-input-or-calculation'));
    const unresolved = layout.edges.filter((edge) => edge.dn === null);
    assert(unresolved.length > 0, 'Unverified main-line DN values must remain unresolved rather than defaulting.');
    const unresolvedLabels = unresolved.map((edge) => ({ label: edge.label, sizingStatus: edge.data.sizingStatus }));
    assert(unresolved.every((edge) => /DN REVIEW/.test(edge.label) && edge.data.sizingStatus === 'review-required'), JSON.stringify(unresolvedLabels));
    assert(!layout.edges.some((edge) => /DNnull|DNundefined/.test(edge.label)));
    console.log(JSON.stringify({ status: 'passed', checks: ['confirmed-icf-dn-compatible', 'unverified-dn-review-required', 'no-dnnull-labels', 'r717-pumped-topology'] }, null, 2));
})().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
