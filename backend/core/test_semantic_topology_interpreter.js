'use strict';

const assert = require('assert');
const RefrigerationTopologyInterpreter = require('./engineering/RefrigerationTopologyInterpreter');
const AdvancedPIDGenerator = require('../services/generative/AdvancedPIDGenerator');

const interpreter = new RefrigerationTopologyInterpreter();

const baseProject = {
    refrigerant: 'R717',
    rooms: [{ id: 'IQF-01', name: 'IQF Tunnel 01', type: 'iqf', length: 30, width: 12, height: 5, temperature: -35 }],
    designIntent: {
        compressorType: 'screw', condenserType: 'evaporative_condenser', feedMethod: 'pumped_recirculated',
        thermosiphon: true, ammoniaValveStation: true, oilSeparator: true, horizontalReceiver: true
    }
};

const calculateFixture = {
    summary: { totalCoolingLoad: 500 },
    calculations: {
        compressors: [{ model: 'HSK95', type: 'screw_semi', capacity: 250 }],
        condensers: [{ model: 'Evaporative Condenser', type: 'evaporative_condenser' }],
        receiver: { volume: 3.5 },
        piping: { lines: [{ service: 'discharge', dn: 100 }, { service: 'liquid', dn: 80 }, { service: 'suction', dn: 125 }, { service: 'branch liquid', dn: 32 }, { service: 'branch suction', dn: 50 }] },
        evaporators: [{ tag: 'EVP-IQF-01', model: 'IQF Air Unit', roomId: 'IQF-01', roomName: 'IQF Tunnel 01', roomType: 'iqf_tunnel', capacity: 500, temperature: -35 }]
    }
};

(async () => {
    const pumped = interpreter.interpret(baseProject, calculateFixture.calculations);
    assert.strictEqual(pumped.compressorFamily, 'screw');
    assert.strictEqual(pumped.condenserType, 'evaporative_condenser');
    assert.strictEqual(pumped.feedMethod, 'pumped_recirculated');
    assert.strictEqual(pumped.oilCooling, 'thermosiphon');
    assert.strictEqual(pumped.equipmentPolicy.includeLiquidPump, true);
    assert.strictEqual(pumped.equipmentPolicy.includeAmmoniaValveStation, true);
    assert.strictEqual(pumped.template.id, 'R717_PUMPED_SCREW_EVAPORATIVE');
    assert(pumped.template.expectedEquipment.includes('liquid_pump'));
    assert.strictEqual(pumped.processAreas[0].type, 'iqf_tunnel');

    const generator = new AdvancedPIDGenerator();
    const layout = await generator.generate(calculateFixture, { ...baseProject, semanticCycle: pumped });
    const componentTypes = layout.nodes.map((node) => node.data.componentType);
    assert(componentTypes.includes('screw_compressor'), 'confirmed screw cycle must generate screw compressor');
    assert(componentTypes.includes('evaporative_condenser'), 'confirmed evaporative condenser must be retained');
    assert(componentTypes.includes('centrifugal_pump'), 'pumped-recirculated system must include liquid pump');
    assert(componentTypes.includes('ammonia_valve_station'), 'confirmed ICF station must be represented');
    assert(componentTypes.includes('iqf_tunnel_evaporator'), 'IQF process area must retain an IQF evaporator identity');
    assert(componentTypes.includes('thermosiphon_vessel'), 'explicit thermosiphon must be represented');
    assert(!componentTypes.includes('tev'), 'pumped ammonia branch must not silently become a DX TEV branch');

    const gravity = interpreter.interpret({ refrigerant: 'R717', rooms: [], designIntent: { compressorType: 'reciprocating', condenserType: 'air_cooled_condenser', feedMethod: 'gravity_flooded' } }, {});
    assert.strictEqual(gravity.compressorFamily, 'reciprocating');
    assert.strictEqual(gravity.feedMethod, 'gravity_flooded');
    assert.strictEqual(gravity.equipmentPolicy.includeLiquidPump, false);
    assert.strictEqual(gravity.template.id, 'R717_GRAVITY_RECIP');

    const dx = interpreter.interpret({ refrigerant: 'R404A', rooms: [], designIntent: { compressorType: 'reciprocating', condenserType: 'air_cooled_condenser', feedMethod: 'direct_expansion' } }, {});
    assert.strictEqual(dx.feedMethod, 'direct_expansion');
    assert.strictEqual(dx.equipmentPolicy.includeLiquidPump, false);
    assert.strictEqual(dx.equipmentPolicy.includeLowPressureSeparator, false);
    assert.strictEqual(dx.template.id, 'DX_AIR_COOLED');

    const invalid = interpreter.interpret({ refrigerant: 'UNSUPPORTED-REFRIGERANT', rooms: [], designIntent: {} }, {});
    assert.strictEqual(invalid.validation.valid, false);
    assert(invalid.validation.blocking.length > 0);

    console.log(JSON.stringify({ status: 'passed', scenarios: ['r717-pumped-iqf', 'r717-gravity', 'r404a-dx', 'unsupported-refrigerant'] }, null, 2));
})().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
