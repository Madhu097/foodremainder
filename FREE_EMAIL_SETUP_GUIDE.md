# 📧 Free Email Service Setup Guide

This guide covers setting up **completely free** email services for the Food Reminder app.

## 🎯 Best Free Email Services

### Option 1: Resend (⭐ Recommended)
**Free Tier:** 3,000 emails/month, 100/day

✅ **Pros:**
- Excellent deliverability
- Simple API
- No credit card required for free tier
- Developer-friendly
- Modern and reliable

#### Setup Steps:

1. **Sign up at [https://resend.com/](https://resend.com/)**
   - Create free account
   - No credit card required

2. **Get API Key:**
   - Go to API Keys section
   - Click "Create API Key"
   - Copy the key (starts with `re_`)

3. **Verify Domain (Optional but recommended):**
   - You can use `onboarding@resend.dev` for testing
   - For production, verify your own domain

4. **Update .env file:**
   ```env
   # Resend Email Configuration
   EMAIL_SERVICE=resend
   RESEND_API_KEY=re_your_api_key_here
   EMAIL_FROM=Food Reminder <noreply@yourdomain.com>
   ```

---

### Option 2: Gmail (Traditional Method)
**Free Tier:** Unlimited for personal use (reasonable usage)

✅ **Pros:**
- Free forever
- Easy to set up
- Familiar interface

⚠️ **Cons:**
- Requires App Password setup
- Daily sending limits (~500 emails/day)
- May mark emails as spam if sent in bulk

#### Setup Steps:

1. **Enable 2-Factor Authentication:**
   - Go to [Google Account Security](https://myaccount.google.com/security)
   - Enable 2-Step Verification

2. **Create App Password:**
   - Go to [App Passwords](https://myaccount.google.com/apppasswords)
   - Select "Mail" and "Other" (name it "Food Reminder")
   - Copy the 16-character password

3. **Update .env file:**
   ```env
   # Gmail SMTP Configuration
   EMAIL_SERVICE=smtp
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-16-char-app-password
   EMAIL_FROM=Food Reminder <your-email@gmail.com>
   ```

---

### Option 3: Brevo (formerly Sendinblue)
**Free Tier:** 300 emails/day

✅ **Pros:**
- Good deliverability
- Easy setup
- No credit card required

#### Setup Steps:

1. **Sign up at [https://www.brevo.com/](https://www.brevo.com/)**
   - Create free account

2. **Get SMTP Credentials:**
   - Go to SMTP & API → SMTP
   - Copy credentials

3. **Update .env file:**
   ```env
   EMAIL_SERVICE=smtp
   EMAIL_HOST=smtp-relay.brevo.com
   EMAIL_PORT=587
   EMAIL_USER=your-brevo-email
   EMAIL_PASSWORD=your-smtp-key
   EMAIL_FROM=Food Reminder <noreply@yourdomain.com>
   ```

---

## 🔧 Implementation

We've enhanced the email service to support multiple providers including Resend.

### Environment Variables

Add these to your `.env` file:

```env
# Choose email service: 'resend' or 'smtp'
EMAIL_SERVICE=resend

# For Resend
RESEND_API_KEY=re_your_api_key_here

# For SMTP (Gmail, Brevo, etc.)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-password

# Common (for both)
EMAIL_FROM=Food Reminder <noreply@foodreminder.app>
```

---

## 📊 Comparison

| Service | Free Emails/Day | Free Emails/Month | Setup Difficulty | Deliverability | Card Required |
|---------|----------------|-------------------|------------------|----------------|---------------|
| **Resend** | 100 | 3,000 | ⭐ Easy | ⭐⭐⭐⭐⭐ | ❌ No |
| **Gmail** | ~500* | Unlimited* | ⭐⭐ Medium | ⭐⭐⭐ | ❌ No |
| **Brevo** | 300 | 9,000 | ⭐ Easy | ⭐⭐⭐⭐ | ❌ No |
| SendGrid | ~100 | 3,000 | ⭐⭐ Medium | ⭐⭐⭐⭐⭐ | ✅ Yes |
| Mailgun | ~100 | 3,000 | ⭐⭐ Medium | ⭐⭐⭐⭐ | ✅ Yes |

*Soft limits, not officially specified

---

## 🎯 Recommendation

**For Production:** Use **Resend**
- Best balance of features and ease
- Excellent deliverability
- No credit card needed
- Simple API

**For Quick Testing:** Use **Gmail**
- Immediate setup
- No signup required
- Works with existing email

**For High Volume:** Use **Brevo**
- 300 emails/day is generous
- Professional features

---

## 🧪 Testing

After setup, test your configuration:

1. **Start the server:**
   ```bash
   npm run dev
   ```

2. **Check server logs:**
   ```
   ✓ Email notifications enabled (using Resend)
   # or
   ✓ Email notifications enabled (using SMTP)
   ```

3. **Test from UI:**
   - Login to Food Reminder
   - Go to Profile → Notification Settings
   - Click "Test Notification"

---

## 🔒 Security Tips

1. **Never commit API keys** to version control
2. **Use environment variables** for all sensitive data
3. **Rotate keys regularly** in production
4. **Use different keys** for dev/staging/prod
5. **Monitor usage** to detect unauthorized use

---

## 🆘 Troubleshooting

### Emails not sending with Resend

1. Check API key is correct
2. Verify `EMAIL_FROM` domain matches your verified domain
3. For testing, use `onboarding@resend.dev`
4. Check Resend dashboard for error logs

### Emails not sending with Gmail

1. Ensure 2FA is enabled
2. Use App Password, not regular password
3. Check "Less secure app access" (if applicable)
4. Verify email/password in .env
5. Check Gmail's daily sending limit

### Emails going to spam

1. Verify your domain with the email provider
2. Set up SPF, DKIM, DMARC records
3. Use a dedicated sending domain
4. Avoid spam trigger words in subject/body
5. Ensure unsubscribe link is present

---

## 💡 Tips

- **Start with Resend** for best experience
- **Test with real email addresses** to check deliverability
- **Monitor daily limits** to avoid service disruption
- **Set up proper DNS records** for production
- **Use templates** for consistent branding

---

Happy sending! 🚀
