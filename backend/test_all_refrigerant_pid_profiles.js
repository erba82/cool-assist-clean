'use strict';

const assert = require('assert');
const AdvancedPIDGenerator = require('./services/generative/AdvancedPIDGenerator');
const { listCapabilities } = require('./core/engineering/RefrigerantCapabilityService');

(async () => {
    const generator = new AdvancedPIDGenerator();
    const outputs = [];
    for (const capability of listCapabilities()) {
        const profile = capability.profile;
        const layout = await generator.generate({ summary: { totalCoolingLoad: 80 }, calculations: { piping: { lines: [] } } }, {
            refrigerant: capability.code,
            rooms: [{ id: 'ROOM-01', name: 'Validation room', type: 'storage' }],
            semanticCycle: {
                compressorFamily: capability.defaultSelectionIntent.compressorFamily,
                condenserType: capability.defaultSelectionIntent.condenserType,
                feedMethod: profile.feedMethod,
                equipmentPolicy: {
                    includeHighPressureReceiver: capability.code === 'R717' || capability.code === 'R744',
                    includeLowPressureSeparator: capability.code === 'R717',
                    includeLiquidPump: capability.code === 'R717'
                }
            }
        });
        assert.ok(layout.nodes.length > 0, `${capability.code} must produce equipment.`);
        assert.ok(layout.edges.length > 0, `${capability.code} must produce lines.`);
        assert.ok(layout.edges.every((edge) => edge.data.medium === capability.code), `${capability.code} lines must retain medium.`);
        const types = layout.nodes.map((node) => node.data.componentType);
        if (capability.code === 'R290' || capability.code === 'R32' || capability.code === 'R410A') assert.ok(types.includes('scroll_compressor'), `${capability.code} must preserve scroll family.`);
        if (capability.code !== 'R717') assert.ok(!types.includes('ammonia_valve_station') && !types.includes('centrifugal_pump'), `${capability.code} must not receive ammonia-only equipment.`);
        outputs.push({ code: capability.code, nodes: layout.nodes.length, edges: layout.edges.length });
    }
    console.log(JSON.stringify({ status: 'passed', checks: ['all-profile-pid-generation', 'refrigerant-line-metadata', 'scroll-profile-preserved', 'ammonia-components-isolated'], outputs }, null, 2));
})().catch((error) => { console.error(error); process.exit(1); });
