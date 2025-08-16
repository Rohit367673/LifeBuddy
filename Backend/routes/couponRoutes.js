const express = require('express');
const { authenticateUser } = require('../middlewares/authMiddleware');
const Coupon = require('../models/Coupon');

const router = express.Router();

function ensureAdmin(req, res, next) {
  if (req.user?.email === 'rohit367673@gmail.com') return next();
  return res.status(403).json({ message: 'Admin access required' });
}

router.post('/create', authenticateUser, ensureAdmin, async (req, res) => {
  try {
    const { code, discountAmount, influencer = '' } = req.body;
    if (!code || !discountAmount) {
      return res.status(400).json({ message: 'code and discountAmount are required' });
    }
    const normalized = String(code).trim().toUpperCase();
    const existing = await Coupon.findOne({ code: normalized });
    if (existing) return res.status(409).json({ message: 'Coupon code already exists' });
    const coupon = await Coupon.create({ code: normalized, discountAmount: Number(discountAmount), influencer, createdBy: req.user.email });
    res.json({ success: true, coupon });
  } catch (e) {
    console.error('Create coupon error', e);
    res.status(500).json({ message: e.message });
  }
});

router.get('/validate', async (req, res) => {
  try {
    const code = String(req.query.code || '').trim().toUpperCase();
    if (!code) return res.status(400).json({ message: 'code is required' });
    const coupon = await Coupon.findOne({ code, isActive: true });
    if (!coupon) return res.status(404).json({ valid: false, message: 'Invalid or inactive coupon' });
    res.json({ valid: true, code: coupon.code, discountAmount: coupon.discountAmount, influencer: coupon.influencer });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.get('/list', authenticateUser, ensureAdmin, async (req, res) => {
  try {
    const coupons = await Coupon.find({}).sort({ createdAt: -1 });
    res.json({ coupons });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;
