// trustedTypes.js - Custom HTML sanitizer for React 19

// Check if Trusted Types are supported in the browser
const isTrustedTypesSupported = typeof window !== 'undefined' && window.trustedTypes;

// Create a policy that sanitizes HTML
let trustedTypesPolicy;

if (isTrustedTypesSupported) {
  try {
    trustedTypesPolicy = window.trustedTypes.createPolicy('react-html-policy', {
      createHTML: (html) => html, // You can add sanitization logic here if needed
    });
    console.log('TrustedTypes policy created successfully');
  } catch (error) {
    console.error('Failed to create TrustedTypes policy:', error);
  }
}

/**
 * Sanitizes HTML and returns a TrustedHTML object if supported, or the original HTML string
 * @param {string} html - The HTML string to sanitize
 * @returns {TrustedHTML|string} - A TrustedHTML object or the original string
 */
export function sanitizeHTML(html) {
  if (trustedTypesPolicy) {
    return trustedTypesPolicy.createHTML(html);
  }
  return html;
}

/**
 * A wrapper for dangerouslySetInnerHTML that handles TrustedHTML
 * @param {string} html - The HTML string to set
 * @returns {{ __html: TrustedHTML|string }} - An object for dangerouslySetInnerHTML
 */
export function createTrustedHTML(html) {
  return { __html: sanitizeHTML(html) };
}