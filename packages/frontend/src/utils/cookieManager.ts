// Cookie management utility functions

// Cookie storage key
const COOKIE_STORAGE_KEY = 'xhs_cookie';

/**
 * Get the stored cookie from localStorage
 */
export const getCookie = (): string => {
  return localStorage.getItem(COOKIE_STORAGE_KEY) || '';
};

/**
 * Save cookie to localStorage
 */
export const setCookie = (cookie: string): void => {
  localStorage.setItem(COOKIE_STORAGE_KEY, cookie);
};

/**
 * Clear stored cookie
 */
export const clearCookie = (): void => {
  localStorage.removeItem(COOKIE_STORAGE_KEY);
};