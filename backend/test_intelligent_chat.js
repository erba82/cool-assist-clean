/**
 * Test Intelligent Chat API
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api/chat';

// Test 1: Greeting
async function testGreeting() {
    console.log('\n========== TEST 1: GREETING ==========');
    try {
        const response = await axios.post(`${BASE_URL}/message`, {
            message: 'Hello',
            sessionId: 'test1'
        });
        console.log('Response:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
    }
}

// Test 2: Incomplete design request
async function testIncompleteDesign() {
    console.log('\n========== TEST 2: INCOMPLETE DESIGN ==========');
    try {
        const response = await axios.post(`${BASE_URL}/message`, {
            message: 'I want to design a cold storage',
            sessionId: 'test2'
        });
        console.log('Response:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
    }
}

// Test 3: Complete design request
async function testCompleteDesign() {
    console.log('\n========== TEST 3: COMPLETE DESIGN ==========');
    try {
        const response = await axios.post(`${BASE_URL}/message`, {
            message: 'cold storage 15x20x5m -18°C Tehran for chicken',
            sessionId: 'test3'
        });
        console.log('Response:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
    }
}

// Test 4: Farsi request
async function testFarsiRequest() {
    console.log('\n========== TEST 4: FARSI REQUEST ==========');
    try {
        const response = await axios.post(`${BASE_URL}/message`, {
            message: 'سردخانه 10x10 منجمد تهران',
            sessionId: 'test4'
        });
        console.log('Response:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
    }
}

// Test 5: Confirmation after recommendations
async function testConfirmation() {
    console.log('\n========== TEST 5: GET RECOMMENDATIONS THEN CONFIRM ==========');
    try {
        // First, get recommendations
        console.log('Step 1: Requesting recommendations...');
        const rec = await axios.post(`${BASE_URL}/message`, {
            message: 'Design 10x15x4m -20C Moscow for meat',
            sessionId: 'test5'
        });
        console.log('Recommendations:', JSON.stringify(rec.data, null, 2));

        // Then confirm
        console.log('\nStep 2: Confirming...');
        const confirm = await axios.post(`${BASE_URL}/message`, {
            message: 'Yes, confirm',
            sessionId: 'test5'
        });
        console.log('Design Result:', JSON.stringify(confirm.data, null, 2));
    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
    }
}

// Run all tests
async function runAllTests() {
    console.log('🧪 Testing Intelligent Chat API v3.0\n');

    await testGreeting();
    await new Promise(resolve => setTimeout(resolve, 1000));

    await testIncompleteDesign();
    await new Promise(resolve => setTimeout(resolve, 1000));

    await testCompleteDesign();
    await new Promise(resolve => setTimeout(resolve, 1000));

    await testFarsiRequest();
    await new Promise(resolve => setTimeout(resolve, 1000));

    await testConfirmation();

    console.log('\n✅ All tests completed!');
}

runAllTests().catch(console.error);
