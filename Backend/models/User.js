const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  firebaseUid: {
    type: String,
    required: false,
    unique: true,
    sparse: true
  },
  password: {
    type: String,
    required: false,
    minlength: 6
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  displayName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  username: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    maxlength: 30,
    match: /^[a-zA-Z0-9_]+$/
  },
  firstName: {
    type: String,
    trim: true,
    maxlength: 30
  },
  lastName: {
    type: String,
    trim: true,
    maxlength: 30
  },
  avatar: {
    type: String,
    default: null
  },
  personalQuote: {
    type: String,
    maxlength: 200,
    default: ''
  },
  profileVisibility: {
    type: String,
    enum: ['public', 'friends', 'private'],
    default: 'public'
  },
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'auto'
    },
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      push: {
        type: Boolean,
        default: true
      },
      reminders: {
        type: Boolean,
        default: true
      }
    },
    timezone: {
      type: String,
      default: 'UTC'
    }
  },
  stats: {
    totalEvents: {
      type: Number,
      default: 0
    },
    completedEvents: {
      type: Number,
      default: 0
    },
    completedTasks: {
      type: Number,
      default: 0
    },
    totalTasks: {
      type: Number,
      default: 0
    },
    moodEntries: {
      type: Number,
      default: 0
    },
    currentStreak: {
      type: Number,
      default: 0
    },
    longestStreak: {
      type: Number,
      default: 0
    },
    totalPoints: {
      type: Number,
      default: 0
    },
    lastActive: {
      type: Date,
      default: Date.now
    },
    logins: {
      type: Number,
      default: 0
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  loginHistory: {
    type: [Date],
    default: []
  }
}, {
  timestamps: true
});

// Index for better query performance
userSchema.index({ 'stats.lastActive': -1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  if (this.firstName && this.lastName) {
    return `${this.firstName} ${this.lastName}`;
  }
  return this.displayName;
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (this.isModified('password') && this.password) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to update last active
userSchema.methods.updateLastActive = function() {
  this.stats.lastActive = new Date();
  return this.save();
};

// Method to increment completed tasks
userSchema.methods.incrementCompletedTasks = function() {
  this.stats.completedTasks += 1;
  return this.save();
};

// Method to update streak
userSchema.methods.updateStreak = function(newStreak) {
  this.stats.currentStreak = newStreak;
  if (newStreak > this.stats.longestStreak) {
    this.stats.longestStreak = newStreak;
  }
  return this.save();
};

// Static method to get user stats
userSchema.statics.getUserStats = async function(userId) {
  const Task = require('./Task');
  const Event = require('./Event');
  const Mood = require('./Mood');
  
  const [taskStats, eventStats, moodStats] = await Promise.all([
    Task.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          totalTasks: { $sum: 1 },
          completedTasks: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          }
        }
      }
    ]),
    Event.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          totalEvents: { $sum: 1 },
          completedEvents: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          }
        }
      }
    ]),
    Mood.countDocuments({ user: userId })
  ]);

  return {
    totalTasks: taskStats[0]?.totalTasks || 0,
    completedTasks: taskStats[0]?.completedTasks || 0,
    totalEvents: eventStats[0]?.totalEvents || 0,
    completedEvents: eventStats[0]?.completedEvents || 0,
    moodEntries: moodStats || 0
  };
};

// Static method to get user streak
userSchema.statics.getUserStreak = async function(userId) {
  const Task = require('./Task');
  
  const tasks = await Task.find({ 
    user: userId,
    status: 'completed'
  }).sort({ completedAt: -1 }).limit(100);
  
  if (tasks.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }
  
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  let lastDate = null;
  
  for (const task of tasks) {
    const taskDate = new Date(task.completedAt).toDateString();
    
    if (!lastDate) {
      lastDate = taskDate;
      tempStreak = 1;
      currentStreak = 1;
    } else {
      const lastDateObj = new Date(lastDate);
      const taskDateObj = new Date(taskDate);
      const diffDays = Math.floor((lastDateObj - taskDateObj) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        tempStreak++;
        if (tempStreak > longestStreak) {
          longestStreak = tempStreak;
        }
        if (currentStreak === 0) {
          currentStreak = tempStreak;
        }
      } else if (diffDays === 0) {
        // Same day, continue
      } else {
        tempStreak = 1;
        if (currentStreak === 0) {
          currentStreak = 1;
        }
      }
      lastDate = taskDate;
    }
  }
  
  return { currentStreak, longestStreak };
};

module.exports = mongoose.model('User', userSchema); 