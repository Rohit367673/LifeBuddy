const mongoose = require('mongoose');

const subtaskSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  subtask: { type: String, required: true },
  status: { type: String, enum: ['pending', 'completed', 'skipped'], default: 'pending' },
  motivationTip: { type: String }
});

const premiumTaskSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true },
  description: { type: String },
  requirements: { type: String },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  generatedSchedule: [subtaskSchema],
  consentGiven: { type: Boolean, default: false },
  streak: { type: Number, default: 0 },
  stats: {
    completed: { type: Number, default: 0 },
    skipped: { type: Number, default: 0 },
    currentStreak: { type: Number, default: 0 },
    bestStreak: { type: Number, default: 0 }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('PremiumTask', premiumTaskSchema); 