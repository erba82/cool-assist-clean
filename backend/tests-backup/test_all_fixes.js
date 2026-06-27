// Test ALL bug fixes
const IntentClassifier = require('./core/ai/IntentClassifier');
const classifier = new IntentClassifier();

console.log('=== Testing ALL Bug Fixes ===\n');

// Test 1: Persian Numbers (Bug 1)
console.log('--- BUG 1: Persian Numbers ---');
const msg1 = 'سردخانه ۱۵×۲۰×۵ متر تهران -۲۵ درجه برای مرغ';
const entities1 = classifier.extractEntities(msg1);
console.log('Input:', msg1);
console.log('Dimensions:', entities1.dimensions);
console.log('Pass:', entities1.dimensions?.length === 15 ? '✅' : '❌');

// Test 2: Language Detection (Bug 3)
console.log('\n--- BUG 3a: Language Detection ---');
const lang1 = classifier.detectLanguage(msg1);
console.log('Language for Persian message:', lang1);
console.log('Expected: fa, Got:', lang1, lang1 === 'fa' ? '✅' : '❌');

// Test 3: Location Detection (Bug 3)
console.log('\n--- BUG 3b: Location Detection ---');
console.log('Location extracted:', entities1.locations);
console.log('Expected: Iran, Got:', entities1.locations, entities1.locations === 'Iran' ? '✅' : '❌');

// Test 4: Full Classification
console.log('\n--- Full Classification ---');
const result = classifier.classify(msg1, {});
console.log('Intent:', result.intent, result.intent === 'DESIGN_REQUEST' ? '✅' : '❌');
console.log('Language:', result.language, result.language === 'fa' ? '✅' : '❌');
console.log('Location:', result.entities.locations, result.entities.locations === 'Iran' ? '✅' : '❌');
console.log('Temperature:', result.entities.temperatures?.[0], result.entities.temperatures?.[0] === -25 ? '✅' : '❌');

// Test 5: More locations
console.log('\n--- More Location Tests ---');
const tests = [
    { input: 'cold storage in Dubai', expected: 'UAE' },
    { input: 'دبی', expected: 'UAE' },
    { input: 'مشهد', expected: 'Iran' },
    { input: 'Berlin', expected: 'Germany' }
];

tests.forEach(t => {
    const loc = classifier._extractLocations(t.input);
    console.log(`"${t.input}" → "${loc}" (expected: ${t.expected}) ${loc === t.expected ? '✅' : '❌'}`);
});

console.log('\n=== All Tests Complete ===');
