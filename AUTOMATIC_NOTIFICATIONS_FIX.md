# Automatic Notifications Setup & Fix

## Problem Fixed
Users were not receiving automatic notifications - only getting them when clicking the "Test Notification" button.

## Root Causes Identified & Fixed

### 1. **Notification Frequency Throttling** ✅ FIXED
**Problem:** The default notification frequency was set to 5 times per day, with a minimum gap of ~5 hours between notifications. This prevented users from getting frequent updates.

**Solution:** 
- Changed default from 5/day to 24/day (hourly notifications)
- Users can now receive notifications every hour when items are expiring
- Added detailed logging to show when frequency checks pass/fail

**File Changed:** [server/notificationChecker.ts](server/notificationChecker.ts)

### 2. **Scheduler Frequency** ✅ FIXED
**Problem:** Scheduler was checking every 30 minutes in test mode, which wasn't frequent enough for real-time notifications.

**Solution:**
- Changed test mode schedule from every 30 minutes to **every 5 minutes**
- This means the system checks for expiring items every 5 minutes automatically
- Combined with the frequency fix, users get notified promptly

**File Changed:** [server/notificationScheduler.ts](server/notificationScheduler.ts)

### 3. **Environment Configuration** ✅ FIXED
**Problem:** .env file wasn't optimally configured for automatic notifications.

**Solution:**
- Set `NOTIFICATION_SCHEDULE_TEST=true` (enables 5-minute checks)
- Set `NOTIFICATION_SCHEDULE=*/5 * * * *` (every 5 minutes)
- Added `NOTIFICATION_AUTO_SCHEDULE=true` (auto-starts scheduler)

**File Changed:** [.env](.env)

## How It Works Now

### Automatic Notification Flow
```
1. Server starts → Notification scheduler starts automatically
2. Every 5 minutes → Scheduler triggers notification check
3. For each user:
   - Check if they have expiring items
   - Check if frequency limit allows (1 hour minimum gap)
   - Check if in quiet hours
   - Send notifications via enabled channels
4. Record notification time for frequency tracking
```

### Frequency Control
- **Default:** Users can receive notifications up to 24 times per day (hourly)
- **Minimum Gap:** 1 hour between notifications
- **User Control:** Users can adjust frequency in their settings (notificationsPerDay field)

### Schedule Configuration
- **Test Mode (Current):** Every 5 minutes
  - Ideal for development and testing
  - Enables near-real-time notifications
  
- **Production Mode:** 5 times daily at 8 AM, 11 AM, 2 PM, 5 PM, 8 PM
  - Set `NOTIFICATION_SCHEDULE_TEST=false` in .env
  - More conservative, reduces server load

## Testing Instructions

### 1. Restart the Server
```bash
npm run dev
```

You should see logs like:
```
[NotificationScheduler] 🕐 Starting notification scheduler...
[NotificationScheduler] 📅 Schedule: */5 * * * *
[NotificationScheduler] 🧪 TEST MODE ENABLED - Running every 5 minutes
[NotificationScheduler] ✅ Scheduler started successfully
```

### 2. Add Test Food Items
1. Log in to your account
2. Add food items with expiry dates:
   - Some expiring today
   - Some expiring tomorrow
   - Some expiring in 2-3 days

### 3. Enable Notification Channels
Go to Profile → Notification Settings and enable:
- ✅ Email Notifications
- ✅ WhatsApp Notifications (if configured)
- ✅ Telegram Notifications (if configured)
- ✅ Browser Push Notifications (if configured)

### 4. Wait and Monitor
- **Wait 5 minutes** for the first automatic check
- Monitor server console logs
- Check your email/WhatsApp/Telegram for notifications
- Notifications will continue every hour as long as items are expiring

### 5. Check Server Logs
Look for these log messages:
```
[NotificationScheduler] ⏰ Scheduled notification check triggered at [time]
[NotificationChecker] 👤 Processing user [username]
[NotificationChecker] ✅ First notification for user [username] - allowing
[NotificationChecker] 📧 Attempting to send email notification...
[NotificationChecker] ✅ SUCCESS for [username]
```

## Configuration Options

### Option 1: Frequent Notifications (Current Setup)
**Best for:** Development, testing, users who want immediate alerts
```env
NOTIFICATION_SCHEDULE_TEST=true
NOTIFICATION_SCHEDULE=*/5 * * * *
```
- Checks every 5 minutes
- Notifies up to hourly

### Option 2: Production Schedule
**Best for:** Production deployment, reduced server load
```env
NOTIFICATION_SCHEDULE_TEST=false
NOTIFICATION_SCHEDULE=0 8,11,14,17,20 * * *
```
- Checks 5 times daily
- Still notifies hourly if items expiring

### Option 3: Custom Schedule
**Best for:** Specific business hours or requirements
```env
NOTIFICATION_SCHEDULE_TEST=false
NOTIFICATION_SCHEDULE=0 9,12,15,18,21 * * *
```
- Define your own cron expression
- [Cron syntax reference](https://crontab.guru/)

## User Frequency Settings

Users can control notification frequency in their profile:
- **1/day:** Maximum 1 notification per day (24-hour gap)
- **2/day:** Maximum 2 notifications per day (12-hour gap)
- **3/day:** Maximum 3 notifications per day (8-hour gap)
- **5/day:** Maximum 5 notifications per day (4.8-hour gap)
- **24/day (default):** Maximum hourly notifications (1-hour gap)

## Troubleshooting

### No Notifications After 5 Minutes?

1. **Check Server Logs**
   - Is the scheduler running? Look for "Scheduler started successfully"
   - Are checks being triggered? Look for "Scheduled notification check triggered"

2. **Check User Settings**
   - Are any notification channels enabled?
   - Is the user in quiet hours?
   - Check the frequency preference (notificationsPerDay)

3. **Check Food Items**
   - Are there items expiring within the notification threshold?
   - Default threshold: 3 days (configurable in user.notificationDays)

4. **Check Service Configuration**
   - Email: Is RESEND_API_KEY or EMAIL_* configured?
   - WhatsApp: Is TWILIO_* or WHATSAPP_CLOUD_* configured?
   - Telegram: Is TELEGRAM_BOT_TOKEN configured?

### Still Only Working with Test Button?

1. **Verify .env file:**
   ```bash
   cat .env | grep NOTIFICATION
   ```
   Should show:
   ```
   NOTIFICATION_SCHEDULE_TEST=true
   NOTIFICATION_SCHEDULE=*/5 * * * *
   NOTIFICATION_AUTO_SCHEDULE=true
   ```

2. **Restart server completely:**
   ```bash
   # Kill all node processes
   pkill node
   # Start fresh
   npm run dev
   ```

3. **Check for errors in console:**
   - Look for any red error messages
   - Check if services initialized properly

### Manual Trigger for Testing

You can manually trigger a notification check:
```bash
curl -X POST http://localhost:5000/api/notifications/check-all
```

This bypasses the scheduler and immediately checks all users.

## Summary of Changes

| File | Change | Impact |
|------|--------|--------|
| `server/notificationChecker.ts` | Default frequency: 5/day → 24/day | Users can get hourly notifications |
| `server/notificationScheduler.ts` | Test mode: 30min → 5min | System checks every 5 minutes |
| `.env` | Schedule: */2 hours → */5 minutes | More frequent automatic checks |
| `.env` | Added AUTO_SCHEDULE=true | Scheduler starts automatically |

## Next Steps

1. ✅ **Server will now send automatic notifications every 5 minutes**
2. ✅ **Users can receive notifications up to once per hour**
3. ✅ **Test mode is enabled for development**
4. ⚠️ **For production:** Change to production schedule to reduce load
5. 💡 **Optional:** Adjust user notificationsPerDay settings for more/less frequency

## Production Deployment Checklist

Before deploying to production:

- [ ] Set `NOTIFICATION_SCHEDULE_TEST=false`
- [ ] Use production schedule (5 times daily)
- [ ] Verify all notification services are configured
- [ ] Test with real users
- [ ] Monitor server logs for errors
- [ ] Set appropriate user frequency defaults
- [ ] Configure timezone correctly
