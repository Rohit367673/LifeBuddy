const express = require('express');
const router = express.Router();
const { PGCredentials, PGSession, PGEnvironment, PGOrder, PGWebhook } = require('cashfree-pg');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Configure Cashfree environment
const env = process.env.NODE_ENV === 'production' 
  ? PGEnvironment.Production 
  : PGEnvironment.Sandbox;

const credentials = new PGCredentials({
  clientId: process.env.CASHEFREE_APP_ID,
  clientSecret: process.env.CASHEFREE_SECRET_KEY,
  environment: env
});

// Generate order token
router.post('/create-order', auth, async (req, res) => {
  try {
    const { plan, couponCode } = req.body;
    const user = req.user;

    // Calculate amount (same as PayPal logic)
    if (!['monthly', 'yearly'].includes(plan)) {
      return res.status(400).json({ error: 'Invalid plan' });
    }
    const base = plan === 'monthly' ? 1.99 : 21.99;
    let discount = 0;
    // ... apply coupon logic if needed ...

    const amount = base - discount;

    // Create order
    const order = new PGOrder({
      orderId: `ORDER_${Date.now()}_${user._id}`,
      orderAmount: amount,
      orderCurrency: 'USD'
    });

    const session = new PGSession(credentials, order);
    const token = await session.createOrderToken();

    res.json({ token, orderId: order.orderId });
  } catch (err) {
    console.error('Cashfree order error:', err);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Cashfree webhook
router.post('/webhook', express.json({ type: 'application/json' }), (req, res) => {
  try {
    const signature = req.headers['x-cf-signature'];
    const payload = req.body;

    // Verify webhook signature
    const isVerified = PGWebhook.verifySignature({
      body: payload,
      signature: signature,
      secret: process.env.CASHEFREE_WEBHOOK_SECRET
    });

    if (!isVerified) {
      console.error('Cashfree webhook signature verification failed');
      return res.status(400).json({ error: 'Invalid signature' });
    }

    // Handle payment event
    const event = payload.event;
    const orderId = payload.data.order.order_id;

    // Update database based on event
    // ... implement your logic here ...

    res.status(200).end();
  } catch (err) {
    console.error('Cashfree webhook error:', err);
    res.status(500).end();
  }
});

module.exports = router;
