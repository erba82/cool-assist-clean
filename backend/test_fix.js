const InputParser = require('./core/ai/InputParser');
const CompressorSelector = require('./core/modules/CompressorSelector');
// Mock Engine

// Mock Engine
const mockEngine = {
    getData: (type) => {
        if (type === 'refrigerants') return { 'R717': { properties: {} } };
        return {};
    }
};

const parser = new InputParser();
const selector = new CompressorSelector(mockEngine);

const text = "Design me a cold storage room for a poultry slaughterhouse, which has a chilling room with dimensions of 20 x 8 meters and a height of 4 meters for a temperature of -5 degrees Celsius. 4 freezing tunnel rooms with dimensions of 4 x 4 meters each and a height of 4 meters for a temperature of -40 degrees Celsius, with 4 pre-cooling rooms with dimensions of 8 x 10 meters each and a height of 9 meters and a temperature of -5 degrees Celsius and 4 storage rooms with dimensions of 20 x 15 meters each and a height of 9 meters at a temperature of -18 degrees Celsius.";

console.log("--- 1. Testing InputParser ---");
const project = parser.parse(text);
console.log("Parsed Rooms:", JSON.stringify(project.rooms, null, 2));

console.log("\n--- 2. Testing CompressorSelector ---");
// Simulate selection for the first room
if (project.rooms.length > 0) {
    const room = project.rooms[0];
    const load = room.length * room.width * room.height * 0.1; // Dummy load
    console.log(`Simulated Load for ${room.name}: ${load} kW`);

    // We need to inject catalog data into selector or mock it if it uses hardcoded data
    // CompressorSelector uses this.compressorSeries.

    try {
        const selection = selector.select(load, room.temperature, 'R717', { rooms: [room] }, {});
        console.log("Selection Result:", JSON.stringify(selection, null, 2));
    } catch (error) {
        console.error("Selection Error:", error);
    }
}
