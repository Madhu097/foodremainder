import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
    const distPath = path.resolve(import.meta.dirname, "public");

    if (!fs.existsSync(distPath)) {
        throw new Error(
            `Could not find the build directory: ${distPath}, make sure to build the client first`,
        );
    }

    // Serve static files from the dist/public directory
    app.use(express.static(distPath));

    // SPA fallback - serve index.html for all non-API routes
    // This ensures that client-side routing works on page refresh
    app.use("*", (req, res) => {
        // Skip API routes
        if (req.originalUrl.startsWith("/api")) {
            return res.status(404).json({ message: "API endpoint not found" });
        }

        // Serve index.html for all other routes (SPA routing)
        res.sendFile(path.resolve(distPath, "index.html"));
    });
}
