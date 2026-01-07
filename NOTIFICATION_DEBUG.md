# Notification System Debugging Guide

## Problem: Users Not Receiving Automatic Expiry Alerts

This guide helps you debug and fix issues with automatic expiry notifications.

## Quick Diagnosis

### 1. Check if the Cron Job is Running

The Vercel cron job should run **every hour** (configured in `vercel.json`).

To verify:
1. Go to your Vercel dashboard
2. Navigate to your project → Settings → Cron Jobs
3. Check the "Last Run" timestamp
4. Check the logs for any errors

### 2. Test the Notification Endpoint Manually

Run this command to test the notification check:

```bash
# For local development
API_URL=http://localhost:5000 NOTIFICATION_API_KEY=your-key node test-notification-check.js

# For production
API_URL=https://your-app.vercel.app NOTIFICATION_API_KEY=your-key node test-notification-check.js
```

### 3. Check User Settings

Users must have:
- ✅ At least one notification channel enabled (Email, WhatsApp, Telegram, or Browser)
- ✅ Food items that are expiring within their notification threshold (default: 3 days)
- ✅ Not in quiet hours
- ✅ Enough time passed since last notification (based on frequency preference)

## Common Issues and Solutions

### Issue 1: Notifications Only Work with Test Button

**Symptom**: Test notifications work, but automatic notifications don't arrive.

**Cause**: The frequency limiter prevents notifications if they were sent recently.

**Solution**: 
1. Check the `lastNotificationSentAt` field in the database
2. Verify the user's `notificationsPerDay` setting
3. Calculate if enough time has passed: `24 hours / notificationsPerDay`

### Issue 2: Cron Job Not Triggering

**Symptom**: No logs in Vercel, no notifications sent.

**Causes**:
- Cron job not configured in Vercel dashboard
- `CRON_SECRET` environment variable not set
- Vercel plan doesn't support cron jobs (requires Pro plan)

**Solution**:
1. Verify cron job is enabled in Vercel dashboard
2. Set `CRON_SECRET` environment variable in Vercel
3. Check your Vercel plan supports cron jobs

### Issue 3: Authentication Failures

**Symptom**: Cron endpoint returns 401 Unauthorized.

**Solution**:
Set one of these environment variables in Vercel:
- `CRON_SECRET` - for Vercel cron jobs
- `NOTIFICATION_API_KEY` - for manual API calls

### Issue 4: No Expiring Items

**Symptom**: Logs show "No expiring items" for all users.

**Solution**:
1. Check if users have added food items
2. Verify expiry dates are within the notification threshold
3. Check the `notificationDays` setting (default: 3 days)

## Environment Variables Required

### For Vercel Deployment:

```env
# Authentication (choose one)
CRON_SECRET=your-vercel-cron-secret
NOTIFICATION_API_KEY=your-api-key

# Firebase (required)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email

# Email Service (optional)
RESEND_API_KEY=your-resend-key

# Telegram (optional)
TELEGRAM_BOT_TOKEN=your-bot-token

# WhatsApp Cloud API (optional)
WHATSAPP_CLOUD_PHONE_NUMBER_ID=your-phone-id
WHATSAPP_CLOUD_ACCESS_TOKEN=your-access-token

# Push Notifications (optional)
VAPID_PUBLIC_KEY=your-public-key
VAPID_PRIVATE_KEY=your-private-key
```

## Debugging Steps

### Step 1: Enable Detailed Logging

The notification checker now includes detailed logging. Check your Vercel logs for:

```
[NotificationChecker] 🔍 Frequency check for [username]:
[NotificationChecker]    Notifications per day: 24
[NotificationChecker]    Hours between notifications: 1.00
[NotificationChecker]    Last notification: 2026-01-07T12:00:00.000Z
[NotificationChecker]    Time since last notification: 0.75 hours
[NotificationChecker]    Minimum required: 1.00 hours
[NotificationChecker] ⏳ User [username] needs to wait 0.25 more hours
```

### Step 2: Check Database

Verify these fields in your Firebase users collection:

```javascript
{
  "emailNotifications": "true",  // or "false"
  "whatsappNotifications": "true",
  "telegramNotifications": "true",
  "browserNotifications": "true",
  "notificationDays": "3",  // days before expiry to notify
  "notificationsPerDay": "24",  // how many times per day
  "lastNotificationSentAt": "2026-01-07T12:00:00.000Z",  // last notification time
  "quietHoursStart": null,  // e.g., "22:00"
  "quietHoursEnd": null  // e.g., "07:00"
}
```

### Step 3: Test Individual User

Use the test notification endpoint:

```bash
curl -X POST https://your-app.vercel.app/api/notifications/test/USER_ID
```

This bypasses frequency limits and quiet hours.

### Step 4: Monitor Cron Execution

Check Vercel logs after each cron run:

1. Go to Vercel Dashboard → Your Project → Logs
2. Filter by "cron" or search for "[NotificationChecker]"
3. Look for errors or skipped users

## Expected Behavior

### Hourly Cron Job

- Runs every hour at minute 0 (e.g., 1:00, 2:00, 3:00)
- Checks all users in the database
- For each user:
  1. Checks if they have expiring items
  2. Checks if notifications are enabled
  3. Checks if they're in quiet hours
  4. Checks if enough time has passed since last notification
  5. Sends notifications via enabled channels
  6. Records the notification time

### Notification Frequency

If a user sets `notificationsPerDay` to:
- **1**: Notifications sent once per day (every 24 hours)
- **2**: Notifications sent twice per day (every 12 hours)
- **3**: Notifications sent 3 times per day (every 8 hours)
- **24**: Notifications sent every hour

## Testing Checklist

- [ ] Cron job is configured in Vercel
- [ ] Environment variables are set
- [ ] At least one user has notifications enabled
- [ ] User has food items expiring within threshold
- [ ] User is not in quiet hours
- [ ] Enough time has passed since last notification
- [ ] Notification services are configured (Email, Telegram, etc.)
- [ ] Manual test endpoint works
- [ ] Vercel logs show cron execution

## Need More Help?

1. Check Vercel logs for detailed error messages
2. Run the test script: `node test-notification-check.js`
3. Verify all environment variables are set correctly
4. Check Firebase console for user data
5. Test individual notification channels separately

## Recent Changes

### 2026-01-07
- ✅ Enhanced frequency checking with detailed logging
- ✅ Changed cron schedule from every 2 hours to every hour
- ✅ Added better handling of null/invalid timestamps
- ✅ Added diagnostic logging for debugging
