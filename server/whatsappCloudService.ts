import type { FoodItem, User } from "@shared/schema";

interface WhatsAppCloudConfig {
  accessToken: string;
  phoneNumberId: string;
  businessAccountId?: string;
}

/**
 * Free WhatsApp Business Cloud API Service
 * Sign up at: https://developers.facebook.com/docs/whatsapp/cloud-api/get-started
 * 
 * Free tier includes:
 * - 1000 service conversations per month
 * - Unlimited user-initiated conversations (24h window)
 * 
 * Setup:
 * 1. Create Meta Developer Account
 * 2. Create a WhatsApp Business App
 * 3. Get Phone Number ID and Access Token
 * 4. Add to .env:
 *    WHATSAPP_CLOUD_ACCESS_TOKEN=your_token
 *    WHATSAPP_CLOUD_PHONE_NUMBER_ID=your_phone_number_id
 */
class WhatsAppCloudService {
  private config: WhatsAppCloudConfig | null = null;
  private apiUrl = "https://graph.facebook.com/v18.0";

  initialize() {
    const accessToken = process.env.WHATSAPP_CLOUD_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_CLOUD_PHONE_NUMBER_ID;

    if (!accessToken || !phoneNumberId) {
      console.log("[WhatsAppCloud] 💡 Free WhatsApp Cloud API not configured");
      console.log("[WhatsAppCloud] 📖 To enable free WhatsApp notifications:");
      console.log("[WhatsAppCloud]    1. Visit: https://developers.facebook.com/apps");
      console.log("[WhatsAppCloud]    2. Create a WhatsApp Business App");
      console.log("[WhatsAppCloud]    3. Get your credentials and add to .env:");
      console.log("[WhatsAppCloud]       WHATSAPP_CLOUD_ACCESS_TOKEN=your_token");
      console.log("[WhatsAppCloud]       WHATSAPP_CLOUD_PHONE_NUMBER_ID=your_phone_id");
      console.log("[WhatsAppCloud] 🎁 Free tier: 1000 conversations/month");
      return false;
    }

    this.config = {
      accessToken,
      phoneNumberId,
      businessAccountId: process.env.WHATSAPP_CLOUD_BUSINESS_ACCOUNT_ID,
    };

    console.log("[WhatsAppCloud] ✅ Free WhatsApp Cloud API initialized");
    console.log("[WhatsAppCloud] 📱 Phone Number ID:", phoneNumberId.substring(0, 10) + "...");
    return true;
  }

  isConfigured(): boolean {
    return this.config !== null;
  }

  /**
   * Send a template message (for business-initiated conversations)
   * Note: You need to create and approve templates in Meta Business Manager
   */
  async sendTemplateMessage(to: string, templateName: string, parameters: string[]) {
    if (!this.isConfigured()) {
      return false;
    }

    try {
      const url = `${this.apiUrl}/${this.config!.phoneNumberId}/messages`;
      
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.config!.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: to,
          type: "template",
          template: {
            name: templateName,
            language: {
              code: "en"
            },
            components: [
              {
                type: "body",
                parameters: parameters.map(text => ({
                  type: "text",
                  text: text
                }))
              }
            ]
          }
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("[WhatsAppCloud] Template message failed:", data);
        return false;
      }

      return true;
    } catch (error) {
      console.error("[WhatsAppCloud] Error sending template message:", error);
      return false;
    }
  }

  /**
   * Send a text message (only works within 24h window of user message)
   */
  async sendTextMessage(to: string, message: string) {
    if (!this.isConfigured()) {
      return false;
    }

    try {
      // Remove any + or whitespace from phone number
      const cleanNumber = to.replace(/[+\s-]/g, '');
      
      const url = `${this.apiUrl}/${this.config!.phoneNumberId}/messages`;
      
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.config!.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: cleanNumber,
          type: "text",
          text: {
            preview_url: true,
            body: message
          }
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("[WhatsAppCloud] Message failed:", data);
        if (data.error?.message?.includes("24 hour")) {
          console.error("[WhatsAppCloud] ⚠️ Message window expired. User needs to message you first.");
        }
        return false;
      }

      console.log("[WhatsAppCloud] ✅ Message sent successfully");
      return true;
    } catch (error) {
      console.error("[WhatsAppCloud] Error sending message:", error);
      return false;
    }
  }

  async sendExpiryNotification(user: User, expiringItems: FoodItem[]): Promise<boolean> {
    if (!this.isConfigured()) {
      return false;
    }

    try {
      const itemsList = expiringItems
        .map((item) => {
          const daysLeft = this.calculateDaysLeft(item.expiryDate);
          const statusEmoji = daysLeft === 0 ? "🔴" : daysLeft === 1 ? "🟡" : "🟢";
          const statusText = daysLeft === 0 ? "expires today" : daysLeft === 1 ? "expires tomorrow" : `expires in ${daysLeft} days`;
          return `${statusEmoji} ${item.name} - ${statusText}`;
        })
        .join("\n");

      const count = expiringItems.length;
      const message = `🍎 *Food Expiry Alert*

Hi ${user.username}! 👋

You have *${count} item${count > 1 ? "s" : ""}* expiring soon:

${itemsList}

💡 Check your dashboard to avoid waste!
${process.env.APP_URL || "http://localhost:5000"}/dashboard`;

      return await this.sendTextMessage(user.mobile, message);
    } catch (error) {
      console.error("[WhatsAppCloud] Error in sendExpiryNotification:", error);
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

  /**
   * Test the connection by getting account info
   */
  async testConnection(): Promise<boolean> {
    if (!this.isConfigured()) {
      return false;
    }

    try {
      const url = `${this.apiUrl}/${this.config!.phoneNumberId}`;
      const response = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${this.config!.accessToken}`,
        },
      });

      if (response.ok) {
        console.log("[WhatsAppCloud] ✅ Connection test successful");
        return true;
      } else {
        console.error("[WhatsAppCloud] ❌ Connection test failed");
        return false;
      }
    } catch (error) {
      console.error("[WhatsAppCloud] Connection test error:", error);
      return false;
    }
  }
}

export const whatsappCloudService = new WhatsAppCloudService();
