import { type User, type InsertUser, type FoodItem, type InsertFoodItem } from "@shared/schema";
import type { IStorage } from "./storage";
import { randomUUID } from "crypto";
import { db } from "./firebase";

// Simple in-memory cache with TTL
class Cache<T> {
    private cache = new Map<string, { data: T; timestamp: number }>();
    private ttl: number;

    constructor(ttlSeconds: number = 30) {
        this.ttl = ttlSeconds * 1000;
    }

    get(key: string): T | null {
        const item = this.cache.get(key);
        if (!item) return null;

        const now = Date.now();
        if (now - item.timestamp > this.ttl) {
            this.cache.delete(key);
            return null;
        }

        return item.data;
    }

    set(key: string, data: T): void {
        this.cache.set(key, { data, timestamp: Date.now() });
    }

    invalidate(key: string): void {
        this.cache.delete(key);
    }

    invalidatePattern(pattern: string): void {
        for (const key of this.cache.keys()) {
            if (key.includes(pattern)) {
                this.cache.delete(key);
            }
        }
    }

    clear(): void {
        this.cache.clear();
    }
}

export class FirebaseStorage implements IStorage {
    // Caches with 30 second TTL
    private userCache = new Cache<User>(30);
    private foodItemsCache = new Cache<FoodItem[]>(30);
    private allUsersCache = new Cache<User[]>(60); // Longer TTL for all users

    constructor() {
        if (!db) {
            throw new Error("Firebase Firestore not initialized. Check Firebase configuration.");
        }
        console.log("[FirebaseStorage] ✅ Initialized with caching enabled (30s TTL)");
    }

    // User methods
    async getUser(id: string): Promise<User | undefined> {
        if (!db) throw new Error("Firestore not initialized");

        // Check cache first
        const cached = this.userCache.get(id);
        if (cached) {
            console.log(`[FirebaseStorage] 🚀 Cache hit for user: ${id}`);
            return cached;
        }

        console.log(`[FirebaseStorage] 💾 Fetching user from database: ${id}`);
        const doc = await db.collection('users').doc(id).get();
        if (!doc.exists) return undefined;

        const user = { id: doc.id, ...doc.data() } as User;
        this.userCache.set(id, user);
        return user;
    }

    async getAllUsers(): Promise<User[]> {
        if (!db) throw new Error("Firestore not initialized");

        // Check cache first
        const cached = this.allUsersCache.get('all');
        if (cached) {
            console.log(`[FirebaseStorage] 🚀 Cache hit for all users (${cached.length} users)`);
            return cached;
        }

        console.log(`[FirebaseStorage] 💾 Fetching all users from database`);
        const snapshot = await db.collection('users').get();
        const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));

        this.allUsersCache.set('all', users);
        return users;
    }

    async getUserByUsername(username: string): Promise<User | undefined> {
        if (!db) throw new Error("Firestore not initialized");

        const cacheKey = `username:${username}`;
        const cached = this.userCache.get(cacheKey);
        if (cached) {
            console.log(`[FirebaseStorage] 🚀 Cache hit for username: ${username}`);
            return cached;
        }

        console.log(`[FirebaseStorage] 💾 Fetching user by username: ${username}`);
        const snapshot = await db.collection('users')
            .where('username', '==', username)
            .limit(1)
            .get();

        if (snapshot.empty) return undefined;
        const doc = snapshot.docs[0];
        const user = { id: doc.id, ...doc.data() } as User;

        this.userCache.set(cacheKey, user);
        this.userCache.set(user.id, user); // Also cache by ID
        return user;
    }

    async getUserByEmail(email: string): Promise<User | undefined> {
        if (!db) throw new Error("Firestore not initialized");

        const cacheKey = `email:${email}`;
        const cached = this.userCache.get(cacheKey);
        if (cached) {
            console.log(`[FirebaseStorage] 🚀 Cache hit for email: ${email}`);
            return cached;
        }

        console.log(`[FirebaseStorage] 💾 Fetching user by email: ${email}`);
        const snapshot = await db.collection('users')
            .where('email', '==', email)
            .limit(1)
            .get();

        if (snapshot.empty) return undefined;
        const doc = snapshot.docs[0];
        const user = { id: doc.id, ...doc.data() } as User;

        this.userCache.set(cacheKey, user);
        this.userCache.set(user.id, user);
        return user;
    }

    async getUserByMobile(mobile: string): Promise<User | undefined> {
        if (!db) throw new Error("Firestore not initialized");

        const cacheKey = `mobile:${mobile}`;
        const cached = this.userCache.get(cacheKey);
        if (cached) {
            console.log(`[FirebaseStorage] 🚀 Cache hit for mobile: ${mobile}`);
            return cached;
        }

        console.log(`[FirebaseStorage] 💾 Fetching user by mobile: ${mobile}`);
        const snapshot = await db.collection('users')
            .where('mobile', '==', mobile)
            .limit(1)
            .get();

        if (snapshot.empty) return undefined;
        const doc = snapshot.docs[0];
        const user = { id: doc.id, ...doc.data() } as User;

        this.userCache.set(cacheKey, user);
        this.userCache.set(user.id, user);
        return user;
    }

    async getUserByEmailOrMobile(identifier: string): Promise<User | undefined> {
        if (!db) throw new Error("Firestore not initialized");

        // Try email first
        let user = await this.getUserByEmail(identifier);
        if (user) return user;

        // Try mobile
        return await this.getUserByMobile(identifier);
    }

    async createUser(insertUser: InsertUser): Promise<User> {
        if (!db) throw new Error("Firestore not initialized");

        const id = randomUUID();
        const user: User = {
            ...insertUser,
            id,
            emailNotifications: "true",
            whatsappNotifications: "false",
            telegramNotifications: "false",
            telegramChatId: null,
            notificationDays: "3",
            notificationsPerDay: "1",
            pushSubscriptions: [],
            profilePicture: "default",
            browserNotifications: "false",
            quietHoursStart: null,
            quietHoursEnd: null,
            createdAt: new Date().toISOString(),
        };

        await db.collection('users').doc(id).set(user);

        // Invalidate caches
        this.userCache.set(id, user);
        this.allUsersCache.clear();

        console.log(`[FirebaseStorage] ✅ Created user: ${user.username}`);
        return user;
    }

    async updateUserPassword(userId: string, newPasswordHash: string): Promise<boolean> {
        if (!db) throw new Error("Firestore not initialized");
        try {
            await db.collection('users').doc(userId).update({
                password: newPasswordHash
            });

            // Invalidate user cache
            this.userCache.invalidate(userId);
            this.allUsersCache.clear();

            return true;
        } catch (error) {
            return false;
        }
    }

    async updateUserProfile(userId: string, profile: { username?: string; email?: string; profilePicture?: string }): Promise<boolean> {
        if (!db) throw new Error("Firestore not initialized");
        try {
            const updateData: any = {};
            if (profile.username !== undefined) updateData.username = profile.username;
            if (profile.email !== undefined) updateData.email = profile.email;
            if (profile.profilePicture !== undefined) updateData.profilePicture = profile.profilePicture;

            await db.collection('users').doc(userId).update(updateData);

            // Invalidate all user caches
            this.userCache.invalidate(userId);
            this.userCache.invalidatePattern(userId);
            this.allUsersCache.clear();

            return true;
        } catch (error) {
            return false;
        }
    }

    async updateNotificationPreferences(
        userId: string,
        preferences: Partial<Pick<User, 'emailNotifications' | 'whatsappNotifications' | 'telegramNotifications' | 'telegramChatId' | 'notificationDays' | 'notificationsPerDay' | 'browserNotifications' | 'quietHoursStart' | 'quietHoursEnd'>>
    ): Promise<boolean> {
        if (!db) throw new Error("Firestore not initialized");
        try {
            await db.collection('users').doc(userId).update(preferences);

            // Invalidate user cache
            this.userCache.invalidate(userId);
            this.allUsersCache.clear();

            return true;
        } catch (error) {
            return false;
        }
    }

    async addPushSubscription(userId: string, subscription: string): Promise<boolean> {
        if (!db) throw new Error("Firestore not initialized");
        try {
            const userRef = db.collection('users').doc(userId);
            await userRef.update({
                pushSubscriptions: require('firebase-admin').firestore.FieldValue.arrayUnion(subscription)
            });

            // Invalidate user cache
            this.userCache.invalidate(userId);

            return true;
        } catch (error) {
            console.error("[FirebaseStorage] Failed to add push subscription:", error);
            return false;
        }
    }

    // Food item methods
    async getFoodItemsByUserId(userId: string): Promise<FoodItem[]> {
        if (!db) throw new Error("Firestore not initialized");

        // Check cache first
        const cacheKey = `foodItems:${userId}`;
        const cached = this.foodItemsCache.get(cacheKey);
        if (cached) {
            console.log(`[FirebaseStorage] 🚀 Cache hit for food items: ${userId} (${cached.length} items)`);
            return cached;
        }

        console.log(`[FirebaseStorage] 💾 Fetching food items from database for user: ${userId}`);
        const startTime = Date.now();

        const snapshot = await db.collection('foodItems')
            .where('userId', '==', userId)
            .orderBy('expiryDate', 'asc') // Order by expiry date for better UX
            .get();

        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FoodItem));
        const duration = Date.now() - startTime;

        console.log(`[FirebaseStorage] ✅ Fetched ${items.length} food items in ${duration}ms`);

        // Cache the results
        this.foodItemsCache.set(cacheKey, items);

        return items;
    }

    async getFoodItem(id: string): Promise<FoodItem | undefined> {
        if (!db) throw new Error("Firestore not initialized");
        const doc = await db.collection('foodItems').doc(id).get();
        if (!doc.exists) return undefined;
        return { id: doc.id, ...doc.data() } as FoodItem;
    }

    async createFoodItem(userId: string, insertItem: InsertFoodItem): Promise<FoodItem> {
        if (!db) throw new Error("Firestore not initialized");

        const id = randomUUID();
        const foodItem: FoodItem = {
            ...insertItem,
            id,
            userId,
            quantity: insertItem.quantity || null,
            notes: insertItem.notes || null,
            createdAt: new Date().toISOString(),
        };

        await db.collection('foodItems').doc(id).set(foodItem);

        // Invalidate food items cache for this user
        this.foodItemsCache.invalidate(`foodItems:${userId}`);

        console.log(`[FirebaseStorage] ✅ Created food item: ${foodItem.name} for user: ${userId}`);
        return foodItem;
    }

    async updateFoodItem(id: string, userId: string, updateData: Partial<InsertFoodItem>): Promise<FoodItem | undefined> {
        if (!db) throw new Error("Firestore not initialized");

        // First check if the item exists and belongs to the user
        const existing = await this.getFoodItem(id);
        if (!existing || existing.userId !== userId) {
            return undefined;
        }

        await db.collection('foodItems').doc(id).update(updateData);

        // Invalidate food items cache for this user
        this.foodItemsCache.invalidate(`foodItems:${userId}`);

        // Return updated item
        return await this.getFoodItem(id);
    }

    async deleteFoodItem(id: string, userId: string): Promise<boolean> {
        if (!db) throw new Error("Firestore not initialized");

        // First check if the item exists and belongs to the user
        const existing = await this.getFoodItem(id);
        if (!existing || existing.userId !== userId) {
            return false;
        }

        await db.collection('foodItems').doc(id).delete();

        // Invalidate food items cache for this user
        this.foodItemsCache.invalidate(`foodItems:${userId}`);

        console.log(`[FirebaseStorage] ✅ Deleted food item: ${id} for user: ${userId}`);
        return true;
    }
}
