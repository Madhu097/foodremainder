# WhatsApp Notification Setup Guide

## Overview
This guide will help you set up WhatsApp notifications for the Food Remainder app using the free WhatsApp Business Cloud API.

## Prerequisites
- A Facebook/Meta account
- A phone number to use as your WhatsApp Business number
- Access to Meta Business Manager

## Setup Steps

### 1. Create a Meta Developer Account
1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Sign in with your Facebook account
3. Complete the developer account setup

### 2. Create a WhatsApp Business App
1. Go to [Meta Apps Dashboard](https://developers.facebook.com/apps)
2. Click "Create App"
3. Select "Business" as the app type
4. Fill in your app details:
   - App Name: "Food Remainder Notifications" (or your preferred name)
   - App Contact Email: Your email
5. Click "Create App"

### 3. Add WhatsApp Product
1. In your app dashboard, find "WhatsApp" in the products list
2. Click "Set Up" on the WhatsApp product
3. You'll be taken to the WhatsApp setup page

### 4. Get Your Credentials

#### Phone Number ID
1. In the WhatsApp setup page, go to "API Setup"
2. You'll see a "Phone number ID" - copy this value
3. This is your `WHATSAPP_CLOUD_PHONE_NUMBER_ID`

#### Access Token
1. In the same "API Setup" section, you'll see a "Temporary access token"
2. Copy this token (Note: This is temporary and expires in 24 hours)
3. For production, you'll need to generate a permanent token (see below)
4. This is your `WHATSAPP_CLOUD_ACCESS_TOKEN`

### 5. Configure Environment Variables
Add these to your `.env` file:

```env
WHATSAPP_CLOUD_ACCESS_TOKEN=your_access_token_here
WHATSAPP_CLOUD_PHONE_NUMBER_ID=your_phone_number_id_here
```

### 6. Test in Sandbox Mode

#### For Testing (Sandbox)
1. In the WhatsApp API Setup page, you'll see a "To" field with a test number
2. Send the join code from your WhatsApp to the test number shown
3. The join code looks like: `join <code>` (e.g., `join ability-friend-ship`)
4. Once you send this, you're added to the sandbox
5. Now you can receive test messages!

**Important Notes for Sandbox:**
- Users must send the join code to your test number before receiving messages
- The 24-hour messaging window applies (user must message you first, or you need templates)
- Sandbox is for testing only - not for production use

### 7. Production Setup

#### Generate a Permanent Access Token
1. Go to "Business Settings" in Meta Business Manager
2. Navigate to "System Users"
3. Create a new system user or use existing one
4. Generate a new token with `whatsapp_business_messaging` permission
5. Replace the temporary token in your `.env` file

#### Verify Your Business
1. Complete business verification in Meta Business Manager
2. This is required for production use
3. Follow the verification wizard in Business Settings

#### Add Your Phone Number
1. In WhatsApp settings, add your business phone number
2. Verify the phone number (you'll receive a verification code)
3. This number will be used to send messages to users

### 8. Message Templates (Required for Business-Initiated Messages)

For sending notifications without the 24-hour window restriction, you need approved message templates:

1. Go to WhatsApp Manager → Message Templates
2. Click "Create Template"
3. Create a template for food expiry notifications:
   - Name: `food_expiry_alert`
   - Category: `UTILITY`
   - Language: `English`
   - Template content:
     ```
     🍎 Food Expiry Alert

     Hi {{1}}! 👋

     You have {{2}} item(s) expiring soon. Check your dashboard to avoid waste!
     ```
4. Submit for approval (usually takes 24-48 hours)
5. Once approved, update the code to use template messages

## Troubleshooting

### Error: "24-hour window expired"
**Problem:** You're trying to send a message outside the 24-hour window.

**Solutions:**
1. **For Testing:** Have the user message your WhatsApp number first
2. **For Production:** Use approved message templates
3. **Alternative:** Wait for user to initiate conversation

### Error: "Phone number not registered"
**Problem:** The recipient's number is not on WhatsApp or not in sandbox.

**Solutions:**
1. Verify the phone number format (should include country code)
2. For sandbox: User must send the join code first
3. Check if the number is actually registered on WhatsApp

### Error: "User's number is part of an experiment"
**Problem:** Sandbox restriction - user hasn't joined the test environment.

**Solutions:**
1. User must send the join code to your test number
2. Check Meta Business Manager for the correct join code
3. Make sure user sends from the exact number you're testing with

### Messages not being received
**Checklist:**
- [ ] User has WhatsApp installed
- [ ] Phone number format is correct (with country code, e.g., +919876543210)
- [ ] For sandbox: User sent the join code
- [ ] For production: Business is verified
- [ ] Access token is valid (not expired)
- [ ] Phone Number ID is correct
- [ ] Check server logs for detailed error messages

## Phone Number Format

The app automatically adds +91 (India) country code if not provided. For other countries:

1. Update the code in `server/routes.ts` (lines 62-65, 128-131, 192-195)
2. Change `+91` to your country code (e.g., `+1` for USA, `+44` for UK)

Or ensure users enter their number with country code.

## Free Tier Limits

WhatsApp Cloud API Free Tier includes:
- **1,000 service conversations per month** (business-initiated)
- **Unlimited user-initiated conversations** (within 24-hour window)
- **Free for first 1,000 users**

After free tier:
- Service conversations: ~$0.005 - $0.09 per conversation (varies by country)
- User-initiated: Free

## Best Practices

1. **Use Templates for Scheduled Notifications**
   - Create and approve templates for regular notifications
   - This avoids 24-hour window restrictions

2. **Verify Phone Numbers**
   - Validate phone numbers before storing
   - Use international format with country code

3. **Handle Errors Gracefully**
   - Log all errors for debugging
   - Provide fallback to email notifications

4. **Monitor Usage**
   - Track conversation counts in Meta Business Manager
   - Set up alerts for quota limits

5. **Test Thoroughly**
   - Test in sandbox before production
   - Test with multiple phone numbers
   - Test different scenarios (new user, existing conversation, etc.)

## Additional Resources

- [WhatsApp Cloud API Documentation](https://developers.facebook.com/docs/whatsapp/cloud-api)
- [Message Templates Guide](https://developers.facebook.com/docs/whatsapp/message-templates)
- [WhatsApp Business Platform Pricing](https://developers.facebook.com/docs/whatsapp/pricing)
- [Meta Business Manager](https://business.facebook.com/)

## Support

If you encounter issues:
1. Check the server logs for detailed error messages
2. Review this guide's troubleshooting section
3. Consult WhatsApp Cloud API documentation
4. Check Meta Developer Community forums
