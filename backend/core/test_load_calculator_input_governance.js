'use strict';

const assert = require('assert');
const LoadCalculator = require('./modules/LoadCalculator');
const materials = require('./data/materials.json');
const products = require('./data/products.json');

const engine = { getData: (key) => ({ materials, products })[key] };
const calculator = new LoadCalculator(engine);
const project = {
    climate: { summerDB: 35, groundTemperatureC: 18 },
    loadAllowanceFactor: 1.05,
    product: { type: 'chicken', dailyThroughput: 1200, entryTemp: 4 }
};
const completeRoom = {
    name: 'Validated freezer', length: 12, width: 8, height: 5, temperature: -25,
    insulation: { type: 'polyurethane_40', thickness: 150 }, floorUFactor: 0.8,
    door: { width: 2.5, height: 2.8, openingsPerDay: 8, openDuration: 6 }, doorProtection: 0.7,
    occupancy: 0, occupancyHours: 0, lightingPower: 0, lightingHours: 0, equipmentPower: 0, equipmentHours: 0
};

(async () => {
    const calculated = await calculator.calculateRoom(completeRoom, project);
    assert.strictEqual(calculated.calculationStatus, 'calculated');
    assert(calculated.total > 0 && Number.isFinite(calculated.total));
    assert.strictEqual(calculated.internal.people, 0);
    assert.strictEqual(calculated.internal.lighting, 0);

    const zeroDegree = await calculator.calculateRoom({ ...completeRoom, temperature: 0 }, project);
    assert.strictEqual(zeroDegree.temperature, 0);

    const incompleteWithDeclaredLoad = await calculator.calculateRoom({ name: 'Declared design load', temperature: -20, specifiedCoolingLoadKW: 100 }, project);
    assert.strictEqual(incompleteWithDeclaredLoad.total, 100);
    assert.strictEqual(incompleteWithDeclaredLoad.calculationStatus, 'input-required');
    assert.strictEqual(incompleteWithDeclaredLoad.dimensions, null);

    const multiRoomProject = { ...project, rooms: [{ id: 'room-1' }, { id: 'room-2' }], specifiedCoolingLoadKW: 200 };
    await assert.rejects(
        () => calculator.calculateRoom({ name: 'Unallocated room', temperature: -20, specifiedCoolingLoadKW: null }, multiRoomProject),
        /Room length, width and height/
    );

    const noThroughput = await calculator.calculateRoom({ ...completeRoom, product: { type: 'chicken', entryTemp: 4 } }, { ...project, product: null });
    assert.strictEqual(noThroughput.product.status, 'input-required');
    assert.strictEqual(noThroughput.product.total, 0);

    const unknownProduct = await calculator.calculateRoom({ ...completeRoom, product: { type: 'unknown-product', dailyThroughput: 1000, entryTemp: 4 } }, { ...project, product: null });
    assert.strictEqual(unknownProduct.product.status, 'input-required');

    console.log(JSON.stringify({ status: 'passed', checks: ['explicit-si-room-inputs', 'zero-preserved', 'declared-load-review-state', 'project-total-not-duplicated-across-rooms', 'no-throughput-estimate', 'unknown-product-blocked'] }, null, 2));
})().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
