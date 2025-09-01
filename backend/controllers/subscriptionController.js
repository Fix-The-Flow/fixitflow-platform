const { validationResult } = require('express-validator');
const User = require('../models/User');
const { PaymentService, SUBSCRIPTION_PLANS } = require('../services/paymentService');
const { asyncHandler, ErrorResponse } = require('../middleware/errorHandler');
const logger = require('../config/logger');

// @desc    Get subscription plans
// @route   GET /api/subscription/plans
// @access  Public
exports.getPlans = asyncHandler(async (req, res, next) => {
  const plans = SUBSCRIPTION_PLANS;

  res.status(200).json({
    success: true,
    plans
  });
});

// @desc    Get current subscription
// @route   GET /api/subscription/current
// @access  Private
exports.getCurrentSubscription = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  const subscription = {
    plan: user.subscription.plan,
    status: user.subscription.status,
    startDate: user.subscription.startDate,
    endDate: user.subscription.endDate,
    autoRenew: user.subscription.autoRenew,
    isPremium: user.isPremium,
    isInTrial: user.isInTrial,
    daysRemaining: user.subscription.endDate ? 
      Math.max(0, Math.ceil((user.subscription.endDate - new Date()) / (1000 * 60 * 60 * 24))) : 
      null,
    features: user.subscription.plan === 'premium' ? 
      SUBSCRIPTION_PLANS.premium_monthly.features : 
      ['Basic troubleshooting guides', 'Community support']
  };

  res.status(200).json({
    success: true,
    subscription
  });
});

// @desc    Start free trial (if eligible)
// @route   POST /api/subscription/trial
// @access  Private
exports.startTrial = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  // Check if user is already premium or has used trial
  if (user.subscription.plan === 'premium' || user.subscription.status === 'trial') {
    return next(new ErrorResponse('Trial not available', 400));
  }

  // Start 7-day trial
  const trialEndDate = new Date();
  trialEndDate.setDate(trialEndDate.getDate() + 7);

  await user.updateSubscription({
    plan: 'premium',
    status: 'trial',
    startDate: new Date(),
    endDate: trialEndDate
  });

  logger.info('Free trial started', {
    userId: user.id,
    endDate: trialEndDate
  });

  res.status(200).json({
    success: true,
    message: 'Free trial started successfully',
    subscription: {
      plan: user.subscription.plan,
      status: user.subscription.status,
      endDate: user.subscription.endDate,
      daysRemaining: 7
    }
  });
});

// @desc    Cancel subscription
// @route   POST /api/subscription/cancel
// @access  Private
exports.cancelSubscription = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  if (user.subscription.plan === 'free') {
    return next(new ErrorResponse('No active subscription to cancel', 400));
  }

  try {
    await PaymentService.cancelSubscription(req.user.id);

    res.status(200).json({
      success: true,
      message: 'Subscription cancelled successfully'
    });

  } catch (error) {
    logger.error('Subscription cancellation failed', {
      userId: req.user.id,
      error: error.message
    });
    return next(new ErrorResponse('Failed to cancel subscription', 500));
  }
});

module.exports = {
  getPlans,
  getCurrentSubscription,
  startTrial,
  cancelSubscription
};
