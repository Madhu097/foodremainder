# 🚀 Notifications Quick Start

Get email and WhatsApp notifications for expiring food items in 5 minutes!

## ⚡ Quick Setup

### 1️⃣ For Email Notifications (Gmail)

```bash
# 1. Enable 2FA on your Google Account
# 2. Generate App Password: https://myaccount.google.com/apppasswords
# 3. Add to .env file:

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-char-app-password
EMAIL_FROM=Food Reminder <your-email@gmail.com>
```

### 2️⃣ For WhatsApp Notifications (Twilio)

```bash
# 1. Sign up: https://www.twilio.com/
# 2. Join WhatsApp Sandbox: Console → Messaging → Try WhatsApp
# 3. Add to .env file:

TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
```

### 3️⃣ Update Database

```bash
npm run db:push
```

### 4️⃣ Restart Server

```bash
npm run dev
```

You should see:
```
✓ Email notifications enabled
✓ WhatsApp notifications enabled
```

## 🎯 Using Notifications

### In the App

1. Go to **Profile** page
2. Scroll to **Notification Settings**
3. Toggle Email/WhatsApp on
4. Set notification days (default: 3 days before expiry)
5. Click **Save Preferences**
6. Click **Test Notification** to verify

### Automated Daily Checks

Add a cron job to check notifications daily:

```bash
# Run at 9 AM daily
0 9 * * * curl -X POST http://localhost:5000/api/notifications/check-all
```

Or manually trigger:

```bash
curl -X POST http://localhost:5000/api/notifications/check-all
```

## ✅ Verification Checklist

- [ ] Environment variables added to `.env`
- [ ] Database schema updated (`npm run db:push`)
- [ ] Server restarted
- [ ] Services show as "enabled" in logs
- [ ] Added food items with expiry dates
- [ ] Enabled notifications in Profile
- [ ] Test notification works

## 🆘 Quick Troubleshooting

**Email not sending?**
- Using Gmail App Password (not regular password)?
- 2FA enabled on Google Account?
- Check EMAIL_PORT=587

**WhatsApp not sending?**
- Joined Twilio WhatsApp Sandbox?
- Phone number includes country code (+)?
- Sent "join [code]" to Twilio number?

**No notifications?**
- Do you have items expiring within notification threshold?
- Are notifications enabled in Profile settings?
- Check server logs for errors

## 📚 Full Documentation

See [NOTIFICATION_SETUP.md](./NOTIFICATION_SETUP.md) for complete setup guide, API documentation, and advanced configuration.

---

🎉 That's it! You should now receive notifications about expiring food items.
