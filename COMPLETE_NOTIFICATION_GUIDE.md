# 📧✉️📱 Complete Notification Setup Guide

Welcome to the Food Reminder Notification System! This guide covers setting up **Email**, **SMS**, and **WhatsApp** notifications using **FREE services**.

---

## 🌟 Features Overview

✅ **Email Notifications** - Beautiful HTML emails with expiring items  
✅ **SMS Notifications** - Text message alerts  
✅ **WhatsApp Notifications** - WhatsApp messages  
✅ **Auto Scheduler** - Automatic daily checks  
✅ **Customizable Times** - Set when notifications are sent  
✅ **Free Services** - All using free tiers  

---

## 🎯 Quick Start (Recommended Setup)

### Step 1: Email with Resend (100 emails/day FREE)

1. **Sign up at [Resend.com](https://resend.com)**
   - No credit card required
   - Get 3,000 emails/month free

2. **Get your API key**
   - Dashboard → API Keys → Create API Key
   - Copy the key (starts with `re_...`)

3. **Add to .env file:**
   ```env
   EMAIL_SERVICE=resend
   RESEND_API_KEY=re_your_api_key_here
   EMAIL_FROM=Food Reminder <noreply@yourdomain.com>
   ```

Done! Emails are now configured.

### Step 2: SMS with Twilio (FREE trial)

1. **Sign up at [Twilio.com](https://www.twilio.com/try-twilio)**
   - Get $15 FREE credit

2. **Get a phone number**
   - Console → Phone Numbers → Buy a Number (FREE with trial credit)
   - Copy your phone number

3. **Get credentials**
   - Console → Account → Account Info
   - Copy Account SID and Auth Token

4. **Add to .env file:**
   ```env
   TWILIO_ACCOUNT_SID=your_account_sid
   TWILIO_AUTH_TOKEN=your_auth_token
   TWILIO_SMS_FROM=+1234567890  # Your Twilio number
   ```

### Step 3: WhatsApp with Twilio Sandbox (FREE)

1. **Enable WhatsApp Sandbox**
   - Twilio Console → Messaging → Try it Out → Send a WhatsApp message
   - Follow instructions to join sandbox (send "join [code]" to the Twilio number)

2. **Add to .env file:**
   ```env
   TWILIO_WHATSAPP_FROM=whatsapp:+14155238886  # Twilio WhatsApp sandbox number
   ```

### Step 4: Telegram (FREE)

1. **Create Bot:** Chat with @BotFather → `/newbot`
2. **Get Token:** Copy API Token
3. **Add to .env:**
   ```env
   TELEGRAM_BOT_TOKEN=your_token_here
   ```

### Step 5: Configure Scheduler

Add to .env:
```env
# When to send notifications (daily at 9 AM by default)
NOTIFICATION_SCHEDULE=0 9 * * *

# Timezone (optional, defaults to UTC)
TIMEZONE=America/New_York

# Auto-start scheduler (default: true)
NOTIFICATION_AUTO_SCHEDULE=true

# App URL for email/SMS links
APP_URL=https://yourapp.com
```

---

## 📋 Complete .env Example

```env
# ===== EMAIL CONFIGURATION =====
# Option 1: Resend (Recommended - FREE, no credit card)
EMAIL_SERVICE=resend
RESEND_API_KEY=re_123abc456def
EMAIL_FROM="Food Reminder <noreply@foodreminder.app>"

# Option 2: Gmail SMTP (Alternative)
# EMAIL_SERVICE=smtp
# EMAIL_HOST=smtp.gmail.com
# EMAIL_PORT=587
# EMAIL_USER=your-email@gmail.com
# EMAIL_PASSWORD=your-16-char-app-password
# EMAIL_FROM="Food Reminder <your-email@gmail.com>"

# ===== TWILIO CONFIG (SMS + WhatsApp) =====
TWILIO_ACCOUNT_SID=AC1234567890abcdef
TWILIO_AUTH_TOKEN=your_auth_token_here

# For SMS
TWILIO_SMS_FROM=+15551234567

# For WhatsApp (sandbox)
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886

# ===== TELEGRAM CONFIG =====
TELEGRAM_BOT_TOKEN=123456789:ABC...

# ===== SCHEDULER CONFIGURATION =====
# Cron schedule (when to check for expiring items)
# "0 9 * * *" = Every day at 9:00 AM
# "0 9,18 * * *" = Twice daily at 9 AM and 6 PM
# "0 */6 * * *" = Every 6 hours
NOTIFICATION_SCHEDULE=0 9 * * *

# Enable/disable automatic scheduling
NOTIFICATION_AUTO_SCHEDULE=true

# Timezone for scheduler
TIMEZONE=UTC

# App URL (used in email/SMS links)
APP_URL=http://localhost:5000
```

---

##⏰ Cron Schedule Examples

| Schedule | Description |
|----------|-------------|
| `0 9 * * *` | Daily at 9:00 AM |
| `0 9,18 * * *` | Twice daily (9 AM, 6 PM) |
| `0 */6 * * *` | Every 6 hours |
| `30 8 * * *` | Daily at 8:30 AM |
| `0 9 * * 1` | Every Monday at 9 AM |
| `0 20 * * 0` | Every Sunday at 8 PM |

---

## 💰 Cost Comparison

| Service | Free Tier | Enough For | Best For |
|---------|-----------|------------|----------|
| **Resend** | 3,000 emails/month | ✅ 100 users × 1 daily email | Email notifications |
| **Gmail SMTP** | ~500/day | ✅ Small apps | Testing/personal use |
| **Twilio SMS Trial** | $15 credit ($0.0075/SMS) | ✅ ~2,000 messages | SMS testing |
| **Twilio WhatsApp Sandbox** | Unlimited | ✅ Unlimited (sandbox) | WhatsApp testing |
| **Telegram** | Unlimited | ✅ Unlimited | Private, instant alerts |

---

## 🚀 Getting Started

### 1. Install Dependencies

Already installed! The following packages are included:
- `resend` - For email via Resend
- `nodemailer` - For SMTP email
- `twilio` - For SMS and WhatsApp
- `node-cron` - For scheduling

### 2. Set Up Services

Choose your preferred services and add credentials to `.env`:

**Minimum Setup (Email only):**
```env
EMAIL_SERVICE=resend
RESEND_API_KEY=your_key_here
EMAIL_FROM=Food Reminder <noreply@yourdomain.com>
```

**Full Setup (Email + SMS + WhatsApp):**
```env
# Email with Resend
EMAIL_SERVICE=resend
RESEND_API_KEY=your_resend_key

# Twilio for SMS/WhatsApp
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_SMS_FROM=+15551234567
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886

# Telegram
TELEGRAM_BOT_TOKEN=your_token

# Scheduler
NOTIFICATION_SCHEDULE=0 9 * * *
```

### 3. Start the Server

```bash
npm run dev
```

Check the logs:
```
✓ Email notifications enabled (using Resend)
✓ SMS notifications enabled
✓ WhatsApp notifications enabled  
✓ Notification scheduler started
📌 Next check: 12/6/2025, 9:00:00 AM
```

7. **Notification scheduler started**
8. **Next check time**

### 4. Test Notifications

From your app:
1. Login to your account
2. Add a food item that expires in 1-3 days
3. Go to Profile → Notification Settings
4. Enable Email/SMS/WhatsApp/Telegram
5. Click "Test Notification"

---

## 🎨 How It Works

### Automatic Flow

```
         ┌─────────────────┐
         │  Cron Scheduler │
         │  (9 AM daily)   │
         └────────┬────────┘
                  │
                  ▼
         ┌─────────────────┐
         │ Check All Users │
         └────────┬────────┘
                  │
                  ▼
      ┌───────────────────────┐
      │ Find Expiring Items   │
      │ (within threshold)    │
      └───────────┬───────────┘
                  │
          ┌───────┴───────┐
          ▼               ▼
    ┌─────────┐     ┌──────────┐
    │  Email  │     │ SMS/WA   │
    └─────────┘     └──────────┘
```

### User Preferences

Each user can customize:
- **Email Notifications**: ON/OFF
- **WhatsApp/SMS Notifications**: ON/OFF
- **Notification Days**: How many days before expiry (default: 3)

---

## 🧪 Testing

### Test Email Service

```bash
# Check server logs on startup:
✓ Email notifications enabled (using Resend)
```

### Test SMS Service

```bash
✓ SMS notifications enabled  
```

### Manual Notification Test

Via API:
```bash
curl -X POST http://localhost:5000/api/notifications/test/:userId
```

Via UI:
- Profile → Notification Settings → "Test Notification" button

---

## 📖 Detailed Service Setup

### Resend (Email) - Detailed Setup

**Why Resend?**
- ✅ 100 emails/day FREE (3,000/month)
- ✅ No credit card required
- ✅ Excellent deliverability
- ✅ Modern API
- ✅ Easy to set up

**Steps:**

1. Go to [resend.com](https://resend.com)
2. Sign up (takes 2 minutes)
3. Verify your email
4. Go to "API Keys"
5. Click "Create API Key"
6. Name it "Food Reminder"
7. Copy the key (re_...)

8. Add to `.env`:
   ```env
   EMAIL_SERVICE=resend
   RESEND_API_KEY=re_paste_your_key_here
   EMAIL_FROM=Food Reminder <noreply@yourdomain.com>
   ```

**For Testing:**
- Use `onboarding@resend.dev` as from address (no domain verification needed)
- Example: `EMAIL_FROM=Food Reminder <onboarding@resend.dev>`

**For Production:**
- Verify your own domain in Resend dashboard
- Add DNS records (SPF, DKIM)
- Use your domain: `noreply@yourdomain.com`

### Gmail SMTP (Alternative Email)

**Why Gmail?**
- ✅ Free forever (personal use)
- ✅ No signup needed (use existing account)
- ⚠️ Requires App Password setup
- ⚠️ ~500 emails/day limit

**Steps:**

1. Enable 2-Factor Authentication
   - Google  Account → Security → 2-Step Verification

2. Create App Password
   - Google Account → Security → App Passwords
   - Select "Mail" and "Other"
   - Name it "Food Reminder"
   - Copy 16-character password (no spaces)

3. Add to `.env`:
   ```env
   EMAIL_SERVICE=smtp
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=abcd efgh ijkl mnop  # 16 chars (remove spaces)
   EMAIL_FROM=Food Reminder <your-email@gmail.com>
   ```

### Twilio SMS - Detailed Setup

**Why Twilio?**
- ✅ $15 FREE trial credit
- ✅ SMS costs ~$0.0075 each = ~2,000 FREE messages
- ✅ Industry standard
- ⚠️ Requires verified phone numbers on trial

**Steps:**

1. Sign up at [twilio.com/try-twilio](https://www.twilio.com/try-twilio)
2. Verify your phone number
3. Get $15 free credit

4. Buy a phone number (FREE with trial):
   - Console → Phone Numbers → Buy a Number
   - Choose a number
   - Capabilities: Check "SMS"

5. Get credentials:
   - Console → Account → Account Info
   - Copy Account SID (starts with AC...)
   - Copy Auth Token

6. Add to `.env`:
   ```env
   TWILIO_ACCOUNT_SID=AC1234567890abcdef
   TWILIO_AUTH_TOKEN=your_auth_token
   TWILIO_SMS_FROM=+15551234567  # Your Twilio number
   ```

**Trial Limitations:**
- Can only send to verified phone numbers
- Add numbers in: Console → Verified Caller IDs

### Twilio WhatsApp - Detailed Setup

**Why WhatsApp?**
- ✅ FREE sandbox for testing
- ✅ Unlimited messages in sandbox
- ✅ Users prefer WhatsApp for notifications

**Steps:**

1. **Join Sandbox:**
   - Twilio Console → Messaging → Try it Out → Send a WhatsApp message
   - You'll see a number like +1 415 523 8886
   - You'll see a code like "join example-word"

2. **Connect Your WhatsApp:**
   - Open WhatsApp on your phone
   - Send a message to the Twilio number: "join example-word"
   - You'll get a confirmation

3. **Add to .env:**
   ```env
   TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
   ```

4. **Connect User Numbers:**
   - Each user must join the sandbox
   - They send "join [code]" to Twilio WhatsApp number
   - One-time setup per user

**Production (Optional):**
- Apply for WhatsApp Business API
- Costs ~$0.005-0.01 per message
- No sandbox limitations

### Telegram - Detailed Setup

**Why Telegram?**
- ✅ Completely FREE
- ✅ Unlimited messages
- ✅ Easy setup

**Steps:**

1. **Create Bot:**
   - Open Telegram and search @BotFather
   - Send `/newbot`
   - Name your bot and give it a username
   - Copy the HTTP API Token

2. **Add to .env:**
   ```env
   TELEGRAM_BOT_TOKEN=your_token_here
   ```

3. **Get Chat ID:**
   - Start your bot
   - Send a message to it
   - Visit `https://api.telegram.org/bot<TOKEN>/getUpdates`
   - Copy `id` from `chat` object

4. **Add to User Profile:**
   - Add `telegramChatId` to user record
   - Enable `telegramNotifications`

---

## 🎮 User Guide

### Enable Notifications

1. **Login** to Food Reminder
2. Go to **Profile**
3. Scroll to **Notification Settings**
4. Toggle Email/WhatsApp/Telegram ON
5. Set notification days (e.g., 3 days before expiry)
6. Click **Save Preferences**

### Test Notifications

1. Click **Test Notification** button
2. Check your email/phone
3. You should receive a test notification

### For WhatsApp Users

- Join Twilio Sandbox first
- WhatsApp the Twilio number: "join [code]"
- Wait for confirmation
- Enable WhatsApp in notification settings

---

## 🔧 Advanced Configuration

### Custom Schedule

Add to `.env`:
```env
# Every day at 8:30 AM
NOTIFICATION_SCHEDULE=30 8 * * *

# Twice daily (9 AM and 9 PM)
NOTIFICATION_SCHEDULE=0 9,21 * * *

# Every 6 hours
NOTIFICATION_SCHEDULE=0 */6 * * *
```

### Timezone

```env
# US Eastern
TIMEZONE=America/New_York

# India
TIMEZONE=Asia/Kolkata

# London
TIMEZONE=Europe/London

# Tokyo
TIMEZONE=Asia/Tokyo
```

### Disable Auto-Scheduling

```env
# Manual triggering only
NOTIFICATION_AUTO_SCHEDULE=false
```

Then trigger manually:
```bash
curl -X POST http://localhost:5000/api/notifications/check-all
```

---

## 🆘 Troubleshooting

### Emails Not Sending

**Resend:**
- ✅ Check API key is correct
- ✅ Verify domain (or use `onboarding@resend.dev` for testing)
- ✅ Check Resend dashboard for errors

**Gmail:**
- ✅ Use App Password, not regular password
- ✅ Enable 2FA first
- ✅ Remove spaces from 16-char password

### SMS Not Sending

- ✅ Verify phone numbers in Twilio (trial account)
- ✅ Check you have trial credit left
- ✅ Phone number format: +1234567890 (include country code)
- ✅ Check Twilio logs in console

### WhatsApp Not Sending

- ✅ Join sandbox with "join [code]" message
- ✅ Wait for confirmation before testing
- ✅ Check phone number in user profile has country code
- ✅ Sandbox is active (doesn't expire but check Twilio console)

### Scheduler Not Running

- ✅ Check server logs: "✓ Notification scheduler started"
- ✅ Verify `NOTIFICATION_AUTO_SCHEDULE` is not set to "false"
- ✅ Check cron expression syntax
- ✅ Ensure at least one notification service is enabled

---

## 📊 Monitoring

### Check Service Status

Server logs show on startup:
```
[EmailService] ✅ Email service initialized with Resend
[EmailService] 📧 Free tier: 100 emails/day, 3,000/month
[SmsService] ✅ SMS service initialized
[WhatsAppService] ✅ WhatsApp service initialized
[TelegramService] ✅ Telegram service initialized
[NotificationScheduler] ✅ Scheduler started
[NotificationScheduler] 📌 Next check: 12/6/2025, 9:00:00 AM
```

### Manual Check

```bash
curl -X POST http://localhost:5000/api/notifications/check-all
```

Response:
```json
{
  "message": "Notification check completed",
  "notificationsSent": 2,
  "results": [
    {
      "userId": "123",
      "username": "john",
      "itemCount": 3,
      "emailSent": true,
      "smsSent": true,
      "whatsappSent": false,
      "telegramSent": true
    }
  ]
}
```

---

## 💡 Tips & Best Practices

1. **Start with Resend** for email - easiest and most reliable
2. **Test with sandbox** before going to production
3. **Set reasonable schedules** - once daily is usually enough
4. **Monitor your usage** to stay within free tiers
5. **Verify phone numbers** properly for SMS
6. **Use timezone settings** to send at appropriate local times

---

## 🎉 You're All Set!

Your Food Reminder now has:
- ✅ Free email notifications
- ✅ Free SMS notifications
- ✅ Free WhatsApp notifications
- ✅ Automatic daily checks
- ✅ Customizable schedules

Need help? Check the troubleshooting section or the detailed guides above!

---

**Happy Notifying! 🚀**
