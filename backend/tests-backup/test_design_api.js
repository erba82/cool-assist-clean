/**
 * Test using direct /design endpoint to bypass chat flow
 */

const http = require('http');

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
    console.log('=== Direct Design API Test ===\n');

    const result = await post('/api/chat/design', {
        message: 'Design a 10x10x4m cold storage at -18C with ammonia refrigerant in Dubai'
    });

    console.log('Success:', result.success);
    console.log('Total Load:', result.summary?.totalCoolingLoad, 'kW');

    if (result.pidData) {
        console.log('\n✅ P&ID Data found!');
        console.log('   Equipment:', result.pidData.equipment?.length);
        console.log('   Pipes:', result.pidData.pipes?.length);
        console.log('   Valves:', result.pidData.valves?.length);
        console.log('   Instruments:', result.pidData.instruments?.length);

        if (result.pidData.valves?.length > 0) {
            console.log('\nValve Details:');
            result.pidData.valves.forEach((v, i) => {
                console.log(`   ${i + 1}. type: ${v.type}, symbolType: ${v.symbolType}`);
                console.log(`      tag: ${v.tag}`);
                console.log(`      pos: x=${v.x?.toFixed(0)}, y=${v.y?.toFixed(0)}`);
            });
        }
    } else {
        console.log('\n❌ NO pidData');
        console.log('   Keys:', Object.keys(result).slice(0, 10).join(', '));
    }
}

test().catch(console.error);
