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
    const { plan, stripeCustomerId, stripeSubscriptionId } = req.body;
    
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
    
    user.subscription = {
      plan,
      status: 'active',
      startDate: new Date(),
      endDate,
      stripeCustomerId,
      stripeSubscriptionId
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
      exportablePDFs: true
    };
    
    await user.save();
    
    res.json({
      message: 'Subscription activated successfully!',
      plan,
      endDate,
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
    
    user.subscription.status = 'canceled';
    await user.save();
    
    res.json({
      message: 'Subscription canceled successfully. You can continue using premium features until the end of your billing period.'
    });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get available plans
router.get('/plans', async (req, res) => {
  try {
    const plans = [
      {
        id: 'free',
        name: 'Free',
        price: 0,
        features: [
          '2 active events',
          '10 daily tasks',
          '7-day mood history',
          'Basic motivational messages',
          'Public profile sharing'
        ],
        limitations: [
          'Limited events and tasks',
          'Basic features only',
          'Ad-supported'
        ]
      },
      {
        id: 'monthly',
        name: 'Premium Monthly',
        price: 4.99,
        features: [
          'Unlimited events',
          'Unlimited tasks',
          'Full mood history',
          'Advanced budget tracking',
          'Custom checklists',
          'Premium motivational messages',
          'Profile insights & analytics',
          'Full calendar sync',
          'Ad-free experience',
          'Exportable PDFs'
        ],
        trial: '7-day free trial'
      },
      {
        id: 'yearly',
        name: 'Premium Yearly',
        price: 39.99,
        savings: 'Save 33%',
        features: [
          'All monthly features',
          'Priority support',
          'Early access to new features'
        ],
        trial: '7-day free trial'
      }
    ];
    
    res.json(plans);
  } catch (error) {
    console.error('Error fetching plans:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router; 