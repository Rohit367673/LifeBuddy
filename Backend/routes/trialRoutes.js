const express = require('express');
const router = express.Router();
const { authenticateUser: auth } = require('../middlewares/authMiddleware');
const TrialTask = require('../models/TrialTask');
const User = require('../models/User');

/**
 * GET /api/trial/progress
 * Get user's trial task progress
 */
router.get('/progress', auth, async (req, res) => {
  try {
    const progress = await TrialTask.getTrialProgress(req.user.id);
    
    res.json({
      success: true,
      progress
    });
  } catch (error) {
    console.error('Trial progress error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/trial/complete-task
 * Mark a trial task as completed
 */
router.post('/complete-task', auth, async (req, res) => {
  try {
    const { taskType, metadata = {} } = req.body;
    
    if (!['watch_ad', 'follow_instagram', 'share_with_friends'].includes(taskType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid task type'
      });
    }

    // Find or create the task
    let task = await TrialTask.findOne({
      user: req.user.id,
      taskType,
      expiresAt: { $gt: new Date() }
    });

    if (!task) {
      task = new TrialTask({
        user: req.user.id,
        taskType,
        metadata
      });
    }

    // Mark as completed
    task.completed = true;
    task.completedAt = new Date();
    task.metadata = { ...task.metadata, ...metadata };
    
    await task.save();

    // Check if all tasks are completed
    const hasCompletedAll = await TrialTask.hasCompletedAllTasks(req.user.id);
    
    if (hasCompletedAll) {
      // Activate trial subscription (align with User schema)
      await User.findByIdAndUpdate(req.user.id, {
        'subscription.status': 'trial',
        'subscription.trialEndDate': new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        features: {
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
        }
      });
    }

    const progress = await TrialTask.getTrialProgress(req.user.id);

    res.json({
      success: true,
      task,
      progress,
      trialActivated: hasCompletedAll
    });
  } catch (error) {
    console.error('Complete trial task error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/trial/verify-share
 * Verify that user has shared with friends
 */
router.post('/verify-share', auth, async (req, res) => {
  try {
    const { shareCount = 1, shareMethod = 'manual' } = req.body;
    
    // Generate verification code
    const verificationCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const task = await TrialTask.findOneAndUpdate(
      {
        user: req.user.id,
        taskType: 'share_with_friends',
        expiresAt: { $gt: new Date() }
      },
      {
        $set: {
          completed: true,
          completedAt: new Date(),
          'metadata.shareCount': shareCount,
          'metadata.shareMethod': shareMethod,
          'metadata.verificationCode': verificationCode
        }
      },
      { upsert: true, new: true }
    );

    // Check if all tasks are completed
    const hasCompletedAll = await TrialTask.hasCompletedAllTasks(req.user.id);
    
    if (hasCompletedAll) {
      await User.findByIdAndUpdate(req.user.id, {
        'subscription.status': 'trial',
        'subscription.trialEndDate': new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        features: {
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
        }
      });
    }

    res.json({
      success: true,
      verificationCode,
      trialActivated: hasCompletedAll
    });
  } catch (error) {
    console.error('Verify share error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/trial/status
 * Get current trial status for user
 */
router.get('/status', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('subscription');
    const progress = await TrialTask.getTrialProgress(req.user.id);
    
    const isOnTrial = user.subscription?.status === 'trial' && 
                     user.subscription?.trialEndDate && 
                     new Date(user.subscription.trialEndDate) > new Date();

    res.json({
      success: true,
      isOnTrial,
      subscription: user.subscription,
      progress
    });
  } catch (error) {
    console.error('Trial status error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
