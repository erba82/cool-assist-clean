/**
 * Full flow test with proper session tracking
 */

const http = require('http');

const sessionId = 'test-full-flow-' + Date.now();

async function post(path, data) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify(data);
        const req = http.request({
            hostname: 'localhost',
            port: 5000,
            path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        }, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try { resolve(JSON.parse(body)); }
                catch (e) { resolve(body); }
            });
        });
        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

async function test() {
    console.log('=== Full Flow P&ID Test ===');
    console.log('Session:', sessionId);

    // Step 1: Design request
    console.log('\n1. Sending design request...');
    const rec = await post('/api/chat/message', {
        sessionId,
        message: 'Design a 10x10x4m cold storage at -18C with ammonia in Dubai'
    });

    console.log('   Type:', rec.type);
    console.log('   awaitingConfirmation:', rec.awaitingConfirmation);

    if (!rec.awaitingConfirmation) {
        console.log('   ❌ No confirmation requested, aborting');
        return;
    }

    // Step 2: Confirm
    console.log('\n2. Confirming...');
    const result = await post('/api/chat/message', {
        sessionId,
        message: 'confirm'
    });

    console.log('   Success:', result.success);
    console.log('   Type:', result.type);

    // Step 3: Check for pidData
    if (result.pidData) {
        console.log('\n3. ✅ P&ID Data received!');
        console.log('   Equipment:', result.pidData.equipment?.length);
        console.log('   Pipes:', result.pidData.pipes?.length);
        console.log('   Valves:', result.pidData.valves?.length);
        console.log('   Instruments:', result.pidData.instruments?.length);

        if (result.pidData.valves?.length > 0) {
            console.log('\n4. Valve details:');
            result.pidData.valves.forEach((v, i) => {
                console.log(`   ${i + 1}. type: ${v.type}, symbolType: ${v.symbolType}, tag: ${v.tag}`);
            });
        }
    } else {
        console.log('\n3. ❌ NO pidData in result');
        console.log('   Keys:', Object.keys(result).join(', '));

        // Maybe it's nested in result field?
        if (result.result?.pidData) {
            console.log('   Found in result.result.pidData!');
        }
    }
}

test().catch(console.error);
