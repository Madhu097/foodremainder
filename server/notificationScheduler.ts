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
     * Generate a cron schedule based on number of notifications per day
     * 1 = 9am, 2 = 9am,6pm, 3 = 9am,2pm,7pm, 4 = 8am,12pm,4pm,8pm
     */
    private generateSchedule(timesPerDay: number): string {
        const schedules: Record<number, string> = {
            1: "0 9 * * *",        // 9 AM
            2: "0 9,18 * * *",     // 9 AM, 6 PM
            3: "0 9,14,19 * * *",  // 9 AM, 2 PM, 7 PM
            4: "0 8,12,16,20 * * *" // 8 AM, 12 PM, 4 PM, 8 PM
        };

        // Default to once daily if invalid
        return schedules[timesPerDay] || schedules[1];
    }

    /**
     * Start the notification scheduler
     * @param cronExpression - Cron expression for schedule (default: based on NOTIFICATION_TIMES_PER_DAY)
     * Common cron patterns:
     *   Once daily at 9 AM: "0 9 * * *"
     *   Twice daily at 9 AM and 6 PM: "0 9,18 * * *"
     *   Three times: "0 9,14,19 * * *"
     *   Four times: "0 8,12,16,20 * * *"
     */
    start(cronExpression?: string): void {
        if (this.isRunning) {
            console.log("[NotificationScheduler] Scheduler is already running");
            return;
        }

        // Check if test mode is enabled (runs every 30 minutes for testing)
        const testMode = process.env.NOTIFICATION_SCHEDULE_TEST === "true";

        // Generate schedule based on number of times per day (default: 1)
        const timesPerDay = parseInt(process.env.NOTIFICATION_TIMES_PER_DAY || "1");
        const defaultSchedule = testMode ? "*/30 * * * *" : this.generateSchedule(timesPerDay);
        const schedule = cronExpression || process.env.NOTIFICATION_SCHEDULE || defaultSchedule;

        console.log(`[NotificationScheduler] 🕐 Starting notification scheduler...`);
        console.log(`[NotificationScheduler] 📅 Schedule: ${schedule}`);
        console.log(`[NotificationScheduler] 🔔 Notifications per day: ${timesPerDay}`);
        if (testMode) {
            console.log(`[NotificationScheduler] 🧪 TEST MODE ENABLED - Running every 30 minutes`);
            console.log(`[NotificationScheduler] 💡 Set NOTIFICATION_SCHEDULE_TEST=false in .env to disable test mode`);
        } else {
            console.log(`[NotificationScheduler] 💡 Tip: Set NOTIFICATION_SCHEDULE_TEST=true for testing (runs every 30 min)`);
        }
        console.log(`[NotificationScheduler] 💡 Customize with NOTIFICATION_SCHEDULE or NOTIFICATION_TIMES_PER_DAY in .env`);

        this.scheduledTask = cron.schedule(schedule, async () => {
            const now = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
            console.log(`[NotificationScheduler] ========================================`);
            console.log(`[NotificationScheduler] ⏰ Scheduled notification check triggered at ${now}`);
            console.log(`[NotificationScheduler] ========================================`);
            try {
                await notificationChecker.checkAndNotifyAll();
            } catch (error) {
                console.error("[NotificationScheduler] ❌ Error during scheduled check:", error);
            }
        }, {
            timezone: process.env.TIMEZONE || "Asia/Kolkata" // Default to IST
        });

        this.scheduledTask.start();
        this.isRunning = true;
        console.log("[NotificationScheduler] ✅ Scheduler started successfully");

        // Show next execution time
        const nextExecution = this.getNextExecutionTime(schedule);
        console.log(`[NotificationScheduler] 📌 Next check: ${nextExecution}`);
        console.log(`[NotificationScheduler] 📌 Current time: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
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
                    // Handle multiple hours (e.g., "9,18")
                    const hours = hour.split(',').map(h => parseInt(h));
                    const currentHour = now.getHours();

                    // Find next hour
                    let nextHour = hours.find(h => h > currentHour);
                    const next = new Date();

                    if (nextHour !== undefined) {
                        // Next execution today
                        next.setHours(nextHour, 0, 0, 0);
                    } else {
                        // Next execution tomorrow (use first hour)
                        next.setDate(next.getDate() + 1);
                        next.setHours(hours[0], 0, 0, 0);
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
