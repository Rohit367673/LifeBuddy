const express = require('express');
const User = require('../models/User');
const Event = require('../models/Event');
const Task = require('../models/Task');
const { authenticateUser } = require('../middlewares/authMiddleware');
const Achievement = require('../models/Achievement');
const jwt = require('jsonwebtoken');
const { MessagingService } = require('../services/messagingService');
const { exportUserTrainingData, fineTuneUserModel, exportUserSFT, runLocalLoraTraining } = require('../services/trainingService');
const Activity = require('../models/Activity'); // Fixed import path

const router = express.Router();

// Apply authentication to all routes

// Get user profile
router.get('/profile', authenticateUser, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    // Get user stats
    const stats = await User.getUserStats(req.user._id);
    
    // Get user achievements and badges
    const achievements = await Achievement.find({ user: req.user._id }).sort({ createdAt: -1 });
    const earnedBadges = achievements.map(achievement => achievement.badgeType).filter(Boolean);
    
    // Get streak information (prefer precomputed stats on user for accuracy)
    const streak = await User.getUserStreak(req.user._id);
    const currentStreak = (user?.stats?.taskStreak ?? streak.currentStreak) || 0;
    const longestStreak = (user?.stats?.longestStreak ?? streak.longestStreak) || 0;

    // Build task completion dates for monthly calendar and activity
    const taskHistory = (user?.stats?.taskCompletionHistory || []).map(d => new Date(d));
    const dayCountsMap = {};
    for (const d of taskHistory) {
      const ds = new Date(d).toISOString().slice(0, 10);
      dayCountsMap[ds] = (dayCountsMap[ds] || 0) + 1;
    }
    const completedTaskDates = Object.keys(dayCountsMap);
    const completedTaskDatesDetailed = completedTaskDates.map(date => ({ date, completedCount: dayCountsMap[date] }));
    
    res.json({
      ...user.toObject(),
      stats,
      badges: earnedBadges,
      currentStreak,
      longestStreak,
      totalTasks: stats.totalTasks || 0,
      completedTasks: stats.completedTasks || 0,
      completedTaskDates,
      completedTaskDatesDetailed
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update user profile
router.put('/profile', authenticateUser, async (req, res) => {
  try {
    const { personalQuote, profileVisibility, phoneNumber } = req.body;
    
    const updateFields = { personalQuote, profileVisibility };
    if (typeof phoneNumber === 'string') updateFields.phoneNumber = phoneNumber;
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      updateFields,
      { new: true, runValidators: true }
    ).select('-password');
    
    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating user profile:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update notification platform
router.put('/notification-platform', authenticateUser, async (req, res) => {
  try {
    const { notificationPlatform } = req.body;
    
    if (!['whatsapp', 'telegram', 'email'].includes(notificationPlatform)) {
      return res.status(400).json({ message: 'Invalid notification platform' });
    }
    
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { notificationPlatform },
      { new: true, runValidators: true }
    ).select('-password');
    
    res.json({ 
      message: 'Notification platform updated successfully',
      notificationPlatform: updatedUser.notificationPlatform 
    });
  } catch (error) {
    console.error('Error updating notification platform:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get public profile by username or ID
router.get('/profile/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    let user;
    if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
      user = await User.findById(identifier);
    } else {
      user = await User.findOne({ username: identifier });
      if (!user) {
        user = await User.findOne({ firebaseUid: identifier });
      }
    }
    if (!user) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    // Check visibility
    if (user.profileVisibility === 'private') {
      return res.status(403).json({ message: 'This profile is private' });
    }
    // Get public profile data
    const stats = await User.getUserStats(user._id);
    const achievements = await Achievement.find({ user: user._id }).sort({ createdAt: -1 });
    const earnedBadges = achievements.map(achievement => achievement.badgeType).filter(Boolean);
    const streak = await User.getUserStreak(user._id);
    // Prefer precomputed streaks on user.stats for accuracy, fallback to calculated
    const currentStreak = (user?.stats?.taskStreak ?? streak.currentStreak) || 0;
    const longestStreak = (user?.stats?.longestStreak ?? streak.longestStreak) || 0;
    // Minimal, non-sensitive premium signal for badges/UI
    const isTrial = user?.subscription?.status === 'trial';
    const isPaid = user?.subscription?.plan && user.subscription.plan !== 'free' && user.subscription.status === 'active';
    const premium = !!(isTrial || isPaid);
    const tier = isTrial ? 'Trial' : (isPaid ? 'Premium' : 'Free');
    const isOwner = user.email === 'rohit367673@gmail.com' && (user.username === 'rohit' || (user.displayName && user.displayName.toLowerCase() === 'rohit'));
    // Ensure all required fields are present
    res.json({
      displayName: user.displayName || '',
      username: user.username || '',
      avatar: user.avatar || '',
      personalQuote: user.personalQuote || '',
      currentStreak,
      longestStreak,
      totalTasks: stats.totalTasks || 0,
      completedTasks: stats.completedTasks || 0,
      badges: earnedBadges,
      joinedAt: user.createdAt,
      premium,
      tier,
      ...(isOwner ? { owner: true, ownerEmail: user.email } : {})
    });
  } catch (error) {
    console.error('Error fetching public profile:', error, error.stack);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// Get user dashboard data
router.get('/dashboard', authenticateUser, async (req, res) => {
  try {
    const userId = req.user._id;

    // Get recent events
    const recentEvents = await Event.find({ 
      user: userId, 
      status: { $ne: 'archived' } 
    })
      .sort('-createdAt')
      .limit(5)
      .lean();

    // Get upcoming tasks
    const upcomingTasks = await Task.find({
      user: userId,
      status: { $ne: 'completed' },
      dueDate: { $gte: new Date() }
    })
      .sort('dueDate')
      .limit(10)
      .populate('event', 'title type')
      .lean();

    // Get overdue tasks
    const overdueTasks = await Task.find({
      user: userId,
      status: { $ne: 'completed' },
      dueDate: { $lt: new Date() }
    })
      .sort('dueDate')
      .limit(5)
      .populate('event', 'title type')
      .lean();

    // Get today's tasks
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todaysTasks = await Task.find({
      user: userId,
      dueDate: {
        $gte: today,
        $lt: tomorrow
      }
    })
      .populate('event', 'title type')
      .lean();

    // Calculate quick stats
    const totalEvents = await Event.countDocuments({ 
      user: userId, 
      status: { $ne: 'archived' } 
    });
    
    const activeEvents = await Event.countDocuments({ 
      user: userId, 
      status: { $in: ['planning', 'in-progress'] }
    });

    const totalTasks = await Task.countDocuments({ user: userId });
    const completedTasks = await Task.countDocuments({ 
      user: userId, 
      status: 'completed' 
    });

    const pendingTasks = await Task.countDocuments({
      user: userId,
      status: { $ne: 'completed' }
    });

    res.json({
      recentEvents,
      upcomingTasks,
      overdueTasks,
      todaysTasks,
      stats: {
        totalEvents,
        activeEvents,
        totalTasks,
        completedTasks,
        pendingTasks,
        completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
      }
    });

  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({
      message: 'Error fetching dashboard data.',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get user statistics
router.get('/stats', authenticateUser, async (req, res) => {
  try {
    const userId = req.user._id;
    const { period } = req.query;

    // Handle previous-period stats specifically requested by frontend
    if (period === 'prev') {
      // Define previous 7-day window (excluding current 7 days)
      const endOfPrevWindow = new Date();
      endOfPrevWindow.setHours(0, 0, 0, 0);
      const startOfCurrentWindow = new Date(endOfPrevWindow);
      startOfCurrentWindow.setDate(startOfCurrentWindow.getDate() - 7);
      const startOfPrevWindow = new Date(startOfCurrentWindow);
      startOfPrevWindow.setDate(startOfPrevWindow.getDate() - 7);

      const [completedTasksPrev, totalPointsPrevAgg] = await Promise.all([
        Task.countDocuments({
          user: userId,
          status: 'completed',
          completedAt: { $gte: startOfPrevWindow, $lt: startOfCurrentWindow }
        }),
        Achievement.aggregate([
          { $match: { user: userId, createdAt: { $gte: startOfPrevWindow, $lt: startOfCurrentWindow } } },
          { $group: { _id: null, total: { $sum: { $ifNull: ['$points', 0] } } } }
        ])
      ]);

      const totalPointsPrev = totalPointsPrevAgg?.[0]?.total || 0;
      return res.json({ completedTasks: completedTasksPrev, totalPoints: totalPointsPrev });
    }

    // Default: return overall dashboard stats expected by frontend
    const now = new Date();
    const [
      totalEvents,
      activeEvents,
      totalTasks,
      completedTasks,
      pendingTasks,
      overdueTasks,
      userDoc,
      totalPointsAgg
    ] = await Promise.all([
      Event.countDocuments({ user: userId, status: { $ne: 'archived' } }),
      Event.countDocuments({ user: userId, status: { $in: ['planning', 'in-progress'] } }),
      Task.countDocuments({ user: userId }),
      Task.countDocuments({ user: userId, status: 'completed' }),
      Task.countDocuments({ user: userId, status: { $ne: 'completed' } }),
      Task.countDocuments({ user: userId, status: { $ne: 'completed' }, dueDate: { $lt: now } }),
      User.findById(userId).select('stats.moodStreak'),
      Achievement.aggregate([
        { $match: { user: userId } },
        { $group: { _id: null, total: { $sum: { $ifNull: ['$points', 0] } } } }
      ])
    ]);

    const totalPoints = totalPointsAgg?.[0]?.total || 0;
    const moodStreak = userDoc?.stats?.moodStreak || 0;

    // Optional: productivity data (daily completed tasks) for last N days
    let productivityData;
    const periodNum = parseInt(period, 10);
    if (!Number.isNaN(periodNum) && periodNum > 0) {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      start.setDate(start.getDate() - (periodNum - 1));

      const byDay = await Task.aggregate([
        { 
          $match: { 
            user: userId, 
            status: 'completed', 
            completedAt: { $gte: start } 
          } 
        },
        { 
          $project: { 
            day: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt' } } 
          } 
        },
        { $group: { _id: '$day', count: { $sum: 1 } } }
      ]);

      const countMap = {};
      for (const row of byDay) countMap[row._id] = row.count;

      const days = [];
      for (let i = periodNum - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() - i);
        const ds = d.toISOString().slice(0, 10);
        days.push({ date: ds, completed: countMap[ds] || 0 });
      }
      productivityData = days;
    }

    res.json({
      totalEvents,
      activeEvents,
      totalTasks,
      completedTasks,
      pendingTasks,
      overdueTasks,
      moodStreak,
      totalPoints,
      ...(productivityData ? { productivityData } : {})
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      message: 'Error fetching statistics.',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Update user preferences
router.patch('/preferences', authenticateUser, async (req, res) => {
  try {
    const { preferences } = req.body;
    const user = await User.findById(req.user._id);

    if (!preferences) {
      return res.status(400).json({
        message: 'Preferences data is required.'
      });
    }

    // Update preferences
    user.preferences = { ...user.preferences, ...preferences };
    await user.save();

    res.json({
      message: 'Preferences updated successfully.',
      preferences: user.preferences
    });

  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({
      message: 'Error updating preferences.',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Delete user account
router.delete('/account', authenticateUser, async (req, res) => {
  try {
    const userId = req.user._id;

    // Soft delete user
    await User.findByIdAndUpdate(userId, { isActive: false });

    // Optionally delete all user data
    if (req.query.deleteData === 'true') {
      await Event.deleteMany({ user: userId });
      await Task.deleteMany({ user: userId });
    }

    res.json({
      message: 'Account deleted successfully.'
    });

  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      message: 'Error deleting account.',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get user login history for activity calendar
router.get('/profile/login-history', authenticateUser, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('loginHistory');
    res.json({ loginHistory: user.loginHistory || [] });
  } catch (error) {
    console.error('Error fetching login history:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Set or update username
router.post('/set-username', authenticateUser, async (req, res) => {
  const { username } = req.body;
  if (!username || !username.match(/^[a-zA-Z0-9_]{3,30}$/)) {
    return res.status(400).json({ message: 'Invalid username. Use 3-30 letters, numbers, or underscores.' });
  }
  try {
    // Check if username is taken
    const existing = await User.findOne({ username: username.toLowerCase() });
    if (existing && existing._id.toString() !== req.user._id.toString()) {
      return res.status(409).json({ message: 'Username already taken.' });
    }
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { username: username.toLowerCase() },
      { new: true, runValidators: true }
    ).select('-password');
    res.json({ message: 'Username set successfully.', user });
  } catch (error) {
    console.error('Set username error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Search users by username (partial match)
router.get('/search', authenticateUser, async (req, res) => {
  const { q } = req.query;
  if (!q || q.length < 2) {
    return res.status(400).json({ message: 'Query too short.' });
  }
  try {
    const users = await User.find({
      username: { $regex: q, $options: 'i' }
    })
      .select('username displayName avatar') // Ensure these fields are selected
      .limit(10);
    res.json(users);
  } catch (error) {
    console.error('User search error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Send friend request
router.post('/friend-request/:username', authenticateUser, async (req, res) => {
  const { username } = req.params;
  if (!username) return res.status(400).json({ message: 'Username required.' });
  try {
    const friend = await User.findOne({ username: username.toLowerCase() });
    if (!friend) return res.status(404).json({ message: 'User not found.' });
    if (friend._id.equals(req.user._id)) return res.status(400).json({ message: 'Cannot add yourself.' });
    // For simplicity, auto-accept friend requests (bi-directional)
    const user = await User.findById(req.user._id);
    if (user.friends.includes(friend._id)) return res.status(409).json({ message: 'Already friends.' });
    user.friends.push(friend._id);
    friend.friends.push(user._id);
    await user.save();
    await friend.save();
    res.json({ message: 'Friend added successfully.' });
  } catch (error) {
    console.error('Friend request error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// List friends
router.get('/friends', authenticateUser, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('friends', 'username displayName avatar');
    res.json(user.friends || []);
  } catch (error) {
    console.error('List friends error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Export user training dataset (JSONL-style messages array)
router.get('/training/export', authenticateUser, async (req, res) => {
  try {
    const items = await exportUserTrainingData(req.user._id);
    res.json({ items, count: items.length });
  } catch (err) {
    console.error('Export training data error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Trigger fine-tuning job for current user
router.post('/training/fine-tune', authenticateUser, async (req, res) => {
  try {
    if (process.env.TRAINING_MODE === 'openai') {
      const job = await fineTuneUserModel(req.user._id);
      return res.json({ message: 'OpenAI fine-tune started', job });
    }
    // Default: local LoRA flow (requires GPU host)
    const result = await runLocalLoraTraining({ userId: req.user._id });
    res.json({ message: 'Local LoRA training finished', result });
  } catch (err) {
    console.error('Fine-tune start error:', err);
    res.status(500).json({ message: err.message || 'Internal server error' });
  }
});

// Export SFT JSONL
router.get('/training/sft', authenticateUser, async (req, res) => {
  try {
    const result = await exportUserSFT(req.user._id);
    res.json(result);
  } catch (err) {
    console.error('Export SFT error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update FCM token for the user
router.post('/fcm-token', authenticateUser, async (req, res) => {
  const { fcmToken } = req.body;
  if (!fcmToken) return res.status(400).json({ message: 'Missing FCM token.' });
  try {
    req.user.fcmToken = fcmToken;
    await req.user.save();
    res.json({ message: 'FCM token updated.' });
  } catch (err) {
    console.error('Error updating FCM token:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// Link Telegram chat ID to user securely using a token
router.post('/telegram/link', async (req, res) => {
  const { token, chatId } = req.body;
  if (!token || !chatId) {
    return res.status(400).json({ message: 'token and chatId are required' });
  }
  try {
    const secret = process.env.JWT_SECRET || 'telegram-link-secret';
    const payload = jwt.verify(token, secret);
    const userId = payload.userId;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.telegramChatId = chatId;
    await user.save();
    res.json({ message: 'Telegram linked successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to link Telegram', error: err.message });
  }
});

// Generate a secure, time-limited Telegram link token for the logged-in user
router.get('/telegram/link-token', authenticateUser, async (req, res) => {
  const userId = req.user._id;
  const payload = { userId };
  const secret = process.env.JWT_SECRET || 'telegram-link-secret';
  const token = jwt.sign(payload, secret, { expiresIn: '10m' });
  res.json({ token });
});

// Test endpoint to manually set telegramChatId (for testing only)
router.post('/test-set-telegram', authenticateUser, async (req, res) => {
  try {
    const { chatId } = req.body;
    const user = await User.findOneAndUpdate(
      { firebaseUid: req.user.firebaseUid },
      { telegramChatId: chatId },
      { new: true }
    );
    res.json({ success: true, telegramChatId: user.telegramChatId });
  } catch (error) {
    console.error('Error setting test telegram chat ID:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Test endpoint to manually test Telegram messaging
router.post('/test-telegram-message', authenticateUser, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const messagingService = new MessagingService();
    
    // Create a mock task for testing
    const mockTask = {
      _id: 'test-task-id',
      title: 'Test Java Learning',
      generatedSchedule: [{
        day: 1,
        subtask: 'Day 1 - Learn Java Basics',
        motivationTip: 'Stay focused and positive! You are making great progress.',
        resources: ['W3Schools Java Tutorial'],
        exercises: ['Write your first Hello World program'],
        notes: 'Start with the fundamentals'
      }]
    };
    
    const result = await messagingService.sendMessage(user, mockTask, 1);
    
    res.json({ 
      success: result, 
      message: result ? 'Test message sent successfully' : 'Failed to send test message',
      userPlatform: user.notificationPlatform,
      telegramChatId: user.telegramChatId
    });
  } catch (error) {
    console.error('Error testing Telegram message:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// Test WhatsApp messaging
router.post('/test-whatsapp-message', authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    const { phoneNumber } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    // Create a test task
    const testTask = {
      _id: 'test-task-id',
      title: 'Learn Python Programming',
      generatedSchedule: [{
        day: 1,
        subtask: 'Introduction to Python basics',
        resources: ['Python.org documentation', 'W3Schools Python tutorial'],
        exercises: ['Write Hello World program', 'Practice variables'],
        notes: 'Focus on understanding syntax and basic concepts',
        motivationTip: 'Python is the perfect language for beginners!'
      }]
    };

    const messagingService = new MessagingService();
    
    // Temporarily set user's notification platform to WhatsApp
    const originalPlatform = user.notificationPlatform;
    user.notificationPlatform = 'whatsapp';
    user.phoneNumber = phoneNumber;
    
    const result = await messagingService.sendMessage(user, testTask, 1);
    
    res.json({
      success: result.success,
      message: result.success ? 'WhatsApp message sent successfully!' : 'Failed to send WhatsApp message',
      details: result,
      sandboxCode: process.env.WHATSAPP_SANDBOX_CODE
    });
  } catch (error) {
    console.error('WhatsApp test error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Test all messaging platforms
router.post('/test-all-messaging', authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    
    // Create a test task
    const testTask = {
      _id: 'test-task-id',
      title: 'Learn Python Programming',
      generatedSchedule: [{
        day: 1,
        subtask: 'Introduction to Python basics',
        resources: ['Python.org documentation', 'W3Schools Python tutorial'],
        exercises: ['Write Hello World program', 'Practice variables'],
        notes: 'Focus on understanding syntax',
        motivationTip: 'Python is the perfect language for beginners!'
      }]
    };

    const messagingService = new MessagingService();
    
    // Test all platforms
    const results = {};
    
    // Test Telegram
    if (user.telegramChatId) {
      const originalPlatform = user.notificationPlatform;
      user.notificationPlatform = 'telegram';
      results.telegram = await messagingService.sendMessage(user, testTask, 1);
      user.notificationPlatform = originalPlatform;
    }
    
    // Test WhatsApp (if phone number provided)
    if (req.body.phoneNumber) {
      const originalPlatform = user.notificationPlatform;
      user.notificationPlatform = 'whatsapp';
      user.phoneNumber = req.body.phoneNumber;
      results.whatsapp = await messagingService.sendMessage(user, testTask, 1);
      user.notificationPlatform = originalPlatform;
    }
    
    // Test Email
    const originalPlatform = user.notificationPlatform;
    user.notificationPlatform = 'email';
    results.email = await messagingService.sendMessage(user, testTask, 1);
    user.notificationPlatform = originalPlatform;
    
    res.json({
      success: true,
      message: 'All messaging platforms tested',
      results,
      sandboxCode: process.env.WHATSAPP_SANDBOX_CODE
    });
  } catch (error) {
    console.error('Multi-platform test error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add new endpoints
router.get('/activity', authenticateUser, async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    const activities = await Activity.find({ user: req.user._id })
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));
    res.json(activities);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/streak', authenticateUser, async (req, res) => {
  try {
    const result = await User.getUserStreak(req.user._id);
    const current = result?.currentStreak || 0;
    const longest = result?.longestStreak || 0;
    res.json({ current, longest, type: 'tasks' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/productivity-score', authenticateUser, async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const start7 = new Date(now);
    start7.setHours(0, 0, 0, 0);
    start7.setDate(start7.getDate() - 6); // last 7 days including today
    const start30 = new Date(now);
    start30.setHours(0, 0, 0, 0);
    start30.setDate(start30.getDate() - 30);

    // Fetch required aggregates in parallel
    const [
      totalTasks,
      completedTasks,
      tasksCompletedLast7,
      userDoc,
      streakObj,
      pointsLast30Agg,
      activityLast7
    ] = await Promise.all([
      Task.countDocuments({ user: userId }),
      Task.countDocuments({ user: userId, status: 'completed' }),
      Task.countDocuments({ user: userId, status: 'completed', completedAt: { $gte: start7 } }),
      User.findById(userId).select('stats.taskStreak stats.longestStreak'),
      User.getUserStreak(userId),
      Achievement.aggregate([
        { $match: { user: userId, createdAt: { $gte: start30 } } },
        { $group: { _id: null, total: { $sum: { $ifNull: ['$points', 0] } } } }
      ]),
      Activity.countDocuments({ user: userId, timestamp: { $gte: start7 } })
    ]);

    const totalPointsLast30 = pointsLast30Agg?.[0]?.total || 0;
    const streakFromStats = userDoc?.stats?.taskStreak;
    const taskStreak = (typeof streakFromStats === 'number' && streakFromStats >= 0)
      ? streakFromStats
      : (streakObj?.currentStreak || 0);

    // Sub-scores (0-100)
    const completionRateScore = totalTasks > 0 ? Math.min(100, (completedTasks / totalTasks) * 100) : 0;
    const tasksRecentScore = Math.min(100, (tasksCompletedLast7 / 14) * 100); // cap: 14 tasks/week ~ 2 per day
    const streakScore = Math.min(100, (taskStreak / 30) * 100); // cap: 30-day streak
    const achievementsScore = Math.min(100, (totalPointsLast30 / 200) * 100); // cap: 200 points in 30 days
    const activityScore = Math.min(100, (activityLast7 / 20) * 100); // cap: 20 activities/week

    // Weights
    const score = Math.round(
      0.40 * completionRateScore +
      0.25 * tasksRecentScore +
      0.20 * streakScore +
      0.10 * achievementsScore +
      0.05 * activityScore
    );

    res.json({ score });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/user - Return current user for demo
router.get('/api/user', authenticateUser, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('isPremium signupDate consentGiven');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // For demo, return example user object
    res.json({
      id: user._id,
      isPremium: user.isPremium,
      signupDate: user.signupDate,
      consentGiven: user.consentGiven || true // Default to true for demo
    });
  } catch (err) {
    console.error('Error fetching user:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;