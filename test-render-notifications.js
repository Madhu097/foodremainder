// Test script for Render deployment
// Replace with your actual Render URL and API key

const RENDER_API_URL = process.env.RENDER_API_URL || 'https://your-app.onrender.com';
const NOTIFICATION_API_KEY = process.env.NOTIFICATION_API_KEY || 'your-api-key';

async function testRenderNotifications() {
    console.log('========================================');
    console.log('🔔 Testing Render Notification System');
    console.log('========================================');
    console.log(`API URL: ${RENDER_API_URL}`);
    console.log(`Time: ${new Date().toISOString()}\n`);

    try {
        // Test 1: Health Check
        console.log('Test 1: Health Check');
        console.log('-------------------');
        const healthUrl = `${RENDER_API_URL}/api/health`;
        console.log(`Calling: ${healthUrl}\n`);

        const healthResponse = await fetch(healthUrl);
        const healthData = await healthResponse.json();

        console.log(`Status: ${healthResponse.status}`);
        console.log('Response:', JSON.stringify(healthData, null, 2));

        if (healthResponse.ok) {
            console.log('✅ Health check passed\n');
        } else {
            console.log('❌ Health check failed\n');
            return;
        }

        // Test 2: Trigger Notification Check
        console.log('Test 2: Trigger Notification Check');
        console.log('-----------------------------------');
        const notifUrl = `${RENDER_API_URL}/api/notifications/check-all?apiKey=${NOTIFICATION_API_KEY}`;
        console.log(`Calling: ${notifUrl}\n`);

        const notifResponse = await fetch(notifUrl);
        const notifData = await notifResponse.json();

        console.log(`Status: ${notifResponse.status}`);
        console.log('Response:', JSON.stringify(notifData, null, 2));

        if (notifData.success) {
            console.log('\n✅ SUCCESS!');
            console.log(`   Notifications sent: ${notifData.notificationsSent}`);
            console.log(`   Duration: ${notifData.duration}`);
            console.log(`   Auth method: ${notifData.authMethod}`);

            if (notifData.results && notifData.results.length > 0) {
                console.log('\n📋 Notification Results:');
                notifData.results.forEach((result, index) => {
                    console.log(`\n   ${index + 1}. User: ${result.username} (${result.userId})`);
                    console.log(`      Items: ${result.itemCount}`);
                    console.log(`      Email: ${result.emailSent ? '✅' : '❌'}`);
                    console.log(`      WhatsApp: ${result.whatsappSent ? '✅' : '❌'}`);
                    console.log(`      SMS: ${result.smsSent ? '✅' : '❌'}`);
                    console.log(`      Telegram: ${result.telegramSent ? '✅' : '❌'}`);
                    console.log(`      Browser Push: ${result.pushSent ? '✅' : '❌'}`);
                });
            } else {
                console.log('\n⚠️ No notifications were sent.');
                console.log('   Possible reasons:');
                console.log('   - No users have expiring items');
                console.log('   - Users are in quiet hours');
                console.log('   - Notification frequency limits not met');
                console.log('   - No notification channels enabled');
            }
        } else {
            console.log('\n❌ FAILED!');
            console.log(`   Error: ${notifData.message || 'Unknown error'}`);
        }

    } catch (error) {
        console.error('\n❌ ERROR:');
        console.error(error.message);
        if (error.stack) {
            console.error('\nStack trace:');
            console.error(error.stack);
        }
    }

    console.log('\n========================================');
    console.log('Test completed');
    console.log('========================================');
}

// Run the test
testRenderNotifications().catch(console.error);
