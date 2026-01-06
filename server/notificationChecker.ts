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
   * Check if user should receive notification based on their frequency preference
   * Modified to use persistent storage
   */
  private shouldNotifyUser(user: User): boolean {
    const notificationsPerDay = parseInt(user.notificationsPerDay || "24");

    // Calculate minimum hours between notifications based on frequency
    const hoursPerNotification = 24 / notificationsPerDay;
    const minMillisecondsBetween = hoursPerNotification * 60 * 60 * 1000;

    // Check persistent storage timestamp
    const lastNotifiedStr = user.lastNotificationSentAt;
    const now = Date.now();

    if (!lastNotifiedStr) {
      // First notification, allow it
      console.log(`[NotificationChecker] ✅ First notification for user ${user.username} - allowing`);
      return true;
    }

    const lastNotified = new Date(lastNotifiedStr).getTime();
    if (isNaN(lastNotified)) {
      // Invalid date string, treat as never notified
      return true;
    }

    const timeSinceLastNotification = now - lastNotified;
    const shouldNotify = timeSinceLastNotification >= minMillisecondsBetween;

    if (!shouldNotify) {
      const hoursRemaining = ((minMillisecondsBetween - timeSinceLastNotification) / (1000 * 60 * 60)).toFixed(1);
      console.log(`[NotificationChecker] ⏳ User ${user.username} needs to wait ${hoursRemaining} more hours (${notificationsPerDay}x/day)`);
    } else {
      console.log(`[NotificationChecker] ✅ User ${user.username} frequency check passed - allowing notification`);
    }

    return shouldNotify;
  }

  /**
   * Record that a notification was sent to a user
   */
  private async recordNotification(userId: string): Promise<void> {
    try {
      await storage.updateLastNotificationTime(userId);
    } catch (error) {
      console.error(`[NotificationChecker] Failed to record notification time for ${userId}:`, error);
    }
  }

  /**
   * Check all users for expiring food items and send notifications
   */
  async checkAndNotifyAll(): Promise<NotificationResult[]> {
    console.log("[NotificationChecker] ========================================");
    console.log("[NotificationChecker] 🔔 Starting notification check for all users...");
    console.log("[NotificationChecker] Timestamp:", new Date().toISOString());
    console.log("[NotificationChecker] Timezone:", Intl.DateTimeFormat().resolvedOptions().timeZone);
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
        console.log("[NotificationChecker] ⚠️ This might indicate a database connection issue");
        return results;
      }

      // Process each user with detailed logging
      for (let i = 0; i < users.length; i++) {
        const user = users[i];
        try {
          console.log(`[NotificationChecker] ========================================`);
          console.log(`[NotificationChecker] 👤 Processing user ${i + 1}/${totalUsers}`);
          console.log(`[NotificationChecker]    Username: ${user.username}`);
          console.log(`[NotificationChecker]    Email: ${user.email}`);
          console.log(`[NotificationChecker]    Mobile: ${user.mobile}`);
          console.log(`[NotificationChecker]    User ID: ${user.id}`);

          const result = await this.checkAndNotifyUser(user);

          if (result) {
            results.push(result);
            usersWithNotifications++;
            console.log(`[NotificationChecker] ✅ SUCCESS for ${user.username}:`);
            console.log(`[NotificationChecker]    Email: ${result.emailSent ? '✅' : '❌'}`);
            console.log(`[NotificationChecker]    WhatsApp: ${result.whatsappSent ? '✅' : '❌'}`);
            console.log(`[NotificationChecker]    SMS: ${result.smsSent ? '✅' : '❌'}`);
            console.log(`[NotificationChecker]    Telegram: ${result.telegramSent ? '✅' : '❌'}`);
            console.log(`[NotificationChecker]    Browser Push: ${result.pushSent ? '✅' : '❌'}`);
          } else {
            usersSkipped++;
            console.log(`[NotificationChecker] ⏭️ SKIPPED ${user.username}`);
            console.log(`[NotificationChecker]    Reason: No expiring items, notifications disabled, or in quiet hours`);
          }
        } catch (error) {
          usersFailed++;
          console.error(`[NotificationChecker] ========================================`);
          console.error(`[NotificationChecker] ❌ FAILED for user ${user.username} (${user.id})`);
          console.error(`[NotificationChecker]    Error:`, error instanceof Error ? error.message : String(error));
          console.error(`[NotificationChecker]    Stack:`, error instanceof Error ? error.stack : 'No stack trace');
          console.error(`[NotificationChecker] ========================================`);
          // Continue processing other users even if one fails
        }
      }

      console.log("[NotificationChecker] ========================================");
      console.log("[NotificationChecker] 📊 FINAL SUMMARY:");
      console.log(`[NotificationChecker]    Total users: ${totalUsers}`);
      console.log(`[NotificationChecker]    ✅ Notifications sent: ${usersWithNotifications}`);
      console.log(`[NotificationChecker]    ⏭️ Skipped: ${usersSkipped}`);
      console.log(`[NotificationChecker]    ❌ Failed: ${usersFailed}`);
      console.log("[NotificationChecker] ========================================");

      return results;
    } catch (error) {
      console.error("[NotificationChecker] ❌ CRITICAL ERROR during notification check:");
      console.error("[NotificationChecker]    Error:", error instanceof Error ? error.message : String(error));
      console.error("[NotificationChecker]    Stack:", error instanceof Error ? error.stack : 'No stack trace');
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
    // Check frequency preference (skip if override provided - i.e. test mode)
    if (!itemsOverride && !this.shouldNotifyUser(user)) {
      console.log(`[NotificationChecker] ⏭️ Skipping notification for user ${user.username} due to frequency preference`);
      return null;
    }

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

    console.log(`[NotificationChecker] Notification channels for ${user.username}:`);
    console.log(`[NotificationChecker]   Email: ${emailEnabled}`);
    console.log(`[NotificationChecker]   WhatsApp: ${whatsappEnabled}`);
    console.log(`[NotificationChecker]   SMS: ${smsEnabled}`);
    console.log(`[NotificationChecker]   Telegram: ${telegramEnabled}`);
    console.log(`[NotificationChecker]   Browser Push: ${pushEnabled}`);
    console.log(`[NotificationChecker]   user.browserNotifications value: "${user.browserNotifications}"`);

    if (!emailEnabled && !whatsappEnabled && !smsEnabled && !telegramEnabled && !pushEnabled) {
      console.log(`[NotificationChecker] No notification channels enabled for ${user.username}`);
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
      console.log(`[NotificationChecker] ℹ️ No expiring items for ${user.username} (threshold: ${notificationDays} days)`);
      return null;
    }

    console.log(`[NotificationChecker] 🎯 User ${user.username} has ${expiringItems.length} expiring items`);
    expiringItems.forEach(item => {
      const expiryDate = new Date(item.expiryDate);
      const daysLeft = Math.ceil((expiryDate.getTime() - new Date().setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24));
      console.log(`[NotificationChecker]    - ${item.name}: expires in ${daysLeft} days`);
    });

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
      console.log(`[NotificationChecker] 📧 Attempting to send email notification...`);
      result.emailSent = await emailService.sendExpiryNotification(user, expiringItems);
      console.log(`[NotificationChecker] Email result: ${result.emailSent ? '✅ Sent' : '❌ Failed'}`);
    } else {
      console.log(`[NotificationChecker] ⏭️ Skipping email (enabled: ${emailEnabled}, configured: ${emailService.isConfigured()})`);
    }

    // Send WhatsApp notification (try free Cloud API first, then Twilio)
    if (whatsappEnabled) {
      console.log(`[NotificationChecker] 📱 Attempting to send WhatsApp notification...`);
      console.log(`[NotificationChecker] User mobile: ${user.mobile}`);

      if (whatsappCloudService.isConfigured()) {
        console.log(`[NotificationChecker] Using WhatsApp Cloud API...`);
        result.whatsappSent = await whatsappCloudService.sendExpiryNotification(user, expiringItems);
      } else if (whatsappService.isConfigured()) {
        console.log(`[NotificationChecker] Using Twilio WhatsApp...`);
        result.whatsappSent = await whatsappService.sendExpiryNotification(user, expiringItems);
      } else {
        console.log(`[NotificationChecker] ⚠️ WhatsApp enabled but no service configured`);
      }
      console.log(`[NotificationChecker] WhatsApp result: ${result.whatsappSent ? '✅ Sent' : '❌ Failed'}`);

      if (!result.whatsappSent) {
        console.log(`[NotificationChecker] 🔍 WhatsApp troubleshooting:`);
        console.log(`[NotificationChecker]    - Check if user joined Twilio sandbox`);
        console.log(`[NotificationChecker]    - Verify mobile number format: ${user.mobile}`);
        console.log(`[NotificationChecker]    - Check server logs for detailed error`);
      }
    } else {
      console.log(`[NotificationChecker] ⏭️ Skipping WhatsApp (not enabled for user)`);
      console.log(`[NotificationChecker] 💡 Enable WhatsApp in Profile → Notification Settings`);
    }

    // Send SMS notification
    if (smsEnabled && smsService.isConfigured()) {
      console.log(`[NotificationChecker] 📲 Attempting to send SMS notification...`);
      result.smsSent = await smsService.sendExpiryNotification(user, expiringItems);
      console.log(`[NotificationChecker] SMS result: ${result.smsSent ? '✅ Sent' : '❌ Failed'}`);
    } else {
      console.log(`[NotificationChecker] ⏭️ Skipping SMS (enabled: ${smsEnabled}, configured: ${smsService.isConfigured()})`);
    }

    // Send Telegram notification
    if (telegramEnabled && telegramService.isConfigured()) {
      console.log(`[NotificationChecker] 💬 Attempting to send Telegram notification...`);
      result.telegramSent = await telegramService.sendExpiryNotification(user, expiringItems);
      console.log(`[NotificationChecker] Telegram result: ${result.telegramSent ? '✅ Sent' : '❌ Failed'}`);
    } else {
      console.log(`[NotificationChecker] ⏭️ Skipping Telegram (enabled: ${telegramEnabled}, configured: ${telegramService.isConfigured()})`);
    }

    // Send Push Notification
    if (pushEnabled && pushService.isConfigured()) {
      console.log(`[NotificationChecker] 🔔 Attempting to send browser push notification...`);
      result.pushSent = await pushService.sendExpiryNotification(user, expiringItems);
      console.log(`[NotificationChecker] Browser Push result: ${result.pushSent ? '✅ Sent' : '❌ Failed'}`);
    } else {
      console.log(`[NotificationChecker] ⏭️ Skipping browser push (enabled: ${pushEnabled}, configured: ${pushService.isConfigured()})`);
    }

    // Record that notification was sent (even if only some channels succeeded)
    if (result.emailSent || result.whatsappSent || result.smsSent || result.telegramSent || result.pushSent) {
      await this.recordNotification(user.id);
      console.log(`[NotificationChecker] ✅ Notification sent to ${user.username}, recorded for frequency tracking`);
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
