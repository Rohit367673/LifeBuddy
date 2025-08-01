const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Set default environment variables if not provided
process.env.OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || 'sk-or-v1-1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
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
const motivationalRoutes = require('./routes/motivationalRoutes');
const taskRoutes = require('./routes/taskRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const storeRoutes = require('./routes/storeRoutes');
const premiumTaskRoutes = require('./routes/premiumTaskRoutes');

const app = express();
const PORT = process.env.PORT || 5001;

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
app.use(limiter);

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

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'LifeBuddy API is running' });
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
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lifebuddy')
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

module.exports = app;
