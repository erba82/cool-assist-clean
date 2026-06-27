// Test parsing the slaughterhouse input
const InputParser = require('./core/ai/InputParser');
const parser = new InputParser();

const userInput = `Design me a cold storage room for a poultry slaughterhouse, which has a chilling room with dimensions of 20 x 8 meters and a height of 4 meters for a temperature of -5 degrees Celsius, 4 freezing tunnel rooms with dimensions of 4 x 4 meters each and a height of 4 meters for a temperature of -40 degrees Celsius, with 4 pre-cooling rooms with dimensions of 8 x 10 meters each and a height of 9 meters and a temperature of -5 degrees Celsius and 4 storage rooms with dimensions of 20 x 15 meters each and a height of 9 meters at a temperature of -18 degrees Celsius, in the city of Dubai in the Emirates, the project name is Dubai Industrial Slaughterhouse, ammonia refrigerant`;

console.log('=== Testing InputParser ===\n');
console.log('Input (first 100 chars):', userInput.substring(0, 100) + '...\n');

parser.parse(userInput).then(result => {
    console.log('Project Name:', result.name);
    console.log('Location:', result.location);
    console.log('Refrigerant:', result.refrigerant);
    console.log('Product:', result.product);
    console.log('\nRooms Found:', result.rooms.length);
    console.log('\nRoom Details:');
    result.rooms.forEach((room, i) => {
        console.log(`  ${i + 1}. ${room.name} - ${room.type} - ${room.length}x${room.width}x${room.height}m @ ${room.temperature}°C`);
    });

    console.log('\n=== Expected ===');
    console.log('1. Chilling Room - 20x8x4m @ -5°C (1 room)');
    console.log('2. Freezing Tunnel - 4x4x4m @ -40°C (4 rooms)');
    console.log('3. Pre-cooling Room - 8x10x9m @ -5°C (4 rooms)');
    console.log('4. Storage Room - 20x15x9m @ -18°C (4 rooms)');
    console.log('Total: 13 rooms');
});
