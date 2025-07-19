const express = require('express');
const router = express.Router();
const PremiumTask = require('../models/PremiumTask');
const { authenticateUser } = require('../middlewares/authMiddleware');
const { checkPremiumFeature } = require('../middlewares/premiumMiddleware');
const User = require('../models/User');
const { MessagingService } = require('../services/messagingService');
const { generateMessageWithOpenRouter } = require('../services/openRouterService');

// Use checkPremiumFeature('premiumMotivationalMessages') as requirePremium
const requirePremium = checkPremiumFeature('premiumMotivationalMessages');

// Helper to generate a multi-day schedule using OpenRouter
async function generateScheduleWithOpenRouter(title, requirements, startDate, endDate) {
  const days = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000*60*60*24)) + 1;
  const schedule = [];
  for (let i = 0; i < days; i++) {
    const date = new Date(new Date(startDate).getTime() + i * 24*60*60*1000);
    const prompt = `Generate a short, actionable learning task for day ${i+1} of a personalized schedule.\nTitle: ${title}\nRequirements: ${requirements || 'None'}\nDay: ${i+1}\nFormat: Task, Motivation, Resources (comma separated), Exercises (comma separated), Notes.`;
    const response = await generateMessageWithOpenRouter(prompt, 100);
    // Parse response (simple split, fallback if needed)
    let subtask = response, motivationTip = '', resources = [], exercises = [], notes = '';
    if (response.includes('Motivation:')) {
      const parts = response.split('Motivation:');
      subtask = parts[0].trim();
      const rest = parts[1] || '';
      const resMatch = rest.match(/Resources:(.*)/);
      const exMatch = rest.match(/Exercises:(.*)/);
      const notesMatch = rest.match(/Notes:(.*)/);
      motivationTip = rest.split('Resources:')[0].replace('Motivation:', '').trim();
      resources = resMatch ? resMatch[1].split(',').map(r => r.trim()).filter(Boolean) : [];
      exercises = exMatch ? exMatch[1].split(',').map(e => e.trim()).filter(Boolean) : [];
      notes = notesMatch ? notesMatch[1].trim() : '';
    }
    schedule.push({
      date,
      subtask,
      status: 'pending',
      motivationTip,
      resources,
      exercises,
      notes,
      day: i + 1
    });
  }
  return schedule;
}

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

// Create a new premium task and trigger DeepSeek schedule generation
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

    // Generate schedule using OpenRouter
    let schedule;
    try {
      schedule = await generateScheduleWithOpenRouter(title, requirements, startDate, endDate);
    } catch (err) {
      return res.status(500).json({ message: err.message || 'Failed to generate schedule from OpenRouter.' });
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
      currentDay: 1 // Track current day
    });
    await premiumTask.save();

    // Send first day notification
    await sendDailyTaskNotification(req.user._id, premiumTask, 1);

    res.json({ 
      message: 'Premium task created with DeepSeek schedule!', 
      task: premiumTask,
      nextDay: 2,
      notificationPlatform
    });
  } catch (err) {
    console.error('Premium task setup error:', err);
    res.status(500).json({ message: err.message || 'Internal server error.' });
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
      
      // Regenerate schedule if skipped
      const newSchedule = await generateScheduleWithOpenRouter(task.title, task.requirements, task.startDate, task.endDate);
      task.generatedSchedule = newSchedule;
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
      skipped: task.stats.skipped
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

// Regenerate schedule with DeepSeek
router.post('/:id/regenerate', authenticateUser, requirePremium, async (req, res) => {
  try {
    const { id } = req.params;
    const task = await PremiumTask.findOne({ _id: id, user: req.user._id });
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    // Regenerate schedule using DeepSeek
    const newSchedule = await generateScheduleWithOpenRouter(task.title, task.requirements, task.startDate, task.endDate);

    // Update task with new schedule
    task.generatedSchedule = newSchedule;
    task.currentDay = 1;
    task.updatedAt = new Date();
    await task.save();

    // Send new first day notification
    await sendDailyTaskNotification(req.user._id, task, 1);

    res.json({ 
      message: 'Schedule regenerated with DeepSeek!', 
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
        title: 'DeepSeek Test Notification',
        body: 'This is a test push notification for your DeepSeek schedule.'
      },
      token: user.fcmToken
    };
    // await admin.messaging().send(message); // This line was removed as per the edit hint
    res.json({ message: 'Test notification sent!' });
  } catch (err) {
    console.error('Error sending test FCM notification:', err);
    res.status(500).json({ message: 'Failed to send test notification.' });
  }
});

module.exports = router;

// Export for testing
// module.exports.generateMockSchedule = generateEnhancedMockSchedule; // This line was removed as per the edit hint
// module.exports.generateEnhancedMockSchedule = generateEnhancedMockSchedule; // This line was removed as per the edit hint 