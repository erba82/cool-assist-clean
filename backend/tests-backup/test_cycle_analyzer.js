// Test ThermodynamicCycleAnalyzer with manual example
const ThermodynamicCycleAnalyzer = require('./core/modules/ThermodynamicCycleAnalyzer');
const RefrigerationEngine = require('./core/RefrigerationEngine');

console.log('=== Testing ThermodynamicCycleAnalyzer ===\n');

const engine = new RefrigerationEngine();
const analyzer = new ThermodynamicCycleAnalyzer(engine);

// Test case from manual: -18°C evap, +44°C cond, 60 kW load
console.log('Test Case: Manual Example');
console.log('Evap Temp: -18°C');
console.log('Cond Temp: +44°C');
console.log('Cooling Load: 60 kW');
console.log('Superheat: 8 K');
console.log('Subcool: 4 K\n');

try {
    const analysis = analyzer.analyzeCycle({
        evapTemp: -18,
        condTemp: 44,
        superheat: 8,
        subcool: 4,
        refrigerant: 'R717',
        coolingLoad: 60
    });

    console.log('=== Performance Results ===');
    console.log('COP:', analysis.performance.cop);
    console.log('Mass Flow Rate:', analysis.performance.massFlowRate, 'kg/s');
    console.log('Compressor Work:', analysis.performance.compressorWork, 'kW');
    console.log('Heat Rejection:', analysis.performance.heatRejection, 'kW\n');

    console.log('=== Cycle Points Table ===');
    const table = analyzer.getCyclePointsTable(analysis);
    console.log('Headers:', table.headers.join(' | '));
    table.rows.forEach(row => {
        console.log(`${row.point} | ${row.section} | ${row.temperature}°C | ${row.pressure} bar | ${row.enthalpy} kJ/kg | ${row.entropy} kJ/kg·K | ${row.state}`);
    });

    console.log('\n=== Superheat & Subcool ===');
    const shSc = analyzer.getSuperheatSubcool(analysis);
    console.log('Superheat:', shSc.superheat.value, 'K', `(${shSc.superheat.status})`);
    console.log('Subcool:', shSc.subcool.value, 'K', `(${shSc.subcool.status})`);

    console.log('\n✅ Test completed successfully!');
} catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
}
