import type { User } from "@shared/schema";
import { storage } from "./storage";
import { whatsappCloudService } from "./whatsappCloudService";
import { randomBytes } from "crypto";

interface VerificationCode {
    code: string;
    userId: string;
    mobile: string;
    createdAt: number;
    expiresAt: number;
}

class WhatsAppVerificationService {
    private verificationCodes: Map<string, VerificationCode> = new Map();
    private verifiedNumbers: Map<string, string> = new Map(); // mobile -> userId
    private readonly CODE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

    /**
     * Generate a verification code for a user
     */
    generateVerificationCode(userId: string, mobile: string): string {
        // Generate a 6-digit code
        const code = Math.floor(100000 + Math.random() * 900000).toString();

        const verification: VerificationCode = {
            code,
            userId,
            mobile,
            createdAt: Date.now(),
            expiresAt: Date.now() + this.CODE_EXPIRY_MS,
        };

        // Store by mobile number
        this.verificationCodes.set(mobile, verification);

        console.log(`[WhatsAppVerification] Generated code ${code} for ${mobile}`);

        // Clean up expired codes
        this.cleanupExpiredCodes();

        return code;
    }

    /**
     * Send verification code to user's WhatsApp
     */
    async sendVerificationCode(user: User): Promise<{ success: boolean; message: string }> {
        if (!whatsappCloudService.isConfigured()) {
            return {
                success: false,
                message: "WhatsApp service is not configured on the server",
            };
        }

        if (!user.mobile) {
            return {
                success: false,
                message: "No mobile number found for this user",
            };
        }

        // Generate verification code
        const code = this.generateVerificationCode(user.id, user.mobile);

        // Send verification message
        const message = `🍎 *Food Remainder - WhatsApp Verification*

Hi ${user.username}! 👋

Your verification code is: *${code}*

This code will expire in 10 minutes.

Enter this code in the app to enable WhatsApp notifications.

If you didn't request this, please ignore this message.`;

        try {
            const sent = await whatsappCloudService.sendTextMessage(user.mobile, message);

            if (sent) {
                console.log(`[WhatsAppVerification] ✅ Verification code sent to ${user.mobile}`);
                return {
                    success: true,
                    message: `Verification code sent to ${user.mobile}`,
                };
            } else {
                console.log(`[WhatsAppVerification] ❌ Failed to send verification code to ${user.mobile}`);
                return {
                    success: false,
                    message: "Failed to send verification code. Please check the server logs for details.",
                };
            }
        } catch (error) {
            console.error(`[WhatsAppVerification] Error sending verification code:`, error);
            return {
                success: false,
                message: error instanceof Error ? error.message : "Unknown error occurred",
            };
        }
    }

    /**
     * Verify a code entered by the user
     */
    async verifyCode(userId: string, code: string): Promise<{ success: boolean; message: string }> {
        console.log(`[WhatsAppVerification] Verifying code for user ${userId}`);

        // Get user to find their mobile number
        const user = await storage.getUser(userId);
        if (!user) {
            return {
                success: false,
                message: "User not found",
            };
        }

        const verification = this.verificationCodes.get(user.mobile);

        if (!verification) {
            console.log(`[WhatsAppVerification] No verification code found for ${user.mobile}`);
            return {
                success: false,
                message: "No verification code found. Please request a new code.",
            };
        }

        // Check if code has expired
        if (Date.now() > verification.expiresAt) {
            console.log(`[WhatsAppVerification] Code expired for ${user.mobile}`);
            this.verificationCodes.delete(user.mobile);
            return {
                success: false,
                message: "Verification code has expired. Please request a new code.",
            };
        }

        // Check if user ID matches
        if (verification.userId !== userId) {
            console.log(`[WhatsAppVerification] User ID mismatch for ${user.mobile}`);
            return {
                success: false,
                message: "Invalid verification code",
            };
        }

        // Verify the code
        if (verification.code !== code.trim()) {
            console.log(`[WhatsAppVerification] Invalid code for ${user.mobile}`);
            return {
                success: false,
                message: "Invalid verification code. Please try again.",
            };
        }

        // Code is valid! Mark as verified
        this.verifiedNumbers.set(user.mobile, userId);
        this.verificationCodes.delete(user.mobile);

        // Update user's WhatsApp notification status
        await storage.updateNotificationPreferences(userId, {
            whatsappNotifications: "true",
        });

        console.log(`[WhatsAppVerification] ✅ Successfully verified ${user.mobile} for user ${userId}`);

        return {
            success: true,
            message: "WhatsApp verified successfully! You will now receive notifications.",
        };
    }

    /**
     * Check if a mobile number is verified
     */
    isVerified(mobile: string): boolean {
        return this.verifiedNumbers.has(mobile);
    }

    /**
     * Get verified user ID for a mobile number
     */
    getVerifiedUserId(mobile: string): string | undefined {
        return this.verifiedNumbers.get(mobile);
    }

    /**
     * Disconnect WhatsApp for a user
     */
    async disconnectWhatsApp(userId: string): Promise<{ success: boolean; message: string }> {
        const user = await storage.getUser(userId);
        if (!user) {
            return {
                success: false,
                message: "User not found",
            };
        }

        // Remove from verified numbers
        this.verifiedNumbers.delete(user.mobile);
        this.verificationCodes.delete(user.mobile);

        // Update user preferences
        await storage.updateNotificationPreferences(userId, {
            whatsappNotifications: "false",
        });

        console.log(`[WhatsAppVerification] Disconnected WhatsApp for user ${userId}`);

        return {
            success: true,
            message: "WhatsApp disconnected successfully",
        };
    }

    /**
   * Clean up expired verification codes
   */
    private cleanupExpiredCodes() {
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
    async getVerificationStatus(userId: string): Promise<{
        isVerified: boolean;
        mobile?: string;
        hasPendingCode?: boolean;
    }> {
        const user = await storage.getUser(userId);
        if (!user) {
            return { isVerified: false };
        }

        const isVerified = this.isVerified(user.mobile);
        const hasPendingCode = this.verificationCodes.has(user.mobile);

        return {
            isVerified,
            mobile: user.mobile,
            hasPendingCode,
        };
    }
}

export const whatsappVerificationService = new WhatsAppVerificationService();
