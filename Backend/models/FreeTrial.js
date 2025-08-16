const mongoose = require('mongoose');

const freeTrialSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: true
  },
  requirements: {
    watchedAd: {
      type: Boolean,
      default: false
    },
    followedInstagram: {
      type: Boolean,
      default: false
    },
    sharedWithFriends: {
      type: Number, // Count of friends shared with
      default: 0
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('FreeTrial', freeTrialSchema);