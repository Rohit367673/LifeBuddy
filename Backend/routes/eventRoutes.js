const express = require('express');
const Event = require('../models/Event');
const Task = require('../models/Task');
const { authenticateUser, checkOwnership } = require('../middlewares/authMiddleware');

const router = express.Router();

// Get all events for user
router.get('/', authenticateUser, async (req, res) => {
  try {
    const { status, type, page = 1, limit = 10, sort = '-createdAt' } = req.query;
    const userId = req.user._id;

    // Build query
    const query = { user: userId, isArchived: false };
    
    if (status) {
      query.status = status;
    }
    
    if (type) {
      query.type = type;
    }

    // Pagination
    const skip = (page - 1) * limit;
    
    const events = await Event.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('user', 'displayName firstName lastName')
      .lean();

    const total = await Event.countDocuments(query);

    res.json({
      events,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({
      message: 'Error fetching events.',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get single event with tasks
router.get('/:id', checkOwnership(Event), async (req, res) => {
  try {
    const event = req.resource;
    
    // Get tasks for this event
    const tasks = await Task.find({ event: event._id })
      .sort('dueDate')
      .lean();

    // Calculate event statistics
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === 'completed').length;
    const overdueTasks = tasks.filter(task => 
      task.status !== 'completed' && 
      task.dueDate && 
      new Date() > task.dueDate
    ).length;

    const eventWithStats = {
      ...event,
      taskStats: {
        total: totalTasks,
        completed: completedTasks,
        pending: totalTasks - completedTasks,
        overdue: overdueTasks,
        completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
      }
    };

    res.json({
      event: eventWithStats,
      tasks
    });

  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({
      message: 'Error fetching event.',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Create new event
router.post('/', authenticateUser, async (req, res) => {
  try {
    const {
      title,
      type,
      description,
      startDate,
      endDate,
      budget,
      priority,
      tags,
      location
    } = req.body;

    // Validate required fields
    if (!title || !type || !startDate) {
      return res.status(400).json({
        message: 'Title, type, and start date are required.'
      });
    }

    const event = new Event({
      user: req.user._id,
      title,
      type,
      description,
      startDate,
      endDate,
      budget,
      priority,
      tags,
      location
    });

    await event.save();

    // Update user stats
    const User = require('../models/User');
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { 'stats.totalEvents': 1 },
      $set: { 'stats.lastActive': new Date() }
    });

    // Populate user info
    await event.populate('user', 'displayName firstName lastName');

    res.status(201).json({
      message: 'Event created successfully.',
      event
    });

  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({
      message: 'Error creating event.',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Update event
router.put('/:id', checkOwnership(Event), async (req, res) => {
  try {
    const event = req.resource;
    const updateData = req.body;

    // Remove fields that shouldn't be updated
    delete updateData.user;
    delete updateData._id;
    delete updateData.createdAt;
    delete updateData.updatedAt;

    // Update event
    Object.assign(event, updateData);
    await event.save();

    // Populate user info
    await event.populate('user', 'displayName firstName lastName');

    res.json({
      message: 'Event updated successfully.',
      event
    });

  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({
      message: 'Error updating event.',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Delete event
router.delete('/:id', checkOwnership(Event), async (req, res) => {
  try {
    const event = req.resource;

    // Soft delete - mark as archived
    event.isArchived = true;
    await event.save();

    // Optionally delete associated tasks
    if (req.query.deleteTasks === 'true') {
      await Task.deleteMany({ event: event._id });
    }

    res.json({
      message: 'Event deleted successfully.'
    });

  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({
      message: 'Error deleting event.',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Add note to event
router.post('/:id/notes', checkOwnership(Event), async (req, res) => {
  try {
    const { content } = req.body;
    const event = req.resource;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        message: 'Note content is required.'
      });
    }

    await event.addNote(content.trim());

    res.status(201).json({
      message: 'Note added successfully.',
      note: event.notes[event.notes.length - 1]
    });

  } catch (error) {
    console.error('Add note error:', error);
    res.status(500).json({
      message: 'Error adding note.',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Update event progress
router.patch('/:id/progress', checkOwnership(Event), async (req, res) => {
  try {
    const { progress } = req.body;
    const event = req.resource;

    if (progress === undefined || progress < 0 || progress > 100) {
      return res.status(400).json({
        message: 'Progress must be a number between 0 and 100.'
      });
    }

    event.progress = progress;
    await event.save();

    res.json({
      message: 'Progress updated successfully.',
      progress: event.progress
    });

  } catch (error) {
    console.error('Update progress error:', error);
    res.status(500).json({
      message: 'Error updating progress.',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get event statistics
router.get('/:id/stats', checkOwnership(Event), async (req, res) => {
  try {
    const event = req.resource;

    // Get task statistics
    const tasks = await Task.find({ event: event._id }).lean();
    
    const taskStats = {
      total: tasks.length,
      completed: tasks.filter(t => t.status === 'completed').length,
      pending: tasks.filter(t => t.status === 'pending').length,
      inProgress: tasks.filter(t => t.status === 'in-progress').length,
      overdue: tasks.filter(t => 
        t.status !== 'completed' && 
        t.dueDate && 
        new Date() > t.dueDate
      ).length
    };

    // Calculate budget statistics
    const budgetStats = {
      planned: event.budget.planned,
      spent: event.budget.spent,
      remaining: event.budget.planned - event.budget.spent,
      percentageUsed: event.budget.planned > 0 
        ? Math.round((event.budget.spent / event.budget.planned) * 100) 
        : 0
    };

    // Calculate time statistics
    const timeStats = {
      duration: event.duration,
      daysRemaining: event.endDate 
        ? Math.ceil((event.endDate - new Date()) / (1000 * 60 * 60 * 24))
        : null,
      isOverdue: event.endDate ? new Date() > event.endDate : false
    };

    res.json({
      eventId: event._id,
      taskStats,
      budgetStats,
      timeStats,
      progress: event.progress
    });

  } catch (error) {
    console.error('Get event stats error:', error);
    res.status(500).json({
      message: 'Error fetching event statistics.',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router; 