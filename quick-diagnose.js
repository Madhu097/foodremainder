import dotenv from 'dotenv';
dotenv.config();

async function quickDiagnose() {
    console.log('\n🔍 QUICK NOTIFICATION DIAGNOSTIC\n');
    console.log('================================\n');

    // Check critical settings
    const issues = [];
    const warnings = [];

    // 1. Firebase
    if (!process.env.FIREBASE_PROJECT_ID) {
        issues.push('❌ FIREBASE_PROJECT_ID not set');
    } else {
        console.log('✅ Firebase configured');
    }

    // 2. Notification services
    const hasEmail = !!process.env.RESEND_API_KEY;
    const hasTelegram = !!process.env.TELEGRAM_BOT_TOKEN;
    const hasTwilio = !!process.env.TWILIO_ACCOUNT_SID;

    if (!hasEmail && !hasTelegram && !hasTwilio) {
        issues.push('❌ No notification service configured');
    } else {
        if (hasEmail) console.log('✅ Email (Resend) configured');
        if (hasTelegram) console.log('✅ Telegram configured');
        if (hasTwilio) console.log('✅ Twilio configured');
    }

    // 3. App URL
    const appUrl = process.env.APP_URL || 'http://localhost:5000';
    console.log(`\n📍 App URL: ${appUrl}`);

    if (appUrl.includes('localhost')) {
        warnings.push('⚠️  Using localhost - Vercel cron won\'t work');
    }

    // 4. Check vercel.json
    try {
        const fs = await import('fs');
        const vercel = JSON.parse(fs.readFileSync('./vercel.json', 'utf-8'));
        if (vercel.crons && vercel.crons.length > 0) {
            console.log('✅ Vercel cron configured');
            console.log(`   Schedule: ${vercel.crons[0].schedule}`);
            console.log(`   Path: ${vercel.crons[0].path}`);
        } else {
            issues.push('❌ No Vercel cron configured');
        }
    } catch (e) {
        issues.push('❌ vercel.json not found or invalid');
    }

    // Summary
    console.log('\n================================');
    console.log('📊 SUMMARY:\n');

    if (issues.length === 0 && warnings.length === 0) {
        console.log('✅ All checks passed!\n');
        console.log('If notifications still aren\'t working:');
        console.log('1. Check Vercel deployment logs');
        console.log('2. Verify environment variables are set in Vercel');
        console.log('3. Check user notification settings in app');
        console.log('4. Ensure users have expiring items\n');
    } else {
        if (issues.length > 0) {
            console.log('CRITICAL ISSUES:');
            issues.forEach(i => console.log(`  ${i}`));
            console.log('');
        }
        if (warnings.length > 0) {
            console.log('WARNINGS:');
            warnings.forEach(w => console.log(`  ${w}`));
            console.log('');
        }
    }

    console.log('================================\n');

    // Action items
    console.log('🎯 ACTION ITEMS:\n');

    if (appUrl.includes('localhost')) {
        console.log('1. Deploy to Vercel:');
        console.log('   git add .');
        console.log('   git commit -m "Fix notifications"');
        console.log('   git push\n');

        console.log('2. Set environment variables in Vercel:');
        console.log('   - Go to Vercel Dashboard → Settings → Environment Variables');
        console.log('   - Add all variables from .env file');
        console.log('   - Update APP_URL to your Vercel URL\n');
    }

    console.log('3. Verify Vercel Cron:');
    console.log('   - Vercel Dashboard → Settings → Cron Jobs');
    console.log('   - Should see: /api/cron/check-notifications\n');

    console.log('4. Check logs:');
    console.log('   - Vercel Dashboard → Deployments → Functions');
    console.log('   - Look for cron execution logs\n');
}

quickDiagnose();
