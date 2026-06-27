// Test to find why 0 kW is returned
const axios = require('axios');

async function test() {
    console.log('=== Testing 0 kW Bug ===\n');

    // Test 1: Clear old session and test with full Persian
    console.log('Test: Clearing session and testing fresh...');

    try {
        // Clear session first
        await axios.delete('http://localhost:5000/api/chat/session/test-0kw');
    } catch (e) {
        // Ignore if session doesn't exist
    }

    // Test Persian input
    const response1 = await axios.post('http://localhost:5000/api/chat/message', {
        message: 'سردخانه ۱۵×۲۰×۵ متر تهران -۲۵ درجه برای مرغ',
        sessionId: 'test-0kw'
    });

    console.log('Response type:', response1.data.type);
    console.log('Response:', JSON.stringify(response1.data, null, 2));

    // If recommendations, try confirm
    if (response1.data.type === 'recommendations') {
        console.log('\n--- Confirming recommendations ---');
        const response2 = await axios.post('http://localhost:5000/api/chat/message', {
            message: 'confirm',
            sessionId: 'test-0kw'
        });
        console.log('After confirm type:', response2.data.type);
        console.log('Cooling load:', response2.data.summary?.totalCoolingLoad || 'N/A');
    }

    // If info request, show what's missing
    if (response1.data.type === 'info_request') {
        console.log('\n--- Missing info ---');
        console.log('Completeness:', response1.data.completeness);
        console.log('Questions:', response1.data.questions?.map(q => q.field));
    }

    console.log('\n=== Done ===');
}

test().catch(console.error);
