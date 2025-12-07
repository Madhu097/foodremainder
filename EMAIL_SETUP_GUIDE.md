# 📧 Email Service Setup - Quick Guide

## Current Issue
You're seeing "Email service not configured on server" because there are no email credentials in your `.env` file.

---

## ✅ Solution: Configure Email Service

### **Option 1: Resend (Recommended - FREE)** ⭐

**Why Resend?**
- ✅ 100 free emails per day
- ✅ No credit card required
- ✅ Easiest setup
- ✅ Professional delivery

**Setup Steps:**

1. **Go to [https://resend.com](https://resend.com)**

2. **Sign up for free account**

3. **Get API Key**:
   - Go to Dashboard
   - Click "API Keys"
   - Click "Create API Key"
   - Copy the key (starts with `re_`)

4. **Add to `.env` file**:
   Open your `.env` file and add these lines:
   ```env
   EMAIL_SERVICE=resend
   RESEND_API_KEY=re_your_actual_api_key_here
   EMAIL_FROM=Food Reminder <noreply@yourdomain.com>
   ```

   Replace `re_your_actual_api_key_here` with your actual API key.

5. **Restart server**:
   ```bash
   npm run dev
   ```

6. **Verify**:
   - Server logs should show: `✓ Email notifications enabled (using Resend)`
   - No more "Email service not configured" warnings

---

### **Option 2: Gmail SMTP (Free Alternative)**

If you prefer to use Gmail:

**Setup Steps:**

1. **Enable 2-Step Verification** on your Google Account:
   - Go to https://myaccount.google.com/security
   - Enable "2-Step Verification"

2. **Create App Password**:
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Name it "Food Reminder"
   - Click "Generate"
   - **Copy the 16-character password** (no spaces)

3. **Add to `.env` file**:
   ```env
   EMAIL_SERVICE=smtp
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-16-char-app-password-here
   EMAIL_FROM=Food Reminder <your-email@gmail.com>
   ```

   Replace:
   - `your-email@gmail.com` with your actual Gmail address
   - `your-16-char-app-password-here` with the app password you generated

4. **Restart server**:
   ```bash
   npm run dev
   ```

5. **Verify**:
   - Server logs should show: `✓ Email notifications enabled (using SMTP)`

---

## 🎯 Complete `.env` Example

Here's what your `.env` file should look like with Resend configured:

```env
# ===== FIREBASE CONFIGURATION =====
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com

# ===== EMAIL CONFIGURATION =====
EMAIL_SERVICE=resend
RESEND_API_KEY=re_123abc456def789ghi
EMAIL_FROM=Food Reminder <noreply@foodreminder.app>

# ===== TELEGRAM CONFIGURATION =====
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz

# ===== NOTIFICATION SCHEDULER =====
NOTIFICATION_TIMES_PER_DAY=1
TIMEZONE=Asia/Kolkata

# ===== PUSH NOTIFICATIONS =====
VAPID_PUBLIC_KEY=BCNorKQy5pNRp7fXg1xrTCmvgvk_maqEP_AOoxAevfKYH3rqZnL9Jyb6WjkdyS-tBx1vPDDgOtbpNDx6laCWw_o
VAPID_PRIVATE_KEY=M14f0sqJjV99upZc1aJahq7ULa5AWPsHibyUmMVXuoY
VAPID_EMAIL=mailto:admin@foodremainder.com

# ===== APPLICATION CONFIGURATION =====
APP_URL=http://localhost:5000
PORT=5000
NODE_ENV=development
```

---

## ⚡ Quick Test

After configuring email:

1. **Restart your server**
2. **Check server logs** for:
   ```
   ✓ Email notifications enabled (using Resend)
   ```
   OR
   ```
   ✓ Email notifications enabled (using SMTP)
   ```

3. **Test in app**:
   - Go to Profile → Notification Settings
   - Enable "Email Notifications"
   - Click "Test Notification"
   - Check your email!

---

## 🔍 Troubleshooting

### If you see "Email service not configured":
- Check that `.env` file has EMAIL_SERVICE set
- Check API key/password is correct
- Restart server after changing `.env`

### If emails don't arrive:
- **Check spam folder**
- **Verify API key is correct**
- **Check server logs for errors**
- For Gmail: Verify app password (not regular password)

### If using Resend and still not working:
- Verify API key starts with `re_`
- Check Resend dashboard for delivery logs
- Ensure you haven't exceeded free tier (100/day)

---

## 📋 Step-by-Step Checklist

- [ ] Choose email service (Resend or Gmail)
- [ ] Get API key / App password
- [ ] Open `.env` file in your project root
- [ ] Add email configuration lines
- [ ] Save `.env` file
- [ ] Restart server (`npm run dev`)
- [ ] Check server logs for success message
- [ ] Test notification from Profile settings
- [ ] Check email inbox (and spam)

---

## 🎉 Success Indicators

When email is working correctly:

✅ Server logs show: `✓ Email notifications enabled`  
✅ No warnings about email service  
✅ Test notification arrives in inbox  
✅ Notification settings page shows email toggle  

---

## 🆘 Still Having Issues?

If email still doesn't work after following this guide:

1. **Share server logs** (the lines when server starts)
2. **Check which option you used** (Resend or Gmail)
3. **Verify credentials are correct**
4. **Try the other option** if one doesn't work

---

**Recommended**: Start with Resend - it's the easiest and most reliable option!

Happy notifying! 📧✨
