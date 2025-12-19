import nodemailer from "nodemailer";
import { Resend } from "resend";
import type { FoodItem, User } from "@shared/schema";

interface EmailConfig {
  service: "smtp" | "resend";
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  resendApiKey?: string;
  from: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private resendClient: Resend | null = null;
  private config: EmailConfig | null = null;

  initialize() {
    console.log("[EmailService] Initializing email service...");
    const emailService = process.env.EMAIL_SERVICE || "smtp";
    const from = process.env.EMAIL_FROM || "Food Reminder <noreply@foodreminder.app>";

    console.log(`[EmailService] Mode: ${emailService}`);
    console.log(`[EmailService] From: ${from}`);

    // Option 1: Resend (Modern, recommended, free tier: 100 emails/day)
    if (emailService === "resend") {
      const resendApiKey = process.env.RESEND_API_KEY;

      if (!resendApiKey) {
        console.error("[EmailService] ❌ Resend API key not found. Email notifications will be disabled.");
        console.warn("[EmailService] Set RESEND_API_KEY in your .env file.");
        return false;
      }

      this.config = {
        service: "resend",
        resendApiKey,
        from,
      };

      try {
        this.resendClient = new Resend(resendApiKey);
        console.log("[EmailService] ✅ Email service initialized with Resend");
        return true;
      } catch (e) {
        console.error("[EmailService] ❌ Failed to initialize Resend client:", e);
        return false;
      }
    }

    // Option 2: Traditional SMTP (Gmail, SendGrid, etc.)
    const host = process.env.EMAIL_HOST;
    const port = process.env.EMAIL_PORT;
    const user = process.env.EMAIL_USER;
    const password = process.env.EMAIL_PASSWORD;

    console.log(`[EmailService] Check SMTP Config: Host=${!!host}, Port=${!!port}, User=${!!user}, Pass=${!!password}`);

    if (!host || !port || !user || !password) {
      console.warn("[EmailService] ❌ SMTP configuration incomplete. Email notifications will be disabled.");
      console.warn("[EmailService] Set EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASSWORD in your .env file.");
      console.warn("[EmailService] Or switch to Resend by setting EMAIL_SERVICE=resend and RESEND_API_KEY");
      return false;
    }

    this.config = {
      service: "smtp",
      host,
      port: parseInt(port),
      user,
      password,
      from,
    };

    try {
      // Create transporter
      this.transporter = nodemailer.createTransport({
        host: this.config.host,
        port: this.config.port,
        secure: this.config.port === 465, // true for 465, false for other ports
        auth: {
          user: this.config.user,
          pass: this.config.password,
        },
      });

      console.log("[EmailService] ✅ Email service initialized with SMTP");
      console.log(`[EmailService] 📧 Using ${host}:${port}`);
      return true;
    } catch (e) {
      console.error("[EmailService] ❌ Failed to create SMTP transporter:", e);
      return false;
    }
  }

  isConfigured(): boolean {
    const configured = (this.transporter !== null || this.resendClient !== null) && this.config !== null;
    if (!configured) {
      // Only log this once ideally, but good for debugging now
      // console.debug("[EmailService] Check configured: false");
    }
    return configured;
  }

  async sendExpiryNotification(user: User, expiringItems: FoodItem[]): Promise<boolean> {
    if (!this.isConfigured()) {
      console.warn(`[EmailService] ⚠️ Email service not configured. Skipping email for ${user.username}`);
      return false;
    }

    if (!user.email || user.email.trim() === '') {
      console.warn(`[EmailService] ⚠️ User ${user.username} has no email address`);
      console.log(`[EmailService] 💡 Add email in Profile settings to receive email notifications`);
      return false;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(user.email)) {
      console.warn(`[EmailService] ⚠️ User ${user.username} has invalid email format: ${user.email}`);
      return false;
    }

    console.log(`[EmailService] 📧 Attempting to send email to ${user.email} (${user.username}) with ${expiringItems.length} expiring items`);

    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const { subject, htmlContent, textContent } = this.generateEmailContent(user, expiringItems);

        if (this.config!.service === "resend" && this.resendClient) {
          // Send via Resend
          console.log(`[EmailService] Sending via Resend (attempt ${attempt}/${maxRetries})...`);
          console.log(`[EmailService] From: ${this.config!.from}`);
          console.log(`[EmailService] To: ${user.email}`);
          console.log(`[EmailService] Subject: ${subject}`);
          
          const { data, error } = await this.resendClient.emails.send({
            from: this.config!.from,
            to: user.email,
            subject,
            html: htmlContent,
            text: textContent,
          });

          if (error) {
            console.error(`[EmailService] ❌ Resend API Error (attempt ${attempt}/${maxRetries}):`);
            console.error(`[EmailService] Error name: ${error.name}`);
            console.error(`[EmailService] Error message: ${error.message}`);
            console.error(`[EmailService] Full error:`, JSON.stringify(error, null, 2));
            lastError = new Error(`Resend Error: ${error.message}`);

            // Check for specific error types
            if (error.message?.includes('API key')) {
              console.error(`[EmailService] ❌ Invalid API key - check RESEND_API_KEY in .env`);
              console.error(`[EmailService] Get your API key from: https://resend.com/api-keys`);
              break;
            }

            // Don't retry on certain errors
            if (error.message?.includes('Invalid') || error.message?.includes('not found')) {
              console.error(`[EmailService] ❌ Non-retryable error, aborting`);
              break;
            }

            // Wait before retry (exponential backoff)
            if (attempt < maxRetries) {
              const waitTime = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
              console.log(`[EmailService] ⏳ Waiting ${waitTime}ms before retry...`);
              await new Promise(resolve => setTimeout(resolve, waitTime));
              continue;
            }
          } else {
            console.log(`[EmailService] ✅ Expiry notification sent to ${user.email} via Resend. ID: ${data?.id}`);
            return true;
          }
        } else if (this.transporter) {
          // Send via SMTP
          console.log(`[EmailService] Sending via SMTP (attempt ${attempt}/${maxRetries})...`);
          const info = await this.transporter.sendMail({
            from: this.config!.from,
            to: user.email,
            subject,
            text: textContent,
            html: htmlContent,
          });
          console.log(`[EmailService] ✅ Expiry notification sent to ${user.email} via SMTP. ID: ${info.messageId}`);
          return true;
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(`[EmailService] ❌ Failed to send email (attempt ${attempt}/${maxRetries}):`, lastError.message);

        if (error instanceof Error) {
          console.error(`[EmailService] Error details:`, error.stack);
        }

        // Wait before retry (exponential backoff)
        if (attempt < maxRetries) {
          const waitTime = Math.pow(2, attempt) * 1000;
          console.log(`[EmailService] ⏳ Waiting ${waitTime}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }

    console.error(`[EmailService] ❌ Failed to send email to ${user.email} after ${maxRetries} attempts. Last error:`, lastError?.message);
    return false;
  }

  private generateEmailContent(user: User, expiringItems: FoodItem[]) {
    const itemsList = expiringItems
      .map((item) => {
        const daysLeft = this.calculateDaysLeft(item.expiryDate);
        const statusText = daysLeft === 0 ? "expires today" : daysLeft === 1 ? "expires tomorrow" : `expires in ${daysLeft} days`;
        return `• ${item.name} (${item.category}) - ${statusText}`;
      })
      .join("\n");

    const subject = `⚠️ Food Expiry Alert: ${expiringItems.length} item${expiringItems.length > 1 ? "s" : ""} expiring soon`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #16a34a 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .alert-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .item-list { background: white; padding: 20px; margin: 20px 0; border-radius: 4px; border: 1px solid #e5e7eb; }
          .item { padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
          .item:last-child { border-bottom: none; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
          .button { display: inline-block; background: #16a34a; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🍎 Food Reminder</h1>
            <p>Food Expiry Alert</p>
          </div>
          <div class="content">
            <p>Hi ${user.username},</p>
            
            <div class="alert-box">
              <strong>⚠️ Important:</strong> You have ${expiringItems.length} food item${expiringItems.length > 1 ? "s" : ""} expiring soon!
            </div>

            <p>Here are the items that need your attention:</p>

            <div class="item-list">
              ${expiringItems.map((item) => {
      const daysLeft = this.calculateDaysLeft(item.expiryDate);
      const statusText = daysLeft === 0 ? "Expires today" : daysLeft === 1 ? "Expires tomorrow" : `Expires in ${daysLeft} days`;
      return `
                  <div class="item">
                    <strong>${item.name}</strong> (${item.category})<br>
                    <span style="color: #f59e0b;">⏰ ${statusText}</span>
                  </div>
                `;
    }).join("")}
            </div>

            <p>Please check your inventory and take necessary action to avoid food waste.</p>

            <center>
              <a href="${process.env.APP_URL || "http://localhost:5000"}/dashboard" class="button">View Dashboard</a>
            </center>

            <div class="footer">
              <p>This is an automated notification from Food Reminder.<br>
              Manage your notification settings in your profile.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
Food Reminder - Expiry Alert

Hi ${user.username},

You have ${expiringItems.length} food item${expiringItems.length > 1 ? "s" : ""} expiring soon:

${itemsList}

Please check your inventory and take necessary action to avoid food waste.

View your dashboard: ${process.env.APP_URL || "http://localhost:5000"}/dashboard

---
This is an automated notification from Food Reminder.
Manage your notification settings in your profile.
    `;

    return { subject, htmlContent, textContent };
  }

  private calculateDaysLeft(expiryDate: string): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDate);
    expiry.setHours(0, 0, 0, 0);
    return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }

  async testConnection(): Promise<boolean> {
    if (!this.isConfigured()) {
      return false;
    }

    try {
      if (this.config!.service === "resend" && this.resendClient) {
        // Resend doesn't have a verify method, so we'll just check if client exists
        console.log("[EmailService] ✅ Resend client ready");
        return true;
      } else if (this.transporter) {
        await this.transporter.verify();
        console.log("[EmailService] ✅ SMTP connection verified");
        return true;
      }
      return false;
    } catch (error) {
      console.error("[EmailService] ❌ Email service connection failed:", error);
      return false;
    }
  }
}

export const emailService = new EmailService();
