const { Cashfree } = require('cashfree-pg');

// Initialize Cashfree with proper authentication
const isProd = process.env.NODE_ENV === 'production';
const appId = process.env.CASHFREE_APP_ID || '';
const secretKey = process.env.CASHFREE_SECRET_KEY || '';
// Allow explicit mode override via env (CASHFREE_MODE=PRODUCTION|SANDBOX)
const envMode = String(process.env.CASHFREE_MODE || '').toUpperCase();
const resolvedMode = envMode === 'PRODUCTION' ? 'PRODUCTION' : (isProd ? 'PRODUCTION' : 'SANDBOX');

console.log(`[Cashfree] Resolved mode: ${resolvedMode}`);
console.log(`[Cashfree] App ID: ${appId ? appId.substring(0, 10) + '...' : 'NOT SET'}`);
console.log(`[Cashfree] Secret Key: ${secretKey ? 'SET (length: ' + secretKey.length + ')' : 'NOT SET'}`);

// Create a singleton Cashfree client instance (no global static mutation)
let clientInstance = null;
function getClient() {
  if (!clientInstance) {
    clientInstance = new Cashfree({
      mode: resolvedMode,
      appId: appId,
      secretKey: secretKey
    });
  }
  return clientInstance;
}

// Create order function
const createOrder = async (orderData) => {
  try {
    if (!appId || !secretKey) {
      const err = new Error('Cashfree credentials missing');
      err.code = 'CF_NO_CREDENTIALS';
      throw err;
    }
    // SDK v5 expects: PGCreateOrder(CreateOrderRequest, x_request_id?, x_idempotency_key?, options?)
    // Use order_id as idempotency key if available
    const idempotencyKey = orderData && orderData.order_id ? String(orderData.order_id) : undefined;
    const order = await getClient().PGCreateOrder(orderData, undefined, idempotencyKey);
    // SDK may return { data: {...} } – normalize to payload
    return order?.data || order;
  } catch (error) {
    console.error('Cashfree create order (client) error:', error);
    throw error;
  }
};

// Verify payment function
const verifyPayment = async (orderId) => {
  try {
    // SDK v5: PGOrderFetchPayments(order_id, x_request_id?, x_idempotency_key?, options?)
    const payment = await getClient().PGOrderFetchPayments(orderId);
    return payment?.data || payment;
  } catch (error) {
    // Fallback for SDK variants expecting x-api-version first
    const msg = String(error?.message || '').toLowerCase();
    const apiMsg = String(error?.response?.data?.message || '').toLowerCase();
    if (msg.includes('argument') || apiMsg.includes('x-api-version')) {
      try {
        console.warn('[Cashfree] verifyPayment: retrying with x-api-version fallback');
        const payment = await getClient().PGOrderFetchPayments('2022-09-01', orderId);
        return payment?.data || payment;
      } catch (e2) {
        console.error('Cashfree verify payment (client) fallback error:', e2);
      }
    }
    console.error('Cashfree verify payment (client) error:', error);
    throw error;
  }
};

// Get order status
const getOrderStatus = async (orderId) => {
  try {
    // SDK v5: PGFetchOrder(order_id, x_request_id?, x_idempotency_key?, options?)
    const order = await getClient().PGFetchOrder(orderId);
    return order?.data || order;
  } catch (error) {
    // Fallback for SDK variants expecting x-api-version first
    const msg = String(error?.message || '').toLowerCase();
    const apiMsg = String(error?.response?.data?.message || '').toLowerCase();
    if (msg.includes('argument') || apiMsg.includes('x-api-version')) {
      try {
        console.warn('[Cashfree] getOrderStatus: retrying with x-api-version fallback');
        const order = await getClient().PGFetchOrder('2022-09-01', orderId);
        return order?.data || order;
      } catch (e2) {
        console.error('Cashfree get order status (client) fallback error:', e2);
      }
    }
    console.error('Cashfree get order status (client) error:', error);
    throw error;
  }
};

module.exports = {
  createOrder,
  verifyPayment,
  getOrderStatus
};

