const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
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
    maxlength: 200
  },
  description: { 
    type: String, 
    trim: true,
    maxlength: 1000
  },
  schedule_date: { 
    type: Date, 
    required: true,
    index: true
  },
  schedule_time: { 
    type: String, 
    trim: true,
    default: '09:00'
  },
  duration_days: { 
    type: Number, 
    required: true,
    min: 1,
    max: 365
  },
  current_day: { 
    type: Number, 
    default: 1,
    min: 1
  },
  status: { 
    type: String, 
    enum: ['active', 'completed', 'paused', 'cancelled'], 
    default: 'active',
    index: true
  },
  // User contact information for notifications
  user_email: { 
    type: String, 
    required: true,
    trim: true,
    lowercase: true
  },
  user_phone: { 
    type: String, 
    trim: true,
    default: ''
  },
  user_telegram_id: { 
    type: String, 
    trim: true,
    default: ''
  },
  // Reminder platform preferences
  reminder_platforms: [{ 
    type: String, 
    enum: ['email', 'whatsapp', 'telegram'],
    default: ['email']
  }],
  // Reminder tracking
  reminder_sent: { 
    type: Boolean, 
    default: false,
    index: true
  },
  last_reminder_sent: { 
    type: Date 
  },
  reminder_count: { 
    type: Number, 
    default: 0 
  },
  // AI generated schedule content for each day
  daily_schedules: [{
    day: { 
      type: Number, 
      required: true,
      min: 1
    },
    content: { 
      type: String, 
      required: true,
      trim: true
    },
    tasks: [{ 
      type: String, 
      trim: true 
    }],
    completed: { 
      type: Boolean, 
      default: false 
    },
    completed_at: { 
      type: Date 
    }
  }],
  // Original AI prompt and generation metadata
  original_prompt: { 
    type: String, 
    trim: true 
  },
  ai_model_used: { 
    type: String, 
    default: 'openrouter' 
  },
  generation_metadata: {
    prompt_tokens: Number,
    completion_tokens: Number,
    total_tokens: Number,
    model_name: String,
    generation_time: Number
  },
  // User preferences for this schedule
  preferences: {
    reminder_time: { 
      type: String, 
      default: '09:00' 
    },
    timezone: { 
      type: String, 
      default: 'UTC' 
    },
    motivational_style: { 
      type: String, 
      enum: ['encouraging', 'direct', 'casual', 'professional'],
      default: 'encouraging' 
    }
  }
}, {
  timestamps: true
});

// Indexes for better query performance
scheduleSchema.index({ user: 1, schedule_date: 1 });
scheduleSchema.index({ schedule_date: 1, reminder_sent: 1 });
scheduleSchema.index({ status: 1, schedule_date: 1 });

// Virtual for current day's content
scheduleSchema.virtual('currentDayContent').get(function() {
  const currentDay = this.daily_schedules.find(day => day.day === this.current_day);
  return currentDay ? currentDay.content : null;
});

// Method to get today's schedule content
scheduleSchema.methods.getTodayContent = function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const scheduleDate = new Date(this.schedule_date);
  scheduleDate.setHours(0, 0, 0, 0);
  
  const daysDiff = Math.floor((today - scheduleDate) / (1000 * 60 * 60 * 24)) + 1;
  
  if (daysDiff > 0 && daysDiff <= this.duration_days) {
    const daySchedule = this.daily_schedules.find(day => day.day === daysDiff);
    return daySchedule ? daySchedule.content : null;
  }
  
  return null;
};

// Method to mark reminder as sent
scheduleSchema.methods.markReminderSent = function() {
  this.reminder_sent = true;
  this.last_reminder_sent = new Date();
  this.reminder_count += 1;
  return this.save();
};

// Method to reset daily reminder flag (called by cron job)
scheduleSchema.methods.resetDailyReminder = function() {
  this.reminder_sent = false;
  return this.save();
};

// Static method to find today's schedules that need reminders
scheduleSchema.statics.findTodaysSchedules = function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return this.find({
    schedule_date: {
      $lte: today
    },
    status: 'active',
    reminder_sent: false,
    $expr: {
      $lte: [
        { $add: [
          "$schedule_date",
          { $multiply: [{ $subtract: ["$current_day", 1] }, 24 * 60 * 60 * 1000] }
        ]},
        today
      ]
    }
  }).populate('user', 'email displayName phoneNumber telegramChatId preferences.timezone');
};

// Static method to get schedules for a specific date
scheduleSchema.statics.findSchedulesByDate = function(date) {
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);
  
  return this.find({
    schedule_date: {
      $lte: targetDate
    },
    status: 'active',
    $expr: {
      $and: [
        { $lte: [
          { $add: [
            "$schedule_date",
            { $multiply: [{ $subtract: ["$current_day", 1] }, 24 * 60 * 60 * 1000] }
          ]},
          targetDate
        ]},
        { $gte: [
          { $add: [
            "$schedule_date",
            { $multiply: ["$duration_days", 24 * 60 * 60 * 1000] }
          ]},
          targetDate
        ]}
      ]
    }
  }).populate('user', 'email displayName phoneNumber telegramChatId preferences.timezone');
};

module.exports = mongoose.model('Schedule', scheduleSchema);
