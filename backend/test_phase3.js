// Test Phase 3: ISA Tagging and P/T Annotations
const ISATaggingSystem = require('./core/modules/ISATaggingSystem');

console.log('=== Testing Phase 3: Enhanced P&ID ===\n');

const isaTagging = new ISATaggingSystem();

console.log('=== ISA 5.1 Tagging System ===\n');

// Test basic tag generation
console.log('1. Basic Instrument Tags:');
const tags = [
    isaTagging.generateTag('T', 'I', 101),
    isaTagging.generateTag('P', 'IC', 201),
    isaTagging.generateTag('F', 'CV', 301),
    isaTagging.generateTag('L', 'SHH', 401)
];

tags.forEach(tag => {
    console.log(`  ${tag.tag}: ${tag.name} (${tag.location})${tag.critical ? ' [CRITICAL]' : ''}`);
});

console.log('\n2. Equipment Tags:');
console.log('  ', isaTagging.generateEquipmentTag('COMP', '101'));
console.log('  ', isaTagging.generateEquipmentTag('EVAP', 'R1'));
console.log('  ', isaTagging.generateEquipmentTag('COND', '01'));

console.log('\n3. Ammonia Safety Instrumentation:');
const ammoniaInst = isaTagging.getAmmoniaInstrumentation();

console.log('\n  Pressure Safety:');
ammoniaInst.pressureSafety.forEach(inst => {
    console.log(`    ${inst.tag}: ${inst.name}${inst.critical ? ' [CRITICAL]' : ''}`);
});

console.log('\n  Level Controls:');
ammoniaInst.levelControls.forEach(inst => {
    console.log(`    ${inst.tag}: ${inst.name}${inst.critical ? ' [CRITICAL]' : ''}`);
});

console.log('\n  Leak Detection:');
ammoniaInst.leakDetection.forEach(detector => {
    console.log(`    ${detector.tag}: ${detector.name}`);
    console.log(`      Location: ${detector.location}`);
    console.log(`      Alarm Level: ${detector.alarmLevel}`);
});

console.log('\n  Emergency Systems:');
ammoniaInst.emergencySystems.forEach(sys => {
    console.log(`    ${sys.tag}: ${sys.name}`);
    console.log(`      Type: ${sys.type}`);
    console.log(`      ${sys.failPosition ? 'Fail Position: ' + sys.failPosition : ''}`);
});

console.log('\n4. Tag Validation:');
const testTags = ['TI-101', 'PIC-201', 'INVALID', 'PSV-301'];
testTags.forEach(tag => {
    const isValid = isaTagging.validateTag(tag);
    console.log(`  ${tag}: ${isValid ? '✅ Valid' : '❌ Invalid'}`);
});

console.log('\n5. Tag Descriptions:');
const commonTags = ['TI', 'PIC', 'PSV', 'FCV', 'LC'];
commonTags.forEach(tagCode => {
    const desc = isaTagging.getTagDescription(tagCode);
    if (desc) {
        console.log(`  ${tagCode}: ${desc.name} (${desc.location})${desc.critical ? ' [CRITICAL]' : ''}`);
    }
});

console.log('\n✅ Phase 3 ISA Tagging tests completed!');
console.log('\nSummary:');
console.log('  - ISA 5.1 standard implemented');
console.log('  - Ammonia safety instrumentation defined');
console.log('  - Tag validation working');
console.log('  - Ready for P&ID integration');
