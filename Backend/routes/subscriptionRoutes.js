const express = require('express');
const User = require('../models/User');
const { authenticateUser } = require('../middlewares/authMiddleware');
const { checkTrialStatus } = require('../middlewares/premiumMiddleware');

const router = express.Router();

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
      usage: user.usage
    });
  } catch (error) {
    console.error('Error fetching subscription status:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Start free trial
router.post('/trial', authenticateUser, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (user.subscription.status !== 'active' || user.subscription.plan !== 'free') {
      return res.status(400).json({
        message: 'Trial is only available for free users.'
      });
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
      exportablePDFs: true
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
    const { plan, paymentData } = req.body;
    
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
    
    // Store payment information
    const paymentInfo = {
      method: paymentData?.method || 'mock',
      transactionId: paymentData?.transactionId || `MOCK_${Date.now()}`,
      amount: paymentData?.amount || (plan === 'monthly' ? 9.99 : 99.99),
      currency: paymentData?.currency || 'USD',
      status: paymentData?.status || 'completed',
      cardLast4: paymentData?.cardLast4,
      timestamp: new Date()
    };
    
    user.subscription = {
      plan,
      status: 'active',
      startDate: new Date(),
      endDate,
      stripeCustomerId: paymentData?.stripeCustomerId || 'mock_customer_id',
      stripeSubscriptionId: paymentData?.stripeSubscriptionId || 'mock_subscription_id',
      paymentHistory: [...(user.subscription?.paymentHistory || []), paymentInfo]
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
    user.subscription.status = 'cancelled';
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