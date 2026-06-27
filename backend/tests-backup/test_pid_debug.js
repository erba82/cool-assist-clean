/**
 * Test script to debug P&ID valve data
 */

const http = require('http');

const sessionId = 'test-pid-debug-' + Date.now();

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
    console.log('=== Debug P&ID Valve Data ===\n');

    // Simple design request
    const designReq = await post('/api/chat/message', {
        sessionId,
        message: 'Design a 10x10x4m cold storage at -18C in Dubai with ammonia'
    });

    console.log('1. Recommendations received');
    console.log('   awaitingConfirmation:', designReq.awaitingConfirmation);

    // Confirm
    const calcResult = await post('/api/chat/message', {
        sessionId,
        message: 'confirm'
    });

    console.log('\n2. Calculation result:');
    console.log('   Success:', calcResult.success);

    if (calcResult.result?.pid) {
        const pid = calcResult.result.pid;
        console.log('\n3. P&ID Data:');
        console.log('   Equipment count:', pid.equipment?.length || 0);
        console.log('   Pipe count:', pid.pipes?.length || 0);
        console.log('   Valve count:', pid.valves?.length || 0);
        console.log('   Instruments count:', pid.instruments?.length || 0);

        if (pid.valves?.length > 0) {
            console.log('\n4. Sample Valves (first 5):');
            pid.valves.slice(0, 5).forEach((v, i) => {
                console.log(`   ${i + 1}. type: ${v.type}, symbolType: ${v.symbolType}, tag: ${v.tag}, x: ${v.x}, y: ${v.y}`);
            });
        } else {
            console.log('\n   ⚠️ NO VALVES IN P&ID DATA!');
        }

        if (pid.pipes?.length > 0) {
            console.log('\n5. Sample Pipes (first 3):');
            pid.pipes.slice(0, 3).forEach((p, i) => {
                console.log(`   ${i + 1}. type: ${p.type}, size: ${p.size}, from: ${p.from} -> to: ${p.to}`);
            });
        }
    } else {
        console.log('\n   ⚠️ NO P&ID DATA IN RESULT!');
        console.log('   Result keys:', Object.keys(calcResult.result || {}));
    }
}

test().catch(console.error);
