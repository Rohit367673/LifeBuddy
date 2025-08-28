const paypal = require('@paypal/checkout-server-sdk');

const environment = () => {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  
  // Always check NODE_ENV for production vs sandbox
  const isProduction = process.env.NODE_ENV === 'production';
  
  console.log(`[PayPal] Environment: ${isProduction ? 'LIVE' : 'SANDBOX'}`);
  console.log(`[PayPal] Client ID: ${clientId ? clientId.substring(0, 10) + '...' : 'NOT SET'}`);
  
  if (!clientId || !clientSecret) {
    console.warn('[PayPal] Missing PAYPAL_CLIENT_ID or PAYPAL_CLIENT_SECRET');
  }
  return isProduction
    ? new paypal.core.LiveEnvironment(clientId, clientSecret)
    : new paypal.core.SandboxEnvironment(clientId, clientSecret);
};

function client() {
  return new paypal.core.PayPalHttpClient(environment());
}

module.exports = { client };
