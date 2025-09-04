const { validationResult } = require('express-validator');
const User = require('../models/User');
const { PaymentService, SUBSCRIPTION_PLANS } = require('../services/paymentService');
const { asyncHandler, ErrorResponse } = require('../middleware/errorHandler');
const logger = require('../config/logger');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// New subscription plans configuration
const NEW_SUBSCRIPTION_PLANS = {
  free: {
    name: 'Free',
    price: 0,
    features: ['Basic troubleshooting guides', 'Community support']
  },
  monthly: {
    name: 'Monthly Premium',
    price: 7.99,
    interval: 'month',
    duration: 30 * 24 * 60 * 60 * 1000, // 30 days
    features: ['Complex guides', 'AI chat support', 'Video chat', 'Linked videos', 'Priority support']
  },
  daily: {
    name: 'Pro Day Pass',
    price: 2.99,
    interval: 'day',
    duration: 24 * 60 * 60 * 1000, // 24 hours
    features: ['Complex guides', 'AI chat support', 'Video chat', 'Linked videos']
  },
  annual: {
    name: 'Annual Premium',
    price: 54.99,
    interval: 'year',
    duration: 365 * 24 * 60 * 60 * 1000, // 365 days
    features: ['Complex guides', 'AI chat support', 'Video chat', 'Linked videos', 'Priority support', 'Best value!']
  }
};

// @desc    Get subscription plans
// @route   GET /api/subscription/plans
// @access  Public
exports.getPlans = asyncHandler(async (req, res, next) => {
  const plans = NEW_SUBSCRIPTION_PLANS;

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

// @desc    Create payment session for subscription
// @route   POST /api/subscription/create-session
// @access  Public (allows anonymous users)
exports.createPaymentSession = asyncHandler(async (req, res, next) => {
  const { plan, email, returnUrl } = req.body;

  if (!NEW_SUBSCRIPTION_PLANS[plan] || plan === 'free') {
    return next(new ErrorResponse('Invalid subscription plan', 400));
  }

  const planData = NEW_SUBSCRIPTION_PLANS[plan];

  try {
    // Create Stripe customer if email is provided
    let customer = null;
    if (email) {
      const existingCustomer = await stripe.customers.list({ email });
      if (existingCustomer.data.length > 0) {
        customer = existingCustomer.data[0];
      } else {
        customer = await stripe.customers.create({
          email,
          metadata: { plan, source: 'fixitflow_app' }
        });
      }
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: planData.name,
            description: `Access to premium features: ${planData.features.join(', ')}`
          },
          unit_amount: Math.round(planData.price * 100),
        },
        quantity: 1,
      }],
      mode: 'payment',
      customer: customer?.id,
      success_url: `${returnUrl || process.env.CLIENT_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}&plan=${plan}`,
      cancel_url: `${returnUrl || process.env.CLIENT_URL}/subscription/cancel`,
      metadata: {
        plan,
        duration: planData.duration.toString(),
        email: email || 'anonymous'
      }
    });

    res.status(200).json({
      success: true,
      sessionId: session.id,
      url: session.url
    });
  } catch (error) {
    logger.error('Payment session creation failed', { error: error.message, plan });
    return next(new ErrorResponse('Error creating payment session', 500));
  }
});

// @desc    Handle successful payment
// @route   POST /api/subscription/payment-success
// @access  Public
exports.handlePaymentSuccess = asyncHandler(async (req, res, next) => {
  const { sessionId, email } = req.body;

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (session.payment_status !== 'paid') {
      return next(new ErrorResponse('Payment not completed', 400));
    }

    const plan = session.metadata.plan;
    const duration = parseInt(session.metadata.duration);
    const customerEmail = email || session.metadata.email;

    // Handle user subscription
    let user = null;
    if (customerEmail && customerEmail !== 'anonymous') {
      user = await User.findOne({ email: customerEmail });
      
      if (!user) {
        // Create anonymous premium user
        user = new User({
          firstName: 'Anonymous',
          lastName: 'User',
          email: customerEmail,
          isEmailVerified: false,
          role: 'user'
        });
        await user.save();
      }

      await user.updateSubscriptionPlan(plan, duration);
      user.subscription.stripeCustomerId = session.customer;
      await user.save();

      res.status(200).json({
        success: true,
        message: 'Subscription activated successfully',
        user: {
          id: user._id,
          subscription: user.subscription,
          isPremium: user.isPremium
        }
      });
    } else {
      // For completely anonymous users, return subscription token
      const subscriptionToken = Buffer.from(JSON.stringify({
        plan,
        expiresAt: new Date(Date.now() + duration),
        sessionId,
        features: NEW_SUBSCRIPTION_PLANS[plan].features
      })).toString('base64');

      res.status(200).json({
        success: true,
        message: 'Subscription activated successfully',
        subscriptionToken,
        subscription: {
          plan,
          expiresAt: new Date(Date.now() + duration),
          features: NEW_SUBSCRIPTION_PLANS[plan].features
        }
      });
    }
  } catch (error) {
    logger.error('Payment success handler error', { error: error.message, sessionId });
    return next(new ErrorResponse('Error processing payment success', 500));
  }
});

// @desc    Verify anonymous subscription
// @route   GET /api/subscription/verify
// @access  Public
exports.verifySubscription = asyncHandler(async (req, res, next) => {
  const { token } = req.query;
  
  if (!token) {
    return next(new ErrorResponse('Subscription token required', 400));
  }

  try {
    const subscriptionData = JSON.parse(Buffer.from(token, 'base64').toString());
    const isExpired = new Date() > new Date(subscriptionData.expiresAt);
    
    res.status(200).json({
      success: true,
      subscription: subscriptionData,
      isExpired,
      isValid: !isExpired
    });
  } catch (decodeError) {
    return next(new ErrorResponse('Invalid subscription token', 400));
  }
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
  getPlans: exports.getPlans,
  getCurrentSubscription: exports.getCurrentSubscription,
  startTrial: exports.startTrial,
  createPaymentSession: exports.createPaymentSession,
  handlePaymentSuccess: exports.handlePaymentSuccess,
  verifySubscription: exports.verifySubscription,
  cancelSubscription: exports.cancelSubscription
};
