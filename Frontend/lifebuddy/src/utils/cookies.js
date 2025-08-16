/**
 * Professional cookie management utility for secure token storage
 */

// Cookie configuration for security
const COOKIE_CONFIG = {
  secure: window.location.protocol === 'https:', // Only send over HTTPS in production
  sameSite: 'strict', // CSRF protection
  path: '/', // Available across entire app
  domain: window.location.hostname === 'localhost' ? undefined : window.location.hostname
};

/**
 * Set a secure cookie with proper security attributes
 */
export const setCookie = (name, value, options = {}) => {
  const config = { ...COOKIE_CONFIG, ...options };
  
  let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;
  
  if (config.maxAge) {
    cookieString += `; Max-Age=${config.maxAge}`;
  }
  
  if (config.expires) {
    cookieString += `; Expires=${config.expires.toUTCString()}`;
  }
  
  if (config.path) {
    cookieString += `; Path=${config.path}`;
  }
  
  if (config.domain) {
    cookieString += `; Domain=${config.domain}`;
  }
  
  if (config.secure) {
    cookieString += '; Secure';
  }
  
  if (config.sameSite) {
    cookieString += `; SameSite=${config.sameSite}`;
  }
  
  if (config.httpOnly) {
    // Note: HttpOnly cannot be set from JavaScript for security reasons
    // This would need to be set by the server
    console.warn('HttpOnly flag cannot be set from client-side JavaScript');
  }
  
  document.cookie = cookieString;
  console.log(`🍪 Cookie set: ${name}`);
};

/**
 * Get cookie value by name
 */
export const getCookie = (name) => {
  const encodedName = encodeURIComponent(name);
  const cookies = document.cookie.split(';');
  
  for (let cookie of cookies) {
    const [cookieName, cookieValue] = cookie.trim().split('=');
    if (cookieName === encodedName) {
      return decodeURIComponent(cookieValue);
    }
  }
  
  return null;
};

/**
 * Remove cookie by setting expiration to past date
 */
export const removeCookie = (name, options = {}) => {
  const config = { ...COOKIE_CONFIG, ...options };
  
  let cookieString = `${encodeURIComponent(name)}=; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  
  if (config.path) {
    cookieString += `; Path=${config.path}`;
  }
  
  if (config.domain) {
    cookieString += `; Domain=${config.domain}`;
  }
  
  document.cookie = cookieString;
  console.log(`🗑️ Cookie removed: ${name}`);
};

/**
 * Set authentication token with security best practices
 */
export const setAuthToken = (token) => {
  const expirationTime = new Date();
  expirationTime.setDate(expirationTime.getDate() + 7); // 7 days expiration
  
  setCookie('auth_token', token, {
    expires: expirationTime,
    secure: true, // Force secure in production
    sameSite: 'strict',
    // httpOnly: true, // Would be ideal but needs server-side implementation
  });
};

/**
 * Get authentication token
 */
export const getAuthToken = () => {
  return getCookie('auth_token');
};

/**
 * Remove authentication token
 */
export const removeAuthToken = () => {
  removeCookie('auth_token');
};

/**
 * Set user data (non-sensitive information)
 */
export const setUserData = (userData) => {
  const expirationTime = new Date();
  expirationTime.setDate(expirationTime.getDate() + 7);
  
  setCookie('user_data', JSON.stringify(userData), {
    expires: expirationTime,
    secure: true,
    sameSite: 'strict'
  });
};

/**
 * Get user data
 */
export const getUserData = () => {
  const userData = getCookie('user_data');
  try {
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Error parsing user data from cookie:', error);
    removeUserData(); // Clean up corrupted data
    return null;
  }
};

/**
 * Remove user data
 */
export const removeUserData = () => {
  removeCookie('user_data');
};

/**
 * Clear all authentication-related cookies
 */
export const clearAuthCookies = () => {
  removeAuthToken();
  removeUserData();
  console.log('🧹 All auth cookies cleared');
};

/**
 * Check if cookies are enabled in the browser
 */
export const areCookiesEnabled = () => {
  try {
    setCookie('test_cookie', 'test', { maxAge: 1 });
    const testValue = getCookie('test_cookie');
    removeCookie('test_cookie');
    return testValue === 'test';
  } catch (error) {
    return false;
  }
};

export default {
  setCookie,
  getCookie,
  removeCookie,
  setAuthToken,
  getAuthToken,
  removeAuthToken,
  setUserData,
  getUserData,
  removeUserData,
  clearAuthCookies,
  areCookiesEnabled
};
