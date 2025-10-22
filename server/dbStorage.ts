import { db } from "./db";
import { users, foodItems } from "@shared/schema";
import { eq, or, and } from "drizzle-orm";
import type { User, InsertUser, FoodItem, InsertFoodItem } from "@shared/schema";
import type { IStorage } from "./storage";

export class DbStorage implements IStorage {
  constructor() {
    if (!db) {
      throw new Error("Database connection not initialized. DATABASE_URL must be set.");
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    if (!db) throw new Error("Database not initialized");
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    if (!db) throw new Error("Database not initialized");
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    if (!db) throw new Error("Database not initialized");
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async getUserByMobile(mobile: string): Promise<User | undefined> {
    if (!db) throw new Error("Database not initialized");
    const result = await db.select().from(users).where(eq(users.mobile, mobile)).limit(1);
    return result[0];
  }

  async getUserByEmailOrMobile(identifier: string): Promise<User | undefined> {
    if (!db) throw new Error("Database not initialized");
    const result = await db
      .select()
      .from(users)
      .where(or(eq(users.email, identifier), eq(users.mobile, identifier)))
      .limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    if (!db) throw new Error("Database not initialized");
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async updateUserPassword(userId: string, newPasswordHash: string): Promise<boolean> {
    if (!db) throw new Error("Database not initialized");
    const result = await db
      .update(users)
      .set({ password: newPasswordHash })
      .where(eq(users.id, userId))
      .returning();
    return result.length > 0;
  }

  // Food item methods
  async getFoodItemsByUserId(userId: string): Promise<FoodItem[]> {
    if (!db) throw new Error("Database not initialized");
    const result = await db.select().from(foodItems).where(eq(foodItems.userId, userId));
    return result;
  }

  async getFoodItem(id: string): Promise<FoodItem | undefined> {
    if (!db) throw new Error("Database not initialized");
    const result = await db.select().from(foodItems).where(eq(foodItems.id, id)).limit(1);
    return result[0];
  }

  async createFoodItem(userId: string, insertItem: InsertFoodItem): Promise<FoodItem> {
    if (!db) throw new Error("Database not initialized");
    const result = await db.insert(foodItems).values({ ...insertItem, userId }).returning();
    return result[0];
  }

  async updateFoodItem(id: string, userId: string, updateData: Partial<InsertFoodItem>): Promise<FoodItem | undefined> {
    if (!db) throw new Error("Database not initialized");
    const result = await db
      .update(foodItems)
      .set(updateData)
      .where(and(eq(foodItems.id, id), eq(foodItems.userId, userId)))
      .returning();
    return result[0];
  }

  async deleteFoodItem(id: string, userId: string): Promise<boolean> {
    if (!db) throw new Error("Database not initialized");
    const result = await db
      .delete(foodItems)
      .where(and(eq(foodItems.id, id), eq(foodItems.userId, userId)))
      .returning();
    return result.length > 0;
  }
}
