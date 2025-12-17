import { storage } from "./storage";
import { emailService } from "./emailService";
import { whatsappService } from "./whatsappService";
import { whatsappCloudService } from "./whatsappCloudService";
import { smsService } from "./smsService";
import { telegramService } from "./telegramService";
import { pushService } from "./pushService";
import type { FoodItem, User } from "@shared/schema";

interface NotificationResult {
  userId: string;
  username: string;
  itemCount: number;
  emailSent: boolean;
  whatsappSent: boolean;
  smsSent: boolean;
  telegramSent: boolean;
  pushSent: boolean;
}

class NotificationChecker {
  /**
   * Check all users for expiring food items and send notifications
   */
  async checkAndNotifyAll(): Promise<NotificationResult[]> {
    console.log("[NotificationChecker] ========================================");
    console.log("[NotificationChecker] 🔔 Starting notification check for all users...");
    console.log("[NotificationChecker] ========================================");

    const results: NotificationResult[] = [];
    let totalUsers = 0;
    let usersWithNotifications = 0;
    let usersSkipped = 0;
    let usersFailed = 0;

    try {
      // Get all users
      const users = await storage.getAllUsers();
      totalUsers = users.length;
      console.log(`[NotificationChecker] 📊 Found ${totalUsers} total users to check`);

      if (totalUsers === 0) {
        console.log("[NotificationChecker] ⚠️ No users found in database");
        return results;
      }

      for (const user of users) {
        try {
          console.log(`[NotificationChecker] 👤 Checking user: ${user.username} (${user.email})`);
          const result = await this.checkAndNotifyUser(user);

          if (result) {
            results.push(result);
            usersWithNotifications++;
            console.log(`[NotificationChecker] ✅ Notifications sent to ${user.username}: Email=${result.emailSent}, Push=${result.pushSent}, WhatsApp=${result.whatsappSent}, SMS=${result.smsSent}, Telegram=${result.telegramSent}`);
          } else {
            usersSkipped++;
            console.log(`[NotificationChecker] ⏭️ Skipped ${user.username} (no expiring items or notifications disabled)`);
          }
        } catch (error) {
          usersFailed++;
          console.error(`[NotificationChecker] ❌ Error checking user ${user.username} (${user.id}):`, error instanceof Error ? error.message : String(error));
          // Continue processing other users even if one fails
        }
      }

      console.log("[NotificationChecker] ========================================");
      console.log("[NotificationChecker] 📊 Notification check completed:");
      console.log(`[NotificationChecker]    Total users: ${totalUsers}`);
      console.log(`[NotificationChecker]    Notifications sent: ${usersWithNotifications}`);
      console.log(`[NotificationChecker]    Skipped: ${usersSkipped}`);
      console.log(`[NotificationChecker]    Failed: ${usersFailed}`);
      console.log("[NotificationChecker] ========================================");

      return results;
    } catch (error) {
      console.error("[NotificationChecker] ❌ Critical error during notification check:", error);
      return results;
    }
  }

  /**
   * Check if current time is within user's quiet hours
   */
  private isInQuietHours(user: User): boolean {
    if (!user.quietHoursStart || !user.quietHoursEnd) return false;

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const [startH, startM] = user.quietHoursStart.split(':').map(Number);
    const [endH, endM] = user.quietHoursEnd.split(':').map(Number);

    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    // Same day range (e.g. 09:00 to 17:00)
    if (startMinutes < endMinutes) {
      return currentMinutes >= startMinutes && currentMinutes < endMinutes;
    }

    // Overnight range (e.g. 22:00 to 07:00)
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }

  /**
   * Check and notify a specific user
   */
  async checkAndNotifyUser(user: User, itemsOverride?: FoodItem[]): Promise<NotificationResult | null> {
    // Check quiet hours (skip if override provided - i.e. test mode)
    if (!itemsOverride && this.isInQuietHours(user)) {
      console.log(`[NotificationChecker] Skipping notification for user ${user.username} due to quiet hours`);
      return null;
    }

    // Check if user has any notifications enabled
    const emailEnabled = user.emailNotifications === "true";
    const whatsappEnabled = user.whatsappNotifications === "true";
    const smsEnabled = user.smsNotifications === "true";
    const telegramEnabled = user.telegramNotifications === "true";
    const pushEnabled = user.browserNotifications === "true";

    if (!emailEnabled && !whatsappEnabled && !smsEnabled && !telegramEnabled && !pushEnabled) {
      return null;
    }

    // Get user's notification days threshold (default: 3 days)
    const notificationDays = parseInt(user.notificationDays || "3");

    let expiringItems: FoodItem[] = [];

    if (itemsOverride) {
      expiringItems = itemsOverride;
    } else {
      // Get user's food items
      const foodItems = await storage.getFoodItemsByUserId(user.id);
      // Filter expiring items based on notification threshold
      expiringItems = this.getExpiringItems(foodItems, notificationDays);
    }

    if (expiringItems.length === 0) {
      return null;
    }

    console.log(`[NotificationChecker] User ${user.username} has ${expiringItems.length} expiring items`);

    const result: NotificationResult = {
      userId: user.id,
      username: user.username,
      itemCount: expiringItems.length,
      emailSent: false,
      whatsappSent: false,
      smsSent: false,
      telegramSent: false,
      pushSent: false
    };

    // Send email notification
    if (emailEnabled && emailService.isConfigured()) {
      result.emailSent = await emailService.sendExpiryNotification(user, expiringItems);
    }

    // Send WhatsApp notification (try free Cloud API first, then Twilio)
    if (whatsappEnabled) {
      if (whatsappCloudService.isConfigured()) {
        result.whatsappSent = await whatsappCloudService.sendExpiryNotification(user, expiringItems);
      } else if (whatsappService.isConfigured()) {
        result.whatsappSent = await whatsappService.sendExpiryNotification(user, expiringItems);
      }
    }

    // Send SMS notification
    if (smsEnabled && smsService.isConfigured()) {
      result.smsSent = await smsService.sendExpiryNotification(user, expiringItems);
    }

    // Send Telegram notification
    if (telegramEnabled && telegramService.isConfigured()) {
      result.telegramSent = await telegramService.sendExpiryNotification(user, expiringItems);
    }

    // Send Push Notification
    if (pushEnabled && pushService.isConfigured()) {
      result.pushSent = await pushService.sendExpiryNotification(user, expiringItems);
    }

    return result;
  }

  /**
   * Get items that are expiring within the threshold
   */
  private getExpiringItems(items: FoodItem[], daysThreshold: number): FoodItem[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return items.filter((item) => {
      const expiryDate = new Date(item.expiryDate);
      expiryDate.setHours(0, 0, 0, 0);

      const daysLeft = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      // Include items that expire within the threshold (including today and tomorrow)
      return daysLeft >= 0 && daysLeft <= daysThreshold;
    });
  }

  /**
   * Test notification for a specific user
   */
  async testNotification(userId: string): Promise<{ success: boolean; message: string }> {
    try {
      const user = await storage.getUser(userId);
      if (!user) {
        return { success: false, message: "User not found" };
      }

      // Temporarily clear quiet hours for test (though checkAndNotifyUser handles override logic too)
      const tempStart = user.quietHoursStart;
      user.quietHoursStart = null;

      // 1. Try with real items
      let result = await this.checkAndNotifyUser(user);

      // 2. If no real items, force a mock item
      if (!result) {
        console.log("[NotificationChecker] No real expiring items found for test. Generating mock item.");
        const mockItem: FoodItem = {
          id: 'test-item',
          userId: user.id,
          name: 'Test Notification Item',
          quantity: '1',
          purchaseDate: new Date().toISOString(),
          expiryDate: new Date().toISOString(),
          category: 'Test',
          notes: 'This is a test notification.',
          createdAt: new Date().toISOString()
        };

        result = await this.checkAndNotifyUser(user, [mockItem]);
      }

      // Restore quiet hours
      user.quietHoursStart = tempStart;

      if (!result) {
        return {
          success: false,
          message: "No notification channels enabled. Please enable Email, WhatsApp, Telegram, or Browser Notifications."
        };
      }

      const sentMethods = [];
      if (result.emailSent) sentMethods.push("Email");
      if (result.whatsappSent) sentMethods.push("WhatsApp");
      if (result.smsSent) sentMethods.push("SMS");
      if (result.telegramSent) sentMethods.push("Telegram");
      if (result.pushSent) sentMethods.push("Browser Push");

      if (sentMethods.length === 0) {
        return {
          success: false,
          message: "Failed to send notifications. Check if services are configured correctly."
        };
      }

      return {
        success: true,
        message: `Test notification sent via ${sentMethods.join(", ")}`,
      };
    } catch (error) {
      console.error("[NotificationChecker] Test notification error:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }
}

export const notificationChecker = new NotificationChecker();
