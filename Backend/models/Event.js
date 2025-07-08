const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
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
  type: {
    type: String,
    required: true,
    enum: ['moving', 'job-change', 'college', 'wedding', 'trip', 'car-purchase', 'other'],
    default: 'other'
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  status: {
    type: String,
    enum: ['planning', 'in-progress', 'completed', 'paused'],
    default: 'planning'
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date
  },
  budget: {
    planned: {
      type: Number,
      default: 0
    },
    spent: {
      type: Number,
      default: 0
    },
    currency: {
      type: String,
      default: 'USD'
    }
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 20
  }],
  location: {
    address: String,
    city: String,
    state: String,
    country: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  notes: [{
    content: {
      type: String,
      required: true,
      maxlength: 1000
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }],
  attachments: [{
    name: String,
    url: String,
    type: String,
    size: Number,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isPublic: {
    type: Boolean,
    default: false
  },
  isArchived: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for better query performance
eventSchema.index({ user: 1, status: 1 });
eventSchema.index({ user: 1, startDate: -1 });
eventSchema.index({ user: 1, type: 1 });
eventSchema.index({ status: 1, startDate: 1 });

// Virtual for duration
eventSchema.virtual('duration').get(function() {
  if (!this.startDate || !this.endDate) return null;
  return Math.ceil((this.endDate - this.startDate) / (1000 * 60 * 60 * 24));
});

// Virtual for budget status
eventSchema.virtual('budgetStatus').get(function() {
  if (this.budget.planned === 0) return 'not-set';
  if (this.budget.spent === 0) return 'not-started';
  if (this.budget.spent <= this.budget.planned * 0.8) return 'under-budget';
  if (this.budget.spent <= this.budget.planned) return 'on-budget';
  return 'over-budget';
});

// Method to update progress based on completed tasks
eventSchema.methods.updateProgress = function(completedTasks, totalTasks) {
  if (totalTasks === 0) {
    this.progress = 0;
  } else {
    this.progress = Math.round((completedTasks / totalTasks) * 100);
  }
  return this.save();
};

// Method to add note
eventSchema.methods.addNote = function(content) {
  this.notes.push({ content });
  return this.save();
};

// Method to update budget
eventSchema.methods.updateBudget = function(spent) {
  this.budget.spent = spent;
  return this.save();
};

// Pre-save middleware to update user stats
eventSchema.pre('save', async function(next) {
  if (this.isNew) {
    try {
      const User = mongoose.model('User');
      await User.findByIdAndUpdate(this.user, {
        $inc: { 'stats.totalEvents': 1 }
      });
    } catch (error) {
      console.error('Error updating user stats:', error);
    }
  }
  next();
});

module.exports = mongoose.model('Event', eventSchema); 