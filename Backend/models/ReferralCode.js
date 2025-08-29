const mongoose = require('mongoose');

const referralCodeSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  code: { type: String, required: true, unique: true },
}, { timestamps: true });

module.exports = mongoose.model('ReferralCode', referralCodeSchema);
