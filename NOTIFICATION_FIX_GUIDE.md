# 🔔 Expiry Notification Fix Guide

## Problem
Expiry alerts are not being sent regularly to users.

## Root Cause
The notification scheduler requires the server to be running continuously, but it's currently not active.

## Solution Options

### Option 1: Keep Server Running Locally (Development/Testing)

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Verify scheduler is running:**
   Look for these logs:
   ```
   ✓ Notification scheduler started
   🕐 Starting notification scheduler...
   📅 Schedule: */5 * * * * (or your configured schedule)
   ```

3. **Enable test mode for immediate testing:**
   In your `.env` file, ensure:
   ```env
   NOTIFICATION_AUTO_SCHEDULE=true
   NOTIFICATION_SCHEDULE_TEST=true
   TIMEZONE=Asia/Kolkata
   ```
   
   This will run notifications every 5 minutes for testing.

4. **For production schedule (5 times daily):**
   ```env
   NOTIFICATION_AUTO_SCHEDULE=true
   NOTIFICATION_SCHEDULE_TEST=false
   TIMEZONE=Asia/Kolkata
   ```

### Option 2: Deploy to Always-On Hosting (Recommended for Production)

Your app needs to be deployed to a platform that keeps it running 24/7:

#### **Recommended: Render.com (FREE)**
1. Go to https://render.com
2. Create a new "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Environment Variables:** Add all your `.env` variables

#### **Alternative: Railway.app (FREE tier available)**
1. Go to https://railway.app
2. Deploy from GitHub
3. Add environment variables
4. Railway keeps your app running 24/7

#### **Alternative: Fly.io (FREE tier)**
Similar process to Render/Railway

### Option 3: External Cron Service (For Serverless Deployments)

If you're using Vercel (which is serverless and doesn't keep processes running), you need an external cron service:

1. **Add a manual trigger endpoint** (already exists in your code)
   
2. **Use cron-job.org (FREE):**
   - Sign up at https://cron-job.org
   - Create a new cron job
   - URL: `https://your-app.vercel.app/api/notifications/trigger`
   - Schedule: Every hour (or your preference)
   - Add header: `x-api-key: your-secret-key` (if you set NOTIFICATION_API_KEY)

3. **Configure in `.env`:**
   ```env
   NOTIFICATION_AUTO_SCHEDULE=false  # Disable internal scheduler
   NOTIFICATION_API_KEY=your-secret-key-here  # Protect the endpoint
   ```

## Verification Steps

### 1. Check Server Logs
When the server starts, you should see:
```
✓ Email notifications enabled
✓ Telegram notifications enabled
✓ Notification scheduler started
🕐 Starting notification scheduler...
📅 Schedule: 0 8,11,14,17,20 * * *
📌 Next check: [timestamp]
```

### 2. Test Notifications Manually
Use the test notification button in your app's Profile → Notification Settings

### 3. Monitor Scheduled Runs
Watch server logs for:
```
⏰ Scheduled notification check triggered at [time]
👤 Processing user 1/X
✅ SUCCESS for [username]
```

## Current Configuration Check

Run this command to verify your environment:
```bash
# Check if required env vars are set
node -e "console.log('Auto Schedule:', process.env.NOTIFICATION_AUTO_SCHEDULE); console.log('Test Mode:', process.env.NOTIFICATION_SCHEDULE_TEST); console.log('Timezone:', process.env.TIMEZONE);"
```

## Troubleshooting

### Scheduler Not Starting
- **Check:** Is `NOTIFICATION_AUTO_SCHEDULE=true` in `.env`?
- **Check:** Is at least one notification service configured (Email, Telegram, etc.)?
- **Check:** Are there any error messages in server logs?

### Notifications Not Sending
- **Check:** Do users have expiring items within their notification threshold?
- **Check:** Are notification channels enabled in user settings?
- **Check:** Is the user in quiet hours?
- **Check:** Has the user's notification frequency limit been reached?

### Server Keeps Stopping
- **Local:** Use a process manager like `pm2`
- **Production:** Deploy to a platform that keeps apps running (Render, Railway, Fly.io)

## Quick Fix for Immediate Testing

1. **Update your `.env`:**
   ```env
   NOTIFICATION_AUTO_SCHEDULE=true
   NOTIFICATION_SCHEDULE_TEST=true
   ```

2. **Start the server:**
   ```bash
   npm run dev
   ```

3. **Wait 5 minutes** - notifications will be checked and sent

4. **Check logs** for confirmation

## Production Deployment Checklist

- [ ] Deploy to always-on hosting (Render/Railway/Fly.io)
- [ ] Set `NOTIFICATION_AUTO_SCHEDULE=true`
- [ ] Set `NOTIFICATION_SCHEDULE_TEST=false`
- [ ] Configure `TIMEZONE` to your region
- [ ] Add all required environment variables
- [ ] Verify all notification services are configured
- [ ] Test with a real user account
- [ ] Monitor logs for scheduled runs

## Need Help?

Check the server logs for detailed error messages. The notification system logs every step:
- User processing
- Channel attempts
- Success/failure status
- Frequency checks
- Quiet hours checks
