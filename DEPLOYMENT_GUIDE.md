# Deployment Guide - Food Reminder App

This guide explains how to deploy the Food Reminder app with **Frontend on Vercel** and **Backend on Render**.

## 🌐 Architecture

- **Frontend**: Vercel (React + Vite)
- **Backend**: Render (Node.js + Express)
- **Database**: Firebase Firestore

---

## 📋 Prerequisites

1. GitHub account with your code repository
2. Vercel account (https://vercel.com)
3. Render account (https://render.com)
4. All environment variables from your `.env` file

---

## 🚀 Part 1: Deploy Backend to Render

### Step 1: Create New Web Service

1. Go to https://render.com/dashboard
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository: `Madhu097/foodremainder`
4. Configure:
   - **Name**: `foodremainder-api`
   - **Environment**: `Node`
   - **Branch**: `main`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free

### Step 2: Add Environment Variables

In Render dashboard, go to **Environment** and add these variables:

#### Firebase Configuration
```
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour-private-key-here\n-----END PRIVATE KEY-----\n"
```

⚠️ **Important**: 
- Keep the quotes and newlines in `FIREBASE_PRIVATE_KEY`
- Copy values from your `.env` file

#### Email Configuration (Resend)
```
EMAIL_SERVICE=resend
RESEND_API_KEY=your_resend_api_key_here
EMAIL_FROM=Food Reminder <onboarding@resend.dev>
```

⚠️ **Get your Resend API key from your `.env` file**

#### WhatsApp Configuration (Twilio)
```
TWILIO_ACCOUNT_SID=your_twilio_account_sid_here
TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
```

⚠️ **Get your credentials from your `.env` file**

#### Telegram Configuration
```
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
```

⚠️ **Get your Telegram bot token from your `.env` file**

#### Notification Scheduler
```
NOTIFICATION_TIMES_PER_DAY=4
```

#### Application Settings
```
PORT=5000
NODE_ENV=production
APP_URL=https://foodremainder.vercel.app
```

### Step 3: Deploy

1. Click **"Create Web Service"**
2. Wait for deployment to complete (5-10 minutes)
3. Your backend URL will be: `https://foodremainder-api.onrender.com`

---

## 🎨 Part 2: Deploy Frontend to Vercel

### Step 1: Create New Project

1. Go to https://vercel.com/dashboard
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository: `Madhu097/foodremainder`
4. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist/public`

### Step 2: Add Environment Variable

In Vercel project settings → **Environment Variables**, add:

```
VITE_API_URL=https://foodremainder-api.onrender.com
```

⚠️ **Important**: Replace with your actual Render backend URL

### Step 3: Deploy

1. Click **"Deploy"**
2. Wait for deployment (2-3 minutes)
3. Your frontend URL will be: `https://foodremainder.vercel.app`

---

## ✅ Verification Checklist

### Backend Verification

Visit: `https://foodremainder-api.onrender.com/api/health`

You should see:
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

✅ All services should show `true`

### Frontend Verification

1. Visit your Vercel URL
2. Open browser console (F12)
3. Look for: `[API Config] Final API_BASE_URL: https://foodremainder-api.onrender.com`
4. Test login/registration
5. Test notifications

---

## 🔧 Troubleshooting

### Issue: "Service not configured" errors

**Problem**: Environment variables not set correctly on Render

**Solution**:
1. Go to Render dashboard → Your service → Environment
2. Verify all variables are present
3. Check for typos in variable names
4. Ensure `FIREBASE_PRIVATE_KEY` has proper quotes and newlines
5. Click **"Manual Deploy"** → **"Clear build cache & deploy"**

### Issue: CORS errors

**Problem**: Frontend can't connect to backend

**Solution**:
1. Verify `VITE_API_URL` in Vercel matches your Render URL
2. Check backend is running: visit `/api/health` endpoint
3. Redeploy Vercel with correct environment variable

### Issue: Notifications not sending

**Problem**: API keys not working in production

**Solution**:
1. Verify Resend API key is valid
2. Check Twilio credentials in Render environment
3. Ensure Telegram bot token is correct
4. Test each service via `/api/health` endpoint

---

## 📱 WhatsApp Sandbox Setup

After deployment, users need to join your Twilio WhatsApp Sandbox:

1. Save contact: `+1 (415) 523-8886`
2. Send message: `join <your-sandbox-code>`
3. Get code from: https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn

---

## 🔄 Updating the App

### Update Backend
1. Push changes to GitHub
2. Render will auto-deploy (if enabled)
3. Or click **"Manual Deploy"** in Render dashboard

### Update Frontend
1. Push changes to GitHub
2. Vercel will auto-deploy
3. Or trigger redeploy in Vercel dashboard

---

## 💰 Cost Breakdown

| Service | Plan | Cost |
|---------|------|------|
| Vercel | Hobby | **FREE** |
| Render | Free | **FREE** (sleeps after 15min inactivity) |
| Firebase Firestore | Spark | **FREE** (up to 50K reads/day) |
| Resend | Free | **FREE** (100 emails/day) |
| Twilio Sandbox | Free | **FREE** (sandbox only) |
| Telegram | Free | **FREE** |

**Total**: **$0/month** 🎉

---

## 🚨 Important Notes

1. **Render Free Tier**: Backend sleeps after 15 minutes of inactivity
   - First request after sleep takes ~30 seconds
   - Consider upgrading to paid plan ($7/month) for always-on

2. **Security**: Never commit `.env` file to GitHub
   - Use Render and Vercel dashboards for environment variables
   - Keep API keys secret

3. **Firebase Private Key**: Must include quotes and newlines
   ```
   "-----BEGIN PRIVATE KEY-----\nMIIEvQ...\n-----END PRIVATE KEY-----\n"
   ```

4. **CORS**: Backend automatically allows your Vercel domain

---

## 📞 Support

If you encounter issues:

1. Check Render logs: Dashboard → Your service → Logs
2. Check Vercel logs: Dashboard → Your project → Deployments → View logs
3. Check browser console for frontend errors
4. Verify `/api/health` endpoint shows all services as `true`

---

## 🎯 Quick Deploy Commands

If using Render CLI:
```bash
# Install Render CLI
npm install -g @render/cli

# Login to Render
render login

# Deploy
render deploy
```

If manual deploy needed:
1. Render: Click "Manual Deploy" → "Clear build cache & deploy"
2. Vercel: Click "Redeploy"

---

**Deployment Complete!** 🎉

Your app is now live:
- Frontend: `https://foodremainder.vercel.app`
- Backend: `https://foodremainder-api.onrender.com`
