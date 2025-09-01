const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../config/logger');

// Protect routes - require authentication
exports.protect = async (req, res, next) => {
  let token;

  // Check for token in headers
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Set token from Bearer token in header
    token = req.headers.authorization.split(' ')[1];
  }
  // Check for token in cookies (if using cookie-based auth)
  else if (req.cookies.token) {
    token = req.cookies.token;
  }

  // Make sure token exists
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from database
    const user = await User.findById(decoded.id).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'No user found with this token'
      });
    }

    // Check if user account is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User account is deactivated'
      });
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (err) {
    logger.error('Auth middleware error:', err);
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};

// Optional authentication - doesn't fail if no token
exports.optionalAuth = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.token) {
    token = req.cookies.token;
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      
      if (user && user.isActive) {
        req.user = user;
      }
    } catch (err) {
      // Log error but continue without user
      logger.warn('Optional auth failed:', err.message);
    }
  }

  next();
};

// Check if user has premium access
exports.requirePremium = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  if (!req.user.hasPremiumAccess()) {
    return res.status(403).json({
      success: false,
      message: 'Premium subscription required to access this feature',
      upgradeRequired: true
    });
  }

  next();
};

// Check if user email is verified
exports.requireEmailVerified = (req, res, next) => {
  if (!req.user.isEmailVerified) {
    return res.status(403).json({
      success: false,
      message: 'Email verification required',
      emailVerificationRequired: true
    });
  }
  next();
};

// Rate limiting for specific users
exports.userRateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const requestCounts = new Map();

  return (req, res, next) => {
    if (!req.user) {
      return next();
    }

    const userId = req.user.id;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Get user's request history
    if (!requestCounts.has(userId)) {
      requestCounts.set(userId, []);
    }

    const userRequests = requestCounts.get(userId);
    
    // Remove old requests outside the window
    const recentRequests = userRequests.filter(time => time > windowStart);
    requestCounts.set(userId, recentRequests);

    // Check if limit exceeded
    if (recentRequests.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests, please try again later',
        retryAfter: Math.ceil((recentRequests[0] + windowMs - now) / 1000)
      });
    }

    // Add current request
    recentRequests.push(now);
    requestCounts.set(userId, recentRequests);

    next();
  };
};

// Subscription status middleware
exports.checkSubscriptionStatus = async (req, res, next) => {
  if (!req.user) {
    return next();
  }

  const user = req.user;

  // Check if subscription has expired
  if (user.subscription.endDate && user.subscription.endDate < new Date()) {
    // Update subscription status to expired
    if (user.subscription.status !== 'expired') {
      await user.updateSubscription({ 
        status: 'expired',
        plan: 'free'
      });
      
      // Refresh user data
      req.user = await User.findById(user.id);
    }
  }

  next();
};

// Admin or moderator access
exports.requireStaff = (req, res, next) => {
  if (!req.user || !['admin', 'moderator'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Staff access required'
    });
  }
  next();
};

// Admin only access
exports.requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
  next();
};

// API key authentication for external services
exports.apiKeyAuth = (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.query.apiKey;

  if (!apiKey) {
    return res.status(401).json({
      success: false,
      message: 'API key required'
    });
  }

  // In a real application, you would validate this against a database
  const validApiKeys = process.env.VALID_API_KEYS?.split(',') || [];

  if (!validApiKeys.includes(apiKey)) {
    return res.status(401).json({
      success: false,
      message: 'Invalid API key'
    });
  }

  req.apiAccess = true;
  next();
};
