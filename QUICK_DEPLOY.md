# 🚀 Quick Deployment Instructions

## Problem: WhatsApp & Telegram Not Working on Vercel

**Root Cause**: Vercel only hosts the frontend. The backend (with WhatsApp/Telegram services) needs to be deployed separately to Render.

---

## ✅ Solution: Deploy Backend to Render

### Step 1: Go to Render
Visit: https://render.com/dashboard

### Step 2: Create Web Service
1. Click **"New +"** → **"Web Service"**
2. Connect GitHub: `Madhu097/foodremainder`
3. Settings:
   - **Name**: `foodremainder-api`
   - **Environment**: Node
   - **Build**: `npm install && npm run build`
   - **Start**: `npm start`
   - **Plan**: Free

### Step 3: Add Environment Variables

Click **"Environment"** tab and add ALL these variables from your `.env` file:

```bash
# Copy from your .env file:
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
PORT
NODE_ENV
APP_URL
```

⚠️ **Important**: Copy the EXACT values from your `.env` file

### Step 4: Deploy Backend
Click **"Create Web Service"** and wait 5-10 minutes

Your backend URL will be: `https://foodremainder-api.onrender.com`

### Step 5: Update Vercel
1. Go to Vercel dashboard
2. Open your project settings
3. Go to **Environment Variables**
4. Add or update:
   ```
   VITE_API_URL=https://foodremainder-api.onrender.com
   ```
5. Redeploy your frontend

---

## 🧪 Test Your Deployment

### Test Backend
Visit: `https://foodremainder-api.onrender.com/api/health`

Should show:
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

✅ All should be `true`

### Test Frontend
1. Visit your Vercel URL
2. Press F12 (open console)
3. Should see: `[API Config] Final API_BASE_URL: https://foodremainder-api.onrender.com`
4. Try login and notifications

---

## 📝 Checklist

- [ ] Backend deployed to Render
- [ ] All environment variables added to Render
- [ ] Backend `/api/health` shows all services as `true`
- [ ] `VITE_API_URL` updated in Vercel
- [ ] Frontend redeployed in Vercel
- [ ] Tested login and registration
- [ ] Tested notifications

---

## 🆘 Still Having Issues?

### WhatsApp shows "Service not configured"
→ Check Render environment variables have `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM`

### Telegram shows "Service not configured"
→ Check Render has `TELEGRAM_BOT_TOKEN`

### Frontend can't connect to backend
→ Verify `VITE_API_URL` in Vercel matches your Render URL

### Backend `/api/health` shows service as `false`
→ Check the specific service's environment variables in Render

---

## 💰 Cost
**FREE** - Both Render (free tier) and Vercel (hobby plan) are completely free!

⚠️ Note: Render free tier sleeps after 15 minutes of inactivity. First request takes ~30 seconds to wake up.

---

For detailed instructions, see: `DEPLOYMENT_GUIDE.md`
