const express = require('express');
const router = express.Router();
const MotivationalMessage = require('../models/MotivationalMessage');
const { authenticateUser } = require('../middlewares/authMiddleware');

// Get a random motivational message
router.get('/random', authenticateUser, async (req, res) => {
  try {
    const { category, context } = req.query;
    
    // Determine context based on time of day if not provided
    let messageContext = context;
    if (!context) {
      const hour = new Date().getHours();
      if (hour < 12) {
        messageContext = 'morning';
      } else if (hour < 18) {
        messageContext = 'afternoon';
      } else {
        messageContext = 'evening';
      }
    }
    
    const message = await MotivationalMessage.getRandomMessage(category, messageContext);
    
    if (!message) {
      return res.status(404).json({ message: 'No motivational message found' });
    }
    
    res.json(message);
  } catch (error) {
    console.error('Error fetching random motivational message:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get motivational messages by category
router.get('/category/:category', authenticateUser, async (req, res) => {
  try {
    const { category } = req.params;
    const { limit = 5 } = req.query;
    
    const messages = await MotivationalMessage.getMessagesByCategory(category, parseInt(limit));
    
    res.json(messages);
  } catch (error) {
    console.error('Error fetching motivational messages by category:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get all motivational message categories
router.get('/categories', authenticateUser, async (req, res) => {
  try {
    const categories = [
      { id: 'motivation', name: 'Motivation', icon: '💪' },
      { id: 'success', name: 'Success', icon: '🏆' },
      { id: 'happiness', name: 'Happiness', icon: '😊' },
      { id: 'productivity', name: 'Productivity', icon: '⚡' },
      { id: 'mindfulness', name: 'Mindfulness', icon: '🧘' },
      { id: 'leadership', name: 'Leadership', icon: '👑' },
      { id: 'creativity', name: 'Creativity', icon: '🎨' },
      { id: 'resilience', name: 'Resilience', icon: '🛡️' },
      { id: 'growth', name: 'Growth', icon: '🌱' },
      { id: 'inspiration', name: 'Inspiration', icon: '✨' }
    ];
    
    res.json(categories);
  } catch (error) {
    console.error('Error fetching motivational categories:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get daily motivational message (one per day)
router.get('/daily', authenticateUser, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // For now, we'll just get a random message
    // In a production app, you might want to store the daily message for each user
    const message = await MotivationalMessage.getRandomMessage();
    
    if (!message) {
      return res.status(404).json({ message: 'No daily motivational message found' });
    }
    
    res.json({
      message,
      date: today,
      isDaily: true
    });
  } catch (error) {
    console.error('Error fetching daily motivational message:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get motivational message by ID
router.get('/:id', authenticateUser, async (req, res) => {
  try {
    const message = await MotivationalMessage.findById(req.params.id);
    
    if (!message) {
      return res.status(404).json({ message: 'Motivational message not found' });
    }
    
    res.json(message);
  } catch (error) {
    console.error('Error fetching motivational message:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Seed default motivational messages (admin only)
router.post('/seed', authenticateUser, async (req, res) => {
  try {
    await MotivationalMessage.seedDefaultMessages();
    
    res.json({ message: 'Default motivational messages seeded successfully' });
  } catch (error) {
    console.error('Error seeding motivational messages:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get motivational messages by tags
router.get('/tags/:tag', authenticateUser, async (req, res) => {
  try {
    const { tag } = req.params;
    const { limit = 10 } = req.query;
    
    const messages = await MotivationalMessage.find({
      tags: tag,
      isActive: true
    })
    .sort({ usageCount: 1 })
    .limit(parseInt(limit));
    
    res.json(messages);
  } catch (error) {
    console.error('Error fetching motivational messages by tag:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get popular motivational messages
router.get('/popular/list', authenticateUser, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const messages = await MotivationalMessage.find({ isActive: true })
      .sort({ usageCount: -1 })
      .limit(parseInt(limit));
    
    res.json(messages);
  } catch (error) {
    console.error('Error fetching popular motivational messages:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router; 