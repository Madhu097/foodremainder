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
    console.error('[dotenv] ❌ Error loading .env:', result.error);
} else {
    console.log('[dotenv] ✅ Loaded .env file from:', envPath);
}
