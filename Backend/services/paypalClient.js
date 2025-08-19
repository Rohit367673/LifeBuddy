const paypal = require('@paypal/checkout-server-sdk');

function environment() {
  const clientId = process.env.PAYPAL_CLIENT_ID || '';
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET || '';
  const env = (process.env.PAYPAL_ENVIRONMENT || 'sandbox').toLowerCase();
  if (!clientId || !clientSecret) {
    console.warn('[PayPal] Missing PAYPAL_CLIENT_ID or PAYPAL_CLIENT_SECRET');
  }
  return env === 'live'
    ? new paypal.core.LiveEnvironment(clientId, clientSecret)
    : new paypal.core.SandboxEnvironment(clientId, clientSecret);
}

function client() {
  return new paypal.core.PayPalHttpClient(environment());
}

module.exports = { client };
