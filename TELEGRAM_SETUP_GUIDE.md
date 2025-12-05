# ✈️ Telegram Notification Setup Guide

This guide explains how to set up **Telegram Notifications** for the Food Reminder app. Telegram notifications are **completely free** and unlimited!

## 🌟 Why Telegram?

- ✅ **Completely FREE** (No limits)
- ✅ **Secure** & Private
- ✅ **Instant** Delivery
- ✅ **Rich Formatting**
- ✅ **Easy to Setup**

## 🚀 Setup Instructions

### Step 1: Create a Telegram Bot

1. Open Telegram app
2. Search for **@BotFather**
3. Click "Start"
4. Send command: `/newbot`
5. Follow instructions:
   - Choose a name (e.g., "My Food Reminder")
   - Choose a username (must end in `bot`, e.g., `my_food_reminder_bot`)
6. **Copy the HTTP API Token** given to you

### Step 2: Configure Environment

Add the token to your `.env` file:

```env
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxYZ
```

### Step 3: Get Your Chat ID

The system needs to know *where* to send messages (to you!).

1. Open your new bot in Telegram (search for its username)
2. Click **Start**
3. Send any message to the bot
4. Visit this URL in your browser (replace `<YourBOTToken>`):
   `https://api.telegram.org/bot<YourBOTToken>/getUpdates`
5. Look for `"chat":{"id":123456789,...` directory in the JSON response
6. Copy the **id** (e.g., `123456789`)

### Step 4: Configuring User Profile

Currently, you'll need to manually add your Chat ID to your user profile in the database or wait for the upcoming UI update that allows you to set it directly.

**For Developers/Admins:**
If you're using Firebase, go to the Firestore console:
1. Go to `users` collection
2. Find the user document
3. Add field `telegramChatId` (string/number) configured with your ID
4. Add field `telegramNotifications` set to `"true"`

---

## 🧪 Testing

1. Start the server:
   ```bash
   npm run dev
   ```

2. Check logs:
   ```
   [TelegramService] ✅ Telegram service initialized as @your_bot_name
   ✓ Telegram notifications enabled
   ```

3. Trigger a test notification from your profile!

---

## 📸 Example Notification

```
🍎 Food Reminder Alert

Hi John! 👋

You have 2 items expiring soon:

• 🥛 Milk - expires tomorrow ⏰
• 🥬 Spinach - expires in 2 days

[View Dashboard](http://localhost:5000/dashboard)
```

---

## 🆘 Troubleshooting

### Bot not sending messages

1. **Did you press Start?** You must start the bot first so it has permission to message you.
2. **Check Token:** Verify `TELEGRAM_BOT_TOKEN` is correct.
3. **Check Chat ID:** Ensure `telegramChatId` is correct for the user.
4. **Logs:** Check server logs for error messages.
