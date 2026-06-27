// Test Persian number conversion
const IntentClassifier = require('./core/ai/IntentClassifier');
const classifier = new IntentClassifier();

console.log('=== Testing Persian Number Conversion ===\n');

// Test 1: Persian digits in dimensions
console.log('Test 1: Persian dimensions "۱۵×۲۰ متر"');
const msg1 = 'سردخانه ۱۵×۲۰ متر';
const entities1 = classifier.extractEntities(msg1);
console.log('Dimensions:', entities1.dimensions);
console.log('Expected: length=15, width=20, height=5 (default)');
console.log('Pass:', entities1.dimensions?.length === 15 && entities1.dimensions?.width === 20);

// Test 2: Persian digits in temperature
console.log('\nTest 2: Persian temperature "-۲۵ درجه"');
const msg2 = 'دمای -۲۵ درجه';
const entities2 = classifier.extractEntities(msg2);
console.log('Temperatures:', entities2.temperatures);
console.log('Expected: [-25]');
console.log('Pass:', entities2.temperatures?.[0] === -25);

// Test 3: Mixed Persian and English
console.log('\nTest 3: Mixed "15x20 متر تهران -۲۰ درجه مرغ"');
const msg3 = 'سردخانه 15x20 متر تهران -۲۰ درجه مرغ';
const entities3 = classifier.extractEntities(msg3);
console.log('All entities:', JSON.stringify(entities3, null, 2));

// Test 4: Full Persian message
console.log('\nTest 4: Full Persian "سردخانه ۱۵×۲۰×۵ متر تهران -۲۵ درجه برای مرغ"');
const msg4 = 'سردخانه ۱۵×۲۰×۵ متر تهران -۲۵ درجه برای مرغ';
const result4 = classifier.classify(msg4, {});
console.log('Classification:', result4.intent);
console.log('Entities:', JSON.stringify(result4.entities, null, 2));

console.log('\n=== Done ===');
