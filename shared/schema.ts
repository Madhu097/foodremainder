import { z } from "zod";

// User interface for Firebase
export interface User {
  id: string;
  username: string;
  email: string;
  mobile: string;
  profilePicture: string; // Avatar selection: 'iron-man', 'captain-america', 'black-widow', 'hulk', 'thor', 'black-panther', or 'default'
  password: string;
  emailNotifications: string;
  whatsappNotifications: string;
  telegramNotifications: string;
  telegramChatId: string | null;
  notificationDays: string;
  notificationsPerDay: string; // Number of times to send notifications per day (1-4)
  pushSubscriptions: string[]; // Array of JSON stringified PushSubscription objects
  browserNotifications: string;
  smsNotifications: string;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  createdAt: string;
}

// Food Item interface for Firebase
export interface FoodItem {
  id: string;
  userId: string;
  name: string;
  category: string;
  purchaseDate: string;
  expiryDate: string;
  quantity: string | null;
  notes: string | null;
  createdAt: string;
}

// Zod validation schemas
export const insertUserSchema = z.object({
  username: z.string().min(1, "Username is required"),
  email: z.string().email("Invalid email address"),
  mobile: z.string().regex(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/, "Invalid mobile number"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const loginSchema = z.object({
  identifier: z.string().min(1, "Email or mobile number required"),
  password: z.string().min(1, "Password required"),
});

export const insertFoodItemSchema = z.object({
  name: z.string().min(1, "Food name is required"),
  category: z.string().min(1, "Category is required"),
  purchaseDate: z.string().min(1, "Purchase date is required"),
  expiryDate: z.string().min(1, "Expiry date is required"),
  quantity: z.string().optional(),
  notes: z.string().optional(),
});

// Type exports
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginUser = z.infer<typeof loginSchema>;
export type InsertFoodItem = z.infer<typeof insertFoodItemSchema>;
