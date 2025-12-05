/**
 * Safe localStorage wrapper that handles SSR and restricted contexts
 */

export const safeLocalStorage = {
  getItem(key: string): string | null {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return localStorage.getItem(key);
      }
    } catch (error) {
      console.warn(`Failed to get item from localStorage (${key}):`, error);
    }
    return null;
  },

  setItem(key: string, value: string): boolean {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(key, value);
        return true;
      }
    } catch (error) {
      console.warn(`Failed to set item in localStorage (${key}):`, error);
    }
    return false;
  },

  removeItem(key: string): boolean {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem(key);
        return true;
      }
    } catch (error) {
      console.warn(`Failed to remove item from localStorage (${key}):`, error);
    }
    return false;
  },

  clear(): boolean {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.clear();
        return true;
      }
    } catch (error) {
      console.warn('Failed to clear localStorage:', error);
    }
    return false;
  }
};
