/**
 * API configuration and helper functions
 */

// Get the API base URL based on environment
export const getApiBaseUrl = (): string => {
  const isLocalhost = typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  console.log('[API Config] ========================================');
  console.log('[API Config] Hostname:', typeof window !== 'undefined' ? window.location.hostname : 'N/A');
  console.log('[API Config] Is Localhost:', isLocalhost);
  console.log('[API Config] VITE_API_URL:', import.meta.env.VITE_API_URL);
  console.log('[API Config] import.meta.env.PROD:', import.meta.env.PROD);

  // Force Render URL for production deployments (Vercel)
  if (import.meta.env.PROD && !isLocalhost) {
    console.log('[API Config] Production detected (Vercel), using Render Backend');
    return 'https://foodremainder.onrender.com';
  }

  // If running locally (dev or prod build), connect to local backend
  if (isLocalhost) {
    if (import.meta.env.PROD) return 'http://localhost:5000';
    return ''; // Proxy handles it in dev
  }

  return '';
};

export const API_BASE_URL = getApiBaseUrl();
