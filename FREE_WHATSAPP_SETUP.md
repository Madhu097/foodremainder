# Free WhatsApp Notifications Setup Guide

This guide will help you set up **FREE** WhatsApp notifications using Meta's WhatsApp Business Cloud API.

## Why This is Free

Meta provides a generous free tier:
- **1,000 service conversations per month** (business-initiated messages)
- **Unlimited user-initiated conversations** (within 24-hour window)
- No credit card required to start

## Prerequisites

- A Meta Developer Account (free)
- A Facebook Business account (free)
- A phone number (can be a test number provided by Meta)

## Step-by-Step Setup

### 1. Create a Meta Developer Account

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Click "Get Started" and sign up with your Facebook account
3. Verify your email

### 2. Create a WhatsApp Business App

1. Visit [Meta Apps Dashboard](https://developers.facebook.com/apps)
2. Click "Create App"
3. Choose "Business" as the app type
4. Fill in app details:
   - App name: "Food Reminder" (or your choice)
   - App contact email: your email
5. Click "Create App"

### 3. Add WhatsApp Product

1. In your app dashboard, find "WhatsApp" in the products list
2. Click "Set up" next to WhatsApp
3. You'll be redirected to the WhatsApp setup page

### 4. Get Your Credentials

1. In the WhatsApp section, you'll see:
   - **Phone Number ID** - Copy this
   - **WhatsApp Business Account ID** - Copy this
   - **Temporary Access Token** - Copy this (valid for 24 hours)

2. For production, generate a **Permanent Access Token**:
   - Go to App Settings → Basic
   - Scroll to "App Secret" and copy it
   - Or use System User Token (recommended for production)

### 5. Get a Phone Number

You have two options:

#### Option A: Use Meta's Test Number (Easiest)
- Meta provides a test phone number automatically
- You can send messages to up to 5 recipient numbers
- Perfect for testing!

#### Option B: Add Your Own Number (For Production)
1. Click "Add phone number" in the WhatsApp dashboard
2. Follow the verification process
3. This becomes your sending number

### 6. Add Test Recipients (Important!)

1. In WhatsApp dashboard, go to "API Setup"
2. Under "To", you'll see "Manage phone number list"
3. Click "Manage" and add phone numbers that will receive test messages
4. Format: Include country code (e.g., +1234567890)
5. Verify each number via SMS

### 7. Configure Your App

Add these to your `.env` file:

```env
# Free WhatsApp Cloud API (Meta)
WHATSAPP_CLOUD_ACCESS_TOKEN=your_access_token_here
WHATSAPP_CLOUD_PHONE_NUMBER_ID=your_phone_number_id_here
WHATSAPP_CLOUD_BUSINESS_ACCOUNT_ID=your_business_account_id_here
```

### 8. Test Your Setup

1. Restart your server
2. You should see: `✓ WhatsApp notifications enabled (FREE Cloud API)`
3. Add a food item expiring soon in your app
4. Trigger a notification

## Message Templates (Optional)

For business-initiated conversations outside the 24-hour window, you need approved templates:

1. Go to WhatsApp Manager
2. Create message templates
3. Submit for approval (usually approved within 24 hours)
4. Use templates in your code

Example template structure:
```
Name: expiry_alert
Category: UTILITY
Language: English
Body: Hello {{1}}, you have {{2}} items expiring soon!
```

## Troubleshooting

### "Recipient phone number not in allowed list"
**Solution**: Add the recipient number in your WhatsApp dashboard under "To" → "Manage phone number list"

### "Message failed: 24 hour window expired"
**Solution**: 
- User needs to send you a message first
- OR use an approved message template

### "Invalid access token"
**Solution**: 
- Generate a new permanent access token
- Temporary tokens expire after 24 hours

### "Phone number not verified"
**Solution**: Verify your phone number in the WhatsApp dashboard

## Production Checklist

Before going live:
- [ ] Generate permanent access token
- [ ] Add your own verified phone number
- [ ] Create and approve message templates
- [ ] Remove test numbers, add real user numbers
- [ ] Set up proper error handling and logging
- [ ] Monitor your conversation usage in Meta Business Suite

## Limits

**Free Tier:**
- 1,000 service conversations/month
- Unlimited user-initiated conversations (24h window)
- Rate limit: ~60 messages per minute

**If You Exceed Free Tier:**
- $0.005 - $0.10 per conversation (varies by country)
- Still very cheap compared to SMS!

## API Documentation

- [Official WhatsApp Cloud API Docs](https://developers.facebook.com/docs/whatsapp/cloud-api)
- [Message Templates Guide](https://developers.facebook.com/docs/whatsapp/business-management-api/message-templates)
- [WhatsApp Business Platform](https://business.whatsapp.com/)

## Alternative: Twilio (Paid)

If you prefer Twilio, use these env variables instead:
```env
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
```

The app will automatically use whichever service is configured!
