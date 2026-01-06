# 🚨 NOTIFICATION FIX - Step by Step

## Problem: Users not getting expiry alerts

## Root Cause
Vercel Cron jobs only work in production, not locally. Your notifications are configured but not triggering.

## ✅ SOLUTION - Follow These Steps:

### Step 1: Verify Deployment
1. Go to https://vercel.com/dashboard
2. Find your FoodRemainder project
3. Check if it's deployed successfully

### Step 2: Set Environment Variables in Vercel
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add ALL these variables (copy from your .env file):

```
FIREBASE_PROJECT_ID=your-value
FIREBASE_CLIENT_EMAIL=your-value
FIREBASE_PRIVATE_KEY=your-value
TELEGRAM_BOT_TOKEN=your-value
RESEND_API_KEY=your-value
EMAIL_SERVICE=resend
EMAIL_FROM=your-value
APP_URL=https://your-app.vercel.app
NOTIFICATION_AUTO_SCHEDULE=true
TIMEZONE=Asia/Kolkata
```

### Step 3: Verify Vercel Cron is Active
1. Vercel Dashboard → Your Project → Settings → Cron Jobs
2. You should see:
   - Path: `/api/cron/check-notifications`
   - Schedule: `0 8,11,14,17,20 * * *`
3. If not visible, redeploy:
   ```bash
   git add .
   git commit -m "Trigger redeploy"
   git push
   ```

### Step 4: Check Cron Execution Logs
1. Vercel Dashboard → Deployments → Latest → Functions
2. Look for `/api/cron/check-notifications`
3. Check execution logs for errors

### Step 5: Manual Test
Test the cron endpoint manually:
```bash
curl "https://your-app.vercel.app/api/cron/check-notifications"
```

### Step 6: Verify User Settings
1. Log into your app
2. Go to Profile → Notification Settings
3. Ensure:
   - At least one notification channel is enabled (Email/Telegram/etc.)
   - Notification days threshold is set (e.g., 3 days)
   - User has food items expiring within that threshold

## 🎯 Quick Test
1. Add a food item expiring tomorrow
2. Enable Telegram notifications
3. Click "Test Notification" button
4. If test works but automatic doesn't → Vercel cron issue
5. If test doesn't work → Service configuration issue

## 📊 Expected Behavior
- Cron runs 5 times daily: 8 AM, 11 AM, 2 PM, 5 PM, 8 PM (UTC)
- Checks all users for expiring items
- Sends notifications via enabled channels

## 🔧 If Still Not Working

### Check Vercel Plan
- Free (Hobby) plan: Cron jobs work but have limits
- Pro plan: Full cron support

### Alternative: Use External Cron Service
If Vercel cron isn't working, use cron-job.org:
1. Go to https://cron-job.org
2. Create free account
3. Add new cron job:
   - URL: `https://your-app.vercel.app/api/cron/check-notifications`
   - Schedule: Every 3 hours (or as needed)
4. Save and enable

## 📝 Checklist
- [ ] Deployed to Vercel
- [ ] Environment variables set in Vercel
- [ ] Vercel cron visible in dashboard
- [ ] APP_URL points to Vercel URL (not localhost)
- [ ] User has notification channel enabled
- [ ] User has expiring items
- [ ] Test notification works

## 🆘 Still Having Issues?
Check the logs:
```bash
# View Vercel logs
vercel logs your-deployment-url
```

Or contact me with:
- Vercel deployment URL
- Screenshot of Vercel Cron Jobs settings
- Screenshot of Function logs
