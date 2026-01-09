// Check if users exist in the database
const RENDER_API_URL = 'https://foodremainder-api.onrender.com';

async function checkDatabase() {
    console.log('========================================');
    console.log('🔍 Checking Database Status');
    console.log('========================================\n');

    try {
        // This assumes you have a test user or can check via the health endpoint
        console.log('Checking API health and service status...\n');

        const healthResponse = await fetch(`${RENDER_API_URL}/api/health`);
        const healthData = await healthResponse.json();

        console.log('Services Status:');
        console.log('----------------');
        console.log(`Email: ${healthData.services.email ? '✅ Configured' : '❌ Not configured'}`);
        console.log(`WhatsApp: ${healthData.services.whatsapp ? '✅ Configured' : '❌ Not configured'}`);
        console.log(`Telegram: ${healthData.services.telegram ? '✅ Configured' : '❌ Not configured'}`);
        console.log(`Push: ${healthData.services.push ? '✅ Configured' : '❌ Not configured'}`);

        console.log('\n========================================');
        console.log('Next Steps:');
        console.log('========================================');
        console.log('1. Log into your app at: https://foodremainder-api.onrender.com');
        console.log('2. Create a test user account');
        console.log('3. Add a food item that expires in 1-3 days');
        console.log('4. Enable at least one notification channel (Email/WhatsApp/Telegram)');
        console.log('5. Run the notification check again');
        console.log('\nOR use the test notification button in your app to verify notifications work!');
        console.log('========================================\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

checkDatabase().catch(console.error);
