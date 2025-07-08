const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authRateLimiter } = require('../middlewares/authMiddleware');
const Achievement = require('../models/Achievement');

const router = express.Router();

// Traditional email/password registration
router.post('/register-traditional', authRateLimiter, async (req, res) => {
  try {
    const { email, password, displayName, firstName, lastName, username } = req.body;

    // Validate required fields
    if (!email || !password || !displayName) {
      return res.status(400).json({
        message: 'Email, password, and display name are required.'
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        message: 'Password must be at least 6 characters long.'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username: username || null }] 
    });

    if (existingUser) {
      return res.status(409).json({
        message: 'User already exists with this email or username.'
      });
    }

    // Create new user
    const user = new User({
      email,
      password,
      displayName,
      firstName,
      lastName,
      username
    });

    await user.save();

    // Increment login count for first registration
    user.stats.logins = (user.stats.logins || 0) + 1;
    await user.save();

    // Award achievements after registration
    await Achievement.checkAchievements(user._id, user.stats);

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id,
        email: user.email
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    // Return user data (without sensitive info)
    const userResponse = {
      _id: user._id,
      email: user.email,
      displayName: user.displayName,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      avatar: user.avatar,
      preferences: user.preferences,
      stats: user.stats,
      createdAt: user.createdAt
    };

    res.status(201).json({
      message: 'User registered successfully.',
      token,
      user: userResponse
    });

  } catch (error) {
    console.error('Traditional registration error:', error);
    res.status(500).json({
      message: 'Error registering user.',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Traditional email/password login
router.post('/login-traditional', authRateLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: 'Email and password are required.'
      });
    }

    // Find user by email
    const user = await User.findOne({ 
      email,
      isActive: true 
    }).select('-__v');

    if (!user) {
      return res.status(404).json({
        message: 'User not found. Please check your email or register.'
      });
    }

    // Check if user has password (traditional auth user)
    if (!user.password) {
      return res.status(400).json({
        message: 'This account was created with Google. Please use Google login.'
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        message: 'Invalid password.'
      });
    }

    // Increment login count
    user.stats.logins = (user.stats.logins || 0) + 1;

    // Add today's date to loginHistory if not already present
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const alreadyLoggedToday = user.loginHistory && user.loginHistory.some(date => {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      return d.getTime() === today.getTime();
    });
    if (!alreadyLoggedToday) {
      user.loginHistory = user.loginHistory || [];
      user.loginHistory.push(today);
    }

    await user.save();

    // Update last active
    await user.updateLastActive();

    // Award achievements after login
    const awardedAchievements = await Achievement.checkAchievements(user._id, user.stats);
    console.log('Awarded achievements after login:', awardedAchievements);

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id,
        email: user.email
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    // Return user data
    const userResponse = {
      _id: user._id,
      email: user.email,
      displayName: user.displayName,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      avatar: user.avatar,
      preferences: user.preferences,
      stats: user.stats,
      createdAt: user.createdAt
    };

    res.json({
      message: 'Login successful.',
      token,
      user: userResponse
    });

  } catch (error) {
    console.error('Traditional login error:', error);
    res.status(500).json({
      message: 'Error during login.',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Register new user (after Firebase auth)
router.post('/register', authRateLimiter, async (req, res) => {
  try {
    console.log('REGISTER REQUEST BODY:', req.body);
    const { firebaseUid, email, displayName, firstName, lastName, avatar } = req.body;

    // Validate required fields
    if (!firebaseUid || !email || !displayName) {
      console.log('Missing required fields for registration');
      return res.status(400).json({
        message: 'Firebase UID, email, and display name are required.'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ firebaseUid }, { email }] 
    });

    if (existingUser) {
      console.log('User already exists with this email or Firebase UID:', existingUser.email, existingUser.firebaseUid);
      return res.status(409).json({
        message: 'User already exists with this email or Firebase UID.'
      });
    }

    // Create new user
    const user = new User({
      firebaseUid,
      email,
      displayName,
      firstName,
      lastName,
      avatar
    });

    await user.save();

    // Increment login count for first registration
    user.stats.logins = (user.stats.logins || 0) + 1;
    await user.save();

    // Award achievements after registration
    await Achievement.checkAchievements(user._id, user.stats);

    // Generate JWT token
    const token = jwt.sign(
      { 
        firebaseUid: user.firebaseUid,
        userId: user._id 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    // Return user data (without sensitive info)
    const userResponse = {
      _id: user._id,
      firebaseUid: user.firebaseUid,
      email: user.email,
      displayName: user.displayName,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar,
      preferences: user.preferences,
      stats: user.stats,
      createdAt: user.createdAt
    };

    console.log('REGISTER RESPONSE:', { token, user: userResponse });
    res.status(201).json({
      message: 'User registered successfully.',
      token,
      user: userResponse
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      message: 'Error registering user.',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Login user (after Firebase auth)
router.post('/login', authRateLimiter, async (req, res) => {
  try {
    console.log('LOGIN REQUEST BODY:', req.body);
    const { firebaseUid, avatar } = req.body;

    if (!firebaseUid) {
      console.log('No firebaseUid provided for login');
      return res.status(400).json({
        message: 'Firebase UID is required.'
      });
    }

    // Find user by Firebase UID
    const user = await User.findOne({ 
      firebaseUid,
      isActive: true 
    }).select('-__v');

    if (!user) {
      console.log('User not found for firebaseUid:', firebaseUid);
      return res.status(404).json({
        message: 'User not found. Please register first.'
      });
    }

    // Update avatar if provided and different
    if (avatar && user.avatar !== avatar) {
      user.avatar = avatar;
      await user.save();
    }

    // Increment login count
    user.stats.logins = (user.stats.logins || 0) + 1;

    // Add today's date to loginHistory if not already present
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const alreadyLoggedToday = user.loginHistory && user.loginHistory.some(date => {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      return d.getTime() === today.getTime();
    });
    if (!alreadyLoggedToday) {
      user.loginHistory = user.loginHistory || [];
      user.loginHistory.push(today);
    }

    await user.save();

    // Update last active
    await user.updateLastActive();

    // Award achievements after login
    const awardedAchievements = await Achievement.checkAchievements(user._id, user.stats);
    console.log('Awarded achievements after login:', awardedAchievements);

    // Generate JWT token
    const token = jwt.sign(
      { 
        firebaseUid: user.firebaseUid,
        userId: user._id 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    // Return user data
    const userResponse = {
      _id: user._id,
      firebaseUid: user.firebaseUid,
      email: user.email,
      displayName: user.displayName,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar,
      preferences: user.preferences,
      stats: user.stats,
      createdAt: user.createdAt
    };

    console.log('LOGIN RESPONSE:', { token, user: userResponse });
    res.json({
      message: 'Login successful.',
      token,
      user: userResponse
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      message: 'Error during login.',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Verify token
router.get('/verify', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        message: 'No token provided.'
      });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Handle both Firebase and traditional auth tokens
    let user;
    if (decoded.firebaseUid) {
      // Firebase auth
      user = await User.findOne({ 
        firebaseUid: decoded.firebaseUid,
        isActive: true 
      }).select('-__v');
    } else if (decoded.userId) {
      // Traditional auth
      user = await User.findOne({ 
        _id: decoded.userId,
        isActive: true 
      }).select('-__v');
    }

    if (!user) {
      return res.status(401).json({
        message: 'Invalid token.'
      });
    }

    res.json({
      message: 'Token is valid.',
      user: {
        _id: user._id,
        firebaseUid: user.firebaseUid,
        email: user.email,
        displayName: user.displayName,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        username: user.username,
        preferences: user.preferences,
        stats: user.stats,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({
      message: 'Invalid token.'
    });
  }
});

// Refresh token
router.post('/refresh', authRateLimiter, async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        message: 'No token provided.'
      });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findOne({ 
      firebaseUid: decoded.firebaseUid,
      isActive: true 
    });

    if (!user) {
      return res.status(401).json({
        message: 'Invalid token.'
      });
    }

    // Generate new token
    const newToken = jwt.sign(
      { 
        firebaseUid: user.firebaseUid,
        userId: user._id 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.json({
      message: 'Token refreshed successfully.',
      token: newToken
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({
      message: 'Error refreshing token.'
    });
  }
});

module.exports = router; 