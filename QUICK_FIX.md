# ⚡ Quick Fix: Enable Automatic Notifications

## Problem
Notifications not being sent regularly because Vercel is serverless (no background processes).

## Solution (5 minutes)

### 1. Add API Key to Vercel
```
Settings → Environment Variables → Add:
NOTIFICATION_API_KEY = your-secret-key-123
```

### 2. Set Up Free Cron Job
1. Go to **https://cron-job.org** (sign up free)
2. Create new cron job:
   - **URL:** `https://foodreminder.vercel.app/api/notifications/check-all`
   - **Schedule:** `0 */3 * * *` (every 3 hours)
   - **Header:** `x-api-key: your-secret-key-123`
3. Enable and save

### 3. Test It
```bash
curl -X POST https://foodreminder.vercel.app/api/notifications/check-all \
  -H "x-api-key: your-secret-key-123"
```

## Done! ✅
Notifications will now be sent every 3 hours automatically.

---

**Full guide:** See `SETUP_AUTOMATIC_NOTIFICATIONS.md`
