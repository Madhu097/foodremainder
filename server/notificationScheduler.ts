import cron from "node-cron";
import { notificationChecker } from "./notificationChecker";


/**
 * Scheduler for automatic notification checks
 * Uses node-cron to schedule periodic checks for expiring food items
 */
class NotificationScheduler {
    private scheduledTask: ReturnType<typeof cron.schedule> | null = null;
    private isRunning = false;

    /**
     * Start the notification scheduler
     * @param cronExpression - Cron expression for schedule (default: daily at 9 AM)
     * Common cron patterns:
     *   Daily at 9 AM: "0 9 * * *"
     *   Twice daily at 9 AM and 6 PM: "0 9,18 * * *"
     *   Every hour: "0 * * * *"
     *   Every 30 minutes: "* /30 * * * *" (remove space)
     */
    start(cronExpression?: string): void {
        if (this.isRunning) {
            console.log("[NotificationScheduler] Scheduler is already running");
            return;
        }

        // Default: Run daily at 9 AM (can be customized via env variable)
        const schedule = cronExpression || process.env.NOTIFICATION_SCHEDULE || "0 9 * * *";

        console.log(`[NotificationScheduler] 🕐 Starting notification scheduler...`);
        console.log(`[NotificationScheduler] 📅 Schedule: ${schedule}`);
        console.log(`[NotificationScheduler] 💡 Tip: Customize with NOTIFICATION_SCHEDULE in .env`);

        this.scheduledTask = cron.schedule(schedule, async () => {
            console.log(`[NotificationScheduler] ⏰ Scheduled notification check triggered`);
            try {
                await notificationChecker.checkAndNotifyAll();
            } catch (error) {
                console.error("[NotificationScheduler] ❌ Error during scheduled check:", error);
            }
        }, {
            timezone: process.env.TIMEZONE || "UTC" // Default to UTC, can be customized
        });

        this.scheduledTask.start();
        this.isRunning = true;
        console.log("[NotificationScheduler] ✅ Scheduler started successfully");

        // Show next execution time
        const nextExecution = this.getNextExecutionTime(schedule);
        console.log(`[NotificationScheduler] 📌 Next check: ${nextExecution}`);
    }

    /**
     * Stop the notification scheduler
     */
    stop(): void {
        if (!this.isRunning || !this.scheduledTask) {
            console.log("[NotificationScheduler] Scheduler is not running");
            return;
        }

        this.scheduledTask.stop();
        this.scheduledTask = null;
        this.isRunning = false;
        console.log("[NotificationScheduler] ⏹️ Scheduler stopped");
    }

    /**
     * Check if scheduler is running
     */
    isActive(): boolean {
        return this.isRunning;
    }

    /**
     * Get the next execution time for a cron expression
     */
    private getNextExecutionTime(cronExpression: string): string {
        try {
            // This is a simple approximation - for production, you might want to use a cron parser library
            const now = new Date();
            const parts = cronExpression.split(' ');

            if (parts.length >= 2) {
                const minute = parts[0];
                const hour = parts[1];

                if (minute === '0' && hour !== '*') {
                    const nextHour = parseInt(hour);
                    const next = new Date();
                    next.setHours(nextHour, 0, 0, 0);

                    // If time has passed today, schedule for tomorrow
                    if (next <= now) {
                        next.setDate(next.getDate() + 1);
                    }

                    return next.toLocaleString();
                }
            }

            return "Check logs for exact time";
        } catch {
            return "Unable to calculate";
        }
    }

    /**
     * Run a manual check immediately (doesn't affect schedule)
     */
    async runManualCheck(): Promise<void> {
        console.log("[NotificationScheduler] 🔄 Running manual notification check...");
        try {
            await notificationChecker.checkAndNotifyAll();
            console.log("[NotificationScheduler] ✅ Manual check completed");
        } catch (error) {
            console.error("[NotificationScheduler] ❌ Manual check failed:", error);
            throw error;
        }
    }
}

export const notificationScheduler = new NotificationScheduler();
