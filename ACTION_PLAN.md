# 🎯 ACTION PLAN - Fix Expiry Notifications

## ⚡ IMMEDIATE ACTION REQUIRED (5 minutes)

Your notifications are **NOT being sent automatically** because Vercel is serverless.

---

## 🚀 Quick Fix Steps

### Step 1: Add API Key to Vercel (2 minutes)

1. **Generate a secure API key:**
   ```bash
   # Run this command to generate a random key:
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   
   Or use any strong password (20+ characters)

2. **Add to Vercel:**
   - Go to: https://vercel.com/dashboard
   - Select your project: `foodreminder`
   - Click: **Settings** → **Environment Variables**
   - Add new variable:
     - **Name:** `NOTIFICATION_API_KEY`
     - **Value:** `[paste your generated key]`
   - Click **Save**

3. **Redeploy:**
   - Go to **Deployments** tab
   - Click **...** on latest deployment
   - Click **Redeploy**
   - Wait for deployment to complete (~2 minutes)

---

### Step 2: Set Up cron-job.org (2 minutes)

1. **Sign up:**
   - Go to: https://cron-job.org/en/signup/
   - Create free account (no credit card needed)
   - Verify email

2. **Create cron job:**
   - Click **"Create cronjob"** button
   - Fill in:
     - **Title:** `Food Reminder Notifications`
     - **Address (URL):** `https://foodreminder.vercel.app/api/notifications/check-all`
     - **Schedule:**
       - Pattern: `0 */3 * * *` (every 3 hours)
       - OR use the visual editor: Every 3 hours
   
3. **Add authentication:**
   - Click **"Request"** tab
   - Click **"Headers"** section
   - Click **"Add header"**
   - Add:
     - **Name:** `x-api-key`
     - **Value:** `[paste your API key from Step 1]`

4. **Enable and save:**
   - Toggle **"Enabled"** to ON
   - Click **"Create cronjob"**

---

### Step 3: Test It (1 minute)

**Option A: Test via cron-job.org**
- In your cron job, click **"Run now"**
- Check **"Execution history"** tab
- Should show: ✅ HTTP 200 (Success)

**Option B: Test via command line**
```bash
# Replace YOUR_API_KEY with your actual key
curl -X POST https://foodreminder.vercel.app/api/notifications/check-all \
  -H "x-api-key: YOUR_API_KEY"
```

**Expected response:**
```json
{
  "message": "Notification check completed",
  "notificationsSent": 2,
  "results": [...],
  "timestamp": "2026-01-06T..."
}
```

---

## ✅ Verification Checklist

After setup, verify these:

- [ ] API key added to Vercel environment variables
- [ ] Vercel app redeployed successfully
- [ ] cron-job.org account created
- [ ] Cron job created with correct URL
- [ ] API key header added to cron job
- [ ] Cron job enabled
- [ ] Manual test run successful (HTTP 200)
- [ ] Response shows notification check completed

---

## 📊 Monitor for 24 Hours

### What to check:

1. **cron-job.org Dashboard**
   - Go to: https://cron-job.org/en/members/jobs/
   - Check **"Execution history"**
   - Should show successful runs every 3 hours
   - All should be HTTP 200

2. **Vercel Function Logs**
   - Go to: https://vercel.com/dashboard
   - Select project → **Functions** tab
   - Look for `/api/notifications/check-all` executions
   - Check for errors

3. **User Feedback**
   - Ask users if they're receiving notifications
   - Check your own test account

---

## 🎯 Expected Behavior

Once set up correctly:

- ✅ Cron job runs **every 3 hours** (8 times per day)
- ✅ Each run checks **all users** for expiring items
- ✅ Users receive notifications via **enabled channels**:
  - Email (if enabled)
  - WhatsApp (if enabled)
  - Telegram (if enabled)
  - Browser Push (if enabled)
- ✅ Respects user preferences:
  - Notification days threshold (e.g., 3 days before expiry)
  - Notification frequency (e.g., max 4 times per day)
  - Quiet hours (if set)

---

## 🔧 Troubleshooting

### Issue: Cron job fails with HTTP 401
**Solution:** API key mismatch
- Check that `x-api-key` header in cron-job.org matches `NOTIFICATION_API_KEY` in Vercel
- Ensure no extra spaces in the key
- Redeploy Vercel after adding environment variable

### Issue: Cron job succeeds but no notifications sent
**Check:**
1. Do users have expiring items?
   - Items must expire within notification threshold (default: 3 days)
2. Are notification channels enabled?
   - Check user profile → Notification Settings
3. Are notification services configured?
   - Email: Check `RESEND_API_KEY` or `EMAIL_*` variables
   - Telegram: Check `TELEGRAM_BOT_TOKEN`
   - WhatsApp: Check `TWILIO_*` variables
4. Check Vercel function logs for errors

### Issue: Can't find Vercel function logs
**Steps:**
1. Go to Vercel dashboard
2. Select your project
3. Click **"Functions"** tab
4. Click on any function execution to see logs
5. Look for errors or warnings

---

## 📝 Quick Reference

### Cron Schedule Options

| Schedule | Cron Expression | Description |
|----------|----------------|-------------|
| Every 3 hours | `0 */3 * * *` | **Recommended** - 8 times/day |
| Every hour | `0 * * * *` | 24 times/day - Very responsive |
| 5x daily | `0 2,5,8,11,14 * * *` | 8 AM, 11 AM, 2 PM, 5 PM, 8 PM IST |
| Twice daily | `0 1,13 * * *` | 6:30 AM, 6:30 PM IST |

### Important URLs

- **Your API endpoint:** `https://foodreminder.vercel.app/api/notifications/check-all`
- **cron-job.org:** https://cron-job.org
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Test endpoint:** Use curl command above

---

## 📚 Documentation

For more details, see:

- **[QUICK_FIX.md](./QUICK_FIX.md)** - Quick reference card
- **[SETUP_AUTOMATIC_NOTIFICATIONS.md](./SETUP_AUTOMATIC_NOTIFICATIONS.md)** - Complete guide
- **[SUMMARY.md](./SUMMARY.md)** - Full explanation
- **[README.md](./README.md)** - Updated with warnings

---

## 🎉 Success!

Once completed, your users will receive automatic notifications about expiring food items!

**No more manual testing needed!** 🚀

---

## 💡 Pro Tips

1. **Start with 3-hour schedule** - Good balance of timeliness and API usage
2. **Monitor for first 24 hours** - Ensure everything works smoothly
3. **Adjust schedule if needed** - Based on user feedback
4. **Keep API key secure** - Don't commit to Git or share publicly
5. **Set up alerts** - cron-job.org can email you if a job fails

---

**Need help?** Check the troubleshooting section above or review the detailed guides.
