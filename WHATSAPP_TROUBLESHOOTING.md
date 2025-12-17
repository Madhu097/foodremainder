# WhatsApp Notification Troubleshooting

## Setup Verification Checklist

### 1. Check Environment Variables

Make sure you have **ONE** of these configured in your `.env` file:

#### Option A: FREE Meta WhatsApp Cloud API (Recommended)
```env
WHATSAPP_CLOUD_ACCESS_TOKEN=your_access_token_here
WHATSAPP_CLOUD_PHONE_NUMBER_ID=your_phone_number_id_here
```

#### Option B: Paid Twilio WhatsApp
```env
TWILIO_ACCOUNT_SID=AC1234567890abcdef
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
```

### 2. Verify Server Startup

When you start the server, you should see ONE of these messages:

✅ **For Free Cloud API:**
```
[WhatsAppCloud] ✅ Free WhatsApp Cloud API initialized
[WhatsAppCloud] 📱 Phone Number ID: 1234567890...
✓ WhatsApp notifications enabled (FREE Cloud API)
```

✅ **For Twilio:**
```
✓ WhatsApp notifications enabled
```

❌ **If not configured:**
```
[WhatsAppCloud] 💡 Free WhatsApp Cloud API not configured
```

### 3. Check Frontend UI

1. Go to **Profile** → **Notification Settings**
2. Look for **WhatsApp Notifications** section
3. You should see one of:
   - ✅ **"✓ FREE Cloud API"** (if Meta Cloud API is configured)
   - ✅ **"✓ Configured"** (if Twilio is configured)
   - ⚠️ **"⚙️ Setup required"** (if neither is configured)

4. The WhatsApp toggle should be **enabled** (not grayed out)

### 4. Test the Connection

#### Method 1: Use Test Button
1. Enable WhatsApp notifications
2. Click **"Send Test Notification"** button
3. Check your WhatsApp for a test message

#### Method 2: Check API Health
```bash
curl http://localhost:5000/api/health
```

Look for `whatsappCloud: true` or `whatsapp: true` in the response.

## Common Issues & Solutions

### Issue 1: "WhatsApp service not configured on server"

**Symptom:** Toggle is grayed out, warning message appears

**Solution:**
1. Check if `.env` file exists in the root directory
2. Verify environment variables are set correctly
3. Restart the server after adding variables
4. Check server console for initialization messages

### Issue 2: "Recipient phone number not in allowed list"

**Symptom:** Server sends message but it fails (Meta Cloud API only)

**Solution:**
1. Go to [Meta WhatsApp Dashboard](https://developers.facebook.com/apps)
2. Select your app → WhatsApp → API Setup
3. Under "To", click "Manage phone number list"
4. Add the recipient's phone number (with country code)
5. Verify the number via SMS

### Issue 3: "24 hour window expired"

**Symptom:** Message fails with 24-hour window error (Meta Cloud API)

**Solution:**
This happens when trying to send messages outside the 24-hour window.

**Option A:** User initiates conversation first
- Have the recipient send ANY message to your WhatsApp Business number
- This opens a 24-hour window

**Option B:** Use Message Templates (Recommended)
1. Go to [WhatsApp Manager](https://business.facebook.com/wa/manage/message-templates/)
2. Create a message template (e.g., "food_expiry_alert")
3. Submit for approval (takes ~24 hours)
4. Update code to use template messages

Example template:
```
Name: food_expiry_alert
Category: UTILITY
Language: English
Body: Hello {{1}}, you have {{2}} items expiring soon! Check your dashboard.
```

### Issue 4: "Invalid access token"

**Symptom:** Authentication fails, token error in logs

**Solution:**
1. Check if token is expired (temporary tokens last 24 hours)
2. Generate a **permanent access token**:
   - Go to Meta App Dashboard
   - Settings → Basic → App Secret
   - Or create a System User Token
3. Update `.env` with new token
4. Restart server

### Issue 5: Toggle enabled but not receiving messages

**Checklist:**
1. ✅ WhatsApp toggle is ON in settings
2. ✅ Clicked "Save Settings" button
3. ✅ Phone number is correct in your profile
4. ✅ Phone number includes country code (e.g., +1234567890)
5. ✅ You have food items expiring within notification window
6. ✅ Current time is outside quiet hours (if set)
7. ✅ Notification checker is running (check server logs)

### Issue 6: Priority - Which Service is Used?

The app automatically prioritizes services in this order:
1. **WhatsApp Cloud API** (FREE) - checked first
2. **Twilio WhatsApp** (PAID) - fallback if Cloud API not configured

To verify which is active:
```bash
# Check server startup logs
# You should see which service initialized
```

## Testing WhatsApp Notifications

### Manual Test

1. Log in to your account
2. Add a food item expiring tomorrow
3. Go to Notification Settings
4. Enable WhatsApp notifications
5. Click "Send Test Notification"
6. Check your WhatsApp

### Scheduled Test

1. Add a food item expiring in 1-2 days
2. Enable WhatsApp notifications
3. Wait for the scheduled check (default: 9 AM daily)
4. Check server logs for:
   ```
   [NotificationChecker] Checking for expiring items...
   [NotificationChecker] Found X items expiring soon for user...
   [WhatsAppCloud] ✅ Message sent successfully
   ```

## Environment Variables Reference

### Required for Meta Cloud API
```env
WHATSAPP_CLOUD_ACCESS_TOKEN=EAAxxxx...
WHATSAPP_CLOUD_PHONE_NUMBER_ID=123456789012345
```

### Optional for Meta Cloud API
```env
WHATSAPP_CLOUD_BUSINESS_ACCOUNT_ID=123456789012345
```

### Required for Twilio
```env
TWILIO_ACCOUNT_SID=AC1234567890abcdef
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
```

## Quick Setup Commands

### Check if service is running
```powershell
# Windows PowerShell
Get-Process -Name node -ErrorAction SilentlyContinue
```

### Restart server to apply changes
```powershell
# Stop existing server
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force

# Start server
npm run dev
```

### View server logs
```powershell
# Server logs show in terminal where you ran npm run dev
# Look for [WhatsAppCloud] or [NotificationChecker] prefixes
```

## Getting Help

If you're still having issues:

1. **Check server logs** for error messages
2. **Verify phone number format**: Must include country code (+1234567890)
3. **Test with health endpoint**: `curl http://localhost:5000/api/health`
4. **Review setup guide**: See `FREE_WHATSAPP_SETUP.md`
5. **Check Meta Dashboard** for any account issues

## Meta Cloud API Resources

- [Official Documentation](https://developers.facebook.com/docs/whatsapp/cloud-api)
- [Meta Apps Dashboard](https://developers.facebook.com/apps)
- [WhatsApp Manager](https://business.facebook.com/wa/manage/)
- [Message Templates](https://developers.facebook.com/docs/whatsapp/business-management-api/message-templates)
