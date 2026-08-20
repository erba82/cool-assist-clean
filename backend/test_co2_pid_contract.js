'use strict';

const assert = require('assert');
const AdvancedPIDGenerator = require('./services/generative/AdvancedPIDGenerator');

(async () => {
    const generator = new AdvancedPIDGenerator();
    const layout = await generator.generate({
        summary: { totalCoolingLoad: 180 },
        calculations: {
            compressors: [{ model: 'CO2 compressor — manufacturer confirmation required', type: 'reciprocating' }],
            condensers: [{ type: 'gas_cooler', model: 'CO2 gas cooler — manufacturer confirmation required' }],
            piping: { lines: [{ service: 'discharge', dn: 50 }, { service: 'liquid', dn: 32 }, { service: 'suction', dn: 65 }, { service: 'branch liquid', dn: 20 }, { service: 'branch suction', dn: 32 }] }
        }
    }, {
        refrigerant: 'R744',
        rooms: [{ id: 'MT-01', name: 'Medium-temperature cold room', type: 'storage' }],
        semanticCycle: { compressorFamily: 'reciprocating', condenserType: 'gas_cooler', feedMethod: 'direct_expansion', source: 'user-confirmed' }
    });
    const labels = layout.nodes.map((node) => String(node.data.label));
    assert.ok(labels.some((label) => /Gas Cooler/i.test(label)), 'Expected CO2 gas cooler.');
    assert.ok(labels.some((label) => /High-Pressure Control Valve/i.test(label)), 'Expected CO2 high-pressure valve.');
    assert.ok(labels.some((label) => /Flash Gas Receiver/i.test(label)), 'Expected flash-gas receiver.');
    assert.ok(labels.some((label) => /Electronic Expansion Valve/i.test(label)), 'Expected CO2 EEV.');
    assert.ok(!labels.some((label) => /Ammonia|Danfoss ICF|Liquid Recirculation Pump/i.test(label)), 'CO2 layout must not include ammonia-only components.');
    assert.ok(layout.edges.every((edge) => edge.data.medium === 'R744'), 'Every line must retain R744 medium metadata.');
    console.log(JSON.stringify({ status: 'passed', checks: ['co2-gas-cooler', 'high-pressure-control', 'flash-gas-receiver', 'co2-eev', 'no-ammonia-components', 'r744-line-metadata'] }, null, 2));
})().catch((error) => { console.error(error); process.exit(1); });
