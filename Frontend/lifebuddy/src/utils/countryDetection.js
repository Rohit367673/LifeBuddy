// Country detection utility for automatic currency conversion
let cachedCountry = null;
let detectionPromise = null;

/**
 * Detect user's country using multiple methods
 * @returns {Promise<string>} ISO country code (e.g., 'US', 'IN')
 */
export async function detectUserCountry() {
  // Return cached result if available
  if (cachedCountry) {
    return cachedCountry;
  }

  // Return existing promise if detection is in progress
  if (detectionPromise) {
    return detectionPromise;
  }

  detectionPromise = (async () => {
    try {
      // Method 1: Try timezone-based detection first (fastest)
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const timezoneToCountry = {
        'Asia/Kolkata': 'IN',
        'Asia/Calcutta': 'IN',
        'America/New_York': 'US',
        'America/Chicago': 'US',
        'America/Denver': 'US',
        'America/Los_Angeles': 'US',
        'Europe/London': 'GB',
        'Europe/Paris': 'FR',
        'Europe/Berlin': 'DE',
        'Europe/Rome': 'IT',
        'Europe/Madrid': 'ES',
        'Europe/Amsterdam': 'NL',
        'Australia/Sydney': 'AU',
        'Australia/Melbourne': 'AU',
        'America/Toronto': 'CA',
        'America/Vancouver': 'CA'
      };

      if (timezoneToCountry[timezone]) {
        cachedCountry = timezoneToCountry[timezone];
        console.log('[CountryDetection] Detected from timezone:', cachedCountry);
        return cachedCountry;
      }

      // Method 2: Try IP-based geolocation API
      try {
        const response = await fetch('https://ipapi.co/json/', {
          timeout: 3000
        });
        if (response.ok) {
          const data = await response.json();
          if (data.country_code) {
            cachedCountry = data.country_code.toUpperCase();
            console.log('[CountryDetection] Detected from IP API:', cachedCountry);
            return cachedCountry;
          }
        }
      } catch (ipError) {
        console.warn('[CountryDetection] IP API failed:', ipError.message);
      }

      // Method 3: Try alternative IP service
      try {
        const response = await fetch('https://api.country.is/', {
          timeout: 3000
        });
        if (response.ok) {
          const data = await response.json();
          if (data.country) {
            cachedCountry = data.country.toUpperCase();
            console.log('[CountryDetection] Detected from country.is:', cachedCountry);
            return cachedCountry;
          }
        }
      } catch (altError) {
        console.warn('[CountryDetection] Alternative API failed:', altError.message);
      }

      // Method 4: Browser language fallback
      const language = navigator.language || navigator.userLanguage;
      const languageToCountry = {
        'en-US': 'US',
        'en-GB': 'GB',
        'en-CA': 'CA',
        'en-AU': 'AU',
        'hi-IN': 'IN',
        'en-IN': 'IN',
        'fr-FR': 'FR',
        'de-DE': 'DE',
        'es-ES': 'ES',
        'it-IT': 'IT',
        'nl-NL': 'NL'
      };

      if (languageToCountry[language]) {
        cachedCountry = languageToCountry[language];
        console.log('[CountryDetection] Detected from language:', cachedCountry);
        return cachedCountry;
      }

      // Default fallback
      cachedCountry = 'US';
      console.log('[CountryDetection] Using default fallback:', cachedCountry);
      return cachedCountry;

    } catch (error) {
      console.error('[CountryDetection] Detection failed:', error);
      cachedCountry = 'US';
      return cachedCountry;
    }
  })();

  return detectionPromise;
}

/**
 * Get cached country or return default
 * @returns {string} ISO country code
 */
export function getCachedCountry() {
  return cachedCountry || 'US';
}

/**
 * Clear cached country (useful for testing)
 */
export function clearCountryCache() {
  cachedCountry = null;
  detectionPromise = null;
}

/**
 * Get currency symbol for display
 * @param {string} currency - Currency code
 * @returns {string} Currency symbol
 */
export function getCurrencySymbol(currency) {
  const symbols = {
    USD: '$',
    INR: '₹',
    EUR: '€',
    GBP: '£',
    CAD: 'C$',
    AUD: 'A$'
  };
  return symbols[currency] || currency;
}
