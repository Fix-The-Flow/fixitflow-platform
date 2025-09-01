const express = require('express');
const { body, param, query } = require('express-validator');
const {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
  testNotification,
  sendNotificationToUser,
  getNotificationStats
} = require('../controllers/notificationController');

const { protect, authorizeRoles } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');

const router = express.Router();

// Apply authentication to all routes
router.use(protect);

/**
 * @route   GET /api/notifications
 * @desc    Get user notifications with pagination
 * @access  Private
 */
router.get('/', [
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('offset').optional().isInt({ min: 0 }).toInt(),
  query('unread').optional().isBoolean()
], validateRequest, getNotifications);

/**
 * @route   GET /api/notifications/unread-count
 * @desc    Get count of unread notifications
 * @access  Private
 */
router.get('/unread-count', getUnreadCount);

/**
 * @route   PATCH /api/notifications/:id/read
 * @desc    Mark specific notification as read
 * @access  Private
 */
router.patch('/:id/read', [
  param('id').notEmpty().withMessage('Notification ID is required')
], validateRequest, markAsRead);

/**
 * @route   PATCH /api/notifications/read-all
 * @desc    Mark all notifications as read
 * @access  Private
 */
router.patch('/read-all', markAllAsRead);

/**
 * @route   DELETE /api/notifications/:id
 * @desc    Delete specific notification
 * @access  Private
 */
router.delete('/:id', [
  param('id').notEmpty().withMessage('Notification ID is required')
], validateRequest, deleteNotification);

/**
 * @route   DELETE /api/notifications/clear-all
 * @desc    Clear all notifications
 * @access  Private
 */
router.delete('/clear-all', clearAllNotifications);

// Admin only routes
router.use(authorizeRoles('admin'));

/**
 * @route   POST /api/notifications/test
 * @desc    Send test notification (Admin/Development)
 * @access  Private (Admin)
 */
router.post('/test', [
  body('type').optional().isString().trim().isLength({ min: 1, max: 50 }),
  body('title').optional().isString().trim().isLength({ min: 1, max: 200 }),
  body('message').optional().isString().trim().isLength({ min: 1, max: 500 }),
  body('priority').optional().isIn(['low', 'normal', 'high'])
], validateRequest, testNotification);

/**
 * @route   POST /api/notifications/send
 * @desc    Send notification to specific user (Admin only)
 * @access  Private (Admin)
 */
router.post('/send', [
  body('userId').isMongoId().withMessage('Valid user ID is required'),
  body('userEmail').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('type').isString().trim().isLength({ min: 1, max: 50 }).withMessage('Type is required'),
  body('title').isString().trim().isLength({ min: 1, max: 200 }).withMessage('Title is required'),
  body('message').isString().trim().isLength({ min: 1, max: 500 }).withMessage('Message is required'),
  body('priority').optional().isIn(['low', 'normal', 'high']).withMessage('Invalid priority'),
  body('sendEmail').optional().isBoolean()
], validateRequest, sendNotificationToUser);

/**
 * @route   GET /api/notifications/stats
 * @desc    Get notification statistics (Admin only)
 * @access  Private (Admin)
 */
router.get('/stats', getNotificationStats);

module.exports = router;
