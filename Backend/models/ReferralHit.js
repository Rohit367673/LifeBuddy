const mongoose = require('mongoose');

const referralHitSchema = new mongoose.Schema({
  code: { type: String, index: true },
  ip: { type: String, index: true },
  ua: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('ReferralHit', referralHitSchema);
