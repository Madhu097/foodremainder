import { type User, type InsertUser, type FoodItem, type InsertFoodItem } from "@shared/schema";
import { randomUUID } from "crypto";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByMobile(mobile: string): Promise<User | undefined>;
  getUserByEmailOrMobile(identifier: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserPassword(userId: string, newPasswordHash: string): Promise<boolean>;
  updateUserProfile(userId: string, profile: { username?: string; email?: string; profilePicture?: string }): Promise<boolean>;
  updateNotificationPreferences(userId: string, preferences: Partial<Pick<User, 'emailNotifications' | 'whatsappNotifications' | 'telegramNotifications' | 'telegramChatId' | 'notificationDays' | 'notificationsPerDay' | 'browserNotifications' | 'quietHoursStart' | 'quietHoursEnd' | 'callmebotApiKey'>>): Promise<boolean>;
  addPushSubscription(userId: string, subscription: string): Promise<boolean>;
  deleteUser(userId: string): Promise<boolean>;

  // Food item methods
  getFoodItemsByUserId(userId: string): Promise<FoodItem[]>;
  getFoodItem(id: string): Promise<FoodItem | undefined>;
  createFoodItem(userId: string, item: InsertFoodItem): Promise<FoodItem>;
  updateFoodItem(id: string, userId: string, item: Partial<InsertFoodItem>): Promise<FoodItem | undefined>;
  deleteFoodItem(id: string, userId: string): Promise<boolean>;
}

// In-memory storage for development/fallback

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private foodItems: Map<string, FoodItem>;

  constructor() {
    this.users = new Map();
    this.foodItems = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async getUserByMobile(mobile: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.mobile === mobile,
    );
  }

  async getUserByEmailOrMobile(identifier: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === identifier || user.mobile === identifier,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
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
      callmebotApiKey: null,
      createdAt: new Date().toISOString(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserPassword(userId: string, newPasswordHash: string): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user) {
      return false;
    }
    user.password = newPasswordHash;
    this.users.set(userId, user);
    return true;
  }

  async updateUserProfile(userId: string, profile: { username?: string; email?: string; profilePicture?: string }): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user) {
      return false;
    }

    // Update only provided fields
    if (profile.username !== undefined) user.username = profile.username;
    if (profile.email !== undefined) user.email = profile.email;
    if (profile.profilePicture !== undefined) user.profilePicture = profile.profilePicture;

    this.users.set(userId, user);
    return true;
  }

  async updateNotificationPreferences(
    userId: string,
    preferences: Partial<Pick<User, 'emailNotifications' | 'whatsappNotifications' | 'telegramNotifications' | 'telegramChatId' | 'notificationDays' | 'notificationsPerDay' | 'browserNotifications' | 'quietHoursStart' | 'quietHoursEnd' | 'callmebotApiKey'>>
  ): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user) {
      return false;
    }
    Object.assign(user, preferences);
    this.users.set(userId, user);
    return true;
  }

  async addPushSubscription(userId: string, subscription: string): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user) return false;

    // Initialize if undefined
    if (!user.pushSubscriptions) user.pushSubscriptions = [];

    // Avoid duplicates
    if (!user.pushSubscriptions.includes(subscription)) {
      user.pushSubscriptions.push(subscription);
    }

    this.users.set(userId, user);
    return true;
  }

  async deleteUser(userId: string): Promise<boolean> {
    return this.users.delete(userId);
  }

  // Food item methods
  async getFoodItemsByUserId(userId: string): Promise<FoodItem[]> {
    return Array.from(this.foodItems.values()).filter(
      (item) => item.userId === userId,
    );
  }

  async getFoodItem(id: string): Promise<FoodItem | undefined> {
    return this.foodItems.get(id);
  }

  async createFoodItem(userId: string, insertItem: InsertFoodItem): Promise<FoodItem> {
    const id = randomUUID();
    const foodItem: FoodItem = {
      ...insertItem,
      id,
      userId,
      quantity: insertItem.quantity || null,
      notes: insertItem.notes || null,
      createdAt: new Date().toISOString(),
    };
    this.foodItems.set(id, foodItem);
    return foodItem;
  }

  async updateFoodItem(id: string, userId: string, updateData: Partial<InsertFoodItem>): Promise<FoodItem | undefined> {
    const existing = this.foodItems.get(id);
    if (!existing || existing.userId !== userId) {
      return undefined;
    }
    const updated: FoodItem = { ...existing, ...updateData };
    this.foodItems.set(id, updated);
    return updated;
  }

  async deleteFoodItem(id: string, userId: string): Promise<boolean> {
    const existing = this.foodItems.get(id);
    if (!existing || existing.userId !== userId) {
      return false;
    }
    return this.foodItems.delete(id);
  }
}

// Initialize storage based on environment
let storageInstance: IStorage | null = null;

async function initializeStorage(): Promise<IStorage> {
  if (storageInstance) return storageInstance;

  // Check if Firebase is configured
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
    try {
      const { FirebaseStorage } = await import('./firebaseStorage.js');
      console.log("[Storage] ✅ Using Firebase Firestore");
      console.log("[Storage] 💾 Data will persist in Firebase");
      storageInstance = new FirebaseStorage();
      return storageInstance;
    } catch (error) {
      console.error("[Storage] ❌ Failed to initialize Firebase Storage:", error);
      console.log("[Storage] ⚠️  Falling back to in-memory storage");
    }
  }

  // Fall back to in-memory storage
  console.log("[Storage] Using in-memory storage");
  console.log("[Storage] 💾 Data will persist during this session only");
  console.log("[Storage] 💡 Tip: Configure Firebase credentials in .env to enable persistent storage");
  storageInstance = new MemStorage();
  return storageInstance;
}

// Initialize immediately
const storagePromise = initializeStorage();

// Export a proxy that waits for initialization
export const storage: IStorage = new Proxy({} as IStorage, {
  get: (target, prop) => {
    return async (...args: any[]) => {
      const instance = await storagePromise;
      return (instance as any)[prop](...args);
    };
  }
});
