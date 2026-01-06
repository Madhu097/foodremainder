#!/usr/bin/env node

/**
 * Test script to verify notification system is working
 * Usage: node test-notifications.js [userId]
 * 
 * If userId is provided, tests that specific user
 * Otherwise, triggers check for all users
 */

import https from 'https';
import http from 'http';

const API_URL = process.env.API_URL || 'http://localhost:5000';
const API_KEY = process.env.NOTIFICATION_API_KEY;
const userId = process.argv[2];

const url = userId 
  ? `${API_URL}/api/notifications/test/${userId}`
  : `${API_URL}/api/notifications/check-all`;

console.log('='.repeat(60));
console.log('🧪 Testing Notification System');
console.log('='.repeat(60));
console.log(`API URL: ${url}`);
console.log(`API Key: ${API_KEY ? '✅ Set' : '⚠️  Not set (will work if not required)'}`);
console.log(`Testing: ${userId ? `User ${userId}` : 'All users'}`);
console.log('='.repeat(60));

const options = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    ...(API_KEY ? { 'x-api-key': API_KEY } : {})
  }
};

const client = API_URL.startsWith('https') ? https : http;

const req = client.request(url, options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('\n📊 Response:');
    console.log('='.repeat(60));
    console.log(`Status: ${res.statusCode}`);
    
    try {
      const jsonData = JSON.parse(data);
      console.log(JSON.stringify(jsonData, null, 2));
      
      if (res.statusCode === 200) {
        console.log('\n✅ SUCCESS!');
        if (jsonData.notificationsSent !== undefined) {
          console.log(`   Notifications sent to ${jsonData.notificationsSent} user(s)`);
        }
        if (jsonData.results && jsonData.results.length > 0) {
          console.log('\n📋 Details:');
          jsonData.results.forEach((result, i) => {
            console.log(`\n   User ${i + 1}: ${result.username}`);
            console.log(`   - Items expiring: ${result.itemCount}`);
            console.log(`   - Email: ${result.emailSent ? '✅' : '❌'}`);
            console.log(`   - WhatsApp: ${result.whatsappSent ? '✅' : '❌'}`);
            console.log(`   - SMS: ${result.smsSent ? '✅' : '❌'}`);
            console.log(`   - Telegram: ${result.telegramSent ? '✅' : '❌'}`);
            console.log(`   - Browser Push: ${result.pushSent ? '✅' : '❌'}`);
          });
        }
      } else {
        console.log('\n❌ FAILED!');
        console.log(`   Error: ${jsonData.message || 'Unknown error'}`);
        if (jsonData.detail) {
          console.log(`   Detail: ${jsonData.detail}`);
        }
      }
    } catch (e) {
      console.log('Raw response:', data);
      console.log('\n❌ Failed to parse JSON response');
    }
    
    console.log('='.repeat(60));
  });
});

req.on('error', (error) => {
  console.error('\n❌ Request failed:', error.message);
  console.log('\n💡 Tips:');
  console.log('   - Make sure the server is running');
  console.log('   - Check the API_URL environment variable');
  console.log('   - Verify network connectivity');
  process.exit(1);
});

req.end();
