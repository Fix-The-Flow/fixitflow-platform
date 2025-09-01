const { validationResult } = require('express-validator');
const User = require('../models/User');
const { asyncHandler, ErrorResponse } = require('../middleware/errorHandler');
const logger = require('../config/logger');

// @desc    Get user profile
// @route   GET /api/user/profile
// @access  Private
exports.getProfile = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    user: {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar,
      bio: user.bio,
      location: user.location,
      dateOfBirth: user.dateOfBirth,
      isEmailVerified: user.isEmailVerified,
      isPhoneVerified: user.isPhoneVerified,
      subscription: user.subscription,
      role: user.role,
      preferences: user.preferences,
      analytics: user.analytics,
      isPremium: user.isPremium,
      isInTrial: user.isInTrial,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
      loginCount: user.loginCount
    }
  });
});

// @desc    Update user profile
// @route   PUT /api/user/profile
// @access  Private
exports.updateProfile = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  const allowedFields = [
    'firstName',
    'lastName',
    'bio',
    'phone',
    'location',
    'dateOfBirth'
  ];

  const updateData = {};
  
  // Only include allowed fields that are present in request
  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      updateData[field] = req.body[field];
    }
  });

  // Handle nested location object
  if (req.body.location) {
    updateData.location = {
      city: req.body.location.city,
      country: req.body.location.country
    };
  }

  const user = await User.findByIdAndUpdate(
    req.user.id,
    updateData,
    {
      new: true,
      runValidators: true
    }
  );

  logger.info('User profile updated', {
    userId: user.id,
    updatedFields: Object.keys(updateData)
  });

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    user: {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar,
      bio: user.bio,
      location: user.location,
      dateOfBirth: user.dateOfBirth,
      isEmailVerified: user.isEmailVerified,
      isPhoneVerified: user.isPhoneVerified,
      subscription: user.subscription,
      preferences: user.preferences
    }
  });
});

// @desc    Update user preferences
// @route   PUT /api/user/preferences
// @access  Private
exports.updatePreferences = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  const { notifications, language, timezone, theme } = req.body;

  const updateData = {
    'preferences.notifications': notifications,
    'preferences.language': language,
    'preferences.timezone': timezone,
    'preferences.theme': theme
  };

  // Remove undefined values
  Object.keys(updateData).forEach(key => {
    if (updateData[key] === undefined) {
      delete updateData[key];
    }
  });

  const user = await User.findByIdAndUpdate(
    req.user.id,
    updateData,
    {
      new: true,
      runValidators: true
    }
  );

  logger.info('User preferences updated', {
    userId: user.id
  });

  res.status(200).json({
    success: true,
    message: 'Preferences updated successfully',
    preferences: user.preferences
  });
});

// @desc    Delete user account
// @route   DELETE /api/user/account
// @access  Private
exports.deleteAccount = asyncHandler(async (req, res, next) => {
  const { password, confirmDelete } = req.body;

  if (!password) {
    return next(new ErrorResponse('Password is required to delete account', 400));
  }

  if (confirmDelete !== 'DELETE') {
    return next(new ErrorResponse('Please type "DELETE" to confirm account deletion', 400));
  }

  const user = await User.findById(req.user.id).select('+password');

  // Verify password
  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    return next(new ErrorResponse('Incorrect password', 401));
  }

  // Soft delete - deactivate account instead of hard delete
  user.isActive = false;
  user.email = `deleted_${user.id}_${user.email}`;
  await user.save();

  logger.info('User account deactivated', {
    userId: user.id,
    email: user.email
  });

  res.status(200).json({
    success: true,
    message: 'Account has been deactivated successfully'
  });
});

// @desc    Get user activity history
// @route   GET /api/user/activity
// @access  Private
exports.getActivity = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  const activity = {
    lastLogin: user.lastLogin,
    loginCount: user.loginCount,
    ipAddresses: user.ipAddresses,
    analytics: user.analytics,
    accountCreated: user.createdAt,
    emailVerified: user.isEmailVerified,
    phoneVerified: user.isPhoneVerified,
    subscription: {
      plan: user.subscription.plan,
      status: user.subscription.status,
      startDate: user.subscription.startDate,
      endDate: user.subscription.endDate
    }
  };

  res.status(200).json({
    success: true,
    activity
  });
});

// @desc    Update email (requires verification)
// @route   PUT /api/user/email
// @access  Private
exports.updateEmail = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  const { newEmail, password } = req.body;

  // Check if new email is already in use
  const emailExists = await User.findOne({ email: newEmail });
  if (emailExists) {
    return next(new ErrorResponse('Email is already in use', 400));
  }

  const user = await User.findById(req.user.id).select('+password');

  // Verify password
  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    return next(new ErrorResponse('Incorrect password', 401));
  }

  // Update email and mark as unverified
  user.email = newEmail;
  user.isEmailVerified = false;

  // Generate new verification token
  const verificationToken = user.getEmailVerificationToken();
  await user.save();

  // Send verification email to new address
  try {
    const sendEmail = require('../services/emailService').sendEmail;
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
    
    await sendEmail({
      email: newEmail,
      subject: 'Verify Your New Email - FixItFlow',
      template: 'email-verification',
      context: {
        firstName: user.firstName,
        verificationUrl
      }
    });

    logger.info('Email updated, verification sent', {
      userId: user.id,
      newEmail
    });

    res.status(200).json({
      success: true,
      message: 'Email updated successfully. Please check your new email for verification.'
    });

  } catch (error) {
    logger.error('Error sending verification email:', error);
    
    user.emailVerificationToken = undefined;
    user.emailVerificationExpire = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new ErrorResponse('Email updated but verification email could not be sent', 500));
  }
});

// @desc    Update phone number
// @route   PUT /api/user/phone
// @access  Private
exports.updatePhone = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  const { phone } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user.id,
    { 
      phone,
      isPhoneVerified: false // Reset verification status
    },
    {
      new: true,
      runValidators: true
    }
  );

  logger.info('Phone number updated', {
    userId: user.id
  });

  res.status(200).json({
    success: true,
    message: 'Phone number updated successfully',
    phone: user.phone,
    isPhoneVerified: user.isPhoneVerified
  });
});

// @desc    Get subscription info
// @route   GET /api/user/subscription
// @access  Private
exports.getSubscription = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  const subscriptionInfo = {
    plan: user.subscription.plan,
    status: user.subscription.status,
    startDate: user.subscription.startDate,
    endDate: user.subscription.endDate,
    autoRenew: user.subscription.autoRenew,
    isPremium: user.isPremium,
    isInTrial: user.isInTrial,
    daysRemaining: user.subscription.endDate ? 
      Math.max(0, Math.ceil((user.subscription.endDate - new Date()) / (1000 * 60 * 60 * 24))) : 
      null
  };

  res.status(200).json({
    success: true,
    subscription: subscriptionInfo
  });
});

// @desc    Get user analytics
// @route   GET /api/user/analytics
// @access  Private
exports.getAnalytics = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  const analytics = {
    troubleshootingQueries: user.analytics.troubleshootingQueriesCount || 0,
    aiChatUsage: user.analytics.aiChatCount || 0,
    lastActivity: user.analytics.lastTroubleshootingQuery,
    favoriteCategories: user.analytics.favoriteCategories || [],
    accountAge: Math.floor((new Date() - user.createdAt) / (1000 * 60 * 60 * 24)),
    loginFrequency: user.loginCount || 0
  };

  res.status(200).json({
    success: true,
    analytics
  });
});

// @desc    Export user data (GDPR compliance)
// @route   GET /api/user/export
// @access  Private
exports.exportUserData = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  // Remove sensitive fields
  const userData = user.toObject();
  delete userData.password;
  delete userData.passwordResetToken;
  delete userData.passwordResetExpire;
  delete userData.emailVerificationToken;
  delete userData.emailVerificationExpire;
  delete userData.phoneVerificationCode;
  delete userData.phoneVerificationExpire;
  delete userData.twoFactorSecret;

  logger.info('User data exported', {
    userId: user.id
  });

  res.status(200).json({
    success: true,
    message: 'User data exported successfully',
    data: userData,
    exportedAt: new Date().toISOString()
  });
});

// @desc    Get user dashboard stats
// @route   GET /api/user/dashboard
// @access  Private
exports.getDashboard = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  const stats = {
    profile: {
      completeness: calculateProfileCompleteness(user),
      verificationStatus: {
        email: user.isEmailVerified,
        phone: user.isPhoneVerified
      }
    },
    subscription: {
      plan: user.subscription.plan,
      status: user.subscription.status,
      isPremium: user.isPremium,
      daysRemaining: user.subscription.endDate ? 
        Math.max(0, Math.ceil((user.subscription.endDate - new Date()) / (1000 * 60 * 60 * 24))) : 
        null
    },
    usage: {
      troubleshootingQueries: user.analytics.troubleshootingQueriesCount || 0,
      aiChatSessions: user.analytics.aiChatCount || 0,
      favoriteCategories: user.analytics.favoriteCategories || []
    },
    recentActivity: {
      lastLogin: user.lastLogin,
      lastTroubleshootingQuery: user.analytics.lastTroubleshootingQuery
    }
  };

  res.status(200).json({
    success: true,
    dashboard: stats
  });
});

// Helper function to calculate profile completeness
function calculateProfileCompleteness(user) {
  const fields = [
    'firstName',
    'lastName',
    'email',
    'phone',
    'bio',
    'avatar.url',
    'location.city',
    'location.country',
    'dateOfBirth'
  ];

  const completedFields = fields.filter(field => {
    const value = field.includes('.') ? 
      field.split('.').reduce((obj, key) => obj?.[key], user) :
      user[field];
    return value && value.toString().trim() !== '';
  });

  return Math.round((completedFields.length / fields.length) * 100);
}

module.exports = {
  getProfile,
  updateProfile,
  updatePreferences,
  deleteAccount,
  getActivity,
  updateEmail,
  updatePhone,
  getSubscription,
  getAnalytics,
  exportUserData,
  getDashboard
};
