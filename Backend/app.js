const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

// Environment verification
console.log('[ENV] NODE_ENV:', process.env.NODE_ENV);
console.log('[ENV] OPENROUTER_API_KEY present:', !!process.env.OPENROUTER_API_KEY);
console.log('[ENV] OPENROUTER_API_KEY prefix:', process.env.OPENROUTER_API_KEY ? process.env.OPENROUTER_API_KEY.substring(0,8) + '...' : 'Not set');
console.log('[ENV] OPENROUTER_REFERRER:', process.env.OPENROUTER_REFERRER || 'Not set');
console.log('[ENV] OPENROUTER_TITLE:', process.env.OPENROUTER_TITLE || 'Not set');
console.log('[ENV] OPENROUTER_MODEL:', process.env.OPENROUTER_MODEL || 'Not set');

// Set default environment variables if not provided (do NOT set fake OpenRouter keys)
if (!process.env.OPENROUTER_API_KEY) {
  console.warn('[Startup] OPENROUTER_API_KEY is not set. AI features will fail with 401 until you add it to .env');
}
process.env.TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '6644184480:AAH1234567890abcdefghijklmnopqrstuvwxyz';
process.env.WHATSAPP_SANDBOX_CODE = process.env.WHATSAPP_SANDBOX_CODE || 'GBmQD7SB';
process.env.WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || 'your-whatsapp-phone-number-id';
process.env.WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || 'your-whatsapp-access-token';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'lifebuddy-jwt-secret-key-2024-change-in-production';

const authRoutes = require('./routes/authRoutes');
const eventRoutes = require('./routes/eventRoutes');
const userRoutes = require('./routes/userRoutes');
const moodRoutes = require('./routes/moodRoutes');
const achievementRoutes = require('./routes/achievementRoutes');
const referralRoutes = require('./routes/referralRoutes');
const motivationalRoutes = require('./routes/motivationalRoutes');
const taskRoutes = require('./routes/taskRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const storeRoutes = require('./routes/storeRoutes');
const premiumTaskRoutes = require('./routes/premiumTaskRoutes');
const aiChatRoutes = require('./routes/aiChatRoutes');
const couponRoutes = require('./routes/couponRoutes');
const trialRoutes = require('./routes/trialRoutes');
const paypalRoutes = require('./routes/paypalRoutes');
const cashfreeRoutes = require('./routes/cashfreeRoutes');
const pricingRoutes = require('./routes/pricingRoutes');
const adminCouponRoutes = require('./routes/adminCouponRoutes');
const Activity = require('./models/Activity');
const ReferralCode = require('./models/ReferralCode');
const ReferralHit = require('./models/ReferralHit');
const User = require('./models/User');
const { authenticateUser } = require('./middlewares/authMiddleware');
const { logEnvironmentStatus } = require('./utils/environmentValidator');
const { logPaymentStatus } = require('./utils/paymentValidator');
const app = express();
const PORT = process.env.PORT || 5001;

// Validate environment on startup
logEnvironmentStatus();
logPaymentStatus();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'https://life-buddy-git-main-rohit367673s-projects.vercel.app',
      'https://life-buddy.vercel.app',
      'https://www.lifebuddy.space',
      'https://lifebuddy.space',
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:3000',
      'http://localhost:5000',
      
      process.env.FRONTEND_URL
    ].filter(Boolean);
    
    // Also allow any localhost origin for development
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
// Skip rate limit for subscription status checks to avoid noisy 429s from frontend polling
app.use((req, res, next) => {
  if (req.path === '/api/subscriptions/status') {
    return next();
  }
  return limiter(req, res, next);
});

// Logging
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/users', userRoutes);
app.use('/api/mood', moodRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/motivational', motivationalRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/store', storeRoutes);
app.use('/api/premium-tasks', premiumTaskRoutes);
app.use('/api/ai-chat', aiChatRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/trial', trialRoutes);
app.use('/api/admin-coupons', adminCouponRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/pricing', pricingRoutes);
app.use('/api/payments/paypal', paypalRoutes);
app.use('/api/payments/cashfree', cashfreeRoutes);

// Minimal current user endpoint for frontend checks
app.get('/api/user', authenticateUser, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('displayName username avatar personalQuote subscription createdAt stats');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isTrial = user?.subscription?.status === 'trial';
    const isPaid = user?.subscription?.plan && user.subscription.plan !== 'free' && user.subscription.status === 'active';
    const premium = !!(isTrial || isPaid);
    const tier = isTrial ? 'Trial' : (isPaid ? 'Premium' : 'Free');

    res.json({
      id: user._id,
      displayName: user.displayName || '',
      username: user.username || '',
      avatar: user.avatar || '',
      personalQuote: user.personalQuote || '',
      premium,
      tier,
      currentStreak: user?.stats?.taskStreak || 0,
      joinedAt: user.createdAt
    });
  } catch (err) {
    console.error('Error fetching current user:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'LifeBuddy API is running' });
});

// Referral redirect endpoint: /r/:code -> logs unique hit per IP (24h) and redirects to frontend
app.get('/r/:code', async (req, res) => {
  const code = req.params.code;
  const frontend = process.env.FRONTEND_URL || 'http://localhost:5173';
  try {
    const rc = await ReferralCode.findOne({ code });
    if (!rc) return res.redirect(frontend);

    const ip = (req.headers['x-forwarded-for'] || '').split(',')[0] || req.ip || 'unknown';
    const ua = req.get('user-agent') || '';
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const existing = await ReferralHit.findOne({ code, ip, createdAt: { $gte: since } });
    if (!existing) {
      await ReferralHit.create({ code, ip, ua });
      await User.findByIdAndUpdate(rc.user, {
        $inc: { 'trialTasks.sharedReferrals': 1 },
        $set: { 'trialTasks.lastUpdated': new Date() }
      });
    }
  } catch (err) {
    console.warn('Referral redirect error:', err.message);
  }
  return res.redirect(frontend + '/?ref=' + encodeURIComponent(code));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Database connection
async function ensureUserIndexes() {
  try {
    const col = mongoose.connection.db.collection('users');
    const indexes = await col.indexes();
    const bad = indexes.find((i) => i.key && i.key.firebaseUid === 1 && i.unique);
    if (bad) {
      await col.dropIndex(bad.name);
      console.log('Dropped unique index on users.firebaseUid:', bad.name);
    }
  } catch (err) {
    console.log('Index check/skipping:', err.message);
  }
}

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lifebuddy')
  .then(async () => {
    console.log('Connected to MongoDB');
    await ensureUserIndexes();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

module.exports = app;
