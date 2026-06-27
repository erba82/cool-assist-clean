// Test the complete flow with multi-room parsing
const axios = require('axios');

const testMessage = `Design me a cold storage room for a poultry slaughterhouse, which has a chilling room with dimensions of 20 x 8 meters and a height of 4 meters for a temperature of -5 degrees Celsius, 4 freezing tunnel rooms with dimensions of 4 x 4 meters each and a height of 4 meters for a temperature of -40 degrees Celsius, with 4 pre-cooling rooms with dimensions of 8 x 10 meters each and a height of 9 meters and a temperature of -5 degrees Celsius and 4 storage rooms with dimensions of 20 x 15 meters each and a height of 9 meters at a temperature of -18 degrees Celsius, in the city of Dubai in the Emirates, the project name is Dubai Industrial Slaughterhouse, ammonia refrigerant`;

const sessionId = 'test-multiroom-' + Date.now();

async function testFlow() {
    console.log('=== Testing Multi-Room Flow ===\n');

    try {
        // Step 1: Send design request
        console.log('Step 1: Sending design request...');
        const response1 = await axios.post('http://localhost:5000/api/chat/message', {
            message: testMessage,
            sessionId
        });

        console.log('Response type:', response1.data.type);
        console.log('Awaiting confirmation:', response1.data.awaitingConfirmation);

        if (response1.data.projectSummary) {
            console.log('Project summary:', JSON.stringify(response1.data.projectSummary, null, 2));
        }

        // Step 2: Confirm
        if (response1.data.awaitingConfirmation) {
            console.log('\nStep 2: Confirming...');
            const response2 = await axios.post('http://localhost:5000/api/chat/message', {
                message: 'confirm',
                sessionId
            });

            console.log('Response type:', response2.data.type);
            console.log('Success:', response2.data.success);

            if (response2.data.loads) {
                console.log('\n=== LOAD CALCULATION RESULTS ===');
                console.log('Number of rooms:', response2.data.loads.length);
                response2.data.loads.forEach((load, i) => {
                    console.log(`  Room ${i + 1}: ${load.room} - ${load.load} kW @ ${load.temperature}°C`);
                });
            } else if (response2.data.error) {
                console.log('Error:', response2.data.error);
            } else {
                console.log('Full response:', JSON.stringify(response2.data, null, 2).substring(0, 2000));
            }
        }

    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
    }
}

testFlow();
