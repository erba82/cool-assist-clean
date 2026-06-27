// Test Phase 2 enhancements
const RefrigerationEngine = require('./core/RefrigerationEngine');
const EvaporatorSelector = require('./core/modules/EvaporatorSelector');

console.log('=== Testing Phase 2: Enhanced Calculations ===\n');

const engine = new RefrigerationEngine();
const evapSelector = new EvaporatorSelector(engine);

// Test TD optimization for different room types
const testCases = [
    { name: 'Chiller (+2°C)', temp: 2, type: 'chilling', expectedTD: '3-5K' },
    { name: 'Cold Storage (-18°C)', temp: -18, type: 'freezer', expectedTD: '8-12K' },
    { name: 'Blast Freezer (-30°C)', temp: -30, type: 'blast', expectedTD: '10-15K' }
];

console.log('=== TD Optimization Tests ===\n');

testCases.forEach(async (testCase) => {
    console.log(`\nTest: ${testCase.name}`);
    console.log(`Room Temp: ${testCase.temp}°C`);

    const load = {
        room: {
            name: testCase.name,
            temperature: testCase.temp,
            length: 10,
            width: 8,
            height: 3
        },
        total: 50,
        temperature: testCase.temp
    };

    const project = { refrigerant: 'R717' };

    try {
        const selection = await evapSelector.select(load, project);

        console.log('TD Optimization:');
        console.log('  Value:', selection.parameters.tdOptimization.value, 'K');
        console.log('  Range:', `${selection.parameters.tdOptimization.min}-${selection.parameters.tdOptimization.max}K`);
        console.log('  Status:', selection.parameters.tdOptimization.status);
        console.log('  Reason:', selection.parameters.tdOptimization.reason);

        console.log('Fin Spacing:');
        console.log('  Spacing:', selection.technicalSpecs.finSpacing, 'mm');
        console.log('  Range:', selection.technicalSpecs.finSpacingRange);
        console.log('  Reason:', selection.technicalSpecs.finSpacingReason);

        console.log('Evaporating Temp:', selection.evaporatingTemp, '°C');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
});

console.log('\n\n=== PipingCalculator Mass Flow Test ===\n');

// Simulate compressor with mass flow rate
const mockCalculations = {
    temperatureLevels: {
        'T1': {
            evaporatingTemp: -18,
            totalLoad: 60
        }
    },
    compressors: [{
        evaporatingTemp: -18,
        massFlowRate: 0.058  // From cycle analysis
    }]
};

const PipingCalculator = require('./core/modules/PipingCalculator');
const pipingCalc = new PipingCalculator(engine);

pipingCalc.size(mockCalculations, { refrigerant: 'R717' }).then(result => {
    console.log('Suction Line Sizing:');
    console.log('  Mass Flow:', result.suction[0].massFlow, 'kg/s');
    console.log('  Method:', result.suction[0].method);
    console.log('  Pipe Size:', result.suction[0].size);
    console.log('  Velocity:', result.suction[0].velocity, 'm/s');
    console.log('  Velocity OK:', result.suction[0].velocityOK);

    console.log('\n✅ Phase 2 tests completed!');
}).catch(error => {
    console.error('❌ Piping test failed:', error.message);
});
