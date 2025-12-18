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

  // If running locally (localhost), always use relative URL to avoid CORS/Render issues
  if (isLocalhost) {
    console.log('[API Config] Localhost detected, forcing relative URL');
    console.log('[API Config] ========================================');
    console.log('[API Config] Final API_BASE_URL:', '');
    console.log('[API Config] ========================================');
    return '';
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
