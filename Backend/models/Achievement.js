const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    required: true,
    enum: [
      'event_completed',
      'task_streak',
      'mood_streak',
      'first_event',
      'first_task',
      'first_mood',
      'perfect_week',
      'perfect_month',
      'early_bird',
      'night_owl',
      'social_butterfly',
      'homebody',
      'fitness_freak',
      'bookworm',
      'creative_soul',
      'organizer',
      'goal_setter',
      'consistency_king',
      'stress_manager',
      'productivity_master',
      'first_login'
    ]
  },
  title: {
    type: String,
    required: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    maxlength: 500
  },
  icon: {
    type: String,
    required: true,
    maxlength: 50
  },
  badge: {
    type: String,
    required: true,
    enum: ['bronze', 'silver', 'gold', 'platinum', 'diamond']
  },
  points: {
    type: Number,
    default: 0,
    min: 0
  },
  criteria: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  earnedAt: {
    type: Date,
    default: Date.now
  },
  isHidden: {
    type: Boolean,
    default: false
  },
  progress: {
    current: {
      type: Number,
      default: 0
    },
    target: {
      type: Number,
      required: true
    }
  },
  category: {
    type: String,
    enum: ['events', 'tasks', 'mood', 'streaks', 'special', 'milestones', 'login'],
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
achievementSchema.index({ user: 1, type: 1 });
achievementSchema.index({ user: 1, earnedAt: -1 });
achievementSchema.index({ user: 1, category: 1 });
achievementSchema.index({ type: 1 });

// Virtual for completion percentage
achievementSchema.virtual('completionPercentage').get(function() {
  if (this.progress.target === 0) return 0;
  return Math.min(100, Math.round((this.progress.current / this.progress.target) * 100));
});

// Virtual for is earned
achievementSchema.virtual('isEarned').get(function() {
  return this.progress.current >= this.progress.target;
});

// Static method to get all available achievements
achievementSchema.statics.getAvailableAchievements = function() {
  return [
    {
      type: 'first_event',
      title: 'First Steps',
      description: 'Created your first life event',
      icon: '🎯',
      badge: 'bronze',
      points: 10,
      category: 'events',
      criteria: { eventsCreated: 1 }
    },
    {
      type: 'first_task',
      title: 'Task Master',
      description: 'Completed your first task',
      icon: '✅',
      badge: 'bronze',
      points: 5,
      category: 'tasks',
      criteria: { tasksCompleted: 1 }
    },
    {
      type: 'first_mood',
      title: 'Mood Tracker',
      description: 'Logged your first mood entry',
      icon: '😊',
      badge: 'bronze',
      points: 5,
      category: 'mood',
      criteria: { moodEntries: 1 }
    },
    {
      type: 'event_completed',
      title: 'Event Champion',
      description: 'Completed your first major life event',
      icon: '🏆',
      badge: 'silver',
      points: 50,
      category: 'events',
      criteria: { eventsCompleted: 1 }
    },
    {
      type: 'task_streak',
      title: 'Consistency King',
      description: 'Completed tasks for 7 days in a row',
      icon: '🔥',
      badge: 'silver',
      points: 25,
      category: 'streaks',
      criteria: { taskStreak: 7 }
    },
    {
      type: 'mood_streak',
      title: 'Mindful Tracker',
      description: 'Logged mood for 30 days in a row',
      icon: '🧘',
      badge: 'gold',
      points: 100,
      category: 'streaks',
      criteria: { moodStreak: 30 }
    },
    {
      type: 'perfect_week',
      title: 'Perfect Week',
      description: 'Completed all planned tasks in a week',
      icon: '⭐',
      badge: 'gold',
      points: 75,
      category: 'milestones',
      criteria: { perfectWeeks: 1 }
    },
    {
      type: 'productivity_master',
      title: 'Productivity Master',
      description: 'Completed 100 tasks',
      icon: '⚡',
      badge: 'platinum',
      points: 200,
      category: 'tasks',
      criteria: { tasksCompleted: 100 }
    },
    {
      type: 'first_login',
      title: 'Welcome Aboard!',
      description: 'Logged in for the first time',
      icon: '🚀',
      badge: 'bronze',
      points: 5,
      category: 'login',
      criteria: { logins: 1 }
    }
  ];
};

// Method to check and award achievements
achievementSchema.statics.checkAchievements = async function(userId, userStats) {
  const availableAchievements = this.getAvailableAchievements();
  const userAchievements = await this.find({ user: userId });
  const earnedTypes = userAchievements.map(a => a.type);
  
  const newAchievements = [];
  
  for (const achievement of availableAchievements) {
    if (earnedTypes.includes(achievement.type)) continue;
    
    const isEarned = this.checkCriteria(achievement.criteria, userStats);
    
    if (isEarned) {
      const newAchievement = new this({
        user: userId,
        ...achievement,
        progress: {
          current: this.getCurrentProgress(achievement.criteria, userStats),
          target: this.getTargetProgress(achievement.criteria)
        }
      });
      
      await newAchievement.save();
      newAchievements.push(newAchievement);
    }
  }
  
  return newAchievements;
};

// Helper method to check if criteria is met
achievementSchema.statics.checkCriteria = function(criteria, userStats) {
  for (const [key, target] of Object.entries(criteria)) {
    const current = userStats[key] || 0;
    if (current < target) return false;
  }
  return true;
};

// Helper method to get current progress
achievementSchema.statics.getCurrentProgress = function(criteria, userStats) {
  const values = Object.values(criteria);
  const currents = Object.keys(criteria).map(key => userStats[key] || 0);
  
  if (values.length === 1) {
    return Math.min(currents[0], values[0]);
  }
  
  // For multiple criteria, return the minimum completion percentage
  const percentages = values.map((target, index) => 
    Math.min(100, (currents[index] / target) * 100)
  );
  
  return Math.min(...percentages);
};

// Helper method to get target progress
achievementSchema.statics.getTargetProgress = function(criteria) {
  const values = Object.values(criteria);
  return values.length === 1 ? values[0] : 100;
};

module.exports = mongoose.model('Achievement', achievementSchema); 