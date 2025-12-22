import type { FoodItem, User } from "@shared/schema";

interface CallMeBotConfig {
  enabled: boolean;
}

/**
 * CallMeBot WhatsApp API - Completely FREE alternative
 * NO registration needed, NO API keys, NO developer account
 * 
 * Setup:
 * 1. Save this number to your contacts: +34 644 34 87 08
 * 2. Send "I allow callmebot to send me messages" to that number via WhatsApp
 * 3. You'll receive an API key in response
 * 4. Add API key to your profile in the app
 * 
 * Limitations:
 * - Each user needs their own API key
 * - Message limit: ~50-100 per day per user
 * - Only sends to the same number that registered
 * 
 * Perfect for: Personal use, small apps, testing
 */
class CallMeBotService {
  private apiUrl = "https://api.callmebot.com/whatsapp.php";

  isConfigured(): boolean {
    // CallMeBot doesn't need server-side configuration
    // Each user has their own API key
    return true;
  }

  /**
   * Send WhatsApp message using user's personal CallMeBot API key
   */
  async sendMessage(phoneNumber: string, apiKey: string, message: string): Promise<boolean> {
    if (!apiKey || apiKey.trim() === '') {
      console.log("[CallMeBot] ⚠️ No API key provided");
      return false;
    }

    try {
      // Remove spaces and special characters from phone number
      const cleanPhone = phoneNumber.replace(/[^0-9+]/g, '');
      
      // URL encode the message
      const encodedMessage = encodeURIComponent(message);

      // CallMeBot API endpoint
      const url = `${this.apiUrl}?phone=${cleanPhone}&text=${encodedMessage}&apikey=${apiKey}`;

      console.log(`[CallMeBot] 📤 Sending WhatsApp message...`);
      console.log(`[CallMeBot] Phone: ${cleanPhone}`);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'FoodReminder/1.0'
        }
      });

      if (!response.ok) {
        const text = await response.text();
        console.error(`[CallMeBot] ❌ API error: ${response.status}`);
        console.error(`[CallMeBot] Response: ${text}`);
        return false;
      }

      console.log(`[CallMeBot] ✅ Message sent successfully!`);
      return true;

    } catch (error) {
      console.error("[CallMeBot] ❌ Error sending message:", error);
      return false;
    }
  }

  /**
   * Send expiry notification using CallMeBot
   */
  async sendExpiryNotification(user: User, expiringItems: FoodItem[]): Promise<boolean> {
    // Check if user has CallMeBot API key
    const apiKey = (user as any).callmebotApiKey;
    
    if (!apiKey || apiKey.trim() === '') {
      console.log(`[CallMeBot] ⚠️ User ${user.username} has no CallMeBot API key`);
      console.log(`[CallMeBot] 💡 Instructions:`);
      console.log(`[CallMeBot]    1. Save +34 644 34 87 08 to contacts`);
      console.log(`[CallMeBot]    2. Send "I allow callmebot to send me messages" to that number`);
      console.log(`[CallMeBot]    3. Add the API key you receive to your profile`);
      return false;
    }

    // Check if user has mobile number
    if (!user.mobile || user.mobile.trim() === '') {
      console.log(`[CallMeBot] ⚠️ User ${user.username} has no mobile number`);
      return false;
    }

    try {
      const itemsList = expiringItems
        .map((item) => {
          const daysLeft = this.calculateDaysLeft(item.expiryDate);
          const statusText = daysLeft === 0 
            ? "expires today!" 
            : daysLeft === 1 
            ? "expires tomorrow!" 
            : `expires in ${daysLeft} days`;
          return `• ${item.name} (${item.category}) - ${statusText}`;
        })
        .join("\n");

      const message = `🍎 Food Reminder Alert

Hi ${user.username}!

You have ${expiringItems.length} food item${expiringItems.length > 1 ? "s" : ""} expiring soon:

${itemsList}

⚡ Check your dashboard to avoid food waste!`;

      return await this.sendMessage(user.mobile, apiKey, message);

    } catch (error) {
      console.error("[CallMeBot] ❌ Error in sendExpiryNotification:", error);
      return false;
    }
  }

  /**
   * Calculate days left until expiry
   */
  private calculateDaysLeft(expiryDate: string): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const expiry = new Date(expiryDate);
    expiry.setHours(0, 0, 0, 0);
    
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  }

  /**
   * Test the CallMeBot connection
   */
  async testConnection(phoneNumber: string, apiKey: string): Promise<boolean> {
    const testMessage = "🎉 CallMeBot WhatsApp is working! You'll now receive food expiry notifications.";
    return await this.sendMessage(phoneNumber, apiKey, testMessage);
  }
}

export const callmebotService = new CallMeBotService();
