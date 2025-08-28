const express = require('express');
const router = express.Router();
const { Cashfree, CFEnvironment } = require('cashfree-pg');
const User = require('../models/User');
const { authenticateUser } = require('../middlewares/authMiddleware');
const { getPlanPrice, getCurrencyByCountry } = require('../utils/currencyConverter');

// Configure Cashfree
const isProduction = process.env.NODE_ENV === 'production';
Cashfree.XClientId = process.env.CASHFREE_APP_ID || '';
Cashfree.XClientSecret = process.env.CASHFREE_SECRET_KEY || '';
Cashfree.XEnvironment = isProduction ? CFEnvironment.PRODUCTION : CFEnvironment.SANDBOX;

console.log(`[Cashfree] Environment: ${isProduction ? 'PRODUCTION' : 'SANDBOX'}`);
console.log(`[Cashfree] App ID: ${Cashfree.XClientId ? Cashfree.XClientId.substring(0, 10) + '...' : 'NOT SET'}`);

if (!Cashfree.XClientId || !Cashfree.XClientSecret) {
  console.warn('[Cashfree] Missing CASHFREE_APP_ID or CASHFREE_SECRET_KEY');
}

// Generate order token
router.post('/create-order', authenticateUser, async (req, res) => {
  try {
    const { plan, couponCode, currency = 'INR', userCountry } = req.body;
    const user = req.user;

    // Calculate amount with proper currency conversion
    if (!['monthly', 'yearly'].includes(plan)) {
      return res.status(400).json({ error: 'Invalid plan' });
    }
    
    // Detect currency from country if not provided
    const detectedCurrency = userCountry ? getCurrencyByCountry(userCountry) : currency;
    const finalCurrency = currency || detectedCurrency;
    
    // Get region-specific pricing
    const base = getPlanPrice(plan, finalCurrency);
    let discount = 0;
    // ... apply coupon logic if needed ...

    const amount = base - discount;

    // Create order using new Cashfree API
    const orderId = `ORDER_${Date.now()}_${user._id}`;
    const orderRequest = {
      order_id: orderId,
      order_amount: amount,
      order_currency: finalCurrency,
      customer_details: {
        customer_id: user._id.toString(),
        customer_email: user.email,
        customer_phone: user.phone || '9999999999'
      }
    };

    const response = await Cashfree.PGCreateOrder('2023-08-01', orderRequest);
    
    res.json({ 
      payment_session_id: response.payment_session_id,
      order_id: response.order_id 
    });
  } catch (err) {
    console.error('Cashfree order error:', err);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Cashfree webhook
router.post('/webhook', express.json({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['x-cf-signature'];
    const payload = req.body;

    // Verify webhook signature using new API
    const isVerified = Cashfree.PGVerifyWebhookSignature(
      JSON.stringify(payload),
      signature,
      process.env.CASHFREE_WEBHOOK_SECRET || ''
    );

    if (!isVerified) {
      console.error('Cashfree webhook signature verification failed');
      return res.status(400).json({ error: 'Invalid signature' });
    }

    // Handle payment event
    const event = payload.type;
    const orderId = payload.data?.order?.order_id;

    if (event === 'PAYMENT_SUCCESS_WEBHOOK' && orderId) {
      // Update user subscription logic here
      console.log(`Payment successful for order: ${orderId}`);
    }

    res.status(200).end();
  } catch (err) {
    console.error('Cashfree webhook error:', err);
    res.status(500).end();
  }
});

module.exports = router;
