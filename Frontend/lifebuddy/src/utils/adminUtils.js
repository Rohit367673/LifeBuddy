/**
 * Admin utilities for LifeBuddy
 * Handles admin access control and permissions
 */

// Admin email addresses
const ADMIN_EMAILS = [
  'rohit367673@gmail.com'
];

/**
 * Check if a user is an admin based on their email
 * @param {Object} user - User object with email property
 * @returns {boolean} - True if user is admin, false otherwise
 */
export const isAdmin = (user) => {
  if (!user || !user.email) {
    return false;
  }
  
  return ADMIN_EMAILS.includes(user.email.toLowerCase());
};

/**
 * Check if a user has premium access (either through subscription or admin status)
 * @param {Object} user - User object
 * @param {boolean} isPremium - Current premium status from subscription
 * @returns {boolean} - True if user has premium access, false otherwise
 */
export const hasPremiumAccess = (user, isPremium) => {
  return isPremium || isAdmin(user);
};

/**
 * Check if a user can access a specific premium feature
 * @param {Object} user - User object
 * @param {boolean} isPremium - Current premium status from subscription
 * @param {string} feature - Feature name to check access for
 * @returns {boolean} - True if user can access the feature, false otherwise
 */
export const canAccessPremiumFeature = (user, isPremium, feature) => {
  // Admin has access to all features
  if (isAdmin(user)) {
    return true;
  }
  
  // Premium users have access to premium features
  if (isPremium) {
    return true;
  }
  
  return false;
};

/**
 * Get user access level
 * @param {Object} user - User object
 * @param {boolean} isPremium - Current premium status from subscription
 * @returns {string} - Access level: 'admin', 'premium', or 'free'
 */
export const getUserAccessLevel = (user, isPremium) => {
  if (isAdmin(user)) {
    return 'admin';
  }
  
  if (isPremium) {
    return 'premium';
  }
  
  return 'free';
};
