const express = require('express');
const router = express.Router();
const { authenticateUser: auth } = require('../middlewares/authMiddleware');
const AdminCoupon = require('../models/AdminCoupon');
const User = require('../models/User');

// Middleware to check admin access (rohit367673@gmail.com only)
const requireAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (user.email !== 'rohit367673@gmail.com') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * POST /api/admin-coupons/create
 * Create a new admin coupon (admin only)
 */
router.post('/create', auth, requireAdmin, async (req, res) => {
  try {
    const {
      code,
      discountType,
      discountValue,
      maxUses,
      expiresAt,
      influencerTracking,
      metadata
    } = req.body;

    // Validate required fields
    if (!code || !discountType || !discountValue || !expiresAt) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Check if coupon code already exists
    const existingCoupon = await AdminCoupon.findOne({ code: code.toUpperCase() });
    if (existingCoupon) {
      return res.status(400).json({
        success: false,
        message: 'Coupon code already exists'
      });
    }

    const coupon = new AdminCoupon({
      code: code.toUpperCase(),
      createdBy: req.user.id,
      discountType,
      discountValue,
      maxUses,
      expiresAt: new Date(expiresAt),
      influencerTracking,
      metadata
    });

    await coupon.save();

    res.json({
      success: true,
      coupon
    });
  } catch (error) {
    console.error('Create admin coupon error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/admin-coupons/list
 * Get all admin coupons (admin only)
 */
router.get('/list', auth, requireAdmin, async (req, res) => {
  try {
    const coupons = await AdminCoupon.getAdminCoupons(req.user.email || 'rohit367673@gmail.com');
    
    res.json({
      success: true,
      coupons
    });
  } catch (error) {
    console.error('List admin coupons error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/admin-coupons/analytics
 * Get influencer analytics (admin only)
 */
router.get('/analytics', auth, requireAdmin, async (req, res) => {
  try {
    const analytics = await AdminCoupon.getInfluencerAnalytics(req.user.email || 'rohit367673@gmail.com');
    
    // Get overall stats
    const totalCoupons = await AdminCoupon.countDocuments();
    const activeCoupons = await AdminCoupon.countDocuments({ 
      isActive: true, 
      expiresAt: { $gt: new Date() } 
    });
    const totalUses = await AdminCoupon.aggregate([
      { $group: { _id: null, total: { $sum: '$usedCount' } } }
    ]);

    res.json({
      success: true,
      analytics,
      summary: {
        totalCoupons,
        activeCoupons,
        totalUses: totalUses[0]?.total || 0
      }
    });
  } catch (error) {
    console.error('Admin coupon analytics error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/admin-coupons/:id/toggle
 * Toggle coupon active status (admin only)
 */
router.put('/:id/toggle', auth, requireAdmin, async (req, res) => {
  try {
    const coupon = await AdminCoupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found'
      });
    }

    coupon.isActive = !coupon.isActive;
    await coupon.save();

    res.json({
      success: true,
      coupon
    });
  } catch (error) {
    console.error('Toggle coupon error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/admin-coupons/validate
 * Validate and use a coupon (public endpoint)
 */
router.post('/validate', auth, async (req, res) => {
  try {
    const { code, orderValue = 0 } = req.body;
    
    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Coupon code is required'
      });
    }

    const coupon = await AdminCoupon.findOne({ code: code.toUpperCase() });
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Invalid coupon code'
      });
    }

    if (!coupon.isValid()) {
      return res.status(400).json({
        success: false,
        message: 'Coupon is expired or reached maximum uses'
      });
    }

    // Use the coupon
    const result = await coupon.useCoupon(req.user.id, orderValue);

    res.json({
      success: true,
      discount: result,
      message: 'Coupon applied successfully'
    });
  } catch (error) {
    console.error('Validate coupon error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/admin-coupons/influencer/:email
 * Get specific influencer's performance (admin only)
 */
router.get('/influencer/:email', auth, requireAdmin, async (req, res) => {
  try {
    const influencerEmail = req.params.email;
    
    const coupons = await AdminCoupon.find({
      'influencerTracking.influencerEmail': influencerEmail
    }).populate('usage.user', 'email name');

    const totalCommission = coupons.reduce((sum, coupon) => {
      return sum + coupon.usage.reduce((usageSum, usage) => {
        return usageSum + (usage.commissionEarned || 0);
      }, 0);
    }, 0);

    const totalOrderValue = coupons.reduce((sum, coupon) => {
      return sum + coupon.usage.reduce((usageSum, usage) => {
        return usageSum + (usage.orderValue || 0);
      }, 0);
    }, 0);

    res.json({
      success: true,
      influencer: {
        email: influencerEmail,
        coupons,
        totalCommission,
        totalOrderValue,
        totalUses: coupons.reduce((sum, c) => sum + c.usedCount, 0)
      }
    });
  } catch (error) {
    console.error('Influencer performance error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
