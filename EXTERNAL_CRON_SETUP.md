# Alternative Cron Solutions for Hourly Notifications

Since Vercel Hobby plan only allows daily cron jobs, here are **FREE alternatives** to run hourly notification checks:

## Option 1: Cron-job.org (Recommended - Free)

**Setup Steps:**

1. Go to [cron-job.org](https://cron-job.org)
2. Create a free account
3. Create a new cron job:
   - **Title**: FoodRemainder Notifications
   - **URL**: `https://foodremainder.vercel.app/api/notifications/check-all?apiKey=YOUR_API_KEY`
   - **Schedule**: Every hour (0 * * * *)
   - **Method**: GET
   - **Headers**: None needed (API key in URL)

4. Save and enable the job

**Pros:**
- ✅ Completely free
- ✅ Reliable service
- ✅ Easy to set up
- ✅ Can run every minute if needed
- ✅ Email notifications on failures

**Cons:**
- ❌ Requires external service
- ❌ Need to manage API key

---

## Option 2: EasyCron (Free Tier)

**Setup Steps:**

1. Go to [easycron.com](https://www.easycron.com)
2. Sign up for free account (80 executions/month on free tier)
3. Create new cron job:
   - **URL**: `https://foodremainder.vercel.app/api/notifications/check-all?apiKey=YOUR_API_KEY`
   - **Cron Expression**: `0 * * * *` (every hour)

**Pros:**
- ✅ Free tier available
- ✅ Simple interface
- ✅ Execution logs

**Cons:**
- ❌ Limited to 80 executions/month (not enough for hourly)
- ❌ Better for daily checks only

---

## Option 3: GitHub Actions (Free for Public Repos)

**Setup Steps:**

1. Create `.github/workflows/notifications.yml` in your repository:

\`\`\`yaml
name: Trigger Notifications

on:
  schedule:
    # Runs every hour
    - cron: '0 * * * *'
  workflow_dispatch: # Allows manual trigger

jobs:
  trigger-notifications:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Notification Check
        run: |
          curl -X GET "https://foodremainder.vercel.app/api/notifications/check-all?apiKey=${{ secrets.NOTIFICATION_API_KEY }}"
\`\`\`

2. Add `NOTIFICATION_API_KEY` to your GitHub repository secrets:
   - Go to Settings → Secrets and variables → Actions
   - Add new secret: `NOTIFICATION_API_KEY`

**Pros:**
- ✅ Completely free for public repos
- ✅ Integrated with your repository
- ✅ Can trigger manually
- ✅ Execution logs in GitHub

**Cons:**
- ❌ Requires public repository
- ❌ Minimum interval is 5 minutes
- ❌ May have slight delays

---

## Option 4: Render Cron Jobs (Free)

**Setup Steps:**

1. Go to [render.com](https://render.com)
2. Create a free account
3. Create a new Cron Job:
   - **Name**: FoodRemainder Notifications
   - **Command**: `curl -X GET "https://foodremainder.vercel.app/api/notifications/check-all?apiKey=YOUR_API_KEY"`
   - **Schedule**: `0 * * * *`

**Pros:**
- ✅ Free tier available
- ✅ Reliable service
- ✅ Good for simple HTTP requests

**Cons:**
- ❌ Requires account creation
- ❌ Free tier has limitations

---

## Option 5: UptimeRobot (Free Monitoring)

**Setup Steps:**

1. Go to [uptimerobot.com](https://uptimerobot.com)
2. Create free account
3. Add new monitor:
   - **Monitor Type**: HTTP(s)
   - **URL**: `https://foodremainder.vercel.app/api/notifications/check-all?apiKey=YOUR_API_KEY`
   - **Monitoring Interval**: 5 minutes (minimum on free tier)

**Pros:**
- ✅ Free tier available
- ✅ Also monitors uptime
- ✅ Email alerts on failures
- ✅ Can check every 5 minutes

**Cons:**
- ❌ Minimum interval is 5 minutes (not exactly hourly)
- ❌ Designed for monitoring, not cron jobs

---

## Recommended Solution

**For Free Tier: Use cron-job.org**

This is the best free option because:
1. No limitations on execution frequency
2. Reliable and established service
3. Easy to set up
4. Provides execution logs
5. Email notifications on failures

**Setup Time**: 5 minutes

---

## Current Configuration (Vercel Daily Cron)

The current setup uses Vercel's built-in cron that runs **once per day at midnight UTC** (`0 0 * * *`).

**How it works:**
- Cron runs once per day
- Checks all users for expiring items
- Users with `notificationsPerDay` set to 24 will still only get 1 notification per day
- Users can manually trigger test notifications anytime

**To get hourly notifications with daily cron:**
Users would need to wait for the next day's check, which isn't ideal for time-sensitive expiry alerts.

---

## Security Note

When using external cron services, always:
1. Use the `NOTIFICATION_API_KEY` parameter
2. Keep your API key secret
3. Monitor the execution logs
4. Set up failure alerts

---

## Next Steps

1. **Choose your preferred option** (I recommend cron-job.org)
2. **Set up the external cron service**
3. **Test the endpoint manually first**
4. **Monitor the first few executions**
5. **Keep Vercel's daily cron as backup**
