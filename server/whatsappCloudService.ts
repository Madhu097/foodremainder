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
      console.log("[WhatsAppCloud] ⚠️ Service not configured");
      return false;
    }

    try {
      // Remove any + or whitespace from phone number
      const cleanNumber = to.replace(/[+\s-]/g, '');

      console.log(`[WhatsAppCloud] 📤 Sending text message...`);
      console.log(`[WhatsAppCloud]    Original number: ${to}`);
      console.log(`[WhatsAppCloud]    Cleaned number: ${cleanNumber}`);

      const url = `${this.apiUrl}/${this.config!.phoneNumberId}/messages`;

      const payload = {
        messaging_product: "whatsapp",
        to: cleanNumber,
        type: "text",
        text: {
          preview_url: true,
          body: message
        }
      };

      console.log(`[WhatsAppCloud]    API URL: ${url}`);
      console.log(`[WhatsAppCloud]    Phone Number ID: ${this.config!.phoneNumberId}`);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.config!.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      console.log(`[WhatsAppCloud]    Response status: ${response.status}`);
      console.log(`[WhatsAppCloud]    Response data:`, JSON.stringify(data, null, 2));

      if (!response.ok) {
        console.error("[WhatsAppCloud] ❌ API Error Response:");
        console.error("[WhatsAppCloud]    Status:", response.status);
        console.error("[WhatsAppCloud]    Status Text:", response.statusText);
        console.error("[WhatsAppCloud]    Error Data:", JSON.stringify(data, null, 2));

        if (data.error) {
          console.error("[WhatsAppCloud]    Error Code:", data.error.code);
          console.error("[WhatsAppCloud]    Error Message:", data.error.message);
          console.error("[WhatsAppCloud]    Error Type:", data.error.type);
          console.error("[WhatsAppCloud]    Error Subcode:", data.error.error_subcode);

          if (data.error.message?.includes("24 hour") || data.error.message?.includes("outside the support window")) {
            console.error("[WhatsAppCloud] ⚠️ 24-HOUR WINDOW EXPIRED");
            console.error("[WhatsAppCloud]    The user needs to message your WhatsApp number first");
            console.error("[WhatsAppCloud]    OR use an approved message template for business-initiated messages");
          }

          if (data.error.code === 131047 || data.error.message?.includes("recipient phone number not registered")) {
            console.error("[WhatsAppCloud] ⚠️ PHONE NUMBER NOT REGISTERED");
            console.error("[WhatsAppCloud]    The phone number is not registered on WhatsApp");
            console.error("[WhatsAppCloud]    OR the number is not in the sandbox (for test mode)");
          }

          if (data.error.code === 131031 || data.error.message?.includes("User's number is part of an experiment")) {
            console.error("[WhatsAppCloud] ⚠️ SANDBOX RESTRICTION");
            console.error("[WhatsAppCloud]    User must send the join code to your test number");
            console.error("[WhatsAppCloud]    Check Meta Business Manager for the join code");
          }
        }

        return false;
      }

      console.log("[WhatsAppCloud] ✅ Message sent successfully");
      console.log("[WhatsAppCloud]    Message ID:", data.messages?.[0]?.id);
      return true;
    } catch (error) {
      console.error("[WhatsAppCloud] ❌ Exception in sendTextMessage:");
      console.error("[WhatsAppCloud]    Error:", error instanceof Error ? error.message : String(error));
      console.error("[WhatsAppCloud]    Stack:", error instanceof Error ? error.stack : 'No stack trace');
      return false;
    }
  }

  async sendExpiryNotification(user: User, expiringItems: FoodItem[]): Promise<boolean> {
    if (!this.isConfigured()) {
      console.log("[WhatsAppCloud] ⚠️ Service not configured");
      return false;
    }

    if (!user.mobile) {
      console.error("[WhatsAppCloud] ❌ User has no mobile number");
      return false;
    }

    try {
      console.log(`[WhatsAppCloud] ========================================`);
      console.log(`[WhatsAppCloud] 📱 Sending WhatsApp notification to ${user.username}`);
      console.log(`[WhatsAppCloud]    Mobile: ${user.mobile}`);
      console.log(`[WhatsAppCloud]    Items count: ${expiringItems.length}`);

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

      console.log(`[WhatsAppCloud]    Message length: ${message.length} characters`);

      // Try sending text message first
      const textResult = await this.sendTextMessage(user.mobile, message);

      if (textResult) {
        console.log(`[WhatsAppCloud] ✅ Text message sent successfully`);
        console.log(`[WhatsAppCloud] ========================================`);
        return true;
      }

      // If text message failed, log detailed troubleshooting
      console.log(`[WhatsAppCloud] ❌ Text message failed`);
      console.log(`[WhatsAppCloud] 🔍 TROUBLESHOOTING GUIDE:`);
      console.log(`[WhatsAppCloud]    1. Check if user is in WhatsApp Business sandbox`);
      console.log(`[WhatsAppCloud]    2. Verify phone number format: ${user.mobile}`);
      console.log(`[WhatsAppCloud]    3. For sandbox: User must send join code to your test number`);
      console.log(`[WhatsAppCloud]    4. For production: Phone number must be verified in Meta Business`);
      console.log(`[WhatsAppCloud]    5. Check if 24-hour messaging window is active`);
      console.log(`[WhatsAppCloud] 💡 TIP: For business-initiated messages, create an approved template`);
      console.log(`[WhatsAppCloud] ========================================`);

      return false;
    } catch (error) {
      console.error("[WhatsAppCloud] ❌ Error in sendExpiryNotification:");
      console.error("[WhatsAppCloud]    Error:", error instanceof Error ? error.message : String(error));
      console.error("[WhatsAppCloud] ========================================");
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
