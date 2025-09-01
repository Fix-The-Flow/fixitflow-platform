const { validationResult } = require('express-validator');
const HelpfulHandyService = require('../services/aiChatbotService');
const { asyncHandler, ErrorResponse } = require('../middleware/errorHandler');
const logger = require('../config/logger');

// @desc    Chat with Helpful Handy (general assistance)
// @route   POST /api/ai/chat
// @access  Private
exports.chat = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  const { message, context = 'general' } = req.body;
  const userId = req.user.id;

  try {
    const response = await HelpfulHandyService.chat(userId, message, context);

    // Suggest articles if it might be helpful
    let suggestedArticles = [];
    if (response.success && context !== 'account_help') {
      suggestedArticles = await HelpfulHandyService.suggestArticles(message, 3);
    }

    res.status(200).json({
      success: true,
      response: response.message,
      context: response.context,
      conversationLength: response.conversationLength,
      suggestedArticles,
      ...(response.suggestUpgrade && { suggestUpgrade: true })
    });

  } catch (error) {
    logger.error('Chat error', {
      userId,
      message: message.substring(0, 100), // Log first 100 chars
      error: error.message
    });

    return next(new ErrorResponse('Chat service unavailable', 500));
  }
});

// @desc    Premium AI troubleshooting chat
// @route   POST /api/ai/troubleshoot
// @access  Private (Premium)
exports.troubleshootingChat = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  // Check premium access
  if (!req.user.hasPremiumAccess()) {
    return res.status(403).json({
      success: false,
      message: 'Premium subscription required for detailed AI troubleshooting',
      suggestUpgrade: true
    });
  }

  const { message } = req.body;
  const userId = req.user.id;

  try {
    const response = await HelpfulHandyService.chat(userId, message, 'premium');

    res.status(200).json({
      success: true,
      response: response.message,
      context: response.context,
      conversationLength: response.conversationLength
    });

  } catch (error) {
    logger.error('Troubleshooting chat error', {
      userId,
      error: error.message
    });

    return next(new ErrorResponse('AI troubleshooting service unavailable', 500));
  }
});

// @desc    Account help chat
// @route   POST /api/ai/account-help
// @access  Private
exports.accountHelp = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  const { question } = req.body;
  const userId = req.user.id;

  try {
    const response = await HelpfulHandyService.handleAccountQuestion(userId, question);

    res.status(200).json({
      success: true,
      response: typeof response === 'string' ? response : response.message,
      ...(typeof response === 'object' && response.suggestUpgrade && { suggestUpgrade: true })
    });

  } catch (error) {
    logger.error('Account help error', {
      userId,
      error: error.message
    });

    return next(new ErrorResponse('Account help service unavailable', 500));
  }
});

// @desc    Onboarding assistance for new users
// @route   POST /api/ai/onboarding
// @access  Private
exports.onboardingHelp = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  const { message } = req.body;
  const userId = req.user.id;

  try {
    const response = await HelpfulHandyService.chat(userId, message, 'onboarding');

    res.status(200).json({
      success: true,
      response: response.message,
      context: response.context
    });

  } catch (error) {
    logger.error('Onboarding help error', {
      userId,
      error: error.message
    });

    return next(new ErrorResponse('Onboarding help service unavailable', 500));
  }
});

// @desc    Image analysis for troubleshooting (Premium)
// @route   POST /api/ai/analyze-image
// @access  Private (Premium)
exports.analyzeImage = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  const { imageUrl, description } = req.body;
  const userId = req.user.id;

  try {
    const response = await HelpfulHandyService.analyzeImage(userId, imageUrl, description);

    res.status(200).json({
      success: response.success,
      response: response.message,
      ...(response.suggestUpgrade && { suggestUpgrade: true })
    });

  } catch (error) {
    logger.error('Image analysis error', {
      userId,
      error: error.message
    });

    return next(new ErrorResponse('Image analysis service unavailable', 500));
  }
});

// @desc    Get chat history
// @route   GET /api/ai/chat-history
// @access  Private
exports.getChatHistory = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;
  const limit = parseInt(req.query.limit, 10) || 50;

  try {
    const history = HelpfulHandyService.getChatHistory(userId, limit);

    res.status(200).json({
      success: true,
      history,
      count: history.length
    });

  } catch (error) {
    logger.error('Get chat history error', {
      userId,
      error: error.message
    });

    return next(new ErrorResponse('Failed to retrieve chat history', 500));
  }
});

// @desc    Clear chat history
// @route   DELETE /api/ai/chat-history
// @access  Private
exports.clearChatHistory = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;

  try {
    const cleared = HelpfulHandyService.clearConversation(userId);

    res.status(200).json({
      success: true,
      message: cleared ? 'Chat history cleared successfully' : 'No chat history found'
    });

  } catch (error) {
    logger.error('Clear chat history error', {
      userId,
      error: error.message
    });

    return next(new ErrorResponse('Failed to clear chat history', 500));
  }
});

// @desc    Get suggested articles based on query
// @route   GET /api/ai/suggest-articles
// @access  Public
exports.suggestArticles = asyncHandler(async (req, res, next) => {
  const { q: query, limit = 5 } = req.query;

  if (!query) {
    return next(new ErrorResponse('Query parameter is required', 400));
  }

  try {
    const articles = await HelpfulHandyService.suggestArticles(query, parseInt(limit, 10));

    res.status(200).json({
      success: true,
      query,
      articles,
      count: articles.length
    });

  } catch (error) {
    logger.error('Suggest articles error', {
      query,
      error: error.message
    });

    return next(new ErrorResponse('Failed to suggest articles', 500));
  }
});

// @desc    Get AI chat statistics (Admin only)
// @route   GET /api/ai/stats
// @access  Private (Admin)
exports.getChatStats = asyncHandler(async (req, res, next) => {
  try {
    const stats = HelpfulHandyService.getChatStats();

    res.status(200).json({
      success: true,
      stats
    });

  } catch (error) {
    logger.error('Get chat stats error', {
      error: error.message
    });

    return next(new ErrorResponse('Failed to retrieve chat statistics', 500));
  }
});

// @desc    Welcome message for new users
// @route   GET /api/ai/welcome
// @access  Private
exports.getWelcomeMessage = asyncHandler(async (req, res, next) => {
  const user = req.user;

  // Personalized welcome message based on user status
  let welcomeMessage = `Hi ${user.firstName}! I'm Helpful Handy, your AI assistant for FixItFlow. `;

  if (!user.isEmailVerified) {
    welcomeMessage += "I notice your email isn't verified yet. I can help you with that! ";
  }

  if (user.subscription.plan === 'premium') {
    welcomeMessage += "As a Premium subscriber, you have access to detailed AI troubleshooting, image analysis, and priority support. ";
  } else {
    welcomeMessage += "I can help you navigate the app, answer account questions, and provide basic troubleshooting guidance. ";
  }

  welcomeMessage += "What can I help you with today?";

  // Suggest popular categories based on user's interests
  let suggestedCategories = ['technology', 'home-maintenance', 'automotive'];
  if (user.analytics.favoriteCategories.length > 0) {
    suggestedCategories = user.analytics.favoriteCategories.slice(0, 3);
  }

  res.status(200).json({
    success: true,
    message: welcomeMessage,
    suggestedCategories,
    features: {
      basicChat: true,
      accountHelp: true,
      premiumTroubleshooting: user.hasPremiumAccess(),
      imageAnalysis: user.hasPremiumAccess(),
      articleSuggestions: true
    }
  });
});

module.exports = {
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
};
