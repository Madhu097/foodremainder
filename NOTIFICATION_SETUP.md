# 📧 Notification System Setup Guide

The Food Reminder app now supports **Email** and **WhatsApp** notifications for expiring food items! This guide will help you set up and configure the notification system.

## 🌟 Features

- ✉️ **Email Notifications** - Receive beautiful HTML email alerts
- 📱 **WhatsApp Notifications** - Get instant messages on WhatsApp
- ⚙️ **Customizable Settings** - Control notification preferences per user
- 🎯 **Smart Alerts** - Only notify about items expiring within your chosen timeframe
- 🧪 **Test Functionality** - Test notifications anytime from your profile

---

## 📋 Prerequisites

### For Email Notifications

You'll need an SMTP email service. Options include:

1. **Gmail** (Recommended for testing)
   - Free and easy to set up
   - Requires App Password (not your regular password)
   
2. **SendGrid** (Recommended for production)
   - Professional email delivery service
   - Free tier: 100 emails/day

3. **Other SMTP Services**
   - Mailgun, Amazon SES, Postmark, etc.

### For WhatsApp Notifications

You'll need a **Twilio** account:

1. Sign up at [https://www.twilio.com/](https://www.twilio.com/)
2. Get WhatsApp sandbox credentials (free for testing)
3. For production, you'll need a Twilio WhatsApp Business profile

---

## 🔧 Configuration

### Step 1: Copy Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

### Step 2: Configure Email Service

#### Option A: Using Gmail

1. **Enable 2-Factor Authentication** on your Google Account
   - Go to Google Account Settings → Security → 2-Step Verification

2. **Create App Password**
   - Go to Google Account → Security → App Passwords
   - Select "Mail" and "Other" (name it "Food Reminder")
   - Copy the 16-character password

3. **Update .env file**:
   ```env
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-16-char-app-password
   EMAIL_FROM=Food Reminder <your-email@gmail.com>
   ```

#### Option B: Using SendGrid

1. **Sign up** at [https://sendgrid.com/](https://sendgrid.com/)

2. **Create API Key**
   - Go to Settings → API Keys → Create API Key
   - Choose "Full Access" or "Mail Send" permission
   - Copy the API key

3. **Update .env file**:
   ```env
   EMAIL_HOST=smtp.sendgrid.net
   EMAIL_PORT=587
   EMAIL_USER=apikey
   EMAIL_PASSWORD=your-sendgrid-api-key
   EMAIL_FROM=Food Reminder <noreply@yourdomain.com>
   ```

### Step 3: Configure WhatsApp Service

1. **Sign up for Twilio**
   - Visit [https://www.twilio.com/](https://www.twilio.com/)
   - Create a free account

2. **Get Sandbox Credentials**
   - Go to Console → Messaging → Try it out → Send a WhatsApp message
   - Follow instructions to connect your WhatsApp number to the sandbox
   - Usually involves sending "join [code]" to the Twilio WhatsApp number

3. **Get Your Credentials**
   - Account SID: Find in Console Dashboard
   - Auth Token: Find in Console Dashboard
   - WhatsApp From Number: Usually `whatsapp:+14155238886` (sandbox)

4. **Update .env file**:
   ```env
   TWILIO_ACCOUNT_SID=your-account-sid
   TWILIO_AUTH_TOKEN=your-auth-token
   TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
   ```

### Step 4: Update Database Schema

Run the database migration to add notification preference columns:

```bash
npm run db:push
```

This will add the following columns to the `users` table:
- `email_notifications` (default: true)
- `whatsapp_notifications` (default: false)
- `notification_days` (default: 3)

---

## 🚀 Usage

### For Users

1. **Access Notification Settings**
   - Navigate to your Profile page
   - Scroll to "Notification Settings" section

2. **Configure Preferences**
   - Toggle Email/WhatsApp notifications on/off
   - Set how many days before expiry you want to be notified
   - Click "Save Preferences"

3. **Test Notifications**
   - Click "Test Notification" button
   - You'll receive a notification if you have expiring items

### For Administrators

#### Manual Notification Check

Trigger notifications for all users via API:

```bash
curl -X POST http://localhost:5000/api/notifications/check-all
```

Response:
```json
{
  "message": "Notification check completed",
  "notificationsSent": 3,
  "results": [
    {
      "userId": "user-id",
      "username": "john_doe",
      "itemCount": 2,
      "emailSent": true,
      "whatsappSent": true
    }
  ]
}
```

#### Automated Notifications (Recommended)

Set up a cron job or scheduled task to check notifications daily.

**Linux/Mac (using cron):**

```bash
# Edit crontab
crontab -e

# Add this line to run daily at 9 AM
0 9 * * * curl -X POST http://localhost:5000/api/notifications/check-all
```

**Windows (using Task Scheduler):**

1. Open Task Scheduler
2. Create Basic Task
3. Set trigger to "Daily" at your preferred time
4. Action: "Start a Program"
5. Program: `curl`
6. Arguments: `-X POST http://localhost:5000/api/notifications/check-all`

**Production (using a service like cron-job.org):**

1. Visit [https://cron-job.org](https://cron-job.org)
2. Create free account
3. Add new cron job with your API URL
4. Set schedule (e.g., daily at 9 AM)

---

## 📧 Email Notification Preview

Users receive beautifully formatted HTML emails with:
- Personalized greeting
- List of expiring items with status
- Category and expiry information
- Direct link to dashboard
- Responsive design for mobile/desktop

---

## 📱 WhatsApp Notification Preview

WhatsApp messages include:
- Friendly greeting with emoji
- Count of expiring items
- List with expiry status
- Link to dashboard

---

## 🧪 Testing

### Test Email Configuration

```bash
# The server will log on startup:
✓ Email notifications enabled
# or
⚠ Email notifications disabled (configure EMAIL_* environment variables)
```

### Test WhatsApp Configuration

```bash
# The server will log on startup:
✓ WhatsApp notifications enabled
# or
⚠ WhatsApp notifications disabled (configure TWILIO_* environment variables)
```

### Test User Notification

1. Add food items with expiry dates within 3 days
2. Go to Profile → Notification Settings
3. Enable Email or WhatsApp
4. Click "Test Notification"
5. Check your email/WhatsApp

---

## 🔍 Troubleshooting

### Email Not Sending

**Problem**: Email notifications not working

**Solutions**:
- Verify SMTP credentials are correct
- For Gmail, ensure App Password is used (not regular password)
- Check if 2FA is enabled on Gmail account
- Verify EMAIL_PORT is 587 (or 465 for SSL)
- Check server logs for error messages

### WhatsApp Not Sending

**Problem**: WhatsApp messages not arriving

**Solutions**:
- Verify you've joined the Twilio sandbox (send "join [code]")
- Check if phone number format is correct (include + and country code)
- Verify Twilio credentials in .env
- Check Twilio console for delivery logs
- Ensure you have Twilio credits (free trial has limits)

### Notifications Not Triggering

**Problem**: No notifications received

**Solutions**:
- Check if you have food items expiring within notification threshold
- Verify notification preferences are enabled in Profile
- Ensure cron job or scheduled task is running
- Manually trigger check: `POST /api/notifications/check-all`
- Check server logs for errors

---

## 🔒 Security Notes

1. **Never commit .env file** to version control
2. **Use App Passwords** for Gmail, not your main password
3. **Rotate API keys** regularly in production
4. **Limit API access** - consider adding authentication to notification endpoints
5. **Monitor usage** to avoid hitting rate limits

---

## 📊 API Endpoints

### Get Notification Preferences
```
GET /api/notifications/preferences/:userId
```

### Update Notification Preferences
```
PUT /api/notifications/preferences/:userId
Body: {
  emailNotifications: boolean,
  whatsappNotifications: boolean,
  notificationDays: number
}
```

### Test Notification (Single User)
```
POST /api/notifications/test/:userId
```

### Check All Users
```
POST /api/notifications/check-all
```

---

## 🎯 Best Practices

1. **Start with Email** - Easier to set up and test
2. **Test Thoroughly** - Use the test button before going live
3. **Set Reasonable Thresholds** - 3-5 days is usually optimal
4. **Schedule Wisely** - Send notifications at convenient times (e.g., 9 AM)
5. **Monitor Delivery** - Check logs regularly for failed notifications

---

## 💡 Tips

- **For Development**: Use Gmail with App Password
- **For Production**: Use SendGrid or similar service
- **WhatsApp Sandbox**: Limited to numbers you've added - fine for testing
- **WhatsApp Production**: Requires Twilio Business Profile approval
- **Rate Limits**: Be aware of email/SMS sending limits in free tiers

---

## 🆘 Support

If you encounter issues:

1. Check server logs for error messages
2. Verify all environment variables are set correctly
3. Test with curl commands to isolate API issues
4. Review service provider documentation (Gmail, SendGrid, Twilio)

---

## 📝 Changelog

### Version 1.0.0
- ✅ Email notification support
- ✅ WhatsApp notification support
- ✅ User preference management
- ✅ Test notification functionality
- ✅ Manual trigger endpoint
- ✅ Beautiful HTML email templates

---

Happy notifying! 🎉
