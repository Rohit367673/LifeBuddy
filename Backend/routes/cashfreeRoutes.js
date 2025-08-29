const express = require('express');
const router = express.Router();
const { Cashfree, CFEnvironment } = require('cashfree-pg');
const crypto = require('crypto');
const { createOrder: createCashfreeOrder, verifyPayment: verifyCashfreePayment, getOrderStatus } = require('../services/cashfreeClient');
const User = require('../models/User');
const { authenticateUser } = require('../middlewares/authMiddleware');
const { getPlanPrice, getCurrencyByCountry } = require('../utils/currencyConverter');
const Coupon = require('../models/Coupon');
const Payment = require('../models/Payment');
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Log basic configuration (do not mutate SDK statics; service handles client instantiation)
const isProduction = process.env.NODE_ENV === 'production';
console.log(`[Cashfree] Environment: ${isProduction ? 'PRODUCTION' : 'SANDBOX'}`);
console.log(`[Cashfree] App ID: ${process.env.CASHFREE_APP_ID ? process.env.CASHFREE_APP_ID.substring(0, 10) + '...' : 'NOT SET'}`);
if (!process.env.CASHFREE_APP_ID || !process.env.CASHFREE_SECRET_KEY) {
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
    const finalCurrency = (currency || detectedCurrency || 'INR').toUpperCase();

    // Cashfree sandbox supports INR only; bail early with helpful message
    const isProduction = process.env.NODE_ENV === 'production';
    if (!isProduction && finalCurrency !== 'INR') {
      return res.status(400).json({ error: 'Cashfree sandbox supports INR only. Use PayPal for other currencies.' });
    }

    // Ensure credentials present
    if (!process.env.CASHFREE_APP_ID || !process.env.CASHFREE_SECRET_KEY) {
      console.error('[Cashfree] Missing credentials: set CASHFREE_APP_ID and CASHFREE_SECRET_KEY');
      return res.status(500).json({ error: 'Cashfree not configured on server' });
    }
    
    // Get region-specific pricing and apply coupon if present
    const base = getPlanPrice(plan, finalCurrency);
    let discount = 0;
    let appliedCoupon = null;
    if (couponCode) {
      const normalized = String(couponCode).trim().toUpperCase();
      const coupon = await Coupon.findOne({ code: normalized, isActive: true });
      if (coupon) {
        discount = Math.min(base, Number(coupon.discountAmount) || 0);
        appliedCoupon = coupon;
      }
    }

    const amount = Number(Math.max(0, base - discount).toFixed(2));
    if (!(amount > 0)) {
      return res.status(400).json({ error: 'Invalid amount for Cashfree order' });
    }

    // Create order using new Cashfree API
    const orderId = `ORDER_${Date.now()}_${user._id}`;
    const orderRequest = {
      order_id: orderId,
      order_amount: amount,
      order_currency: finalCurrency,
      order_note: JSON.stringify({
        plan,
        couponCode: appliedCoupon ? appliedCoupon.code : null,
        baseAmount: base,
        discountApplied: discount
      }),
      order_meta: {
        return_url: `${FRONTEND_URL}/premium?from=cashfree&order_id=${orderId}`
      },
      customer_details: {
        customer_id: user._id.toString(),
        customer_email: user.email,
        customer_phone: user.phone || '9999999999'
      }
    };

    const response = await createCashfreeOrder(orderRequest);
    
    res.json({ 
      payment_session_id: response.payment_session_id,
      order_id: response.order_id 
    });
  } catch (err) {
    // Print as much detail as available
    const details = {
      message: err?.message,
      code: err?.code,
      response: err?.response?.data || err?.response,
      stack: process.env.NODE_ENV !== 'production' ? err?.stack : undefined
    };
    console.error('Cashfree order error:', details);
    if (process.env.NODE_ENV !== 'production') {
      return res.status(500).json({ error: 'Failed to create order', details });
    }
    return res.status(500).json({ error: 'Failed to create order' });
  }
});

// Fallback confirm endpoint: verify order on return and activate subscription (idempotent)
router.post('/confirm', authenticateUser, async (req, res) => {
  try {
    const { orderId } = req.body || {};
    if (!orderId) return res.status(400).json({ success: false, message: 'orderId is required' });

    // Fetch order status from Cashfree
    const order = await getOrderStatus(orderId);
    const orderStatus = String(order?.order_status || order?.order?.order_status || order?.status || '').toUpperCase();
    if (!orderStatus) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const isPaid = ['PAID', 'COMPLETED', 'SUCCESS', 'CAPTURED'].includes(orderStatus);
    if (!isPaid) {
      return res.status(400).json({ success: false, message: 'Order not paid', orderStatus });
    }

    // Infer user from orderId pattern ORDER_<ts>_<userId>
    const userId = String(orderId).split('_').pop();
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found for order' });
    }

    const currency = String(order?.order_currency || order?.order?.order_currency || 'INR').toUpperCase();
    const amount = Number(order?.order_amount || order?.order?.order_amount || 0);

    // Determine plan from order_note or fallback by amount heuristic
    let plan = 'monthly';
    try {
      const noteStr = order?.order_note || order?.order?.order_note || order?.notes;
      const note = noteStr ? JSON.parse(noteStr) : {};
      if (note && ['monthly', 'yearly'].includes(note.plan)) {
        plan = note.plan;
      } else {
        const monthly = getPlanPrice('monthly', currency);
        const yearly = getPlanPrice('yearly', currency);
        plan = Math.abs(amount - yearly) < Math.abs(amount - monthly) ? 'yearly' : 'monthly';
      }
    } catch (_) {
      const monthly = getPlanPrice('monthly', currency);
      const yearly = getPlanPrice('yearly', currency);
      plan = Math.abs(amount - yearly) < Math.abs(amount - monthly) ? 'yearly' : 'monthly';
    }

    // Try to fetch payment details for paymentId
    let paymentId = `CF_${Date.now()}`;
    try {
      const payments = await verifyCashfreePayment(orderId);
      const list = payments?.payments || payments?.data || payments;
      const successPayment = Array.isArray(list) ? list.find((p) => {
        const st = String(p?.payment_status || p?.status || '').toUpperCase();
        return st.includes('SUCCESS') || st.includes('COMPLETED') || st.includes('CAPTURED');
      }) : null;
      paymentId = successPayment?.payment_id || successPayment?.cf_payment_id || paymentId;
    } catch (e) {
      console.warn('[Cashfree] confirm: could not fetch payments, proceeding without exact id:', e.message);
    }

    // Idempotency: avoid duplicate Payment records
    const existing = await Payment.findOne({ paymentId });
    if (!existing) {
      await Payment.create({
        user: user._id,
        amount,
        currency,
        paymentMethod: 'cashfree',
        paymentId,
        status: 'completed',
        plan,
        metadata: { cashfreeOrderId: orderId, source: 'confirm-endpoint' }
      });
    }

    // Update subscription and enable features
    const endDate = new Date();
    if (plan === 'monthly') endDate.setMonth(endDate.getMonth() + 1);
    else endDate.setFullYear(endDate.getFullYear() + 1);

    user.subscription = {
      ...(user.subscription || {}),
      plan,
      status: 'active',
      startDate: new Date(),
      endDate,
      premiumBadge: true,
      badgeGrantedAt: new Date(),
      paymentHistory: [
        ...(user.subscription?.paymentHistory || []),
        {
          method: 'cashfree',
          transactionId: paymentId,
          amount,
          currency,
          status: 'completed',
          timestamp: new Date()
        }
      ]
    };

    user.features = {
      unlimitedEvents: true,
      advancedBudgetTracking: true,
      fullMoodHistory: true,
      customChecklists: true,
      premiumMotivationalMessages: true,
      profileInsights: true,
      fullCalendarSync: true,
      adFree: true,
      exportablePDFs: true,
      aiInsights: true,
      prioritySupport: true,
      advancedAnalytics: true
    };

    await user.save();
    console.log(`[Cashfree] Confirm: subscription activated for user ${user._id} (${plan}) via order ${orderId}`);
    return res.json({ success: true, message: 'Subscription activated', subscription: user.subscription });
  } catch (err) {
    console.error('[Cashfree] confirm error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Cashfree webhook
router.post('/webhook', async (req, res) => {
  try {
    const signature = req.headers['x-cf-signature']
      || req.headers['x-webhook-signature']
      || req.headers['x-cashfree-signature'];
    // Get raw body string (set by app-level express.raw for this route)
    const rawBody = Buffer.isBuffer(req.body)
      ? req.body.toString('utf8')
      : (typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {}));

    // Verify webhook signature using HMAC-SHA256 (base64)
    // Cashfree uses the API Secret Key as the webhook signing secret
    const secret = process.env.CASHFREE_WEBHOOK_SECRET || process.env.CASHFREE_SECRET_KEY || '';
    const allowUnsigned = !secret && process.env.NODE_ENV !== 'production';

    if (!allowUnsigned) {
      if (!signature) {
        return res.status(400).json({ error: 'Missing signature' });
      }
      const expectedSig = crypto.createHmac('sha256', secret).update(rawBody).digest('base64');
      const isVerified = expectedSig === signature;

      if (!isVerified) {
        console.error('Cashfree webhook signature verification failed');
        return res.status(400).json({ error: 'Invalid signature' });
      }
    } else {
      console.warn('[Cashfree] No webhook secret available; skipping signature verification (dev only)');
    }

    // Safely parse JSON after signature verification
    let payload;
    try {
      payload = (typeof req.body === 'object' && !Buffer.isBuffer(req.body))
        ? req.body
        : JSON.parse(rawBody);
    } catch (e) {
      console.error('Cashfree webhook JSON parse failed');
      return res.status(400).json({ error: 'Invalid JSON' });
    }

    // Handle payment event
    const event = payload.type;
    const orderId = payload.data?.order?.order_id;

    if (event === 'PAYMENT_SUCCESS_WEBHOOK' && orderId) {
      try {
        const userId = String(orderId).split('_').pop();
        const user = await User.findById(userId);
        if (!user) {
          console.warn(`[Cashfree] Webhook: user not found for order ${orderId}`);
          return res.status(200).json({ success: true });
        }

        const orderInfo = payload.data?.order || {};
        const paymentInfoPayload = payload.data?.payment || {};
        const currency = String(orderInfo.order_currency || 'INR').toUpperCase();
        const amount = Number(orderInfo.order_amount || 0);

        // Determine plan from order_note or fallback by amount heuristic
        let plan = 'monthly';
        try {
          const note = orderInfo.order_note ? JSON.parse(orderInfo.order_note) : {};
          if (note && ['monthly', 'yearly'].includes(note.plan)) {
            plan = note.plan;
          } else {
            const monthly = getPlanPrice('monthly', currency);
            const yearly = getPlanPrice('yearly', currency);
            plan = Math.abs(amount - yearly) < Math.abs(amount - monthly) ? 'yearly' : 'monthly';
          }
        } catch (_) {
          const monthly = getPlanPrice('monthly', currency);
          const yearly = getPlanPrice('yearly', currency);
          plan = Math.abs(amount - yearly) < Math.abs(amount - monthly) ? 'yearly' : 'monthly';
        }

        const endDate = new Date();
        if (plan === 'monthly') endDate.setMonth(endDate.getMonth() + 1);
        else endDate.setFullYear(endDate.getFullYear() + 1);

        // Record payment
        await Payment.create({
          user: user._id,
          amount,
          currency,
          paymentMethod: 'cashfree',
          paymentId: paymentInfoPayload.payment_id || paymentInfoPayload.cf_payment_id || `CF_${Date.now()}`,
          status: 'completed',
          plan,
          metadata: {
            cashfreeOrderId: orderId,
            event
          }
        });

        // Update subscription and enable premium features
        user.subscription = {
          ...(user.subscription || {}),
          plan,
          status: 'active',
          startDate: new Date(),
          endDate,
          premiumBadge: true,
          badgeGrantedAt: new Date(),
          paymentHistory: [
            ...(user.subscription?.paymentHistory || []),
            {
              method: 'cashfree',
              transactionId: paymentInfoPayload.payment_id || paymentInfoPayload.cf_payment_id || `CF_${Date.now()}`,
              amount,
              currency,
              status: 'completed',
              timestamp: new Date()
            }
          ]
        };

        user.features = {
          unlimitedEvents: true,
          advancedBudgetTracking: true,
          fullMoodHistory: true,
          customChecklists: true,
          premiumMotivationalMessages: true,
          profileInsights: true,
          fullCalendarSync: true,
          adFree: true,
          exportablePDFs: true,
          aiInsights: true,
          prioritySupport: true,
          advancedAnalytics: true
        };

        await user.save();
        console.log(`[Cashfree] Subscription activated for user ${user._id} (${plan}) via order ${orderId}`);
      } catch (e) {
        console.error('[Cashfree] Webhook processing error:', e);
      }
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Cashfree webhook error:', err);
    res.status(500).end();
  }
});

module.exports = router;
