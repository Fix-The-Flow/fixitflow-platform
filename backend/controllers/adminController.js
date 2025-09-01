const { validationResult } = require('express-validator');
const User = require('../models/User');
const Troubleshooting = require('../models/Troubleshooting');
const HelpfulHandyService = require('../services/aiChatbotService');
const SocketService = require('../services/socketService');
const { asyncHandler, ErrorResponse } = require('../middleware/errorHandler');
const logger = require('../config/logger');

// @desc    Get admin dashboard statistics
// @route   GET /api/admin/dashboard
// @access  Private (Admin)
exports.getDashboard = asyncHandler(async (req, res, next) => {
  try {
    // User statistics
    const totalUsers = await User.countDocuments();
    const premiumUsers = await User.countDocuments({ 'subscription.plan': 'premium', 'subscription.status': 'active' });
    const trialUsers = await User.countDocuments({ 'subscription.status': 'trial' });
    const newUsersToday = await User.countDocuments({
      createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
    });

    // Content statistics
    const totalArticles = await Troubleshooting.countDocuments();
    const publishedArticles = await Troubleshooting.countDocuments({ status: 'published', isActive: true });
    const draftArticles = await Troubleshooting.countDocuments({ status: 'draft' });
    const pendingReviewArticles = await Troubleshooting.countDocuments({ status: 'pending_review' });

    // Subscription statistics
    const subscriptionStats = await User.aggregate([
      {
        $group: {
          _id: '$subscription.plan',
          count: { $sum: 1 }
        }
      }
    ]);

    // Recent activity
    const recentUsers = await User.find()
      .select('firstName lastName email createdAt subscription')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentArticles = await Troubleshooting.find()
      .select('title category status createdAt author')
      .populate('author', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(5);

    // AI chat statistics
    const aiChatStats = HelpfulHandyService.getChatStats();

    // Connected users
    const connectedUsersCount = SocketService.getConnectedUserCount();

    // Monthly revenue calculation (simplified)
    const monthlyRevenue = await User.aggregate([
      {
        $match: {
          'subscription.plan': 'premium',
          'subscription.status': 'active'
        }
      },
      {
        $group: {
          _id: null,
          monthly: {
            $sum: {
              $cond: [
                { $eq: ['$subscription.interval', 'month'] },
                4.99,
                0
              ]
            }
          },
          yearly: {
            $sum: {
              $cond: [
                { $eq: ['$subscription.interval', 'year'] },
                39.99,
                0
              ]
            }
          },
          daily: {
            $sum: {
              $cond: [
                { $eq: ['$subscription.interval', 'day'] },
                1.99,
                0
              ]
            }
          }
        }
      }
    ]);

    const revenue = monthlyRevenue.length > 0 ? monthlyRevenue[0] : { monthly: 0, yearly: 0, daily: 0 };
    const estimatedMonthlyRevenue = revenue.monthly + (revenue.yearly / 12) + (revenue.daily * 30);

    const dashboardData = {
      users: {
        total: totalUsers,
        premium: premiumUsers,
        trial: trialUsers,
        newToday: newUsersToday,
        premiumPercentage: totalUsers > 0 ? Math.round((premiumUsers / totalUsers) * 100) : 0
      },
      content: {
        total: totalArticles,
        published: publishedArticles,
        draft: draftArticles,
        pendingReview: pendingReviewArticles
      },
      subscriptions: subscriptionStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {}),
      revenue: {
        estimated: Math.round(estimatedMonthlyRevenue * 100) / 100,
        breakdown: revenue
      },
      activity: {
        recentUsers,
        recentArticles
      },
      aiChat: aiChatStats,
      system: {
        connectedUsers: connectedUsersCount,
        serverUptime: process.uptime()
      }
    };

    res.status(200).json({
      success: true,
      dashboard: dashboardData
    });

  } catch (error) {
    logger.error('Admin dashboard error', {
      adminId: req.user.id,
      error: error.message
    });
    return next(new ErrorResponse('Failed to load dashboard', 500));
  }
});

// @desc    Get all users with pagination
// @route   GET /api/admin/users
// @access  Private (Admin)
exports.getUsers = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = (page - 1) * limit;

  // Build query based on filters
  const query = {};
  
  if (req.query.plan) {
    query['subscription.plan'] = req.query.plan;
  }
  
  if (req.query.status) {
    query['subscription.status'] = req.query.status;
  }
  
  if (req.query.role) {
    query.role = req.query.role;
  }
  
  if (req.query.verified !== undefined) {
    query.isEmailVerified = req.query.verified === 'true';
  }

  if (req.query.search) {
    query.$or = [
      { firstName: { $regex: req.query.search, $options: 'i' } },
      { lastName: { $regex: req.query.search, $options: 'i' } },
      { email: { $regex: req.query.search, $options: 'i' } }
    ];
  }

  try {
    const users = await User.find(query)
      .select('-password -emailVerificationToken -phoneVerificationCode -passwordResetToken')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      users,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    logger.error('Get users error', {
      adminId: req.user.id,
      error: error.message
    });
    return next(new ErrorResponse('Failed to retrieve users', 500));
  }
});

// @desc    Get single user details
// @route   GET /api/admin/users/:id
// @access  Private (Admin)
exports.getUser = asyncHandler(async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -emailVerificationToken -phoneVerificationCode -passwordResetToken');

    if (!user) {
      return next(new ErrorResponse('User not found', 404));
    }

    // Get user's recent activity
    const recentArticlesViewed = await Troubleshooting.find({
      views: { $gt: 0 }
    })
    .select('title views createdAt')
    .sort({ updatedAt: -1 })
    .limit(5);

    res.status(200).json({
      success: true,
      user,
      activity: {
        recentArticlesViewed
      }
    });

  } catch (error) {
    logger.error('Get user error', {
      adminId: req.user.id,
      userId: req.params.id,
      error: error.message
    });
    return next(new ErrorResponse('Failed to retrieve user', 500));
  }
});

// @desc    Update user account
// @route   PUT /api/admin/users/:id
// @access  Private (Admin)
exports.updateUser = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  try {
    const allowedUpdates = [
      'firstName', 'lastName', 'email', 'phone', 'role', 
      'isActive', 'isEmailVerified', 'isPhoneVerified'
    ];

    const updateData = {};
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    // Handle subscription updates
    if (req.body.subscription) {
      Object.keys(req.body.subscription).forEach(key => {
        if (['plan', 'status', 'autoRenew'].includes(key)) {
          updateData[`subscription.${key}`] = req.body.subscription[key];
        }
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    ).select('-password');

    if (!user) {
      return next(new ErrorResponse('User not found', 404));
    }

    logger.info('User updated by admin', {
      adminId: req.user.id,
      userId: user.id,
      updates: Object.keys(updateData)
    });

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      user
    });

  } catch (error) {
    logger.error('Update user error', {
      adminId: req.user.id,
      userId: req.params.id,
      error: error.message
    });
    return next(new ErrorResponse('Failed to update user', 500));
  }
});

// @desc    Delete/deactivate user account
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin)
exports.deleteUser = asyncHandler(async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return next(new ErrorResponse('User not found', 404));
    }

    // Prevent admin from deleting their own account
    if (user.id === req.user.id) {
      return next(new ErrorResponse('Cannot delete your own account', 400));
    }

    // Soft delete - deactivate instead of hard delete
    user.isActive = false;
    user.email = `deleted_${Date.now()}_${user.email}`;
    await user.save();

    logger.info('User deactivated by admin', {
      adminId: req.user.id,
      userId: user.id,
      userEmail: user.email
    });

    res.status(200).json({
      success: true,
      message: 'User account deactivated successfully'
    });

  } catch (error) {
    logger.error('Delete user error', {
      adminId: req.user.id,
      userId: req.params.id,
      error: error.message
    });
    return next(new ErrorResponse('Failed to delete user', 500));
  }
});

// @desc    Get system analytics
// @route   GET /api/admin/analytics
// @access  Private (Admin)
exports.getAnalytics = asyncHandler(async (req, res, next) => {
  try {
    const { period = '30d' } = req.query;
    
    let dateFilter = {};
    const now = new Date();
    
    switch (period) {
      case '7d':
        dateFilter = { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) };
        break;
      case '30d':
        dateFilter = { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) };
        break;
      case '90d':
        dateFilter = { $gte: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) };
        break;
      case '1y':
        dateFilter = { $gte: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000) };
        break;
    }

    // User registration trends
    const userGrowth = await User.aggregate([
      {
        $match: { createdAt: dateFilter }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    // Article views and engagement
    const articleStats = await Troubleshooting.aggregate([
      {
        $match: { createdAt: dateFilter }
      },
      {
        $group: {
          _id: '$category',
          totalViews: { $sum: '$views' },
          totalArticles: { $sum: 1 },
          avgRating: { $avg: '$averageRating' }
        }
      },
      {
        $sort: { totalViews: -1 }
      }
    ]);

    // Subscription analytics
    const subscriptionTrends = await User.aggregate([
      {
        $match: {
          'subscription.startDate': dateFilter,
          'subscription.plan': 'premium'
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$subscription.startDate' },
            month: { $month: '$subscription.startDate' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Top performing articles
    const topArticles = await Troubleshooting.find({ createdAt: dateFilter })
      .select('title category views likes averageRating')
      .sort({ views: -1 })
      .limit(10);

    // AI chat usage
    const aiChatStats = HelpfulHandyService.getChatStats();

    res.status(200).json({
      success: true,
      analytics: {
        period,
        userGrowth,
        articleStats,
        subscriptionTrends,
        topArticles,
        aiChatStats
      }
    });

  } catch (error) {
    logger.error('Get analytics error', {
      adminId: req.user.id,
      error: error.message
    });
    return next(new ErrorResponse('Failed to retrieve analytics', 500));
  }
});

// @desc    Get system status and health
// @route   GET /api/admin/system-status
// @access  Private (Admin)
exports.getSystemStatus = asyncHandler(async (req, res, next) => {
  try {
    const status = {
      server: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        nodeVersion: process.version,
        environment: process.env.NODE_ENV
      },
      database: {
        connected: require('mongoose').connection.readyState === 1,
        collections: Object.keys(require('mongoose').connection.collections)
      },
      services: {
        email: process.env.EMAIL_USER ? 'configured' : 'not configured',
        stripe: process.env.STRIPE_SECRET_KEY ? 'configured' : 'not configured',
        paypal: process.env.PAYPAL_CLIENT_ID ? 'configured' : 'not configured',
        openai: process.env.OPENAI_API_KEY ? 'configured' : 'not configured'
      },
      realtime: {
        connectedUsers: SocketService.getConnectedUserCount(),
        activeConversations: HelpfulHandyService.getChatStats().activeConversations
      }
    };

    res.status(200).json({
      success: true,
      status
    });

  } catch (error) {
    logger.error('Get system status error', {
      adminId: req.user.id,
      error: error.message
    });
    return next(new ErrorResponse('Failed to retrieve system status', 500));
  }
});

// @desc    Send broadcast message to all users
// @route   POST /api/admin/broadcast
// @access  Private (Admin)
exports.broadcastMessage = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  try {
    const { message, type = 'info', targetAudience = 'all' } = req.body;

    // Send via Socket.io if available
    if (SocketService.io) {
      if (targetAudience === 'premium') {
        SocketService.sendNotificationToPremiumUsers({
          type: 'announcement',
          title: 'FixItFlow Announcement',
          message,
          level: type
        });
      } else {
        SocketService.broadcastUpdate('system:announcement', {
          title: 'FixItFlow Announcement',
          message,
          level: type,
          from: req.user.fullName
        });
      }
    }

    logger.info('Admin broadcast message sent', {
      adminId: req.user.id,
      adminName: req.user.fullName,
      message: message.substring(0, 100),
      type,
      targetAudience
    });

    res.status(200).json({
      success: true,
      message: 'Broadcast sent successfully'
    });

  } catch (error) {
    logger.error('Broadcast message error', {
      adminId: req.user.id,
      error: error.message
    });
    return next(new ErrorResponse('Failed to send broadcast', 500));
  }
});

module.exports = {
  getDashboard,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  getAnalytics,
  getSystemStatus,
  broadcastMessage
};
