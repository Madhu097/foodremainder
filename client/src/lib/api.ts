/**
 * API configuration and helper functions
 */

// Get the API base URL based on environment
export const getApiBaseUrl = (): string => {
  // In production (Vercel), use the configured API URL
  // In development, use relative URLs (proxy to local server)
  const apiUrl = import.meta.env.VITE_API_URL;
  
  if (apiUrl) {
    return apiUrl;
  }
  
  // Default to empty string for relative URLs in development
  return '';
};

export const API_BASE_URL = getApiBaseUrl();
