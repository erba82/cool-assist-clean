/**
 * FINAL COMPLETE GFDDE INTEGRATION TEST
 * This will show exactly what's happening
 */

const http = require('http');

const testData = JSON.stringify({
    userPrompt: "طراحی یک سیستم تبرید آمونیاک صنعتی با 4 اتاق: chill -5، precool -5، storage -18، tunnel -40"
});

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/ammonia/design-wizard',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': testData.length
    }
};

console.log('\n=== SENDING REQUEST TO BACKEND ===\n');
console.log('URL:', `http://${options.hostname}:${options.port}${options.path}`);
console.log('Data:', testData);
console.log('\n=== WAITING FOR RESPONSE ===\n');

const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log('\n=== RESPONSE RECEIVED ===\n');
        console.log(`Status Code: ${res.statusCode}`);

        try {
            const result = JSON.parse(data);

            console.log('\n📊 RESPONSE STRUCTURE:');
            console.log('- proposals.gfdde_variants:', result.proposals?.gfdde_variants ? `${result.proposals.gfdde_variants.length} variants` : 'NONE');
            console.log('- diagram.nodes:', result.diagram?.nodes?.length || 0);
            console.log('- diagram.edges:', result.diagram?.edges?.length || 0);
            console.log('- diagram.metadata:', result.diagram?.metadata?.generator || 'N/A');

            if (result.proposals?.gfdde_variants && result.proposals.gfdde_variants.length > 0) {
                console.log('\n✅ GFDDE VARIANTS FOUND:');
                result.proposals.gfdde_variants.forEach((v, i) => {
                    console.log(`   ${i + 1}. ${v.strategy}: Score=${v.rank_score.toFixed(1)}`);
                });
            } else {
                console.log('\n❌ NO GFDDE VARIANTS - Check backend logs!');
            }

            if (result.diagram?.metadata) {
                console.log(`\n🎨 P&ID Generator: ${result.diagram.metadata.generator}`);
            }

            console.log('\n=== TEST COMPLETE ===\n');
            process.exit(0);

        } catch (e) {
            console.error('❌ Failed to parse response:', e.message);
            console.log('Raw response:', data.substring(0, 500));
            process.exit(1);
        }
    });
});

req.on('error', (e) => {
    console.error(`❌ Request failed: ${e.message}`);
    process.exit(1);
});

req.write(testData);
req.end();

// Timeout after 30 seconds
setTimeout(() => {
    console.error('❌ Request timeout!');
    process.exit(1);
}, 30000);
