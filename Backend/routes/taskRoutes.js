const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const { authenticateUser } = require('../middlewares/authMiddleware');
const Achievement = require('../models/Achievement');
const User = require('../models/User');

// Get all tasks for a user
router.get('/', authenticateUser, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, priority, eventId } = req.query;
    
    const query = { user: req.user._id };
    
    if (status) {
      query.status = status;
    }
    
    if (priority) {
      query.priority = priority;
    }
    
    if (eventId) {
      query.event = eventId;
    }
    
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 }
    };
    
    const tasks = await Task.find(query)
      .sort(options.sort)
      .limit(options.limit * 1)
      .skip((options.page - 1) * options.limit)
      .populate('event', 'title')
      .exec();
    
    const total = await Task.countDocuments(query);
    
    res.json({
      tasks,
      totalPages: Math.ceil(total / options.limit),
      currentPage: options.page,
      total
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get task by ID
router.get('/:id', authenticateUser, async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      user: req.user._id
    }).populate('event', 'title description');
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    res.json(task);
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create new task
router.post('/', authenticateUser, async (req, res) => {
  try {
    const {
      title,
      description,
      priority,
      dueDate,
      event,
      tags
    } = req.body;
    
    const task = new Task({
      user: req.user._id,
      title,
      description,
      priority: priority || 'medium',
      dueDate: dueDate ? new Date(dueDate) : null,
      event,
      tags: tags || []
    });
    
    await task.save();
    
    // Update user stats
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { 'stats.totalTasks': 1 },
      $set: { 'stats.lastActive': new Date() }
    });
    
    // Check for achievements after task creation
    const user = await User.findById(req.user._id);
    const userStats = await User.getUserStats(req.user._id);
    const newAchievements = await Achievement.checkAchievements(req.user._id, userStats);
    
    // Populate event details
    await task.populate('event', 'title');
    
    res.status(201).json({
      task,
      newAchievements: newAchievements.length > 0 ? newAchievements : null
    });
  } catch (error) {
    console.error('Error creating task:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update task
router.put('/:id', authenticateUser, async (req, res) => {
  try {
    const {
      title,
      description,
      priority,
      status,
      dueDate,
      event,
      tags,
      category
    } = req.body;
    
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (priority !== undefined) updateData.priority = priority;
    if (status !== undefined) {
      updateData.status = status;
      if (status === 'completed') {
        updateData.completedAt = new Date();
      }
    }
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (event !== undefined) updateData.event = event;
    if (tags !== undefined) updateData.tags = tags;
    if (category !== undefined) updateData.category = category;
    
    const task = await Task.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.user._id
      },
      updateData,
      { new: true, runValidators: true }
    ).populate('event', 'title');
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Update user stats if task was completed
    if (status === 'completed') {
      const user = await User.findById(req.user._id);
      await user.incrementCompletedTasks({
        category: task.category,
        priority: task.priority,
        tags: task.tags
      });
      const userStats = await User.getUserStats(req.user._id);
      console.log('User stats after completing task:', userStats); // Log stats
      const newAchievements = await Achievement.checkAchievements(req.user._id, userStats);
      console.log('New achievements unlocked:', newAchievements); // Log achievements
      return res.json({
        task,
        newAchievements: newAchievements.length > 0 ? newAchievements : null
      });
    }
    
    res.json(task);
  } catch (error) {
    console.error('Error updating task:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete task
router.delete('/:id', authenticateUser, async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get task statistics
router.get('/stats/overview', authenticateUser, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    
    const stats = await Task.aggregate([
      {
        $match: {
          user: req.user._id,
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: null,
          totalTasks: { $sum: 1 },
          completedTasks: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          pendingTasks: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          inProgressTasks: {
            $sum: { $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0] }
          }
        }
      }
    ]);
    
    const priorityStats = await Task.aggregate([
      {
        $match: {
          user: req.user._id,
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const result = {
      totalTasks: stats[0]?.totalTasks || 0,
      completedTasks: stats[0]?.completedTasks || 0,
      pendingTasks: stats[0]?.pendingTasks || 0,
      inProgressTasks: stats[0]?.inProgressTasks || 0,
      completionRate: stats[0]?.totalTasks > 0 
        ? Math.round((stats[0].completedTasks / stats[0].totalTasks) * 100) 
        : 0,
      priorityDistribution: priorityStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {})
    };
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching task statistics:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router; 