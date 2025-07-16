const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  eventType: {
    type: String,
    required: true,
    enum: ['Moving', 'Wedding', 'Career', 'Travel', 'Home', 'Education', 'Business', 'Health', 'Social', 'Custom']
  },
  description: {
    type: String,
    trim: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date
  },
  budget: {
    type: Number,
    default: 0
  },
  spentAmount: {
    type: Number,
    default: 0
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['planning', 'in-progress', 'completed', 'archived'],
    default: 'planning'
  },
  location: {
    type: String,
    trim: true
  },
  checklist: [{
    item: {
      type: String,
      required: true
    },
    completed: {
      type: Boolean,
      default: false
    },
    completedAt: {
      type: Date
    },
    notes: {
      type: String
    }
  }],
  // Template-based event tracking
  isTemplateBased: {
    type: Boolean,
    default: false
  },
  templateId: {
    type: String
  },
  // Custom event tracking
  isCustom: {
    type: Boolean,
    default: false
  },
  // Progress tracking
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  // Notes and journal
  notes: [{
    content: {
      type: String,
      required: true
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
  // Tags for filtering
  tags: [{
    type: String,
    trim: true
  }],
  // Color theme
  color: {
    type: String,
    default: 'blue'
  },
  // Icon
  icon: {
    type: String,
    default: '📅'
  },
  // Timeline
  timeline: {
    type: String
  },
  // Budget tracking
  budgetItems: [{
    name: {
      type: String,
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    category: {
      type: String,
      enum: ['venue', 'catering', 'entertainment', 'decoration', 'transportation', 'other'],
      default: 'other'
    },
    date: {
      type: Date,
      default: Date.now
    },
    notes: {
      type: String
    }
  }],
  // Sharing and collaboration
  isPublic: {
    type: Boolean,
    default: false
  },
  sharedWith: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['viewer', 'editor', 'admin'],
      default: 'viewer'
    }
  }]
}, {
  timestamps: true
});

// Indexes for better query performance
eventSchema.index({ user: 1, status: 1 });
eventSchema.index({ user: 1, eventType: 1 });
eventSchema.index({ user: 1, startDate: 1 });

// Virtual for budget remaining
eventSchema.virtual('budgetRemaining').get(function() {
  return this.budget - this.spentAmount;
});

// Virtual for budget percentage used
eventSchema.virtual('budgetPercentageUsed').get(function() {
  if (this.budget === 0) return 0;
  return Math.round((this.spentAmount / this.budget) * 100);
});

// Virtual for checklist completion percentage
eventSchema.virtual('checklistCompletionPercentage').get(function() {
  if (this.checklist.length === 0) return 0;
  const completedItems = this.checklist.filter(item => item.completed).length;
  return Math.round((completedItems / this.checklist.length) * 100);
});

// Method to update progress based on checklist completion
eventSchema.methods.updateProgress = function() {
  this.progress = this.checklistCompletionPercentage;
  return this.save();
};

// Method to add budget item
eventSchema.methods.addBudgetItem = function(item) {
  this.budgetItems.push(item);
  this.spentAmount += item.amount;
  return this.save();
};

// Method to complete checklist item
eventSchema.methods.completeChecklistItem = function(itemIndex) {
  if (this.checklist[itemIndex]) {
    this.checklist[itemIndex].completed = true;
    this.checklist[itemIndex].completedAt = new Date();
    this.updateProgress();
  }
  return this.save();
};

// Method to add note
eventSchema.methods.addNote = function(content) {
  this.notes.push({ content });
  return this.save();
};

// Static method to get events by status
eventSchema.statics.getEventsByStatus = function(userId, status) {
  return this.find({ user: userId, status });
};

// Static method to get events by type
eventSchema.statics.getEventsByType = function(userId, eventType) {
  return this.find({ user: userId, eventType });
};

// Static method to get upcoming events
eventSchema.statics.getUpcomingEvents = function(userId, limit = 5) {
  return this.find({
    user: userId,
    startDate: { $gte: new Date() },
    status: { $in: ['planning', 'in-progress'] }
  })
  .sort('startDate')
  .limit(limit);
};

// Static method to get overdue events
eventSchema.statics.getOverdueEvents = function(userId) {
  return this.find({
    user: userId,
    endDate: { $lt: new Date() },
    status: { $ne: 'completed' }
  });
};

// Pre-save middleware to update progress
eventSchema.pre('save', function(next) {
  if (this.checklist && this.checklist.length > 0) {
    this.progress = this.checklistCompletionPercentage;
  }
  next();
});

module.exports = mongoose.model('Event', eventSchema); 