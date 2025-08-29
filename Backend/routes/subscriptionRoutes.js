const express = require('express');
const User = require('../models/User');
const { authenticateUser } = require('../middlewares/authMiddleware');
const { checkTrialStatus } = require('../middlewares/premiumMiddleware');
const Coupon = require('../models/Coupon');

const router = express.Router();
const RewardedSession = require('../models/RewardedSession');

// Get subscription status
router.get('/status', authenticateUser, checkTrialStatus, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    res.json({
      plan: user.subscription.plan,
      status: user.subscription.status,
      startDate: user.subscription.startDate,
      endDate: user.subscription.endDate,
      trialEndDate: user.subscription.trialEndDate,
      features: user.features,
      usage: user.usage,
      premiumBadge: user.subscription.premiumBadge || false,
      badgeGrantedAt: user.subscription.badgeGrantedAt
    });
  } catch (error) {
    console.error('Error fetching subscription status:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Start free trial (always enforce trial tasks gating)
router.post('/trial', authenticateUser, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (user.subscription.status !== 'active' || user.subscription.plan !== 'free') {
      return res.status(400).json({
        message: 'Trial is only available for free users.'
      });
    }

    // Enforce trial tasks requirements (server-side)
    // Now only require a verified rewarded ad watch
    const t = user.trialTasks || {};
    const ok = !!t.watchedAd;
    if (!ok) {
      const msg = 'Complete the trial task to unlock 7-day premium: watch a rewarded ad.';
      return res.status(403).json({ message: msg });
    }

    // Set trial for 7 days
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 7);
    
    user.subscription.status = 'trial';
    user.subscription.trialEndDate = trialEndDate;
    
    // Enable premium features for trial
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
    
    res.json({
      message: 'Free trial started successfully!',
      trialEndDate,
      features: user.features
    });
  } catch (error) {
    console.error('Error starting trial:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Subscribe to premium plan
router.post('/subscribe', authenticateUser, async (req, res) => {
  try {
    const { plan, paymentData, couponCode } = req.body;
    
    if (!['monthly', 'yearly'].includes(plan)) {
      return res.status(400).json({
        message: 'Invalid plan. Must be monthly or yearly.'
      });
    }
    
    const user = await User.findById(req.user._id);
    
    // Set subscription end date
    const endDate = new Date();
    if (plan === 'monthly') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }
    
    // Coupon handling
    let discount = 0;
    let couponUsed = null;
    const baseAmount = paymentData?.amount || (plan === 'monthly' ? 9.99 : 99.99);
    if (couponCode) {
      const normalized = String(couponCode).trim().toUpperCase();
      const coupon = await Coupon.findOne({ code: normalized, isActive: true });
      if (coupon) {
        discount = Math.min(baseAmount, Number(coupon.discountAmount) || 0);
        couponUsed = coupon;
      }
    }

    // Store payment information
    const paymentInfo = {
      method: paymentData?.method || 'mock',
      transactionId: paymentData?.transactionId || `MOCK_${Date.now()}`,
      amount: Math.max(0, baseAmount - discount),
      currency: paymentData?.currency || 'USD',
      status: paymentData?.status || 'completed',
      cardLast4: paymentData?.cardLast4,
      timestamp: new Date(),
      couponCode: couponUsed ? couponUsed.code : undefined,
      discountApplied: discount
    };
    
    user.subscription = {
      plan,
      status: 'active',
      startDate: new Date(),
      endDate,
      stripeCustomerId: paymentData?.stripeCustomerId || 'mock_customer_id',
      stripeSubscriptionId: paymentData?.stripeSubscriptionId || 'mock_subscription_id',
      paymentHistory: [...(user.subscription?.paymentHistory || []), paymentInfo],
      premiumBadge: true,
      badgeGrantedAt: new Date()
    };
    
    // Enable all premium features
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
    
    // Record coupon usage
    if (couponUsed) {
      couponUsed.uses.push({
        user: user._id,
        plan,
        amountBefore: baseAmount,
        discountApplied: discount,
        transactionId: paymentInfo.transactionId
      });
      await couponUsed.save();
    }

    await user.save();
    
    res.json({
      message: 'Subscription activated successfully!',
      subscription: user.subscription,
      features: user.features
    });
  } catch (error) {
    console.error('Error subscribing:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Cancel subscription
router.post('/cancel', authenticateUser, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (user.subscription.plan === 'free') {
      return res.status(400).json({
        message: 'No active subscription to cancel.'
      });
    }
    
    // Set subscription to cancel at end of current period
    user.subscription.status = 'canceled';
    user.subscription.cancelledAt = new Date();
    
    await user.save();
    
    res.json({
      message: 'Subscription cancelled successfully. You will have access until the end of your current billing period.'
    });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Trial task completion endpoints
router.post('/trial-tasks/watch-ad', authenticateUser, async (req, res) => {
  try {
    // In production, direct self-claim is blocked; SSV must set this flag.
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ message: 'Use rewarded SSV to verify ad watch in production.' });
    }
    const user = await User.findById(req.user._id);
    user.trialTasks = { ...(user.trialTasks || {}), watchedAd: true, lastUpdated: new Date() };
    await user.save();
    res.json({ success: true, trialTasks: user.trialTasks });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.post('/trial-tasks/follow-instagram', authenticateUser, async (req, res) => {
  try {
    // In production, auto-verification is not supported via official APIs.
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ message: 'Instagram follow auto-verification not supported in production.' });
    }
    const user = await User.findById(req.user._id);
    user.trialTasks = { ...(user.trialTasks || {}), followedInstagram: true, lastUpdated: new Date() };
    await user.save();
    res.json({ success: true, trialTasks: user.trialTasks });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.post('/trial-tasks/share', authenticateUser, async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ message: 'Sharing progress is tracked via referral link clicks only in production.' });
    }
    const { count = 1 } = req.body;
    const user = await User.findById(req.user._id);
    const current = user.trialTasks?.sharedReferrals || 0;
    user.trialTasks = { ...(user.trialTasks || {}), sharedReferrals: current + Number(count), lastUpdated: new Date() };
    await user.save();
    res.json({ success: true, trialTasks: user.trialTasks });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Get trial task progress (from user.trialTasks)
router.get('/trial-tasks/progress', authenticateUser, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('trialTasks');
    res.json({ success: true, trialTasks: user?.trialTasks || {} });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Rewarded ads SSV flow
router.post('/trial-tasks/rewarded/start', authenticateUser, async (req, res) => {
  try {
    const sessionId = `r_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    await RewardedSession.create({ user: req.user._id, sessionId, status: 'pending', meta: {} });
    // Client will load the rewarded ad using Ad Manager and pass sessionId/custom_data
    res.json({ success: true, sessionId, ssvCallback: `${process.env.PUBLIC_BASE_URL || 'http://localhost:5001'}/api/subscriptions/trial-tasks/rewarded/ssv` });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.get('/trial-tasks/rewarded/status/:sessionId', authenticateUser, async (req, res) => {
  try {
    const sess = await RewardedSession.findOne({ sessionId: req.params.sessionId, user: req.user._id });
    if (!sess) return res.status(404).json({ message: 'Session not found' });
    res.json({ success: true, status: sess.status });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Google Ad Manager SSV callback (no auth; secured by shared secret or signature)
router.post('/trial-tasks/rewarded/ssv', async (req, res) => {
  try {
    const secret = process.env.AD_SSV_SECRET;
    const { sessionId, userId, sig } = req.body || {};
    if (!secret || sig !== secret) {
      return res.status(403).json({ message: 'Invalid SSV signature' });
    }
    const sess = await RewardedSession.findOne({ sessionId });
    if (!sess) return res.status(404).json({ message: 'Session not found' });
    if (String(sess.user) !== String(userId)) {
      return res.status(400).json({ message: 'User mismatch' });
    }
    if (sess.status !== 'rewarded') {
      sess.status = 'rewarded';
      await sess.save();
    }
    const user = await User.findById(sess.user);
    user.trialTasks = { ...(user.trialTasks || {}), watchedAd: true, lastUpdated: new Date() };
    await user.save();
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Get billing history
router.get('/billing', authenticateUser, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    res.json({
      subscription: user.subscription,
      paymentHistory: user.subscription?.paymentHistory || []
    });
  } catch (error) {
    console.error('Error fetching billing history:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update payment method (placeholder for future implementation)
router.put('/payment-method', authenticateUser, async (req, res) => {
  try {
    const { paymentMethodId } = req.body;
    
    const user = await User.findById(req.user._id);
    user.subscription.stripeCustomerId = paymentMethodId;
    
    await user.save();
    
    res.json({
      message: 'Payment method updated successfully.'
    });
  } catch (error) {
    console.error('Error updating payment method:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get subscription plans (for reference)
router.get('/plans', authenticateUser, async (req, res) => {
  try {
    const plans = [
      {
        id: 'free',
        name: 'Free',
        price: 0,
        period: 'forever',
        description: 'Perfect for getting started',
        features: [
          'Up to 2 active events',
          'Basic task management',
          'Simple mood tracking',
          'Community support',
          'Basic templates'
        ],
        limitations: [
          'Limited event templates',
          'No advanced analytics',
          'No AI insights',
          'No premium support'
        ]
      },
      {
        id: 'monthly',
        name: 'Monthly',
        price: 9.99,
        period: 'month',
        description: 'Most popular choice',
        features: [
          'Unlimited events',
          'All premium templates',
          'AI-powered insights',
          'Advanced analytics',
          'Priority support',
          'Export to PDF',
          'Calendar sync',
          'Custom checklists'
        ],
        limitations: []
      },
      {
        id: 'yearly',
        name: 'Yearly',
        price: 99.99,
        period: 'year',
        description: 'Best value - save 17%',
        features: [
          'Everything in Monthly',
          'Early access to new features',
          'Exclusive templates',
          'Advanced reporting',
          'Team collaboration',
          'API access',
          'White-label options'
        ],
        limitations: []
      }
    ];
    
    res.json({ plans });
  } catch (error) {
    console.error('Error fetching plans:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router; 