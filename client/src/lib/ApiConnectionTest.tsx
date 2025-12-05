import { useEffect, useState } from 'react';
import { API_BASE_URL } from './api';

/**
 * Development/Debug component to test API connectivity
 * Add this to your app temporarily to verify the connection
 */
export function ApiConnectionTest() {
  const [status, setStatus] = useState<{
    baseUrl: string;
    connected: boolean;
    error?: string;
    response?: any;
  }>({
    baseUrl: API_BASE_URL,
    connected: false,
  });

  useEffect(() => {
    const testConnection = async () => {
      try {
        const url = `${API_BASE_URL}/api/health`;
        console.log('[API Test] Testing connection to:', url);
        
        const response = await fetch(url, {
          method: 'GET',
          credentials: 'include',
        });
        
        console.log('[API Test] Response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('[API Test] Response data:', data);
          setStatus({
            baseUrl: API_BASE_URL,
            connected: true,
            response: data,
          });
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (error) {
        console.error('[API Test] Connection failed:', error);
        setStatus({
          baseUrl: API_BASE_URL,
          connected: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    };

    testConnection();
  }, []);

  // Only render in development or when there's an error
  if (import.meta.env.PROD && status.connected) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '10px',
      right: '10px',
      background: status.connected ? '#10b981' : '#ef4444',
      color: 'white',
      padding: '10px 15px',
      borderRadius: '8px',
      fontSize: '12px',
      zIndex: 9999,
      maxWidth: '300px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
        API Status: {status.connected ? '✓ Connected' : '✗ Disconnected'}
      </div>
      <div style={{ fontSize: '11px', opacity: 0.9 }}>
        URL: {status.baseUrl || '(empty - using relative URLs)'}
      </div>
      {status.error && (
        <div style={{ fontSize: '11px', marginTop: '5px', opacity: 0.9 }}>
          Error: {status.error}
        </div>
      )}
      {status.response && (
        <div style={{ fontSize: '11px', marginTop: '5px', opacity: 0.9 }}>
          Services: Email: {status.response.services?.email ? '✓' : '✗'}, 
          WhatsApp: {status.response.services?.whatsapp ? '✓' : '✗'}
        </div>
      )}
    </div>
  );
}
