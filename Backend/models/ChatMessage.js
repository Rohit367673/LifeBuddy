const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  role: {
    type: String,
    enum: ['user', 'ai'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  topic: {
    type: String,
    enum: ['general', 'coding', 'fitness', 'education', 'productivity'],
    default: 'general'
  },
  aiService: {
    type: String,
    enum: ['openrouter'],
    default: 'openrouter'
  },
  metadata: {
    responseTime: Number,
    tokenCount: Number,
    model: String
  }
}, {
  timestamps: true
});

// TTL index for 24-hour auto-deletion
chatMessageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 }); // 24 hours = 86400 seconds

// Index for efficient user queries
chatMessageSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);