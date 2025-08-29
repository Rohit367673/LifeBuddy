const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  firebaseUid: {
    type: String,
    required: false
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
    default: '/default-profile.png'
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
    },
    // Enhanced stats for badge unlock logic
    taskStreak: {
      type: Number,
      default: 0
    },
    moodStreak: {
      type: Number,
      default: 0
    },
    earlyBirdDays: {
      type: Number,
      default: 0
    },
    nightOwlDays: {
      type: Number,
      default: 0
    },
    socialEvents: {
      type: Number,
      default: 0
    },
    homeEvents: {
      type: Number,
      default: 0
    },
    fitnessTasks: {
      type: Number,
      default: 0
    },
    learningTasks: {
      type: Number,
      default: 0
    },
    creativeTasks: {
      type: Number,
      default: 0
    },
    organizedEvents: {
      type: Number,
      default: 0
    },
    completedGoals: {
      type: Number,
      default: 0
    },
    consistencyStreak: {
      type: Number,
      default: 0
    },
    stressManagedDays: {
      type: Number,
      default: 0
    },
    perfectWeeks: {
      type: Number,
      default: 0
    },
    lastTaskCompletion: {
      type: Date
    },
    lastMoodEntry: {
      type: Date
    },
    taskCompletionHistory: {
      type: [Date],
      default: []
    },
    moodEntryHistory: {
      type: [Date],
      default: []
    },
    birthdayEventsCompleted: { type: Number, default: 0 },
    budgetsCompleted: { type: Number, default: 0 },
    checklistsCompleted: { type: Number, default: 0 },
    eventMilestones: [{ name: String, date: Date }],
  },
  isActive: {
    type: Boolean,
    default: true
  },
  friends: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  loginHistory: {
    type: [Date],
    default: []
  },
  phoneNumber: {
    type: String,
    trim: true,
    maxlength: 20,
    default: ''
  },
  // Premium subscription fields
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'monthly', 'yearly'],
      default: 'free'
    },
    status: {
      type: String,
      enum: ['active', 'canceled', 'expired', 'trial'],
      default: 'active'
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    endDate: {
      type: Date
    },
    trialEndDate: {
      type: Date
    },
    stripeCustomerId: {
      type: String
    },
    stripeSubscriptionId: {
      type: String
    },
    premiumBadge: {
      type: Boolean,
      default: false
    },
    badgeGrantedAt: {
      type: Date
    }
  },
  // Usage tracking for freemium limits
  usage: {
    activeEvents: {
      type: Number,
      default: 0
    },
    dailyTasks: {
      type: Number,
      default: 0
    },
    moodEntries: {
      type: Number,
      default: 0
    },
    lastTaskReset: {
      type: Date,
      default: Date.now
    }
  },
  // Feature flags
  features: {
    unlimitedEvents: {
      type: Boolean,
      default: false
    },
    advancedBudgetTracking: {
      type: Boolean,
      default: false
    },
    fullMoodHistory: {
      type: Boolean,
      default: false
    },
    customChecklists: {
      type: Boolean,
      default: false
    },
    premiumMotivationalMessages: {
      type: Boolean,
      default: false
    },
    profileInsights: {
      type: Boolean,
      default: false
    },
    fullCalendarSync: {
      type: Boolean,
      default: false
    },
    adFree: {
      type: Boolean,
      default: false
    },
    exportablePDFs: {
      type: Boolean,
      default: false
    },
    aiInsights: {
      type: Boolean,
      default: false
    },
    prioritySupport: {
      type: Boolean,
      default: false
    },
    advancedAnalytics: {
      type: Boolean,
      default: false
    }
  },
  // Purchased items
  purchases: {
    eventPacks: [{
      packId: String,
      name: String,
      purchasedAt: {
        type: Date,
        default: Date.now
      }
    }],
    checklistTemplates: [{
      templateId: String,
      name: String,
      purchasedAt: {
        type: Date,
        default: Date.now
      }
    }],
    profileThemes: [{
      themeId: String,
      name: String,
      purchasedAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  // Messaging platform configuration
  notificationPlatform: {
    type: String,
    enum: ['whatsapp', 'telegram', 'email'],
    default: 'email'
  },
  telegramChatId: {
    type: String,
    default: null
  },
  telegramUsername: {
    type: String,
    trim: true,
    maxlength: 50,
    default: ''
  },
  // Personalized AI model (fine-tuned) per user
  fineTunedModel: {
    type: String,
    default: ''
  },
  // Trial task tracking for eligibility
  trialTasks: {
    watchedAd: { type: Boolean, default: false },
    followedInstagram: { type: Boolean, default: false },
    sharedReferrals: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now }
  },
  // Custom AI assistant display name
  aiAssistantName: {
    type: String,
    trim: true,
    maxlength: 40,
    default: 'LifeBuddy AI'
  },
  // Custom AI theme preferences
  aiThemeColor: {
    type: String,
    trim: true,
    default: '#7c3aed' // purple
  },
  aiBackgroundStyle: {
    type: String,
    enum: ['glass', 'gradient', 'particles'],
    default: 'glass'
  },
  // AI Personalization fields
  aiProfile: {
    learningStyle: {
      type: String,
      enum: ['visual', 'auditory', 'kinesthetic', 'reading', 'mixed'],
      default: 'mixed'
    },
    experienceLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert'],
      default: 'beginner'
    },
    communicationStyle: {
      type: String,
      enum: ['direct', 'encouraging', 'detailed', 'concise', 'casual'],
      default: 'encouraging'
    },
    goals: {
      type: [String],
      default: ['General improvement']
    },
    interests: {
      type: [String],
      default: []
    },
    allowTrainingUse: {
      type: Boolean,
      default: true
    }
  },
  // Free trial tracking
  freeTrial: {
    isEligible: {
      type: Boolean,
      default: true
    },
    hasUsed: {
      type: Boolean,
      default: false
    },
    startDate: {
      type: Date
    },
    endDate: {
      type: Date
    }
  },
  // Coupon usage
  couponsUsed: [{
    couponCode: String,
    usedAt: {
      type: Date,
      default: Date.now
    },
    paymentId: String
  }]
  // Remove FCM token field
  // fcmToken: { type: String },
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

// Method to increment completed tasks and update streaks
userSchema.methods.incrementCompletedTasks = async function(taskData = {}) {
  this.stats.completedTasks += 1;
  this.stats.lastTaskCompletion = new Date();
  
  // Add to task completion history
  this.stats.taskCompletionHistory.push(new Date());
  
  // Update task streak
  await this.updateTaskStreak();
  
  // Check for early bird/night owl achievements
  const hour = new Date().getHours();
  if (hour < 9) {
    this.stats.earlyBirdDays += 1;
  } else if (hour >= 22) {
    this.stats.nightOwlDays += 1;
  }
  
  // Categorize task for specific achievements
  if (taskData.category) {
    switch (taskData.category.toLowerCase()) {
      case 'fitness':
      case 'exercise':
      case 'workout':
        this.stats.fitnessTasks += 1;
        break;
      case 'learning':
      case 'study':
      case 'education':
        this.stats.learningTasks += 1;
        break;
      case 'creative':
      case 'art':
      case 'design':
      case 'writing':
        this.stats.creativeTasks += 1;
        break;
    }
  }
  
  return this.save();
};

// Method to update task streak
userSchema.methods.updateTaskStreak = async function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Get recent task completions
  const recentCompletions = this.stats.taskCompletionHistory
    .filter(date => date >= new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000))
    .sort((a, b) => b - a);
  
  let currentStreak = 0;
  let checkDate = today;
  
  for (let i = 0; i < 30; i++) {
    const hasCompletion = recentCompletions.some(date => {
      const completionDate = new Date(date);
      completionDate.setHours(0, 0, 0, 0);
      return completionDate.getTime() === checkDate.getTime();
    });
    
    if (hasCompletion) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }
  
  this.stats.taskStreak = currentStreak;
  if (currentStreak > this.stats.longestStreak) {
    this.stats.longestStreak = currentStreak;
  }
  
  // Update consistency streak (any daily activity)
  await this.updateConsistencyStreak();
};

// Method to update mood streak
userSchema.methods.updateMoodStreak = async function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Get recent mood entries
  const recentEntries = this.stats.moodEntryHistory
    .filter(date => date >= new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000))
    .sort((a, b) => b - a);
  
  let currentStreak = 0;
  let checkDate = today;
  
  for (let i = 0; i < 60; i++) {
    const hasEntry = recentEntries.some(date => {
      const entryDate = new Date(date);
      entryDate.setHours(0, 0, 0, 0);
      return entryDate.getTime() === checkDate.getTime();
    });
    
    if (hasEntry) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }
  
  this.stats.moodStreak = currentStreak;
};

// Method to update consistency streak (any daily activity)
userSchema.methods.updateConsistencyStreak = async function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Combine task completions and mood entries
  const allActivities = [
    ...this.stats.taskCompletionHistory,
    ...this.stats.moodEntryHistory
  ].sort((a, b) => b - a);
  
  let currentStreak = 0;
  let checkDate = today;
  
  for (let i = 0; i < 100; i++) {
    const hasActivity = allActivities.some(date => {
      const activityDate = new Date(date);
      activityDate.setHours(0, 0, 0, 0);
      return activityDate.getTime() === checkDate.getTime();
    });
    
    if (hasActivity) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }
  
  this.stats.consistencyStreak = currentStreak;
};

// Method to add mood entry and update streaks
userSchema.methods.addMoodEntry = async function(moodData = {}) {
  this.stats.moodEntries += 1;
  this.stats.lastMoodEntry = new Date();
  
  // Add to mood entry history
  this.stats.moodEntryHistory.push(new Date());
  
  // Update mood streak
  await this.updateMoodStreak();
  
  // Check for stress management achievement
  if (moodData.stressLevel && moodData.stressLevel <= 3) {
    this.stats.stressManagedDays += 1;
  }
  
  // Update consistency streak
  await this.updateConsistencyStreak();
  
  return this.save();
};

// Method to add event and categorize it
userSchema.methods.addEvent = async function(eventData = {}) {
  this.stats.totalEvents += 1;
  
  // Categorize event for specific achievements
  if (eventData.type) {
    switch (eventData.type.toLowerCase()) {
      case 'social':
      case 'party':
      case 'meeting':
      case 'gathering':
        this.stats.socialEvents += 1;
        break;
      case 'home':
      case 'renovation':
      case 'maintenance':
      case 'improvement':
        this.stats.homeEvents += 1;
        break;
      case 'wedding':
      case 'wedding planning':
        this.stats.socialEvents += 1;
        break;
      case 'moving':
      case 'relocation':
        this.stats.homeEvents += 1;
        break;
      case 'career':
      case 'job change':
        this.stats.completedGoals += 1;
        break;
      case 'education':
      case 'graduation':
        this.stats.completedGoals += 1;
        break;
      case 'business':
      case 'startup':
        this.stats.completedGoals += 1;
        break;
      case 'health':
      case 'fitness':
        this.stats.fitnessTasks += 1;
        break;
      case 'travel':
      case 'vacation':
        this.stats.socialEvents += 1;
        break;
    }
  }
  
  // Check if event has detailed checklist
  if (eventData.checklist && eventData.checklist.length > 5) {
    this.stats.organizedEvents += 1;
  }
  
  // Update usage tracking
  this.usage.activeEvents += 1;
  
  return this.save();
};

// Method to complete event
userSchema.methods.completeEvent = async function() {
  this.stats.completedEvents += 1;
  
  // Update usage tracking
  if (this.usage.activeEvents > 0) {
    this.usage.activeEvents -= 1;
  }
  
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
  const user = await this.findById(userId); // Fetch the user document
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
    tasksCompleted: user?.stats?.completedTasks || 0, // Now this will work
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