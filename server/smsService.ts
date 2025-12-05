import twilio from "twilio";
import type { FoodItem, User } from "@shared/schema";

interface SmsConfig {
    accountSid: string;
    authToken: string;
    fromNumber: string;
}

class SmsService {
    private client: ReturnType<typeof twilio> | null = null;
    private config: SmsConfig | null = null;

    initialize() {
        // Check if SMS/Twilio configuration is available
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        const fromNumber = process.env.TWILIO_SMS_FROM || process.env.TWILIO_PHONE_NUMBER;

        if (!accountSid || !authToken || !fromNumber) {
            console.warn("[SmsService] Twilio SMS configuration not found. SMS notifications will be disabled.");
            console.warn("[SmsService] Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_SMS_FROM in your .env file.");
            return false;
        }

        // Validate Twilio Account SID format
        if (!accountSid.startsWith('AC')) {
            console.warn("[SmsService] Invalid Twilio Account SID format (must start with 'AC'). SMS notifications will be disabled.");
            return false;
        }

        this.config = {
            accountSid,
            authToken,
            fromNumber,
        };

        try {
            // Create Twilio client
            this.client = twilio(this.config.accountSid, this.config.authToken);
            console.log("[SmsService] ✅ SMS service initialized successfully");
            console.log(`[SmsService] 📱 Using ${fromNumber}`);
            return true;
        } catch (error) {
            console.error("[SmsService] ❌ Failed to initialize Twilio SMS client:", error instanceof Error ? error.message : 'Unknown error');
            this.client = null;
            this.config = null;
            return false;
        }
    }

    isConfigured(): boolean {
        return this.client !== null && this.config !== null;
    }

    async sendExpiryNotification(user: User, expiringItems: FoodItem[]): Promise<boolean> {
        if (!this.isConfigured()) {
            console.warn("[SmsService] SMS service not configured. Skipping SMS message.");
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
🍎 Food Reminder Alert

Hi ${user.username}!

You have ${expiringItems.length} item${expiringItems.length > 1 ? "s" : ""} expiring soon:

${itemsList}

Check your dashboard: ${process.env.APP_URL || "http://localhost:5000"}/dashboard
      `.trim();

            // Format mobile number for SMS
            let toNumber = user.mobile;
            if (!toNumber.startsWith("+")) {
                console.warn(`[SmsService] Mobile number ${toNumber} doesn't have country code (+)`);
            }

            await this.client!.messages.create({
                body: message,
                from: this.config!.fromNumber,
                to: toNumber,
            });

            console.log(`[SmsService] ✅ SMS notification sent to ${user.mobile}`);
            return true;
        } catch (error) {
            console.error("[SmsService] ❌ Failed to send SMS:", error);
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

    async testConnection(): Promise<boolean> {
        if (!this.isConfigured()) {
            return false;
        }

        try {
            // Verify account by fetching account details
            await this.client!.api.accounts(this.config!.accountSid).fetch();
            console.log("[SmsService] ✅ SMS service connection verified");
            return true;
        } catch (error) {
            console.error("[SmsService] ❌ SMS service connection failed:", error);
            return false;
        }
    }
}

export const smsService = new SmsService();
