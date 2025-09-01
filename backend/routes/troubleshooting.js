const express = require('express');
const { body } = require('express-validator');
const {
  getTroubleshootingArticles,
  getTroubleshootingArticle,
  getArticlesByCategory,
  searchArticles,
  getPopularArticles,
  addComment,
  replyToComment,
  rateArticle,
  toggleLike,
  getCategories,
  createArticle,
  updateArticle,
  deleteArticle
} = require('../controllers/troubleshootingController');

const { protect, optionalAuth, requireStaff, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const createArticleValidation = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),

  body('description')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),

  body('category')
    .isIn([
      'technology',
      'automotive', 
      'home-maintenance',
      'appliances',
      'electronics',
      'plumbing',
      'electrical',
      'heating-cooling',
      'gardening',
      'pets',
      'health-wellness',
      'computer-software',
      'mobile-devices',
      'internet-networking',
      'other'
    ])
    .withMessage('Invalid category'),

  body('difficulty')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced'])
    .withMessage('Difficulty must be beginner, intermediate, or advanced'),

  body('steps')
    .isArray({ min: 1 })
    .withMessage('At least one step is required'),

  body('steps.*.stepNumber')
    .isInt({ min: 1 })
    .withMessage('Step number must be a positive integer'),

  body('steps.*.title')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Step title is required and must be less than 100 characters'),

  body('steps.*.description')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Step description is required and must be less than 2000 characters'),

  body('isPremiumContent')
    .optional()
    .isBoolean()
    .withMessage('isPremiumContent must be a boolean'),

  body('status')
    .optional()
    .isIn(['draft', 'published', 'archived', 'pending_review'])
    .withMessage('Invalid status')
];

const updateArticleValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),

  body('category')
    .optional()
    .isIn([
      'technology',
      'automotive',
      'home-maintenance',
      'appliances',
      'electronics',
      'plumbing',
      'electrical',
      'heating-cooling',
      'gardening',
      'pets',
      'health-wellness',
      'computer-software',
      'mobile-devices',
      'internet-networking',
      'other'
    ])
    .withMessage('Invalid category'),

  body('difficulty')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced'])
    .withMessage('Difficulty must be beginner, intermediate, or advanced'),

  body('isPremiumContent')
    .optional()
    .isBoolean()
    .withMessage('isPremiumContent must be a boolean'),

  body('status')
    .optional()
    .isIn(['draft', 'published', 'archived', 'pending_review'])
    .withMessage('Invalid status')
];

const commentValidation = [
  body('comment')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Comment must be between 1 and 500 characters')
];

const replyValidation = [
  body('reply')
    .trim()
    .isLength({ min: 1, max: 300 })
    .withMessage('Reply must be between 1 and 300 characters')
];

const ratingValidation = [
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),

  body('review')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Review must be less than 500 characters')
];

const likeValidation = [
  body('isLike')
    .isBoolean()
    .withMessage('isLike must be a boolean')
];

// Public routes (with optional auth for premium content access)
router.get('/', optionalAuth, getTroubleshootingArticles);
router.get('/categories', getCategories);
router.get('/popular', getPopularArticles);
router.get('/search', optionalAuth, searchArticles);
router.get('/category/:category', optionalAuth, getArticlesByCategory);
router.get('/:id', optionalAuth, getTroubleshootingArticle);

// Protected routes (require authentication)
router.use(protect);

// User interaction routes
router.post('/:id/comments', commentValidation, addComment);
router.post('/:id/comments/:commentId/reply', replyValidation, replyToComment);
router.post('/:id/rate', ratingValidation, rateArticle);
router.post('/:id/like', likeValidation, toggleLike);

// Content management routes (require staff access)
router.post('/', requireStaff, createArticleValidation, createArticle);
router.put('/:id', requireStaff, updateArticleValidation, updateArticle);

// Admin only routes
router.delete('/:id', requireAdmin, deleteArticle);

module.exports = router;
