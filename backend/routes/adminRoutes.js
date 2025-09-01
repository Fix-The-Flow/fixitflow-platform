const express = require('express');
const { body, param, query } = require('express-validator');
const {
  getDashboard,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  getAnalytics,
  getSystemStatus,
  broadcastMessage
} = require('../controllers/adminController');

const { protect, authorizeRoles } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');

const router = express.Router();

// Apply authentication and admin role requirement to all routes
router.use(protect);
router.use(authorizeRoles('admin'));

/**
 * @route   GET /api/admin/dashboard
 * @desc    Get admin dashboard statistics and overview
 * @access  Private (Admin)
 */
router.get('/dashboard', getDashboard);

/**
 * @route   GET /api/admin/users
 * @desc    Get all users with filtering and pagination
 * @access  Private (Admin)
 */
router.get('/users', [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('plan').optional().isIn(['free', 'trial', 'premium']),
  query('status').optional().isIn(['active', 'inactive', 'trial', 'expired']),
  query('role').optional().isIn(['user', 'admin', 'moderator']),
  query('verified').optional().isBoolean(),
  query('search').optional().isString().trim().isLength({ min: 1, max: 100 })
], validateRequest, getUsers);

/**
 * @route   GET /api/admin/users/:id
 * @desc    Get single user details
 * @access  Private (Admin)
 */
router.get('/users/:id', [
  param('id').isMongoId().withMessage('Invalid user ID')
], validateRequest, getUser);

/**
 * @route   PUT /api/admin/users/:id
 * @desc    Update user account details
 * @access  Private (Admin)
 */
router.put('/users/:id', [
  param('id').isMongoId().withMessage('Invalid user ID'),
  body('firstName').optional().isString().trim().isLength({ min: 2, max: 50 }),
  body('lastName').optional().isString().trim().isLength({ min: 2, max: 50 }),
  body('email').optional().isEmail().normalizeEmail(),
  body('phone').optional().isMobilePhone(),
  body('role').optional().isIn(['user', 'admin', 'moderator']),
  body('isActive').optional().isBoolean(),
  body('isEmailVerified').optional().isBoolean(),
  body('isPhoneVerified').optional().isBoolean(),
  body('subscription.plan').optional().isIn(['free', 'trial', 'premium']),
  body('subscription.status').optional().isIn(['active', 'inactive', 'trial', 'expired', 'cancelled']),
  body('subscription.autoRenew').optional().isBoolean()
], validateRequest, updateUser);

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    Delete/deactivate user account
 * @access  Private (Admin)
 */
router.delete('/users/:id', [
  param('id').isMongoId().withMessage('Invalid user ID')
], validateRequest, deleteUser);

/**
 * @route   GET /api/admin/analytics
 * @desc    Get system analytics and trends
 * @access  Private (Admin)
 */
router.get('/analytics', [
  query('period').optional().isIn(['7d', '30d', '90d', '1y']).withMessage('Invalid period')
], validateRequest, getAnalytics);

/**
 * @route   GET /api/admin/system-status
 * @desc    Get system health and status information
 * @access  Private (Admin)
 */
router.get('/system-status', getSystemStatus);

/**
 * @route   POST /api/admin/broadcast
 * @desc    Send broadcast message to users
 * @access  Private (Admin)
 */
router.post('/broadcast', [
  body('message')
    .isString()
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Message must be between 10 and 500 characters'),
  body('type')
    .optional()
    .isIn(['info', 'warning', 'error', 'success'])
    .withMessage('Invalid message type'),
  body('targetAudience')
    .optional()
    .isIn(['all', 'premium', 'free'])
    .withMessage('Invalid target audience')
], validateRequest, broadcastMessage);

module.exports = router;
