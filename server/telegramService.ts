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
            // Enable polling to receive /start messages
            this.bot = new TelegramBot(botToken, { polling: false });

            // Handle polling errors to prevent crash
            this.bot.on('polling_error', (error) => {
                if (error.message.includes('409 Conflict')) {
                    console.error("[TelegramService] ⚠️ Conflict detected! Another instance is running. Polling stopped.");
                    this.bot?.stopPolling();
                } else {
                    console.error(`[TelegramService] Polling error: ${error.message}`);
                }
            });

            // Start polling safely
            this.bot.startPolling();

            // Handle polling errors to prevent crash
            this.bot.on('polling_error', (error) => {
                // Determine if it's a fatal error or just a temporary network/conflict issue
                if (error.message.includes('409 Conflict')) {
                    console.error("[TelegramService] ⚠️ Conflict detected! Another instance is running. Polling stopped.");
                    this.bot?.stopPolling();
                } else {
                    console.error(`[TelegramService] Polling error: ${error.message}`);
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

            // Get bot info
            this.bot.getMe().then((me) => {
                this.botUsername = me.username || null;
                console.log(`[TelegramService] ✅ Telegram service initialized as @${me.username}`);
            }).catch((err) => {
                console.error("[TelegramService] ❌ Failed to connect to Telegram:", err.message);
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
            return false;
        }

        // Check if user has a configured Telegram Chat ID
        if (!user.telegramChatId) {
            // We can't send a message without a chat ID
            return false;
        }

        try {
            const itemsList = expiringItems
                .map((item) => {
                    const daysLeft = this.calculateDaysLeft(item.expiryDate);
                    const statusText = daysLeft === 0 ? "expires today ⚠️" : daysLeft === 1 ? "expires tomorrow ⏰" : `expires in ${daysLeft} days`;
                    return `• ${item.name} - ${statusText}`;
                })
                .join("\n");

            const message = `
🍎 *Food Reminder Alert*

Hi ${user.username}! 👋

You have *${expiringItems.length} item${expiringItems.length > 1 ? "s" : ""}* expiring soon:

${itemsList}

[View Dashboard](${process.env.APP_URL || "http://localhost:5000"}/dashboard)
      `.trim();

            await this.bot!.sendMessage(user.telegramChatId, message, {
                parse_mode: 'Markdown',
                disable_web_page_preview: true
            });

            console.log(`[TelegramService] ✅ Telegram notification sent to ${user.username}`);
            return true;
        } catch (error) {
            console.error("[TelegramService] ❌ Failed to send Telegram message:", error);
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
