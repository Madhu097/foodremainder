// MUST be first - load environment variables before anything else
import "./loadEnv";

import express, { type Request, Response, NextFunction } from "express";
import compression from "compression";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { emailService } from "./emailService";
import { whatsappService } from "./whatsappService";
import { smsService } from "./smsService";
import { telegramService } from "./telegramService";
import { pushService } from "./pushService";
import { notificationScheduler } from "./notificationScheduler";
import fs from "fs";
import path from "path";

const app = express();

// Enable compression for all responses (must be early in middleware chain)
app.use(compression({
  // Compress all responses over 1kb
  threshold: 1024,
  // Compression level (0-9, 6 is default, good balance of speed/compression)
  level: 6,
  // Filter function to determine what to compress
  filter: (req, res) => {
    // Don't compress if client doesn't support it
    if (req.headers['x-no-compression']) {
      return false;
    }
    // Use compression's default filter
    return compression.filter(req, res);
  }
}));

log("✅ Response compression enabled (gzip/deflate)");

// CORS middleware - must be before other middleware
app.use((req, res, next) => {
  const origin = req.headers.origin;

  // Allow all localhost origins for development
  const isLocalhost = origin && (origin.includes('localhost') || origin.includes('127.0.0.1'));

  // Allow Vercel deployments
  const isVercel = origin && origin.endsWith('.vercel.app');

  // Allow specific production domains
  const allowedDomains = [
    'https://foodremainder.vercel.app',
  ];
  const isAllowedDomain = origin && allowedDomains.includes(origin);

  if (isLocalhost || isVercel || isAllowedDomain) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  next();
});

// Increase body size limits for base64 image uploads
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

app.use((req, res, next) => {
  const start = Date.now();
  const reqPath = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (reqPath.startsWith("/api")) {
      let logLine = `${req.method} ${reqPath} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Initialize services immediately (only once)
let servicesInitialized = false;

function initializeServices() {
  if (servicesInitialized) return;
  servicesInitialized = true;

  log("Initializing notification services...");
  const emailInitialized = emailService.initialize();
  const whatsappInitialized = whatsappService.initialize();
  const smsInitialized = smsService.initialize();
  const telegramInitialized = telegramService.initialize();
  const pushInitialized = pushService.initialize();

  if (emailInitialized) {
    log("✓ Email notifications enabled");
  } else {
    log("⚠ Email notifications disabled (configure EMAIL_* or RESEND_API_KEY environment variables)");
  }

  if (whatsappInitialized) {
    log("✓ WhatsApp notifications enabled");
  } else {
    log("⚠ WhatsApp notifications disabled (configure TWILIO_* environment variables)");
  }

  if (smsInitialized) {
    log("✓ SMS notifications enabled");
  } else {
    log("⚠ SMS notifications disabled (configure TWILIO_* environment variables)");
  }

  if (telegramInitialized) {
    log("✓ Telegram notifications enabled");
  } else {
    log("⚠ Telegram notifications disabled (configure TELEGRAM_BOT_TOKEN environment variable)");
  }

  if (pushInitialized) {
    log("✓ Push notifications enabled");
  } else {
    log("⚠ Push notifications disabled (configure VAPID_KEYs)");
  }

  // Start the notification scheduler
  const autoSchedule = process.env.NOTIFICATION_AUTO_SCHEDULE !== "false"; // Default: enabled
  if (autoSchedule && (emailInitialized || whatsappInitialized || smsInitialized || telegramInitialized || pushInitialized)) {
    try {
      notificationScheduler.start();
      log("✓ Notification scheduler started");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      log(`⚠ Failed to start notification scheduler: ${errorMessage}`);
    }
  } else if (!autoSchedule) {
    log("ℹ Automatic notification scheduling disabled (set NOTIFICATION_AUTO_SCHEDULE=true to enable)");
  }
}

// Main application startup
(async () => {
  initializeServices();

  // Register API routes FIRST
  const server = await registerRoutes(app);

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  // Auto-detect development mode (NODE_ENV or check if dist folder exists)
  // Modified to prioritize npm dev script
  const isDevelopment = process.env.NODE_ENV !== "production" &&
    (process.env["npm_lifecycle_event"] === "dev" || !fs.existsSync(path.resolve(import.meta.dirname, "..", "dist", "public")));

  if (isDevelopment) {
    log("Running in DEVELOPMENT mode with Vite");
    await setupVite(app, server);
  } else {
    log("Running in PRODUCTION mode");
    serveStatic(app);
  }

  // Error handler should be AFTER all routes
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Start the server
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
  });
})();

// Export for serverless environments
export default app;
