/**
 * Test script to verify Ollama connection
 */

// Update the environment variable before creating the service
process.env.OLLAMA_BASE_URL = 'http://127.0.0.1:11434';

const OllamaService = require('./services/OllamaService');

async function testOllamaConnection() {
    console.log('🧪 Testing Ollama Connection...');
    
    const ollamaService = new OllamaService();
    
    // Wait a moment for the service to initialize
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (!ollamaService.available) {
        console.log('❌ Ollama service is not available');
        console.log('   Make sure Ollama is running on http://localhost:11434');
        console.log('   Run: ollama serve');
        console.log('   And make sure the model qwen2.5-coder:1.5b is pulled:');
        console.log('   Run: ollama pull qwen2.5-coder:1.5b');
        return;
    }
    
    console.log('✅ Ollama service is available');
    console.log(`   Model: ${ollamaService.model}`);
    
    // Test a sample chat
    console.log('\n💬 Testing sample chat...');
    try {
        const response = await ollamaService.chat('Hello, are you working? Respond in one sentence.');
        if (response.success) {
            console.log('✅ Chat test successful');
            console.log(`   Response: ${response.message.substring(0, 100)}...`);
        } else {
            console.log('❌ Chat test failed:', response.error);
        }
    } catch (error) {
        console.log('❌ Chat test error:', error.message);
    }
    
    // Test conversation history
    console.log('\n🗣️ Testing conversation history...');
    try {
        const sessionId = 'test-session-123';
        const response1 = await ollamaService.chatWithHistory('My name is John', sessionId);
        if (response1.success) {
            console.log('✅ First conversation test successful');
        } else {
            console.log('❌ First conversation test failed:', response1.error);
        }
        
        const response2 = await ollamaService.chatWithHistory('What is my name?', sessionId);
        if (response2.success) {
            console.log('✅ Second conversation test successful');
            console.log(`   Response: ${response2.message.substring(0, 100)}...`);
        } else {
            console.log('❌ Second conversation test failed:', response2.error);
        }
    } catch (error) {
        console.log('❌ Conversation test error:', error.message);
    }
    
    // Get available models
    console.log('\n📚 Getting available models...');
    try {
        const models = await ollamaService.getAvailableModels();
        console.log(`✅ Found ${models.length} models:`);
        models.forEach(model => {
            console.log(`   - ${model.name}`);
        });
    } catch (error) {
        console.log('❌ Failed to get models:', error.message);
    }
    
    console.log('\n🎉 Ollama connection test completed!');
}

// Run the test
testOllamaConnection().catch(console.error);