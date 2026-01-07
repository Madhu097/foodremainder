// Test script to manually trigger notification check
// This helps debug why automatic notifications aren't working

const API_URL = process.env.API_URL || 'http://localhost:5000';
const NOTIFICATION_API_KEY = process.env.NOTIFICATION_API_KEY || 'your-secret-key-here';

async function testNotificationCheck() {
    console.log('========================================');
    console.log('🔔 Testing Notification Check');
    console.log('========================================');
    console.log(`API URL: ${API_URL}`);
    console.log(`Time: ${new Date().toISOString()}`);
    console.log('========================================\n');

    try {
        const url = `${API_URL}/api/notifications/check-all?apiKey=${NOTIFICATION_API_KEY}`;
        console.log(`Calling: ${url}\n`);

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        console.log(`Response Status: ${response.status} ${response.statusText}`);

        const data = await response.json();
        console.log('\n========================================');
        console.log('📊 Response Data:');
        console.log('========================================');
        console.log(JSON.stringify(data, null, 2));
        console.log('========================================\n');

        if (data.success) {
            console.log('✅ SUCCESS!');
            console.log(`   Notifications sent: ${data.notificationsSent}`);
            console.log(`   Duration: ${data.duration}`);
            console.log(`   Auth method: ${data.authMethod}`);

            if (data.results && data.results.length > 0) {
                console.log('\n📋 Notification Results:');
                data.results.forEach((result, index) => {
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
            console.log('❌ FAILED!');
            console.log(`   Error: ${data.message || 'Unknown error'}`);
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
testNotificationCheck().catch(console.error);
