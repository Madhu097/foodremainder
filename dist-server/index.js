var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/firebase.ts
import admin from "firebase-admin";
var firebaseApp, db;
var init_firebase = __esm({
  "server/firebase.ts"() {
    "use strict";
    try {
      if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
        let privateKey = process.env.FIREBASE_PRIVATE_KEY;
        privateKey = privateKey.replace(/^["']|["']$/g, "");
        privateKey = privateKey.replace(/\\n/g, "\n");
        if (!privateKey.includes("BEGIN PRIVATE KEY") || !privateKey.includes("END PRIVATE KEY")) {
          throw new Error('FIREBASE_PRIVATE_KEY appears to be malformed. It should start with "-----BEGIN PRIVATE KEY-----" and end with "-----END PRIVATE KEY-----"');
        }
        console.log("[Firebase] \u{1F511} Private key format validated");
        if (!admin.apps.length) {
          firebaseApp = admin.initializeApp({
            credential: admin.credential.cert({
              projectId: process.env.FIREBASE_PROJECT_ID,
              privateKey,
              clientEmail: process.env.FIREBASE_CLIENT_EMAIL
            })
          });
          console.log("[Firebase] \u2705 Initialized new Firebase instance");
        } else {
          firebaseApp = admin.app();
          console.log("[Firebase] \u267B\uFE0F  Reusing existing Firebase instance");
        }
        db = firebaseApp.firestore();
        console.log("[Firebase] \u2705 Connected to Firebase Firestore");
      } else {
        console.log("[Firebase] \u26A0\uFE0F  Firebase credentials not configured");
        console.log("[Firebase] \u{1F4A1} Set FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, and FIREBASE_CLIENT_EMAIL in .env");
      }
    } catch (error) {
      console.error("[Firebase] \u274C Failed to initialize Firebase:", error instanceof Error ? error.message : error);
      if (error instanceof Error && error.message.includes("DECODER")) {
        console.error("[Firebase] \u{1F4A1} This error usually means FIREBASE_PRIVATE_KEY is incorrectly formatted");
        console.error('[Firebase] \u{1F4D6} In Render, the value should be: "-----BEGIN PRIVATE KEY-----\\nYourKey...\\n-----END PRIVATE KEY-----\\n"');
        console.error("[Firebase] \u26A0\uFE0F  Make sure to include the double quotes and use \\n (not actual newlines)");
      }
    }
  }
});

// server/firebaseStorage.ts
var firebaseStorage_exports = {};
__export(firebaseStorage_exports, {
  FirebaseStorage: () => FirebaseStorage
});
import { randomUUID } from "crypto";
import admin2 from "firebase-admin";
var Cache, FirebaseStorage;
var init_firebaseStorage = __esm({
  "server/firebaseStorage.ts"() {
    "use strict";
    init_firebase();
    Cache = class {
      cache = /* @__PURE__ */ new Map();
      ttl;
      constructor(ttlSeconds = 30) {
        this.ttl = ttlSeconds * 1e3;
      }
      get(key) {
        const item = this.cache.get(key);
        if (!item) return null;
        const now = Date.now();
        if (now - item.timestamp > this.ttl) {
          this.cache.delete(key);
          return null;
        }
        return item.data;
      }
      set(key, data) {
        this.cache.set(key, { data, timestamp: Date.now() });
      }
      invalidate(key) {
        this.cache.delete(key);
      }
      invalidatePattern(pattern) {
        for (const key of Array.from(this.cache.keys())) {
          if (key.includes(pattern)) {
            this.cache.delete(key);
          }
        }
      }
      clear() {
        this.cache.clear();
      }
    };
    FirebaseStorage = class {
      // Caches with longer TTL for better performance
      userCache = new Cache(120);
      // 2 minutes
      foodItemsCache = new Cache(60);
      // 1 minute
      allUsersCache = new Cache(180);
      // 3 minutes for all users
      constructor() {
        if (!db) {
          throw new Error("Firebase Firestore not initialized. Check Firebase configuration.");
        }
        console.log("[FirebaseStorage] \u2705 Initialized with enhanced caching (60-180s TTL)");
      }
      // User methods
      async getUser(id) {
        if (!db) throw new Error("Firestore not initialized");
        const cached = this.userCache.get(id);
        if (cached) {
          return cached;
        }
        console.log(`[FirebaseStorage] \u{1F4BE} Fetching user from database: ${id}`);
        const doc = await db.collection("users").doc(id).get();
        if (!doc.exists) return void 0;
        const user = { id: doc.id, ...doc.data() };
        this.userCache.set(id, user);
        return user;
      }
      async getAllUsers() {
        if (!db) throw new Error("Firestore not initialized");
        const cached = this.allUsersCache.get("all");
        if (cached) {
          return cached;
        }
        console.log(`[FirebaseStorage] \u{1F4BE} Fetching all users from database`);
        const snapshot = await db.collection("users").get();
        const users = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        console.log(`[FirebaseStorage] \u2705 Retrieved ${users.length} users from database`);
        const notificationStats = {
          email: users.filter((u) => u.emailNotifications === "true").length,
          whatsapp: users.filter((u) => u.whatsappNotifications === "true").length,
          sms: users.filter((u) => u.smsNotifications === "true").length,
          telegram: users.filter((u) => u.telegramNotifications === "true").length,
          browser: users.filter((u) => u.browserNotifications === "true").length
        };
        console.log(`[FirebaseStorage] \u{1F4CA} Notification preferences summary:`);
        console.log(`[FirebaseStorage]    Email enabled: ${notificationStats.email}/${users.length}`);
        console.log(`[FirebaseStorage]    WhatsApp enabled: ${notificationStats.whatsapp}/${users.length}`);
        console.log(`[FirebaseStorage]    SMS enabled: ${notificationStats.sms}/${users.length}`);
        console.log(`[FirebaseStorage]    Telegram enabled: ${notificationStats.telegram}/${users.length}`);
        console.log(`[FirebaseStorage]    Browser enabled: ${notificationStats.browser}/${users.length}`);
        this.allUsersCache.set("all", users);
        return users;
      }
      async getUserByUsername(username) {
        if (!db) throw new Error("Firestore not initialized");
        const cacheKey = `username:${username}`;
        const cached = this.userCache.get(cacheKey);
        if (cached) {
          return cached;
        }
        console.log(`[FirebaseStorage] \u{1F4BE} Fetching user by username: ${username}`);
        const snapshot = await db.collection("users").where("username", "==", username).limit(1).get();
        if (snapshot.empty) return void 0;
        const doc = snapshot.docs[0];
        const user = { id: doc.id, ...doc.data() };
        this.userCache.set(cacheKey, user);
        this.userCache.set(user.id, user);
        return user;
      }
      async getUserByEmail(email) {
        if (!db) throw new Error("Firestore not initialized");
        const cacheKey = `email:${email}`;
        const cached = this.userCache.get(cacheKey);
        if (cached) {
          return cached;
        }
        console.log(`[FirebaseStorage] \u{1F4BE} Fetching user by email: ${email}`);
        const snapshot = await db.collection("users").where("email", "==", email).limit(1).get();
        if (snapshot.empty) return void 0;
        const doc = snapshot.docs[0];
        const user = { id: doc.id, ...doc.data() };
        this.userCache.set(cacheKey, user);
        this.userCache.set(user.id, user);
        return user;
      }
      async getUserByMobile(mobile) {
        if (!db) throw new Error("Firestore not initialized");
        const cacheKey = `mobile:${mobile}`;
        const cached = this.userCache.get(cacheKey);
        if (cached) {
          return cached;
        }
        console.log(`[FirebaseStorage] \u{1F4BE} Fetching user by mobile: ${mobile}`);
        const snapshot = await db.collection("users").where("mobile", "==", mobile).limit(1).get();
        if (snapshot.empty) return void 0;
        const doc = snapshot.docs[0];
        const user = { id: doc.id, ...doc.data() };
        this.userCache.set(cacheKey, user);
        this.userCache.set(user.id, user);
        return user;
      }
      async getUserByEmailOrMobile(identifier) {
        if (!db) throw new Error("Firestore not initialized");
        let user = await this.getUserByEmail(identifier);
        if (user) return user;
        return await this.getUserByMobile(identifier);
      }
      async createUser(insertUser) {
        if (!db) throw new Error("Firestore not initialized");
        const id = randomUUID();
        const user = {
          ...insertUser,
          id,
          emailNotifications: "true",
          whatsappNotifications: "false",
          smsNotifications: "false",
          telegramNotifications: "false",
          telegramChatId: null,
          notificationDays: "3",
          notificationsPerDay: "4",
          pushSubscriptions: [],
          profilePicture: "default",
          browserNotifications: "false",
          quietHoursStart: null,
          quietHoursEnd: null,
          lastNotificationSentAt: null,
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        };
        await db.collection("users").doc(id).set(user);
        this.userCache.set(id, user);
        this.allUsersCache.clear();
        console.log(`[FirebaseStorage] \u2705 Created user: ${user.username}`);
        return user;
      }
      async updateUserPassword(userId, newPasswordHash) {
        if (!db) throw new Error("Firestore not initialized");
        try {
          await db.collection("users").doc(userId).update({
            password: newPasswordHash
          });
          this.userCache.invalidate(userId);
          this.allUsersCache.clear();
          return true;
        } catch (error) {
          return false;
        }
      }
      async updateUserProfile(userId, profile) {
        if (!db) throw new Error("Firestore not initialized");
        try {
          const updateData = {};
          if (profile.username !== void 0) updateData.username = profile.username;
          if (profile.email !== void 0) updateData.email = profile.email;
          if (profile.profilePicture !== void 0) updateData.profilePicture = profile.profilePicture;
          await db.collection("users").doc(userId).update(updateData);
          this.userCache.invalidate(userId);
          this.userCache.invalidatePattern(userId);
          this.allUsersCache.clear();
          return true;
        } catch (error) {
          return false;
        }
      }
      async updateLastNotificationTime(userId) {
        if (!db) throw new Error("Firestore not initialized");
        try {
          const now = (/* @__PURE__ */ new Date()).toISOString();
          await db.collection("users").doc(userId).update({
            lastNotificationSentAt: now
          });
          this.userCache.invalidate(userId);
          this.allUsersCache.clear();
          return true;
        } catch (error) {
          console.error(`[FirebaseStorage] Failed to update notification time for user: ${userId}`, error);
          return false;
        }
      }
      async deleteUser(userId) {
        if (!db) throw new Error("Firestore not initialized");
        try {
          await db.collection("users").doc(userId).delete();
          this.userCache.invalidate(userId);
          this.userCache.invalidatePattern(userId);
          this.allUsersCache.clear();
          console.log(`[FirebaseStorage] \u2705 Deleted user: ${userId}`);
          return true;
        } catch (error) {
          console.error(`[FirebaseStorage] \u274C Failed to delete user: ${userId}`, error);
          return false;
        }
      }
      async updateNotificationPreferences(userId, preferences) {
        if (!db) throw new Error("Firestore not initialized");
        try {
          await db.collection("users").doc(userId).update(preferences);
          this.userCache.invalidate(userId);
          this.allUsersCache.clear();
          return true;
        } catch (error) {
          return false;
        }
      }
      // In firebaseStorage.ts, replace the addPushSubscription method with:
      async addPushSubscription(userId, subscription) {
        if (!db) throw new Error("Firestore not initialized");
        try {
          console.log(`[FirebaseStorage] Adding push subscription for user: ${userId}`);
          const userDoc = await db.collection("users").doc(userId).get();
          if (!userDoc.exists) {
            console.error(`[FirebaseStorage] User not found: ${userId}`);
            return false;
          }
          const userRef = db.collection("users").doc(userId);
          await userRef.update({
            pushSubscriptions: admin2.firestore.FieldValue.arrayUnion(subscription)
          });
          console.log(`[FirebaseStorage] Push subscription added successfully for user: ${userId}`);
          this.userCache.invalidate(userId);
          return true;
        } catch (error) {
          console.error("[FirebaseStorage] Failed to add push subscription:", error);
          console.error("[FirebaseStorage] Error code:", error.code);
          console.error("[FirebaseStorage] Error message:", error.message);
          if (error.code === "not-found" || error.message?.includes("No document to update")) {
            try {
              console.log(`[FirebaseStorage] Attempting to create pushSubscriptions field for user: ${userId}`);
              await db.collection("users").doc(userId).set({
                pushSubscriptions: [subscription]
              }, { merge: true });
              console.log(`[FirebaseStorage] Push subscription field created and subscription added for user: ${userId}`);
              this.userCache.invalidate(userId);
              return true;
            } catch (retryError) {
              console.error("[FirebaseStorage] Failed to create pushSubscriptions field:", retryError);
              return false;
            }
          }
          return false;
        }
      }
      // Food item methods
      async getFoodItemsByUserId(userId) {
        if (!db) {
          console.error("[FirebaseStorage] Firestore not initialized!");
          throw new Error("Firestore not initialized");
        }
        const cacheKey = `foodItems:${userId}`;
        const cached = this.foodItemsCache.get(cacheKey);
        if (cached) {
          return cached;
        }
        console.log(`[FirebaseStorage] \u{1F4BE} Fetching food items from database for user: ${userId}`);
        try {
          const snapshot = await db.collection("foodItems").where("userId", "==", userId).get();
          const items = snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
          items.sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
          this.foodItemsCache.set(cacheKey, items);
          console.log(`[FirebaseStorage] \u2705 Cached ${items.length} food items for user: ${userId}`);
          return items;
        } catch (error) {
          console.error(`[FirebaseStorage] Error fetching items:`, error);
          console.error(`[FirebaseStorage] Error code:`, error.code);
          console.error(`[FirebaseStorage] Error message:`, error.message);
          throw error;
        }
      }
      async getFoodItem(id) {
        if (!db) throw new Error("Firestore not initialized");
        const doc = await db.collection("foodItems").doc(id).get();
        if (doc.exists) {
          return { ...doc.data(), id: doc.id };
        }
        const query = await db.collection("foodItems").where("id", "==", id).limit(1).get();
        if (!query.empty) {
          const first = query.docs[0];
          return { ...first.data(), id: first.id };
        }
        return void 0;
      }
      async createFoodItem(userId, insertItem) {
        if (!db) throw new Error("Firestore not initialized");
        const id = randomUUID();
        const foodItem = {
          ...insertItem,
          id,
          userId,
          quantity: insertItem.quantity || null,
          notes: insertItem.notes || null,
          barcode: insertItem.barcode || null,
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        };
        await db.collection("foodItems").doc(id).set(foodItem);
        this.foodItemsCache.invalidate(`foodItems:${userId}`);
        console.log(`[FirebaseStorage] \u2705 Created food item: ${foodItem.name} for user: ${userId}`);
        return foodItem;
      }
      async updateFoodItem(id, userId, updateData) {
        if (!db) throw new Error("Firestore not initialized");
        let docRef = null;
        const normalizedUserId = String(userId).trim();
        const directDoc = await db.collection("foodItems").doc(id).get();
        if (directDoc.exists) {
          const data = directDoc.data();
          if (String(data?.userId).trim() === normalizedUserId) {
            docRef = directDoc.ref;
          }
        }
        if (!docRef) {
          const query = await db.collection("foodItems").where("id", "==", id).limit(1).get();
          if (!query.empty) {
            const doc = query.docs[0];
            if (String(doc.data()?.userId).trim() === normalizedUserId) {
              docRef = doc.ref;
            }
          }
        }
        if (!docRef) {
          console.warn(`[FirebaseStorage] \u26A0\uFE0F Update target not found: item=${id}, user=${userId}`);
          return void 0;
        }
        await docRef.update(updateData);
        this.foodItemsCache.invalidate(`foodItems:${userId}`);
        const updatedDoc = await docRef.get();
        return { ...updatedDoc.data(), id: updatedDoc.id };
      }
      async deleteFoodItem(id, userId) {
        if (!db) throw new Error("Firestore not initialized");
        let deleted = false;
        const normalizedUserId = String(userId).trim();
        const directDoc = await db.collection("foodItems").doc(id).get();
        if (directDoc.exists) {
          const data = directDoc.data();
          if (String(data?.userId).trim() === normalizedUserId) {
            await directDoc.ref.delete();
            deleted = true;
          }
        }
        const query = await db.collection("foodItems").where("id", "==", id).get();
        for (const doc of query.docs) {
          const data = doc.data();
          if (String(data?.userId).trim() === normalizedUserId) {
            await doc.ref.delete();
            deleted = true;
          }
        }
        if (deleted) {
          this.foodItemsCache.invalidate(`foodItems:${userId}`);
          console.log(`[FirebaseStorage] \u2705 Successfully deleted food item: ${id} for user: ${userId}`);
          return true;
        }
        console.warn(`[FirebaseStorage] \u26A0\uFE0F Item not found or unauthorized for delete: item=${id}, user=${userId}`);
        return false;
      }
    };
  }
});

// server/static.ts
var static_exports = {};
__export(static_exports, {
  serveStatic: () => serveStatic
});
import express from "express";
import fs from "fs";
import path from "path";
function serveStatic(app2) {
  const distPath = path.resolve(import.meta.dirname, "..", "dist");
  if (!fs.existsSync(distPath)) {
    console.warn(`[Static] \u26A0\uFE0F  Warning: Build directory not found at ${distPath}`);
    console.warn(`[Static] \u{1F4A1} This is fine on Vercel, but for other environments ensure 'npm run build' completed.`);
    return;
  }
  app2.use(express.static(distPath, {
    maxAge: "1d",
    // default
    setHeaders: (res, filePath) => {
      if (filePath.includes("assets") || filePath.match(/\.[0-9a-f]{8,}\./)) {
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      } else {
        res.setHeader("Cache-Control", "no-cache");
      }
    }
  }));
  app2.use("*", (req, res) => {
    if (req.originalUrl.startsWith("/api")) {
      return res.status(404).json({ message: "API endpoint not found" });
    }
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
var init_static = __esm({
  "server/static.ts"() {
    "use strict";
  }
});

// server/loadEnv.ts
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
var __filename = fileURLToPath(import.meta.url);
var __dirname = dirname(__filename);
var envPath = resolve(__dirname, "../.env");
var result = dotenv.config({ path: envPath });
if (result.error) {
  const isProduction = process.env.NODE_ENV === "production";
  if (!isProduction || result.error.code !== "ENOENT") {
    console.warn("[dotenv] \u26A0\uFE0F  Note: .env file not loaded:", result.error.message);
  }
} else {
  console.log("[dotenv] \u2705 Loaded .env file from:", envPath);
}

// server/index.ts
import express2 from "express";
import { createServer as createServer2 } from "http";
import compression from "compression";

// server/routes.ts
import { createServer } from "http";

// server/storage.ts
import { randomUUID as randomUUID2 } from "crypto";

// server/utils.ts
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

// server/storage.ts
var MemStorage = class {
  users;
  foodItems;
  constructor() {
    this.users = /* @__PURE__ */ new Map();
    this.foodItems = /* @__PURE__ */ new Map();
  }
  async getUser(id) {
    return this.users.get(id);
  }
  async getAllUsers() {
    return Array.from(this.users.values());
  }
  async getUserByUsername(username) {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }
  async getUserByEmail(email) {
    return Array.from(this.users.values()).find(
      (user) => user.email === email
    );
  }
  async getUserByMobile(mobile) {
    return Array.from(this.users.values()).find(
      (user) => user.mobile === mobile
    );
  }
  async getUserByEmailOrMobile(identifier) {
    return Array.from(this.users.values()).find(
      (user) => user.email === identifier || user.mobile === identifier
    );
  }
  async createUser(insertUser) {
    const id = randomUUID2();
    const user = {
      ...insertUser,
      id,
      emailNotifications: "true",
      whatsappNotifications: "false",
      smsNotifications: "false",
      telegramNotifications: "false",
      telegramChatId: null,
      notificationDays: "3",
      notificationsPerDay: "1",
      pushSubscriptions: [],
      profilePicture: "default",
      browserNotifications: "false",
      quietHoursStart: null,
      quietHoursEnd: null,
      lastNotificationSentAt: null,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.users.set(id, user);
    return user;
  }
  async updateUserPassword(userId, newPasswordHash) {
    const user = this.users.get(userId);
    if (!user) {
      return false;
    }
    user.password = newPasswordHash;
    this.users.set(userId, user);
    return true;
  }
  async updateUserProfile(userId, profile) {
    const user = this.users.get(userId);
    if (!user) {
      return false;
    }
    if (profile.username !== void 0) user.username = profile.username;
    if (profile.email !== void 0) user.email = profile.email;
    if (profile.profilePicture !== void 0) user.profilePicture = profile.profilePicture;
    this.users.set(userId, user);
    return true;
  }
  async updateNotificationPreferences(userId, preferences) {
    const user = this.users.get(userId);
    if (!user) {
      return false;
    }
    Object.assign(user, preferences);
    this.users.set(userId, user);
    return true;
  }
  async addPushSubscription(userId, subscription) {
    const user = this.users.get(userId);
    if (!user) return false;
    if (!user.pushSubscriptions) user.pushSubscriptions = [];
    if (!user.pushSubscriptions.includes(subscription)) {
      user.pushSubscriptions.push(subscription);
    }
    this.users.set(userId, user);
    return true;
  }
  async updateLastNotificationTime(userId) {
    const user = this.users.get(userId);
    if (!user) return false;
    user.lastNotificationSentAt = (/* @__PURE__ */ new Date()).toISOString();
    this.users.set(userId, user);
    return true;
  }
  async deleteUser(userId) {
    return this.users.delete(userId);
  }
  // Food item methods
  async getFoodItemsByUserId(userId) {
    return Array.from(this.foodItems.values()).filter(
      (item) => item.userId === userId
    );
  }
  async getFoodItem(id) {
    return this.foodItems.get(id);
  }
  async createFoodItem(userId, insertItem) {
    const id = randomUUID2();
    const foodItem = {
      ...insertItem,
      id,
      userId,
      quantity: insertItem.quantity || null,
      notes: insertItem.notes || null,
      barcode: insertItem.barcode || null,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.foodItems.set(id, foodItem);
    return foodItem;
  }
  async updateFoodItem(id, userId, updateData) {
    const normalizedUserId = String(userId).trim();
    let targetKey = id;
    let existing = this.foodItems.get(id);
    if (!existing || String(existing.userId).trim() !== normalizedUserId) {
      for (const [key, item] of Array.from(this.foodItems.entries())) {
        if ((key === id || item.id === id) && String(item.userId).trim() === normalizedUserId) {
          targetKey = key;
          existing = item;
          break;
        }
      }
    }
    if (!existing || String(existing.userId).trim() !== normalizedUserId) {
      return void 0;
    }
    const updated = { ...existing, ...updateData };
    this.foodItems.set(targetKey, updated);
    return updated;
  }
  async deleteFoodItem(id, userId) {
    const normalizedUserId = String(userId).trim();
    const existing = this.foodItems.get(id);
    if (existing && String(existing.userId).trim() === normalizedUserId) {
      return this.foodItems.delete(id);
    }
    for (const [key, item] of Array.from(this.foodItems.entries())) {
      if ((key === id || item.id === id) && String(item.userId).trim() === normalizedUserId) {
        return this.foodItems.delete(key);
      }
    }
    return false;
  }
};
var storageInstance = null;
async function initializeStorage() {
  if (storageInstance) return storageInstance;
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
    try {
      const { FirebaseStorage: FirebaseStorage2 } = await Promise.resolve().then(() => (init_firebaseStorage(), firebaseStorage_exports));
      storageInstance = new FirebaseStorage2();
      log("\u2705 Using Firebase Firestore storage", "storage");
      return storageInstance;
    } catch (error) {
      console.error("[Storage] \u274C Failed to initialize Firebase Storage:", error);
      console.log("[Storage] \u26A0\uFE0F  Falling back to in-memory storage");
    }
  }
  log("\u26A0\uFE0F Using in-memory storage (fallback)", "storage");
  storageInstance = new MemStorage();
  return storageInstance;
}
var storagePromise = initializeStorage();
var storage = new Proxy({}, {
  get: (target, prop) => {
    return async (...args) => {
      const instance = await storagePromise;
      return instance[prop](...args);
    };
  }
});

// shared/schema.ts
import { z } from "zod";
var insertUserSchema = z.object({
  username: z.string().min(1, "Username is required"),
  email: z.string().email("Invalid email address"),
  mobile: z.string().regex(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/, "Invalid mobile number"),
  password: z.string().min(6, "Password must be at least 6 characters")
});
var loginSchema = z.object({
  identifier: z.string().min(1, "Email or mobile number required"),
  password: z.string().min(1, "Password required")
});
var insertFoodItemSchema = z.object({
  name: z.string().min(1, "Food name is required"),
  category: z.string().min(1, "Category is required"),
  purchaseDate: z.string().min(1, "Purchase date is required"),
  expiryDate: z.string().min(1, "Expiry date is required"),
  quantity: z.string().optional(),
  notes: z.string().optional(),
  barcode: z.string().optional()
});

// server/routes.ts
import { z as z2 } from "zod";
import { createHash } from "crypto";

// server/emailService.ts
import nodemailer from "nodemailer";
import { Resend } from "resend";
var EmailService = class {
  transporter = null;
  resendClient = null;
  config = null;
  initialize() {
    console.log("[EmailService] Initializing email service...");
    const emailService2 = process.env.EMAIL_SERVICE || "smtp";
    const from = process.env.EMAIL_FROM || "Food Reminder <noreply@foodreminder.app>";
    console.log(`[EmailService] Mode: ${emailService2}`);
    console.log(`[EmailService] From: ${from}`);
    if (emailService2 === "resend") {
      const resendApiKey = process.env.RESEND_API_KEY;
      if (!resendApiKey) {
        console.error("[EmailService] \u274C Resend API key not found. Email notifications will be disabled.");
        console.warn("[EmailService] Set RESEND_API_KEY in your .env file.");
        return false;
      }
      this.config = {
        service: "resend",
        resendApiKey,
        from
      };
      try {
        this.resendClient = new Resend(resendApiKey);
        console.log("[EmailService] \u2705 Email service initialized with Resend");
        return true;
      } catch (e) {
        console.error("[EmailService] \u274C Failed to initialize Resend client:", e);
        return false;
      }
    }
    const host = process.env.EMAIL_HOST;
    const port = process.env.EMAIL_PORT;
    const user = process.env.EMAIL_USER;
    const password = process.env.EMAIL_PASSWORD;
    console.log(`[EmailService] Check SMTP Config: Host=${!!host}, Port=${!!port}, User=${!!user}, Pass=${!!password}`);
    if (!host || !port || !user || !password) {
      console.warn("[EmailService] \u274C SMTP configuration incomplete. Email notifications will be disabled.");
      console.warn("[EmailService] Set EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASSWORD in your .env file.");
      console.warn("[EmailService] Or switch to Resend by setting EMAIL_SERVICE=resend and RESEND_API_KEY");
      return false;
    }
    this.config = {
      service: "smtp",
      host,
      port: parseInt(port),
      user,
      password,
      from
    };
    try {
      this.transporter = nodemailer.createTransport({
        host: this.config.host,
        port: this.config.port,
        secure: this.config.port === 465,
        // true for 465, false for other ports
        auth: {
          user: this.config.user,
          pass: this.config.password
        }
      });
      console.log("[EmailService] \u2705 Email service initialized with SMTP");
      console.log(`[EmailService] \u{1F4E7} Using ${host}:${port}`);
      return true;
    } catch (e) {
      console.error("[EmailService] \u274C Failed to create SMTP transporter:", e);
      return false;
    }
  }
  isConfigured() {
    const configured = (this.transporter !== null || this.resendClient !== null) && this.config !== null;
    if (!configured) {
    }
    return configured;
  }
  async sendExpiryNotification(user, expiringItems) {
    if (!this.isConfigured()) {
      console.warn(`[EmailService] \u26A0\uFE0F Email service not configured. Skipping email for ${user.username}`);
      return false;
    }
    if (!user.email || user.email.trim() === "") {
      console.warn(`[EmailService] \u26A0\uFE0F User ${user.username} has no email address`);
      console.log(`[EmailService] \u{1F4A1} Add email in Profile settings to receive email notifications`);
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(user.email)) {
      console.warn(`[EmailService] \u26A0\uFE0F User ${user.username} has invalid email format: ${user.email}`);
      return false;
    }
    console.log(`[EmailService] \u{1F4E7} Attempting to send email to ${user.email} (${user.username}) with ${expiringItems.length} expiring items`);
    const maxRetries = 3;
    let lastError = null;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const { subject, htmlContent, textContent } = this.generateEmailContent(user, expiringItems);
        if (this.config.service === "resend" && this.resendClient) {
          console.log(`[EmailService] Sending via Resend (attempt ${attempt}/${maxRetries})...`);
          console.log(`[EmailService] From: ${this.config.from}`);
          console.log(`[EmailService] To: ${user.email}`);
          console.log(`[EmailService] Subject: ${subject}`);
          const { data, error } = await this.resendClient.emails.send({
            from: this.config.from,
            to: user.email,
            subject,
            html: htmlContent,
            text: textContent
          });
          if (error) {
            console.error(`[EmailService] \u274C Resend API Error (attempt ${attempt}/${maxRetries}):`);
            console.error(`[EmailService] Error name: ${error.name}`);
            console.error(`[EmailService] Error message: ${error.message}`);
            console.error(`[EmailService] Full error:`, JSON.stringify(error, null, 2));
            lastError = new Error(`Resend Error: ${error.message}`);
            if (error.message?.includes("API key")) {
              console.error(`[EmailService] \u274C Invalid API key - check RESEND_API_KEY in .env`);
              console.error(`[EmailService] Get your API key from: https://resend.com/api-keys`);
              break;
            }
            if (error.message?.includes("Invalid") || error.message?.includes("not found")) {
              console.error(`[EmailService] \u274C Non-retryable error, aborting`);
              break;
            }
            if (attempt < maxRetries) {
              const waitTime = Math.pow(2, attempt) * 1e3;
              console.log(`[EmailService] \u23F3 Waiting ${waitTime}ms before retry...`);
              await new Promise((resolve2) => setTimeout(resolve2, waitTime));
              continue;
            }
          } else {
            console.log(`[EmailService] \u2705 Expiry notification sent to ${user.email} via Resend. ID: ${data?.id}`);
            return true;
          }
        } else if (this.transporter) {
          console.log(`[EmailService] Sending via SMTP (attempt ${attempt}/${maxRetries})...`);
          const info = await this.transporter.sendMail({
            from: this.config.from,
            to: user.email,
            subject,
            text: textContent,
            html: htmlContent
          });
          console.log(`[EmailService] \u2705 Expiry notification sent to ${user.email} via SMTP. ID: ${info.messageId}`);
          return true;
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(`[EmailService] \u274C Failed to send email (attempt ${attempt}/${maxRetries}):`, lastError.message);
        if (error instanceof Error) {
          console.error(`[EmailService] Error details:`, error.stack);
        }
        if (attempt < maxRetries) {
          const waitTime = Math.pow(2, attempt) * 1e3;
          console.log(`[EmailService] \u23F3 Waiting ${waitTime}ms before retry...`);
          await new Promise((resolve2) => setTimeout(resolve2, waitTime));
        }
      }
    }
    console.error(`[EmailService] \u274C Failed to send email to ${user.email} after ${maxRetries} attempts. Last error:`, lastError?.message);
    return false;
  }
  generateEmailContent(user, expiringItems) {
    const itemsList = expiringItems.map((item) => {
      const daysLeft = this.calculateDaysLeft(item.expiryDate);
      const statusText = daysLeft === 0 ? "expires today" : daysLeft === 1 ? "expires tomorrow" : `expires in ${daysLeft} days`;
      return `\u2022 ${item.name} (${item.category}) - ${statusText}`;
    }).join("\n");
    const subject = `\u26A0\uFE0F Food Expiry Alert: ${expiringItems.length} item${expiringItems.length > 1 ? "s" : ""} expiring soon`;
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #16a34a 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .alert-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .item-list { background: white; padding: 20px; margin: 20px 0; border-radius: 4px; border: 1px solid #e5e7eb; }
          .item { padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
          .item:last-child { border-bottom: none; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
          .button { display: inline-block; background: #16a34a; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>\u{1F34E} Food Reminder</h1>
            <p>Food Expiry Alert</p>
          </div>
          <div class="content">
            <p>Hi ${user.username},</p>
            
            <div class="alert-box">
              <strong>\u26A0\uFE0F Important:</strong> You have ${expiringItems.length} food item${expiringItems.length > 1 ? "s" : ""} expiring soon!
            </div>

            <p>Here are the items that need your attention:</p>

            <div class="item-list">
              ${expiringItems.map((item) => {
      const daysLeft = this.calculateDaysLeft(item.expiryDate);
      const statusText = daysLeft === 0 ? "Expires today" : daysLeft === 1 ? "Expires tomorrow" : `Expires in ${daysLeft} days`;
      return `
                  <div class="item">
                    <strong>${item.name}</strong> (${item.category})<br>
                    <span style="color: #f59e0b;">\u23F0 ${statusText}</span>
                  </div>
                `;
    }).join("")}
            </div>

            <p>Please check your inventory and take necessary action to avoid food waste.</p>

            <center>
              <a href="${process.env.APP_URL || "http://localhost:5000"}/dashboard" class="button">View Dashboard</a>
            </center>

            <div class="footer">
              <p>This is an automated notification from Food Reminder.<br>
              Manage your notification settings in your profile.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
    const textContent = `
Food Reminder - Expiry Alert

Hi ${user.username},

You have ${expiringItems.length} food item${expiringItems.length > 1 ? "s" : ""} expiring soon:

${itemsList}

Please check your inventory and take necessary action to avoid food waste.

View your dashboard: ${process.env.APP_URL || "http://localhost:5000"}/dashboard

---
This is an automated notification from Food Reminder.
Manage your notification settings in your profile.
    `;
    return { subject, htmlContent, textContent };
  }
  calculateDaysLeft(expiryDate) {
    const today = /* @__PURE__ */ new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDate);
    expiry.setHours(0, 0, 0, 0);
    return Math.ceil((expiry.getTime() - today.getTime()) / (1e3 * 60 * 60 * 24));
  }
  async testConnection() {
    if (!this.isConfigured()) {
      return false;
    }
    try {
      if (this.config.service === "resend" && this.resendClient) {
        console.log("[EmailService] \u2705 Resend client ready");
        return true;
      } else if (this.transporter) {
        await this.transporter.verify();
        console.log("[EmailService] \u2705 SMTP connection verified");
        return true;
      }
      return false;
    } catch (error) {
      console.error("[EmailService] \u274C Email service connection failed:", error);
      return false;
    }
  }
};
var emailService = new EmailService();

// server/whatsappService.ts
import twilio from "twilio";
var WhatsAppService = class {
  client = null;
  config = null;
  initialize() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_WHATSAPP_FROM;
    if (!accountSid || !authToken || !fromNumber) {
      console.warn("[WhatsAppService] Twilio configuration not found. WhatsApp notifications will be disabled.");
      return false;
    }
    if (!accountSid.startsWith("AC")) {
      console.warn("[WhatsAppService] Invalid Twilio Account SID format (must start with 'AC'). WhatsApp notifications will be disabled.");
      return false;
    }
    this.config = {
      accountSid,
      authToken,
      fromNumber
    };
    try {
      this.client = twilio(this.config.accountSid, this.config.authToken);
      console.log("[WhatsAppService] \u2705 WhatsApp service initialized successfully");
      console.log("[WhatsAppService] From number: " + this.config.fromNumber);
      if (this.config.fromNumber === "whatsapp:+14155238886") {
        console.log("[WhatsAppService] \u{1F4F1} Using Twilio WhatsApp Sandbox");
        console.log("[WhatsAppService] \u26A0\uFE0F IMPORTANT: Recipients must join your sandbox first!");
        console.log("[WhatsAppService] Steps to join:");
        console.log("[WhatsAppService]   1. Save +1 (415) 523-8886 as a contact");
        console.log("[WhatsAppService]   2. Send 'join <your-sandbox-code>' to that number via WhatsApp");
        console.log("[WhatsAppService]   3. Find your sandbox code at: https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn");
      }
      return true;
    } catch (error) {
      console.error("[WhatsAppService] \u274C Failed to initialize Twilio client:", error instanceof Error ? error.message : "Unknown error");
      this.client = null;
      this.config = null;
      return false;
    }
  }
  isConfigured() {
    return this.client !== null && this.config !== null;
  }
  async sendExpiryNotification(user, expiringItems) {
    if (!this.isConfigured()) {
      console.warn("[WhatsAppService] WhatsApp service not configured. Skipping WhatsApp message.");
      return false;
    }
    if (!user.mobile || user.mobile.trim() === "") {
      console.warn(`[WhatsAppService] \u26A0\uFE0F User ${user.username} has no mobile number. Skipping WhatsApp notification.`);
      console.log(`[WhatsAppService] \u{1F4A1} Add mobile number in Profile settings to receive WhatsApp notifications`);
      return false;
    }
    let toNumber = "";
    let whatsappNumber = "";
    try {
      const itemsList = expiringItems.map((item) => {
        const daysLeft = this.calculateDaysLeft(item.expiryDate);
        const statusText = daysLeft === 0 ? "expires today \u26A0\uFE0F" : daysLeft === 1 ? "expires tomorrow \u23F0" : `expires in ${daysLeft} days`;
        return `\u2022 ${item.name} (${item.category}) - ${statusText}`;
      }).join("\n");
      const message = `
\u{1F34E} *Food Reminder - Expiry Alert*

Hi ${user.username}! \u{1F44B}

You have *${expiringItems.length} food item${expiringItems.length > 1 ? "s" : ""}* expiring soon:

${itemsList}

\u26A1 Action needed: Check your inventory to avoid food waste!

View your dashboard: ${process.env.APP_URL || "http://localhost:5000"}/dashboard
      `.trim();
      toNumber = user.mobile.trim();
      toNumber = toNumber.replace(/[^\d+]/g, "");
      if (!toNumber.startsWith("+")) {
        console.log(`[WhatsAppService] Mobile number ${toNumber} doesn't have country code, adding +91`);
        toNumber = `+91${toNumber}`;
      }
      whatsappNumber = `whatsapp:${toNumber}`;
      console.log(`[WhatsAppService] Sending to: ${whatsappNumber}`);
      console.log(`[WhatsAppService] From: ${this.config.fromNumber}`);
      const messageResponse = await this.client.messages.create({
        body: message,
        from: this.config.fromNumber,
        to: whatsappNumber
      });
      console.log(`[WhatsAppService] \u2705 Message sent successfully!`);
      console.log(`[WhatsAppService] Message SID: ${messageResponse.sid}`);
      console.log(`[WhatsAppService] Status: ${messageResponse.status}`);
      console.log(`[WhatsAppService] \u26A0\uFE0F IMPORTANT: For Twilio Sandbox, the recipient must first send`);
      console.log(`[WhatsAppService]    "join <your-sandbox-code>" to ${this.config.fromNumber}`);
      return true;
    } catch (error) {
      console.error("[WhatsAppService] \u274C Failed to send WhatsApp message:");
      console.error("[WhatsAppService] Error details:", error.message || error);
      if (error.code) {
        console.error(`[WhatsAppService] Error code: ${error.code}`);
      }
      if (error.moreInfo) {
        console.error(`[WhatsAppService] More info: ${error.moreInfo}`);
      }
      if (error.code === 63007) {
        console.error(`[WhatsAppService] \u26A0\uFE0F User has not opted in to WhatsApp messages`);
        console.error(`[WhatsAppService] Solution: Have ${toNumber} send "join <sandbox-code>" to your Twilio WhatsApp number`);
      } else if (error.code === 21211) {
        console.error(`[WhatsAppService] \u26A0\uFE0F Invalid phone number format`);
        console.error(`[WhatsAppService] Phone number: ${whatsappNumber}`);
      } else if (error.code === 21608) {
        console.error(`[WhatsAppService] \u26A0\uFE0F The number ${toNumber} is not a valid WhatsApp number`);
      } else if (error.code === 20003) {
        console.error(`[WhatsAppService] \u26A0\uFE0F Authentication error - check TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN`);
      }
      return false;
    }
  }
  calculateDaysLeft(expiryDate) {
    const today = /* @__PURE__ */ new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDate);
    expiry.setHours(0, 0, 0, 0);
    return Math.ceil((expiry.getTime() - today.getTime()) / (1e3 * 60 * 60 * 24));
  }
  async testConnection() {
    if (!this.isConfigured()) {
      return false;
    }
    try {
      await this.client.api.accounts(this.config.accountSid).fetch();
      console.log("[WhatsAppService] WhatsApp service connection verified");
      return true;
    } catch (error) {
      console.error("[WhatsAppService] WhatsApp service connection failed:", error);
      return false;
    }
  }
};
var whatsappService = new WhatsAppService();

// server/whatsappCloudService.ts
var WhatsAppCloudService = class {
  config = null;
  apiUrl = "https://graph.facebook.com/v18.0";
  initialize() {
    const accessToken = process.env.WHATSAPP_CLOUD_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_CLOUD_PHONE_NUMBER_ID;
    if (!accessToken || !phoneNumberId) {
      console.log("[WhatsAppCloud] \u{1F4A1} Free WhatsApp Cloud API not configured");
      console.log("[WhatsAppCloud] \u{1F4D6} To enable free WhatsApp notifications:");
      console.log("[WhatsAppCloud]    1. Visit: https://developers.facebook.com/apps");
      console.log("[WhatsAppCloud]    2. Create a WhatsApp Business App");
      console.log("[WhatsAppCloud]    3. Get your credentials and add to .env:");
      console.log("[WhatsAppCloud]       WHATSAPP_CLOUD_ACCESS_TOKEN=your_token");
      console.log("[WhatsAppCloud]       WHATSAPP_CLOUD_PHONE_NUMBER_ID=your_phone_id");
      console.log("[WhatsAppCloud] \u{1F381} Free tier: 1000 conversations/month");
      return false;
    }
    this.config = {
      accessToken,
      phoneNumberId,
      businessAccountId: process.env.WHATSAPP_CLOUD_BUSINESS_ACCOUNT_ID
    };
    console.log("[WhatsAppCloud] \u2705 Free WhatsApp Cloud API initialized");
    console.log("[WhatsAppCloud] \u{1F4F1} Phone Number ID:", phoneNumberId.substring(0, 10) + "...");
    return true;
  }
  isConfigured() {
    return this.config !== null;
  }
  /**
   * Send a template message (for business-initiated conversations)
   * Note: You need to create and approve templates in Meta Business Manager
   */
  async sendTemplateMessage(to, templateName, parameters) {
    if (!this.isConfigured()) {
      return false;
    }
    try {
      const url = `${this.apiUrl}/${this.config.phoneNumberId}/messages`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.config.accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "template",
          template: {
            name: templateName,
            language: {
              code: "en"
            },
            components: [
              {
                type: "body",
                parameters: parameters.map((text) => ({
                  type: "text",
                  text
                }))
              }
            ]
          }
        })
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
  async sendTextMessage(to, message) {
    if (!this.isConfigured()) {
      console.log("[WhatsAppCloud] \u26A0\uFE0F Service not configured");
      return false;
    }
    try {
      const cleanNumber = to.replace(/[+\s-]/g, "");
      console.log(`[WhatsAppCloud] \u{1F4E4} Sending text message...`);
      console.log(`[WhatsAppCloud]    Original number: ${to}`);
      console.log(`[WhatsAppCloud]    Cleaned number: ${cleanNumber}`);
      const url = `${this.apiUrl}/${this.config.phoneNumberId}/messages`;
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
      console.log(`[WhatsAppCloud]    Phone Number ID: ${this.config.phoneNumberId}`);
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.config.accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      console.log(`[WhatsAppCloud]    Response status: ${response.status}`);
      console.log(`[WhatsAppCloud]    Response data:`, JSON.stringify(data, null, 2));
      if (!response.ok) {
        console.error("[WhatsAppCloud] \u274C API Error Response:");
        console.error("[WhatsAppCloud]    Status:", response.status);
        console.error("[WhatsAppCloud]    Status Text:", response.statusText);
        console.error("[WhatsAppCloud]    Error Data:", JSON.stringify(data, null, 2));
        if (data.error) {
          console.error("[WhatsAppCloud]    Error Code:", data.error.code);
          console.error("[WhatsAppCloud]    Error Message:", data.error.message);
          console.error("[WhatsAppCloud]    Error Type:", data.error.type);
          console.error("[WhatsAppCloud]    Error Subcode:", data.error.error_subcode);
          if (data.error.message?.includes("24 hour") || data.error.message?.includes("outside the support window")) {
            console.error("[WhatsAppCloud] \u26A0\uFE0F 24-HOUR WINDOW EXPIRED");
            console.error("[WhatsAppCloud]    The user needs to message your WhatsApp number first");
            console.error("[WhatsAppCloud]    OR use an approved message template for business-initiated messages");
          }
          if (data.error.code === 131047 || data.error.message?.includes("recipient phone number not registered")) {
            console.error("[WhatsAppCloud] \u26A0\uFE0F PHONE NUMBER NOT REGISTERED");
            console.error("[WhatsAppCloud]    The phone number is not registered on WhatsApp");
            console.error("[WhatsAppCloud]    OR the number is not in the sandbox (for test mode)");
          }
          if (data.error.code === 131031 || data.error.message?.includes("User's number is part of an experiment")) {
            console.error("[WhatsAppCloud] \u26A0\uFE0F SANDBOX RESTRICTION");
            console.error("[WhatsAppCloud]    User must send the join code to your test number");
            console.error("[WhatsAppCloud]    Check Meta Business Manager for the join code");
          }
        }
        return false;
      }
      console.log("[WhatsAppCloud] \u2705 Message sent successfully");
      console.log("[WhatsAppCloud]    Message ID:", data.messages?.[0]?.id);
      return true;
    } catch (error) {
      console.error("[WhatsAppCloud] \u274C Exception in sendTextMessage:");
      console.error("[WhatsAppCloud]    Error:", error instanceof Error ? error.message : String(error));
      console.error("[WhatsAppCloud]    Stack:", error instanceof Error ? error.stack : "No stack trace");
      return false;
    }
  }
  async sendExpiryNotification(user, expiringItems) {
    if (!this.isConfigured()) {
      console.log("[WhatsAppCloud] \u26A0\uFE0F Service not configured");
      return false;
    }
    if (!user.mobile) {
      console.error("[WhatsAppCloud] \u274C User has no mobile number");
      return false;
    }
    try {
      console.log(`[WhatsAppCloud] ========================================`);
      console.log(`[WhatsAppCloud] \u{1F4F1} Sending WhatsApp notification to ${user.username}`);
      console.log(`[WhatsAppCloud]    Mobile: ${user.mobile}`);
      console.log(`[WhatsAppCloud]    Items count: ${expiringItems.length}`);
      const itemsList = expiringItems.map((item) => {
        const daysLeft = this.calculateDaysLeft(item.expiryDate);
        const statusEmoji = daysLeft === 0 ? "\u{1F534}" : daysLeft === 1 ? "\u{1F7E1}" : "\u{1F7E2}";
        const statusText = daysLeft === 0 ? "expires today" : daysLeft === 1 ? "expires tomorrow" : `expires in ${daysLeft} days`;
        return `${statusEmoji} ${item.name} - ${statusText}`;
      }).join("\n");
      const count = expiringItems.length;
      const message = `\u{1F34E} *Food Expiry Alert*

Hi ${user.username}! \u{1F44B}

You have *${count} item${count > 1 ? "s" : ""}* expiring soon:

${itemsList}

\u{1F4A1} Check your dashboard to avoid waste!
${process.env.APP_URL || "http://localhost:5000"}/dashboard`;
      console.log(`[WhatsAppCloud]    Message length: ${message.length} characters`);
      const textResult = await this.sendTextMessage(user.mobile, message);
      if (textResult) {
        console.log(`[WhatsAppCloud] \u2705 Text message sent successfully`);
        console.log(`[WhatsAppCloud] ========================================`);
        return true;
      }
      console.log(`[WhatsAppCloud] \u274C Text message failed`);
      console.log(`[WhatsAppCloud] \u{1F50D} TROUBLESHOOTING GUIDE:`);
      console.log(`[WhatsAppCloud]    1. Check if user is in WhatsApp Business sandbox`);
      console.log(`[WhatsAppCloud]    2. Verify phone number format: ${user.mobile}`);
      console.log(`[WhatsAppCloud]    3. For sandbox: User must send join code to your test number`);
      console.log(`[WhatsAppCloud]    4. For production: Phone number must be verified in Meta Business`);
      console.log(`[WhatsAppCloud]    5. Check if 24-hour messaging window is active`);
      console.log(`[WhatsAppCloud] \u{1F4A1} TIP: For business-initiated messages, create an approved template`);
      console.log(`[WhatsAppCloud] ========================================`);
      return false;
    } catch (error) {
      console.error("[WhatsAppCloud] \u274C Error in sendExpiryNotification:");
      console.error("[WhatsAppCloud]    Error:", error instanceof Error ? error.message : String(error));
      console.error("[WhatsAppCloud] ========================================");
      return false;
    }
  }
  calculateDaysLeft(expiryDate) {
    const today = /* @__PURE__ */ new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDate);
    expiry.setHours(0, 0, 0, 0);
    return Math.ceil((expiry.getTime() - today.getTime()) / (1e3 * 60 * 60 * 24));
  }
  /**
   * Test the connection by getting account info
   */
  async testConnection() {
    if (!this.isConfigured()) {
      return false;
    }
    try {
      const url = `${this.apiUrl}/${this.config.phoneNumberId}`;
      const response = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${this.config.accessToken}`
        }
      });
      if (response.ok) {
        console.log("[WhatsAppCloud] \u2705 Connection test successful");
        return true;
      } else {
        console.error("[WhatsAppCloud] \u274C Connection test failed");
        return false;
      }
    } catch (error) {
      console.error("[WhatsAppCloud] Connection test error:", error);
      return false;
    }
  }
};
var whatsappCloudService = new WhatsAppCloudService();

// server/whatsappVerificationService.ts
var WhatsAppVerificationService = class {
  verificationCodes = /* @__PURE__ */ new Map();
  verifiedNumbers = /* @__PURE__ */ new Map();
  // mobile -> userId
  CODE_EXPIRY_MS = 10 * 60 * 1e3;
  // 10 minutes
  /**
   * Generate a verification code for a user
   */
  generateVerificationCode(userId, mobile) {
    const code = Math.floor(1e5 + Math.random() * 9e5).toString();
    const verification = {
      code,
      userId,
      mobile,
      createdAt: Date.now(),
      expiresAt: Date.now() + this.CODE_EXPIRY_MS
    };
    this.verificationCodes.set(mobile, verification);
    console.log(`[WhatsAppVerification] Generated code ${code} for ${mobile}`);
    this.cleanupExpiredCodes();
    return code;
  }
  /**
   * Send verification code to user's WhatsApp
   */
  async sendVerificationCode(user) {
    if (!whatsappCloudService.isConfigured()) {
      return {
        success: false,
        message: "WhatsApp service is not configured on the server"
      };
    }
    if (!user.mobile) {
      return {
        success: false,
        message: "No mobile number found for this user"
      };
    }
    const code = this.generateVerificationCode(user.id, user.mobile);
    const message = `\u{1F34E} *Food Remainder - WhatsApp Verification*

Hi ${user.username}! \u{1F44B}

Your verification code is: *${code}*

This code will expire in 10 minutes.

Enter this code in the app to enable WhatsApp notifications.

If you didn't request this, please ignore this message.`;
    try {
      const sent = await whatsappCloudService.sendTextMessage(user.mobile, message);
      if (sent) {
        console.log(`[WhatsAppVerification] \u2705 Verification code sent to ${user.mobile}`);
        return {
          success: true,
          message: `Verification code sent to ${user.mobile}`
        };
      } else {
        console.log(`[WhatsAppVerification] \u274C Failed to send verification code to ${user.mobile}`);
        return {
          success: false,
          message: "Failed to send verification code. Please check the server logs for details."
        };
      }
    } catch (error) {
      console.error(`[WhatsAppVerification] Error sending verification code:`, error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error occurred"
      };
    }
  }
  /**
   * Verify a code entered by the user
   */
  async verifyCode(userId, code) {
    console.log(`[WhatsAppVerification] Verifying code for user ${userId}`);
    const user = await storage.getUser(userId);
    if (!user) {
      return {
        success: false,
        message: "User not found"
      };
    }
    const verification = this.verificationCodes.get(user.mobile);
    if (!verification) {
      console.log(`[WhatsAppVerification] No verification code found for ${user.mobile}`);
      return {
        success: false,
        message: "No verification code found. Please request a new code."
      };
    }
    if (Date.now() > verification.expiresAt) {
      console.log(`[WhatsAppVerification] Code expired for ${user.mobile}`);
      this.verificationCodes.delete(user.mobile);
      return {
        success: false,
        message: "Verification code has expired. Please request a new code."
      };
    }
    if (verification.userId !== userId) {
      console.log(`[WhatsAppVerification] User ID mismatch for ${user.mobile}`);
      return {
        success: false,
        message: "Invalid verification code"
      };
    }
    if (verification.code !== code.trim()) {
      console.log(`[WhatsAppVerification] Invalid code for ${user.mobile}`);
      return {
        success: false,
        message: "Invalid verification code. Please try again."
      };
    }
    this.verifiedNumbers.set(user.mobile, userId);
    this.verificationCodes.delete(user.mobile);
    await storage.updateNotificationPreferences(userId, {
      whatsappNotifications: "true"
    });
    console.log(`[WhatsAppVerification] \u2705 Successfully verified ${user.mobile} for user ${userId}`);
    return {
      success: true,
      message: "WhatsApp verified successfully! You will now receive notifications."
    };
  }
  /**
   * Check if a mobile number is verified
   */
  isVerified(mobile) {
    return this.verifiedNumbers.has(mobile);
  }
  /**
   * Get verified user ID for a mobile number
   */
  getVerifiedUserId(mobile) {
    return this.verifiedNumbers.get(mobile);
  }
  /**
   * Disconnect WhatsApp for a user
   */
  async disconnectWhatsApp(userId) {
    const user = await storage.getUser(userId);
    if (!user) {
      return {
        success: false,
        message: "User not found"
      };
    }
    this.verifiedNumbers.delete(user.mobile);
    this.verificationCodes.delete(user.mobile);
    await storage.updateNotificationPreferences(userId, {
      whatsappNotifications: "false"
    });
    console.log(`[WhatsAppVerification] Disconnected WhatsApp for user ${userId}`);
    return {
      success: true,
      message: "WhatsApp disconnected successfully"
    };
  }
  /**
  * Clean up expired verification codes
  */
  cleanupExpiredCodes() {
    const now = Date.now();
    for (const [mobile, verification] of Array.from(this.verificationCodes.entries())) {
      if (now > verification.expiresAt) {
        this.verificationCodes.delete(mobile);
        console.log(`[WhatsAppVerification] Cleaned up expired code for ${mobile}`);
      }
    }
  }
  /**
   * Get verification status for a user
   */
  async getVerificationStatus(userId) {
    const user = await storage.getUser(userId);
    if (!user) {
      return { isVerified: false };
    }
    const isVerified = this.isVerified(user.mobile);
    const hasPendingCode = this.verificationCodes.has(user.mobile);
    return {
      isVerified,
      mobile: user.mobile,
      hasPendingCode
    };
  }
};
var whatsappVerificationService = new WhatsAppVerificationService();

// server/smsService.ts
import twilio2 from "twilio";
var SmsService = class {
  client = null;
  config = null;
  initialize() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_SMS_FROM || process.env.TWILIO_PHONE_NUMBER;
    if (!accountSid || !authToken || !fromNumber) {
      console.warn("[SmsService] Twilio SMS configuration not found. SMS notifications will be disabled.");
      console.warn("[SmsService] Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_SMS_FROM in your .env file.");
      return false;
    }
    if (!accountSid.startsWith("AC")) {
      console.warn("[SmsService] Invalid Twilio Account SID format (must start with 'AC'). SMS notifications will be disabled.");
      return false;
    }
    this.config = {
      accountSid,
      authToken,
      fromNumber
    };
    try {
      this.client = twilio2(this.config.accountSid, this.config.authToken);
      console.log("[SmsService] \u2705 SMS service initialized successfully");
      console.log(`[SmsService] \u{1F4F1} Using ${fromNumber}`);
      return true;
    } catch (error) {
      console.error("[SmsService] \u274C Failed to initialize Twilio SMS client:", error instanceof Error ? error.message : "Unknown error");
      this.client = null;
      this.config = null;
      return false;
    }
  }
  isConfigured() {
    return this.client !== null && this.config !== null;
  }
  async sendExpiryNotification(user, expiringItems) {
    if (!this.isConfigured()) {
      console.warn("[SmsService] SMS service not configured. Skipping SMS message.");
      return false;
    }
    try {
      const itemsList = expiringItems.map((item) => {
        const daysLeft = this.calculateDaysLeft(item.expiryDate);
        const statusText = daysLeft === 0 ? "expires today \u26A0\uFE0F" : daysLeft === 1 ? "expires tomorrow \u23F0" : `expires in ${daysLeft} days`;
        return `\u2022 ${item.name} - ${statusText}`;
      }).join("\n");
      const message = `
\u{1F34E} Food Reminder Alert

Hi ${user.username}!

You have ${expiringItems.length} item${expiringItems.length > 1 ? "s" : ""} expiring soon:

${itemsList}

Check your dashboard: ${process.env.APP_URL || "http://localhost:5000"}/dashboard
      `.trim();
      let toNumber = user.mobile;
      if (!toNumber.startsWith("+")) {
        console.warn(`[SmsService] Mobile number ${toNumber} doesn't have country code (+)`);
      }
      await this.client.messages.create({
        body: message,
        from: this.config.fromNumber,
        to: toNumber
      });
      console.log(`[SmsService] \u2705 SMS notification sent to ${user.mobile}`);
      return true;
    } catch (error) {
      console.error("[SmsService] \u274C Failed to send SMS:", error);
      return false;
    }
  }
  calculateDaysLeft(expiryDate) {
    const today = /* @__PURE__ */ new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDate);
    expiry.setHours(0, 0, 0, 0);
    return Math.ceil((expiry.getTime() - today.getTime()) / (1e3 * 60 * 60 * 24));
  }
  async testConnection() {
    if (!this.isConfigured()) {
      return false;
    }
    try {
      await this.client.api.accounts(this.config.accountSid).fetch();
      console.log("[SmsService] \u2705 SMS service connection verified");
      return true;
    } catch (error) {
      console.error("[SmsService] \u274C SMS service connection failed:", error);
      return false;
    }
  }
};
var smsService = new SmsService();

// server/telegramService.ts
import TelegramBot from "node-telegram-bot-api";
var TelegramService = class {
  bot = null;
  config = null;
  botUsername = null;
  initialize() {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      console.warn("[TelegramService] Telegram Bot Token not found. Telegram notifications will be disabled.");
      console.warn("[TelegramService] Set TELEGRAM_BOT_TOKEN in your .env file.");
      return false;
    }
    this.config = {
      botToken
    };
    try {
      this.bot = new TelegramBot(botToken, { polling: false });
      this.bot.getMe().then((me) => {
        this.botUsername = me.username || null;
        console.log(`[TelegramService] \u2705 Bot token verified: @${me.username}`);
        const isVercel = process.env.VERCEL === "1";
        if (this.bot && !isVercel) {
          this.bot.startPolling({ restart: false });
          console.log(`[TelegramService] \u2705 Started polling for updates`);
        } else if (isVercel) {
          console.log(`[TelegramService] \u2139 Polling disabled on Vercel (running in serverless mode)`);
        }
      }).catch((err) => {
        console.error("[TelegramService] \u274C Invalid bot token or connection failed:", err.message);
        console.error("[TelegramService] \u{1F4A1} Check your TELEGRAM_BOT_TOKEN in Render environment variables");
        console.error("[TelegramService] \u{1F4D6} Get a valid token from @BotFather on Telegram");
        this.bot = null;
        this.config = null;
        return false;
      });
      this.bot.on("polling_error", (error) => {
        const errorMsg = error.message || "";
        if (errorMsg.includes("409 Conflict")) {
          console.error("[TelegramService] \u26A0\uFE0F Conflict detected! Another instance is running. Stopping polling.");
          this.bot?.stopPolling();
        } else if (errorMsg.includes("401") || errorMsg.includes("Unauthorized")) {
          console.error("[TelegramService] \u274C 401 Unauthorized - Invalid bot token. Stopping polling.");
          console.error("[TelegramService] \u{1F4A1} Fix: Check TELEGRAM_BOT_TOKEN in Render environment variables");
          this.bot?.stopPolling();
          this.bot = null;
        } else if (errorMsg.includes("404") || errorMsg.includes("Not Found")) {
          console.error("[TelegramService] \u274C Bot not found. Token may be revoked. Stopping polling.");
          this.bot?.stopPolling();
          this.bot = null;
        } else {
          console.warn(`[TelegramService] Polling error: ${errorMsg}`);
        }
      });
      this.bot.onText(/\/start (.+)/, async (msg, match) => {
        const chatId = msg.chat.id.toString();
        const startParam = match?.[1];
        if (startParam) {
          try {
            const userId = startParam;
            const user = await storage.getUser(userId);
            if (user) {
              await storage.updateNotificationPreferences(userId, {
                telegramChatId: chatId,
                telegramNotifications: "true"
              });
              this.bot?.sendMessage(chatId, `\u2705 Connected! Hello ${user.username}, you will now receive food expiry reminders here.`);
              console.log(`[TelegramService] Linked user ${userId} to chat ${chatId}`);
            } else {
              this.bot?.sendMessage(chatId, "\u274C User not found. Please log in to the App first.");
            }
          } catch (err) {
            console.error("[TelegramService] Error linking user:", err);
            this.bot?.sendMessage(chatId, "\u274C An error occurred while linking your account.");
          }
        }
      });
      return true;
    } catch (error) {
      console.error("[TelegramService] \u274C Failed to initialize Telegram client:", error instanceof Error ? error.message : "Unknown error");
      this.bot = null;
      this.config = null;
      return false;
    }
  }
  isConfigured() {
    return this.bot !== null && this.config !== null;
  }
  getBotUsername() {
    return this.botUsername;
  }
  async sendExpiryNotification(user, expiringItems) {
    if (!this.isConfigured()) {
      console.log("[TelegramService] Service not configured");
      return false;
    }
    if (!user.telegramChatId) {
      console.log(`[TelegramService] User ${user.username} has no Telegram Chat ID`);
      return false;
    }
    try {
      console.log(`[TelegramService] Preparing notification for ${user.username}`);
      console.log(`[TelegramService] Number of expiring items: ${expiringItems.length}`);
      console.log(`[TelegramService] Items data:`, JSON.stringify(expiringItems, null, 2));
      const itemsList = expiringItems.map((item, index) => {
        console.log(`[TelegramService] Processing item ${index + 1}:`, {
          name: item.name,
          category: item.category,
          expiryDate: item.expiryDate
        });
        const daysLeft = this.calculateDaysLeft(item.expiryDate);
        const itemName = item.name || "Unknown Item";
        const category = item.category ? ` (${item.category})` : "";
        let statusEmoji = "";
        let statusText = "";
        if (daysLeft < 0) {
          statusEmoji = "\u274C";
          statusText = `expired ${Math.abs(daysLeft)} day${Math.abs(daysLeft) === 1 ? "" : "s"} ago`;
        } else if (daysLeft === 0) {
          statusEmoji = "\u26A0\uFE0F";
          statusText = "expires TODAY";
        } else if (daysLeft === 1) {
          statusEmoji = "\u23F0";
          statusText = "expires TOMORROW";
        } else {
          statusEmoji = "\u23F3";
          statusText = `expires in ${daysLeft} day${daysLeft === 1 ? "" : "s"}`;
        }
        const formattedItem = `${index + 1}. ${statusEmoji} *${itemName}*${category}
   \u2514 ${statusText}`;
        console.log(`[TelegramService] Formatted item ${index + 1}: ${formattedItem}`);
        return formattedItem;
      }).join("\n\n");
      const appUrl = process.env.APP_URL;
      const dashboardLink = appUrl ? `

[\u{1F4F1} Open Dashboard](${appUrl}/dashboard)` : `

\u{1F4A1} _Set APP_URL in .env to enable dashboard link_`;
      const message = `\u{1F34E} *Food Reminder Alert*

Hi ${user.username}! \u{1F44B}

You have *${expiringItems.length} item${expiringItems.length > 1 ? "s" : ""}* expiring soon:

${itemsList}${dashboardLink}`.trim();
      console.log(`[TelegramService] Final message to send:
${message}`);
      console.log(`[TelegramService] Sending to chat ID: ${user.telegramChatId}`);
      await this.bot.sendMessage(user.telegramChatId, message, {
        parse_mode: "Markdown",
        disable_web_page_preview: true
      });
      console.log(`[TelegramService] \u2705 Telegram notification sent to ${user.username}`);
      return true;
    } catch (error) {
      console.error(`[TelegramService] \u274C Failed to send Telegram message:`, error);
      if (error instanceof Error) {
        console.error(`[TelegramService] Error message: ${error.message}`);
        console.error(`[TelegramService] Error stack: ${error.stack}`);
      }
      return false;
    }
  }
  calculateDaysLeft(expiryDate) {
    const today = /* @__PURE__ */ new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDate);
    expiry.setHours(0, 0, 0, 0);
    return Math.ceil((expiry.getTime() - today.getTime()) / (1e3 * 60 * 60 * 24));
  }
};
var telegramService = new TelegramService();

// server/pushService.ts
import webpush from "web-push";
var PushService = class {
  config = null;
  initialize() {
    const publicKey = process.env.VAPID_PUBLIC_KEY || "BCNorKQy5pNRp7fXg1xrTCmvgvk_maqEP_AOoxAevfKYH3rqZnL9Jyb6WjkdyS-tBx1vPDDgOtbpNDx6laCWw_o";
    const privateKey = process.env.VAPID_PRIVATE_KEY || "M14f0sqJjV99upZc1aJahq7ULa5AWPsHibyUmMVXuoY";
    const email = process.env.VAPID_EMAIL || "mailto:admin@foodremainder.com";
    if (!publicKey || !privateKey) {
      console.warn("[PushService] VAPID keys not found. Push notifications disabled.");
      return false;
    }
    this.config = { publicKey, privateKey, email };
    webpush.setVapidDetails(
      email,
      publicKey,
      privateKey
    );
    console.log("[PushService] \u2705 Push notification service initialized");
    return true;
  }
  getPublicKey() {
    return this.config?.publicKey || null;
  }
  isConfigured() {
    return this.config !== null;
  }
  async sendExpiryNotification(user, expiringItems) {
    console.log(`[PushService] ========================================`);
    console.log(`[PushService] Starting push notification for user: ${user.username}`);
    console.log(`[PushService] User ID: ${user.id}`);
    console.log(`[PushService] Expiring items count: ${expiringItems.length}`);
    if (!this.isConfigured()) {
      console.log(`[PushService] \u274C Service not configured, skipping push for user ${user.username}`);
      console.log(`[PushService] ========================================`);
      return false;
    }
    console.log(`[PushService] \u2705 Service is configured`);
    console.log(`[PushService] User pushSubscriptions:`, user.pushSubscriptions);
    console.log(`[PushService] pushSubscriptions type:`, typeof user.pushSubscriptions);
    console.log(`[PushService] pushSubscriptions length:`, user.pushSubscriptions?.length);
    if (!user.pushSubscriptions || user.pushSubscriptions.length === 0) {
      console.log(`[PushService] \u274C No push subscriptions found for user ${user.username}`);
      console.log(`[PushService] ========================================`);
      return false;
    }
    console.log(`[PushService] \u2705 Found ${user.pushSubscriptions.length} subscription(s) for user ${user.username}`);
    const itemsList = expiringItems.map((item) => item.name).join(", ");
    const count = expiringItems.length;
    const title = `\u{1F34E} Food Expiry Alert: ${count} item${count > 1 ? "s" : ""}`;
    const body = `Expiring soon: ${itemsList}`;
    const payload = JSON.stringify({
      title,
      body,
      icon: "/icon-192.png",
      badge: "/badge.png",
      vibrate: [100, 50, 100],
      data: {
        url: "/dashboard",
        timestamp: Date.now()
      }
    });
    console.log(`[PushService] Notification payload:`, payload);
    let successCount = 0;
    const failedSubscriptions = [];
    for (let i = 0; i < user.pushSubscriptions.length; i++) {
      const subStr = user.pushSubscriptions[i];
      console.log(`[PushService] Processing subscription ${i + 1}/${user.pushSubscriptions.length}`);
      console.log(`[PushService] Subscription string length:`, subStr.length);
      try {
        const sub = JSON.parse(subStr);
        console.log(`[PushService] Parsed subscription endpoint:`, sub.endpoint?.substring(0, 80) + "...");
        console.log(`[PushService] Sending notification...`);
        await webpush.sendNotification(sub, payload);
        successCount++;
        console.log(`[PushService] \u2705 Push sent successfully to subscription ${i + 1}`);
      } catch (error) {
        console.error(`[PushService] \u274C Error sending push to subscription ${i + 1}:`, error);
        console.error(`[PushService] Error status code:`, error.statusCode);
        console.error(`[PushService] Error message:`, error.message);
        console.error(`[PushService] Error body:`, error.body);
        if (error.statusCode === 410 || error.statusCode === 404) {
          console.log(`[PushService] \u26A0\uFE0F Subscription expired (${error.statusCode}), marking for cleanup`);
          failedSubscriptions.push(subStr);
        } else {
          console.error(`[PushService] \u274C Unexpected error (${error.statusCode || "unknown"}):`, error.message);
        }
      }
    }
    if (failedSubscriptions.length > 0) {
      console.log(`[PushService] \u{1F5D1}\uFE0F ${failedSubscriptions.length} expired subscription(s) should be removed for user ${user.username}`);
    }
    if (successCount > 0) {
      console.log(`[PushService] \u2705 Successfully sent ${successCount}/${user.pushSubscriptions.length} push notifications to ${user.username}`);
      console.log(`[PushService] ========================================`);
      return true;
    }
    console.log(`[PushService] \u274C Failed to send any push notifications to ${user.username}`);
    console.log(`[PushService] ========================================`);
    return false;
  }
};
var pushService = new PushService();

// server/notificationChecker.ts
var NotificationChecker = class {
  /**
   * Check if user should receive notification based on their frequency preference
   * Modified to use persistent storage
   */
  shouldNotifyUser(user) {
    const notificationsPerDay = parseInt(user.notificationsPerDay || "24");
    const hoursPerNotification = 24 / notificationsPerDay;
    const minMillisecondsBetween = hoursPerNotification * 60 * 60 * 1e3;
    const lastNotifiedStr = user.lastNotificationSentAt;
    const now = Date.now();
    console.log(`[NotificationChecker] \u{1F50D} Frequency check for ${user.username}:`);
    console.log(`[NotificationChecker]    Notifications per day: ${notificationsPerDay}`);
    console.log(`[NotificationChecker]    Hours between notifications: ${hoursPerNotification.toFixed(2)}`);
    console.log(`[NotificationChecker]    Last notification: ${lastNotifiedStr || "NEVER"}`);
    if (!lastNotifiedStr || lastNotifiedStr === "null" || lastNotifiedStr === "") {
      console.log(`[NotificationChecker] \u2705 First notification for user ${user.username} - allowing`);
      return true;
    }
    const lastNotified = new Date(lastNotifiedStr).getTime();
    if (isNaN(lastNotified)) {
      console.log(`[NotificationChecker] \u26A0\uFE0F Invalid lastNotificationSentAt timestamp for ${user.username}: "${lastNotifiedStr}" - allowing notification`);
      return true;
    }
    const timeSinceLastNotification = now - lastNotified;
    const hoursSinceLastNotification = (timeSinceLastNotification / (1e3 * 60 * 60)).toFixed(2);
    const shouldNotify = timeSinceLastNotification >= minMillisecondsBetween;
    console.log(`[NotificationChecker]    Time since last notification: ${hoursSinceLastNotification} hours`);
    console.log(`[NotificationChecker]    Minimum required: ${hoursPerNotification.toFixed(2)} hours`);
    if (!shouldNotify) {
      const hoursRemaining = ((minMillisecondsBetween - timeSinceLastNotification) / (1e3 * 60 * 60)).toFixed(2);
      console.log(`[NotificationChecker] \u23F3 User ${user.username} needs to wait ${hoursRemaining} more hours (${notificationsPerDay}x/day)`);
      console.log(`[NotificationChecker]    Next notification allowed at: ${new Date(lastNotified + minMillisecondsBetween).toISOString()}`);
    } else {
      console.log(`[NotificationChecker] \u2705 User ${user.username} frequency check passed - allowing notification`);
    }
    return shouldNotify;
  }
  /**
   * Record that a notification was sent to a user
   */
  async recordNotification(userId) {
    try {
      await storage.updateLastNotificationTime(userId);
    } catch (error) {
      console.error(`[NotificationChecker] Failed to record notification time for ${userId}:`, error);
    }
  }
  /**
   * Check all users for expiring food items and send notifications
   */
  async checkAndNotifyAll() {
    console.log("[NotificationChecker] ========================================");
    console.log("[NotificationChecker] \u{1F514} Starting notification check for all users...");
    console.log("[NotificationChecker] Timestamp:", (/* @__PURE__ */ new Date()).toISOString());
    console.log("[NotificationChecker] Timezone:", Intl.DateTimeFormat().resolvedOptions().timeZone);
    console.log("[NotificationChecker] ========================================");
    const results = [];
    let totalUsers = 0;
    let usersWithNotifications = 0;
    let usersSkipped = 0;
    let usersFailed = 0;
    try {
      const users = await storage.getAllUsers();
      totalUsers = users.length;
      console.log(`[NotificationChecker] \u{1F4CA} Found ${totalUsers} total users to check`);
      if (totalUsers === 0) {
        console.log("[NotificationChecker] \u26A0\uFE0F No users found in database");
        console.log("[NotificationChecker] \u26A0\uFE0F This might indicate a database connection issue");
        return results;
      }
      for (let i = 0; i < users.length; i++) {
        const user = users[i];
        try {
          console.log(`[NotificationChecker] ========================================`);
          console.log(`[NotificationChecker] \u{1F464} Processing user ${i + 1}/${totalUsers}`);
          console.log(`[NotificationChecker]    Username: ${user.username}`);
          console.log(`[NotificationChecker]    Email: ${user.email}`);
          console.log(`[NotificationChecker]    Mobile: ${user.mobile}`);
          console.log(`[NotificationChecker]    User ID: ${user.id}`);
          const result2 = await this.checkAndNotifyUser(user);
          if (result2) {
            results.push(result2);
            usersWithNotifications++;
            console.log(`[NotificationChecker] \u2705 SUCCESS for ${user.username}:`);
            console.log(`[NotificationChecker]    Email: ${result2.emailSent ? "\u2705" : "\u274C"}`);
            console.log(`[NotificationChecker]    WhatsApp: ${result2.whatsappSent ? "\u2705" : "\u274C"}`);
            console.log(`[NotificationChecker]    SMS: ${result2.smsSent ? "\u2705" : "\u274C"}`);
            console.log(`[NotificationChecker]    Telegram: ${result2.telegramSent ? "\u2705" : "\u274C"}`);
            console.log(`[NotificationChecker]    Browser Push: ${result2.pushSent ? "\u2705" : "\u274C"}`);
          } else {
            usersSkipped++;
            console.log(`[NotificationChecker] \u23ED\uFE0F SKIPPED ${user.username}`);
            console.log(`[NotificationChecker]    Reason: No expiring items, notifications disabled, or in quiet hours`);
          }
        } catch (error) {
          usersFailed++;
          console.error(`[NotificationChecker] ========================================`);
          console.error(`[NotificationChecker] \u274C FAILED for user ${user.username} (${user.id})`);
          console.error(`[NotificationChecker]    Error:`, error instanceof Error ? error.message : String(error));
          console.error(`[NotificationChecker]    Stack:`, error instanceof Error ? error.stack : "No stack trace");
          console.error(`[NotificationChecker] ========================================`);
        }
      }
      console.log("[NotificationChecker] ========================================");
      console.log("[NotificationChecker] \u{1F4CA} FINAL SUMMARY:");
      console.log(`[NotificationChecker]    Total users: ${totalUsers}`);
      console.log(`[NotificationChecker]    \u2705 Notifications sent: ${usersWithNotifications}`);
      console.log(`[NotificationChecker]    \u23ED\uFE0F Skipped: ${usersSkipped}`);
      console.log(`[NotificationChecker]    \u274C Failed: ${usersFailed}`);
      console.log("[NotificationChecker] ========================================");
      return results;
    } catch (error) {
      console.error("[NotificationChecker] \u274C CRITICAL ERROR during notification check:");
      console.error("[NotificationChecker]    Error:", error instanceof Error ? error.message : String(error));
      console.error("[NotificationChecker]    Stack:", error instanceof Error ? error.stack : "No stack trace");
      return results;
    }
  }
  /**
   * Check if current time is within user's quiet hours
   */
  isInQuietHours(user) {
    if (!user.quietHoursStart || !user.quietHoursEnd) return false;
    const now = /* @__PURE__ */ new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const [startH, startM] = user.quietHoursStart.split(":").map(Number);
    const [endH, endM] = user.quietHoursEnd.split(":").map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    if (startMinutes < endMinutes) {
      return currentMinutes >= startMinutes && currentMinutes < endMinutes;
    }
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }
  /**
   * Check and notify a specific user
   */
  async checkAndNotifyUser(user, itemsOverride, isTest = false) {
    if (!isTest && !itemsOverride && !this.shouldNotifyUser(user)) {
      console.log(`[NotificationChecker] \u23ED\uFE0F Skipping notification for user ${user.username} due to frequency preference`);
      return null;
    }
    if (!isTest && !itemsOverride && this.isInQuietHours(user)) {
      console.log(`[NotificationChecker] Skipping notification for user ${user.username} due to quiet hours`);
      return null;
    }
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
    const notificationDays = parseInt(user.notificationDays || "3");
    let expiringItems = [];
    if (itemsOverride) {
      expiringItems = itemsOverride;
    } else {
      const foodItems = await storage.getFoodItemsByUserId(user.id);
      expiringItems = this.getExpiringItems(foodItems, notificationDays);
    }
    if (expiringItems.length === 0) {
      console.log(`[NotificationChecker] \u2139\uFE0F No expiring items for ${user.username} (threshold: ${notificationDays} days)`);
      return null;
    }
    console.log(`[NotificationChecker] \u{1F3AF} User ${user.username} has ${expiringItems.length} expiring items`);
    expiringItems.forEach((item) => {
      const expiryDate = new Date(item.expiryDate);
      const daysLeft = Math.ceil((expiryDate.getTime() - (/* @__PURE__ */ new Date()).setHours(0, 0, 0, 0)) / (1e3 * 60 * 60 * 24));
      console.log(`[NotificationChecker]    - ${item.name}: expires in ${daysLeft} days`);
    });
    const result2 = {
      userId: user.id,
      username: user.username,
      itemCount: expiringItems.length,
      emailSent: false,
      whatsappSent: false,
      smsSent: false,
      telegramSent: false,
      pushSent: false
    };
    const channelTasks = [];
    if (emailEnabled && emailService.isConfigured()) {
      channelTasks.push((async () => {
        try {
          console.log(`[NotificationChecker] \u{1F4E7} Attempting to send email notification to ${user.email}...`);
          result2.emailSent = await emailService.sendExpiryNotification(user, expiringItems);
          console.log(`[NotificationChecker] Email result: ${result2.emailSent ? "\u2705 Sent" : "\u274C Failed"}`);
        } catch (err) {
          console.error(`[NotificationChecker] \u274C Email send error:`, err);
        }
      })());
    } else {
      console.log(`[NotificationChecker] \u23ED\uFE0F Skipping email (enabled: ${emailEnabled}, configured: ${emailService.isConfigured()})`);
    }
    if (whatsappEnabled) {
      channelTasks.push((async () => {
        try {
          console.log(`[NotificationChecker] \u{1F4F1} Attempting to send WhatsApp notification...`);
          if (whatsappCloudService.isConfigured()) {
            result2.whatsappSent = await whatsappCloudService.sendExpiryNotification(user, expiringItems);
          } else if (whatsappService.isConfigured()) {
            result2.whatsappSent = await whatsappService.sendExpiryNotification(user, expiringItems);
          } else {
            console.log(`[NotificationChecker] \u26A0\uFE0F WhatsApp enabled but no service configured`);
          }
          console.log(`[NotificationChecker] WhatsApp result: ${result2.whatsappSent ? "\u2705 Sent" : "\u274C Failed"}`);
        } catch (err) {
          console.error(`[NotificationChecker] \u274C WhatsApp send error:`, err);
        }
      })());
    } else {
      console.log(`[NotificationChecker] \u23ED\uFE0F Skipping WhatsApp (not enabled for user)`);
    }
    if (smsEnabled && smsService.isConfigured()) {
      channelTasks.push((async () => {
        try {
          console.log(`[NotificationChecker] \u{1F4F2} Attempting to send SMS notification...`);
          result2.smsSent = await smsService.sendExpiryNotification(user, expiringItems);
          console.log(`[NotificationChecker] SMS result: ${result2.smsSent ? "\u2705 Sent" : "\u274C Failed"}`);
        } catch (err) {
          console.error(`[NotificationChecker] \u274C SMS send error:`, err);
        }
      })());
    } else {
      console.log(`[NotificationChecker] \u23ED\uFE0F Skipping SMS (enabled: ${smsEnabled}, configured: ${smsService.isConfigured()})`);
    }
    if (telegramEnabled && telegramService.isConfigured()) {
      channelTasks.push((async () => {
        try {
          console.log(`[NotificationChecker] \u{1F4AC} Attempting to send Telegram notification...`);
          result2.telegramSent = await telegramService.sendExpiryNotification(user, expiringItems);
          console.log(`[NotificationChecker] Telegram result: ${result2.telegramSent ? "\u2705 Sent" : "\u274C Failed"}`);
        } catch (err) {
          console.error(`[NotificationChecker] \u274C Telegram send error:`, err);
        }
      })());
    } else {
      console.log(`[NotificationChecker] \u23ED\uFE0F Skipping Telegram (enabled: ${telegramEnabled}, configured: ${telegramService.isConfigured()})`);
    }
    if (pushEnabled && pushService.isConfigured()) {
      channelTasks.push((async () => {
        try {
          console.log(`[NotificationChecker] \u{1F514} Attempting to send browser push notification...`);
          result2.pushSent = await pushService.sendExpiryNotification(user, expiringItems);
          console.log(`[NotificationChecker] Browser Push result: ${result2.pushSent ? "\u2705 Sent" : "\u274C Failed"}`);
        } catch (err) {
          console.error(`[NotificationChecker] \u274C Browser Push send error:`, err);
        }
      })());
    } else {
      console.log(`[NotificationChecker] \u23ED\uFE0F Skipping browser push (enabled: ${pushEnabled}, configured: ${pushService.isConfigured()})`);
    }
    await Promise.allSettled(channelTasks);
    if (result2.emailSent || result2.whatsappSent || result2.smsSent || result2.telegramSent || result2.pushSent) {
      await this.recordNotification(user.id);
      console.log(`[NotificationChecker] \u2705 Notification sent to ${user.username}, recorded for frequency tracking`);
    }
    return result2;
  }
  /**
   * Get items that are expiring within the threshold
   */
  getExpiringItems(items, daysThreshold) {
    const today = /* @__PURE__ */ new Date();
    today.setHours(0, 0, 0, 0);
    return items.filter((item) => {
      const expiryDate = new Date(item.expiryDate);
      expiryDate.setHours(0, 0, 0, 0);
      const daysLeft = Math.ceil((expiryDate.getTime() - today.getTime()) / (1e3 * 60 * 60 * 24));
      return daysLeft >= 0 && daysLeft <= daysThreshold;
    });
  }
  /**
   * Test notification for a specific user
   */
  async testNotification(userId) {
    try {
      const user = await storage.getUser(userId);
      if (!user) {
        return { success: false, message: "User not found" };
      }
      const tempStart = user.quietHoursStart;
      user.quietHoursStart = null;
      let result2 = await this.checkAndNotifyUser(user, void 0, true);
      if (!result2) {
        console.log("[NotificationChecker] No real expiring items found for test. Generating mock item.");
        const mockItem = {
          id: "test-item",
          userId: user.id,
          name: "Test Notification Item",
          quantity: "1",
          purchaseDate: (/* @__PURE__ */ new Date()).toISOString(),
          expiryDate: (/* @__PURE__ */ new Date()).toISOString(),
          category: "Test",
          notes: "This is a test notification.",
          barcode: null,
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        };
        result2 = await this.checkAndNotifyUser(user, [mockItem]);
      }
      user.quietHoursStart = tempStart;
      if (!result2) {
        return {
          success: false,
          message: "No notification channels enabled. Please enable Email, WhatsApp, Telegram, or Browser Notifications."
        };
      }
      const sentMethods = [];
      if (result2.emailSent) sentMethods.push("Email");
      if (result2.whatsappSent) sentMethods.push("WhatsApp");
      if (result2.smsSent) sentMethods.push("SMS");
      if (result2.telegramSent) sentMethods.push("Telegram");
      if (result2.pushSent) sentMethods.push("Browser Push");
      if (sentMethods.length === 0) {
        return {
          success: false,
          message: "Failed to send notifications. Check if services are configured correctly."
        };
      }
      return {
        success: true,
        message: `Test notification sent via ${sentMethods.join(", ")}`
      };
    } catch (error) {
      console.error("[NotificationChecker] Test notification error:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }
};
var notificationChecker = new NotificationChecker();

// server/aiService.ts
var FOOD_KNOWLEDGE_BASE = {
  // Dairy
  milk: { category: "Dairy", shelfLifeDays: 7, storage: "fridge", tips: "Keep in the main fridge body, not the door where temperature fluctuates." },
  cheese: { category: "Dairy", shelfLifeDays: 21, storage: "fridge", tips: "Wrap in parchment paper rather than plastic wrap to let it breathe." },
  yogurt: { category: "Dairy", shelfLifeDays: 14, storage: "fridge", tips: "Keep tightly sealed; watery whey separation is natural\u2014just stir it in." },
  butter: { category: "Dairy", shelfLifeDays: 60, storage: "fridge", tips: "Can be frozen for up to 9 months if unopened." },
  cream: { category: "Dairy", shelfLifeDays: 10, storage: "fridge", tips: "Use within 7-10 days after opening." },
  paneer: { category: "Dairy", shelfLifeDays: 5, storage: "fridge", tips: "Submerge in fresh water in an airtight container to keep moist." },
  egg: { category: "Dairy", shelfLifeDays: 28, storage: "fridge", tips: "Keep in carton in main fridge shelf, not on door rack." },
  // Fruits
  banana: { category: "Fruits", shelfLifeDays: 5, storage: "pantry", tips: "Store away from other fruits to prevent rapid ripening from ethylene gas." },
  apple: { category: "Fruits", shelfLifeDays: 28, storage: "fridge", tips: "Apples last 3-4x longer in the crisper drawer than at room temperature." },
  strawberry: { category: "Fruits", shelfLifeDays: 4, storage: "fridge", tips: "Do not wash until right before eating to prevent mold." },
  berries: { category: "Fruits", shelfLifeDays: 5, storage: "fridge", tips: "Store in a single layer lined with paper towel in a breathable container." },
  orange: { category: "Fruits", shelfLifeDays: 21, storage: "fridge", tips: "Can stay at room temp for 1 week, or crisper drawer for 3-4 weeks." },
  lemon: { category: "Fruits", shelfLifeDays: 21, storage: "fridge", tips: "Store in a sealed bag in the fridge to keep juicy." },
  avocado: { category: "Fruits", shelfLifeDays: 4, storage: "pantry", tips: "Ripen on counter, then move to fridge to prolong freshness by 3-5 days." },
  tomato: { category: "Fruits", shelfLifeDays: 7, storage: "pantry", tips: "Store stem-side down at room temp. Refrigeration ruins texture and flavor." },
  mango: { category: "Fruits", shelfLifeDays: 6, storage: "pantry", tips: "Keep at room temp until soft and fragrant, then refrigerate." },
  watermelon: { category: "Fruits", shelfLifeDays: 7, storage: "fridge", tips: "Cover cut surfaces tightly with cling film and keep chilled." },
  grapes: { category: "Fruits", shelfLifeDays: 10, storage: "fridge", tips: "Keep in original perforated bag in produce drawer; wash before eating." },
  // Vegetables
  spinach: { category: "Vegetables", shelfLifeDays: 5, storage: "fridge", tips: "Place a dry paper towel in the box to absorb excess moisture." },
  lettuce: { category: "Vegetables", shelfLifeDays: 7, storage: "fridge", tips: "Keep leaves dry. Wrap in a cloth or paper towel inside crisper." },
  carrot: { category: "Vegetables", shelfLifeDays: 21, storage: "fridge", tips: "Remove green tops before storing; they pull moisture from roots." },
  potato: { category: "Vegetables", shelfLifeDays: 30, storage: "pantry", tips: "Store in a cool, dark, ventilated spot. Never next to onions." },
  onion: { category: "Vegetables", shelfLifeDays: 30, storage: "pantry", tips: "Keep dry and ventilated. Do not store in plastic bags." },
  garlic: { category: "Vegetables", shelfLifeDays: 60, storage: "pantry", tips: "Keep whole heads in an open container at room temp." },
  broccoli: { category: "Vegetables", shelfLifeDays: 7, storage: "fridge", tips: "Mist heads loosely or wrap in damp paper towel." },
  cucumber: { category: "Vegetables", shelfLifeDays: 7, storage: "fridge", tips: "Sensitive to cold; keep near front of fridge or warm zone." },
  bell_pepper: { category: "Vegetables", shelfLifeDays: 10, storage: "fridge", tips: "Keep whole and dry in crisper drawer." },
  capsicum: { category: "Vegetables", shelfLifeDays: 10, storage: "fridge", tips: "Store whole in produce drawer with low humidity." },
  mushroom: { category: "Vegetables", shelfLifeDays: 6, storage: "fridge", tips: "Keep in original brown paper bag to let moisture escape." },
  cabbage: { category: "Vegetables", shelfLifeDays: 21, storage: "fridge", tips: "Keep whole head unwashed in crisper drawer." },
  cauliflower: { category: "Vegetables", shelfLifeDays: 10, storage: "fridge", tips: "Store stem-side up in a perforated bag to prevent condensation." },
  // Meat & Seafood
  chicken: { category: "Meat", shelfLifeDays: 2, storage: "fridge", tips: "Keep on lowest fridge shelf to avoid drips. Freeze if not cooking within 48h." },
  beef: { category: "Meat", shelfLifeDays: 3, storage: "fridge", tips: "Ground beef lasts 1-2 days; whole cuts last 3-5 days refrigerated." },
  fish: { category: "Seafood", shelfLifeDays: 2, storage: "fridge", tips: "Cook within 24-48 hours or freeze immediately." },
  salmon: { category: "Seafood", shelfLifeDays: 2, storage: "fridge", tips: "Keep on a bed of ice or in the coldest corner of the fridge." },
  prawns: { category: "Seafood", shelfLifeDays: 2, storage: "fridge", tips: "Thaw slowly in fridge, cook promptly." },
  // Grains & Bakery
  bread: { category: "Grains", shelfLifeDays: 6, storage: "pantry", tips: "Avoid fridge (causes staling). Slice and freeze for long-term storage." },
  rice: { category: "Grains", shelfLifeDays: 180, storage: "pantry", tips: "Store in airtight jar in dry pantry. Cooked rice lasts 3-4 days in fridge." },
  pasta: { category: "Grains", shelfLifeDays: 365, storage: "pantry", tips: "Dry pasta lasts 1-2 years. Cooked pasta lasts 4-5 days." },
  flour: { category: "Grains", shelfLifeDays: 240, storage: "pantry", tips: "Seal tightly in container to prevent pantry bugs." },
  oats: { category: "Grains", shelfLifeDays: 180, storage: "pantry", tips: "Keep cool and dry. Ideal container prevents humidity absorption." }
};
function classifyIngredient(name, category) {
  const n = name.toLowerCase();
  const c = (category || "").toLowerCase();
  if (c.includes("fruit") || /banana|apple|strawberry|berry|berries|blueberry|raspberry|orange|mango|pineapple|watermelon|melon|grape|peach|pear|plum|kiwi|papaya|lemon|lime|avocado|cherry|dates|figs/.test(n)) {
    return "fruit";
  }
  if (c.includes("dairy") || /milk|cheese|yogurt|curd|paneer|butter|cream|cottage cheese|mozzarella|cheddar|parmesan|ghee/.test(n)) {
    return "dairy";
  }
  if (c.includes("meat") || c.includes("seafood") || /chicken|fish|salmon|tuna|shrimp|prawn|egg|eggs|beef|pork|mutton|lamb|bacon|sausage|turkey|tofu/.test(n)) {
    return "meat";
  }
  if (c.includes("veg") || /tomato|potato|onion|garlic|carrot|broccoli|spinach|lettuce|cabbage|cauliflower|bell pepper|capsicum|mushroom|cucumber|zucchini|ginger|chili|peas|corn|celery|beans|kale|brinjal|eggplant/.test(n)) {
    return "vegetable";
  }
  if (c.includes("grain") || c.includes("bakery") || /bread|rice|pasta|noodle|noodles|oat|oats|oatmeal|flour|tortilla|roti|chapati|bun|toast|cereal/.test(n)) {
    return "grain";
  }
  return "other";
}
var AIService = class {
  apiKey = null;
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || null;
  }
  hasGeminiKey() {
    return Boolean(this.apiKey && this.apiKey.trim().length > 10);
  }
  /**
   * Predict shelf life and storage recommendations for a given food item name
   */
  async predictShelfLife(foodName, userCategory) {
    const cleanName = foodName.toLowerCase().trim();
    if (this.hasGeminiKey()) {
      try {
        const prompt = `As a culinary preservation expert, return JSON only for this food item: "${foodName}".
Format:
{
  "category": "Dairy" | "Fruits" | "Vegetables" | "Meat" | "Seafood" | "Grains" | "Beverages" | "Snacks" | "Other",
  "shelfLifeDays": number,
  "storageLocation": "fridge" | "pantry" | "freezer",
  "storageTips": "Short practical sentence on best storage method."
}`;
        const response = await this.callGemini(prompt);
        if (response) {
          const parsed = this.parseJsonFromMarkdown(response);
          if (parsed && parsed.shelfLifeDays) {
            return {
              foodName,
              category: parsed.category || userCategory || "Other",
              shelfLifeDays: Math.max(1, Number(parsed.shelfLifeDays) || 7),
              storageLocation: parsed.storageLocation || "fridge",
              storageTips: parsed.storageTips || "Keep sealed in a cool environment.",
              confidence: 0.95
            };
          }
        }
      } catch (err) {
        console.warn("[AIService] Gemini call failed, falling back to knowledge base:", err);
      }
    }
    for (const [key, value] of Object.entries(FOOD_KNOWLEDGE_BASE)) {
      if (cleanName.includes(key) || key.includes(cleanName)) {
        return {
          foodName,
          category: userCategory || value.category,
          shelfLifeDays: value.shelfLifeDays,
          storageLocation: value.storage,
          storageTips: value.tips,
          confidence: 0.9
        };
      }
    }
    const cat = (userCategory || "").toLowerCase();
    if (cat.includes("dairy")) {
      return { foodName, category: "Dairy", shelfLifeDays: 7, storageLocation: "fridge", storageTips: "Store in coldest section of the refrigerator.", confidence: 0.75 };
    }
    if (cat.includes("fruit")) {
      return { foodName, category: "Fruits", shelfLifeDays: 6, storageLocation: "fridge", storageTips: "Keep unwashed in the produce drawer.", confidence: 0.75 };
    }
    if (cat.includes("veg")) {
      return { foodName, category: "Vegetables", shelfLifeDays: 7, storageLocation: "fridge", storageTips: "Wrap in a dry cloth or paper towel to control moisture.", confidence: 0.75 };
    }
    if (cat.includes("meat")) {
      return { foodName, category: "Meat", shelfLifeDays: 3, storageLocation: "fridge", storageTips: "Keep chilled on bottom shelf or freeze immediately.", confidence: 0.8 };
    }
    if (cat.includes("seafood") || cat.includes("fish")) {
      return { foodName, category: "Seafood", shelfLifeDays: 2, storageLocation: "fridge", storageTips: "Cook within 48 hours or freeze.", confidence: 0.85 };
    }
    if (cat.includes("grain") || cat.includes("bread")) {
      return { foodName, category: "Grains", shelfLifeDays: 14, storageLocation: "pantry", storageTips: "Store in an airtight container away from moisture.", confidence: 0.7 };
    }
    return {
      foodName,
      category: userCategory || "Other",
      shelfLifeDays: 7,
      storageLocation: "fridge",
      storageTips: "Keep sealed in an airtight container to retain quality.",
      confidence: 0.6
    };
  }
  /**
   * Generate zero-waste recipes strictly prioritizing the user's available and expiring foods
   */
  async generateRecipes(items, preferences) {
    if (!items || items.length === 0) {
      return [];
    }
    const sortedItems = [...items].sort((a, b) => (a.daysLeft ?? 99) - (b.daysLeft ?? 99));
    const availableNames = sortedItems.map((i) => i.name).slice(0, 15);
    const expiringItems = sortedItems.filter((i) => i.daysLeft !== void 0 ? i.daysLeft <= 4 : true);
    if (this.hasGeminiKey()) {
      try {
        const prompt = `You are an expert master chef specialized in zero-waste cooking.
The user has these EXACT food items in their kitchen:
All Items: ${availableNames.join(", ")}
Expiring Soonest: ${expiringItems.map((i) => `${i.name} (${i.daysLeft ?? "?"} days left)`).join(", ")}
Preferences: Meal type: ${preferences?.mealType || "any"}, Dietary: ${preferences?.dietaryRestrictions || "none"}

CRITICAL CULINARY RULES:
1. ONLY generate recipes whose flavor combinations make genuine culinary sense. NEVER mix incompatible items (e.g. NEVER put bananas, strawberries, or milk into garlic-egg stir-fries or savory soy-sauce vegetable bowls).
2. If the user has sweet items (fruits, sweet dairy, oats, bread), create delicious sweet/breakfast dishes (smoothies, fruit bowls, baked toast, parfaits).
3. If the user has savory items (vegetables, proteins, grains, garlic, tomatoes), create savory dishes (saut\xE9, stir-fry, curry, soup, pasta, grain bowl).
4. In "expiringIngredientsUsed", ONLY list names that appear in the user's list.
5. In "instructions", explicitly mention the user's exact ingredient names.

Return ONLY valid JSON matching this exact structure:
[
  {
    "id": "recipe-1",
    "title": "Exact Title Mentioning Key Items",
    "description": "Short appetizing description highlighting the zero-waste benefits",
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "difficulty": "Easy" | "Medium" | "Advanced",
    "servings": 2,
    "expiringIngredientsUsed": ["Exact Item 1", "Exact Item 2"],
    "additionalPantryItems": ["Salt", "Cooking Oil", "Garlic"],
    "instructions": [
      "Step 1...",
      "Step 2...",
      "Step 3..."
    ],
    "nutritionalHighlight": "High in vitamins and gut-friendly fiber"
  }
]`;
        const response = await this.callGemini(prompt);
        if (response) {
          const parsed = this.parseJsonFromMarkdown(response);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch (err) {
        console.warn("[AIService] Gemini recipe generation fallback triggered:", err);
      }
    }
    return this.generateSmartCulinaryRecipes(sortedItems, preferences?.mealType);
  }
  /**
   * Dynamic, ingredient-accurate zero-waste recipe generator
   * Matches compatible ingredients together with zero culinary mismatches.
   */
  generateSmartCulinaryRecipes(items, mealType) {
    const categorized = items.map((item) => ({
      ...item,
      type: classifyIngredient(item.name, item.category)
    }));
    const fruits = categorized.filter((i) => i.type === "fruit");
    const veggies = categorized.filter((i) => i.type === "vegetable");
    const dairy = categorized.filter((i) => i.type === "dairy");
    const meats = categorized.filter((i) => i.type === "meat");
    const grains = categorized.filter((i) => i.type === "grain");
    const recipes = [];
    const joinNames = (arr) => {
      if (arr.length === 0) return "";
      const names = arr.map((x) => typeof x === "string" ? x : x.name);
      if (names.length === 1) return names[0];
      if (names.length === 2) return `${names[0]} and ${names[1]}`;
      return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
    };
    if (fruits.length > 0) {
      const mainFruits = fruits.slice(0, 3);
      const usedDairy = dairy.find((d) => /milk|yogurt|curd|cream/i.test(d.name));
      const usedGrain = grains.find((g) => /oat|bread|toast/i.test(g.name));
      const ingredientsUsed = mainFruits.map((f) => f.name);
      if (usedDairy) ingredientsUsed.push(usedDairy.name);
      if (usedGrain) ingredientsUsed.push(usedGrain.name);
      const title = `Fresh ${joinNames(mainFruits)} ${usedDairy ? "Smoothie & Parfait Bowl" : "Antioxidant Fruit Bowl"}`;
      const instructions = [
        `Thoroughly wash and prep your ${joinNames(mainFruits)}, peeling or slicing into bite-sized pieces.`,
        usedDairy ? `Combine the ${mainFruits[0].name} with chilled ${usedDairy.name} in a blender (or bowl) and blend until velvety smooth.` : `Arrange the freshly cut ${joinNames(mainFruits)} in a clean serving bowl.`,
        usedGrain ? `Top with ${usedGrain.name} and a light drizzle of honey or maple syrup for natural sweetness and crunch.` : `Garnish with a squeeze of fresh lemon/lime or mint leaves if on hand to brighten the natural flavors.`,
        "Serve chilled immediately to enjoy maximum vitamin and antioxidant retention."
      ];
      recipes.push({
        id: "recipe-fruit-sunshine",
        title,
        description: `A vibrant, zero-waste energizing bowl specifically crafted to consume your ${joinNames(mainFruits)} at peak freshness.`,
        prepTime: "5 mins",
        cookTime: "0 mins",
        difficulty: "Easy",
        servings: 1,
        expiringIngredientsUsed: ingredientsUsed,
        additionalPantryItems: ["Honey or Maple Syrup", "Cold Water or Ice", "Pinch of Cinnamon"],
        instructions,
        nutritionalHighlight: "Rich in natural vitamin C, potassium, and active enzymes."
      });
      if (grains.length > 0 || fruits.length > 1) {
        const topFruit = fruits[0];
        const breadOrGrain = grains[0]?.name || "Toasted Bread or Warm Oats";
        recipes.push({
          id: "recipe-caramelized-fruit",
          title: `Warm Caramelized ${topFruit.name} & Golden Crisp Toast`,
          description: `A comforting, caf\xE9-style breakfast turning softening ${topFruit.name} into rich, naturally sweet caramelized goodness.`,
          prepTime: "5 mins",
          cookTime: "8 mins",
          difficulty: "Easy",
          servings: 1,
          expiringIngredientsUsed: [topFruit.name, ...grains[0] ? [grains[0].name] : []],
          additionalPantryItems: ["1 tbsp Butter or Cooking Oil", "Pinch of Brown Sugar or Honey", "Cinnamon"],
          instructions: [
            `Slice your ${topFruit.name} evenly into 1/4-inch rounds or wedges.`,
            "Melt 1 tbsp butter in a non-stick skillet over medium heat with a pinch of cinnamon.",
            `Add the sliced ${topFruit.name} and gently sear for 3-4 minutes per side until golden brown and tenderly caramelized.`,
            `Serve warm spooned generously over ${breadOrGrain}.`
          ],
          nutritionalHighlight: "Wholesome natural sweetness with zero processed additives."
        });
      }
    }
    if (veggies.length > 0) {
      const mainVeggies = veggies.slice(0, 4);
      const usedAromatics = veggies.filter((v) => /onion|garlic|ginger/i.test(v.name));
      const usedProduce = veggies.filter((v) => !/onion|garlic|ginger/i.test(v.name));
      const targetVeggies = usedProduce.length > 0 ? usedProduce : mainVeggies;
      const vegNames = targetVeggies.map((v) => v.name);
      if (usedAromatics.length > 0 && !vegNames.includes(usedAromatics[0].name)) {
        vegNames.push(usedAromatics[0].name);
      }
      recipes.push({
        id: "recipe-veg-saute",
        title: `Farmhouse Saut\xE9ed ${joinNames(targetVeggies.slice(0, 2))} with Garlic & Herbs`,
        description: `A fast, vibrant 10-minute skillet dish highlighting the fresh crunch and natural sweetness of your ${joinNames(targetVeggies.slice(0, 2))}.`,
        prepTime: "8 mins",
        cookTime: "10 mins",
        difficulty: "Easy",
        servings: 2,
        expiringIngredientsUsed: vegNames.slice(0, 3),
        additionalPantryItems: ["1 tbsp Olive Oil or Cooking Oil", "2 Cloves Minced Garlic", "Black Pepper", "Salt"],
        instructions: [
          `Wash and slice your ${joinNames(targetVeggies.slice(0, 2))} into even, bite-sized pieces for consistent cooking.`,
          "Heat cooking oil in a wide skillet over medium-high heat. Add minced garlic and cook for 30 seconds until aromatic.",
          `Toss in the ${joinNames(targetVeggies.slice(0, 2))} and saut\xE9 vigorously for 5-7 minutes until tender-crisp.`,
          "Season with a pinch of sea salt, freshly ground black pepper, and herbs of choice. Serve immediately as a wholesome side or main."
        ],
        nutritionalHighlight: "Packed with dietary fiber, essential electrolytes, and immune-supporting phytonutrients."
      });
      recipes.push({
        id: "recipe-veg-soup",
        title: `Simmered Rustic ${joinNames(targetVeggies.slice(0, 2))} Garden Broth`,
        description: `A soothing, warming zero-waste soup extracting rich savory depth from your simmered vegetables.`,
        prepTime: "10 mins",
        cookTime: "18 mins",
        difficulty: "Easy",
        servings: 2,
        expiringIngredientsUsed: vegNames.slice(0, 4),
        additionalPantryItems: ["2 Cups Vegetable Broth or Water", "Salt & Pepper", "1 tbsp Olive Oil", "Dried Herbs"],
        instructions: [
          `Roughly chop the ${joinNames(vegNames.slice(0, 3))}.`,
          "Heat oil in a medium saucepan, add the chopped vegetables and sweat over medium heat for 4 minutes.",
          "Pour in 2 cups of hot water or vegetable broth. Bring to a gentle boil, then reduce heat to low and cover.",
          `Simmer for 12-15 minutes until the ${targetVeggies[0].name} is melt-in-your-mouth tender.`,
          "Taste and adjust salt and pepper. Serve piping hot with toasted bread or rice."
        ],
        nutritionalHighlight: "Deeply hydrating, gut-soothing, and low calorie."
      });
    }
    if (meats.length > 0) {
      const protein = meats[0];
      const pairedVeg = veggies.slice(0, 2);
      const usedItems = [protein.name, ...pairedVeg.map((v) => v.name)];
      recipes.push({
        id: "recipe-protein-skillet",
        title: `Pan-Seared Golden ${protein.name} ${pairedVeg.length > 0 ? "with " + joinNames(pairedVeg) : "Chef Skillet"}`,
        description: `A high-protein, restaurant-grade pan dish ensuring your ${protein.name} is cooked to juicy perfection.`,
        prepTime: "8 mins",
        cookTime: "14 mins",
        difficulty: "Medium",
        servings: 2,
        expiringIngredientsUsed: usedItems,
        additionalPantryItems: ["Cooking Oil or Butter", "Minced Garlic", "Salt & Black Pepper", "Soy Sauce or Lemon"],
        instructions: [
          `Pat the ${protein.name} dry with paper towels and season both sides generously with salt and black pepper.`,
          "Heat 1 tablespoon of oil or butter in a heavy-bottomed skillet over medium-high heat until shimmering.",
          `Place the ${protein.name} into the pan. Sear undisturbed for 4-6 minutes to form a savory golden crust, then flip.`,
          pairedVeg.length > 0 ? `Add sliced ${joinNames(pairedVeg)} into the perimeter of the pan, cooking alongside the protein until tender and glossy.` : "Baste with pan juices until cooked through.",
          "Rest for 3 minutes before slicing and serving hot."
        ],
        nutritionalHighlight: "Complete high-density protein with essential amino acids."
      });
    }
    if (grains.length > 0 && recipes.length < 3) {
      const grain = grains[0];
      const companionItems = [...veggies, ...meats, ...dairy].slice(0, 2);
      const usedItems = [grain.name, ...companionItems.map((c) => c.name)];
      recipes.push({
        id: "recipe-grain-toss",
        title: `Artisan Tossed ${grain.name} ${companionItems.length > 0 ? "with " + joinNames(companionItems) : "Primavera"}`,
        description: `The ultimate pantry comfort food, maximizing leftover ${grain.name} into a delicious, savory bowl.`,
        prepTime: "5 mins",
        cookTime: "12 mins",
        difficulty: "Easy",
        servings: 2,
        expiringIngredientsUsed: usedItems,
        additionalPantryItems: ["2 tbsp Olive Oil or Butter", "Minced Garlic", "Chili Flakes", "Salt & Pepper"],
        instructions: [
          `Prepare or warm your ${grain.name}.`,
          companionItems.length > 0 ? `In a hot pan with olive oil and garlic, quickly saut\xE9 your ${joinNames(companionItems)} for 3-5 minutes until tender.` : "Warm olive oil, minced garlic, and red chili flakes in a pan over medium heat.",
          `Toss the ${grain.name} directly into the flavorful pan, coating every bite thoroughly.`,
          "Finish with a pinch of sea salt, black pepper, and serve warm."
        ],
        nutritionalHighlight: "Balanced sustained energy with wholesome complex carbohydrates."
      });
    }
    if (recipes.length === 0) {
      const primaryItem = items[0]?.name || "Kitchen Fresh Produce";
      recipes.push({
        id: "recipe-single-item-skillet",
        title: `Chef's Quick Seared ${primaryItem} Medley`,
        description: `A simple, delicious zero-waste preparation tailored specifically to make ${primaryItem} shine.`,
        prepTime: "5 mins",
        cookTime: "10 mins",
        difficulty: "Easy",
        servings: 1,
        expiringIngredientsUsed: [primaryItem],
        additionalPantryItems: ["1 tbsp Olive Oil or Butter", "Salt & Pepper", "Aromatic Herbs or Garlic"],
        instructions: [
          `Gently wash and prep your ${primaryItem}.`,
          "Heat a non-stick pan over medium heat with a drizzle of olive oil or butter.",
          `Add the ${primaryItem} and cook gently for 5-7 minutes, tossing occasionally until tender and fragrant.`,
          "Season to taste with salt and black pepper, and enjoy warm."
        ],
        nutritionalHighlight: "Wholesome, fresh home-cooked goodness with zero waste."
      });
    }
    return recipes.slice(0, 3);
  }
  /**
   * Interactive AI Chef assistant answering kitchen preservation & cooking questions
   */
  async chatWithAssistant(userMessage, inventory = []) {
    const inventorySummary = inventory.length > 0 ? `User's current inventory: ${inventory.map((i) => `${i.name} (${i.daysLeft ?? "?"} days left)`).join(", ")}.` : "User has no food items registered yet.";
    if (this.hasGeminiKey()) {
      try {
        const prompt = `You are "Chef Remi", a warm, professional AI culinary master and food preservation specialist for the Food Reminder app.
Your goals:
1. Prevent food waste by providing realistic, delicious culinary ideas.
2. Provide safe storage, thawing, and preservation advice.
3. Keep replies structured, concise, and formatted in clean markdown with bullet points.
4. Only suggest realistic flavor pairings for the items they actually have.

Current Inventory:
${inventorySummary}

User question: "${userMessage}"`;
        const answer = await this.callGemini(prompt);
        if (answer) return answer;
      } catch (err) {
        console.warn("[AIService] Chat fallback triggered:", err);
      }
    }
    const msg = userMessage.toLowerCase();
    if (msg.includes("what should i cook") || msg.includes("recipe") || msg.includes("cook tonight") || msg.includes("what can i make")) {
      const expiring = inventory.filter((i) => i.daysLeft !== void 0 && i.daysLeft <= 3);
      if (expiring.length > 0) {
        const names = expiring.map((i) => i.name).join(", ");
        return `### \u{1F373} Chef Remi's Urgent Zero-Waste Advice

Your most urgent items expiring soon are **${names}**.

- **Quick Fresh Prep**: Use softening fruits immediately in smoothies or warm oats; saut\xE9 fresh vegetables with garlic and olive oil.
- **Batch Cooking**: Turn mixed vegetables into a hearty simmering garden broth or vegetable curry.
- **Check AI Recipes**: Click the **AI Recipes** button in your dashboard for tailored step-by-step recipes built directly from your ingredients!`;
      }
      return `### \u{1F957} Chef Remi's Recommendation

All your registered items are currently fresh! You can explore personalized zero-waste dishes anytime using the **AI Recipes** button on your dashboard, or ask me for storage tips on any specific item!`;
    }
    if (msg.includes("safe") || msg.includes("eat") || msg.includes("expired") || msg.includes("spoil")) {
      return `### \u{1F6E1}\uFE0F Food Safety & Expiry Guidelines

- **"Use By" dates**: Relate to food safety. Do not consume meats, seafood, or soft cheeses past this date.
- **"Best Before" dates**: Relate to food texture and quality. Dry pantry goods, hard cheeses, and canned items are usually safe past this date if properly sealed.
- **The Senses Test**: Check for sour or pungent odors, discoloration, mold, or slimy film. When in doubt, compost or discard.`;
    }
    if (msg.includes("freeze") || msg.includes("freezer") || msg.includes("preserving")) {
      return `### \u2744\uFE0F Chef Remi's Freezing & Preservation Tips

- **Bread & Bakery**: Slice first and seal tightly in freezer bags. Toast directly from frozen!
- **Hard Cheeses**: Grate before freezing for instant sprinkling onto pasta, bakes, or pizzas.
- **Soft Fruits & Berries**: Flash freeze on a baking sheet for 2 hours, then transfer to a freezer bag to prevent clumping in smoothies.
- **Fresh Herbs**: Chop finely, place in ice cube trays, cover with olive oil, and freeze into handy cooking cubes.`;
    }
    return `### \u{1F33F} Hello from Chef Remi!

I'm your AI kitchen preservation companion. I can help you reduce food waste, master optimal storage, and craft delicious meals from whatever is currently in your fridge.

Try asking:
- *"What can I cook with my expiring items?"*
- *"How do I keep fresh herbs and greens from wilting?"*
- *"Can I freeze opened cheese or milk?"*`;
  }
  /**
   * Calls Google Gemini API using native fetch
   */
  async callGemini(prompt) {
    if (!this.apiKey) return null;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(this.apiKey)}`;
    const payload = {
      contents: [
        {
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 1400
      }
    };
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gemini API error (${res.status}): ${errText}`);
    }
    const data = await res.json();
    const candidate = data.candidates?.[0];
    const text = candidate?.content?.parts?.[0]?.text;
    return text || null;
  }
  /**
   * Helper to strip markdown code fences and parse JSON
   */
  parseJsonFromMarkdown(text) {
    try {
      const clean = text.replace(/^```json/m, "").replace(/^```/m, "").replace(/```$/m, "").trim();
      return JSON.parse(clean);
    } catch {
      return null;
    }
  }
};
var aiService = new AIService();

// server/routes.ts
function hashPassword(password) {
  return createHash("sha256").update(password).digest("hex");
}
function verifyPassword(password, hash) {
  return hashPassword(password) === hash;
}
async function registerRoutes(app2) {
  const healthCheck = (req, res) => {
    if (req.headers["user-agent"]?.includes("UptimeRobot")) {
      console.log(`[Monitor] \u{1F916} UptimeRobot hit: ${req.method} ${req.originalUrl}`);
    }
    res.status(200).json({
      status: "ok",
      uptime: Math.floor(process.uptime()),
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      node: process.version,
      memory: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + "MB"
    });
  };
  const monitorPaths = ["/api/health", "/health", "/api/ping", "/ping", "/api/keep-alive", "/keep-alive"];
  app2.get("/api", healthCheck);
  app2.head("/api", healthCheck);
  monitorPaths.forEach((path2) => {
    app2.get(path2, healthCheck);
    app2.head(path2, healthCheck);
  });
  app2.get("/api/dashboard/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      res.setHeader("Cache-Control", "private, max-age=60");
      const [user, items] = await Promise.all([
        storage.getUser(userId),
        storage.getFoodItemsByUserId(userId)
      ]);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const today = /* @__PURE__ */ new Date();
      today.setHours(0, 0, 0, 0);
      const itemsWithStatus = items.map((item) => {
        const expiryDate = new Date(item.expiryDate);
        expiryDate.setHours(0, 0, 0, 0);
        const daysLeft = Math.ceil((expiryDate.getTime() - today.getTime()) / (1e3 * 60 * 60 * 24));
        let status = "fresh";
        if (daysLeft < 0) {
          status = "expired";
        } else if (daysLeft <= 3) {
          status = "expiring";
        }
        return {
          ...item,
          status,
          daysLeft
        };
      });
      const { password, ...userWithoutPassword } = user;
      res.status(200).json({
        user: userWithoutPassword,
        items: itemsWithStatus
      });
    } catch (error) {
      console.error("[Dashboard] Error:", error);
      res.status(500).json({ message: "Failed to load dashboard data", error: error?.message });
    }
  });
  app2.get("/api/test-cors", (req, res) => {
    res.status(200).json({
      success: true,
      message: "CORS is working correctly",
      origin: req.headers.origin
    });
  });
  app2.post("/api/auth/register", async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      let mobile = validatedData.mobile.trim();
      if (!mobile.startsWith("+")) {
        mobile = "+91" + mobile;
        console.log(`[Auth] Auto-added +91 prefix to mobile: ${mobile}`);
      }
      const existingUsername = await storage.getUserByUsername(validatedData.username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username already exists" });
      }
      const existingEmail = await storage.getUserByEmail(validatedData.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already registered" });
      }
      const existingMobile = await storage.getUserByMobile(mobile);
      if (existingMobile) {
        return res.status(400).json({ message: "Mobile number already registered" });
      }
      const hashedPassword = hashPassword(validatedData.password);
      const user = await storage.createUser({
        ...validatedData,
        mobile,
        password: hashedPassword
      });
      const { password, ...userWithoutPassword } = user;
      res.status(201).json({
        message: "Registration successful",
        user: userWithoutPassword
      });
    } catch (error) {
      console.error("[Auth] Registration error:", error);
      if (error instanceof z2.ZodError) {
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
  app2.post("/api/auth/login", async (req, res) => {
    try {
      const validatedData = loginSchema.parse(req.body);
      let identifier = validatedData.identifier.trim();
      const isMobileNumber = /^[+]?[0-9]{10,15}$/.test(identifier);
      if (isMobileNumber && !identifier.startsWith("+")) {
        identifier = "+91" + identifier;
        console.log(`[Auth] Auto-added +91 prefix to login identifier: ${identifier}`);
      }
      const user = await storage.getUserByEmailOrMobile(identifier);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      const isValidPassword = verifyPassword(validatedData.password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      const { password, ...userWithoutPassword } = user;
      res.status(200).json({
        message: "Login successful",
        user: userWithoutPassword
      });
    } catch (error) {
      console.error("[Auth] Login error:", error);
      if (error instanceof z2.ZodError) {
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
  app2.get("/api/auth/user", async (req, res) => {
    res.status(200).json({ user: null });
  });
  app2.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { identifier, newPassword } = req.body;
      if (!identifier || !newPassword) {
        return res.status(400).json({ message: "Email/mobile and new password are required" });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }
      let normalizedIdentifier = identifier.trim();
      const isMobileNumber = /^[+]?[0-9]{10,15}$/.test(normalizedIdentifier);
      if (isMobileNumber && !normalizedIdentifier.startsWith("+")) {
        normalizedIdentifier = "+91" + normalizedIdentifier;
        console.log(`[Auth] Auto-added +91 prefix to reset identifier: ${normalizedIdentifier}`);
      }
      const user = await storage.getUserByEmailOrMobile(normalizedIdentifier);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const hashedPassword = hashPassword(newPassword);
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
  app2.post("/api/auth/change-password", async (req, res) => {
    try {
      const { userId, currentPassword, newPassword } = req.body;
      if (!userId || !currentPassword || !newPassword) {
        return res.status(400).json({ message: "All fields are required" });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ message: "New password must be at least 6 characters" });
      }
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const isValidPassword = verifyPassword(currentPassword, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Current password is incorrect" });
      }
      const hashedPassword = hashPassword(newPassword);
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
  app2.put("/api/auth/update-profile", async (req, res) => {
    try {
      const { userId, username, email, profilePicture } = req.body;
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
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
  app2.get("/api/food-items/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      res.setHeader("Cache-Control", "private, max-age=30");
      res.setHeader("ETag", `food-items-${userId}-${Date.now()}`);
      const items = await storage.getFoodItemsByUserId(userId);
      const today = /* @__PURE__ */ new Date();
      today.setHours(0, 0, 0, 0);
      const itemsWithStatus = items.map((item) => {
        const expiryDate = new Date(item.expiryDate);
        expiryDate.setHours(0, 0, 0, 0);
        const daysLeft = Math.ceil((expiryDate.getTime() - today.getTime()) / (1e3 * 60 * 60 * 24));
        let status = "fresh";
        if (daysLeft < 0) {
          status = "expired";
        } else if (daysLeft <= 3) {
          status = "expiring";
        }
        return {
          ...item,
          status,
          daysLeft
        };
      });
      res.status(200).json({ items: itemsWithStatus });
    } catch (error) {
      console.error("[FoodItems] Get items error:", error);
      console.error("[FoodItems] Error message:", error?.message);
      console.error("[FoodItems] Error stack:", error?.stack);
      res.status(500).json({ message: "Failed to fetch food items", error: error?.message });
    }
  });
  app2.post("/api/food-items", async (req, res) => {
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
      if (error instanceof z2.ZodError) {
        return res.status(400).json({
          message: "Validation error",
          errors: error.errors
        });
      }
      res.status(500).json({ message: "Failed to create food item" });
    }
  });
  app2.put("/api/food-items/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.body?.userId || req.query?.userId || req.headers["x-user-id"] || req.headers["userid"];
      const updateData = { ...req.body };
      delete updateData.userId;
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      const item = await storage.updateFoodItem(id, String(userId).trim(), updateData);
      if (!item) {
        return res.status(404).json({ message: "Food item not found or unauthorized" });
      }
      res.status(200).json({ message: "Food item updated", item });
    } catch (error) {
      console.error("[FoodItems] Update item error:", error);
      res.status(500).json({ message: "Failed to update food item" });
    }
  });
  app2.delete("/api/food-items/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.body?.userId || req.query?.userId || req.headers["x-user-id"] || req.headers["userid"];
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      const success = await storage.deleteFoodItem(id, String(userId).trim());
      if (!success) {
        return res.status(404).json({ message: "Food item not found or unauthorized" });
      }
      res.status(200).json({ message: "Food item deleted" });
    } catch (error) {
      console.error("[FoodItems] Delete item error:", error);
      res.status(500).json({ message: "Failed to delete food item" });
    }
  });
  app2.post("/api/ai/predict-shelf-life", async (req, res) => {
    try {
      const { foodName, category } = req.body;
      if (!foodName || typeof foodName !== "string") {
        return res.status(400).json({ message: "Food name is required" });
      }
      const prediction = await aiService.predictShelfLife(foodName, category);
      res.status(200).json({ success: true, prediction });
    } catch (error) {
      console.error("[AI] Shelf-life prediction error:", error);
      res.status(500).json({ message: "Failed to predict shelf life", error: error?.message });
    }
  });
  app2.post("/api/ai/recipes", async (req, res) => {
    try {
      const { userId, items: providedItems, preferences } = req.body;
      let inventory = providedItems;
      if (!inventory && userId) {
        const dbItems = await storage.getFoodItemsByUserId(userId);
        const today = /* @__PURE__ */ new Date();
        today.setHours(0, 0, 0, 0);
        inventory = dbItems.map((item) => {
          const exp = new Date(item.expiryDate);
          exp.setHours(0, 0, 0, 0);
          const daysLeft = Math.ceil((exp.getTime() - today.getTime()) / (1e3 * 60 * 60 * 24));
          return {
            name: item.name,
            category: item.category,
            daysLeft,
            quantity: item.quantity
          };
        });
      }
      if (!inventory || !Array.isArray(inventory)) {
        inventory = [];
      }
      const recipes = await aiService.generateRecipes(inventory, preferences);
      res.status(200).json({ success: true, recipes });
    } catch (error) {
      console.error("[AI] Recipe generation error:", error);
      res.status(500).json({ message: "Failed to generate recipes", error: error?.message });
    }
  });
  app2.post("/api/ai/assistant", async (req, res) => {
    try {
      const { message, userId, items: providedItems } = req.body;
      if (!message || typeof message !== "string") {
        return res.status(400).json({ message: "Message is required" });
      }
      let inventory = providedItems;
      if (!inventory && userId) {
        const dbItems = await storage.getFoodItemsByUserId(userId);
        const today = /* @__PURE__ */ new Date();
        today.setHours(0, 0, 0, 0);
        inventory = dbItems.map((item) => {
          const exp = new Date(item.expiryDate);
          exp.setHours(0, 0, 0, 0);
          const daysLeft = Math.ceil((exp.getTime() - today.getTime()) / (1e3 * 60 * 60 * 24));
          return {
            name: item.name,
            daysLeft
          };
        });
      }
      const reply = await aiService.chatWithAssistant(message, inventory || []);
      res.status(200).json({ success: true, reply });
    } catch (error) {
      console.error("[AI] Assistant chat error:", error);
      res.status(500).json({ message: "Failed to generate response", error: error?.message });
    }
  });
  app2.get("/api/notifications/preferences/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      console.log(`[Notifications] Fetching preferences for user: ${userId}`);
      const user = await storage.getUser(userId);
      if (!user) {
        console.error(`[Notifications] \u274C User not found in database: ${userId}`);
        return res.status(404).json({ message: "User not found" });
      }
      console.log(`[Notifications] \u2705 User found: ${user.username}`);
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
          push: pushService.isConfigured()
        }
      });
    } catch (error) {
      console.error("[Notifications] Get preferences error:", error);
      res.status(500).json({ message: "Failed to fetch notification preferences" });
    }
  });
  app2.put("/api/notifications/preferences/:userId", async (req, res) => {
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
      const preferences = {};
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
      if (telegramChatId !== void 0) {
        preferences.telegramChatId = telegramChatId;
      }
      if (quietHoursStart !== void 0) preferences.quietHoursStart = quietHoursStart;
      if (quietHoursEnd !== void 0) preferences.quietHoursEnd = quietHoursEnd;
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
      console.log(`[Notifications] \u2705 Preferences updated successfully for user: ${userId}`);
      res.status(200).json({
        message: "Notification preferences updated successfully",
        preferences
      });
    } catch (error) {
      console.error("[Notifications] Update preferences error:", error);
      res.status(500).json({ message: "Failed to update notification preferences" });
    }
  });
  app2.delete("/api/user/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      console.log(`[User] Delete account request for user: ${userId}`);
      const foodItems = await storage.getFoodItemsByUserId(userId);
      for (const item of foodItems) {
        await storage.deleteFoodItem(item.id, userId);
      }
      console.log(`[User] Deleted ${foodItems.length} food items`);
      const deleted = await storage.deleteUser(userId);
      if (!deleted) {
        return res.status(404).json({ message: "User not found" });
      }
      console.log(`[User] \u2705 Account deleted successfully: ${userId}`);
      res.status(200).json({ message: "Account deleted successfully" });
    } catch (error) {
      console.error("[User] Delete account error:", error);
      res.status(500).json({ message: "Failed to delete account" });
    }
  });
  app2.post("/api/notifications/test/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const result2 = await notificationChecker.testNotification(userId);
      if (result2.success) {
        res.status(200).json(result2);
      } else {
        res.status(400).json(result2);
      }
    } catch (error) {
      console.error("[Notifications] Test notification error:", error);
      res.status(500).json({ message: "Failed to send test notification" });
    }
  });
  app2.use("/api/notifications/check-all", async (req, res) => {
    if (req.method !== "GET" && req.method !== "POST") {
      return res.status(405).json({ message: "Method Not Allowed" });
    }
    try {
      console.log(`[Notifications] ========================================`);
      console.log(`[Notifications] \u{1F514} Check-all triggered. Method: ${req.method}`);
      console.log(`[Notifications] Time: ${(/* @__PURE__ */ new Date()).toISOString()}`);
      console.log(`[Notifications] Headers:`, JSON.stringify(req.headers, null, 2));
      console.log(`[Notifications] Query:`, JSON.stringify(req.query, null, 2));
      console.log(`[Notifications] ========================================`);
      const authHeader = req.headers.authorization;
      const cronSecret = process.env.CRON_SECRET;
      const apiKey = req.headers["x-api-key"] || req.query.apiKey;
      const expectedApiKey = process.env.NOTIFICATION_API_KEY;
      const isDevelopment = process.env.NODE_ENV !== "production";
      let authorized = false;
      let authMethod = "none";
      if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
        console.log("[Notifications] \u2705 Authorized via Vercel Cron Secret");
        authorized = true;
        authMethod = "vercel-cron";
      } else if (expectedApiKey && apiKey === expectedApiKey) {
        console.log("[Notifications] \u2705 Authorized via API Key");
        authorized = true;
        authMethod = "api-key";
      } else if (isDevelopment) {
        console.log("[Notifications] \u26A0\uFE0F Development mode - allowing request without authentication");
        console.log("[Notifications] \u{1F4A1} In production, set CRON_SECRET or NOTIFICATION_API_KEY");
        authorized = true;
        authMethod = "dev-mode";
      } else if (!cronSecret && !expectedApiKey) {
        console.log("[Notifications] \u26A0\uFE0F No secrets configured - allowing request (INSECURE)");
        console.log("[Notifications] \u{1F4A1} Set CRON_SECRET or NOTIFICATION_API_KEY environment variable");
        authorized = true;
        authMethod = "no-auth";
      }
      if (!authorized) {
        console.error("[Notifications] \u274C Unauthorized access attempt");
        console.error("[Notifications] Expected CRON_SECRET:", cronSecret ? "SET" : "NOT SET");
        console.error("[Notifications] Expected NOTIFICATION_API_KEY:", expectedApiKey ? "SET" : "NOT SET");
        console.error("[Notifications] Received Authorization:", authHeader ? "PROVIDED" : "MISSING");
        console.error("[Notifications] Received API Key:", apiKey ? "PROVIDED" : "MISSING");
        return res.status(401).json({
          message: "Unauthorized",
          detail: "Set CRON_SECRET or NOTIFICATION_API_KEY, or ensure NODE_ENV is not 'production'"
        });
      }
      console.log("[Notifications] \u{1F514} Starting notification check...");
      const startTime = Date.now();
      const results = await notificationChecker.checkAndNotifyAll();
      const duration = Date.now() - startTime;
      console.log(`[Notifications] \u2705 Check completed in ${duration}ms`);
      res.status(200).json({
        success: true,
        message: "Notification check completed",
        notificationsSent: results.length,
        results,
        authMethod,
        duration: `${duration}ms`,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    } catch (error) {
      console.error("[Notifications] \u274C Check all error:", error);
      console.error("[Notifications] Stack trace:", error instanceof Error ? error.stack : "No stack");
      res.status(500).json({
        success: false,
        message: "Failed to check notifications",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  app2.get("/api/notifications/vapid-public-key", (req, res) => {
    const key = pushService.getPublicKey();
    if (!key) {
      return res.status(500).json({ message: "VAPID key not configured" });
    }
    res.json({ publicKey: key });
  });
  app2.post("/api/notifications/subscribe", async (req, res) => {
    try {
      const { userId, subscription } = req.body;
      if (!userId || !subscription) {
        return res.status(400).json({ message: "User ID and subscription required" });
      }
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
  app2.get("/api/notifications/telegram-config", (req, res) => {
    res.json({
      botUsername: telegramService.getBotUsername()
    });
  });
  app2.post("/api/notifications/whatsapp/request-code", async (req, res) => {
    try {
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const result2 = await whatsappVerificationService.sendVerificationCode(user);
      if (result2.success) {
        res.status(200).json(result2);
      } else {
        res.status(400).json(result2);
      }
    } catch (error) {
      console.error("[WhatsApp] Request code error:", error);
      res.status(500).json({ message: "Failed to send verification code" });
    }
  });
  app2.post("/api/notifications/whatsapp/verify-code", async (req, res) => {
    try {
      const { userId, code } = req.body;
      if (!userId || !code) {
        return res.status(400).json({ message: "User ID and code are required" });
      }
      const result2 = await whatsappVerificationService.verifyCode(userId, code);
      if (result2.success) {
        res.status(200).json(result2);
      } else {
        res.status(400).json(result2);
      }
    } catch (error) {
      console.error("[WhatsApp] Verify code error:", error);
      res.status(500).json({ message: "Failed to verify code" });
    }
  });
  app2.get("/api/notifications/whatsapp/status/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const status = await whatsappVerificationService.getVerificationStatus(userId);
      res.status(200).json(status);
    } catch (error) {
      console.error("[WhatsApp] Status check error:", error);
      res.status(500).json({ message: "Failed to check verification status" });
    }
  });
  app2.post("/api/notifications/whatsapp/disconnect", async (req, res) => {
    try {
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      const result2 = await whatsappVerificationService.disconnectWhatsApp(userId);
      if (result2.success) {
        res.status(200).json(result2);
      } else {
        res.status(400).json(result2);
      }
    } catch (error) {
      console.error("[WhatsApp] Disconnect error:", error);
      res.status(500).json({ message: "Failed to disconnect WhatsApp" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/notificationScheduler.ts
import cron from "node-cron";
var NotificationScheduler = class {
  scheduledTask = null;
  isRunning = false;
  /**
   * Start the notification scheduler
   * Runs frequently to check for expiring items
   * Each user's notification frequency preference is checked individually
   * @param cronExpression - Cron expression for schedule (optional override)
   */
  start(cronExpression) {
    if (this.isRunning) {
      console.log("[NotificationScheduler] Scheduler is already running");
      return;
    }
    const testMode = process.env.NOTIFICATION_SCHEDULE_TEST === "true";
    const defaultSchedule = testMode ? "*/5 * * * *" : "0 8,11,14,17,20 * * *";
    const schedule = cronExpression || process.env.NOTIFICATION_SCHEDULE || defaultSchedule;
    console.log(`[NotificationScheduler] \u{1F550} Starting notification scheduler...`);
    console.log(`[NotificationScheduler] \u{1F4C5} Schedule: ${schedule}`);
    console.log(`[NotificationScheduler] \u{1F514} Frequency: 5 times daily (8 AM, 11 AM, 2 PM, 5 PM, 8 PM)`);
    console.log(`[NotificationScheduler] \u{1F464} Per-user frequency preferences will be respected`);
    if (testMode) {
      console.log(`[NotificationScheduler] \u{1F9EA} TEST MODE ENABLED - Running every 5 minutes`);
      console.log(`[NotificationScheduler] \u{1F4A1} Set NOTIFICATION_SCHEDULE_TEST=false in .env to disable test mode`);
    } else {
      console.log(`[NotificationScheduler] \u{1F4A1} Tip: Set NOTIFICATION_SCHEDULE_TEST=true for testing (runs every 5 min)`);
    }
    console.log(`[NotificationScheduler] \u{1F4A1} Customize with NOTIFICATION_SCHEDULE in .env`);
    this.scheduledTask = cron.schedule(schedule, async () => {
      const now = (/* @__PURE__ */ new Date()).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
      console.log(`[NotificationScheduler] ========================================`);
      console.log(`[NotificationScheduler] \u23F0 Scheduled notification check triggered at ${now}`);
      console.log(`[NotificationScheduler] ========================================`);
      try {
        await notificationChecker.checkAndNotifyAll();
      } catch (error) {
        console.error("[NotificationScheduler] \u274C Error during scheduled check:", error);
      }
    }, {
      timezone: process.env.TIMEZONE || "Asia/Kolkata"
      // Default to IST
    });
    this.scheduledTask.start();
    this.isRunning = true;
    console.log("[NotificationScheduler] \u2705 Scheduler started successfully");
    const nextExecution = this.getNextExecutionTime(schedule);
    console.log(`[NotificationScheduler] \u{1F4CC} Next check: ${nextExecution}`);
    console.log(`[NotificationScheduler] \u{1F4CC} Current time: ${(/* @__PURE__ */ new Date()).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}`);
  }
  /**
   * Stop the notification scheduler
   */
  stop() {
    if (!this.isRunning || !this.scheduledTask) {
      console.log("[NotificationScheduler] Scheduler is not running");
      return;
    }
    this.scheduledTask.stop();
    this.scheduledTask = null;
    this.isRunning = false;
    console.log("[NotificationScheduler] \u23F9\uFE0F Scheduler stopped");
  }
  /**
   * Check if scheduler is running
   */
  isActive() {
    return this.isRunning;
  }
  /**
   * Get the next execution time for a cron expression
   */
  getNextExecutionTime(cronExpression) {
    try {
      const now = /* @__PURE__ */ new Date();
      const parts = cronExpression.split(" ");
      if (parts.length >= 2) {
        const minute = parts[0];
        const hour = parts[1];
        if (minute === "0" && hour !== "*") {
          const hours = hour.split(",").map((h) => parseInt(h));
          const currentHour = now.getHours();
          let nextHour = hours.find((h) => h > currentHour);
          const next = /* @__PURE__ */ new Date();
          if (nextHour !== void 0) {
            next.setHours(nextHour, 0, 0, 0);
          } else {
            next.setDate(next.getDate() + 1);
            next.setHours(hours[0], 0, 0, 0);
          }
          return next.toLocaleString();
        }
      }
      return "Check logs for exact time";
    } catch {
      return "Unable to calculate";
    }
  }
  /**
   * Run a manual check immediately (doesn't affect schedule)
   */
  async runManualCheck() {
    console.log("[NotificationScheduler] \u{1F504} Running manual notification check...");
    try {
      await notificationChecker.checkAndNotifyAll();
      console.log("[NotificationScheduler] \u2705 Manual check completed");
    } catch (error) {
      console.error("[NotificationScheduler] \u274C Manual check failed:", error);
      throw error;
    }
  }
};
var notificationScheduler = new NotificationScheduler();

// server/index.ts
var app = express2();
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
  } else {
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept, Origin");
  res.setHeader("Access-Control-Max-Age", "86400");
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  next();
});
app.use(compression({
  // Compress all responses over 1kb
  threshold: 1024,
  // Compression level (0-9, 6 is default, good balance of speed/compression)
  level: 6,
  // Filter function to determine what to compress
  filter: (req, res) => {
    if (req.headers["x-no-compression"]) {
      return false;
    }
    return compression.filter(req, res);
  }
}));
log("\u2705 API Services initializing...");
app.use(express2.json({ limit: "10mb" }));
app.use(express2.urlencoded({ extended: false, limit: "10mb" }));
app.use((req, res, next) => {
  const start = Date.now();
  const reqPath = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (reqPath.startsWith("/api")) {
      let logLine = `${req.method} ${reqPath} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
process.on("unhandledRejection", (reason, promise) => {
  console.error("[System] \u274C Unhandled Rejection at:", promise, "reason:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("[System] \u274C Uncaught Exception:", err);
});
var servicesInitialized = false;
function initializeServices() {
  if (servicesInitialized) return;
  servicesInitialized = true;
  const isVercel = process.env.VERCEL === "1";
  log(`Initializing services (Vercel: ${isVercel})...`);
  const emailInitialized = emailService.initialize();
  const whatsappInitialized = whatsappService.initialize();
  const whatsappCloudInitialized = whatsappCloudService.initialize();
  const smsInitialized = smsService.initialize();
  const telegramInitialized = telegramService.initialize();
  const pushInitialized = pushService.initialize();
  if (!isVercel) {
    const autoSchedule = process.env.NOTIFICATION_AUTO_SCHEDULE !== "false";
    if (autoSchedule && (emailInitialized || whatsappInitialized || smsInitialized || telegramInitialized || pushInitialized)) {
      try {
        notificationScheduler.start();
        log("\u2713 Notification scheduler started");
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        log(`\u26A0 Failed to start notification scheduler: ${errorMessage}`);
      }
    }
  } else {
    log("\u2139 Notification scheduler disabled (running on Vercel)");
  }
}
var routesPromise = (async () => {
  try {
    initializeServices();
    await registerRoutes(app);
    const isProduction = process.env.NODE_ENV === "production";
    const isVercel = process.env.VERCEL === "1";
    if (!isVercel) {
      const { serveStatic: serveStatic2 } = await Promise.resolve().then(() => (init_static(), static_exports));
      serveStatic2(app);
    }
    app.use((err, _req, res, _next) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      console.error(`[Error] ${status}: ${message}`, err);
      res.status(status).json({ message });
    });
    log("\u2705 API Initialization complete");
  } catch (error) {
    console.error("\u274C Failed to initialize API routes:", error);
  }
})();
app.use(async (req, res, next) => {
  await routesPromise;
  next();
});
if (process.env.VERCEL !== "1") {
  (async () => {
    try {
      await routesPromise;
      const server = createServer2(app);
      const port = parseInt(process.env.PORT || "5000", 10);
      server.listen(port, "0.0.0.0", () => {
        log(`serving on port ${port}`);
      });
    } catch (error) {
      console.error("[System] \u274C Failed to start server:", error);
    }
  })();
}
var index_default = app;
export {
  index_default as default
};
