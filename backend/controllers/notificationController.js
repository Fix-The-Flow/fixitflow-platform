const { validationResult } = require('express-validator');
const NotificationService = require('../services/notificationService');
const { asyncHandler, ErrorResponse } = require('../middleware/errorHandler');
const logger = require('../config/logger');

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = asyncHandler(async (req, res, next) => {
  try {
    const userId = req.user.id;
    const options = {
      limit: parseInt(req.query.limit, 10) || 20,
      offset: parseInt(req.query.offset, 10) || 0,
      unreadOnly: req.query.unread === 'true'
    };

    const result = NotificationService.getUserNotifications(userId, options);

    res.status(200).json({
      success: true,
      ...result
    });

  } catch (error) {
    logger.error('Get notifications error', {
      userId: req.user.id,
      error: error.message
    });
    return next(new ErrorResponse('Failed to retrieve notifications', 500));
  }
});

// @desc    Get unread notification count
// @route   GET /api/notifications/unread-count
// @access  Private
exports.getUnreadCount = asyncHandler(async (req, res, next) => {
  try {
    const userId = req.user.id;
    const result = NotificationService.getUserNotifications(userId, { unreadOnly: true });

    res.status(200).json({
      success: true,
      unreadCount: result.unreadCount
    });

  } catch (error) {
    logger.error('Get unread count error', {
      userId: req.user.id,
      error: error.message
    });
    return next(new ErrorResponse('Failed to retrieve unread count', 500));
  }
});

// @desc    Mark notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
exports.markAsRead = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  try {
    const userId = req.user.id;
    const notificationId = req.params.id;

    const success = NotificationService.markAsRead(userId, notificationId);

    if (!success) {
      return next(new ErrorResponse('Notification not found', 404));
    }

    res.status(200).json({
      success: true,
      message: 'Notification marked as read'
    });

  } catch (error) {
    logger.error('Mark notification as read error', {
      userId: req.user.id,
      notificationId: req.params.id,
      error: error.message
    });
    return next(new ErrorResponse('Failed to mark notification as read', 500));
  }
});

// @desc    Mark all notifications as read
// @route   PATCH /api/notifications/read-all
// @access  Private
exports.markAllAsRead = asyncHandler(async (req, res, next) => {
  try {
    const userId = req.user.id;
    const count = NotificationService.markAllAsRead(userId);

    res.status(200).json({
      success: true,
      message: `${count} notifications marked as read`,
      markedCount: count
    });

  } catch (error) {
    logger.error('Mark all notifications as read error', {
      userId: req.user.id,
      error: error.message
    });
    return next(new ErrorResponse('Failed to mark notifications as read', 500));
  }
});

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
exports.deleteNotification = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  try {
    const userId = req.user.id;
    const notificationId = req.params.id;

    const success = NotificationService.deleteNotification(userId, notificationId);

    if (!success) {
      return next(new ErrorResponse('Notification not found', 404));
    }

    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully'
    });

  } catch (error) {
    logger.error('Delete notification error', {
      userId: req.user.id,
      notificationId: req.params.id,
      error: error.message
    });
    return next(new ErrorResponse('Failed to delete notification', 500));
  }
});

// @desc    Clear all notifications
// @route   DELETE /api/notifications/clear-all
// @access  Private
exports.clearAllNotifications = asyncHandler(async (req, res, next) => {
  try {
    const userId = req.user.id;
    const count = NotificationService.clearAllNotifications(userId);

    res.status(200).json({
      success: true,
      message: `${count} notifications cleared`,
      clearedCount: count
    });

  } catch (error) {
    logger.error('Clear all notifications error', {
      userId: req.user.id,
      error: error.message
    });
    return next(new ErrorResponse('Failed to clear notifications', 500));
  }
});

// @desc    Test notification (for development/admin)
// @route   POST /api/notifications/test
// @access  Private (Admin)
exports.testNotification = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  try {
    const { type, title, message, priority = 'normal' } = req.body;
    const userId = req.user.id;
    const userEmail = req.user.email;

    const notification = {
      type: type || 'test',
      title: title || 'Test Notification',
      message: message || 'This is a test notification from FixItFlow.',
      priority,
      data: {
        testMode: true,
        timestamp: new Date()
      }
    };

    const result = await NotificationService.sendNotification(
      userId, 
      userEmail, 
      notification,
      { realtime: true }
    );

    res.status(200).json({
      success: true,
      message: 'Test notification sent',
      result
    });

  } catch (error) {
    logger.error('Test notification error', {
      userId: req.user.id,
      error: error.message
    });
    return next(new ErrorResponse('Failed to send test notification', 500));
  }
});

// @desc    Send notification to user (Admin only)
// @route   POST /api/notifications/send
// @access  Private (Admin)
exports.sendNotificationToUser = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  try {
    const { 
      userId, 
      userEmail, 
      type, 
      title, 
      message, 
      priority = 'normal',
      sendEmail = false
    } = req.body;

    const notification = {
      type,
      title,
      message,
      priority,
      data: {
        sentByAdmin: true,
        adminId: req.user.id,
        adminName: req.user.fullName
      }
    };

    const result = await NotificationService.sendNotification(
      userId,
      userEmail,
      notification,
      { 
        realtime: true,
        email: sendEmail
      }
    );

    logger.info('Admin sent notification to user', {
      adminId: req.user.id,
      targetUserId: userId,
      type,
      title
    });

    res.status(200).json({
      success: true,
      message: 'Notification sent successfully',
      result
    });

  } catch (error) {
    logger.error('Send notification to user error', {
      adminId: req.user.id,
      error: error.message
    });
    return next(new ErrorResponse('Failed to send notification', 500));
  }
});

// @desc    Get notification statistics (Admin only)
// @route   GET /api/notifications/stats
// @access  Private (Admin)
exports.getNotificationStats = asyncHandler(async (req, res, next) => {
  try {
    const stats = NotificationService.getNotificationStats();

    res.status(200).json({
      success: true,
      stats
    });

  } catch (error) {
    logger.error('Get notification stats error', {
      adminId: req.user.id,
      error: error.message
    });
    return next(new ErrorResponse('Failed to retrieve notification stats', 500));
  }
});

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
  testNotification,
  sendNotificationToUser,
  getNotificationStats
};
