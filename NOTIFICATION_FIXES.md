# 🔧 Notification Troubleshooting & Fixes

## Issues Fixed

### 1. ✅ Browser Notifications
**Problem**: Browser notifications may not work due to permission issues or service worker registration problems.

**Solutions Implemented**:
- ✓ Service worker is registered at `/sw.js`
- ✓ VAPID keys are configured (default keys provided)
- ✓ Push subscription flow properly handles permissions

**How to Test**:
1. Open browser developer tools (F12)
2. Go to Application → Service Workers
3. Verify that `/sw.js` is registered
4. Go to Profile → Notification Settings
5. Toggle "Browser Notifications" ON
6. Click "Allow" when browser asks for permission
7. Click "Test Notification"

**Common Issues**:
- **Permission Denied**: User needs to manually enable notifications in browser settings
- **Not on HTTPS**: Browser notifications require HTTPS (or localhost for testing)
- **Service Worker Not Registered**: Check browser console for errors

---

### 2. ✅ Email Notifications
**Problem**: Email notifications not sending.

**Solutions Implemented**:
- ✓ Support for both SMTP and Resend email services
- ✓ Proper error logging for debugging
- ✓ Service initialization checks

**Configuration Required**:

#### Option A: Using Resend (Recommended - Free tier: 100 emails/day)
```env
EMAIL_SERVICE=resend
RESEND_API_KEY=re_your_api_key_here
EMAIL_FROM=Food Reminder <noreply@yourdomain.com>
```

#### Option B: Using Gmail SMTP
```env
EMAIL_SERVICE=smtp
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-char-app-password
EMAIL_FROM=Food Reminder <your-email@gmail.com>
```

**How to Get Gmail App Password**:
1. Go to https://myaccount.google.com/security
2. Enable 2-Step Verification
3. Go to https://myaccount.google.com/apppasswords
4. Create app password for "Mail" → "Other (Food Reminder)"
5. Copy the 16-character password (no spaces)

**How to Test**:
1. Configure email settings in `.env`
2. Restart server: `npm run dev`
3. Check server logs for: `✓ Email notifications enabled`
4. Go to Profile → Notification Settings
5. Enable "Email Notifications"
6. Click "Test Notification"
7. Check your email inbox

---

### 3. ✅ Multiple Notifications Per Day
**New Feature Added**: Users can now configure how many times per day they want to receive notifications!

**Options**:
- **1 time**: 9 AM
- **2 times**: 9 AM, 6 PM
- **3 times**: 9 AM, 2 PM, 7 PM  
- **4 times**: 8 AM, 12 PM, 4 PM, 8 PM

**How to Configure**:
1. Go to Profile → Notification Settings
2. Find "Notification Frequency" section
3. Set desired number (1-4)
4. Click "Save Preferences"

**Environment Variable**:
You can also set a default server-wide in `.env`:
```env
NOTIFICATION_TIMES_PER_DAY=2  # 1-4
```

Or use a custom cron schedule:
```env
NOTIFICATION_SCHEDULE="0 8,14,20 * * *"  # 8 AM, 2 PM, 8 PM
```

---

## Verification Checklist

### Browser Notifications ✅
- [ ] Service worker registered at `/sw.js`
- [ ] VAPID keys configured
- [ ] Browser permissions granted
- [ ] Test notification received

### Email Notifications ✅
- [ ] Email service configured in `.env`
- [ ] Server logs show "✓ Email notifications enabled"
- [ ] Test email received
- [ ] Check spam folder if not in inbox

### Multiple Daily Notifications ✅
- [ ] User can select 1-4 notifications per day
- [ ] Server scheduler logs show correct schedule
- [ ] Notifications being sent at expected times

---

## Debug Commands

### Check Service Status
```bash
# View server logs to check which services are initialized
npm run dev
```

Look for these lines:
```
✓ Email notifications enabled (using Resend)
✓ Push notifications enabled
✓ Notification scheduler started
🔔 Notifications per day: 2
📅 Schedule: 0 9,18 * * *
```

### Test Notification via API
```bash
# Test notification for a specific user
curl -X POST http://localhost:5000/api/notifications/test/USER_ID
```

### Check Push Subscription
```javascript
// In browser console
navigator.serviceWorker.ready.then(registration => {
  registration.pushManager.getSubscription().then(sub => {
    console.log('Push subscription:', sub);
  });
});
```

---

## Environment Variables Summary

Add these to your `.env` file:

```env
# Email Configuration (Choose ONE)
# Option 1: Resend (Recommended)
EMAIL_SERVICE=resend
RESEND_API_KEY=re_your_api_key_here
EMAIL_FROM=Food Reminder <noreply@yourdomain.com>

# Option 2: SMTP (Gmail, etc.)
# EMAIL_SERVICE=smtp
# EMAIL_HOST=smtp.gmail.com
# EMAIL_PORT=587
# EMAIL_USER=your-email@gmail.com
# EMAIL_PASSWORD=your-app-password
# EMAIL_FROM=Food Reminder <your-email@gmail.com>

# Push Notifications (Already configured with defaults)
VAPID_PUBLIC_KEY=BCNorKQy5pNRp7fXg1xrTCmvgvk_maqEP_AOoxAevfKYH3rqZnL9Jyb6WjkdyS-tBx1vPDDgOtbpNDx6laCWw_o
VAPID_PRIVATE_KEY=M14f0sqJjV99upZc1aJahq7ULa5AWPsHibyUmMVXuoY
VAPID_EMAIL=mailto:admin@foodremainder.com

# Notification Schedule
NOTIFICATION_TIMES_PER_DAY=1  # 1-4
# Or custom cron:
# NOTIFICATION_SCHEDULE="0 9,18 * * *"

# Timezone (optional, defaults to UTC)
TIMEZONE=Asia/Kolkata
```

---

## Still Having Issues?

1. **Check Browser Console**: Press F12 and look for errors
2. **Check Server Logs**: Look for error messages in terminal
3. **Verify Environment Variables**: Make sure `.env` file has correct values
4. **Test with Mock Data**: Use "Test Notification" button to verify configuration
5. **Check Email Spam Folder**: Emails might be filtered as spam initially

---

## Success Indicators

✅ **Working Browser Notifications**:
- Service worker appears in DevTools → Application → Service Workers
- "Test Notification" button triggers browser notification
- Notification icon appears in system tray

✅ **Working Email Notifications**:
- Server logs show: `✓ Email notifications enabled`
- Test email arrives in inbox within 1 minute
- Server logs show: `✅ Expiry notification sent to user@email.com`

✅ **Working Schedule**:
- Server logs show: `✅ Scheduler started successfully`
- Server logs show: `📌 Next check: [date/time]`
- Notifications arrive at expected times

---

**Last Updated**: December 2025
**Version**: 2.0 with Multiple Daily Notifications
