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
    },
    {
      type: 'early_bird',
      title: 'Early Bird',
      description: 'Completed tasks before 9 AM for 5 days',
      icon: '🌅',
      badge: 'silver',
      points: 30,
      category: 'streaks',
      criteria: { earlyBirdDays: 5 }
    },
    {
      type: 'night_owl',
      title: 'Night Owl',
      description: 'Completed tasks after 10 PM for 5 days',
      icon: '🦉',
      badge: 'silver',
      points: 30,
      category: 'streaks',
      criteria: { nightOwlDays: 5 }
    },
    {
      type: 'social_butterfly',
      title: 'Social Butterfly',
      description: 'Created 5 events with social activities',
      icon: '🦋',
      badge: 'gold',
      points: 75,
      category: 'events',
      criteria: { socialEvents: 5 }
    },
    {
      type: 'homebody',
      title: 'Homebody',
      description: 'Created 5 events related to home improvement',
      icon: '🏠',
      badge: 'gold',
      points: 75,
      category: 'events',
      criteria: { homeEvents: 5 }
    },
    {
      type: 'fitness_freak',
      title: 'Fitness Freak',
      description: 'Completed 20 fitness-related tasks',
      icon: '💪',
      badge: 'gold',
      points: 100,
      category: 'tasks',
      criteria: { fitnessTasks: 20 }
    },
    {
      type: 'bookworm',
      title: 'Bookworm',
      description: 'Completed 10 learning-related tasks',
      icon: '📚',
      badge: 'silver',
      points: 50,
      category: 'tasks',
      criteria: { learningTasks: 10 }
    },
    {
      type: 'creative_soul',
      title: 'Creative Soul',
      description: 'Completed 15 creative tasks',
      icon: '🎨',
      badge: 'gold',
      points: 75,
      category: 'tasks',
      criteria: { creativeTasks: 15 }
    },
    {
      type: 'organizer',
      title: 'Organizer',
      description: 'Created 10 events with detailed checklists',
      icon: '📋',
      badge: 'silver',
      points: 50,
      category: 'events',
      criteria: { organizedEvents: 10 }
    },
    {
      type: 'goal_setter',
      title: 'Goal Setter',
      description: 'Set and completed 5 major life goals',
      icon: '🎯',
      badge: 'platinum',
      points: 150,
      category: 'milestones',
      criteria: { completedGoals: 5 }
    },
    {
      type: 'consistency_king',
      title: 'Consistency King',
      description: 'Maintained a 100-day streak of daily activity',
      icon: '👑',
      badge: 'diamond',
      points: 500,
      category: 'streaks',
      criteria: { consistencyStreak: 100 }
    },
    {
      type: 'stress_manager',
      title: 'Stress Manager',
      description: 'Logged mood for 50 days with stress management',
      icon: '🧘‍♀️',
      badge: 'gold',
      points: 100,
      category: 'mood',
      criteria: { stressManagedDays: 50 }
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
      type: 'mood_explorer',
      title: 'Mood Explorer',
      description: 'Logged 50 different mood entries',
      icon: '🌈',
      badge: 'gold',
      points: 100,
      category: 'mood',
      criteria: { moodEntries: 50 }
    },
    {
      type: 'event_planner',
      title: 'Event Planner',
      description: 'Created 20 events',
      icon: '📅',
      badge: 'platinum',
      points: 200,
      category: 'events',
      criteria: { eventsCreated: 20 }
    },
    {
      type: 'streak_master',
      title: 'Streak Master',
      description: 'Maintained a 30-day task completion streak',
      icon: '🔥',
      badge: 'diamond',
      points: 300,
      category: 'streaks',
      criteria: { taskStreak: 30 }
    },
    {
      type: 'birthday_planner_pro',
      title: 'Birthday Planner Pro',
      description: 'Planned and completed your first birthday event',
      icon: '🎉',
      badge: 'silver',
      points: 40,
      category: 'events',
      criteria: { birthdayEventsCompleted: 1 }
    },
    {
      type: 'budget_master',
      title: 'Budget Master',
      description: 'Successfully completed your first event budget plan',
      icon: '💰',
      badge: 'silver',
      points: 30,
      category: 'events',
      criteria: { budgetsCompleted: 1 }
    },
    {
      type: 'checklist_champion',
      title: 'Checklist Champion',
      description: 'Completed your first event checklist',
      icon: '📋',
      badge: 'bronze',
      points: 20,
      category: 'tasks',
      criteria: { checklistsCompleted: 1 }
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

// Virtual field to compute if achievement is earned
achievementSchema.virtual('isEarned').get(function() {
  if (!this.progress) return false;
  return this.progress.current >= this.progress.target;
});

module.exports = mongoose.model('Achievement', achievementSchema); 