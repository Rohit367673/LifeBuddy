const express = require('express');
const User = require('../models/User');
const Event = require('../models/Event');
const Task = require('../models/Task');
const { authenticateUser } = require('../middlewares/authMiddleware');
const Achievement = require('../models/Achievement');

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
    
    // Get streak information
    const streak = await User.getUserStreak(req.user._id);
    
    res.json({
      ...user.toObject(),
      stats,
      badges: earnedBadges,
      currentStreak: streak.currentStreak || 0,
      longestStreak: streak.longestStreak || 0,
      totalTasks: stats.totalTasks || 0,
      completedTasks: stats.completedTasks || 0
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
    const isOwner = user.email === 'rohit367673@gmail.com' && (user.username === 'rohit' || (user.displayName && user.displayName.toLowerCase() === 'rohit'));
    // Ensure all required fields are present
    res.json({
      displayName: user.displayName || '',
      username: user.username || '',
      avatar: user.avatar || '',
      personalQuote: user.personalQuote || '',
      currentStreak: streak.currentStreak || 0,
      longestStreak: streak.longestStreak || 0,
      totalTasks: stats.totalTasks || 0,
      completedTasks: stats.completedTasks || 0,
      badges: earnedBadges,
      joinedAt: user.createdAt,
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
      isArchived: false 
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
      isArchived: false 
    });
    
    const activeEvents = await Event.countDocuments({ 
      user: userId, 
      status: { $in: ['planning', 'in-progress'] },
      isArchived: false 
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
    const { period = '30' } = req.query; // days

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // Get events created in period
    const eventsInPeriod = await Event.find({
      user: userId,
      createdAt: { $gte: startDate },
      isArchived: false
    }).lean();

    // Get tasks completed in period
    const completedTasksInPeriod = await Task.find({
      user: userId,
      status: 'completed',
      completedAt: { $gte: startDate }
    }).lean();

    // Get tasks by category
    const tasksByCategory = await Task.aggregate([
      { $match: { user: userId } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get events by type
    const eventsByType = await Event.aggregate([
      { $match: { user: userId, isArchived: false } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Calculate productivity trends
    const productivityData = [];
    for (let i = parseInt(period) - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const tasksCompleted = completedTasksInPeriod.filter(task => {
        const taskDate = new Date(task.completedAt);
        return taskDate >= date && taskDate < nextDate;
      }).length;

      productivityData.push({
        date: date.toISOString().split('T')[0],
        tasksCompleted
      });
    }

    res.json({
      period: parseInt(period),
      eventsInPeriod: eventsInPeriod.length,
      completedTasksInPeriod: completedTasksInPeriod.length,
      tasksByCategory,
      eventsByType,
      productivityData
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

module.exports = router; 