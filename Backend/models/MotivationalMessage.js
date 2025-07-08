const mongoose = require('mongoose');

const motivationalMessageSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    maxlength: 500
  },
  author: {
    type: String,
    maxlength: 100
  },
  category: {
    type: String,
    enum: ['motivation', 'success', 'happiness', 'productivity', 'mindfulness', 'leadership', 'creativity', 'resilience', 'growth', 'inspiration'],
    required: true
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 20
  }],
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  usageCount: {
    type: Number,
    default: 0
  },
  lastUsed: {
    type: Date
  },
  language: {
    type: String,
    default: 'en'
  },
  source: {
    type: String,
    maxlength: 200
  },
  context: {
    type: String,
    enum: ['morning', 'afternoon', 'evening', 'anytime'],
    default: 'anytime'
  }
}, {
  timestamps: true
});

// Indexes for better query performance
motivationalMessageSchema.index({ category: 1, isActive: 1 });
motivationalMessageSchema.index({ tags: 1, isActive: 1 });
motivationalMessageSchema.index({ context: 1, isActive: 1 });
motivationalMessageSchema.index({ usageCount: 1 });

// Static method to get a random motivational message
motivationalMessageSchema.statics.getRandomMessage = async function(category = null, context = null) {
  const query = { isActive: true };
  
  if (category) {
    query.category = category;
  }
  
  if (context) {
    query.context = { $in: [context, 'anytime'] };
  }
  
  // Get messages with lower usage count first (to ensure variety)
  const messages = await this.find(query)
    .sort({ usageCount: 1, lastUsed: 1 })
    .limit(10);
  
  if (messages.length === 0) {
    return null;
  }
  
  // Select a random message from the top 10
  const randomIndex = Math.floor(Math.random() * messages.length);
  const selectedMessage = messages[randomIndex];
  
  // Update usage count and last used
  await this.findByIdAndUpdate(selectedMessage._id, {
    $inc: { usageCount: 1 },
    lastUsed: new Date()
  });
  
  return selectedMessage;
};

// Static method to get messages by category
motivationalMessageSchema.statics.getMessagesByCategory = async function(category, limit = 5) {
  return await this.find({ 
    category, 
    isActive: true 
  })
  .sort({ usageCount: 1 })
  .limit(limit);
};

// Static method to seed default messages
motivationalMessageSchema.statics.seedDefaultMessages = async function() {
  const defaultMessages = [
    {
      content: "The only way to do great work is to love what you do.",
      author: "Steve Jobs",
      category: "motivation",
      tags: ["work", "passion", "success"],
      context: "morning"
    },
    {
      content: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
      author: "Winston Churchill",
      category: "resilience",
      tags: ["success", "failure", "courage"],
      context: "anytime"
    },
    {
      content: "The future belongs to those who believe in the beauty of their dreams.",
      author: "Eleanor Roosevelt",
      category: "inspiration",
      tags: ["dreams", "future", "belief"],
      context: "morning"
    },
    {
      content: "Happiness is not something ready-made. It comes from your own actions.",
      author: "Dalai Lama",
      category: "happiness",
      tags: ["happiness", "actions", "mindfulness"],
      context: "anytime"
    },
    {
      content: "The only limit to our realization of tomorrow is our doubts of today.",
      author: "Franklin D. Roosevelt",
      category: "growth",
      tags: ["growth", "doubts", "future"],
      context: "morning"
    },
    {
      content: "Productivity is never an accident. It is always the result of a commitment to excellence, intelligent planning, and focused effort.",
      author: "Paul J. Meyer",
      category: "productivity",
      tags: ["productivity", "planning", "excellence"],
      context: "morning"
    },
    {
      content: "Creativity is intelligence having fun.",
      author: "Albert Einstein",
      category: "creativity",
      tags: ["creativity", "intelligence", "fun"],
      context: "afternoon"
    },
    {
      content: "The best way to predict the future is to create it.",
      author: "Peter Drucker",
      category: "leadership",
      tags: ["future", "creation", "leadership"],
      context: "anytime"
    },
    {
      content: "Every day is a new beginning. Take a deep breath and start again.",
      author: "Anonymous",
      category: "mindfulness",
      tags: ["new beginning", "mindfulness", "fresh start"],
      context: "morning"
    },
    {
      content: "The journey of a thousand miles begins with one step.",
      author: "Lao Tzu",
      category: "motivation",
      tags: ["journey", "beginning", "steps"],
      context: "anytime"
    },
    {
      content: "Your time is limited, don't waste it living someone else's life.",
      author: "Steve Jobs",
      category: "inspiration",
      tags: ["time", "authenticity", "life"],
      context: "evening"
    },
    {
      content: "The mind is everything. What you think you become.",
      author: "Buddha",
      category: "mindfulness",
      tags: ["mind", "thoughts", "transformation"],
      context: "anytime"
    },
    {
      content: "Don't watch the clock; do what it does. Keep going.",
      author: "Sam Levenson",
      category: "productivity",
      tags: ["persistence", "time", "progress"],
      context: "afternoon"
    },
    {
      content: "The only person you are destined to become is the person you decide to be.",
      author: "Ralph Waldo Emerson",
      category: "growth",
      tags: ["destiny", "choice", "growth"],
      context: "morning"
    },
    {
      content: "Success usually comes to those who are too busy to be looking for it.",
      author: "Henry David Thoreau",
      category: "success",
      tags: ["success", "busy", "focus"],
      context: "anytime"
    }
  ];
  
  for (const message of defaultMessages) {
    const exists = await this.findOne({ content: message.content });
    if (!exists) {
      await this.create(message);
    }
  }
};

module.exports = mongoose.model('MotivationalMessage', motivationalMessageSchema); 