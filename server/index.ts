// MUST be first - load environment variables before anything else
import "./loadEnv";

import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import compression from "compression";
import { registerRoutes } from "./routes";
import { log } from "./utils";
import { emailService } from "./emailService";
import { whatsappService } from "./whatsappService";
import { whatsappCloudService } from "./whatsappCloudService";
import { smsService } from "./smsService";
import { telegramService } from "./telegramService";
import { pushService } from "./pushService";
import { notificationScheduler } from "./notificationScheduler";
import fs from "fs";
import path from "path";

const app = express();

// CORS middleware - MUST be the very first middleware
app.use((req, res, next) => {
  const origin = req.headers.origin;

  // Allow all origins (since frontend is on Vercel and backend on Render)
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  } else {
    // For non-browser tools that might not send origin, we can default to *
    // but credentials require explicit origin.
    // We'll leave it empty if no origin, standard CORS behavior.
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end(); // Respond with 200 OK for preflight
  }

  next();
});

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

log("✅ API Services initializing...");

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

// Global error handlers to catch issues during initialization
process.on('unhandledRejection', (reason, promise) => {
  console.error('[System] ❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[System] ❌ Uncaught Exception:', err);
  // On Vercel, we can't really do much here, but logging helps debug
});

// Initialize services immediately (only once)
let servicesInitialized = false;

function initializeServices() {
  if (servicesInitialized) return;
  servicesInitialized = true;

  // On Vercel, we don't want to start background schedulers as they aren't supported
  const isVercel = process.env.VERCEL === "1";

  log(`Initializing services (Vercel: ${isVercel})...`);

  const emailInitialized = emailService.initialize();
  const whatsappInitialized = whatsappService.initialize();
  const whatsappCloudInitialized = whatsappCloudService.initialize();
  const smsInitialized = smsService.initialize();
  const telegramInitialized = telegramService.initialize();
  const pushInitialized = pushService.initialize();

  // Start the notification scheduler ONLY if not on Vercel
  if (!isVercel) {
    const autoSchedule = process.env.NOTIFICATION_AUTO_SCHEDULE !== "false";
    if (autoSchedule && (emailInitialized || whatsappInitialized || smsInitialized || telegramInitialized || pushInitialized)) {
      try {
        notificationScheduler.start();
        log("✓ Notification scheduler started");
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        log(`⚠ Failed to start notification scheduler: ${errorMessage}`);
      }
    }
  } else {
    log("ℹ Notification scheduler disabled (running on Vercel)");
  }
}

// Register API routes immediately
// This is critical for Vercel to ensure routes are available before any request
const routesPromise = (async () => {
  try {
    initializeServices();
    await registerRoutes(app);

    const isProduction = process.env.NODE_ENV === "production";
    const isVercel = process.env.VERCEL === "1";

    if (isProduction && !isVercel) {
      const { serveStatic } = await import("./static");
      serveStatic(app);
    }

    // Final generic Error handler
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      console.error(`[Error] ${status}: ${message}`, err);
      res.status(status).json({ message });
    });

    log("✅ API Initialization complete");
  } catch (error) {
    console.error("❌ Failed to initialize API routes:", error);
  }
})();

// Middleware to ensure routes are registered before handling any request
// This solves the race condition on Vercel cold starts
app.use(async (req, res, next) => {
  await routesPromise;
  next();
});

// Start the server (local only)
if (process.env.VERCEL !== "1") {
  (async () => {
    try {
      // Wait for routes to be registered before listening
      await routesPromise;
      const server = createServer(app);
      const port = parseInt(process.env.PORT || '5000', 10);
      server.listen(port, "0.0.0.0", () => {
        log(`serving on port ${port}`);
      });
    } catch (error) {
      console.error("[System] ❌ Failed to start server:", error);
    }
  })();
}

// Export for serverless environments
export default app;

