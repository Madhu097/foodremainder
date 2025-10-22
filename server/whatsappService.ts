import twilio from "twilio";
import type { FoodItem, User } from "@shared/schema";

interface WhatsAppConfig {
  accountSid: string;
  authToken: string;
  fromNumber: string;
}

class WhatsAppService {
  private client: ReturnType<typeof twilio> | null = null;
  private config: WhatsAppConfig | null = null;

  initialize() {
    // Check if WhatsApp/Twilio configuration is available
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_WHATSAPP_FROM;

    if (!accountSid || !authToken || !fromNumber) {
      console.warn("[WhatsAppService] Twilio configuration not found. WhatsApp notifications will be disabled.");
      return false;
    }

    this.config = {
      accountSid,
      authToken,
      fromNumber,
    };

    // Create Twilio client
    this.client = twilio(this.config.accountSid, this.config.authToken);

    console.log("[WhatsAppService] WhatsApp service initialized successfully");
    return true;
  }

  isConfigured(): boolean {
    return this.client !== null && this.config !== null;
  }

  async sendExpiryNotification(user: User, expiringItems: FoodItem[]): Promise<boolean> {
    if (!this.isConfigured()) {
      console.warn("[WhatsAppService] WhatsApp service not configured. Skipping WhatsApp message.");
      return false;
    }

    try {
      const itemsList = expiringItems
        .map((item) => {
          const daysLeft = this.calculateDaysLeft(item.expiryDate);
          const statusText = daysLeft === 0 ? "expires today ⚠️" : daysLeft === 1 ? "expires tomorrow ⏰" : `expires in ${daysLeft} days`;
          return `• ${item.name} (${item.category}) - ${statusText}`;
        })
        .join("\n");

      const message = `
🍎 *Food Reminder - Expiry Alert*

Hi ${user.username}! 👋

You have *${expiringItems.length} food item${expiringItems.length > 1 ? "s" : ""}* expiring soon:

${itemsList}

⚡ Action needed: Check your inventory to avoid food waste!

View your dashboard: ${process.env.APP_URL || "http://localhost:5000"}/dashboard
      `.trim();

      // Format mobile number for WhatsApp
      // Twilio WhatsApp expects format: whatsapp:+1234567890
      let toNumber = user.mobile;
      if (!toNumber.startsWith("+")) {
        // If mobile doesn't have country code, you might want to add default
        console.warn(`[WhatsAppService] Mobile number ${toNumber} doesn't have country code`);
      }
      const whatsappNumber = `whatsapp:${toNumber}`;

      await this.client!.messages.create({
        body: message,
        from: this.config!.fromNumber,
        to: whatsappNumber,
      });

      console.log(`[WhatsAppService] Expiry notification sent to ${user.mobile}`);
      return true;
    } catch (error) {
      console.error("[WhatsAppService] Failed to send WhatsApp message:", error);
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
      console.log("[WhatsAppService] WhatsApp service connection verified");
      return true;
    } catch (error) {
      console.error("[WhatsAppService] WhatsApp service connection failed:", error);
      return false;
    }
  }
}

export const whatsappService = new WhatsAppService();
