const express = require('express');
const crypto = require('crypto');
const ReferralCode = require('../models/ReferralCode');
const ReferralHit = require('../models/ReferralHit');
const User = require('../models/User');
const { authenticateUser } = require('../middlewares/authMiddleware');

const router = express.Router();

function baseUrl() {
  return process.env.PUBLIC_BASE_URL || 'http://localhost:5001';
}

function frontendUrl() {
  return process.env.FRONTEND_URL || 'http://localhost:5173';
}

async function getOrCreateCode(userId) {
  let existing = await ReferralCode.findOne({ user: userId });
  if (existing) return existing;
  const code = crypto.randomBytes(5).toString('base64url');
  existing = await ReferralCode.create({ user: userId, code });
  return existing;
}

// Get my referral link
router.get('/my-link', authenticateUser, async (req, res) => {
  try {
    const rc = await getOrCreateCode(req.user._id);
    res.json({
      code: rc.code,
      link: `${baseUrl()}/r/${rc.code}`,
    });
  } catch (e) {
    console.error('Error getting referral link:', e);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
