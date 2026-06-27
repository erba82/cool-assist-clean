const IntentClassifier = require('./core/ai/IntentClassifier');

const classifier = new IntentClassifier();

const msg = '15x20x5m -18C Tehran chicken';
console.log('Message:', msg);
console.log('Length:', msg.length);

const result = classifier.classify(msg, {});
console.log('Result:', JSON.stringify(result, null, 2));

const entities = classifier.extractEntities(msg);
console.log('Entities:', JSON.stringify(entities, null, 2));
