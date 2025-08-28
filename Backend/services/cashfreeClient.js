const { Cashfree } = require('cashfree-pg');

// Initialize Cashfree client
const cashfree = new Cashfree({
  mode: process.env.NODE_ENV === 'production' ? 'PRODUCTION' : 'SANDBOX',
  appId: process.env.CASHFREE_APP_ID || '',
  secretKey: process.env.CASHFREE_SECRET_KEY || ''
});

// Create order function
const createOrder = async (orderData) => {
  try {
    const order = await cashfree.PGCreateOrder('2023-08-01', orderData);
    return order;
  } catch (error) {
    console.error('Cashfree create order error:', error);
    throw error;
  }
};

// Verify payment function
const verifyPayment = async (orderId) => {
  try {
    const payment = await cashfree.PGOrderFetchPayments('2023-08-01', orderId);
    return payment;
  } catch (error) {
    console.error('Cashfree verify payment error:', error);
    throw error;
  }
};

// Get order status
const getOrderStatus = async (orderId) => {
  try {
    const order = await cashfree.PGOrderFetchOrder('2023-08-01', orderId);
    return order;
  } catch (error) {
    console.error('Cashfree get order status error:', error);
    throw error;
  }
};

module.exports = {
  cashfree,
  createOrder,
  verifyPayment,
  getOrderStatus
};
