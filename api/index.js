// Vercel serverless function entry point
// This file proxies requests to the main Express app built from server/index.ts

import app from '../dist/index.js';

export default app;
