'use strict';

const assert = require('assert');
const AdvancedPIDGenerator = require('./services/generative/AdvancedPIDGenerator');

(async () => {
    const generator = new AdvancedPIDGenerator();
    const layout = await generator.generate({
        summary: { totalCoolingLoad: 500 },
        calculations: {
            compressors: [{ tag: 'COMP-SCR-01', type: 'screw', designLoad: 500 }],
            condensers: [{ tag: 'COND-EC-01', type: 'evaporative_condenser', capacity: 600 }],
            evaporators: [{ tag: 'EVAP-IQF-01', capacity: 100 }],
            receiver: {}, piping: { summary: { mainHotGasDN: 80, branchLiquidDN: 32 } }
        }
    }, {
        name: 'Dubai R717 port contract', refrigerant: 'R717', location: { city: 'Dubai', country: 'AE' },
        rooms: [{ id: 'iqf', name: 'IQF Tunnel', load: 100 }],
        designIntent: { compressorFamily: 'screw', feedMethod: 'pumped_recirculated' }, semanticCycle: { type: 'R717_PUMPED_SCREW_EVAPORATIVE' }
    });

    assert.ok(layout.nodes.length > 0, 'Expected P&ID nodes.');
    assert.ok(layout.nodes.every((node) => Array.isArray(node.data?.details?.connectionPorts) && node.data.details.connectionPorts.length >= 2), 'Each node must declare drawing ports.');
    assert.ok(layout.nodes.every((node) => node.data.details.portEvidenceStatus), 'Each node must declare port evidence status.');
    assert.ok(layout.edges.length > 0, 'Expected P&ID edges.');
    assert.ok(layout.edges.every((edge) => edge.data?.sourcePortId && edge.data?.targetPortId), 'Each edge must identify source and target drawing ports.');
    assert.ok(layout.edges.every((edge) => edge.data?.portValidationStatus === 'review-required'), 'Generated drawing endpoints must remain review-required until catalogue/topology validation.');

    console.log(JSON.stringify({ status: 'passed', checks: ['declared-drawing-ports', 'port-evidence-status', 'traceable-edge-endpoints', 'review-gated-port-validation'] }, null, 2));
})().catch((error) => { console.error(error); process.exit(1); });
