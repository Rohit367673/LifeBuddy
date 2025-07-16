const express = require('express');
const Event = require('../models/Event');
const Task = require('../models/Task');
const { authenticateUser, checkOwnership } = require('../middlewares/authMiddleware');
const Achievement = require('../models/Achievement');
const User = require('../models/User');
const eventTemplates = require('../data/eventTemplates.json');

const router = express.Router();

// Get all event templates
router.get('/templates', authenticateUser, async (req, res) => {
  try {
    // Check user's event limit for free tier
    const userEvents = await Event.countDocuments({ user: req.user._id });
    const isFreeTier = userEvents >= 2;
    
    const templatesWithLockStatus = eventTemplates.map(template => ({
      ...template,
      isLocked: isFreeTier
    }));
    
    res.json({
      templates: templatesWithLockStatus,
      userEventCount: userEvents,
      isFreeTier
    });
  } catch (error) {
    console.error('Error fetching event templates:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Public templates endpoint for testing (no auth required)
router.get('/templates/public', async (req, res) => {
  try {
    const templatesWithLockStatus = eventTemplates.map(template => ({
      ...template,
      isLocked: false
    }));
    
    res.json({
      templates: templatesWithLockStatus,
      userEventCount: 0,
      isFreeTier: false
    });
  } catch (error) {
    console.error('Error fetching event templates:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get all events for a user
router.get('/', authenticateUser, async (req, res) => {
  try {
    const { status, eventType, limit = 20, page = 1 } = req.query;
    
    let query = { user: req.user._id };
    
    if (status) {
      query.status = status;
    }
    
    if (eventType) {
      query.eventType = eventType;
    }
    
    const skip = (page - 1) * limit;
    
    const events = await Event.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();
    
    const total = await Event.countDocuments(query);
    
    res.json({
      events,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        hasNext: skip + events.length < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create new event (from template or custom)
router.post('/', authenticateUser, async (req, res) => {
  try {
    const {
      title,
      eventType,
      description,
      startDate,
      endDate,
      budget,
      priority,
      location,
      checklist,
      templateId,
      isCustom,
      color,
      icon,
      timeline
    } = req.body;

    // Check user's event limit for free tier
    const userEvents = await Event.countDocuments({ user: req.user._id });
    if (userEvents >= 2) {
      return res.status(403).json({
        message: 'Free tier limit reached. Upgrade to create more events.',
        limitReached: true
      });
    }

    // Validate required fields
    if (!title || !eventType || !startDate) {
      return res.status(400).json({
        message: 'Title, event type, and start date are required.'
      });
    }

    const eventData = {
      user: req.user._id,
      title,
      eventType,
      description,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      budget: budget || 0,
      priority: priority || 'medium',
      location,
      checklist: checklist || [],
      color: color || 'blue',
      icon: icon || '📅',
      timeline
    };

    // Handle template-based events
    if (templateId) {
      const template = eventTemplates.find(t => t.id === templateId);
      if (template) {
        eventData.isTemplateBased = true;
        eventData.templateId = templateId;
        eventData.checklist = template.checklist.map(item => ({
          item,
          completed: false
        }));
        eventData.color = template.color;
        eventData.icon = template.icon;
        eventData.timeline = template.timeline;
      }
    }

    // Handle custom events
    if (isCustom) {
      eventData.isCustom = true;
    }

    const event = new Event(eventData);
    await event.save();

    // Update user stats
    const user = await User.findById(req.user._id);
    await user.addEvent({
      type: event.eventType,
      checklist: event.checklist
    });

    // Check for achievements
    const userStats = await User.getUserStats(req.user._id);
    await Achievement.checkAchievements(req.user._id, userStats);

    res.status(201).json(event);
  } catch (error) {
    console.error('Error creating event:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get single event
router.get('/:id', authenticateUser, async (req, res) => {
  try {
    const event = await Event.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json(event);
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update event
router.put('/:id', authenticateUser, async (req, res) => {
  try {
    const {
      title,
      eventType,
      description,
      startDate,
      endDate,
      budget,
      priority,
      status,
      location,
      checklist,
      color,
      icon,
      timeline
    } = req.body;

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (eventType !== undefined) updateData.eventType = eventType;
    if (description !== undefined) updateData.description = description;
    if (startDate !== undefined) updateData.startDate = new Date(startDate);
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;
    if (budget !== undefined) updateData.budget = budget;
    if (priority !== undefined) updateData.priority = priority;
    if (status !== undefined) updateData.status = status;
    if (location !== undefined) updateData.location = location;
    if (checklist !== undefined) updateData.checklist = checklist;
    if (color !== undefined) updateData.color = color;
    if (icon !== undefined) updateData.icon = icon;
    if (timeline !== undefined) updateData.timeline = timeline;

    const event = await Event.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      updateData,
      { new: true, runValidators: true }
    );

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Update progress if checklist changed
    if (checklist !== undefined) {
      await event.updateProgress();
    }

    res.json(event);
  } catch (error) {
    console.error('Error updating event:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete event
router.delete('/:id', authenticateUser, async (req, res) => {
  try {
    const event = await Event.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Complete checklist item
router.patch('/:id/checklist/:itemIndex/complete', authenticateUser, async (req, res) => {
  try {
    const event = await Event.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const itemIndex = parseInt(req.params.itemIndex);
    await event.completeChecklistItem(itemIndex);

    res.json(event);
  } catch (error) {
    console.error('Error completing checklist item:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Add budget item
router.post('/:id/budget', authenticateUser, async (req, res) => {
  try {
    const { name, amount, category, notes } = req.body;

    if (!name || !amount) {
      return res.status(400).json({
        message: 'Name and amount are required for budget items.'
      });
    }

    const event = await Event.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    await event.addBudgetItem({
      name,
      amount: parseFloat(amount),
      category: category || 'other',
      notes
    });

    res.json(event);
  } catch (error) {
    console.error('Error adding budget item:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Add note to event
router.post('/:id/notes', authenticateUser, async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({
        message: 'Note content is required.'
      });
    }

    const event = await Event.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    await event.addNote(content);

    res.json(event);
  } catch (error) {
    console.error('Error adding note:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get event statistics
router.get('/stats/overview', authenticateUser, async (req, res) => {
  try {
    const userId = req.user._id;

    const [
      totalEvents,
      planningEvents,
      inProgressEvents,
      completedEvents,
      upcomingEvents,
      overdueEvents
    ] = await Promise.all([
      Event.countDocuments({ user: userId }),
      Event.countDocuments({ user: userId, status: 'planning' }),
      Event.countDocuments({ user: userId, status: 'in-progress' }),
      Event.countDocuments({ user: userId, status: 'completed' }),
      Event.getUpcomingEvents(userId, 5),
      Event.getOverdueEvents(userId)
    ]);

    // Calculate average progress
    const events = await Event.find({ user: userId });
    const averageProgress = events.length > 0 
      ? Math.round(events.reduce((sum, event) => sum + event.progress, 0) / events.length)
      : 0;

    // Calculate total budget and spent
    const totalBudget = events.reduce((sum, event) => sum + event.budget, 0);
    const totalSpent = events.reduce((sum, event) => sum + event.spentAmount, 0);

    res.json({
      totalEvents,
      planningEvents,
      inProgressEvents,
      completedEvents,
      upcomingEvents: upcomingEvents.length,
      overdueEvents: overdueEvents.length,
      averageProgress,
      totalBudget,
      totalSpent,
      budgetRemaining: totalBudget - totalSpent
    });
  } catch (error) {
    console.error('Error fetching event stats:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get events by status
router.get('/status/:status', authenticateUser, async (req, res) => {
  try {
    const { status } = req.params;
    const { limit = 20, page = 1 } = req.query;

    const skip = (page - 1) * limit;

    const events = await Event.getEventsByStatus(req.user._id, status)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Event.countDocuments({ 
      user: req.user._id, 
      status 
    });

    res.json({
      events,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        hasNext: skip + events.length < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching events by status:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get events by type
router.get('/type/:eventType', authenticateUser, async (req, res) => {
  try {
    const { eventType } = req.params;
    const { limit = 20, page = 1 } = req.query;

    const skip = (page - 1) * limit;

    const events = await Event.getEventsByType(req.user._id, eventType)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Event.countDocuments({ 
      user: req.user._id, 
      eventType 
    });

    res.json({
      events,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        hasNext: skip + events.length < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching events by type:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router; 