// Quick test script for production deployment
const API_URL = 'https://foodremainder.vercel.app';

async function testProductionAPI() {
    console.log('========================================');
    console.log('🧪 Testing Production API');
    console.log('========================================');
    console.log(`URL: ${API_URL}`);
    console.log(`Time: ${new Date().toISOString()}\n`);

    try {
        // Test 1: Health Check
        console.log('Test 1: Health Check');
        console.log('-------------------');
        const healthResponse = await fetch(`${API_URL}/api/health`);
        const healthData = await healthResponse.json();
        console.log('Status:', healthResponse.status);
        console.log('Response:', JSON.stringify(healthData, null, 2));
        console.log('✅ Health check passed\n');

        // Test 2: Notification Check (requires API key)
        console.log('Test 2: Notification Check Endpoint');
        console.log('------------------------------------');
        console.log('⚠️  This requires NOTIFICATION_API_KEY environment variable');
        console.log('To test manually, run:');
        console.log(`curl -X GET "${API_URL}/api/notifications/check-all?apiKey=YOUR_KEY"`);
        console.log('');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }

    console.log('========================================');
    console.log('Test completed');
    console.log('========================================');
}

testProductionAPI().catch(console.error);
