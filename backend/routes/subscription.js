const express = require('express');
const {
  getPlans,
  getCurrentSubscription,
  startTrial,
  createPaymentSession,
  handlePaymentSuccess,
  verifySubscription,
  cancelSubscription
} = require('../controllers/subscriptionController');

const { protect } = require('../middleware/auth');
const { addSubscriptionInfo } = require('../middleware/premiumFeatures');

const router = express.Router();

// Public routes (allow anonymous access)
router.get('/plans', addSubscriptionInfo, getPlans);
router.post('/create-session', createPaymentSession);
router.post('/payment-success', handlePaymentSuccess);
router.get('/verify', verifySubscription);

// Protected routes (require authentication)
router.get('/current', protect, getCurrentSubscription);
router.post('/trial', protect, startTrial);
router.post('/cancel', protect, cancelSubscription);

module.exports = router;
