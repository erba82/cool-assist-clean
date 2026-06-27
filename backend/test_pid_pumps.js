const axios = require('axios');

async function testPID() {
    console.log('Testing P&ID generation...');

    try {
        const res = await axios.post('http://localhost:5000/api/core/design', {
            message: '200 ton cold storage in Dubai for meat'
        }, { timeout: 60000 });

        const pid = res.data.pidData || {};

        console.log('\n=== P&ID ANALYSIS ===\n');
        console.log('Equipment count:', (pid.equipment || []).length);
        console.log('Pipes count:', (pid.pipes || []).length);
        console.log('Valves count:', (pid.valves || []).length);

        console.log('\n--- Equipment Types ---');
        const types = {};
        (pid.equipment || []).forEach(e => {
            types[e.type] = (types[e.type] || 0) + 1;
        });
        console.log(types);

        console.log('\n--- Pumps ---');
        const pumps = (pid.equipment || []).filter(e => e.type === 'pump');
        console.log('Pump count:', pumps.length);
        pumps.forEach((p, i) => {
            console.log(`  Pump ${i + 1}: tag=${p.tag}, x=${p.x}, y=${p.y}`);
        });

        console.log('\n--- Pipes to/from Pumps ---');
        const pumpTags = pumps.map(p => p.tag);
        const pumpPipes = (pid.pipes || []).filter(pipe =>
            pumpTags.includes(pipe.from) || pumpTags.includes(pipe.to)
        );
        console.log('Pipes connected to pumps:', pumpPipes.length);
        pumpPipes.forEach(p => {
            console.log(`  ${p.from} -> ${p.to} (${p.type || 'liquid'})`);
        });

        console.log('\n--- All Pipe Connections ---');
        (pid.pipes || []).slice(0, 10).forEach(p => {
            console.log(`  ${p.from} -> ${p.to} (${p.type || 'unknown'})`);
        });

    } catch (e) {
        console.error('Error:', e.message);
    }
}

testPID();
