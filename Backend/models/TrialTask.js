const mongoose = require('mongoose');

const trialTaskSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  taskType: {
    type: String,
    enum: ['watch_ad', 'follow_instagram', 'share_with_friends'],
    required: true
  },
  completed: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date
  },
  metadata: {
    adProvider: String,
    adDuration: Number,
    shareCount: Number,
    shareMethod: String,
    verificationCode: String
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  }
}, {
  timestamps: true
});

// Index for efficient queries
trialTaskSchema.index({ user: 1, taskType: 1 });
trialTaskSchema.index({ user: 1, completed: 1 });
trialTaskSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Static method to check if user has completed all trial tasks
trialTaskSchema.statics.hasCompletedAllTasks = async function(userId) {
  const taskTypes = ['watch_ad', 'follow_instagram', 'share_with_friends'];
  const completedTasks = await this.find({
    user: userId,
    completed: true,
    expiresAt: { $gt: new Date() }
  }).distinct('taskType');
  
  return taskTypes.every(taskType => completedTasks.includes(taskType));
};

// Static method to get user's trial progress
trialTaskSchema.statics.getTrialProgress = async function(userId) {
  const taskTypes = ['watch_ad', 'follow_instagram', 'share_with_friends'];
  const tasks = await this.find({
    user: userId,
    expiresAt: { $gt: new Date() }
  });
  
  const progress = taskTypes.map(taskType => {
    const task = tasks.find(t => t.taskType === taskType);
    return {
      taskType,
      completed: task ? task.completed : false,
      completedAt: task ? task.completedAt : null
    };
  });
  
  const completedCount = progress.filter(p => p.completed).length;
  const isTrialEligible = completedCount === taskTypes.length;
  
  return {
    tasks: progress,
    completedCount,
    totalTasks: taskTypes.length,
    isTrialEligible
  };
};

module.exports = mongoose.model('TrialTask', trialTaskSchema);
