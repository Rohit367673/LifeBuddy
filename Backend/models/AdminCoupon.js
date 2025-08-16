const mongoose = require('mongoose');

const adminCouponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  discountType: {
    type: String,
    enum: ['percentage', 'fixed', 'free_trial'],
    required: true
  },
  discountValue: {
    type: Number,
    required: true
  },
  maxUses: {
    type: Number,
    default: null // null means unlimited
  },
  usedCount: {
    type: Number,
    default: 0
  },
  expiresAt: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  influencerTracking: {
    influencerName: String,
    influencerEmail: String,
    influencerInstagram: String,
    commissionRate: {
      type: Number,
      default: 0 // percentage
    },
    paymentDetails: {
      method: {
        type: String,
        enum: ['paypal', 'bank_transfer', 'upi', 'crypto']
      },
      details: String // encrypted payment info
    }
  },
  usage: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    usedAt: {
      type: Date,
      default: Date.now
    },
    orderValue: Number,
    commissionEarned: Number
  }],
  metadata: {
    description: String,
    campaignName: String,
    targetAudience: String
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
adminCouponSchema.index({ code: 1 });
adminCouponSchema.index({ createdBy: 1 });
adminCouponSchema.index({ isActive: 1, expiresAt: 1 });
adminCouponSchema.index({ 'influencerTracking.influencerEmail': 1 });

// Method to check if coupon is valid
adminCouponSchema.methods.isValid = function() {
  return this.isActive && 
         new Date() < this.expiresAt && 
         (this.maxUses === null || this.usedCount < this.maxUses);
};

// Method to use coupon
adminCouponSchema.methods.useCoupon = async function(userId, orderValue = 0) {
  if (!this.isValid()) {
    throw new Error('Coupon is not valid');
  }

  const commissionEarned = this.influencerTracking?.commissionRate 
    ? (orderValue * this.influencerTracking.commissionRate / 100)
    : 0;

  this.usage.push({
    user: userId,
    usedAt: new Date(),
    orderValue,
    commissionEarned
  });

  this.usedCount += 1;
  await this.save();

  return {
    discountType: this.discountType,
    discountValue: this.discountValue,
    commissionEarned
  };
};

// Static method to get admin-only coupons (for rohit367673@gmail.com)
adminCouponSchema.statics.getAdminCoupons = async function(adminEmail) {
  if (adminEmail !== 'rohit367673@gmail.com') {
    throw new Error('Unauthorized access to admin coupons');
  }

  return this.find({})
    .populate('createdBy', 'email name')
    .populate('usage.user', 'email name')
    .sort({ createdAt: -1 });
};

// Static method to get influencer analytics
adminCouponSchema.statics.getInfluencerAnalytics = async function(adminEmail) {
  if (adminEmail !== 'rohit367673@gmail.com') {
    throw new Error('Unauthorized access to analytics');
  }

  const analytics = await this.aggregate([
    {
      $match: {
        'influencerTracking.influencerEmail': { $exists: true, $ne: null }
      }
    },
    {
      $group: {
        _id: '$influencerTracking.influencerEmail',
        influencerName: { $first: '$influencerTracking.influencerName' },
        influencerInstagram: { $first: '$influencerTracking.influencerInstagram' },
        totalCoupons: { $sum: 1 },
        totalUses: { $sum: '$usedCount' },
        totalCommission: { $sum: { $sum: '$usage.commissionEarned' } },
        totalOrderValue: { $sum: { $sum: '$usage.orderValue' } },
        avgCommissionRate: { $avg: '$influencerTracking.commissionRate' }
      }
    },
    {
      $sort: { totalCommission: -1 }
    }
  ]);

  return analytics;
};

module.exports = mongoose.model('AdminCoupon', adminCouponSchema);
