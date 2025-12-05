# 🚀 Quick Start: Email & SMS Notifications

Get notifications running in **3 minutes** using **free services**!

## ⚡ Super Quick Setup (Email Only - Recommended)

### 1. Sign up for Resend (30 seconds)
Visit: https://resend.com/signup
- No credit card needed
- Free: 100 emails/day

### 2. Get API Key (30 seconds)
1. Dashboard → API Keys
2. Click "Create API Key"
3. Copy the key (starts with `re_`)

### 3. Add to .env (30 seconds)
```bash
EMAIL_SERVICE=resend
RESEND_API_KEY=re_paste_your_key_here
EMAIL_FROM=Food Reminder <onboarding@resend.dev>
```

### 4. Start the server
```bash
npm run dev
```

**Done!** ✅ Email notifications are working!

---

## 📱 Add SMS Notifications (2 minutes)

### 1. Sign up for Twilio (1 minute)
Visit: https://www.twilio.com/try-twilio
- Get $15 free credit (~2,000 SMS messages!)

### 2. Get credentials (1 minute)
1. Console → Get a Twilio phone number (free)
2. Console → Account → Copy Account SID and Auth Token

### 3. Add to .env
```bash
TWILIO_ACCOUNT_SID=AC...your-sid
TWILIO_AUTH_TOKEN=your-token
TWILIO_SMS_FROM=+15551234567
```

**Done!** ✅ SMS notifications working!

---

## 💬 Add WhatsApp (30 seconds)

Already have Twilio? Just add:

```bash
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
```

Then join sandbox:
1. WhatsApp the number +1 415 523 8886
2. Send message: "join [your-code]"
3. Get confirmation

**Done!** ✅ WhatsApp notifications working!

---

## ✈️ Add Telegram (2 minutes)

1. **Create Bot:** Chat with @BotFather → `/newbot`
2. **Add to .env:**
   ```bash
   TELEGRAM_BOT_TOKEN=your_token
   ```
3. **Get Chat ID:**
   - Message your bot
   - Visit `https://api.telegram.org/bot<TOKEN>/getUpdates`
   - Copy `id` from `chat` object

**Done!** ✅ Telegram notifications working!

---

## ⏰ Customize Schedule (Optional)

Add to .env:
```bash
# Daily at 9 AM
NOTIFICATION_SCHEDULE=0 9 * * *

# Twice daily (9 AM and 6 PM)
NOTIFICATION_SCHEDULE=0 9,18 * * *

# Your timezone
TIMEZONE=America/New_York
```

---

## ✅ Verify It's Working

When you start the server, you should see:

```
✓ Email notifications enabled (using Resend)
✓ SMS notifications enabled
✓ WhatsApp notifications enabled
✓ Notification scheduler started
📌 Next check: MM/DD/YYYY, 9:00:00 AM
```

---

## 🧪 Test It

### From UI:
1. Login to your app
2. Profile → Notification Settings
3. Enable notifications
4. Click "Test Notification"

### From API:
```bash
curl -X POST http://localhost:5000/api/notifications/test/YOUR_USER_ID
```

---

## 💡 What You Get FREE

| Service | Free Tier | What It Means |
|---------|-----------|---------------|
| Resend Email | 100/day, 3,000/month | Perfect for 100 daily users |
| Twilio SMS | $15 credit | ~2,000 FREE messages |
| Twilio WhatsApp | Unlimited (sandbox) | Unlimited testing |

---

## 📚 Need More Details?

See `COMPLETE_NOTIFICATION_GUIDE.md` for:
- Alternative email services (Gmail, Brevo)
- Production WhatsApp setup
- Advanced scheduling
- Troubleshooting
- API reference

---

## 🎯 Minimal Working Example

Absolute minimum .env for email-only notifications:

```bash
# Firebase (for data storage)
FIREBASE_PROJECT_ID=your-project
FIREBASE_PRIVATE_KEY="your-key"
FIREBASE_CLIENT_EMAIL=your-email@project.iam.gserviceaccount.com

# Email (with Resend)
EMAIL_SERVICE=resend  
RESEND_API_KEY=re_your_key
EMAIL_FROM=Food Reminder <onboarding@resend.dev>

# Optional: Schedule (defaults to 9 AM daily)
# NOTIFICATION_SCHEDULE=0 9 * * *
```

That's it! 🎉

---

**Ready?** Run `npm run dev` and you're live! 🚀
