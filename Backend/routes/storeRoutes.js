const express = require('express');
const User = require('../models/User');
const { authenticateUser } = require('../middlewares/authMiddleware');

const router = express.Router();

// Available products
const products = {
  eventPacks: [
    {
      id: 'wedding-pack',
      name: 'Wedding Planning Pack',
      description: 'Complete wedding planning templates and checklists',
      price: 9.99,
      type: 'eventPack',
      features: [
        'Wedding timeline template',
        'Vendor checklist',
        'Budget tracker',
        'Guest list manager',
        'Ceremony & reception planning'
      ]
    },
    {
      id: 'vacation-pack',
      name: 'Vacation Planning Pack',
      description: 'Travel planning made easy',
      price: 4.99,
      type: 'eventPack',
      features: [
        'Trip itinerary template',
        'Packing checklist',
        'Budget tracker',
        'Activity planner',
        'Travel document organizer'
      ]
    },
    {
      id: 'birthday-pack',
      name: 'Birthday Celebration Pack',
      description: 'Perfect birthday party planning',
      price: 3.99,
      type: 'eventPack',
      features: [
        'Party planning timeline',
        'Guest list manager',
        'Decoration checklist',
        'Food & beverage planner',
        'Entertainment organizer'
      ]
    }
  ],
  checklistTemplates: [
    {
      id: 'home-move',
      name: 'Home Moving Checklist',
      description: 'Complete moving checklist template',
      price: 2.99,
      type: 'checklistTemplate',
      features: [
        'Pre-move checklist',
        'Packing room by room',
        'Utility transfer list',
        'Address change checklist',
        'Moving day timeline'
      ]
    },
    {
      id: 'career-change',
      name: 'Career Change Guide',
      description: 'Step-by-step career transition checklist',
      price: 4.99,
      type: 'checklistTemplate',
      features: [
        'Skills assessment',
        'Resume preparation',
        'Network building',
        'Interview preparation',
        'Transition timeline'
      ]
    }
  ],
  profileThemes: [
    {
      id: 'premium-dark',
      name: 'Premium Dark Theme',
      description: 'Elegant dark theme for your profile',
      price: 1.99,
      type: 'profileTheme',
      features: [
        'Dark color scheme',
        'Premium animations',
        'Custom profile layout',
        'Enhanced visual effects'
      ]
    },
    {
      id: 'gradient-sunset',
      name: 'Gradient Sunset Theme',
      description: 'Beautiful gradient theme',
      price: 1.99,
      type: 'profileTheme',
      features: [
        'Sunset gradient colors',
        'Smooth transitions',
        'Custom background',
        'Enhanced typography'
      ]
    }
  ]
};

// Get all available products
router.get('/products', async (req, res) => {
  try {
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get products by category
router.get('/products/:category', async (req, res) => {
  try {
    const { category } = req.params;
    
    if (!products[category]) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    res.json(products[category]);
  } catch (error) {
    console.error('Error fetching products by category:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Purchase product
router.post('/purchase', authenticateUser, async (req, res) => {
  try {
    const { productId, productType, stripePaymentIntentId } = req.body;
    
    // Find the product
    let product = null;
    for (const category in products) {
      const found = products[category].find(p => p.id === productId);
      if (found) {
        product = found;
        break;
      }
    }
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    const user = await User.findById(req.user._id);
    
    // Check if user already owns this product
    const existingPurchase = user.purchases[productType]?.find(p => p.packId === productId || p.templateId === productId || p.themeId === productId);
    
    if (existingPurchase) {
      return res.status(400).json({ message: 'You already own this product' });
    }
    
    // Add purchase to user's account
    const purchase = {
      [productType === 'eventPack' ? 'packId' : productType === 'checklistTemplate' ? 'templateId' : 'themeId']: productId,
      name: product.name,
      purchasedAt: new Date()
    };
    
    if (!user.purchases[productType]) {
      user.purchases[productType] = [];
    }
    
    user.purchases[productType].push(purchase);
    await user.save();
    
    res.json({
      message: 'Purchase successful!',
      product: product.name,
      purchase
    });
  } catch (error) {
    console.error('Error processing purchase:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get user's purchased items
router.get('/purchases', authenticateUser, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    res.json({
      eventPacks: user.purchases.eventPacks || [],
      checklistTemplates: user.purchases.checklistTemplates || [],
      profileThemes: user.purchases.profileThemes || []
    });
  } catch (error) {
    console.error('Error fetching purchases:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Check if user owns a specific product
router.get('/purchases/:productId', authenticateUser, async (req, res) => {
  try {
    const { productId } = req.params;
    const user = await User.findById(req.user._id);
    
    const isOwned = user.purchases.eventPacks?.some(p => p.packId === productId) ||
                   user.purchases.checklistTemplates?.some(p => p.templateId === productId) ||
                   user.purchases.profileThemes?.some(p => p.themeId === productId);
    
    res.json({ owned: !!isOwned });
  } catch (error) {
    console.error('Error checking product ownership:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router; 