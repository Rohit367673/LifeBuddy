const jwt = require('jsonwebtoken');
const User = require('../models/User');
const DEBUG_AUTH = process.env.DEBUG_AUTH === 'true';

// Middleware to verify JWT token and get user (supports both Firebase and traditional auth)
const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (DEBUG_AUTH) {
      const sec = process.env.JWT_SECRET || '';
      console.log('AUTH HEADER present:', !!authHeader);
      console.log('JWT SECRET set:', !!sec, sec ? (sec.slice(0, 4) + '***') : '');
    }
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No token provided or malformed header');
      return res.status(401).json({ 
        message: 'Access denied. No token provided.' 
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    if (DEBUG_AUTH) {
      console.log('EXTRACTED TOKEN length:', token ? token.length : 0);
    }
    
    let decoded;
    try {
      // Verify JWT token
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (DEBUG_AUTH) {
        console.log('DECODED PAYLOAD claims:', {
          firebaseUid: decoded.firebaseUid,
          userId: decoded.userId,
          exp: decoded.exp,
        });
      }
    } catch (error) {
      console.log('JWT VERIFY ERROR:', error);
      return res.status(401).json({ 
        message: 'Invalid token.' 
      });
    }
    
    // Handle both Firebase and traditional auth tokens
    let user;
    if (decoded.firebaseUid) {
      // Firebase auth
      user = await User.findOne({ 
        firebaseUid: decoded.firebaseUid,
        isActive: true 
      }).select('-__v');
      if (DEBUG_AUTH) console.log('USER LOOKUP BY firebaseUid -> found:', !!user);
    } else if (decoded.userId) {
      // Traditional auth
      user = await User.findOne({ 
        _id: decoded.userId,
        isActive: true 
      }).select('-__v');
      if (DEBUG_AUTH) console.log('USER LOOKUP BY userId -> found:', !!user);
    }

    if (!user) {
      if (DEBUG_AUTH) console.log('User not found for decoded payload');
      return res.status(401).json({ 
        message: 'Invalid token. User not found.' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        message: 'Invalid token.' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Token expired.' 
      });
    }
    
    res.status(500).json({ 
      message: 'Authentication error.' 
    });
  }
};

// Optional authentication - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      // Don't fail the request, just continue without user
      return next();
    }
    
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

    if (user) {
      req.user = user;
    }
    
    next();
  } catch (error) {
    // Don't fail the request, just continue without user
    next();
  }
};

// Check if user owns the resource
const checkOwnership = (resourceModel) => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params.id;
      const userId = req.user._id;

      const resource = await resourceModel.findOne({
        _id: resourceId,
        user: userId
      });

      if (!resource) {
        return res.status(404).json({ 
          message: 'Resource not found or access denied.' 
        });
      }

      req.resource = resource;
      next();
    } catch (error) {
      console.error('Ownership check error:', error);
      res.status(500).json({ 
        message: 'Error checking resource ownership.' 
      });
    }
  };
};

// Rate limiting for specific routes
const createRateLimiter = (windowMs, max) => {
  const rateLimit = require('express-rate-limit');
  
  return rateLimit({
    windowMs,
    max,
    message: {
      message: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// Rate limiter for authentication routes - more lenient for development
const rateLimit = require('express-rate-limit');
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 100 : 20, // Higher limit in development
  message: {
    error: 'Too many authentication attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for token verification in development
  skip: (req) => {
    return process.env.NODE_ENV === 'development' && req.path.includes('/verify');
  }
});

// Specific rate limiters
const generalRateLimiter = createRateLimiter(15 * 60 * 1000, 100); // 100 requests per 15 minutes

module.exports = {
  authenticateUser,
  optionalAuth,
  checkOwnership,
  authRateLimiter,
  generalRateLimiter
}; 