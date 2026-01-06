# Notification System Debugging Guide

## Overview
This guide helps you test and debug the automatic expiry notification system.

## Quick Test

### 1. Test Notifications Manually
You can trigger notifications manually via the API:

```bash
# Using curl (replace with your actual API URL and key)
curl -X POST https://your-app.vercel.app/api/notifications/check-all \
  -H "x-api-key: YOUR_NOTIFICATION_API_KEY"

# Or with authorization header
curl -X POST https://your-app.vercel.app/api/notifications/check-all \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# For local testing (no auth needed if not configured)
curl http://localhost:5000/api/notifications/check-all
```

### 2. Test Single User Notification
```bash
curl -X POST http://localhost:5000/api/notifications/test/:userId
```

## Vercel Cron Configuration

The cron job is configured in `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/notifications/check-all",
    "schedule": "0 */2 * * *"  // Every 2 hours
  }]
}
```

**Current Schedule:** Every 2 hours at :00 minutes

## Environment Variables Required

### For Vercel Deployment
Add these to your Vercel project settings:

```bash
# Cron authentication
CRON_SECRET=your-secret-here
# OR
NOTIFICATION_API_KEY=your-api-key-here

# Email service (choose one)
RESEND_API_KEY=re_xxxxx
# OR for other email services
EMAIL_SERVICE=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=Your Name <your-email@gmail.com>

# WhatsApp (optional - Twilio)
TWILIO_ACCOUNT_SID=ACxxxx
TWILIO_AUTH_TOKEN=xxxx
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886

# Telegram (optional)
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrSTUvwxYZ

# Push Notifications (optional)
VAPID_PUBLIC_KEY=xxxx
VAPID_PRIVATE_KEY=xxxx
VAPID_SUBJECT=mailto:your-email@example.com

# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
```

## Common Issues & Solutions

### Issue 1: Cron Not Running
**Symptoms:** No notifications being sent automatically

**Check:**
1. Verify cron is enabled in Vercel dashboard
2. Check Vercel function logs for errors
3. Ensure `CRON_SECRET` is set in Vercel environment variables

**Solution:**
- Go to Vercel Dashboard → Your Project → Settings → Environment Variables
- Add `CRON_SECRET` with a secure random string
- Redeploy your app

### Issue 2: No Users Receiving Notifications
**Symptoms:** Cron runs but no notifications sent

**Check:**
1. Verify users have notification channels enabled (email, WhatsApp, etc.)
2. Check if users have expiring items within the notification threshold
3. Verify notification frequency settings

**Debug Command:**
```bash
# Check logs in Vercel
vercel logs your-app-name --follow

# Or check via API response
curl -X POST https://your-app.vercel.app/api/notifications/check-all \
  -H "x-api-key: YOUR_KEY" | jq
```

### Issue 3: Notifications Too Infrequent
**Symptoms:** Users complaining they don't get timely notifications

**Solution:**
1. Users can adjust their notification frequency in Profile → Notification Settings
2. Default is 4 times per day (every 6 hours)
3. Users can increase to 24 times (hourly) for urgent items

### Issue 4: Email Service Not Working
**Symptoms:** Email notifications failing

**Check:**
1. Verify `RESEND_API_KEY` is set correctly
2. Check email service logs
3. Verify sender email is verified in Resend

**Test:**
```bash
# Check service configuration
curl http://localhost:5000/api/health | jq .services.email
```

### Issue 5: WhatsApp Not Working
**Symptoms:** WhatsApp notifications failing

**Common Causes:**
1. User hasn't joined Twilio sandbox
2. Mobile number format incorrect
3. Twilio credentials not configured

**Solution:**
- Users must send "join <your-sandbox-keyword>" to Twilio's WhatsApp number
- Ensure mobile numbers include country code (e.g., +91 for India)
- Verify `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_WHATSAPP_FROM` are set

## Monitoring Notifications

### View Logs
```bash
# Vercel logs
vercel logs --follow

# Local development logs
npm run dev
# Then trigger: curl http://localhost:5000/api/notifications/check-all
```

### Check Notification History
Users' last notification time is tracked in the database:
- Field: `lastNotificationSentAt`
- This ensures frequency preferences are respected

## Testing Locally

1. Start the dev server:
```bash
npm run dev
```

2. The notification scheduler starts automatically (every 5 minutes in test mode)

3. Or trigger manually:
```bash
curl -X POST http://localhost:5000/api/notifications/check-all
```

4. To test a specific user:
```bash
curl -X POST http://localhost:5000/api/notifications/test/:userId
```

## Notification Flow

1. **Cron Trigger** (every 2 hours on Vercel)
   ↓
2. **Calls** `/api/notifications/check-all`
   ↓
3. **For Each User:**
   - Check if notification frequency allows sending
   - Check if in quiet hours
   - Check if any notification channels enabled
   - Get user's food items
   - Filter items expiring within threshold (default: 3 days)
   - Send notifications via enabled channels
   - Update lastNotificationSentAt
   ↓
4. **Return Results** (success/failure per user)

## Default Settings for New Users

When a user registers, they get these defaults:
- Email notifications: **Enabled**
- WhatsApp notifications: **Disabled** (must enable and join sandbox)
- SMS notifications: **Disabled**
- Telegram notifications: **Disabled**
- Browser push: **Disabled**
- Notification threshold: **3 days** before expiry
- Notification frequency: **4 times per day** (every 6 hours)
- Quiet hours: **None**

Users can customize all these in Profile → Notification Settings.

## Need Help?

If notifications still aren't working:

1. Check all logs thoroughly
2. Verify all environment variables are set
3. Test each notification service individually
4. Ensure at least one notification channel is enabled per user
5. Verify users have items expiring within the notification threshold

For more help, check the console logs or contact support.
