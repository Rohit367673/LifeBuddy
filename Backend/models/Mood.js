const mongoose = require('mongoose');

const moodSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  mood: {
    emoji: {
      type: String,
      required: true,
      enum: ['😊', '😄', '😌', '😐', '😔', '😢', '😡', '😤', '🤔', '😴', '😍', '🤩', '😎', '🥳', '😇', '🤗', '😌', '😴', '😵', '🤯']
    },
    rating: {
      type: Number,
      min: 1,
      max: 10,
      required: true
    },
    label: {
      type: String,
      required: true,
      enum: ['excellent', 'great', 'good', 'okay', 'meh', 'bad', 'terrible', 'stressed', 'excited', 'calm', 'tired', 'energetic', 'focused', 'distracted', 'happy', 'sad', 'angry', 'anxious', 'confused', 'peaceful']
    }
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 500
  },
  activities: [{
    type: String,
    enum: ['work', 'exercise', 'social', 'family', 'hobby', 'rest', 'travel', 'learning', 'creative', 'health', 'other']
  }],
  weather: {
    type: String,
    enum: ['sunny', 'cloudy', 'rainy', 'snowy', 'windy', 'stormy', 'foggy', 'clear', 'other']
  },
  sleepHours: {
    type: Number,
    min: 0,
    max: 24
  },
  energyLevel: {
    type: Number,
    min: 1,
    max: 10
  },
  stressLevel: {
    type: Number,
    min: 1,
    max: 10
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 20
  }],
  isPublic: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for better query performance
moodSchema.index({ user: 1, date: -1 });
moodSchema.index({ user: 1, 'mood.rating': 1 });
moodSchema.index({ user: 1, 'mood.label': 1 });
moodSchema.index({ date: 1 });

// Virtual for day of week
moodSchema.virtual('dayOfWeek').get(function() {
  return this.date.toLocaleDateString('en-US', { weekday: 'long' });
});

// Virtual for month
moodSchema.virtual('month').get(function() {
  return this.date.toLocaleDateString('en-US', { month: 'long' });
});

// Method to get mood statistics
moodSchema.statics.getMoodStats = async function(userId, startDate, endDate) {
  const stats = await this.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        date: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$mood.rating' },
        totalEntries: { $sum: 1 },
        moodDistribution: {
          $push: '$mood.label'
        }
      }
    }
  ]);
  
  return stats[0] || { averageRating: 0, totalEntries: 0, moodDistribution: [] };
};

// Method to get mood streak
moodSchema.statics.getMoodStreak = async function(userId) {
  const entries = await this.find({ user: userId })
    .sort({ date: -1 })
    .limit(30);
  
  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);
  
  for (const entry of entries) {
    const entryDate = new Date(entry.date);
    entryDate.setHours(0, 0, 0, 0);
    
    const diffDays = Math.floor((currentDate - entryDate) / (1000 * 60 * 60 * 24));
    
    if (diffDays === streak) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
};

module.exports = mongoose.model('Mood', moodSchema); 