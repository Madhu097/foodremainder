# 🚀 Vercel Cron Job Setup for Automatic Notifications

## Overview

This project now uses **Vercel Cron Jobs** for automatic notification scheduling. This works natively with Vercel's serverless platform.

## How It Works

1. **Vercel Cron Job** (`vercel.json`): Configured to run 5 times daily
2. **Serverless Function** (`api/cron/check-notifications.ts`): Triggered by the cron job
3. **Notification Checker** (`server/notificationChecker.ts`): Checks all users and sends notifications

## Schedule

The cron job runs **5 times daily** at:
- 8:00 AM
- 11:00 AM
- 2:00 PM (14:00)
- 5:00 PM (17:00)
- 8:00 PM (20:00)

Schedule in `vercel.json`: `"0 8,11,14,17,20 * * *"`

## Setup Instructions

### 1. Deploy to Vercel

```bash
git add .
git commit -m "Add Vercel Cron for notifications"
git push
```

Vercel will automatically detect the `crons` configuration in `vercel.json` and set it up.

### 2. Environment Variables (Optional but Recommended)

Add these to your Vercel project settings for security:

```env
CRON_SECRET=your-secret-key-here
# OR
NOTIFICATION_API_KEY=your-secret-key-here
```

This protects the endpoint from unauthorized access.

### 3. Verify Setup

After deployment, check:

1. **Vercel Dashboard** → Your Project → Settings → Cron Jobs
   - You should see the cron job listed
   
2. **Test the endpoint manually**:
   ```bash
   curl -X GET "https://your-app.vercel.app/api/cron/check-notifications?apiKey=your-secret-key"
   ```

3. **Check Vercel Logs**:
   - Go to Vercel Dashboard → Your Project → Deployments → Latest → Functions
   - Look for `api/cron/check-notifications` logs

## How to Change the Schedule

Edit `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/check-notifications",
      "schedule": "0 8,11,14,17,20 * * *"  // Modify this cron expression
    }
  ]
}
```

### Common Cron Expressions

| Schedule | Expression | Description |
|----------|-----------|-------------|
| Every hour | `0 * * * *` | Runs at the start of every hour |
| Every 30 minutes | `*/30 * * * *` | Runs twice per hour |
| Every 6 hours | `0 */6 * * *` | Runs 4 times daily |
| 3 times daily | `0 8,14,20 * * *` | 8 AM, 2 PM, 8 PM |
| Daily at 9 AM | `0 9 * * *` | Once per day |

**Note**: Vercel Cron uses UTC timezone. Adjust times accordingly.

## Troubleshooting

### Notifications Not Sending

1. **Check Vercel Logs**: 
   - Dashboard → Functions → Check for errors

2. **Verify Environment Variables**:
   - All notification service credentials must be set in Vercel

3. **Test Manually**:
   ```bash
   # From your terminal
   curl -X POST "https://your-app.vercel.app/api/notifications/check-all" \
     -H "x-api-key: your-secret-key"
   ```

4. **Check User Settings**:
   - Users must have notification channels enabled
   - Users must have items expiring within their notification threshold

### Cron Not Triggering

1. **Redeploy**: Sometimes needs a fresh deployment
   ```bash
   vercel --prod
   ```

2. **Check Vercel Plan**: Free tier has limitations on cron frequency

3. **Verify Configuration**: Check `vercel.json` syntax

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Vercel Platform                       │
│                                                           │
│  ┌───────────────────────────────────────────────────┐  │
│  │           Cron Scheduler (UTC)                    │  │
│  │  "0 8,11,14,17,20 * * *"                         │  │
│  └────────────────┬──────────────────────────────────┘  │
│                   │ Triggers                            │
│                   ▼                                     │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Serverless Function                              │  │
│  │  /api/cron/check-notifications.ts                │  │
│  │                                                    │  │
│  │  • Authenticates request                          │  │
│  │  • Imports notificationChecker                    │  │
│  │  • Calls checkAndNotifyAll()                      │  │
│  └────────────────┬──────────────────────────────────┘  │
│                   │                                     │
│                   ▼                                     │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Notification Checker                             │  │
│  │  server/notificationChecker.ts                   │  │
│  │                                                    │  │
│  │  • Gets all users from Firebase                   │  │
│  │  • Checks expiring items                          │  │
│  │  • Sends via Email/WhatsApp/Telegram/SMS/Push    │  │
│  └───────────────────────────────────────────────────┘  │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

## Benefits Over Previous Setup

✅ **Native Vercel Integration**: No external cron services needed
✅ **Reliable**: Vercel manages the scheduling
✅ **Secure**: Protected by Vercel's authentication headers
✅ **Logged**: All executions logged in Vercel dashboard
✅ **Scalable**: Serverless architecture handles load automatically

## Migration from Old Setup

If you were using:
- External cron services (cron-job.org, etc.)
- node-cron scheduler

You can now **remove** those and rely entirely on Vercel Cron Jobs. The old `notificationScheduler.start()` in `server/index.ts` is only for local development.

## Local Development

For local testing, the `notificationScheduler` still runs with node-cron:

```bash
npm run dev
# Scheduler runs locally with test mode
```

Set in `.env`:
```env
NOTIFICATION_SCHEDULE_TEST=true  # Runs every 5 minutes for testing
```
