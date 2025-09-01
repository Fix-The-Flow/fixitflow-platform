const express = require('express');
const { body } = require('express-validator');
const {
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
} = require('../controllers/paymentController');

const { protect } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const planTypeValidation = [
  body('planType')
    .isIn(['premium_monthly', 'premium_yearly', 'premium_daily'])
    .withMessage('Invalid plan type. Must be premium_monthly, premium_yearly, or premium_daily')
];

const stripeSubscriptionValidation = [
  ...planTypeValidation,
  body('priceId')
    .notEmpty()
    .withMessage('Stripe price ID is required')
];

const paypalExecuteValidation = [
  ...planTypeValidation,
  body('paymentId')
    .notEmpty()
    .withMessage('PayPal payment ID is required'),
  body('payerId')
    .notEmpty()
    .withMessage('PayPal payer ID is required')
];

const subscriptionSettingsValidation = [
  body('autoRenew')
    .isBoolean()
    .withMessage('Auto-renew must be a boolean value')
];

// Public routes
router.get('/plans', getPlans);

// Stripe webhook (needs raw body, so handle before other middleware)
router.post('/stripe/webhook', express.raw({ type: 'application/json' }), stripeWebhook);

// Protected routes
router.use(protect);

// Stripe routes
router.post('/stripe/create-subscription', stripeSubscriptionValidation, createStripeSubscription);
router.post('/stripe/create-payment-intent', planTypeValidation, createStripePaymentIntent);

// PayPal routes
router.post('/paypal/create-payment', planTypeValidation, createPayPalPayment);
router.post('/paypal/execute-payment', paypalExecuteValidation, executePayPalPayment);

// Subscription management
router.get('/subscription-status', getSubscriptionStatus);
router.post('/cancel-subscription', cancelSubscription);
router.put('/subscription-settings', subscriptionSettingsValidation, updateSubscriptionSettings);

// Payment history
router.get('/history', getPaymentHistory);

module.exports = router;
