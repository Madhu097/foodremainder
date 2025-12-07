import { db } from "./firebase";
import type { User, InsertUser, FoodItem, InsertFoodItem } from "@shared/schema";
import type { IStorage } from "./storage";
import { randomUUID } from "crypto";

export class FirebaseStorage implements IStorage {
    constructor() {
        if (!db) {
            throw new Error("Firebase Firestore not initialized. Check Firebase configuration.");
        }
    }

    // User methods
    async getUser(id: string): Promise<User | undefined> {
        if (!db) throw new Error("Firestore not initialized");
        const doc = await db.collection('users').doc(id).get();
        if (!doc.exists) return undefined;
        return { id: doc.id, ...doc.data() } as User;
    }

    async getAllUsers(): Promise<User[]> {
        if (!db) throw new Error("Firestore not initialized");
        const snapshot = await db.collection('users').get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
    }

    async getUserByUsername(username: string): Promise<User | undefined> {
        if (!db) throw new Error("Firestore not initialized");
        const snapshot = await db.collection('users')
            .where('username', '==', username)
            .limit(1)
            .get();

        if (snapshot.empty) return undefined;
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() } as User;
    }

    async getUserByEmail(email: string): Promise<User | undefined> {
        if (!db) throw new Error("Firestore not initialized");
        const snapshot = await db.collection('users')
            .where('email', '==', email)
            .limit(1)
            .get();

        if (snapshot.empty) return undefined;
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() } as User;
    }

    async getUserByMobile(mobile: string): Promise<User | undefined> {
        if (!db) throw new Error("Firestore not initialized");
        const snapshot = await db.collection('users')
            .where('mobile', '==', mobile)
            .limit(1)
            .get();

        if (snapshot.empty) return undefined;
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() } as User;
    }

    async getUserByEmailOrMobile(identifier: string): Promise<User | undefined> {
        if (!db) throw new Error("Firestore not initialized");

        // Try email first
        let snapshot = await db.collection('users')
            .where('email', '==', identifier)
            .limit(1)
            .get();

        if (!snapshot.empty) {
            const doc = snapshot.docs[0];
            return { id: doc.id, ...doc.data() } as User;
        }

        // Try mobile
        snapshot = await db.collection('users')
            .where('mobile', '==', identifier)
            .limit(1)
            .get();

        if (snapshot.empty) return undefined;
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() } as User;
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
        return user;
    }

    async updateUserPassword(userId: string, newPasswordHash: string): Promise<boolean> {
        if (!db) throw new Error("Firestore not initialized");
        try {
            await db.collection('users').doc(userId).update({
                password: newPasswordHash
            });
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
            return true;
        } catch (error) {
            return false;
        }
    }

    async addPushSubscription(userId: string, subscription: string): Promise<boolean> {
        if (!db) throw new Error("Firestore not initialized");
        try {
            const userRef = db.collection('users').doc(userId);
            // Use arrayUnion to add unique subscription
            await userRef.update({
                pushSubscriptions: require('firebase-admin').firestore.FieldValue.arrayUnion(subscription)
            });
            return true;
        } catch (error) {
            console.error("[FirebaseStorage] Failed to add push subscription:", error);
            return false;
        }
    }

    // Food item methods
    async getFoodItemsByUserId(userId: string): Promise<FoodItem[]> {
        if (!db) throw new Error("Firestore not initialized");
        const snapshot = await db.collection('foodItems')
            .where('userId', '==', userId)
            .get();

        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FoodItem));
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
        return true;
    }
}
