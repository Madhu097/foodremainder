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

    // Validate Twilio Account SID format
    if (!accountSid.startsWith('AC')) {
      console.warn("[WhatsAppService] Invalid Twilio Account SID format (must start with 'AC'). WhatsApp notifications will be disabled.");
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
      console.log("[WhatsAppService] ✅ WhatsApp service initialized successfully");
      console.log("[WhatsAppService] From number: " + this.config.fromNumber);
      
      // Check if using Twilio Sandbox
      if (this.config.fromNumber === 'whatsapp:+14155238886') {
        console.log("[WhatsAppService] 📱 Using Twilio WhatsApp Sandbox");
        console.log("[WhatsAppService] ⚠️ IMPORTANT: Recipients must join your sandbox first!");
        console.log("[WhatsAppService] Steps to join:");
        console.log("[WhatsAppService]   1. Save +1 (415) 523-8886 as a contact");
        console.log("[WhatsAppService]   2. Send 'join <your-sandbox-code>' to that number via WhatsApp");
        console.log("[WhatsAppService]   3. Find your sandbox code at: https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn");
      }
      
      return true;
    } catch (error) {
      console.error("[WhatsAppService] ❌ Failed to initialize Twilio client:", error instanceof Error ? error.message : 'Unknown error');
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
        // If mobile doesn't have country code, add +91 (India) as default
        console.log(`[WhatsAppService] Mobile number ${toNumber} doesn't have country code, adding +91`);
        toNumber = `+91${toNumber}`;
      }

      const whatsappNumber = `whatsapp:${toNumber}`;

      console.log(`[WhatsAppService] Sending to: ${whatsappNumber}`);
      console.log(`[WhatsAppService] From: ${this.config!.fromNumber}`);

      const messageResponse = await this.client!.messages.create({
        body: message,
        from: this.config!.fromNumber,
        to: whatsappNumber,
      });

      console.log(`[WhatsAppService] ✅ Message sent successfully!`);
      console.log(`[WhatsAppService] Message SID: ${messageResponse.sid}`);
      console.log(`[WhatsAppService] Status: ${messageResponse.status}`);
      console.log(`[WhatsAppService] ⚠️ IMPORTANT: For Twilio Sandbox, the recipient must first send`);
      console.log(`[WhatsAppService]    "join <your-sandbox-code>" to ${this.config!.fromNumber}`);
      return true;
    } catch (error: any) {
      console.error("[WhatsAppService] ❌ Failed to send WhatsApp message:");
      console.error("[WhatsAppService] Error details:", error.message || error);
      
      if (error.code) {
        console.error(`[WhatsAppService] Error code: ${error.code}`);
      }
      
      if (error.moreInfo) {
        console.error(`[WhatsAppService] More info: ${error.moreInfo}`);
      }
      
      // Common Twilio WhatsApp errors
      if (error.code === 63007) {
        console.error(`[WhatsAppService] ⚠️ User has not opted in to WhatsApp messages`);
        console.error(`[WhatsAppService] Solution: Have ${toNumber} send "join <sandbox-code>" to your Twilio WhatsApp number`);
      } else if (error.code === 21211) {
        console.error(`[WhatsAppService] ⚠️ Invalid phone number format`);
        console.error(`[WhatsAppService] Phone number: ${whatsappNumber}`);
      } else if (error.code === 21608) {
        console.error(`[WhatsAppService] ⚠️ The number ${toNumber} is not a valid WhatsApp number`);
      } else if (error.code === 20003) {
        console.error(`[WhatsAppService] ⚠️ Authentication error - check TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN`);
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
