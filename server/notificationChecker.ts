import { storage } from "./storage";
import { emailService } from "./emailService";
import { whatsappService } from "./whatsappService";
import type { FoodItem, User } from "@shared/schema";

interface NotificationResult {
  userId: string;
  username: string;
  itemCount: number;
  emailSent: boolean;
  whatsappSent: boolean;
}

class NotificationChecker {
  /**
   * Check all users for expiring food items and send notifications
   */
  async checkAndNotifyAll(): Promise<NotificationResult[]> {
    console.log("[NotificationChecker] Starting notification check...");
    
    const results: NotificationResult[] = [];

    try {
      // Get all users
      const users = await storage.getAllUsers();
      console.log(`[NotificationChecker] Found ${users.length} users to check`);

      for (const user of users) {
        try {
          const result = await this.checkAndNotifyUser(user);
          if (result) {
            results.push(result);
          }
        } catch (error) {
          console.error(`[NotificationChecker] Error checking user ${user.id}:`, error);
        }
      }

      console.log(`[NotificationChecker] Notification check completed. Sent ${results.length} notifications.`);
      return results;
    } catch (error) {
      console.error("[NotificationChecker] Error during notification check:", error);
      return results;
    }
  }

  /**
   * Check and notify a specific user
   */
  async checkAndNotifyUser(user: User): Promise<NotificationResult | null> {
    // Check if user has any notifications enabled
    const emailEnabled = user.emailNotifications === "true";
    const whatsappEnabled = user.whatsappNotifications === "true";

    if (!emailEnabled && !whatsappEnabled) {
      return null;
    }

    // Get user's notification days threshold (default: 3 days)
    const notificationDays = parseInt(user.notificationDays || "3");

    // Get user's food items
    const foodItems = await storage.getFoodItemsByUserId(user.id);

    // Filter expiring items based on notification threshold
    const expiringItems = this.getExpiringItems(foodItems, notificationDays);

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
    };

    // Send email notification
    if (emailEnabled && emailService.isConfigured()) {
      result.emailSent = await emailService.sendExpiryNotification(user, expiringItems);
    }

    // Send WhatsApp notification
    if (whatsappEnabled && whatsappService.isConfigured()) {
      result.whatsappSent = await whatsappService.sendExpiryNotification(user, expiringItems);
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

      const result = await this.checkAndNotifyUser(user);

      if (!result) {
        return { 
          success: false, 
          message: "No expiring items found or notifications are disabled" 
        };
      }

      const sentMethods = [];
      if (result.emailSent) sentMethods.push("email");
      if (result.whatsappSent) sentMethods.push("WhatsApp");

      if (sentMethods.length === 0) {
        return { 
          success: false, 
          message: "Notification services not configured" 
        };
      }

      return {
        success: true,
        message: `Test notification sent via ${sentMethods.join(" and ")} for ${result.itemCount} expiring item(s)`,
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
