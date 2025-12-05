import webpush from "web-push";
import type { User, FoodItem } from "@shared/schema";

interface PushConfig {
    publicKey: string;
    privateKey: string;
    email: string;
}

class PushService {
    private config: PushConfig | null = null;

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

        console.log("[PushService] ✅ Push notification service initialized");
        return true;
    }

    getPublicKey(): string | null {
        return this.config?.publicKey || null;
    }

    isConfigured(): boolean {
        return this.config !== null;
    }

    async sendExpiryNotification(user: User, expiringItems: FoodItem[]): Promise<boolean> {
        if (!this.isConfigured() || !user.pushSubscriptions || user.pushSubscriptions.length === 0) {
            return false;
        }

        const itemsList = expiringItems
            .map(item => item.name)
            .join(", ");

        const count = expiringItems.length;
        const title = `Food Expiry Alert: ${count} item${count > 1 ? 's' : ''}`;
        const body = `Expiring soon: ${itemsList}`;

        const payload = JSON.stringify({
            title,
            body,
            icon: '/icon-192.png', // Ensure this exists or use a placeholder
            data: {
                url: '/dashboard'
            }
        });

        let successCount = 0;
        const cleanupSubscriptions: string[] = [];

        // Send to all subscriptions
        for (const subStr of user.pushSubscriptions) {
            try {
                const sub = JSON.parse(subStr);
                await webpush.sendNotification(sub, payload);
                successCount++;
            } catch (error: any) {
                if (error.statusCode === 410 || error.statusCode === 404) {
                    // Subscription has expired or is no longer valid
                    console.log("[PushService] Subscription expired, should remove");
                    // In a real app, we should remove this subscription from DB
                    // For now, we just log it. 
                    // To implement cleanup: storage.removePushSubscription(user.id, subStr)
                } else {
                    console.error("[PushService] Error sending push:", error);
                }
            }
        }

        if (successCount > 0) {
            console.log(`[PushService] ✅ Sent ${successCount} push notifications to ${user.username}`);
            return true;
        }

        return false;
    }
}

export const pushService = new PushService();
