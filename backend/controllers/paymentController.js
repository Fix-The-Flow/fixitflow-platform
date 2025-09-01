const { validationResult } = require('express-validator');
const { 
  StripePaymentService, 
  PayPalPaymentService, 
  PaymentService,
  SUBSCRIPTION_PLANS 
} = require('../services/paymentService');
const { asyncHandler, ErrorResponse } = require('../middleware/errorHandler');
const User = require('../models/User');
const logger = require('../config/logger');

// @desc    Get subscription plans
// @route   GET /api/payment/plans
// @access  Public
exports.getPlans = asyncHandler(async (req, res, next) => {
  const plans = PaymentService.getSubscriptionPlans();

  res.status(200).json({
    success: true,
    plans
  });
});

// @desc    Create Stripe payment intent for subscription
// @route   POST /api/payment/stripe/create-subscription
// @access  Private
exports.createStripeSubscription = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  const { planType, priceId } = req.body;
  const userId = req.user.id;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return next(new ErrorResponse('User not found', 404));
    }

    // Check if user already has an active subscription
    if (user.subscription.plan === 'premium' && user.subscription.status === 'active') {
      return next(new ErrorResponse('User already has an active subscription', 400));
    }

    // Ensure user has a Stripe customer ID
    let customerId = user.subscription.stripeCustomerId;
    if (!customerId) {
      const customer = await StripePaymentService.createCustomer(user);
      customerId = customer.id;
      
      user.subscription.stripeCustomerId = customerId;
      await user.save();
    }

    // Create subscription
    const subscription = await StripePaymentService.createSubscription(
      customerId, 
      priceId, 
      userId
    );

    logger.info('Stripe subscription created for user', {
      userId,
      subscriptionId: subscription.id,
      planType
    });

    res.status(201).json({
      success: true,
      message: 'Subscription created successfully',
      subscription: {
        id: subscription.id,
        clientSecret: subscription.latest_invoice.payment_intent.client_secret,
        status: subscription.status
      }
    });

  } catch (error) {
    logger.error('Stripe subscription creation failed', {
      userId,
      planType,
      error: error.message
    });
    return next(new ErrorResponse('Failed to create subscription', 500));
  }
});

// @desc    Create Stripe payment intent for one-time payment
// @route   POST /api/payment/stripe/create-payment-intent
// @access  Private
exports.createStripePaymentIntent = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  const { planType } = req.body;
  const userId = req.user.id;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return next(new ErrorResponse('User not found', 404));
    }

    const plan = SUBSCRIPTION_PLANS[planType];
    if (!plan) {
      return next(new ErrorResponse('Invalid plan type', 400));
    }

    // Ensure user has a Stripe customer ID
    let customerId = user.subscription.stripeCustomerId;
    if (!customerId) {
      const customer = await StripePaymentService.createCustomer(user);
      customerId = customer.id;
      
      user.subscription.stripeCustomerId = customerId;
      await user.save();
    }

    // Create payment intent
    const paymentIntent = await StripePaymentService.createPaymentIntent(
      plan.amount,
      plan.currency,
      customerId,
      {
        userId: userId.toString(),
        planType,
        type: 'one-time-subscription'
      }
    );

    logger.info('Stripe payment intent created', {
      userId,
      paymentIntentId: paymentIntent.id,
      planType,
      amount: plan.amount
    });

    res.status(201).json({
      success: true,
      message: 'Payment intent created successfully',
      paymentIntent: {
        id: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        amount: plan.amount
      }
    });

  } catch (error) {
    logger.error('Stripe payment intent creation failed', {
      userId,
      planType,
      error: error.message
    });
    return next(new ErrorResponse('Failed to create payment intent', 500));
  }
});

// @desc    Handle Stripe webhook
// @route   POST /api/payment/stripe/webhook
// @access  Public
exports.stripeWebhook = asyncHandler(async (req, res, next) => {
  const signature = req.headers['stripe-signature'];

  try {
    await StripePaymentService.handleWebhook(req.body, signature);
    
    res.status(200).json({ received: true });
  } catch (error) {
    logger.error('Stripe webhook processing failed', {
      error: error.message
    });
    return next(new ErrorResponse('Webhook processing failed', 400));
  }
});

// @desc    Create PayPal payment
// @route   POST /api/payment/paypal/create-payment
// @access  Private
exports.createPayPalPayment = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  const { planType } = req.body;
  const userId = req.user.id;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return next(new ErrorResponse('User not found', 404));
    }

    const plan = SUBSCRIPTION_PLANS[planType];
    if (!plan) {
      return next(new ErrorResponse('Invalid plan type', 400));
    }

    const payment = await PayPalPaymentService.createPayment(
      plan.amount,
      'USD',
      `FixItFlow ${plan.name} Subscription`
    );

    // Find approval URL
    const approvalUrl = payment.links.find(link => link.rel === 'approval_url');

    logger.info('PayPal payment created', {
      userId,
      paymentId: payment.id,
      planType,
      amount: plan.amount
    });

    res.status(201).json({
      success: true,
      message: 'PayPal payment created successfully',
      payment: {
        id: payment.id,
        approvalUrl: approvalUrl ? approvalUrl.href : null
      }
    });

  } catch (error) {
    logger.error('PayPal payment creation failed', {
      userId,
      planType,
      error: error.message
    });
    return next(new ErrorResponse('Failed to create PayPal payment', 500));
  }
});

// @desc    Execute PayPal payment
// @route   POST /api/payment/paypal/execute-payment
// @access  Private
exports.executePayPalPayment = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  const { paymentId, payerId, planType } = req.body;
  const userId = req.user.id;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return next(new ErrorResponse('User not found', 404));
    }

    const plan = SUBSCRIPTION_PLANS[planType];
    if (!plan) {
      return next(new ErrorResponse('Invalid plan type', 400));
    }

    const payment = await PayPalPaymentService.executePayment(paymentId, payerId);

    if (payment.state === 'approved') {
      // Calculate end date based on plan interval
      let endDate = new Date();
      if (plan.interval === 'day') {
        endDate.setDate(endDate.getDate() + 1);
      } else if (plan.interval === 'month') {
        endDate.setMonth(endDate.getMonth() + 1);
      } else if (plan.interval === 'year') {
        endDate.setFullYear(endDate.getFullYear() + 1);
      }

      // Update user subscription
      await user.updateSubscription({
        plan: 'premium',
        status: 'active',
        paypalSubscriptionId: paymentId,
        startDate: new Date(),
        endDate
      });

      // Send confirmation email
      const { sendEmail, sendAdminNotification } = require('../services/emailService');
      
      await sendEmail({
        email: user.email,
        template: 'subscription-confirmation',
        context: {
          firstName: user.firstName,
          planName: plan.name,
          amount: plan.amount,
          nextBilling: endDate.toLocaleDateString()
        }
      });

      // Send admin notification
      await sendAdminNotification('new-subscription', {
        user: {
          name: user.fullName,
          email: user.email
        },
        subscription: {
          planName: plan.name,
          amount: plan.amount,
          date: new Date().toLocaleString()
        }
      });

      logger.info('PayPal payment executed successfully', {
        userId,
        paymentId,
        planType,
        amount: plan.amount
      });

      res.status(200).json({
        success: true,
        message: 'Payment completed successfully',
        subscription: {
          plan: user.subscription.plan,
          status: user.subscription.status,
          endDate: user.subscription.endDate
        }
      });
    } else {
      return next(new ErrorResponse('Payment was not approved', 400));
    }

  } catch (error) {
    logger.error('PayPal payment execution failed', {
      userId,
      paymentId,
      payerId,
      error: error.message
    });
    return next(new ErrorResponse('Failed to execute PayPal payment', 500));
  }
});

// @desc    Cancel subscription
// @route   POST /api/payment/cancel-subscription
// @access  Private
exports.cancelSubscription = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;

  try {
    const result = await PaymentService.cancelSubscription(userId);

    res.status(200).json({
      success: true,
      message: result.message
    });

  } catch (error) {
    logger.error('Subscription cancellation failed', {
      userId,
      error: error.message
    });
    return next(new ErrorResponse('Failed to cancel subscription', 500));
  }
});

// @desc    Get current subscription status
// @route   GET /api/payment/subscription-status
// @access  Private
exports.getSubscriptionStatus = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  const subscriptionStatus = {
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
    subscription: subscriptionStatus
  });
});

// @desc    Update subscription settings
// @route   PUT /api/payment/subscription-settings
// @access  Private
exports.updateSubscriptionSettings = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  const { autoRenew } = req.body;
  const userId = req.user.id;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return next(new ErrorResponse('User not found', 404));
    }

    // Update auto-renew setting
    await user.updateSubscription({
      autoRenew
    });

    logger.info('Subscription settings updated', {
      userId,
      autoRenew
    });

    res.status(200).json({
      success: true,
      message: 'Subscription settings updated successfully',
      subscription: {
        autoRenew: user.subscription.autoRenew
      }
    });

  } catch (error) {
    logger.error('Subscription settings update failed', {
      userId,
      error: error.message
    });
    return next(new ErrorResponse('Failed to update subscription settings', 500));
  }
});

// @desc    Get payment history
// @route   GET /api/payment/history
// @access  Private
exports.getPaymentHistory = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  // In a real application, you would store payment history in a separate model
  // For now, we'll return basic subscription info
  const paymentHistory = [
    {
      id: 'placeholder',
      date: user.subscription.startDate,
      amount: user.subscription.plan === 'premium' ? 4.99 : 0,
      status: 'completed',
      description: `FixItFlow ${user.subscription.plan} subscription`,
      paymentMethod: user.subscription.stripeCustomerId ? 'stripe' : 
                    user.subscription.paypalSubscriptionId ? 'paypal' : 'none'
    }
  ].filter(payment => payment.paymentMethod !== 'none');

  res.status(200).json({
    success: true,
    payments: paymentHistory,
    total: paymentHistory.length
  });
});

module.exports = {
  getPlans,
  createStripeSubscription,
  createStripePaymentIntent,
  stripeWebhook,
  createPayPalPayment,
  executePayPalPayment,
  cancelSubscription,
  getSubscriptionStatus,
  updateSubscriptionSettings,
  getPaymentHistory
};
