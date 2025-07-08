const express = require('express');
const router = express.Router();
const Achievement = require('../models/Achievement');
const User = require('../models/User');
const { authenticateUser } = require('../middlewares/authMiddleware');

// Get all achievements for a user
router.get('/', authenticateUser, async (req, res) => {
  try {
    const { category, earned } = req.query;
    
    const query = { user: req.user.id };
    
    if (category) {
      query.category = category;
    }
    
    if (earned === 'true') {
      query['progress.current'] = { $gte: '$progress.target' };
    } else if (earned === 'false') {
      query['progress.current'] = { $lt: '$progress.target' };
    }
    
    const achievements = await Achievement.find(query)
      .sort({ earnedAt: -1, category: 1 });
    
    res.json(achievements);
  } catch (error) {
    console.error('Error fetching achievements:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get achievement by ID
router.get('/:id', authenticateUser, async (req, res) => {
  try {
    const achievement = await Achievement.findOne({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!achievement) {
      return res.status(404).json({ message: 'Achievement not found' });
    }
    
    res.json(achievement);
  } catch (error) {
    console.error('Error fetching achievement:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get available achievements (not yet earned)
router.get('/available/list', authenticateUser, async (req, res) => {
  try {
    const userAchievements = await Achievement.find({ user: req.user.id });
    const earnedTypes = userAchievements.map(a => a.type);
    
    const availableAchievements = Achievement.getAvailableAchievements()
      .filter(achievement => !earnedTypes.includes(achievement.type));
    
    res.json(availableAchievements);
  } catch (error) {
    console.error('Error fetching available achievements:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get achievement statistics
router.get('/stats/overview', authenticateUser, async (req, res) => {
  try {
    const achievements = await Achievement.find({ user: req.user.id });
    
    const totalAchievements = achievements.length;
    const earnedAchievements = achievements.filter(a => a.isEarned).length;
    const totalPoints = achievements.reduce((sum, a) => sum + a.points, 0);
    
    const categoryStats = {};
    const badgeStats = {};
    
    achievements.forEach(achievement => {
      // Category stats
      if (!categoryStats[achievement.category]) {
        categoryStats[achievement.category] = { total: 0, earned: 0 };
      }
      categoryStats[achievement.category].total++;
      if (achievement.isEarned) {
        categoryStats[achievement.category].earned++;
      }
      
      // Badge stats
      if (!badgeStats[achievement.badge]) {
        badgeStats[achievement.badge] = 0;
      }
      if (achievement.isEarned) {
        badgeStats[achievement.badge]++;
      }
    });
    
    // Calculate completion percentage
    const completionPercentage = totalAchievements > 0 
      ? Math.round((earnedAchievements / totalAchievements) * 100) 
      : 0;
    
    res.json({
      totalAchievements,
      earnedAchievements,
      totalPoints,
      completionPercentage,
      categoryStats,
      badgeStats
    });
  } catch (error) {
    console.error('Error fetching achievement statistics:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Check and award achievements (triggered by other actions)
router.post('/check', authenticateUser, async (req, res) => {
  try {
    // Get user stats from the request body or calculate them
    const userStats = req.body.userStats || {};
    
    // If no stats provided, calculate them
    if (Object.keys(userStats).length === 0) {
      const user = await User.findById(req.user.id);
      userStats.eventsCreated = user.stats?.totalEvents || 0;
      userStats.eventsCompleted = user.stats?.completedEvents || 0;
      userStats.tasksCompleted = user.stats?.completedTasks || 0;
      userStats.moodEntries = user.stats?.moodEntries || 0;
      // Add more stats as needed
    }
    
    const newAchievements = await Achievement.checkAchievements(req.user.id, userStats);
    
    res.json({
      newAchievements,
      count: newAchievements.length
    });
  } catch (error) {
    console.error('Error checking achievements:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get recent achievements
router.get('/recent/list', authenticateUser, async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    
    const recentAchievements = await Achievement.find({
      user: req.user.id,
      'progress.current': { $gte: '$progress.target' } // Only earned achievements
    })
    .sort({ earnedAt: -1 })
    .limit(parseInt(limit));
    
    res.json(recentAchievements);
  } catch (error) {
    console.error('Error fetching recent achievements:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get achievement progress for all available achievements
router.get('/progress/overview', authenticateUser, async (req, res) => {
  try {
    const userAchievements = await Achievement.find({ user: req.user.id });
    const earnedTypes = userAchievements.map(a => a.type);
    
    const availableAchievements = Achievement.getAvailableAchievements();
    const progressData = [];
    
    for (const achievement of availableAchievements) {
      const existing = userAchievements.find(a => a.type === achievement.type);
      
      if (existing) {
        progressData.push({
          ...achievement,
          progress: existing.progress,
          isEarned: existing.isEarned,
          earnedAt: existing.earnedAt
        });
      } else {
        progressData.push({
          ...achievement,
          progress: { current: 0, target: achievement.criteria[Object.keys(achievement.criteria)[0]] || 1 },
          isEarned: false
        });
      }
    }
    
    res.json(progressData);
  } catch (error) {
    console.error('Error fetching achievement progress:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router; 