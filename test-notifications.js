#!/usr/bin/env node

/**
 * Notification System Test Script
 * 
 * This script helps test and debug the notification system.
 * Run with: node test-notifications.js
 */

const API_BASE_URL = process.env.API_URL || 'http://localhost:5000';

console.log('='.repeat(60));
console.log('🔔 NOTIFICATION SYSTEM TEST SCRIPT');
console.log('='.repeat(60));
console.log(`API URL: ${API_BASE_URL}`);
console.log('');

async function testHealthCheck() {
    console.log('1️⃣ Testing API Health...');
    try {
        const response = await fetch(`${API_BASE_URL}/api/health`);
        const data = await response.json();

        console.log('   ✅ API is responding');
        console.log('   Services configured:');
        console.log(`      Email: ${data.services.email ? '✅' : '❌'}`);
        console.log(`      WhatsApp (Twilio): ${data.services.whatsapp ? '✅' : '❌'}`);
        console.log(`      WhatsApp (Cloud): ${data.services.whatsappCloud ? '✅' : '❌'}`);
        console.log(`      Telegram: ${data.services.telegram ? '✅' : '❌'}`);
        console.log(`      Push: ${data.services.push ? '✅' : '❌'}`);
        console.log('');
        return true;
    } catch (error) {
        console.error('   ❌ Failed to connect to API');
        console.error(`   Error: ${error.message}`);
        console.log('');
        return false;
    }
}

async function testNotificationCheckAll() {
    console.log('2️⃣ Testing Notification Check for All Users...');
    try {
        const response = await fetch(`${API_BASE_URL}/api/notifications/check-all`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        const data = await response.json();

        if (response.ok) {
            console.log('   ✅ Notification check completed');
            console.log(`   Notifications sent: ${data.notificationsSent}`);
            console.log('');

            if (data.results && data.results.length > 0) {
                console.log('   📊 Results by user:');
                data.results.forEach((result, index) => {
                    console.log(`   ${index + 1}. ${result.username} (${result.itemCount} items)`);
                    console.log(`      Email: ${result.emailSent ? '✅' : '❌'}`);
                    console.log(`      WhatsApp: ${result.whatsappSent ? '✅' : '❌'}`);
                    console.log(`      SMS: ${result.smsSent ? '✅' : '❌'}`);
                    console.log(`      Telegram: ${result.telegramSent ? '✅' : '❌'}`);
                    console.log(`      Push: ${result.pushSent ? '✅' : '❌'}`);
                });
            } else {
                console.log('   ℹ️  No users with expiring items found');
            }
            console.log('');
            return true;
        } else {
            console.error('   ❌ Notification check failed');
            console.error(`   Error: ${data.message}`);
            console.log('');
            return false;
        }
    } catch (error) {
        console.error('   ❌ Failed to run notification check');
        console.error(`   Error: ${error.message}`);
        console.log('');
        return false;
    }
}

async function testUserNotification(userId) {
    console.log(`3️⃣ Testing Notification for User: ${userId}...`);
    try {
        const response = await fetch(`${API_BASE_URL}/api/notifications/test/${userId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        const data = await response.json();

        if (data.success) {
            console.log('   ✅ Test notification sent');
            console.log(`   ${data.message}`);
            console.log('');
            return true;
        } else {
            console.error('   ❌ Test notification failed');
            console.error(`   ${data.message}`);
            console.log('');
            return false;
        }
    } catch (error) {
        console.error('   ❌ Failed to send test notification');
        console.error(`   Error: ${error.message}`);
        console.log('');
        return false;
    }
}

async function getUserPreferences(userId) {
    console.log(`4️⃣ Getting Notification Preferences for User: ${userId}...`);
    try {
        const response = await fetch(`${API_BASE_URL}/api/notifications/preferences/${userId}`);
        const data = await response.json();

        if (response.ok) {
            console.log('   ✅ Preferences retrieved');
            console.log('   Enabled channels:');
            console.log(`      Email: ${data.emailNotifications ? '✅' : '❌'}`);
            console.log(`      WhatsApp: ${data.whatsappNotifications ? '✅' : '❌'}`);
            console.log(`      SMS: ${data.smsNotifications ? '✅' : '❌'}`);
            console.log(`      Telegram: ${data.telegramNotifications ? '✅' : '❌'}`);
            console.log(`      Browser Push: ${data.browserNotifications ? '✅' : '❌'}`);
            console.log('   Settings:');
            console.log(`      Notification days: ${data.notificationDays}`);
            console.log(`      Notifications per day: ${data.notificationsPerDay}`);
            if (data.quietHoursStart && data.quietHoursEnd) {
                console.log(`      Quiet hours: ${data.quietHoursStart} - ${data.quietHoursEnd}`);
            }
            console.log('');
            return true;
        } else {
            console.error('   ❌ Failed to get preferences');
            console.error(`   Error: ${data.message}`);
            console.log('');
            return false;
        }
    } catch (error) {
        console.error('   ❌ Failed to fetch preferences');
        console.error(`   Error: ${error.message}`);
        console.log('');
        return false;
    }
}

async function main() {
    // Get command line arguments
    const args = process.argv.slice(2);
    const command = args[0];
    const userId = args[1];

    if (command === 'health') {
        await testHealthCheck();
    } else if (command === 'check-all') {
        const healthOk = await testHealthCheck();
        if (healthOk) {
            await testNotificationCheckAll();
        }
    } else if (command === 'test-user' && userId) {
        const healthOk = await testHealthCheck();
        if (healthOk) {
            await getUserPreferences(userId);
            await testUserNotification(userId);
        }
    } else if (command === 'preferences' && userId) {
        await getUserPreferences(userId);
    } else {
        console.log('Usage:');
        console.log('  node test-notifications.js health              - Check API health');
        console.log('  node test-notifications.js check-all           - Check all users');
        console.log('  node test-notifications.js test-user <userId>  - Test specific user');
        console.log('  node test-notifications.js preferences <userId> - Get user preferences');
        console.log('');
        console.log('Examples:');
        console.log('  node test-notifications.js health');
        console.log('  node test-notifications.js check-all');
        console.log('  node test-notifications.js test-user abc123');
        console.log('');
    }

    console.log('='.repeat(60));
    console.log('💡 TIP: Check server logs for detailed information');
    console.log('='.repeat(60));
}

main().catch(console.error);
