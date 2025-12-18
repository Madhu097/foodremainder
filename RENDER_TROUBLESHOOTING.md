# 🔧 Render Deployment - Troubleshooting Guide

## Issue: Telegram 401 Unauthorized Errors

### Problem
Logs show continuous `[TelegramService] Polling error: ETELEGRAM: 401 Unauthorized`

### Root Cause
The `TELEGRAM_BOT_TOKEN` environment variable in Render is either:
- ❌ Not set
- ❌ Has extra spaces or quotes
- ❌ Is an old/revoked token
- ❌ Copied incorrectly from `.env` file

### ✅ Solution

#### Step 1: Get Correct Token from Local `.env`

1. Open your local `.env` file
2. Find the line: `TELEGRAM_BOT_TOKEN=8545367968:AAGQf...`
3. Copy **ONLY** the token part (after the `=`)
4. ⚠️ **Important**: Don't copy any quotes, spaces, or extra characters

#### Step 2: Update Render Environment Variable

1. Go to Render dashboard → Your service
2. Click **"Environment"** tab
3. Find `TELEGRAM_BOT_TOKEN`
4. Click **"Edit"**
5. Paste the token (no quotes, no spaces)
6. Click **"Save Changes"**

#### Step 3: Redeploy

1. Click **"Manual Deploy"** → **"Deploy latest commit"**
2. Wait for deployment to complete
3. Check logs - 401 errors should be gone

### ✅ Verify Fix

After redeployment, logs should show:
```
[TelegramService] ✅ Bot token verified: @FoodRemainderbot
[TelegramService] ✅ Started polling for updates
```

---

## Issue: Service Shows as "false" in `/api/health`

### Check WhatsApp

If `"whatsapp": false` in health check:

**Problem**: Missing Twilio credentials

**Fix**:
1. Check Render environment has all three:
   - `TWILIO_ACCOUNT_SID`
   - `TWILIO_AUTH_TOKEN`
   - `TWILIO_WHATSAPP_FROM`
2. Copy exact values from your `.env` file
3. Save and redeploy

### Check Email

If `"email": false` in health check:

**Problem**: Missing Resend API key

**Fix**:
1. Check Render environment has:
   - `EMAIL_SERVICE=resend`
   - `RESEND_API_KEY`
   - `EMAIL_FROM`
2. Copy exact values from your `.env` file
3. Save and redeploy

### Check Telegram

If `"telegram": false` in health check:

**Problem**: Invalid bot token (see above) or token validation failed

**Fix**: Follow "Telegram 401 Unauthorized" solution above

---

## Issue: Frontend Can't Connect to Backend

### Symptoms
- Login/registration fails
- Console shows network errors
- CORS errors

### ✅ Solution

#### Step 1: Get Your Render Backend URL

1. Go to Render dashboard
2. Copy your service URL: `https://foodremainder-api.onrender.com`

#### Step 2: Update Vercel Environment Variable

1. Go to Vercel dashboard → Your project
2. Settings → **Environment Variables**
3. Find or add: `VITE_API_URL`
4. Set value to your Render URL (no trailing slash)
5. Apply to: **Production, Preview, Development**
6. Save

#### Step 3: Redeploy Frontend

1. Go to Vercel **Deployments** tab
2. Click **"Redeploy"** on latest deployment
3. Wait for completion

---

## Issue: Firebase Errors

### Symptoms
```
[Firebase] ❌ Failed to connect to Firestore
Error: Invalid service account
```

### ✅ Solution

The `FIREBASE_PRIVATE_KEY` needs special formatting in Render.

#### Error in Logs:
```
error:1E08010C:DECODER routines::unsupported
Getting metadata from plugin failed
```

This means the private key is malformed.

#### Correct Format in Render:

**Option 1: Copy from `.env` file (Recommended)**

1. Open your local `.env` file
2. Find the line starting with `FIREBASE_PRIVATE_KEY=`
3. Copy the ENTIRE value after the `=` (including quotes)
4. Example: `"-----BEGIN PRIVATE KEY-----\nMIIEvQI...\n-----END PRIVATE KEY-----\n"`
5. Paste into Render environment variable
6. ⚠️ **Keep the quotes and `\n` characters exactly as they are**

**Option 2: Manual entry**

In Render, enter the value exactly like this (single line):
```
"-----BEGIN PRIVATE KEY-----\nYourKeyContentHere\n-----END PRIVATE KEY-----\n"
```

⚠️ **Critical Rules**:
- ✅ **Include** the double quotes at start and end
- ✅ **Use** `\n` (backslash-n, not actual Enter key)
- ✅ **Single line** - don't press Enter
- ❌ **Don't** use actual newlines/line breaks
- ❌ **Don't** remove the quotes

#### Step-by-Step Fix:

1. **Go to Render**: Dashboard → Your service → Environment
2. **Find**: `FIREBASE_PRIVATE_KEY` variable
3. **Delete** current value
4. **Open** your local `.env` file
5. **Copy** the entire value from `FIREBASE_PRIVATE_KEY=` line (with quotes)
6. **Paste** into Render
7. **Verify**: Should look like `"-----BEGIN PRIVATE KEY-----\nMIIE...`
8. **Save Changes**
9. **Manual Deploy** → Deploy latest commit
10. **Check logs** - should see `✅ Connected to Firebase Firestore`

---

## Issue: Render Service Won't Build

### Symptoms
```
Error: Cannot find module 'tsx'
```

### ✅ Solution

**Build Command** in Render must be:
```
npm install && npm run build
```

**Start Command** must be:
```
npm start
```

If using different commands, update in Render **Settings** → **Build & Deploy**

---

## Issue: Environment Variables Not Working

### ✅ Checklist

For each variable, verify:

- [ ] Variable name is EXACTLY correct (case-sensitive)
- [ ] No extra spaces before or after value
- [ ] No quotes around simple values (only for FIREBASE_PRIVATE_KEY)
- [ ] All required variables are present:
  - [ ] `FIREBASE_PROJECT_ID`
  - [ ] `FIREBASE_CLIENT_EMAIL`
  - [ ] `FIREBASE_PRIVATE_KEY`
  - [ ] `EMAIL_SERVICE`
  - [ ] `RESEND_API_KEY`
  - [ ] `EMAIL_FROM`
  - [ ] `TWILIO_ACCOUNT_SID`
  - [ ] `TWILIO_AUTH_TOKEN`
  - [ ] `TWILIO_WHATSAPP_FROM`
  - [ ] `TELEGRAM_BOT_TOKEN`
  - [ ] `NOTIFICATION_TIMES_PER_DAY`
  - [ ] `PORT`
  - [ ] `NODE_ENV`
  - [ ] `APP_URL`

---

## Issue: Render Free Tier Sleeping

### Symptoms
- First request takes 30+ seconds
- Service shows as "inactive"

### This is Normal!
Render free tier sleeps after 15 minutes of inactivity.

### Solutions:

#### Option 1: Accept It (Free)
- First request wakes the service (~30s)
- Subsequent requests are fast
- Cost: **$0**

#### Option 2: Keep Alive Service (Free)
Use a cron job to ping your service every 10 minutes:
- Use cron-job.org
- Ping: `https://your-service.onrender.com/api/health`
- Schedule: Every 10 minutes
- Cost: **$0**

#### Option 3: Upgrade to Paid (Always On)
- Upgrade to Starter plan ($7/month)
- Service never sleeps
- Cost: **$7/month**

---

## 🧪 Complete Verification

After fixing issues, verify everything:

### 1. Backend Health Check
Visit: `https://your-service.onrender.com/api/health`

Should return:
```json
{
  "status": "ok",
  "services": {
    "email": true,
    "whatsapp": true,
    "telegram": true,
    "push": true
  }
}
```

✅ All services should be `true`

### 2. Check Logs
In Render dashboard → **Logs**

Should see:
```
[EmailService] ✅ Email service initialized with Resend
[WhatsAppService] ✅ WhatsApp service initialized successfully
[TelegramService] ✅ Bot token verified: @FoodRemainderbot
[TelegramService] ✅ Started polling for updates
[PushService] ✅ Push notification service initialized
[Firebase] ✅ Connected to Firebase Firestore
```

✅ No errors or warnings

### 3. Test Frontend
1. Visit your Vercel URL
2. Open browser console (F12)
3. Should see: `[API Config] Final API_BASE_URL: https://your-service.onrender.com`
4. Try registering a new account
5. Try adding a food item
6. Test notifications

---

## 🆘 Still Having Issues?

### Get Detailed Logs

1. Go to Render dashboard → Your service
2. Click **"Logs"** tab
3. Look for errors (red text)
4. Copy the error message

### Common Error Patterns

| Error Message | Solution |
|---------------|----------|
| `401 Unauthorized` | Invalid API key/token - check environment variables |
| `404 Not Found` | Wrong URL in Vercel `VITE_API_URL` |
| `CORS error` | Backend not running or wrong URL |
| `Cannot find module` | Build command incorrect |
| `Firebase invalid credentials` | Check `FIREBASE_PRIVATE_KEY` formatting |
| `ETELEGRAM` | Invalid `TELEGRAM_BOT_TOKEN` |

---

## 📞 Quick Reference

### Render Service URLs
- **Dashboard**: https://dashboard.render.com
- **Your API**: https://foodremainder-api.onrender.com
- **Health Check**: https://foodremainder-api.onrender.com/api/health

### Required Environment Variables (14 total)
```
FIREBASE_PROJECT_ID
FIREBASE_CLIENT_EMAIL
FIREBASE_PRIVATE_KEY
EMAIL_SERVICE
RESEND_API_KEY
EMAIL_FROM
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_WHATSAPP_FROM
TELEGRAM_BOT_TOKEN
NOTIFICATION_TIMES_PER_DAY
PORT=5000
NODE_ENV=production
APP_URL=https://your-app.vercel.app
```

### Build Configuration
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Environment**: Node

---

✅ **Deployment Complete!** All services should now be working correctly.
