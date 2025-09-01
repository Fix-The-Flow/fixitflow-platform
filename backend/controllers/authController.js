const crypto = require('crypto');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const { asyncHandler, ErrorResponse } = require('../middleware/errorHandler');
const sendEmail = require('../services/emailService');
const logger = require('../config/logger');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  const { firstName, lastName, email, password, phone } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new ErrorResponse('User with this email already exists', 400));
  }

  // Create user
  const user = await User.create({
    firstName,
    lastName,
    email,
    password,
    phone
  });

  // Generate email verification token
  const verificationToken = user.getEmailVerificationToken();
  await user.save({ validateBeforeSave: false });

  // Send verification email
  try {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
    
    await sendEmail({
      email: user.email,
      subject: 'Welcome to FixItFlow - Verify Your Email',
      template: 'welcome',
      context: {
        firstName: user.firstName,
        verificationUrl
      }
    });

    // Send admin notification
    await sendEmail({
      email: process.env.ADMIN_EMAIL,
      subject: 'New User Registration - FixItFlow',
      template: 'admin-new-user',
      context: {
        user: {
          name: user.fullName,
          email: user.email,
          registeredAt: new Date().toLocaleString()
        }
      }
    });

    logger.info('New user registered', {
      userId: user.id,
      email: user.email,
      name: user.fullName
    });

  } catch (error) {
    logger.error('Error sending verification email:', error);
    // Don't fail registration if email fails
  }

  // Generate JWT token
  const token = user.getSignedJwtToken();

  res.status(201).json({
    success: true,
    message: 'Registration successful. Please check your email for verification.',
    token,
    user: {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      isEmailVerified: user.isEmailVerified,
      isPhoneVerified: user.isPhoneVerified,
      subscription: user.subscription,
      role: user.role
    }
  });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  const { email, password } = req.body;

  // Check if user exists
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  // Check if account is active
  if (!user.isActive) {
    return next(new ErrorResponse('Account is deactivated', 401));
  }

  // Check password
  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  // Update last login
  await user.updateLastLogin(req.ip, req.get('User-Agent'));

  // Generate JWT token
  const token = user.getSignedJwtToken();

  logger.info('User logged in', {
    userId: user.id,
    email: user.email,
    ip: req.ip
  });

  res.status(200).json({
    success: true,
    message: 'Login successful',
    token,
    user: {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar,
      isEmailVerified: user.isEmailVerified,
      isPhoneVerified: user.isPhoneVerified,
      subscription: user.subscription,
      role: user.role,
      preferences: user.preferences
    }
  });
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
exports.logout = asyncHandler(async (req, res, next) => {
  // If using cookies, clear them
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res, next) => {
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
      isEmailVerified: user.isEmailVerified,
      isPhoneVerified: user.isPhoneVerified,
      subscription: user.subscription,
      role: user.role,
      preferences: user.preferences,
      analytics: user.analytics,
      isPremium: user.isPremium,
      isInTrial: user.isInTrial,
      createdAt: user.createdAt
    }
  });
});

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  // Get reset token
  const resetToken = user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  // Create reset URL
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Password Reset Request - FixItFlow',
      template: 'password-reset',
      context: {
        firstName: user.firstName,
        resetUrl,
        expiresIn: '10 minutes'
      }
    });

    res.status(200).json({
      success: true,
      message: 'Password reset email sent'
    });

  } catch (error) {
    logger.error('Error sending password reset email:', error);
    
    user.passwordResetToken = undefined;
    user.passwordResetExpire = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new ErrorResponse('Email could not be sent', 500));
  }
});

// @desc    Reset password
// @route   PUT /api/auth/reset-password/:resettoken
// @access  Public
exports.resetPassword = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  // Get hashed token
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.resettoken)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: resetPasswordToken,
    passwordResetExpire: { $gt: Date.now() }
  });

  if (!user) {
    return next(new ErrorResponse('Invalid or expired token', 400));
  }

  // Set new password
  user.password = req.body.password;
  user.passwordResetToken = undefined;
  user.passwordResetExpire = undefined;
  await user.save();

  // Generate JWT token
  const token = user.getSignedJwtToken();

  logger.info('Password reset successful', {
    userId: user.id,
    email: user.email
  });

  res.status(200).json({
    success: true,
    message: 'Password reset successful',
    token
  });
});

// @desc    Update password
// @route   PUT /api/auth/update-password
// @access  Private
exports.updatePassword = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  const user = await User.findById(req.user.id).select('+password');

  // Check current password
  if (!(await user.matchPassword(req.body.currentPassword))) {
    return next(new ErrorResponse('Current password is incorrect', 401));
  }

  user.password = req.body.newPassword;
  await user.save();

  // Generate new JWT token
  const token = user.getSignedJwtToken();

  res.status(200).json({
    success: true,
    message: 'Password updated successfully',
    token
  });
});

// @desc    Verify email
// @route   GET /api/auth/verify-email/:token
// @access  Public
exports.verifyEmail = asyncHandler(async (req, res, next) => {
  // Get hashed token
  const emailVerificationToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    emailVerificationToken,
    emailVerificationExpire: { $gt: Date.now() }
  });

  if (!user) {
    return next(new ErrorResponse('Invalid or expired verification token', 400));
  }

  // Update user verification status
  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpire = undefined;
  await user.save();

  logger.info('Email verified', {
    userId: user.id,
    email: user.email
  });

  res.status(200).json({
    success: true,
    message: 'Email verified successfully'
  });
});

// @desc    Resend email verification
// @route   POST /api/auth/resend-verification
// @access  Private
exports.resendEmailVerification = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  if (user.isEmailVerified) {
    return next(new ErrorResponse('Email is already verified', 400));
  }

  // Generate new verification token
  const verificationToken = user.getEmailVerificationToken();
  await user.save({ validateBeforeSave: false });

  // Create verification URL
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Email Verification - FixItFlow',
      template: 'email-verification',
      context: {
        firstName: user.firstName,
        verificationUrl
      }
    });

    res.status(200).json({
      success: true,
      message: 'Verification email sent'
    });

  } catch (error) {
    logger.error('Error sending verification email:', error);
    
    user.emailVerificationToken = undefined;
    user.emailVerificationExpire = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new ErrorResponse('Email could not be sent', 500));
  }
});

// @desc    Send phone verification code
// @route   POST /api/auth/send-phone-verification
// @access  Private
exports.sendPhoneVerification = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  if (!user.phone) {
    return next(new ErrorResponse('Please add a phone number first', 400));
  }

  if (user.isPhoneVerified) {
    return next(new ErrorResponse('Phone number is already verified', 400));
  }

  // Generate verification code
  const verificationCode = user.getPhoneVerificationCode();
  await user.save({ validateBeforeSave: false });

  try {
    // In a real application, you would send SMS here
    // For now, we'll just log it (in development, you might email it)
    logger.info('Phone verification code generated', {
      userId: user.id,
      phone: user.phone,
      code: verificationCode // Remove this in production
    });

    // For development, you might want to email the code
    if (process.env.NODE_ENV === 'development') {
      await sendEmail({
        email: user.email,
        subject: 'Phone Verification Code - FixItFlow',
        template: 'phone-verification',
        context: {
          firstName: user.firstName,
          verificationCode,
          phone: user.phone
        }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Verification code sent to your phone'
    });

  } catch (error) {
    logger.error('Error sending phone verification:', error);
    
    user.phoneVerificationCode = undefined;
    user.phoneVerificationExpire = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new ErrorResponse('Verification code could not be sent', 500));
  }
});

// @desc    Verify phone number
// @route   POST /api/auth/verify-phone
// @access  Private
exports.verifyPhone = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  const { verificationCode } = req.body;

  // Hash the provided code
  const hashedCode = crypto
    .createHash('sha256')
    .update(verificationCode)
    .digest('hex');

  const user = await User.findOne({
    _id: req.user.id,
    phoneVerificationCode: hashedCode,
    phoneVerificationExpire: { $gt: Date.now() }
  });

  if (!user) {
    return next(new ErrorResponse('Invalid or expired verification code', 400));
  }

  // Update user verification status
  user.isPhoneVerified = true;
  user.phoneVerificationCode = undefined;
  user.phoneVerificationExpire = undefined;
  await user.save();

  logger.info('Phone verified', {
    userId: user.id,
    phone: user.phone
  });

  res.status(200).json({
    success: true,
    message: 'Phone number verified successfully'
  });
});

// @desc    Refresh token
// @route   POST /api/auth/refresh-token
// @access  Private
exports.refreshToken = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  // Generate new JWT token
  const token = user.getSignedJwtToken();

  res.status(200).json({
    success: true,
    token,
    user: {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      subscription: user.subscription,
      role: user.role
    }
  });
});
