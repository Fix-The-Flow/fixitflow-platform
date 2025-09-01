const express = require('express');
const { body } = require('express-validator');
const {
  chat,
  troubleshootingChat,
  accountHelp,
  onboardingHelp,
  analyzeImage,
  getChatHistory,
  clearChatHistory,
  suggestArticles,
  getChatStats,
  getWelcomeMessage
} = require('../controllers/aiController');

const { protect, requirePremium, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const chatValidation = [
  body('message')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Message must be between 1 and 2000 characters'),

  body('context')
    .optional()
    .isIn(['general', 'premium', 'account_help', 'onboarding'])
    .withMessage('Invalid context. Must be general, premium, account_help, or onboarding')
];

const messageValidation = [
  body('message')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Message must be between 1 and 2000 characters')
];

const questionValidation = [
  body('question')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Question must be between 1 and 1000 characters')
];

const imageAnalysisValidation = [
  body('imageUrl')
    .isURL()
    .withMessage('Valid image URL is required'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must be less than 1000 characters')
];

// Public routes
router.get('/suggest-articles', suggestArticles);

// Protected routes
router.use(protect);

// General AI chat routes
router.get('/welcome', getWelcomeMessage);
router.post('/chat', chatValidation, chat);
router.post('/account-help', questionValidation, accountHelp);
router.post('/onboarding', messageValidation, onboardingHelp);

// Chat history management
router.get('/chat-history', getChatHistory);
router.delete('/chat-history', clearChatHistory);

// Premium AI features
router.post('/troubleshoot', requirePremium, messageValidation, troubleshootingChat);
router.post('/analyze-image', requirePremium, imageAnalysisValidation, analyzeImage);

// Admin routes
router.get('/stats', requireAdmin, getChatStats);

module.exports = router;
