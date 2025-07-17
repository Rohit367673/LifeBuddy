const express = require('express');
const router = express.Router();
const PremiumTask = require('../models/PremiumTask');
const { authenticateUser } = require('../middlewares/authMiddleware');
const { checkPremiumFeature } = require('../middlewares/premiumMiddleware');

// Use checkPremiumFeature('premiumMotivationalMessages') as requirePremium
const requirePremium = checkPremiumFeature('premiumMotivationalMessages');

// Create a new premium task and trigger DeepSeek schedule generation
router.post('/setup', authenticateUser, requirePremium, async (req, res) => {
  try {
    const { title, description, requirements, startDate, endDate, consentGiven } = req.body;
    if (!title || !startDate || !endDate || !consentGiven) {
      return res.status(400).json({ message: 'Missing required fields or consent.' });
    }

    // --- DeepSeek API call (mocked for now) ---
    // Replace this with a real API call and key
    // const deepSeekResponse = await fetch('https://api.deepseek.com/v1/schedule', { ... });
    // const deepSeekData = await deepSeekResponse.json();
    // For now, generate a mock schedule:
    const days = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000*60*60*24)) + 1;
    const schedule = Array.from({ length: days }, (_, i) => {
      const date = new Date(new Date(startDate).getTime() + i * 24*60*60*1000);
      return {
        date,
        subtask: `Subtask for ${title} - Day ${i+1}`,
        status: 'pending',
        motivationTip: `Stay focused! This is your tip for day ${i+1}.`
      };
    });

    // Save to DB
    const premiumTask = new PremiumTask({
      user: req.user._id,
      title,
      description,
      requirements,
      startDate,
      endDate,
      generatedSchedule: schedule,
      consentGiven: true
    });
    await premiumTask.save();

    res.json({ message: 'Premium task created!', task: premiumTask });
  } catch (err) {
    console.error('Premium task setup error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// Mark a subtask as complete or skipped
router.post('/:id/mark', authenticateUser, requirePremium, async (req, res) => {
  try {
    const { id } = req.params;
    const { date, status } = req.body;
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
    } else if (status === 'skipped') {
      task.stats.skipped += 1;
      task.stats.currentStreak = 0; // streak broken
    }

    task.updatedAt = new Date();
    await task.save();

    res.json({ message: 'Subtask updated.', task });
  } catch (err) {
    console.error('Mark subtask error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// Get today’s scheduled subtask and motivation tip
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

    // Find today's subtask
    const today = new Date();
    const subtask = task.generatedSchedule.find(s =>
      new Date(s.date).toDateString() === today.toDateString()
    );

    if (!subtask) {
      return res.status(404).json({ message: 'No scheduled subtask for today.' });
    }

    res.json({
      taskId: task._id,
      title: task.title,
      description: task.description,
      subtask: subtask.subtask,
      status: subtask.status,
      motivationTip: subtask.motivationTip,
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
  // TODO: Call DeepSeek again, update schedule
  res.json({ message: 'Regenerate endpoint hit!' });
});

module.exports = router; 