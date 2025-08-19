const express = require('express');
const router = express.Router();
const Achievement = require('../models/Achievement');
const User = require('../models/User');
const { authenticateUser } = require('../middlewares/authMiddleware');
const Task = require('../models/Task');
const Mood = require('../models/Mood');
const Event = require('../models/Event');

// Get all achievements for a user
router.get('/', authenticateUser, async (req, res) => {
  try {
    const { category, earned } = req.query;
    
    const query = { user: req.user._id };
    
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
      user: req.user._id
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
    const userAchievements = await Achievement.find({ user: req.user._id });
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
    const achievements = await Achievement.find({ user: req.user._id });
    
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

// Initialize achievements for a user (creates all available achievements with progress)
router.post('/initialize', authenticateUser, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user stats
    const userStats = await User.getUserStats(req.user._id);
    
    // Get all available achievements
    const availableAchievements = Achievement.getAvailableAchievements();
    
    // Get existing user achievements
    const existingAchievements = await Achievement.find({ user: req.user._id });
    const existingTypes = existingAchievements.map(a => a.type);
    
    const newAchievements = [];
    
    // Create achievements that don't exist yet
    for (const achievement of availableAchievements) {
      if (!existingTypes.includes(achievement.type)) {
        const progress = {
          current: Achievement.getCurrentProgress(achievement.criteria, userStats),
          target: Achievement.getTargetProgress(achievement.criteria)
        };
        
        const newAchievement = new Achievement({
          user: req.user._id,
          ...achievement,
          progress
        });
        
        await newAchievement.save();
        newAchievements.push(newAchievement);
      }
    }
    
    res.json({
      message: `Initialized ${newAchievements.length} achievements`,
      newAchievements,
      totalAchievements: existingAchievements.length + newAchievements.length
    });
  } catch (error) {
    console.error('Error initializing achievements:', error);
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
      const user = await User.findById(req.user._id);
      userStats.eventsCreated = user.stats?.totalEvents || 0;
      userStats.eventsCompleted = user.stats?.completedEvents || 0;
      userStats.tasksCompleted = user.stats?.completedTasks || 0;
      userStats.moodEntries = user.stats?.moodEntries || 0;
      // Add more stats as needed
    }
    
    const newAchievements = await Achievement.checkAchievements(req.user._id, userStats);
    
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
      user: req.user._id,
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
    const userAchievements = await Achievement.find({ user: req.user._id });
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
        const userStats = await User.getUserStats(req.user._id);
        const currentProgress = Achievement.getCurrentProgress(achievement.criteria, userStats);
        const targetProgress = Achievement.getTargetProgress(achievement.criteria);
        
        progressData.push({
          ...achievement,
          progress: { current: currentProgress, target: targetProgress },
          isEarned: currentProgress >= targetProgress,
          earnedAt: null
        });
      }
    }
    
    res.json(progressData);
  } catch (error) {
    console.error('Error fetching achievement progress:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/progress', authenticateUser, async (req, res) => {
  try {
    const userAchievements = await Achievement.find({ user: req.user._id });
    const earnedTypes = userAchievements.map(a => a.type);
    const availableAchievements = Achievement.getAvailableAchievements();
    const progressData = [];

    for (const achievement of availableAchievements) {
      const existing = userAchievements.find(a => a.type === achievement.type);
      if (existing) {
        progressData.push({
          type: achievement.type,
          title: achievement.title,
          description: achievement.description,
          icon: achievement.icon,
          progress: existing.progress,
          earned: existing.earned,
          earnedDate: existing.earnedDate
        });
      } else {
        progressData.push({
          type: achievement.type,
          title: achievement.title,
          description: achievement.description,
          icon: achievement.icon,
          progress: { current: 0, target: achievement.target },
          earned: false
        });
      }
    }

    res.json(progressData);
  } catch (error) {
    console.error('Error fetching achievement progress overview:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Test badge unlock system
router.post('/test-badge-system', authenticateUser, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    // Simulate different activities to test badge unlocking
    const testResults = {
      tasks: [],
      events: [],
      moods: [],
      achievements: [],
      stats: {}
    };

    // Test 1: First Task Badge
    console.log('Testing first task badge...');
    const firstTask = new Task({
      user: user._id,
      title: 'Test Task 1',
      description: 'This is the first task',
      priority: 'medium',
      status: 'completed',
      category: 'general',
      completedAt: new Date()
    });
    await firstTask.save();
    testResults.tasks.push(firstTask);

    await user.incrementCompletedTasks({
      category: firstTask.category,
      priority: firstTask.priority
    });

    // Test 2: Fitness Task Badge
    const fitnessTask = new Task({
      user: user._id,
      title: 'Workout',
      description: 'Go to the gym',
      priority: 'high',
      status: 'completed',
      category: 'fitness',
      completedAt: new Date()
    });
    await fitnessTask.save();
    testResults.tasks.push(fitnessTask);

    await user.incrementCompletedTasks({
      category: fitnessTask.category,
      priority: fitnessTask.priority
    });

    // Test 3: Learning Task Badge
    const learningTask = new Task({
      user: user._id,
      title: 'Study JavaScript',
      description: 'Learn React hooks',
      priority: 'medium',
      status: 'completed',
      category: 'learning',
      completedAt: new Date()
    });
    await learningTask.save();
    testResults.tasks.push(learningTask);

    await user.incrementCompletedTasks({
      category: learningTask.category,
      priority: learningTask.priority
    });

    // Test 4: Mood Entry Badge
    const moodEntry = new Mood({
      user: user._id,
      mood: { emoji: '😊', rating: 7, label: 'good' },
      notes: 'Feeling great today!',
      activities: ['work', 'exercise'],
      weather: 'sunny',
      sleepHours: 8,
      energyLevel: 8,
      stressLevel: 2,
      tags: ['productive']
    });
    await moodEntry.save();
    testResults.moods.push(moodEntry);

    await user.addMoodEntry({
      stressLevel: moodEntry.stressLevel,
      energyLevel: moodEntry.energyLevel,
      activities: moodEntry.activities
    });

    // Test 5: Event Creation Badge
    const firstEvent = new Event({
      user: user._id,
      title: 'Career Change',
      type: 'career',
      description: 'Transition to new role',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      priority: 'high',
      status: 'planning',
      checklist: [
        'Update resume',
        'Network with professionals',
        'Apply to positions',
        'Prepare for interviews'
      ]
    });
    await firstEvent.save();
    testResults.events.push(firstEvent);

    await user.addEvent({
      type: firstEvent.type,
      checklist: firstEvent.checklist
    });

    // Test 6: Social Event Badge
    const socialEvent = new Event({
      user: user._id,
      title: 'Team Party',
      type: 'social',
      description: 'Company team building',
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      priority: 'medium',
      status: 'planning'
    });
    await socialEvent.save();
    testResults.events.push(socialEvent);

    await user.addEvent({
      type: socialEvent.type,
      checklist: socialEvent.checklist
    });

    // Check for achievements
    const userStats = await User.getUserStats(user._id);
    const newAchievements = await Achievement.checkAchievements(user._id, userStats);
    testResults.achievements = newAchievements;

    // Get final stats
    const finalUser = await User.findById(user._id);
    testResults.stats = {
      totalTasks: finalUser.stats.totalTasks,
      completedTasks: finalUser.stats.completedTasks,
      totalEvents: finalUser.stats.totalEvents,
      moodEntries: finalUser.stats.moodEntries,
      taskStreak: finalUser.stats.taskStreak,
      moodStreak: finalUser.stats.moodStreak,
      fitnessTasks: finalUser.stats.fitnessTasks,
      learningTasks: finalUser.stats.learningTasks,
      socialEvents: finalUser.stats.socialEvents,
      earlyBirdDays: finalUser.stats.earlyBirdDays,
      nightOwlDays: finalUser.stats.nightOwlDays,
      completionRate: finalUser.stats.totalTasks > 0 
        ? Math.round((finalUser.stats.completedTasks / finalUser.stats.totalTasks) * 100)
        : 0
    };

    res.json({
      message: 'Badge unlock system test completed successfully!',
      testResults
    });

  } catch (error) {
    console.error('Error testing badge system:', error);
    res.status(500).json({ 
      message: 'Error testing badge system',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Public: Get achievements for a user by username or ID
router.get('/public/:identifier', async (req, res) => {
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
      return res.status(404).json({ message: 'User not found' });
    }
    const achievements = await Achievement.find({ user: user._id }).sort({ earnedAt: -1 });
    // Map to required fields for frontend
    const mappedAchievements = achievements.map(a => ({
      _id: a._id,
      type: a.type,
      isEarned: a.isEarned,
      name: a.name,
      description: a.description,
      earnedAt: a.earnedAt,
      points: a.points
    }));
    const stats = {
      totalAchievements: achievements.length,
      completedAchievements: achievements.filter(a => a.isEarned).length,
      completionRate: achievements.length > 0 ? Math.round(achievements.filter(a => a.isEarned).length / achievements.length * 100) : 0
    };
    res.json({ achievements: mappedAchievements, stats });
  } catch (error) {
    console.error('Error fetching public achievements:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router; 