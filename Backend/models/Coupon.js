const mongoose = require('mongoose');

const couponUseSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  plan: { type: String, enum: ['monthly', 'yearly'], required: true },
  amountBefore: { type: Number, required: true },
  discountApplied: { type: Number, required: true },
  transactionId: { type: String },
  usedAt: { type: Date, default: Date.now }
}, { _id: false });

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  influencer: { type: String, default: '' },
  discountAmount: { type: Number, required: true, min: 0 },
  isActive: { type: Boolean, default: true },
  createdBy: { type: String, required: true },
  uses: { type: [couponUseSchema], default: [] },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Coupon', couponSchema);