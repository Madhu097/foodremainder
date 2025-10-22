import { sql } from "drizzle-orm";
import { pgTable, text, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  mobile: text("mobile").notNull().unique(),
  password: text("password").notNull(),
  emailNotifications: text("email_notifications").default("true"),
  whatsappNotifications: text("whatsapp_notifications").default("false"),
  notificationDays: text("notification_days").default("3"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const foodItems = pgTable("food_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  category: text("category").notNull(),
  purchaseDate: text("purchase_date").notNull(),
  expiryDate: text("expiry_date").notNull(),
  quantity: text("quantity"),
  notes: text("notes"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const insertUserSchema = createInsertSchema(users)
  .pick({
    username: true,
    email: true,
    mobile: true,
    password: true,
  })
  .extend({
    email: z.string().email("Invalid email address"),
    mobile: z.string().regex(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/, "Invalid mobile number"),
    password: z.string().min(6, "Password must be at least 6 characters"),
  });

export const loginSchema = z.object({
  identifier: z.string().min(1, "Email or mobile number required"),
  password: z.string().min(1, "Password required"),
});

export const insertFoodItemSchema = createInsertSchema(foodItems)
  .pick({
    name: true,
    category: true,
    purchaseDate: true,
    expiryDate: true,
    quantity: true,
    notes: true,
  })
  .extend({
    name: z.string().min(1, "Food name is required"),
    category: z.string().min(1, "Category is required"),
    purchaseDate: z.string().min(1, "Purchase date is required"),
    expiryDate: z.string().min(1, "Expiry date is required"),
    quantity: z.string().optional(),
    notes: z.string().optional(),
  });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginUser = z.infer<typeof loginSchema>;
export type User = typeof users.$inferSelect;
export type FoodItem = typeof foodItems.$inferSelect;
export type InsertFoodItem = z.infer<typeof insertFoodItemSchema>;
