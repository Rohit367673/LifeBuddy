const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
  content: { type: String, required: true },
  topic: { type: String, default: 'general', index: true },
  createdAt: { type: Date, default: Date.now, index: true }
}, { timestamps: false });

// TTL index to auto-delete after 24 hours
chatMessageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);