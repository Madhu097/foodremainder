// MUST be first - load environment variables before anything else
import "./loadEnv";

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { emailService } from "./emailService";
import { whatsappService } from "./whatsappService";
import fs from "fs";
import path from "path";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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
let appInitialized = false;

function initializeServices() {
  if (servicesInitialized) return;
  servicesInitialized = true;
  
  log("Initializing notification services...");
  const emailInitialized = emailService.initialize();
  const whatsappInitialized = whatsappService.initialize();

  if (emailInitialized) {
    log("✓ Email notifications enabled");
  } else {
    log("⚠ Email notifications disabled (configure EMAIL_* environment variables)");
  }

  if (whatsappInitialized) {
    log("✓ WhatsApp notifications enabled");
  } else {
    log("⚠ WhatsApp notifications disabled (configure TWILIO_* environment variables)");
  }
}

async function setupApp() {
  if (appInitialized) return null;
  appInitialized = true;
  
  initializeServices();

  // Register API routes FIRST
  const server = await registerRoutes(app);

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  // Auto-detect development mode (NODE_ENV or check if dist folder exists)
  const isDevelopment = process.env.NODE_ENV !== "production" && !fs.existsSync(path.resolve(import.meta.dirname, "..", "dist", "public"));

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

  return server;
}

// Only start server if not in Vercel
if (!process.env.VERCEL) {
  setupApp().then((server) => {
    const port = parseInt(process.env.PORT || '5000', 10);
    server.listen(port, "0.0.0.0", () => {
      log(`serving on port ${port}`);
    });
  });
} else {
  // For Vercel, initialize app immediately
  setupApp();
}

// Export for Vercel serverless
export default app;
