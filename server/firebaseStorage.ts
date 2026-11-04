import { type User, type InsertUser, type FoodItem, type InsertFoodItem } from "@shared/schema";
import type { IStorage } from "./storage";
import { randomUUID } from "crypto";
import { db } from "./firebase";
import admin from "firebase-admin";

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
        for (const key of Array.from(this.cache.keys())) {
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
    // Caches with longer TTL for better performance
    private userCache = new Cache<User>(120); // 2 minutes
    private foodItemsCache = new Cache<FoodItem[]>(60); // 1 minute
    private allUsersCache = new Cache<User[]>(180); // 3 minutes for all users

    constructor() {
        if (!db) {
            throw new Error("Firebase Firestore not initialized. Check Firebase configuration.");
        }
        console.log("[FirebaseStorage] ✅ Initialized with enhanced caching (60-180s TTL)");
    }

    // User methods
    async getUser(id: string): Promise<User | undefined> {
        if (!db) throw new Error("Firestore not initialized");

        // Check cache first
        const cached = this.userCache.get(id);
        if (cached) {
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
            return cached;
        }

        console.log(`[FirebaseStorage] 💾 Fetching all users from database`);
        const snapshot = await db.collection('users').get();
        const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));

        console.log(`[FirebaseStorage] ✅ Retrieved ${users.length} users from database`);

        // Log notification preferences summary
        const notificationStats = {
            email: users.filter(u => u.emailNotifications === "true").length,
            whatsapp: users.filter(u => u.whatsappNotifications === "true").length,
            sms: users.filter(u => u.smsNotifications === "true").length,
            telegram: users.filter(u => u.telegramNotifications === "true").length,
            browser: users.filter(u => u.browserNotifications === "true").length,
        };

        console.log(`[FirebaseStorage] 📊 Notification preferences summary:`);
        console.log(`[FirebaseStorage]    Email enabled: ${notificationStats.email}/${users.length}`);
        console.log(`[FirebaseStorage]    WhatsApp enabled: ${notificationStats.whatsapp}/${users.length}`);
        console.log(`[FirebaseStorage]    SMS enabled: ${notificationStats.sms}/${users.length}`);
        console.log(`[FirebaseStorage]    Telegram enabled: ${notificationStats.telegram}/${users.length}`);
        console.log(`[FirebaseStorage]    Browser enabled: ${notificationStats.browser}/${users.length}`);

        this.allUsersCache.set('all', users);
        return users;
    }

    async getUserByUsername(username: string): Promise<User | undefined> {
        if (!db) throw new Error("Firestore not initialized");

        const cacheKey = `username:${username}`;
        const cached = this.userCache.get(cacheKey);
        if (cached) {
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

    async updateLastNotificationTime(userId: string): Promise<boolean> {
        if (!db) throw new Error("Firestore not initialized");
        try {
            const now = new Date().toISOString();
            await db.collection('users').doc(userId).update({
                lastNotificationSentAt: now
            });

            // Invalidate user cache
            this.userCache.invalidate(userId);
            this.allUsersCache.clear();

            return true;
        } catch (error) {
            console.error(`[FirebaseStorage] Failed to update notification time for user: ${userId}`, error);
            return false;
        }
    }

    async deleteUser(userId: string): Promise<boolean> {
        if (!db) throw new Error("Firestore not initialized");
        try {
            await db.collection('users').doc(userId).delete();

            // Invalidate all user caches
            this.userCache.invalidate(userId);
            this.userCache.invalidatePattern(userId);
            this.allUsersCache.clear();

            console.log(`[FirebaseStorage] ✅ Deleted user: ${userId}`);
            return true;
        } catch (error) {
            console.error(`[FirebaseStorage] ❌ Failed to delete user: ${userId}`, error);
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

    // In firebaseStorage.ts, replace the addPushSubscription method with:
    async addPushSubscription(userId: string, subscription: string): Promise<boolean> {
        if (!db) throw new Error("Firestore not initialized");
        try {
            console.log(`[FirebaseStorage] Adding push subscription for user: ${userId}`);

            // First check if user exists
            const userDoc = await db.collection('users').doc(userId).get();
            if (!userDoc.exists) {
                console.error(`[FirebaseStorage] User not found: ${userId}`);
                return false;
            }

            const userRef = db.collection('users').doc(userId);

            // Use arrayUnion to add subscription without duplicates
            await userRef.update({
                pushSubscriptions: admin.firestore.FieldValue.arrayUnion(subscription)
            });

            console.log(`[FirebaseStorage] Push subscription added successfully for user: ${userId}`);
            this.userCache.invalidate(userId);
            return true;
        } catch (error: any) {
            console.error("[FirebaseStorage] Failed to add push subscription:", error);
            console.error("[FirebaseStorage] Error code:", error.code);
            console.error("[FirebaseStorage] Error message:", error.message);

            // If the field doesn't exist, try to create it
            if (error.code === 'not-found' || error.message?.includes('No document to update')) {
                try {
                    console.log(`[FirebaseStorage] Attempting to create pushSubscriptions field for user: ${userId}`);
                    await db.collection('users').doc(userId).set({
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
    async getFoodItemsByUserId(userId: string): Promise<FoodItem[]> {
        if (!db) {
            console.error("[FirebaseStorage] Firestore not initialized!");
            throw new Error("Firestore not initialized");
        }

        // Check cache first
        const cacheKey = `foodItems:${userId}`;
        const cached = this.foodItemsCache.get(cacheKey);
        if (cached) {
            return cached;
        }

        console.log(`[FirebaseStorage] 💾 Fetching food items from database for user: ${userId}`);
        try {
            // Fetch items without ordering to avoid missing index errors
            // Performance impact is negligible for typical user data sizes (< 100 items)
            // This avoids the latency of try-catch-fallback flow
            const snapshot = await db.collection('foodItems')
                .where('userId', '==', userId)
                .get();

            const items = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as FoodItem));

            // Sort in memory by expiry date (asc)
            items.sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());

            // Cache the results for 60 seconds
            this.foodItemsCache.set(cacheKey, items);
            console.log(`[FirebaseStorage] ✅ Cached ${items.length} food items for user: ${userId}`);

            return items;
        } catch (error: any) {
            console.error(`[FirebaseStorage] Error fetching items:`, error);
            console.error(`[FirebaseStorage] Error code:`, error.code);
            console.error(`[FirebaseStorage] Error message:`, error.message);
            throw error;
        }
    }

    async getFoodItem(id: string): Promise<FoodItem | undefined> {
        if (!db) throw new Error("Firestore not initialized");

        // 1. Direct document lookup
        const doc = await db.collection('foodItems').doc(id).get();
        if (doc.exists) {
            return { ...doc.data(), id: doc.id } as FoodItem;
        }

        // 2. Fallback search by 'id' field in case doc.id !== id
        const query = await db.collection('foodItems').where('id', '==', id).limit(1).get();
        if (!query.empty) {
            const first = query.docs[0];
            return { ...first.data(), id: first.id } as FoodItem;
        }

        return undefined;
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
            barcode: insertItem.barcode || null,
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

        let docRef = null;
        const normalizedUserId = String(userId).trim();

        // 1. Try direct doc ID
        const directDoc = await db.collection('foodItems').doc(id).get();
        if (directDoc.exists) {
            const data = directDoc.data();
            if (String(data?.userId).trim() === normalizedUserId) {
                docRef = directDoc.ref;
            }
        }

        // 2. Fallback: search by 'id' field
        if (!docRef) {
            const query = await db.collection('foodItems').where('id', '==', id).limit(1).get();
            if (!query.empty) {
                const doc = query.docs[0];
                if (String(doc.data()?.userId).trim() === normalizedUserId) {
                    docRef = doc.ref;
                }
            }
        }

        if (!docRef) {
            console.warn(`[FirebaseStorage] ⚠️ Update target not found: item=${id}, user=${userId}`);
            return undefined;
        }

        await docRef.update(updateData);

        // Invalidate food items cache for this user
        this.foodItemsCache.invalidate(`foodItems:${userId}`);

        const updatedDoc = await docRef.get();
        return { ...updatedDoc.data(), id: updatedDoc.id } as FoodItem;
    }

    async deleteFoodItem(id: string, userId: string): Promise<boolean> {
        if (!db) throw new Error("Firestore not initialized");

        let deleted = false;
        const normalizedUserId = String(userId).trim();

        // 1. Check direct doc ID
        const directDoc = await db.collection('foodItems').doc(id).get();
        if (directDoc.exists) {
            const data = directDoc.data();
            if (String(data?.userId).trim() === normalizedUserId) {
                await directDoc.ref.delete();
                deleted = true;
            }
        }

        // 2. Also search by 'id' field in document in case document ID is different
        const query = await db.collection('foodItems').where('id', '==', id).get();
        for (const doc of query.docs) {
            const data = doc.data();
            if (String(data?.userId).trim() === normalizedUserId) {
                await doc.ref.delete();
                deleted = true;
            }
        }

        if (deleted) {
            // Invalidate food items cache for this user
            this.foodItemsCache.invalidate(`foodItems:${userId}`);
            console.log(`[FirebaseStorage] ✅ Successfully deleted food item: ${id} for user: ${userId}`);
            return true;
        }

        console.warn(`[FirebaseStorage] ⚠️ Item not found or unauthorized for delete: item=${id}, user=${userId}`);
        return false;
    }
}
