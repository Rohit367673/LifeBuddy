const express = require('express');
const router = express.Router();
const PremiumTask = require('../models/PremiumTask');
const { authenticateUser } = require('../middlewares/authMiddleware');
const { requirePremium } = require('../middlewares/premiumMiddleware');
const User = require('../models/User');
const { MessagingService } = require('../services/messagingService');
const { generateScheduleWithOpenRouter } = require('../services/openRouterService');
const ScheduleInteraction = require('../models/ScheduleInteraction');

// Use global requirePremium middleware (premium plan, active trial, or admin bypass)

// Send daily task notification via user's preferred platform
async function sendDailyTaskNotification(userId, task, dayNumber) {
  try {
    const user = await User.findById(userId);
    if (!user) {
      console.log('User not found:', userId);
      return;
    }

    const messagingService = new MessagingService();
    const result = await messagingService.sendMessage(user, task, dayNumber);
    
    if (result) {
      console.log(`Daily task notification sent to user ${user.email} via ${user.notificationPlatform} for day ${dayNumber}`);
    } else {
      console.log(`Failed to send notification to user ${user.email} for day ${dayNumber}`);
    }
  } catch (error) {
    console.error('Error sending daily task notification:', error);
  }
}

// Helper: Generate schedule via OpenRouter (configured model; service handles model fallback)
async function generateScheduleWithFallback(title, requirements, startDate, endDate, userContext) {
  const schedule = await generateScheduleWithOpenRouter(title, requirements, startDate, endDate, userContext);
  return { schedule, source: 'OpenRouter' };
}

// Create a new premium task and trigger schedule generation
router.post('/setup', authenticateUser, requirePremium, async (req, res) => {
  try {
    const { 
      title, 
      description, 
      requirements, 
      startDate, 
      endDate, 
      consentGiven,
      notificationPlatform,
      contactInfo 
    } = req.body;
    
    if (!title || !startDate || !endDate || !consentGiven) {
      return res.status(400).json({ message: 'Missing required fields or consent.' });
    }

    // Update user's notification preferences
    if (notificationPlatform && contactInfo) {
      await User.findByIdAndUpdate(req.user._id, {
        notificationPlatform,
        ...(notificationPlatform === 'whatsapp' && { phoneNumber: contactInfo }),
        ...(notificationPlatform === 'telegram' && { telegramUsername: contactInfo }),
        ...(notificationPlatform === 'email' && { email: contactInfo })
      });
    }

    // Build user context
    const ctxUser = await User.findById(req.user._id).lean();
    const userContext = {
      userId: String(ctxUser._id),
      username: ctxUser.username,
      timezone: ctxUser.preferences?.timezone || 'UTC',
      subscription: ctxUser.subscription?.plan || 'free',
      notificationPlatform: ctxUser.notificationPlatform || 'email'
    };

    // Generate schedule via OpenRouter (configured model)
    let schedule, scheduleSource;
    try {
      const result = await generateScheduleWithFallback(title, requirements, startDate, endDate, userContext);
      schedule = result.schedule;
      scheduleSource = result.source;
      console.log(`✅ Schedule generated with ${scheduleSource}`);
    } catch (err) {
      console.error('❌ OpenRouter failed:', err.message);
      return res.status(500).json({ 
        message: `Failed to generate schedule: ${err.message}`,
        suggestion: 'Please check your API keys or try again later.'
      });
    }

    // Save to DB
    const premiumTask = new PremiumTask({
      user: req.user._id,
      title,
      description,
      requirements,
      startDate,
      endDate,
      generatedSchedule: schedule,
      consentGiven: true,
      currentDay: 1,
      scheduleSource
    });
    await premiumTask.save();

    // Send first day notification
    await sendDailyTaskNotification(req.user._id, premiumTask, 1);

    res.json({ 
      message: `Premium task created with ${scheduleSource} schedule!`, 
      task: premiumTask,
      nextDay: 2,
      scheduleSource
    });

  } catch (error) {
    console.error('Error creating premium task:', error);
    res.status(500).json({ 
      message: error.message || 'Internal server error',
      suggestion: 'Please check your API configuration and try again.'
    });
  }
});

// Record a schedule interaction (accepted, skipped, rescheduled, completed, snoozed)
router.post('/:id/interactions', authenticateUser, requirePremium, async (req, res) => {
  try {
    const { id } = req.params;
    const { action, metadata = {} } = req.body;
    if (!['accepted', 'skipped', 'rescheduled', 'completed', 'snoozed'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action' });
    }
    const task = await PremiumTask.findOne({ _id: id, user: req.user._id });
    if (!task) return res.status(404).json({ message: 'Task not found.' });
    const record = new ScheduleInteraction({
      user: req.user._id,
      premiumTask: task._id,
      action,
      metadata,
    });
    await record.save();
    res.json({ message: 'Interaction recorded', interactionId: record._id });
  } catch (err) {
    console.error('Record interaction error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// Mark a subtask as complete or skipped and handle next day logic
router.post('/:id/mark', authenticateUser, requirePremium, async (req, res) => {
  try {
    const { id } = req.params;
    const { date, status, dayNumber } = req.body;
    if (!date || !['completed', 'skipped'].includes(status)) {
      return res.status(400).json({ message: 'Invalid date or status.' });
    }

    const task = await PremiumTask.findOne({ _id: id, user: req.user._id });
    if (!task) return res.status(404).json({ message: 'Task not found.' });

    // Find the subtask for the given date
    const subtask = task.generatedSchedule.find(s =>
      new Date(s.date).toDateString() === new Date(date).toDateString()
    );
    if (!subtask) return res.status(404).json({ message: 'Subtask not found for this date.' });

    // Only allow marking if still pending
    if (subtask.status !== 'pending') {
      return res.status(400).json({ message: 'Subtask already marked.' });
    }

    subtask.status = status;

    // Update stats and streaks
    if (status === 'completed') {
      task.stats.completed += 1;
      task.stats.currentStreak += 1;
      if (task.stats.currentStreak > task.stats.bestStreak) {
        task.stats.bestStreak = task.stats.currentStreak;
      }
      // Send next day notification if completed
      const nextDay = dayNumber + 1;
      const nextSubtask = task.generatedSchedule.find(s => s.day === nextDay);
      if (nextSubtask) {
        await sendDailyTaskNotification(req.user._id, task, nextDay);
        task.currentDay = nextDay;
      }
    } else if (status === 'skipped') {
      task.stats.skipped += 1;
      task.stats.currentStreak = 0; // streak broken
      // Regenerate schedule (OpenRouter only)
      const ctxUser = await User.findById(req.user._id).lean();
      const userContext = {
        userId: String(ctxUser._id),
        username: ctxUser.username,
        timezone: ctxUser.preferences?.timezone || 'UTC',
        subscription: ctxUser.subscription?.plan || 'free',
        notificationPlatform: ctxUser.notificationPlatform || 'email'
      };
      const { schedule } = await generateScheduleWithFallback(task.title, task.requirements, task.startDate, task.endDate, userContext);
      task.generatedSchedule = schedule;
      task.currentDay = 1;
      // Send new first day notification
      await sendDailyTaskNotification(req.user._id, task, 1);
    }

    task.updatedAt = new Date();
    await task.save();

    res.json({ 
      message: 'Subtask updated.', 
      task,
      nextDay: status === 'completed' ? dayNumber + 1 : 1,
      rescheduled: status === 'skipped'
    });
  } catch (err) {
    console.error('Mark subtask error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// Lightweight event capture for accept/skip/snooze/reschedule/complete
router.post('/:id/event', authenticateUser, requirePremium, async (req, res) => {
  try {
    const { action, metadata } = req.body;
    if (!['accepted', 'skipped', 'rescheduled', 'completed', 'snoozed'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action' });
    }
    const rec = new ScheduleInteraction({ user: req.user._id, premiumTask: req.params.id, action, metadata });
    await rec.save();
    res.json({ message: 'Captured', id: rec._id });
  } catch (err) {
    console.error('Event capture error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// Get today's scheduled subtask and motivation tip
router.get('/today', authenticateUser, requirePremium, async (req, res) => {
  try {
    // Find the most recent active premium task for the user
    const task = await PremiumTask.findOne({
      user: req.user._id,
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() }
    }).sort({ createdAt: -1 });

    if (!task) {
      return res.status(404).json({ message: 'No active premium task found for today.' });
    }

    // Find today's subtask based on current day
    const todaySubtask = task.generatedSchedule.find(s => s.day === task.currentDay);

    if (!todaySubtask) {
      return res.status(404).json({ message: 'No scheduled subtask for today.' });
    }

    // Fetch user's notification platform
    const user = await User.findById(req.user._id);

    res.json({
      taskId: task._id,
      title: task.title,
      description: task.description,
      subtask: todaySubtask.subtask,
      status: todaySubtask.status,
      motivationTip: todaySubtask.motivationTip,
      resources: todaySubtask.resources || [],
      exercises: todaySubtask.exercises || [],
      notes: todaySubtask.notes || '',
      dayNumber: task.currentDay,
      streak: task.stats.currentStreak,
      bestStreak: task.stats.bestStreak,
      completed: task.stats.completed,
      skipped: task.stats.skipped,
      notificationPlatform: user ? user.notificationPlatform : 'email'
    });
  } catch (err) {
    console.error("Fetch today's subtask error:", err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// Get weekly summary
router.get('/weekly-summary', authenticateUser, requirePremium, async (req, res) => {
  try {
    // Find the most recent active premium task for the user
    const task = await PremiumTask.findOne({
      user: req.user._id
    }).sort({ createdAt: -1 });

    if (!task) {
      return res.status(404).json({ message: 'No premium task found.' });
    }

    // Calculate the start of the current week (Monday)
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 (Sun) - 6 (Sat)
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));
    monday.setHours(0, 0, 0, 0);

    // Get all subtasks for this week
    const weekSubtasks = task.generatedSchedule.filter(s => {
      const d = new Date(s.date);
      return d >= monday && d <= today;
    });

    const completed = weekSubtasks.filter(s => s.status === 'completed').length;
    const skipped = weekSubtasks.filter(s => s.status === 'skipped').length;
    const pending = weekSubtasks.filter(s => s.status === 'pending').length;

    // For graph: array of { date, status }
    const dailyStatus = weekSubtasks.map(s => ({
      date: s.date,
      status: s.status
    }));

    res.json({
      taskId: task._id,
      title: task.title,
      week: {
        start: monday,
        end: today,
        completed,
        skipped,
        pending,
        dailyStatus
      },
      streak: task.stats.currentStreak,
      bestStreak: task.stats.bestStreak,
      totalCompleted: task.stats.completed,
      totalSkipped: task.stats.skipped
    });
  } catch (err) {
    console.error('Weekly summary error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// Regenerate schedule
router.post('/:id/regenerate', authenticateUser, requirePremium, async (req, res) => {
  try {
    const { id } = req.params;
    const task = await PremiumTask.findOne({ _id: id, user: req.user._id });
    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    const ctxUser = await User.findById(req.user._id).lean();
    const userContext = {
      userId: String(ctxUser._id),
      username: ctxUser.username,
      timezone: ctxUser.preferences?.timezone || 'UTC',
      subscription: ctxUser.subscription?.plan || 'free',
      notificationPlatform: ctxUser.notificationPlatform || 'email'
    };

    const { schedule, source } = await generateScheduleWithFallback(task.title, task.requirements, task.startDate, task.endDate, userContext);

    // Update task with new schedule
    task.generatedSchedule = schedule;
    task.currentDay = 1;
    task.scheduleSource = source;
    task.updatedAt = new Date();
    await task.save();

    // Send new first day notification
    await sendDailyTaskNotification(req.user._id, task, 1);

    res.json({ 
      message: `Schedule regenerated with ${source}!`, 
      task,
      nextDay: 2
    });
  } catch (err) {
    console.error('Regenerate schedule error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// Delete current active premium task for the user
router.delete('/current', authenticateUser, requirePremium, async (req, res) => {
  try {
    const task = await PremiumTask.findOneAndDelete({
      user: req.user._id,
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() }
    });
    if (!task) {
      return res.status(404).json({ message: 'No active premium task found.' });
    }
    res.json({ message: 'Current premium task deleted.' });
  } catch (err) {
    console.error('Delete current premium task error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// Send a test FCM notification to the current user
router.post('/test-notification', authenticateUser, requirePremium, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user || !user.fcmToken) {
      return res.status(400).json({ message: 'No FCM token registered for this user.' });
    }
    const message = {
      notification: {
        title: 'LifeBuddy AI Test Notification',
                  body: 'This is a test push notification for your LifeBuddy schedule.'
      },
      token: user.fcmToken
    };
    // await admin.messaging().send(message); // intentionally disabled
    res.json({ message: 'Test notification sent!' });
  } catch (err) {
    console.error('Error sending test FCM notification:', err);
    res.status(500).json({ message: 'Failed to send test notification.' });
  }
});

// Get last 35 days of premium task completion/skipped status for activity calendar
router.get('/calendar-status', authenticateUser, requirePremium, async (req, res) => {
  try {
    // Find the most recent active premium task for the user
    const task = await PremiumTask.findOne({
      user: req.user._id
    }).sort({ createdAt: -1 });

    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 34; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      d.setHours(0, 0, 0, 0);
      let status = 'none';
      if (task && Array.isArray(task.generatedSchedule)) {
        const subtask = task.generatedSchedule.find(s => {
          const sd = new Date(s.date);
          sd.setHours(0, 0, 0, 0);
          return sd.getTime() === d.getTime();
        });
        if (subtask) {
          if (subtask.status === 'completed') status = 'completed';
          else if (subtask.status === 'skipped') status = 'skipped';
        }
      }
      days.push({ date: d.toISOString().split('T')[0], status });
    }
    res.json({ days });
  } catch (err) {
    console.error('Calendar status error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

module.exports = router;

// Export for testing
// module.exports.generateMockSchedule = generateEnhancedMockSchedule;
// module.exports.generateEnhancedMockSchedule = generateEnhancedMockSchedule; 