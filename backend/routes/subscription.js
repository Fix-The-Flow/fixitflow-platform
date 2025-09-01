const express = require('express');
const {
  getPlans,
  getCurrentSubscription,
  startTrial,
  cancelSubscription
} = require('../controllers/subscriptionController');

const { protect } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/plans', getPlans);

// Protected routes
router.use(protect);

router.get('/current', getCurrentSubscription);
router.post('/trial', startTrial);
router.post('/cancel', cancelSubscription);

module.exports = router;
