const HighPrecisionEngine = require('./backend/services/HighPrecisionEngine');
const AmmoniaProperties = require('./backend/utils/AmmoniaProperties');
const ProductProperties = require('./backend/data/ProductProperties');

// Mock data based on user prompt and likely AI extraction
const mockSpecs = {
    projectInfo: { ambientTemp: 40 }, // Dubai
    rooms: [
        {
            name: "storage",
            type: "storage",
            L: 20, W: 15, H: 9,
            temp: -18,
            product: {
                type: "mixed", // likely default
                mass: 810000, // 2700m3 * 300kg/m3 (from prompt default)
                entryTemp: -18, // If storage, maybe entry is same as room?
                targetTemp: -18,
                time: 24
            }
        },
        {
            name: "precool",
            type: "precool",
            L: 10, W: 8, H: 9,
            temp: -5,
            product: {
                type: "poultry",
                mass: 20000, // guess
                entryTemp: 5, // from user prompt
                targetTemp: -5,
                time: 24
            }
        }
    ]
};

console.log("=== Debugging Load Calculations ===");

mockSpecs.rooms.forEach(room => {
    console.log(`\nRoom: ${room.name}`);
    console.log(`Dimensions: ${room.L}x${room.W}x${room.H}`);
    console.log(`Temp: ${room.temp}°C`);
    console.log(`Product:`, room.product);

    // Check Enthalpy
    if (room.product) {
        const props = ProductProperties.getProductProperties(room.product.type);
        const hChange = AmmoniaProperties.calculateProductEnthalpyChange(
            room.product.entryTemp,
            room.product.targetTemp,
            props.freezingPoint,
            props
        );
        console.log(`Enthalpy Change: ${hChange} kJ/kg`);
    }

    const load = HighPrecisionEngine.calculateRoomLoad(room, 40);
    console.log("Load Breakdown:", load);
});
