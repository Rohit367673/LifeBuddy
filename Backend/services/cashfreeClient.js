const { Cashfree } = require('cashfree-pg');
const axios = require('axios');

// Initialize Cashfree with proper authentication
const isProd = process.env.NODE_ENV === 'production';
const appId = process.env.CASHFREE_APP_ID || '';
const secretKey = process.env.CASHFREE_SECRET_KEY || '';
// Allow explicit mode override via env (CASHFREE_MODE=PRODUCTION|SANDBOX) — prefer CASHFREE_MODE if set
const envMode = String(process.env.CASHFREE_MODE || '').toUpperCase();
const resolvedMode = envMode ? (envMode === 'PRODUCTION' ? 'PRODUCTION' : 'SANDBOX') : (isProd ? 'PRODUCTION' : 'SANDBOX');
const apiVersion = process.env.CASHFREE_API_VERSION || '2022-09-01';

console.log(`[Cashfree] Resolved mode: ${resolvedMode}`);
console.log(`[Cashfree] App ID: ${appId ? appId.substring(0, 10) + '...' : 'NOT SET'}`);
console.log(`[Cashfree] Secret Key: ${secretKey ? 'SET (length: ' + secretKey.length + ')' : 'NOT SET'}`);

// Determine base URL explicitly to avoid SDK mode inconsistencies
function getBaseUrl() {
  const base = resolvedMode === 'PRODUCTION' ? 'https://api.cashfree.com' : 'https://sandbox.cashfree.com';
  console.log(`[Cashfree REST] Using base URL: ${base}`);
  return base;
}

// Create order function
const createOrder = async (orderData) => {
  try {
    if (!appId || !secretKey) {
      const err = new Error('Cashfree credentials missing');
      err.code = 'CF_NO_CREDENTIALS';
      throw err;
    }
    const base = getBaseUrl();
    const res = await axios.post(`${base}/pg/orders`, orderData, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-version': apiVersion,
        'x-client-id': appId,
        'x-client-secret': secretKey
      },
      timeout: 10000
    });
    return res.data;
  } catch (error) {
    console.error('Cashfree create order (client) error:', error);
    throw error;
  }
};

// Verify payment function
const verifyPayment = async (orderId) => {
  try {
    const base = getBaseUrl();
    const res = await axios.get(`${base}/pg/orders/${encodeURIComponent(orderId)}/payments`, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-version': apiVersion,
        'x-client-id': appId,
        'x-client-secret': secretKey
      },
      timeout: 10000
    });
    return res.data;
  } catch (error) {
    console.error('Cashfree verify payment (client) error:', error);
    throw error;
  }
};

// Get order status
const getOrderStatus = async (orderId) => {
  try {
    const base = getBaseUrl();
    const res = await axios.get(`${base}/pg/orders/${encodeURIComponent(orderId)}`, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-version': apiVersion,
        'x-client-id': appId,
        'x-client-secret': secretKey
      },
      timeout: 10000
    });
    return res.data;
  } catch (error) {
    console.error('Cashfree get order status (client) error:', error);
    throw error;
  }
};

module.exports = {
  createOrder,
  verifyPayment,
  getOrderStatus
};

