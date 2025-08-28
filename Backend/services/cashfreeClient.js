const { Cashfree, CFEnvironment } = require('cashfree-pg');

// Configure Cashfree SDK (v5) using static configuration
Cashfree.XEnvironment = process.env.NODE_ENV === 'production' 
  ? CFEnvironment.PRODUCTION 
  : CFEnvironment.SANDBOX;
Cashfree.XClientId = process.env.CASHFREE_APP_ID || '';
Cashfree.XClientSecret = process.env.CASHFREE_SECRET_KEY || '';

// Create order function
const createOrder = async (orderData) => {
  try {
    const order = await Cashfree.PGCreateOrder('2023-08-01', orderData);
    // SDK may return { data: {...} } – normalize to payload
    return order?.data || order;
  } catch (error) {
    console.error('Cashfree create order error:', error);
    throw error;
  }
};

// Verify payment function
const verifyPayment = async (orderId) => {
  try {
    const payment = await Cashfree.PGOrderFetchPayments('2023-08-01', orderId);
    return payment?.data || payment;
  } catch (error) {
    console.error('Cashfree verify payment error:', error);
    throw error;
  }
};

// Get order status
const getOrderStatus = async (orderId) => {
  try {
    const order = await Cashfree.PGOrderFetchOrder('2023-08-01', orderId);
    return order?.data || order;
  } catch (error) {
    console.error('Cashfree get order status error:', error);
    throw error;
  }
};

module.exports = {
  createOrder,
  verifyPayment,
  getOrderStatus
};
