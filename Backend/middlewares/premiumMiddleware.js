const User = require('../models/User');

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
          exportablePDFs: false
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

module.exports = {
  checkPremiumFeature,
  checkUsageLimit,
  updateUsage,
  checkTrialStatus
}; 