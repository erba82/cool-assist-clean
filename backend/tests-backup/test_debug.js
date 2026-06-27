const axios = require('axios');

async function testRealFlow() {
    const BASE = 'http://localhost:5000/api/chat';
    const SESSION = 'test-debug-1';

    console.log('=== TEST 1: Design with missing info ===');
    const r1 = await axios.post(`${BASE}/message`, {
        message: '15x20x5m -18C Tehran chicken',
        sessionId: SESSION
    });
    console.log('Response 1:', JSON.stringify(r1.data, null, 2));
    console.log('awaitingConfirmation:', r1.data.awaitingConfirmation);

    console.log('\n=== TEST 2: Confirm ===');
    const r2 = await axios.post(`${BASE}/message`, {
        message: 'confirm',
        sessionId: SESSION
    });
    console.log('Response 2:', JSON.stringify(r2.data, null, 2));
}

testRealFlow().catch(console.error);
