# 🚀 Setting Up Automatic Expiry Notifications

## The Problem
Your app is deployed on **Vercel**, which is a **serverless platform**. This means:
- ❌ No long-running processes (like cron jobs)
- ❌ Server code only runs when requests come in
- ❌ The built-in `notificationScheduler` won't work

## The Solution: External Cron Service

Use a **FREE external cron service** to trigger your notification endpoint regularly.

---

## Step-by-Step Setup (5 minutes)

### Step 1: Secure Your Notification Endpoint

1. **Add an API key to your `.env` file** (or Vercel environment variables):
   ```env
   NOTIFICATION_API_KEY=your-super-secret-key-here-12345
   ```
   
   💡 Generate a strong key: Use a password generator or run:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. **Add this to Vercel:**
   - Go to your Vercel project dashboard
   - Settings → Environment Variables
   - Add: `NOTIFICATION_API_KEY` = `your-super-secret-key-here-12345`
   - Redeploy your app

### Step 2: Set Up cron-job.org (FREE)

1. **Sign up at https://cron-job.org** (free account)

2. **Create a new cron job:**
   - Click "Create Cron Job"
   - **Title:** Food Reminder Notifications
   - **URL:** `https://foodreminder.vercel.app/api/notifications/check-all`
   - **Schedule:** Choose one of these:
     - **Option A (Recommended):** Every 3 hours
       - Pattern: `0 */3 * * *`
     - **Option B:** 5 times daily (8 AM, 11 AM, 2 PM, 5 PM, 8 PM IST)
       - Pattern: `0 2,5,8,11,14 * * *` (adjusted for UTC, IST is UTC+5:30)
     - **Option C:** Every hour
       - Pattern: `0 * * * *`

3. **Add Authentication Header:**
   - Click "Headers" tab
   - Add header:
     - **Name:** `x-api-key`
     - **Value:** `your-super-secret-key-here-12345` (same as your env variable)

4. **Enable the job** and save

### Step 3: Verify It's Working

1. **Test manually first:**
   ```bash
   curl -X POST https://foodreminder.vercel.app/api/notifications/check-all \
     -H "x-api-key: your-super-secret-key-here-12345"
   ```

2. **Check the response:**
   ```json
   {
     "message": "Notification check completed",
     "notificationsSent": 2,
     "results": [...],
     "timestamp": "2026-01-06T..."
   }
   ```

3. **Monitor cron-job.org:**
   - Go to your cron job dashboard
   - Check "Execution History"
   - Should show successful runs (HTTP 200)

---

## Alternative: Other Free Cron Services

### Option 1: EasyCron (https://www.easycron.com)
- Free tier: 1 cron job
- Setup similar to cron-job.org

### Option 2: cron-job.com (https://console.cron-job.com)
- Free tier: Unlimited jobs
- Setup similar to cron-job.org

### Option 3: GitHub Actions (if your repo is on GitHub)

Create `.github/workflows/notifications.yml`:

```yaml
name: Send Notifications

on:
  schedule:
    # Runs at 2:30, 5:30, 8:30, 11:30, 14:30 UTC (8 AM, 11 AM, 2 PM, 5 PM, 8 PM IST)
    - cron: '30 2,5,8,11,14 * * *'
  workflow_dispatch: # Allows manual trigger

jobs:
  notify:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Notification Check
        run: |
          curl -X POST https://foodreminder.vercel.app/api/notifications/check-all \
            -H "x-api-key: ${{ secrets.NOTIFICATION_API_KEY }}"
```

Then add `NOTIFICATION_API_KEY` to your GitHub repository secrets.

---

## For Local Development/Testing

If you want to run the server locally with automatic scheduling:

1. **Update your `.env`:**
   ```env
   NOTIFICATION_AUTO_SCHEDULE=true
   NOTIFICATION_SCHEDULE_TEST=true  # Runs every 5 minutes
   TIMEZONE=Asia/Kolkata
   ```

2. **Start the server:**
   ```bash
   npm run dev
   ```

3. **Watch the logs:**
   ```
   ✓ Notification scheduler started
   ⏰ Scheduled notification check triggered at...
   ```

---

## Deployment Checklist

- [ ] Add `NOTIFICATION_API_KEY` to Vercel environment variables
- [ ] Set up cron-job.org (or alternative)
- [ ] Configure cron schedule (recommended: every 3 hours)
- [ ] Add authentication header with API key
- [ ] Test the endpoint manually
- [ ] Verify cron job runs successfully
- [ ] Check execution history after 24 hours

---

## Troubleshooting

### Cron job fails (HTTP 401)
- ✅ Check that `x-api-key` header matches your `NOTIFICATION_API_KEY`
- ✅ Verify environment variable is set in Vercel

### Cron job succeeds but no notifications sent
- ✅ Check if users have expiring items
- ✅ Verify notification channels are enabled in user settings
- ✅ Check Vercel function logs for errors
- ✅ Ensure notification services (Email, Telegram, etc.) are configured

### How to view Vercel logs
1. Go to Vercel dashboard
2. Select your project
3. Click "Functions" tab
4. Click on a function execution to see logs

### Test endpoint without API key (for debugging)
Temporarily remove API key check by commenting out lines 664-668 in `server/routes.ts`, then redeploy.

---

## Recommended Schedule

For best user experience:

- **Frequent items (milk, vegetables):** Every 3 hours
- **Regular items:** 5 times daily (8 AM, 11 AM, 2 PM, 5 PM, 8 PM)
- **Less urgent:** Twice daily (9 AM, 6 PM)

Users can control their notification frequency in their profile settings.

---

## Cost Comparison

| Service | Free Tier | Paid (if needed) |
|---------|-----------|------------------|
| cron-job.org | Unlimited jobs | $4.95/month for premium features |
| EasyCron | 1 job | $0.99/month for 20 jobs |
| GitHub Actions | 2,000 minutes/month | Free for public repos |
| Vercel Cron | ❌ Requires Pro | $20/month |

**Recommendation:** Use cron-job.org (free, unlimited)

---

## Next Steps

1. ✅ Set up external cron service (5 minutes)
2. ✅ Test the endpoint
3. ✅ Monitor for 24 hours
4. ✅ Adjust schedule based on user feedback

Your notifications will now be sent regularly! 🎉
