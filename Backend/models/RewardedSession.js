const mongoose = require('mongoose');

const rewardedSessionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  sessionId: { type: String, required: true, unique: true, index: true },
  status: { type: String, enum: ['pending', 'rewarded'], default: 'pending' },
  meta: { type: Object, default: {} },
}, { timestamps: true });

module.exports = mongoose.model('RewardedSession', rewardedSessionSchema);
