# Notification System Fix Summary

## Changes Made (2026-01-07)

### 1. Enhanced Notification Frequency Checking
**File**: `server/notificationChecker.ts`

**Changes**:
- Added detailed logging to track why notifications are/aren't sent
- Improved handling of null/invalid `lastNotificationSentAt` timestamps
- Added checks for empty strings and 'null' string values
- Enhanced logging shows:
  - User's notification frequency settings
  - Time since last notification
  - Minimum time required between notifications
  - Next allowed notification time

**Impact**: Better visibility into notification frequency logic, easier debugging

### 2. Increased Cron Frequency
**File**: `vercel.json`

**Changes**:
- Changed cron schedule from `0 */2 * * *` (every 2 hours) to `0 * * * *` (every hour)

**Impact**: Notifications checked more frequently, users receive timely alerts

### 3. Added Testing Tools

**New Files**:
- `test-notification-check.js` - Script to manually trigger notification checks
- `NOTIFICATION_DEBUG.md` - Comprehensive debugging guide

**Impact**: Easier to test and debug notification issues

## How to Deploy

### Step 1: Commit and Push Changes

```bash
git add .
git commit -m "Fix: Enhanced notification system with better logging and hourly cron"
git push
```

### Step 2: Verify Deployment

1. Go to your Vercel dashboard
2. Wait for deployment to complete
3. Check the deployment logs for any errors

### Step 3: Verify Cron Job Configuration

1. In Vercel Dashboard → Your Project → Settings → Cron Jobs
2. Verify the cron job appears with schedule: `0 * * * *`
3. Check "Last Run" timestamp after the next hour

### Step 4: Test the System

#### Option A: Wait for Next Cron Run
- Wait until the next hour (e.g., if it's 2:30, wait until 3:00)
- Check Vercel logs for `[NotificationChecker]` entries
- Verify notifications are being sent

#### Option B: Manual Test
```bash
# Set your environment variables
$env:API_URL="https://your-app.vercel.app"
$env:NOTIFICATION_API_KEY="your-api-key"

# Run the test script
node test-notification-check.js
```

## What to Look For

### In Vercel Logs

After the cron runs, you should see:

```
[NotificationChecker] ========================================
[NotificationChecker] 🔔 Starting notification check for all users...
[NotificationChecker] 📊 Found X total users to check
[NotificationChecker] 👤 Processing user 1/X
[NotificationChecker] 🔍 Frequency check for [username]:
[NotificationChecker]    Notifications per day: 24
[NotificationChecker]    Hours between notifications: 1.00
[NotificationChecker]    Last notification: NEVER
[NotificationChecker] ✅ First notification for user [username] - allowing
```

### Success Indicators

- ✅ Cron job runs every hour
- ✅ Users with expiring items are processed
- ✅ Notifications are sent via enabled channels
- ✅ `lastNotificationSentAt` is updated in database
- ✅ Frequency limits are respected

### Failure Indicators

- ❌ No logs appear in Vercel
- ❌ All users are skipped
- ❌ "Unauthorized" errors
- ❌ "No users found in database"

## Troubleshooting

### If Notifications Still Don't Work

1. **Check Environment Variables**
   - Verify `CRON_SECRET` or `NOTIFICATION_API_KEY` is set in Vercel
   - Verify Firebase credentials are correct
   - Verify notification service credentials (Resend, Telegram, etc.)

2. **Check User Settings**
   - At least one notification channel must be enabled
   - User must have food items expiring within threshold
   - User must not be in quiet hours
   - Enough time must have passed since last notification

3. **Check Database**
   - Verify users exist in Firebase
   - Verify food items exist and have valid expiry dates
   - Check `lastNotificationSentAt` field values

4. **Manual Test**
   - Use the test notification endpoint: `POST /api/notifications/test/:userId`
   - This bypasses frequency limits and quiet hours
   - If this works, the issue is with frequency/quiet hours logic

## Expected Behavior After Fix

### For Users with Default Settings (24 notifications/day)

1. **Hour 0 (e.g., 1:00 AM)**: Cron runs, checks all users
2. **User has expiring item**: Notification sent, `lastNotificationSentAt` updated
3. **Hour 1 (e.g., 2:00 AM)**: Cron runs again
4. **Same user**: Notification sent again (1 hour has passed, meets 24/day requirement)
5. **Continues every hour**: As long as items are still expiring

### For Users with Lower Frequency (e.g., 3 notifications/day)

1. **Hour 0**: Notification sent
2. **Hours 1-7**: Skipped (need 8 hours between notifications)
3. **Hour 8**: Notification sent again
4. **Hours 9-15**: Skipped
5. **Hour 16**: Notification sent again

## Next Steps

1. ✅ Deploy the changes to Vercel
2. ✅ Verify cron job is running
3. ✅ Monitor logs for the next few hours
4. ✅ Test with a real user account
5. ✅ Verify notifications are received

## Rollback Plan

If issues occur, you can:

1. Revert the cron frequency:
   ```json
   "schedule": "0 */2 * * *"
   ```

2. Disable cron in Vercel dashboard temporarily

3. Use manual API calls to trigger checks:
   ```bash
   curl -X GET "https://your-app.vercel.app/api/notifications/check-all?apiKey=YOUR_KEY"
   ```

## Support

If you continue to experience issues:

1. Check `NOTIFICATION_DEBUG.md` for detailed troubleshooting
2. Run `node test-notification-check.js` for diagnostic information
3. Review Vercel logs for specific error messages
4. Verify all environment variables are set correctly
