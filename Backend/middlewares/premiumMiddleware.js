const User = require('../models/User');

// Admin helpers
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'rohit367673@gmail.com')
  .split(',')
  .map(e => e.trim().toLowerCase())
  .filter(Boolean);

const isAdmin = (user) => {
  try {
    const email = user?.email?.toLowerCase();
    return !!email && ADMIN_EMAILS.includes(email);
  } catch (_) {
    return false;
  }
};

// Check if user has premium feature
const checkPremiumFeature = (feature) => {
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.user._id);
      
      if (!user.features[feature]) {
        return res.status(403).json({
          message: 'This feature requires a premium subscription.',
          feature,
          upgradeRequired: true
        });
      }
      
      next();
    } catch (error) {
      console.error('Premium feature check error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };
};

// Check usage limits for freemium users
const checkUsageLimit = (limitType) => {
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.user._id);
      
      // Reset daily task count if it's a new day
      if (limitType === 'dailyTasks') {
        const today = new Date();
        const lastReset = new Date(user.usage.lastTaskReset);
        if (today.getDate() !== lastReset.getDate() || today.getMonth() !== lastReset.getMonth()) {
          user.usage.dailyTasks = 0;
          user.usage.lastTaskReset = today;
          await user.save();
        }
      }
      
      const limits = {
        activeEvents: { free: 2, current: user.usage.activeEvents },
        dailyTasks: { free: 10, current: user.usage.dailyTasks },
        moodEntries: { free: 7, current: user.usage.moodEntries }
      };
      
      const limit = limits[limitType];
      
      if (user.subscription.plan === 'free' && limit.current >= limit.free) {
        return res.status(403).json({
          message: `You've reached your ${limitType} limit. Upgrade to premium for unlimited access.`,
          limitType,
          current: limit.current,
          limit: limit.free,
          upgradeRequired: true
        });
      }
      
      next();
    } catch (error) {
      console.error('Usage limit check error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };
};

// Update usage count
const updateUsage = (limitType) => {
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.user._id);
      
      if (user.subscription.plan === 'free') {
        user.usage[limitType] += 1;
        await user.save();
      }
      
      next();
    } catch (error) {
      console.error('Usage update error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };
};

// Check if user is on trial
const checkTrialStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (user.subscription.status === 'trial') {
      const trialEnd = new Date(user.subscription.trialEndDate);
      const now = new Date();
      
      if (now > trialEnd) {
        // Trial expired, downgrade to free
        user.subscription.status = 'expired';
        user.subscription.plan = 'free';
        user.features = {
          unlimitedEvents: false,
          advancedBudgetTracking: false,
          fullMoodHistory: false,
          customChecklists: false,
          premiumMotivationalMessages: false,
          profileInsights: false,
          fullCalendarSync: false,
          adFree: false,
          exportablePDFs: false,
          aiInsights: false,
          prioritySupport: false,
          advancedAnalytics: false
        };
        await user.save();
      }
    }
    
    next();
  } catch (error) {
    console.error('Trial status check error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Check and handle subscription expiration for monthly/yearly plans
const checkSubscriptionExpiration = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (user.subscription.status === 'active' && user.subscription.endDate) {
      const endDate = new Date(user.subscription.endDate);
      const now = new Date();
      
      if (now > endDate) {
        // Subscription expired, downgrade to free
        user.subscription.status = 'expired';
        user.subscription.plan = 'free';
        user.subscription.expiredAt = new Date();
        user.features = {
          unlimitedEvents: false,
          advancedBudgetTracking: false,
          fullMoodHistory: false,
          customChecklists: false,
          premiumMotivationalMessages: false,
          profileInsights: false,
          fullCalendarSync: false,
          adFree: false,
          exportablePDFs: false,
          aiInsights: false,
          prioritySupport: false,
          advancedAnalytics: false
        };
        await user.save();
        console.log(`[Subscription] User ${user._id} subscription expired and downgraded to free`);
      }
    }
    
    next();
  } catch (error) {
    console.error('Subscription expiration check error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Require premium plan or active trial
const requirePremium = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (isAdmin(user)) return next();
    const plan = user?.subscription?.plan;
    const status = user?.subscription?.status;
    const isPremium = plan && plan !== 'free';
    const isTrialActive = status === 'trial' && user.subscription.trialEndDate && new Date() <= new Date(user.subscription.trialEndDate);
    if (isPremium || isTrialActive) return next();
    return res.status(403).json({ success: false, message: 'Premium required' });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
};

module.exports = {
  checkPremiumFeature,
  checkUsageLimit,
  updateUsage,

  checkTrialStatus,
  checkSubscriptionExpiration,

  requirePremium,
  isAdmin
}; 