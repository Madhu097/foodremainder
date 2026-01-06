import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, loginSchema, insertFoodItemSchema } from "@shared/schema";
import { z } from "zod";
import { createHash } from "crypto";
import { emailService } from "./emailService";
import { whatsappService } from "./whatsappService";
import { whatsappCloudService } from "./whatsappCloudService";
import { whatsappVerificationService } from "./whatsappVerificationService";
import { smsService } from "./smsService";
import { telegramService } from "./telegramService";
import { pushService } from "./pushService";
import { notificationChecker } from "./notificationChecker";

// Simple password hashing (in production, use bcrypt)
function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Test endpoint to verify API is working
  app.get("/api/health", (req: Request, res: Response) => {
    res.status(200).json({
      status: "ok",
      message: "API is working",
      timestamp: new Date().toISOString(),
      services: {
        email: emailService.isConfigured(),
        whatsapp: whatsappService.isConfigured(),
        whatsappCloud: whatsappCloudService.isConfigured(),
        telegram: telegramService.isConfigured(),
        push: pushService.isConfigured(),
      },
      cors: {
        origin: req.headers.origin || 'none',
        host: req.headers.host,
      }
    });
  });

  // Optimized batch endpoint - fetch user data and food items in one request
  app.get("/api/dashboard/:userId", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;

      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }

      // Set cache headers for faster subsequent loads
      res.setHeader('Cache-Control', 'private, max-age=60');

      // Fetch user and items in parallel for better performance
      const [user, items] = await Promise.all([
        storage.getUser(userId),
        storage.getFoodItemsByUserId(userId)
      ]);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Calculate status and days left on server-side
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const itemsWithStatus = items.map(item => {
        const expiryDate = new Date(item.expiryDate);
        expiryDate.setHours(0, 0, 0, 0);

        const daysLeft = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        let status: "fresh" | "expiring" | "expired" = "fresh";
        if (daysLeft < 0) {
          status = "expired";
        } else if (daysLeft <= 3) {
          status = "expiring";
        }

        return {
          ...item,
          status,
          daysLeft,
        };
      });

      // Don't send password back
      const { password, ...userWithoutPassword } = user;

      res.status(200).json({
        user: userWithoutPassword,
        items: itemsWithStatus
      });
    } catch (error: any) {
      console.error("[Dashboard] Error:", error);
      res.status(500).json({ message: "Failed to load dashboard data", error: error?.message });
    }
  });

  // CORS test endpoint
  app.get("/api/test-cors", (req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      message: "CORS is working correctly",
      origin: req.headers.origin,
    });
  });

  // Register new user
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    console.log("[Auth] Registration request received");
    try {
      const validatedData = insertUserSchema.parse(req.body);

      // Normalize mobile number: add +91 if no country code
      let mobile = validatedData.mobile.trim();
      if (!mobile.startsWith('+')) {
        mobile = '+91' + mobile;
        console.log(`[Auth] Auto-added +91 prefix to mobile: ${mobile}`);
      }

      // Check if username already exists
      const existingUsername = await storage.getUserByUsername(validatedData.username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Check if email already exists
      const existingEmail = await storage.getUserByEmail(validatedData.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already registered" });
      }

      // Check if mobile already exists
      const existingMobile = await storage.getUserByMobile(mobile);
      if (existingMobile) {
        return res.status(400).json({ message: "Mobile number already registered" });
      }

      // Hash password
      const hashedPassword = hashPassword(validatedData.password);

      // Create user with normalized mobile number
      const user = await storage.createUser({
        ...validatedData,
        mobile: mobile,
        password: hashedPassword,
      });

      // Don't send password back
      const { password, ...userWithoutPassword } = user;

      res.status(201).json({
        message: "Registration successful",
        user: userWithoutPassword
      });
    } catch (error) {
      console.error("[Auth] Registration error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Validation error",
          errors: error.errors
        });
      }
      return res.status(500).json({
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Login user
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    console.log("[Auth] Login request received");
    try {
      const validatedData = loginSchema.parse(req.body);

      // Normalize identifier: if it's a mobile number without country code, add +91
      let identifier = validatedData.identifier.trim();

      // Check if identifier looks like a mobile number (only digits, possibly with +)
      const isMobileNumber = /^[+]?[0-9]{10,15}$/.test(identifier);
      if (isMobileNumber && !identifier.startsWith('+')) {
        identifier = '+91' + identifier;
        console.log(`[Auth] Auto-added +91 prefix to login identifier: ${identifier}`);
      }

      // Find user by email or mobile
      const user = await storage.getUserByEmailOrMobile(identifier);

      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Verify password
      const isValidPassword = verifyPassword(validatedData.password, user.password);

      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Don't send password back
      const { password, ...userWithoutPassword } = user;

      res.status(200).json({
        message: "Login successful",
        user: userWithoutPassword
      });
    } catch (error) {
      console.error("[Auth] Login error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Validation error",
          errors: error.errors
        });
      }
      return res.status(500).json({
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Get current user (check if logged in)
  app.get("/api/auth/user", async (req: Request, res: Response) => {
    // In a real app, you'd get userId from session/token
    // For now, return null as we don't have session management yet
    res.status(200).json({ user: null });
  });

  // Reset password (forgot password)
  app.post("/api/auth/reset-password", async (req: Request, res: Response) => {
    try {
      const { identifier, newPassword } = req.body;

      if (!identifier || !newPassword) {
        return res.status(400).json({ message: "Email/mobile and new password are required" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }

      // Normalize identifier: if it's a mobile number without country code, add +91
      let normalizedIdentifier = identifier.trim();
      const isMobileNumber = /^[+]?[0-9]{10,15}$/.test(normalizedIdentifier);
      if (isMobileNumber && !normalizedIdentifier.startsWith('+')) {
        normalizedIdentifier = '+91' + normalizedIdentifier;
        console.log(`[Auth] Auto-added +91 prefix to reset identifier: ${normalizedIdentifier}`);
      }

      // Find user by email or mobile
      const user = await storage.getUserByEmailOrMobile(normalizedIdentifier);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Hash new password
      const hashedPassword = hashPassword(newPassword);

      // Update password
      const updated = await storage.updateUserPassword(user.id, hashedPassword);

      if (!updated) {
        return res.status(500).json({ message: "Failed to update password" });
      }

      res.status(200).json({ message: "Password reset successfully" });
    } catch (error) {
      console.error("[Auth] Reset password error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Change password (for logged-in users)
  app.post("/api/auth/change-password", async (req: Request, res: Response) => {
    try {
      const { userId, currentPassword, newPassword } = req.body;

      if (!userId || !currentPassword || !newPassword) {
        return res.status(400).json({ message: "All fields are required" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: "New password must be at least 6 characters" });
      }

      // Get user
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Verify current password
      const isValidPassword = verifyPassword(currentPassword, user.password);

      if (!isValidPassword) {
        return res.status(401).json({ message: "Current password is incorrect" });
      }

      // Hash new password
      const hashedPassword = hashPassword(newPassword);

      // Update password
      const updated = await storage.updateUserPassword(userId, hashedPassword);

      if (!updated) {
        return res.status(500).json({ message: "Failed to update password" });
      }

      res.status(200).json({ message: "Password changed successfully" });
    } catch (error) {
      console.error("[Auth] Change password error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Update user profile (username, email, profilePicture)
  app.put("/api/auth/update-profile", async (req: Request, res: Response) => {
    try {
      const { userId, username, email, profilePicture } = req.body;

      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }

      // Check if trying to update to existing username/email
      if (username) {
        const existingUsername = await storage.getUserByUsername(username);
        if (existingUsername && existingUsername.id !== userId) {
          return res.status(400).json({ message: "Username already taken" });
        }
      }

      if (email) {
        const existingEmail = await storage.getUserByEmail(email);
        if (existingEmail && existingEmail.id !== userId) {
          return res.status(400).json({ message: "Email already registered" });
        }
      }

      const updated = await storage.updateUserProfile(userId, {
        username,
        email,
        profilePicture
      });

      if (!updated) {
        return res.status(404).json({ message: "User not found" });
      }

      // Return updated user info
      const user = await storage.getUser(userId);
      if (user) {
        const { password, ...userWithoutPassword } = user;
        res.status(200).json({
          message: "Profile updated successfully",
          user: userWithoutPassword
        });
      } else {
        res.status(500).json({ message: "Failed to fetch updated user" });
      }
    } catch (error) {
      console.error("[Auth] Update profile error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ===== FOOD ITEMS ROUTES =====

  // Get all food items for a user
  app.get("/api/food-items/:userId", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;

      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }

      // Add cache headers (30 seconds)
      res.setHeader('Cache-Control', 'private, max-age=30');
      res.setHeader('ETag', `food-items-${userId}-${Date.now()}`);

      const items = await storage.getFoodItemsByUserId(userId);

      // Calculate status and days left on server-side to reduce client processing
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const itemsWithStatus = items.map(item => {
        const expiryDate = new Date(item.expiryDate);
        expiryDate.setHours(0, 0, 0, 0);

        const daysLeft = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        let status: "fresh" | "expiring" | "expired" = "fresh";
        if (daysLeft < 0) {
          status = "expired";
        } else if (daysLeft <= 3) {
          status = "expiring";
        }

        return {
          ...item,
          status,
          daysLeft,
        };
      });

      res.status(200).json({ items: itemsWithStatus });
    } catch (error: any) {
      console.error("[FoodItems] Get items error:", error);
      console.error("[FoodItems] Error message:", error?.message);
      console.error("[FoodItems] Error stack:", error?.stack);
      res.status(500).json({ message: "Failed to fetch food items", error: error?.message });
    }
  });

  // Create new food item
  app.post("/api/food-items", async (req: Request, res: Response) => {
    try {
      const { userId, ...itemData } = req.body;

      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }

      const validatedData = insertFoodItemSchema.parse(itemData);
      const item = await storage.createFoodItem(userId, validatedData);

      res.status(201).json({ message: "Food item created", item });
    } catch (error) {
      console.error("[FoodItems] Create item error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Validation error",
          errors: error.errors
        });
      }
      res.status(500).json({ message: "Failed to create food item" });
    }
  });

  // Update food item
  app.put("/api/food-items/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { userId, ...updateData } = req.body;

      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }

      const item = await storage.updateFoodItem(id, userId, updateData);

      if (!item) {
        return res.status(404).json({ message: "Food item not found or unauthorized" });
      }

      res.status(200).json({ message: "Food item updated", item });
    } catch (error) {
      console.error("[FoodItems] Update item error:", error);
      res.status(500).json({ message: "Failed to update food item" });
    }
  });

  // Delete food item
  app.delete("/api/food-items/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }

      const success = await storage.deleteFoodItem(id, userId);

      if (!success) {
        return res.status(404).json({ message: "Food item not found or unauthorized" });
      }

      res.status(200).json({ message: "Food item deleted" });
    } catch (error) {
      console.error("[FoodItems] Delete item error:", error);
      res.status(500).json({ message: "Failed to delete food item" });
    }
  });

  // ===== NOTIFICATION ROUTES =====

  // Get notification preferences for a user
  app.get("/api/notifications/preferences/:userId", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      console.log(`[Notifications] Fetching preferences for user: ${userId}`);
      const user = await storage.getUser(userId);

      if (!user) {
        console.error(`[Notifications] ❌ User not found in database: ${userId}`);
        return res.status(404).json({ message: "User not found" });
      }

      console.log(`[Notifications] ✅ User found: ${user.username}`);

      res.status(200).json({
        emailNotifications: user.emailNotifications === "true",
        whatsappNotifications: user.whatsappNotifications === "true",
        smsNotifications: user.smsNotifications === "true",
        telegramNotifications: user.telegramNotifications === "true",
        telegramChatId: user.telegramChatId || null,
        notificationDays: parseInt(user.notificationDays || "3"),
        notificationsPerDay: parseInt(user.notificationsPerDay || "24"),
        browserNotifications: user.browserNotifications === "true",
        quietHoursStart: user.quietHoursStart,
        quietHoursEnd: user.quietHoursEnd,
        servicesConfigured: {
          email: emailService.isConfigured(),
          whatsapp: whatsappService.isConfigured(),
          whatsappCloud: whatsappCloudService.isConfigured(),
          sms: smsService.isConfigured(),
          telegram: telegramService.isConfigured(),
          push: pushService.isConfigured(),
        },
      });
    } catch (error) {
      console.error("[Notifications] Get preferences error:", error);
      res.status(500).json({ message: "Failed to fetch notification preferences" });
    }
  });

  // Update notification preferences for a user
  app.put("/api/notifications/preferences/:userId", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const {
        emailNotifications,
        whatsappNotifications,
        smsNotifications,
        telegramNotifications,
        telegramChatId,
        notificationDays,
        notificationsPerDay,
        browserNotifications,
        quietHoursStart,
        quietHoursEnd
      } = req.body;

      console.log(`[Notifications] Updating preferences for user: ${userId}`);
      console.log(`[Notifications] Request body:`, req.body);
      console.log(`[Notifications] whatsappNotifications value:`, whatsappNotifications, typeof whatsappNotifications);
      console.log(`[Notifications] browserNotifications value:`, browserNotifications, typeof browserNotifications);

      const preferences: any = {};
      if (typeof emailNotifications === "boolean") {
        preferences.emailNotifications = emailNotifications ? "true" : "false";
      }
      if (typeof whatsappNotifications === "boolean") {
        preferences.whatsappNotifications = whatsappNotifications ? "true" : "false";
        console.log(`[Notifications] Setting whatsappNotifications to: "${preferences.whatsappNotifications}"`);
      }
      if (typeof smsNotifications === "boolean") {
        preferences.smsNotifications = smsNotifications ? "true" : "false";
      }
      if (typeof telegramNotifications === "boolean") {
        preferences.telegramNotifications = telegramNotifications ? "true" : "false";
      }
      if (typeof browserNotifications === "boolean") {
        preferences.browserNotifications = browserNotifications ? "true" : "false";
        console.log(`[Notifications] Setting browserNotifications to: "${preferences.browserNotifications}"`);
      }
      if (telegramChatId !== undefined) {
        preferences.telegramChatId = telegramChatId;
      }
      if (quietHoursStart !== undefined) preferences.quietHoursStart = quietHoursStart;
      if (quietHoursEnd !== undefined) preferences.quietHoursEnd = quietHoursEnd;

      if (typeof notificationDays === "number" && notificationDays > 0) {
        preferences.notificationDays = notificationDays.toString();
      }
      if (typeof notificationsPerDay === "number" && notificationsPerDay >= 1 && notificationsPerDay <= 24) {
        preferences.notificationsPerDay = notificationsPerDay.toString();
      }

      console.log(`[Notifications] Preferences to save:`, preferences);

      const updated = await storage.updateNotificationPreferences(userId, preferences);

      if (!updated) {
        return res.status(404).json({ message: "User not found" });
      }

      console.log(`[Notifications] ✅ Preferences updated successfully for user: ${userId}`);

      res.status(200).json({
        message: "Notification preferences updated successfully",
        preferences
      });
    } catch (error) {
      console.error("[Notifications] Update preferences error:", error);
      res.status(500).json({ message: "Failed to update notification preferences" });
    }
  });

  // Delete user account
  app.delete("/api/user/:userId", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      console.log(`[User] Delete account request for user: ${userId}`);

      // Delete user's food items first
      const foodItems = await storage.getFoodItemsByUserId(userId);
      for (const item of foodItems) {
        await storage.deleteFoodItem(item.id, userId);
      }
      console.log(`[User] Deleted ${foodItems.length} food items`);

      // Delete user
      const deleted = await storage.deleteUser(userId);
      if (!deleted) {
        return res.status(404).json({ message: "User not found" });
      }

      console.log(`[User] ✅ Account deleted successfully: ${userId}`);
      res.status(200).json({ message: "Account deleted successfully" });
    } catch (error) {
      console.error("[User] Delete account error:", error);
      res.status(500).json({ message: "Failed to delete account" });
    }
  });

  // Test notification for a user (send notification immediately)
  app.post("/api/notifications/test/:userId", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const result = await notificationChecker.testNotification(userId);

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error("[Notifications] Test notification error:", error);
      res.status(500).json({ message: "Failed to send test notification" });
    }
  });

  // Manual trigger to check all users and send notifications
  // This endpoint can be called by external cron services for serverless deployments
  // Changed to use (GET/POST) as Vercel Cron uses GET
  app.use("/api/notifications/check-all", async (req: Request, res: Response) => {
    if (req.method !== 'GET' && req.method !== 'POST') {
      return res.status(405).json({ message: "Method Not Allowed" });
    }

    try {
      console.log(`[Notifications] ========================================`);
      console.log(`[Notifications] 🔔 Check-all triggered. Method: ${req.method}`);
      console.log(`[Notifications] Time: ${new Date().toISOString()}`);
      console.log(`[Notifications] Headers:`, JSON.stringify(req.headers, null, 2));
      console.log(`[Notifications] Query:`, JSON.stringify(req.query, null, 2));
      console.log(`[Notifications] ========================================`);

      // Authentication Logic
      const authHeader = req.headers.authorization;
      const cronSecret = process.env.CRON_SECRET;

      const apiKey = req.headers['x-api-key'] || req.query.apiKey;
      const expectedApiKey = process.env.NOTIFICATION_API_KEY;

      const isDevelopment = process.env.NODE_ENV !== 'production';

      let authorized = false;
      let authMethod = 'none';

      // 1. Check Vercel Cron Secret (Standard Vercel Cron)
      if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
        console.log("[Notifications] ✅ Authorized via Vercel Cron Secret");
        authorized = true;
        authMethod = 'vercel-cron';
      }
      // 2. Check API Key (Manual invocation)
      else if (expectedApiKey && apiKey === expectedApiKey) {
        console.log("[Notifications] ✅ Authorized via API Key");
        authorized = true;
        authMethod = 'api-key';
      }
      // 3. Development mode - allow without auth (but warn)
      else if (isDevelopment) {
        console.log("[Notifications] ⚠️ Development mode - allowing request without authentication");
        console.log("[Notifications] 💡 In production, set CRON_SECRET or NOTIFICATION_API_KEY");
        authorized = true;
        authMethod = 'dev-mode';
      }
      // 4. If neither secret is configured on the server, allow (but warn)
      else if (!cronSecret && !expectedApiKey) {
        console.log("[Notifications] ⚠️ No secrets configured - allowing request (INSECURE)");
        console.log("[Notifications] 💡 Set CRON_SECRET or NOTIFICATION_API_KEY environment variable");
        authorized = true;
        authMethod = 'no-auth';
      }

      if (!authorized) {
        console.error("[Notifications] ❌ Unauthorized access attempt");
        console.error("[Notifications] Expected CRON_SECRET:", cronSecret ? 'SET' : 'NOT SET');
        console.error("[Notifications] Expected NOTIFICATION_API_KEY:", expectedApiKey ? 'SET' : 'NOT SET');
        console.error("[Notifications] Received Authorization:", authHeader ? 'PROVIDED' : 'MISSING');
        console.error("[Notifications] Received API Key:", apiKey ? 'PROVIDED' : 'MISSING');
        return res.status(401).json({
          message: "Unauthorized",
          detail: "Set CRON_SECRET or NOTIFICATION_API_KEY, or ensure NODE_ENV is not 'production'"
        });
      }

      console.log("[Notifications] 🔔 Starting notification check...");
      const startTime = Date.now();
      const results = await notificationChecker.checkAndNotifyAll();
      const duration = Date.now() - startTime;

      console.log(`[Notifications] ✅ Check completed in ${duration}ms`);

      res.status(200).json({
        success: true,
        message: "Notification check completed",
        notificationsSent: results.length,
        results,
        authMethod,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("[Notifications] ❌ Check all error:", error);
      console.error("[Notifications] Stack trace:", error instanceof Error ? error.stack : 'No stack');
      res.status(500).json({ 
        success: false,
        message: "Failed to check notifications",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Get VAPID Public Key
  app.get("/api/notifications/vapid-public-key", (req: Request, res: Response) => {
    const key = pushService.getPublicKey();
    if (!key) {
      return res.status(500).json({ message: "VAPID key not configured" });
    }
    res.json({ publicKey: key });
  });

  // Subscribe to push notifications
  app.post("/api/notifications/subscribe", async (req: Request, res: Response) => {
    try {
      const { userId, subscription } = req.body;

      if (!userId || !subscription) {
        return res.status(400).json({ message: "User ID and subscription required" });
      }

      // Add subscription to user
      const success = await storage.addPushSubscription(userId, JSON.stringify(subscription));

      if (!success) {
        return res.status(404).json({ message: "User not found" });
      }

      res.status(200).json({ message: "Subscription added successfully" });
    } catch (error) {
      console.error("[Push] Subscription error:", error);
      res.status(500).json({ message: "Failed to subscribe" });
    }
  });

  // Get Telegram Bot configuration
  app.get("/api/notifications/telegram-config", (req: Request, res: Response) => {
    res.json({
      botUsername: telegramService.getBotUsername()
    });
  });

  // WhatsApp Verification Routes

  // Request WhatsApp verification code
  app.post("/api/notifications/whatsapp/request-code", async (req: Request, res: Response) => {
    try {
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const result = await whatsappVerificationService.sendVerificationCode(user);

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error("[WhatsApp] Request code error:", error);
      res.status(500).json({ message: "Failed to send verification code" });
    }
  });

  // Verify WhatsApp code
  app.post("/api/notifications/whatsapp/verify-code", async (req: Request, res: Response) => {
    try {
      const { userId, code } = req.body;

      if (!userId || !code) {
        return res.status(400).json({ message: "User ID and code are required" });
      }

      const result = await whatsappVerificationService.verifyCode(userId, code);

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error("[WhatsApp] Verify code error:", error);
      res.status(500).json({ message: "Failed to verify code" });
    }
  });

  // Get WhatsApp verification status
  app.get("/api/notifications/whatsapp/status/:userId", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;

      const status = await whatsappVerificationService.getVerificationStatus(userId);
      res.status(200).json(status);
    } catch (error) {
      console.error("[WhatsApp] Status check error:", error);
      res.status(500).json({ message: "Failed to check verification status" });
    }
  });

  // Disconnect WhatsApp
  app.post("/api/notifications/whatsapp/disconnect", async (req: Request, res: Response) => {
    try {
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }

      const result = await whatsappVerificationService.disconnectWhatsApp(userId);

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error("[WhatsApp] Disconnect error:", error);
      res.status(500).json({ message: "Failed to disconnect WhatsApp" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
