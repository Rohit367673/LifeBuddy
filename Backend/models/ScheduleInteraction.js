const mongoose = require('mongoose');

const scheduleInteractionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  premiumTask: { type: mongoose.Schema.Types.ObjectId, ref: 'PremiumTask', required: false, index: true },
  action: { 
    type: String, 
    enum: ['accepted', 'skipped', 'rescheduled', 'completed', 'snoozed', 'ai_chat', 'ai_coding_help', 'ai_fitness_advice', 'ai_education', 'ai_productivity'], 
    required: true 
  },
  description: { type: String, trim: true },
  occurredAt: { type: Date, default: Date.now, index: true },
  // Optional metadata for richer signals
  metadata: {
    reason: { type: String, trim: true },
    fromDate: { type: Date },
    toDate: { type: Date },
    device: { type: String },
    timezone: { type: String },
    scheduleDay: { type: Number },
  }
}, { timestamps: true });

module.exports = mongoose.model('ScheduleInteraction', scheduleInteractionSchema);



