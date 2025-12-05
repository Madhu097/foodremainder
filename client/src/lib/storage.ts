/**
 * Safe localStorage wrapper that handles SSR and restricted contexts
 */

// Check if localStorage is actually accessible
function isStorageAvailable(): boolean {
  try {
    if (typeof window === 'undefined') return false;
    if (typeof window.localStorage === 'undefined') return false;
    
    // Try to actually use it (some browsers block it even when it exists)
    const testKey = '__storage_test__';
    window.localStorage.setItem(testKey, 'test');
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

export const safeLocalStorage = {
  getItem(key: string): string | null {
    if (!isStorageAvailable()) return null;
    
    try {
      return window.localStorage.getItem(key);
    } catch (error) {
      // Silently fail - no need to warn as this is expected in some contexts
      return null;
    }
  },

  setItem(key: string, value: string): boolean {
    if (!isStorageAvailable()) return false;
    
    try {
      window.localStorage.setItem(key, value);
      return true;
    } catch (error) {
      // Silently fail
      return false;
    }
  },

  removeItem(key: string): boolean {
    if (!isStorageAvailable()) return false;
    
    try {
      window.localStorage.removeItem(key);
      return true;
    } catch (error) {
      // Silently fail
      return false;
    }
  },

  clear(): boolean {
    if (!isStorageAvailable()) return false;
    
    try {
      window.localStorage.clear();
      return true;
    } catch (error) {
      // Silently fail
      return false;
    }
  },
};
  }
};
