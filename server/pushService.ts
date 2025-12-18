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
        console.log(`[PushService] ========================================`);
        console.log(`[PushService] Starting push notification for user: ${user.username}`);
        console.log(`[PushService] User ID: ${user.id}`);
        console.log(`[PushService] Expiring items count: ${expiringItems.length}`);

        if (!this.isConfigured()) {
            console.log(`[PushService] ❌ Service not configured, skipping push for user ${user.username}`);
            console.log(`[PushService] ========================================`);
            return false;
        }

        console.log(`[PushService] ✅ Service is configured`);
        console.log(`[PushService] User pushSubscriptions:`, user.pushSubscriptions);
        console.log(`[PushService] pushSubscriptions type:`, typeof user.pushSubscriptions);
        console.log(`[PushService] pushSubscriptions length:`, user.pushSubscriptions?.length);

        if (!user.pushSubscriptions || user.pushSubscriptions.length === 0) {
            console.log(`[PushService] ❌ No push subscriptions found for user ${user.username}`);
            console.log(`[PushService] ========================================`);
            return false;
        }

        console.log(`[PushService] ✅ Found ${user.pushSubscriptions.length} subscription(s) for user ${user.username}`);

        const itemsList = expiringItems
            .map(item => item.name)
            .join(", ");

        const count = expiringItems.length;
        const title = `🍎 Food Expiry Alert: ${count} item${count > 1 ? 's' : ''}`;
        const body = `Expiring soon: ${itemsList}`;

        const payload = JSON.stringify({
            title,
            body,
            icon: '/icon-192.png',
            badge: '/badge.png',
            vibrate: [100, 50, 100],
            data: {
                url: '/dashboard',
                timestamp: Date.now()
            }
        });

        console.log(`[PushService] Notification payload:`, payload);

        let successCount = 0;
        const failedSubscriptions: string[] = [];

        // Send to all subscriptions
        for (let i = 0; i < user.pushSubscriptions.length; i++) {
            const subStr = user.pushSubscriptions[i];
            console.log(`[PushService] Processing subscription ${i + 1}/${user.pushSubscriptions.length}`);
            console.log(`[PushService] Subscription string length:`, subStr.length);

            try {
                const sub = JSON.parse(subStr);
                console.log(`[PushService] Parsed subscription endpoint:`, sub.endpoint?.substring(0, 80) + '...');
                console.log(`[PushService] Sending notification...`);

                await webpush.sendNotification(sub, payload);
                successCount++;
                console.log(`[PushService] ✅ Push sent successfully to subscription ${i + 1}`);
            } catch (error: any) {
                console.error(`[PushService] ❌ Error sending push to subscription ${i + 1}:`, error);
                console.error(`[PushService] Error status code:`, error.statusCode);
                console.error(`[PushService] Error message:`, error.message);
                console.error(`[PushService] Error body:`, error.body);

                if (error.statusCode === 410 || error.statusCode === 404) {
                    // Subscription has expired or is no longer valid
                    console.log(`[PushService] ⚠️ Subscription expired (${error.statusCode}), marking for cleanup`);
                    failedSubscriptions.push(subStr);
                } else {
                    console.error(`[PushService] ❌ Unexpected error (${error.statusCode || 'unknown'}):`, error.message);
                }
            }
        }

        // Log cleanup info (in future, implement actual cleanup)
        if (failedSubscriptions.length > 0) {
            console.log(`[PushService] 🗑️ ${failedSubscriptions.length} expired subscription(s) should be removed for user ${user.username}`);
            // TODO: Implement storage.removePushSubscriptions(user.id, failedSubscriptions)
        }

        if (successCount > 0) {
            console.log(`[PushService] ✅ Successfully sent ${successCount}/${user.pushSubscriptions.length} push notifications to ${user.username}`);
            console.log(`[PushService] ========================================`);
            return true;
        }

        console.log(`[PushService] ❌ Failed to send any push notifications to ${user.username}`);
        console.log(`[PushService] ========================================`);
        return false;
    }
}

export const pushService = new PushService();
