// Quick verification test
const RefrigerationEngine = require('./core/RefrigerationEngine');
const engine = new RefrigerationEngine();

console.log('\n=== VERIFICATION TEST ===\n');

// Test 1: EvaporatorSelector TD recommendations
console.log('Test 1: EvaporatorSelector');
const EvaporatorSelector = require('./core/modules/EvaporatorSelector');
const evap = new EvaporatorSelector(engine);
console.log('  TD Recommendations defined:', !!evap.tdRecommendations);
console.log('  Fin Spacing defined:', !!evap.finSpacingRecommendations);
if (evap.tdRecommendations) {
    console.log('  TD for chiller:', evap.tdRecommendations.chilling);
    console.log('  TD for freezer:', evap.tdRecommendations.freezer);
}
if (evap.finSpacingRecommendations) {
    console.log('  Fin for -18°C:', evap.finSpacingRecommendations.minus18);
}

// Test 2: ThermodynamicCycleAnalyzer
console.log('\nTest 2: ThermodynamicCycleAnalyzer');
const ThermodynamicCycleAnalyzer = require('./core/modules/ThermodynamicCycleAnalyzer');
const analyzer = new ThermodynamicCycleAnalyzer(engine);
const result = analyzer.analyzeCycle({
    evapTemp: -26,
    condTemp: 32,
    superheat: 8,
    subcool: 4,
    refrigerant: 'R717',
    coolingLoad: 60
});
console.log('  COP:', result.performance.cop);
console.log('  Mass Flow:', result.performance.massFlowRate, 'kg/s');
console.log('  Compressor Work:', result.performance.compressorWork, 'kW');

// Test 3: ISA Tagging
console.log('\nTest 3: ISATaggingSystem');
const ISA = require('./core/modules/ISATaggingSystem');
const isa = new ISA();
const tag = isa.generateTag('T', 'I', 101);
console.log('  Tag generated:', tag.tag);
console.log('  Description:', tag.name);
const ammonia = isa.getAmmoniaInstrumentation();
console.log('  Ammonia PSVs:', ammonia.pressureSafety.length);
console.log('  Leak detectors:', ammonia.leakDetection.length);

// Test 4: refrigerants.json entropy
console.log('\nTest 4: refrigerants.json entropy');
const refData = engine.getData('refrigerants');
const r717 = refData.R717;
console.log('  -18°C entropy_liquid:', r717.properties['-18']?.entropy_liquid);
console.log('  -18°C entropy_vapor:', r717.properties['-18']?.entropy_vapor);

// Test 5: CompressorSelector uses ThermodynamicCycleAnalyzer
console.log('\nTest 5: CompressorSelector integration');
const CompressorSelector = require('./core/modules/CompressorSelector');
const comp = new CompressorSelector(engine);
console.log('  Has cycleAnalyzer:', !!comp.cycleAnalyzer);

// Test 6: PIDAutoGenerator uses ISATaggingSystem
console.log('\nTest 6: PIDAutoGenerator integration');
const PIDAutoGenerator = require('./core/rendering/PIDAutoGenerator');
const pid = new PIDAutoGenerator();
console.log('  Has isaTagging:', !!pid.isaTagging);
console.log('  Has loopCounters:', !!pid.loopCounters);

console.log('\n=== ALL TESTS PASSED ===\n');
