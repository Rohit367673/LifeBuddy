const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authRateLimiter } = require('../middlewares/authMiddleware');
const Achievement = require('../models/Achievement');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const router = express.Router();

// Helpers for robust token extraction
const parseCookies = (cookieHeader) => {
  try {
    return cookieHeader.split(';').reduce((acc, part) => {
      const idx = part.indexOf('=');
      if (idx === -1) return acc;
      const key = part.slice(0, idx).trim();
      const val = part.slice(idx + 1).trim();
      if (!key) return acc;
      acc[key] = decodeURIComponent(val || '');
      return acc;
    }, {});
  } catch (_) {
    return {};
  }
};

const extractToken = (req) => {
  const authHeader = req.headers.authorization || '';
  const m = authHeader.match(/^Bearer\s+(.+)$/i);
  if (m) return m[1].trim();
  if (req.headers.cookie) {
    const cookies = parseCookies(req.headers.cookie);
    if (cookies.auth_token) return cookies.auth_token;
  }
  return null;
};

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
    // Only include username in the query if it was actually provided,
    // otherwise `{ username: null }` would match many documents with no username
    const orConditions = [{ email }];
    if (typeof username === 'string' && username.trim().length > 0) {
      orConditions.push({ username: username.trim().toLowerCase() });
    }
    const existingUser = await User.findOne({ $or: orConditions });

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
      { expiresIn: process.env.JWT_EXPIRE || '30d' }
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
      { expiresIn: process.env.JWT_EXPIRE || '30d' }
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
      { expiresIn: process.env.JWT_EXPIRE || '30d' }
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
      username: user.username, // <-- Added username
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
    const { firebaseUid, avatar, email } = req.body;

    if (!firebaseUid) {
      console.log('No firebaseUid provided for login');
      return res.status(400).json({
        message: 'Firebase UID is required.'
      });
    }
    
    console.log(`Attempting to find user with firebaseUid: ${firebaseUid}`);
    if (email) {
      console.log(`Email provided as backup: ${email}`);
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
      { expiresIn: process.env.JWT_EXPIRE || '30d' }
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
      username: user.username, // <-- Added username
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
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({ message: 'No token provided.' });
    }
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
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({ message: 'No token provided.' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Support both Firebase-based and traditional tokens
    let user;
    if (decoded.firebaseUid) {
      user = await User.findOne({
        firebaseUid: decoded.firebaseUid,
        isActive: true
      });
    } else if (decoded.userId) {
      user = await User.findOne({
        _id: decoded.userId,
        isActive: true
      });
    }

    if (!user) {
      return res.status(401).json({
        message: 'Invalid token.'
      });
    }

    // Generate new token with available identifiers
    const payload = { userId: user._id };
    if (user.firebaseUid) payload.firebaseUid = user.firebaseUid;
    const newToken = jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '30d' }
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

// In-memory OTP storage (in production, use Redis or database)
const otpStore = new Map();

// Generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP email
const sendOTPEmail = async (email, otp) => {
  try {
    // Create transporter with more secure settings
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      secure: true,
      port: 465,
      tls: {
        rejectUnauthorized: false
      }
    });

    // Email content
    const mailOptions = {
      from: `"LifeBuddy" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'LifeBuddy - Email Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 28px;">LifeBuddy</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Email Verification</p>
          </div>
          <div style="padding: 30px; background: #f8f9fa;">
            <h2 style="color: #333; margin-bottom: 20px;">Verify Your Email</h2>
            <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
              Thanks for signing up! To complete your registration, please enter the following verification code:
            </p>
            <div style="background: white; border: 2px solid #667eea; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0;">
              <h1 style="color: #667eea; font-size: 32px; letter-spacing: 8px; margin: 0; font-family: monospace;">${otp}</h1>
            </div>
            <p style="color: #666; font-size: 14px; margin-top: 20px;">
              This code will expire in 10 minutes. If you didn't request this code, please ignore this email.
            </p>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
              <p style="color: #999; font-size: 12px;">
                © 2024 LifeBuddy. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('OTP email sent successfully to:', email);
  } catch (error) {
    console.error('Error sending OTP email:', error);
    // For testing purposes, let's log the OTP to console instead of failing
    console.log(`🔐 TEST MODE: OTP for ${email} is: ${otp}`);
    // In production, you would throw the error
    // throw new Error('Failed to send OTP email');
  }
};

// Send OTP
router.post('/send-otp', authRateLimiter, async (req, res) => {
  try {
    const { email, firebaseUid } = req.body;

    if (!email || !firebaseUid) {
      return res.status(400).json({
        message: 'Email and Firebase UID are required.'
      });
    }

    // Generate OTP
    const otp = generateOTP();
    
    // Store OTP with expiration (10 minutes)
    const expiresAt = Date.now() + (10 * 60 * 1000); // 10 minutes
    otpStore.set(email, {
      otp,
      firebaseUid,
      expiresAt
    });

    // Send OTP email
    await sendOTPEmail(email, otp);

    res.json({
      message: 'OTP sent successfully.',
      expiresIn: '10 minutes'
    });

  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({
      message: 'Error sending OTP.',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Verify OTP
router.post('/verify-otp', authRateLimiter, async (req, res) => {
  try {
    const { email, firebaseUid, otp } = req.body;

    if (!email || !firebaseUid || !otp) {
      return res.status(400).json({
        message: 'Email, Firebase UID, and OTP are required.'
      });
    }

    // Get stored OTP data
    const storedData = otpStore.get(email);
    
    if (!storedData) {
      return res.status(400).json({
        message: 'No OTP found for this email. Please request a new one.'
      });
    }

    // Check if OTP is expired
    if (Date.now() > storedData.expiresAt) {
      otpStore.delete(email);
      return res.status(400).json({
        message: 'OTP has expired. Please request a new one.'
      });
    }

    // Check if Firebase UID matches
    if (storedData.firebaseUid !== firebaseUid) {
      return res.status(400).json({
        message: 'Invalid Firebase UID.'
      });
    }

    // Verify OTP
    if (storedData.otp !== otp) {
      return res.status(400).json({
        message: 'Invalid OTP code.'
      });
    }

    // OTP is valid - remove it from store
    otpStore.delete(email);

    res.json({
      message: 'OTP verified successfully.',
      verified: true
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      message: 'Error verifying OTP.',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;