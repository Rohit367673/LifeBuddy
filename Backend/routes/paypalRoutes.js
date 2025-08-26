const express = require('express');
const paypal = require('@paypal/checkout-server-sdk');
const { authenticateUser } = require('../middlewares/authMiddleware');
const { client: paypalClient } = require('../services/paypalClient');
const User = require('../models/User');
const Coupon = require('../models/Coupon');
const Payment = require('../models/Payment');

const router = express.Router();

// GET /api/paypal/config - return client id for frontend SDK
router.get('/config', (req, res) => {
  try {
    const clientId = process.env.PAYPAL_CLIENT_ID || '';
    return res.json({ success: true, clientId });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
});

// Helper: compute plan price and apply coupon
async function computeAmount(plan, couponCode) {
  if (!['monthly', 'yearly'].includes(plan)) {
    throw new Error('Invalid plan');
  }
  const base = plan === 'monthly' ? 9.99 : 99.99;
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
  const finalAmount = Math.max(0, base - discount);
  return { base, discount, finalAmount, appliedCoupon };
}

// POST /api/paypal/create-order
router.post('/create-order', authenticateUser, async (req, res) => {
  try {
    const { plan, couponCode, currency = 'USD' } = req.body || {};
    const { base, discount, finalAmount, appliedCoupon } = await computeAmount(plan, couponCode);

    // If fully discounted, no PayPal order needed
    if (finalAmount === 0) {
      return res.json({
        success: true,
        free: true,
        amount: 0,
        baseAmount: base,
        discount,
        currency
      });
    }

    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer('return=representation');
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: currency,
            value: finalAmount.toFixed(2)
          },
          custom_id: JSON.stringify({ userId: String(req.user._id), plan, couponCode: appliedCoupon ? appliedCoupon.code : null }),
          description: `LifeBuddy ${plan} plan`
        }
      ]
    });

    const order = await paypalClient().execute(request);
    return res.json({
      success: true,
      orderId: order.result.id,
      amount: finalAmount,
      baseAmount: base,
      discount,
      currency,
    });
  } catch (e) {
    console.error('[PayPal] create-order error:', e);
    // Surface helpful PayPal error context (non-sensitive) for troubleshooting
    const paypalErr = (e && e.statusCode && e.result) ? {
      statusCode: e.statusCode,
      debug_id: e.result?.debug_id,
      details: e.result?.details,
      message: e.result?.message
    } : null;
    const httpCode = paypalErr?.statusCode === 422 ? 422 : 500;
    return res.status(httpCode).json({
      success: false,
      message: paypalErr?.message || e.message || 'Failed to create PayPal order',
      paypal: paypalErr || undefined
    });
  }
});

// POST /api/paypal/capture
router.post('/capture', authenticateUser, async (req, res) => {
  try {
    const { orderId, plan, couponCode } = req.body || {};
    if (!['monthly', 'yearly'].includes(plan)) return res.status(400).json({ success: false, message: 'Invalid plan' });

    // Compute discount info for records (server-trust source of truth)
    const { base, discount, finalAmount, appliedCoupon } = await computeAmount(plan, couponCode);

    let paymentRecord = null;
    let currency = 'USD';
    let transactionId = undefined;

    if (finalAmount === 0) {
      // Bypass PayPal capture; mark as completed with synthetic id
      transactionId = `FREE_${Date.now()}`;
      currency = 'USD';
      paymentRecord = await Payment.create({
        user: req.user._id,
        amount: 0,
        currency,
        paymentMethod: 'coupon',
        paymentId: transactionId,
        status: 'completed',
        couponCode: appliedCoupon ? appliedCoupon.code : null,
        discountAmount: discount,
        originalAmount: base,
        plan,
        metadata: { reason: '100% discount' }
      });
    } else {
      if (!orderId) return res.status(400).json({ success: false, message: 'orderId is required' });
      const request = new paypal.orders.OrdersCaptureRequest(orderId);
      request.requestBody({});
      const captureResponse = await paypalClient().execute(request);
      const status = captureResponse?.result?.status;
      const purchaseUnit = captureResponse?.result?.purchase_units?.[0];
      const captures = purchaseUnit?.payments?.captures || [];
      const capture = captures[0];
      if (status !== 'COMPLETED' || !capture) {
        return res.status(400).json({ success: false, message: 'Payment not completed' });
      }
      const amountValue = Number(capture.amount.value);
      currency = String(capture.amount.currency_code || 'USD');
      transactionId = capture.id;
      paymentRecord = await Payment.create({
        user: req.user._id,
        amount: amountValue,
        currency,
        paymentMethod: 'paypal',
        paymentId: transactionId,
        status: 'completed',
        couponCode: appliedCoupon ? appliedCoupon.code : null,
        discountAmount: discount,
        originalAmount: base,
        plan,
        metadata: {
          paypalOrderId: orderId,
          payer: captureResponse?.result?.payer || {},
        }
      });
    }

    // Record payment
    // Update user subscription
    const user = await User.findById(req.user._id);
    const endDate = new Date();
    if (plan === 'monthly') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    const paymentInfo = {
      method: finalAmount === 0 ? 'coupon' : 'paypal',
      transactionId,
      amount: finalAmount,
      currency,
      status: 'completed',
      timestamp: new Date(),
      couponCode: appliedCoupon ? appliedCoupon.code : undefined,
      discountApplied: discount
    };

    user.subscription = {
      ...(user.subscription || {}),
      plan,
      status: 'active',
      startDate: new Date(),
      endDate,
      paymentHistory: [ ...(user.subscription?.paymentHistory || []), paymentInfo ]
    };

    // Enable premium features
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

    // Record coupon usage for simple coupons
    if (appliedCoupon) {
      appliedCoupon.uses.push({
        user: user._id,
        plan,
        amountBefore: base,
        discountApplied: discount,
        transactionId
      });
      await appliedCoupon.save();
    }

    return res.json({ success: true, message: 'Payment captured and subscription activated', subscription: user.subscription });
  } catch (e) {
    console.error('[PayPal] capture error:', e);
    // Surface helpful PayPal error context (non-sensitive) for troubleshooting
    const paypalErr = (e && e.statusCode && e.result) ? {
      statusCode: e.statusCode,
      debug_id: e.result?.debug_id,
      details: e.result?.details,
      message: e.result?.message
    } : null;
    const httpCode = paypalErr?.statusCode === 422 ? 422 : 500;
    return res.status(httpCode).json({
      success: false,
      message: paypalErr?.message || e.message || 'Failed to capture PayPal order',
      paypal: paypalErr || undefined
    });
  }
});

module.exports = router;
