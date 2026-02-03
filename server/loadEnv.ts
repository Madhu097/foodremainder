// Load environment variables FIRST before any other imports
import dotenv from "dotenv";
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = resolve(__dirname, '../.env');

// Load .env file
const result = dotenv.config({ path: envPath });

if (result.error) {
    // In production, it's normal for .env to be missing (env vars injected)
    const isProduction = process.env.NODE_ENV === 'production';
    if (!isProduction || (result.error as any).code !== 'ENOENT') {
        console.warn('[dotenv] ⚠️  Note: .env file not loaded:', (result.error as any).message);
    }
} else {
    console.log('[dotenv] ✅ Loaded .env file from:', envPath);
}
