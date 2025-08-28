// Currency conversion utility for plan pricing
const EXCHANGE_RATES = {
  USD: 1.0,
  INR: 83.0,
  EUR: 0.92,
  GBP: 0.79,
  CAD: 1.35,
  AUD: 1.52
};

const REGIONAL_PRICING = {
  // Base prices in USD
  USD: {
    monthly: 1.99,
    yearly: 21.99
  },
  // Adjusted prices for different regions
  INR: {
    monthly: 149,  // ~$1.79 equivalent
    yearly: 1599   // ~$19.27 equivalent
  },
  EUR: {
    monthly: 1.89,
    yearly: 20.99
  },
  GBP: {
    monthly: 1.69,
    yearly: 18.99
  },
  CAD: {
    monthly: 2.49,
    yearly: 27.99
  },
  AUD: {
    monthly: 2.99,
    yearly: 32.99
  }
};

/**
 * Get plan pricing based on currency/region
 * @param {string} plan - 'monthly' or 'yearly'
 * @param {string} currency - Currency code (USD, INR, EUR, etc.)
 * @returns {number} Price in the specified currency
 */
function getPlanPrice(plan, currency = 'USD') {
  if (!['monthly', 'yearly'].includes(plan)) {
    throw new Error('Invalid plan type');
  }
  
  const currencyUpper = currency.toUpperCase();
  
  // Use regional pricing if available
  if (REGIONAL_PRICING[currencyUpper]) {
    return REGIONAL_PRICING[currencyUpper][plan];
  }
  
  // Fallback to USD conversion
  const usdPrice = REGIONAL_PRICING.USD[plan];
  const exchangeRate = EXCHANGE_RATES[currencyUpper] || 1.0;
  
  return Math.round((usdPrice * exchangeRate) * 100) / 100; // Round to 2 decimal places
}

/**
 * Detect currency based on user location/region
 * @param {string} countryCode - ISO country code
 * @returns {string} Currency code
 */
function getCurrencyByCountry(countryCode) {
  const countryToCurrency = {
    'US': 'USD',
    'IN': 'INR',
    'GB': 'GBP',
    'CA': 'CAD',
    'AU': 'AUD',
    'DE': 'EUR',
    'FR': 'EUR',
    'IT': 'EUR',
    'ES': 'EUR',
    'NL': 'EUR',
    'BE': 'EUR',
    'AT': 'EUR',
    'PT': 'EUR',
    'IE': 'EUR',
    'FI': 'EUR',
    'GR': 'EUR'
  };
  
  return countryToCurrency[countryCode?.toUpperCase()] || 'USD';
}

/**
 * Get supported currencies list
 * @returns {Array} Array of supported currency codes
 */
function getSupportedCurrencies() {
  return Object.keys(REGIONAL_PRICING);
}

/**
 * Convert amount from one currency to another
 * @param {number} amount - Amount to convert
 * @param {string} fromCurrency - Source currency
 * @param {string} toCurrency - Target currency
 * @returns {number} Converted amount
 */
function convertCurrency(amount, fromCurrency, toCurrency) {
  const fromRate = EXCHANGE_RATES[fromCurrency.toUpperCase()] || 1.0;
  const toRate = EXCHANGE_RATES[toCurrency.toUpperCase()] || 1.0;
  
  const usdAmount = amount / fromRate;
  const convertedAmount = usdAmount * toRate;
  
  return Math.round(convertedAmount * 100) / 100;
}

module.exports = {
  getPlanPrice,
  getCurrencyByCountry,
  getSupportedCurrencies,
  convertCurrency,
  REGIONAL_PRICING,
  EXCHANGE_RATES
};
