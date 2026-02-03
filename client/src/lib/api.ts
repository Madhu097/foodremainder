/**
 * API configuration and helper functions
 */

// Get the API base URL based on environment
export const getApiBaseUrl = (): string => {
  // Simple, robust check for environment
  if (typeof window === 'undefined') return '';

  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  if (isLocalhost) {
    // If running "npm run build" & "npm run start" locally, we want full URL
    // If running "npm run dev", we use relative URL (proxy)
    return import.meta.env.PROD ? 'http://localhost:5000' : '';
  }

  // If not localhost, we are in production (Vercel).
  // Use relative URL to let Vercel handle routing to serverless functions
  return '';
};

export const API_BASE_URL = getApiBaseUrl();
