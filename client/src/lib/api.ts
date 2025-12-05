/**
 * API configuration and helper functions
 */

// Get the API base URL based on environment
export const getApiBaseUrl = (): string => {
  // Check for Vite environment variable
  const apiUrl = import.meta.env.VITE_API_URL;
  
  // Log for debugging
  console.log('[API Config] Environment:', import.meta.env.MODE);
  console.log('[API Config] VITE_API_URL:', apiUrl);
  
  // In production, use the configured API URL
  if (apiUrl && apiUrl.trim() !== '') {
    console.log('[API Config] Using API URL:', apiUrl);
    return apiUrl;
  }
  
  // Fallback: If we're in production but no env var, use default Render URL
  if (import.meta.env.PROD) {
    const defaultUrl = 'https://foodremainder.onrender.com';
    console.log('[API Config] Using fallback URL:', defaultUrl);
    return defaultUrl;
  }
  
  // Default to empty string for relative URLs in development
  console.log('[API Config] Using relative URLs (development)');
  return '';
};

export const API_BASE_URL = getApiBaseUrl();

// Log the final URL being used
console.log('[API Config] Final API_BASE_URL:', API_BASE_URL);
