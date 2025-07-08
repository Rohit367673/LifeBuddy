const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  dueDate: {
    type: Date,
    default: null
  },
  completedAt: {
    type: Date,
    default: null
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    default: null
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 20
  }],
  estimatedTime: {
    type: Number, // in minutes
    min: 0,
    default: null
  },
  actualTime: {
    type: Number, // in minutes
    min: 0,
    default: null
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  attachments: [{
    name: String,
    url: String,
    type: String
  }],
  reminders: [{
    time: Date,
    type: {
      type: String,
      enum: ['email', 'push', 'sms'],
      default: 'push'
    },
    sent: {
      type: Boolean,
      default: false
    }
  }],
  dependencies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  }],
  subtasks: [{
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    completed: {
      type: Boolean,
      default: false
    },
    completedAt: Date
  }]
}, {
  timestamps: true
});

// Indexes for better query performance
taskSchema.index({ user: 1, status: 1 });
taskSchema.index({ user: 1, dueDate: 1 });
taskSchema.index({ user: 1, priority: 1 });
taskSchema.index({ event: 1 });
taskSchema.index({ 'reminders.time': 1 });

// Virtual for overdue status
taskSchema.virtual('isOverdue').get(function() {
  if (!this.dueDate || this.status === 'completed') {
    return false;
  }
  return new Date() > this.dueDate;
});

// Virtual for completion percentage
taskSchema.virtual('completionPercentage').get(function() {
  if (this.subtasks.length === 0) {
    return this.status === 'completed' ? 100 : 0;
  }
  
  const completedSubtasks = this.subtasks.filter(subtask => subtask.completed).length;
  return Math.round((completedSubtasks / this.subtasks.length) * 100);
});

// Method to mark as completed
taskSchema.methods.markCompleted = function() {
  this.status = 'completed';
  this.completedAt = new Date();
  return this.save();
};

// Method to mark as in progress
taskSchema.methods.markInProgress = function() {
  this.status = 'in-progress';
  return this.save();
};

// Method to add subtask
taskSchema.methods.addSubtask = function(title) {
  this.subtasks.push({ title });
  return this.save();
};

// Method to complete subtask
taskSchema.methods.completeSubtask = function(subtaskIndex) {
  if (this.subtasks[subtaskIndex]) {
    this.subtasks[subtaskIndex].completed = true;
    this.subtasks[subtaskIndex].completedAt = new Date();
    
    // Check if all subtasks are completed
    const allCompleted = this.subtasks.every(subtask => subtask.completed);
    if (allCompleted) {
      this.status = 'completed';
      this.completedAt = new Date();
    }
    
    return this.save();
  }
  throw new Error('Subtask not found');
};

// Static method to get tasks by status
taskSchema.statics.getTasksByStatus = function(userId, status) {
  return this.find({ user: userId, status }).sort({ createdAt: -1 });
};

// Static method to get overdue tasks
taskSchema.statics.getOverdueTasks = function(userId) {
  return this.find({
    user: userId,
    dueDate: { $lt: new Date() },
    status: { $nin: ['completed', 'cancelled'] }
  }).sort({ dueDate: 1 });
};

// Static method to get tasks due today
taskSchema.statics.getTasksDueToday = function(userId) {
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  
  return this.find({
    user: userId,
    dueDate: { $gte: startOfDay, $lt: endOfDay },
    status: { $nin: ['completed', 'cancelled'] }
  }).sort({ priority: -1, dueDate: 1 });
};

// Static method to get task statistics
taskSchema.statics.getTaskStats = function(userId, startDate, endDate) {
  const matchStage = {
    user: new mongoose.Types.ObjectId(userId)
  };
  
  if (startDate && endDate) {
    matchStage.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
  }
  
  return this.aggregate([
    { $match: matchStage },
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
        },
        overdueTasks: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $lt: ['$dueDate', new Date()] },
                  { $ne: ['$status', 'completed'] }
                ]
              },
              1,
              0
            ]
          }
        }
      }
    }
  ]);
};

// Pre-save middleware to update user stats
taskSchema.pre('save', async function(next) {
  if (this.isModified('status') && this.status === 'completed' && !this.completedAt) {
    this.completedAt = new Date();
  }
  next();
});

// Post-save middleware to update user stats
taskSchema.post('save', async function() {
  const User = require('./User');
  
  if (this.isModified('status')) {
    const user = await User.findById(this.user);
    if (user) {
      if (this.status === 'completed') {
        await user.incrementCompletedTasks();
      }
      await user.updateLastActive();
    }
  }
});

module.exports = mongoose.model('Task', taskSchema); 