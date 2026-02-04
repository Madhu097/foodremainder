import TelegramBot from "node-telegram-bot-api";
import type { FoodItem, User } from "@shared/schema";
import { storage } from "./storage";

interface TelegramConfig {
    botToken: string;
}

class TelegramService {
    private bot: TelegramBot | null = null;
    private config: TelegramConfig | null = null;
    private botUsername: string | null = null;

    initialize() {
        const botToken = process.env.TELEGRAM_BOT_TOKEN;

        if (!botToken) {
            console.warn("[TelegramService] Telegram Bot Token not found. Telegram notifications will be disabled.");
            console.warn("[TelegramService] Set TELEGRAM_BOT_TOKEN in your .env file.");
            return false;
        }

        this.config = {
            botToken,
        };

        try {
            // Create bot without polling first to validate token
            this.bot = new TelegramBot(botToken, { polling: false });

            // Verify token is valid
            this.bot.getMe().then((me) => {
                this.botUsername = me.username || null;
                console.log(`[TelegramService] ✅ Bot token verified: @${me.username}`);

                // Token is valid, start polling ONLY if NOT on Vercel
                const isVercel = process.env.VERCEL === "1";
                if (this.bot && !isVercel) {
                    this.bot.startPolling({ restart: false });
                    console.log(`[TelegramService] ✅ Started polling for updates`);
                } else if (isVercel) {
                    console.log(`[TelegramService] ℹ Polling disabled on Vercel (running in serverless mode)`);
                }
            }).catch((err) => {
                console.error("[TelegramService] ❌ Invalid bot token or connection failed:", err.message);
                console.error("[TelegramService] 💡 Check your TELEGRAM_BOT_TOKEN in Render environment variables");
                console.error("[TelegramService] 📖 Get a valid token from @BotFather on Telegram");
                this.bot = null;
                this.config = null;
                return false;
            });

            // Handle polling errors to prevent crash and stop on auth errors
            this.bot.on('polling_error', (error) => {
                const errorMsg = error.message || '';

                // Stop polling on fatal errors
                if (errorMsg.includes('409 Conflict')) {
                    console.error("[TelegramService] ⚠️ Conflict detected! Another instance is running. Stopping polling.");
                    this.bot?.stopPolling();
                } else if (errorMsg.includes('401') || errorMsg.includes('Unauthorized')) {
                    console.error("[TelegramService] ❌ 401 Unauthorized - Invalid bot token. Stopping polling.");
                    console.error("[TelegramService] 💡 Fix: Check TELEGRAM_BOT_TOKEN in Render environment variables");
                    this.bot?.stopPolling();
                    this.bot = null;
                } else if (errorMsg.includes('404') || errorMsg.includes('Not Found')) {
                    console.error("[TelegramService] ❌ Bot not found. Token may be revoked. Stopping polling.");
                    this.bot?.stopPolling();
                    this.bot = null;
                } else {
                    console.warn(`[TelegramService] Polling error: ${errorMsg}`);
                }
            });

            // Handle /start <userId>
            this.bot.onText(/\/start (.+)/, async (msg, match) => {
                const chatId = msg.chat.id.toString();
                const startParam = match?.[1]; // The userId passed in deep link

                if (startParam) {
                    try {
                        const userId = startParam;
                        const user = await storage.getUser(userId);

                        if (user) {
                            await storage.updateNotificationPreferences(userId, {
                                telegramChatId: chatId,
                                telegramNotifications: 'true'
                            });

                            this.bot?.sendMessage(chatId, `✅ Connected! Hello ${user.username}, you will now receive food expiry reminders here.`);
                            console.log(`[TelegramService] Linked user ${userId} to chat ${chatId}`);
                        } else {
                            this.bot?.sendMessage(chatId, "❌ User not found. Please log in to the App first.");
                        }
                    } catch (err) {
                        console.error("[TelegramService] Error linking user:", err);
                        this.bot?.sendMessage(chatId, "❌ An error occurred while linking your account.");
                    }
                }
            });

            return true;
        } catch (error) {
            console.error("[TelegramService] ❌ Failed to initialize Telegram client:", error instanceof Error ? error.message : 'Unknown error');
            this.bot = null;
            this.config = null;
            return false;
        }
    }

    isConfigured(): boolean {
        return this.bot !== null && this.config !== null;
    }

    getBotUsername(): string | null {
        return this.botUsername;
    }

    async sendExpiryNotification(user: User, expiringItems: FoodItem[]): Promise<boolean> {
        if (!this.isConfigured()) {
            console.log('[TelegramService] Service not configured');
            return false;
        }

        // Check if user has a configured Telegram Chat ID
        if (!user.telegramChatId) {
            console.log(`[TelegramService] User ${user.username} has no Telegram Chat ID`);
            return false;
        }

        try {
            console.log(`[TelegramService] Preparing notification for ${user.username}`);
            console.log(`[TelegramService] Number of expiring items: ${expiringItems.length}`);
            console.log(`[TelegramService] Items data:`, JSON.stringify(expiringItems, null, 2));

            const itemsList = expiringItems
                .map((item, index) => {
                    console.log(`[TelegramService] Processing item ${index + 1}:`, {
                        name: item.name,
                        category: item.category,
                        expiryDate: item.expiryDate
                    });

                    const daysLeft = this.calculateDaysLeft(item.expiryDate);
                    const itemName = item.name || 'Unknown Item';
                    const category = item.category ? ` (${item.category})` : '';

                    let statusEmoji = '';
                    let statusText = '';

                    if (daysLeft < 0) {
                        statusEmoji = '❌';
                        statusText = `expired ${Math.abs(daysLeft)} day${Math.abs(daysLeft) === 1 ? '' : 's'} ago`;
                    } else if (daysLeft === 0) {
                        statusEmoji = '⚠️';
                        statusText = 'expires TODAY';
                    } else if (daysLeft === 1) {
                        statusEmoji = '⏰';
                        statusText = 'expires TOMORROW';
                    } else {
                        statusEmoji = '⏳';
                        statusText = `expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`;
                    }

                    const formattedItem = `${index + 1}. ${statusEmoji} *${itemName}*${category}
   └ ${statusText}`;
                    console.log(`[TelegramService] Formatted item ${index + 1}: ${formattedItem}`);
                    return formattedItem;
                })
                .join('\n\n');

            // Get the app URL - if not set, provide helpful message
            const appUrl = process.env.APP_URL;
            const dashboardLink = appUrl
                ? `

[📱 Open Dashboard](${appUrl}/dashboard)`
                : `

💡 _Set APP_URL in .env to enable dashboard link_`;

            const message = `🍎 *Food Reminder Alert*

Hi ${user.username}! 👋

You have *${expiringItems.length} item${expiringItems.length > 1 ? 's' : ''}* expiring soon:

${itemsList}${dashboardLink}`.trim();

            console.log(`[TelegramService] Final message to send:\n${message}`);
            console.log(`[TelegramService] Sending to chat ID: ${user.telegramChatId}`);

            await this.bot!.sendMessage(user.telegramChatId, message, {
                parse_mode: 'Markdown',
                disable_web_page_preview: true
            });

            console.log(`[TelegramService] ✅ Telegram notification sent to ${user.username}`);
            return true;
        } catch (error) {
            console.error(`[TelegramService] ❌ Failed to send Telegram message:`, error);
            if (error instanceof Error) {
                console.error(`[TelegramService] Error message: ${error.message}`);
                console.error(`[TelegramService] Error stack: ${error.stack}`);
            }
            return false;
        }
    }

    private calculateDaysLeft(expiryDate: string): number {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const expiry = new Date(expiryDate);
        expiry.setHours(0, 0, 0, 0);
        return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    }
}

export const telegramService = new TelegramService();
