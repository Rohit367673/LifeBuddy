const express = require('express');
const router = express.Router();
const Mood = require('../models/Mood');
const { authenticateUser } = require('../middlewares/authMiddleware');
const Achievement = require('../models/Achievement');
const User = require('../models/User');

// Get all mood entries for a user
router.get('/', authenticateUser, async (req, res) => {
  try {
    const { page = 1, limit = 20, startDate, endDate } = req.query;
    
    const query = { user: req.user.id };
    
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { date: -1 }
    };
    
    const moods = await Mood.find(query)
      .sort(options.sort)
      .limit(options.limit * 1)
      .skip((options.page - 1) * options.limit)
      .exec();
    
    const total = await Mood.countDocuments(query);
    
    res.json({
      moods,
      totalPages: Math.ceil(total / options.limit),
      currentPage: options.page,
      total
    });
  } catch (error) {
    console.error('Error fetching mood entries:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get mood entry by ID
router.get('/:id', authenticateUser, async (req, res) => {
  try {
    const mood = await Mood.findOne({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!mood) {
      return res.status(404).json({ message: 'Mood entry not found' });
    }
    
    res.json(mood);
  } catch (error) {
    console.error('Error fetching mood entry:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create new mood entry
router.post('/', authenticateUser, async (req, res) => {
  try {
    const {
      mood,
      notes,
      activities,
      weather,
      sleepHours,
      energyLevel,
      stressLevel,
      tags
    } = req.body;
    
    // Check if user already has an entry for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const existingEntry = await Mood.findOne({
      user: req.user.id,
      date: { $gte: today, $lt: tomorrow }
    });
    
    if (existingEntry) {
      return res.status(400).json({ 
        message: 'You already have a mood entry for today. Update the existing entry instead.' 
      });
    }
    
    const moodEntry = new Mood({
      user: req.user.id,
      mood,
      notes,
      activities,
      weather,
      sleepHours,
      energyLevel,
      stressLevel,
      tags
    });
    
    await moodEntry.save();
    
    // Update user stats using enhanced method
    const user = await User.findById(req.user.id);
    await user.addMoodEntry({
      stressLevel: moodEntry.stressLevel,
      energyLevel: moodEntry.energyLevel,
      activities: moodEntry.activities
    });
    
    // Check for achievements after mood entry creation
    const userStats = await User.getUserStats(req.user.id);
    const newAchievements = await Achievement.checkAchievements(req.user.id, userStats);
    
    res.status(201).json({
      moodEntry,
      newAchievements: newAchievements.length > 0 ? newAchievements : null
    });
  } catch (error) {
    console.error('Error creating mood entry:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update mood entry
router.put('/:id', authenticateUser, async (req, res) => {
  try {
    const {
      mood,
      notes,
      activities,
      weather,
      sleepHours,
      energyLevel,
      stressLevel,
      tags
    } = req.body;
    
    const moodEntry = await Mood.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.user.id
      },
      {
        mood,
        notes,
        activities,
        weather,
        sleepHours,
        energyLevel,
        stressLevel,
        tags
      },
      { new: true, runValidators: true }
    );
    
    if (!moodEntry) {
      return res.status(404).json({ message: 'Mood entry not found' });
    }
    
    res.json(moodEntry);
  } catch (error) {
    console.error('Error updating mood entry:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete mood entry
router.delete('/:id', authenticateUser, async (req, res) => {
  try {
    const moodEntry = await Mood.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!moodEntry) {
      return res.status(404).json({ message: 'Mood entry not found' });
    }
    
    res.json({ message: 'Mood entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting mood entry:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get mood statistics
router.get('/stats/overview', authenticateUser, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    
    const stats = await Mood.getMoodStats(req.user.id, start, end);
    const streak = await Mood.getMoodStreak(req.user.id);
    
    // Get mood distribution
    const moodDistribution = await Mood.aggregate([
      {
        $match: {
          user: req.user.id,
          date: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: '$mood.label',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
    
    // Get weekly averages
    const weeklyAverages = await Mood.aggregate([
      {
        $match: {
          user: req.user.id,
          date: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            week: { $week: '$date' }
          },
          avgRating: { $avg: '$mood.rating' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.week': 1 }
      }
    ]);
    
    res.json({
      stats,
      streak,
      moodDistribution,
      weeklyAverages
    });
  } catch (error) {
    console.error('Error fetching mood statistics:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get mood calendar data
router.get('/calendar/:year/:month', authenticateUser, async (req, res) => {
  try {
    const { year, month } = req.params;
    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 0);
    
    const moods = await Mood.find({
      user: req.user.id,
      date: { $gte: startDate, $lte: endDate }
    }).select('date mood.emoji mood.rating mood.label');
    
    const calendarData = {};
    moods.forEach(mood => {
      const day = mood.date.getDate();
      calendarData[day] = {
        emoji: mood.mood.emoji,
        rating: mood.mood.rating,
        label: mood.mood.label
      };
    });
    
    res.json(calendarData);
  } catch (error) {
    console.error('Error fetching calendar data:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get today's mood entry
router.get('/today/entry', authenticateUser, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const moodEntry = await Mood.findOne({
      user: req.user.id,
      date: { $gte: today, $lt: tomorrow }
    });
    
    res.json(moodEntry);
  } catch (error) {
    console.error('Error fetching today\'s mood entry:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router; 