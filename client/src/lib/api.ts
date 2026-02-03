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

  // If running locally in development mode, use relative URL
  if (isLocalhost && !import.meta.env.PROD) {
    console.log('[API Config] Localhost detected (dev mode), using relative URL');
    console.log('[API Config] ========================================');
    console.log('[API Config] Final API_BASE_URL:', '');
    console.log('[API Config] ========================================');
    return '';
  }

  // If running production build on localhost, connect to local backend
  if (isLocalhost && import.meta.env.PROD) {
    console.log('[API Config] Localhost detected (prod build), connecting to local backend');
    console.log('[API Config] ========================================');
    console.log('[API Config] Final API_BASE_URL:', 'http://localhost:5000');
    console.log('[API Config] ========================================');
    return 'http://localhost:5000';
  }

  // Check for Vite environment variable
  const apiUrl = import.meta.env.VITE_API_URL;

  // In production, use the configured API URL
  if (apiUrl && apiUrl.trim() !== '') {
    console.log('[API Config] Using VITE_API_URL');
    console.log('[API Config] ========================================');
    console.log('[API Config] Final API_BASE_URL:', apiUrl.trim());
    console.log('[API Config] ========================================');
    return apiUrl.trim();
  }

  // Fallback: If we're in production but no env var, use default Render URL
  if (import.meta.env.PROD) {
    console.log('[API Config] Using default Render URL');
    console.log('[API Config] ========================================');
    // For Vercel production, we want to force using the environment variable
    // But since the user is struggling to configure it, we will fallback to the
    // known Render backend URL to ensure it works out of the box.
    console.log('[API Config] No VITE_API_URL set, defaulting to Render Backend URL');
    console.log('[API Config] ========================================');
    console.log('[API Config] Final API_BASE_URL:', 'https://foodremainder.onrender.com');
    console.log('[API Config] ========================================');
    return 'https://foodremainder.onrender.com';
  }

  // Default to empty string for relative URLs in development
  console.log('[API Config] Using relative URL (development)');
  console.log('[API Config] ========================================');
  console.log('[API Config] Final API_BASE_URL:', '');
  console.log('[API Config] ========================================');
  return '';
};

export const API_BASE_URL = getApiBaseUrl();
