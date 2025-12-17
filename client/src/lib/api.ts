/**
 * API configuration and helper functions
 */

// Get the API base URL based on environment
export const getApiBaseUrl = (): string => {
  // If running locally (localhost), always use relative URL to avoid CORS/Render issues
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return '';
  }

  // Check for Vite environment variable
  const apiUrl = import.meta.env.VITE_API_URL;

  // In production, use the configured API URL
  if (apiUrl && apiUrl.trim() !== '') {
    return apiUrl.trim();
  }

  // Fallback: If we're in production but no env var, use default Render URL
  if (import.meta.env.PROD) {
    return 'https://foodremainder.onrender.com';
  }

  // Default to empty string for relative URLs in development
  return '';
};

export const API_BASE_URL = getApiBaseUrl();
