const axios = require('axios');

const testPrompt = `طراحی یک سیستم تبرید آمونیاک صنعتی برای کارخانه کشتار با 4 اتاق مختلف`;

console.log('\n=== TESTING LIVE BACKEND API ===\n');

axios.post('http://localhost:5000/api/ammonia/design-wizard', {
    userPrompt: testPrompt
})
    .then(response => {
        console.log('✅ Response Status:', response.status);
        console.log('\n📊 Response Structure:');
        console.log('- success:', response.data.success);
        console.log('- data.diagram.nodes:', response.data.data?.diagram?.nodes?.length || 0);
        console.log('- data.diagram.edges:', response.data.data?.diagram?.edges?.length || 0);
        console.log('- data.diagram.metadata:', JSON.stringify(response.data.data?.diagram?.metadata || {}, null, 2));
        console.log('\n📋 Full diagram object keys:', Object.keys(response.data.data?.diagram || {}));

        if (response.data.data?.diagram?.nodes) {
            console.log('\n🔍 First node sample:');
            console.log(JSON.stringify(response.data.data.diagram.nodes[0], null, 2));
        }

        console.log('\n✅ TEST COMPLETE\n');
        process.exit(0);
    })
    .catch(error => {
        console.error('❌ Error:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
        process.exit(1);
    });
