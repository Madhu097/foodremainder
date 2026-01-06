import dotenv from 'dotenv';
dotenv.config();

console.log('🔍 NOTIFICATION SYSTEM DIAGNOSTIC\n');
console.log('═══════════════════════════════════════════════════════\n');

// Check 1: Environment Variables
console.log('📋 1. CHECKING ENVIRONMENT VARIABLES:\n');

const requiredVars = {
    'FIREBASE_PROJECT_ID': process.env.FIREBASE_PROJECT_ID,
    'FIREBASE_CLIENT_EMAIL': process.env.FIREBASE_CLIENT_EMAIL,
    'FIREBASE_PRIVATE_KEY': process.env.FIREBASE_PRIVATE_KEY ? '✅ Set' : '❌ Missing',
};

const optionalVars = {
    'TELEGRAM_BOT_TOKEN': process.env.TELEGRAM_BOT_TOKEN,
    'RESEND_API_KEY': process.env.RESEND_API_KEY,
    'EMAIL_SERVICE': process.env.EMAIL_SERVICE,
    'EMAIL_FROM': process.env.EMAIL_FROM,
    'TWILIO_ACCOUNT_SID': process.env.TWILIO_ACCOUNT_SID,
    'TWILIO_AUTH_TOKEN': process.env.TWILIO_AUTH_TOKEN,
    'APP_URL': process.env.APP_URL,
};

console.log('Required (Firebase):');
for (const [key, value] of Object.entries(requiredVars)) {
    const status = value ? '✅' : '❌';
    const display = key === 'FIREBASE_PRIVATE_KEY' ? value : (value ? `${value.substring(0, 20)}...` : 'Missing');
    console.log(`  ${status} ${key}: ${display}`);
}

console.log('\nOptional (Notification Services):');
for (const [key, value] of Object.entries(optionalVars)) {
    const status = value ? '✅' : '⚠️';
    const display = value ? (value.length > 30 ? `${value.substring(0, 30)}...` : value) : 'Not configured';
    console.log(`  ${status} ${key}: ${display}`);
}

// Check 2: Vercel Cron Configuration
console.log('\n═══════════════════════════════════════════════════════');
console.log('📅 2. VERCEL CRON CONFIGURATION:\n');

try {
    const fs = await import('fs');
    const vercelConfig = JSON.parse(fs.readFileSync('./vercel.json', 'utf-8'));

    if (vercelConfig.crons && vercelConfig.crons.length > 0) {
        console.log('✅ Vercel cron jobs configured:');
        vercelConfig.crons.forEach((cron, index) => {
            console.log(`\n  Cron Job ${index + 1}:`);
            console.log(`    Path: ${cron.path}`);
            console.log(`    Schedule: ${cron.schedule}`);
            console.log(`    Times (UTC): ${parseCronSchedule(cron.schedule)}`);
        });
    } else {
        console.log('❌ No cron jobs configured in vercel.json');
    }
} catch (error) {
    console.log('❌ Error reading vercel.json:', error.message);
}

// Check 3: Notification Scheduler Settings
console.log('\n═══════════════════════════════════════════════════════');
console.log('⏰ 3. NOTIFICATION SCHEDULER SETTINGS:\n');

console.log(`  Auto Schedule: ${process.env.NOTIFICATION_AUTO_SCHEDULE || 'true'}`);
console.log(`  Test Mode: ${process.env.NOTIFICATION_SCHEDULE_TEST || 'false'}`);
console.log(`  Custom Schedule: ${process.env.NOTIFICATION_SCHEDULE || 'Using default (5x daily)'}`);
console.log(`  Timezone: ${process.env.TIMEZONE || 'Asia/Kolkata'}`);
console.log(`  API Key Set: ${process.env.NOTIFICATION_API_KEY ? '✅ Yes' : '⚠️ No (recommended for security)'}`);

// Check 4: Test Notification Endpoint
console.log('\n═══════════════════════════════════════════════════════');
console.log('🧪 4. TESTING NOTIFICATION SYSTEM:\n');

const appUrl = process.env.APP_URL || 'http://localhost:5000';
console.log(`  App URL: ${appUrl}`);

if (appUrl.includes('localhost')) {
    console.log('\n  ⚠️  WARNING: You are using localhost!');
    console.log('     For Vercel cron to work, you need to:');
    console.log('     1. Deploy to Vercel');
    console.log('     2. Update APP_URL in Vercel environment variables');
    console.log('     3. Vercel cron only works in production, not locally\n');
}

// Check 5: Common Issues
console.log('═══════════════════════════════════════════════════════');
console.log('🔧 5. COMMON ISSUES & SOLUTIONS:\n');

const issues = [];

if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL) {
    issues.push({
        issue: '❌ Firebase not configured',
        solution: 'Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in .env'
    });
}

if (!process.env.TELEGRAM_BOT_TOKEN && !process.env.RESEND_API_KEY && !process.env.TWILIO_ACCOUNT_SID) {
    issues.push({
        issue: '⚠️  No notification services configured',
        solution: 'Configure at least one: TELEGRAM_BOT_TOKEN, RESEND_API_KEY, or TWILIO credentials'
    });
}

if (appUrl.includes('localhost')) {
    issues.push({
        issue: '⚠️  Using localhost URL',
        solution: 'Deploy to Vercel and update APP_URL in environment variables'
    });
}

if (!process.env.NOTIFICATION_API_KEY && !process.env.CRON_SECRET) {
    issues.push({
        issue: '⚠️  No API key for cron endpoint',
        solution: 'Set NOTIFICATION_API_KEY or CRON_SECRET for security'
    });
}

if (issues.length === 0) {
    console.log('  ✅ No obvious configuration issues found!\n');
    console.log('  If notifications still aren\'t working, check:');
    console.log('     1. Vercel deployment logs');
    console.log('     2. User notification preferences in the app');
    console.log('     3. Whether users have expiring items');
    console.log('     4. Vercel cron job execution logs\n');
} else {
    issues.forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.issue}`);
        console.log(`     Solution: ${item.solution}\n`);
    });
}

// Check 6: Next Steps
console.log('═══════════════════════════════════════════════════════');
console.log('📝 6. NEXT STEPS:\n');

console.log('  To fix notifications, do the following:\n');
console.log('  1️⃣  Ensure all environment variables are set in Vercel');
console.log('     - Go to Vercel Dashboard → Your Project → Settings → Environment Variables');
console.log('     - Add all variables from your .env file\n');

console.log('  2️⃣  Verify Vercel Cron is enabled');
console.log('     - Go to Vercel Dashboard → Your Project → Settings → Cron Jobs');
console.log('     - You should see: /api/cron/check-notifications\n');

console.log('  3️⃣  Check Vercel Function Logs');
console.log('     - Go to Vercel Dashboard → Your Project → Deployments');
console.log('     - Click latest deployment → Functions tab');
console.log('     - Look for /api/cron/check-notifications logs\n');

console.log('  4️⃣  Test manually');
console.log(`     curl "${appUrl}/api/cron/check-notifications"\n`);

console.log('  5️⃣  Check user settings in the app');
console.log('     - Users must enable notification channels');
console.log('     - Users must have food items expiring soon\n');

console.log('═══════════════════════════════════════════════════════\n');

// Helper function to parse cron schedule
function parseCronSchedule(schedule) {
    const parts = schedule.split(' ');
    if (parts.length >= 2) {
        const hours = parts[1];
        if (hours.includes(',')) {
            return hours.split(',').map(h => `${h}:00 UTC`).join(', ');
        }
        return `${hours}:00 UTC`;
    }
    return schedule;
}
