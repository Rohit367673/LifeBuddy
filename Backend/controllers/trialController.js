const TrialTask = require('../models/TrialTask');
const User = require('../models/User');

// Get trial progress for the current user
exports.getTrialProgress = async (req, res) => {
  try {
    const userId = req.user.id;
    const progress = await TrialTask.getTrialProgress(userId);
    res.json(progress);
  } catch (error) {
    console.error('Error fetching trial progress:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Complete a trial task
exports.completeTrialTask = async (req, res) => {
  try {
    const userId = req.user.id;
    const { taskType } = req.body;

    // Validate task type
    if (!['watch_ad', 'follow_instagram', 'share_with_friends'].includes(taskType)) {
      return res.status(400).json({ error: 'Invalid task type' });
    }

    // Find existing task for this user and type
    let task = await TrialTask.findOne({ 
      user: userId, 
      taskType,
      expiresAt: { $gt: new Date() }
    });

    if (!task) {
      // Create a new task if none exists
      task = new TrialTask({
        user: userId,
        taskType,
      });
    }

    // Mark as completed
    task.completed = true;
    task.completedAt = new Date();

    // Save the task
    await task.save();

    // Check if all tasks are completed
    const isTrialEligible = await TrialTask.hasCompletedAllTasks(userId);
    if (isTrialEligible) {
      // Update user's trial status
      await User.findByIdAndUpdate(userId, { 
        $set: { 
          'subscription.status': 'trial',
          'subscription.trialStartDate': new Date(),
          'subscription.trialEndDate': new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        } 
      });
    }

    res.json({ success: true, isTrialEligible });
  } catch (error) {
    console.error('Error completing trial task:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
