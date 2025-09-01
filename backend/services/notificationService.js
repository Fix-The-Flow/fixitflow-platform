const nodemailer = require('nodemailer');
const SocketService = require('./socketService');
const logger = require('../config/logger');

// In-memory notification storage (replace with Redis for production)
const notificationStorage = new Map();

class NotificationService {
  constructor() {
    this.transporter = null;
    this.initializeEmailTransporter();
  }

  // Initialize email transporter
  initializeEmailTransporter() {
    try {
      this.transporter = nodemailer.createTransporter({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
      
      logger.info('Email transporter initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize email transporter:', error.message);
    }
  }

  // Store notification in memory/database
  async storeNotification(userId, notification) {
    const userNotifications = notificationStorage.get(userId) || [];
    
    const notificationData = {
      id: this.generateNotificationId(),
      ...notification,
      timestamp: new Date(),
      read: false,
      delivered: false
    };

    userNotifications.push(notificationData);
    notificationStorage.set(userId, userNotifications);

    // Keep only last 50 notifications per user
    if (userNotifications.length > 50) {
      userNotifications.splice(0, userNotifications.length - 50);
    }

    return notificationData;
  }

  // Generate unique notification ID
  generateNotificationId() {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Send real-time notification via Socket.IO
  async sendRealtimeNotification(userId, notification) {
    try {
      if (SocketService.io) {
        const storedNotification = await this.storeNotification(userId, notification);
        
        SocketService.sendToUser(userId, 'notification', {
          id: storedNotification.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          data: notification.data,
          timestamp: storedNotification.timestamp,
          priority: notification.priority || 'normal'
        });

        storedNotification.delivered = true;
        logger.info('Real-time notification sent', { userId, type: notification.type });
        return true;
      }
    } catch (error) {
      logger.error('Failed to send real-time notification', { userId, error: error.message });
      return false;
    }
  }

  // Send email notification
  async sendEmailNotification(userEmail, emailData) {
    if (!this.transporter) {
      logger.warn('Email transporter not available');
      return false;
    }

    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: userEmail,
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text
      };

      await this.transporter.sendMail(mailOptions);
      logger.info('Email notification sent', { to: userEmail, subject: emailData.subject });
      return true;
    } catch (error) {
      logger.error('Failed to send email notification', { 
        to: userEmail, 
        error: error.message 
      });
      return false;
    }
  }

  // Send comprehensive notification (real-time + email if needed)
  async sendNotification(userId, userEmail, notification, options = {}) {
    const results = {
      realtime: false,
      email: false
    };

    // Send real-time notification
    if (options.realtime !== false) {
      results.realtime = await this.sendRealtimeNotification(userId, notification);
    }

    // Send email notification if configured
    if (options.email && notification.emailTemplate) {
      results.email = await this.sendEmailNotification(userEmail, notification.emailTemplate);
    }

    return results;
  }

  // Get user notifications
  getUserNotifications(userId, options = {}) {
    const { limit = 20, offset = 0, unreadOnly = false } = options;
    const userNotifications = notificationStorage.get(userId) || [];
    
    let notifications = [...userNotifications];
    
    if (unreadOnly) {
      notifications = notifications.filter(notif => !notif.read);
    }

    // Sort by timestamp (newest first)
    notifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Apply pagination
    const paginatedNotifications = notifications.slice(offset, offset + limit);

    return {
      notifications: paginatedNotifications,
      total: notifications.length,
      unreadCount: userNotifications.filter(n => !n.read).length
    };
  }

  // Mark notification as read
  markAsRead(userId, notificationId) {
    const userNotifications = notificationStorage.get(userId) || [];
    const notification = userNotifications.find(n => n.id === notificationId);
    
    if (notification) {
      notification.read = true;
      return true;
    }
    return false;
  }

  // Mark all notifications as read
  markAllAsRead(userId) {
    const userNotifications = notificationStorage.get(userId) || [];
    userNotifications.forEach(notification => {
      notification.read = true;
    });
    return userNotifications.length;
  }

  // Delete notification
  deleteNotification(userId, notificationId) {
    const userNotifications = notificationStorage.get(userId) || [];
    const index = userNotifications.findIndex(n => n.id === notificationId);
    
    if (index !== -1) {
      userNotifications.splice(index, 1);
      return true;
    }
    return false;
  }

  // Clear all notifications for user
  clearAllNotifications(userId) {
    const count = (notificationStorage.get(userId) || []).length;
    notificationStorage.delete(userId);
    return count;
  }

  // Notification templates for different types
  getNotificationTemplates() {
    return {
      // User account related
      welcome: {
        type: 'account',
        title: 'Welcome to FixItFlow!',
        message: 'Your account has been created successfully. Start exploring troubleshooting guides!',
        priority: 'high'
      },
      
      emailVerified: {
        type: 'account',
        title: 'Email Verified',
        message: 'Your email address has been successfully verified.',
        priority: 'normal'
      },

      passwordChanged: {
        type: 'security',
        title: 'Password Changed',
        message: 'Your account password has been successfully updated.',
        priority: 'high'
      },

      // Subscription related
      subscriptionStarted: {
        type: 'subscription',
        title: 'Premium Subscription Activated',
        message: 'Welcome to Premium! You now have access to all features.',
        priority: 'high'
      },

      subscriptionExpiring: {
        type: 'subscription',
        title: 'Subscription Expiring Soon',
        message: 'Your premium subscription will expire in 3 days. Renew to continue enjoying premium features.',
        priority: 'high'
      },

      subscriptionExpired: {
        type: 'subscription',
        title: 'Subscription Expired',
        message: 'Your premium subscription has expired. Upgrade to regain access to premium features.',
        priority: 'high'
      },

      paymentFailed: {
        type: 'billing',
        title: 'Payment Failed',
        message: 'We were unable to process your payment. Please update your payment method.',
        priority: 'high'
      },

      // Content related
      articleLiked: {
        type: 'engagement',
        title: 'Someone liked your comment',
        message: 'Your comment on "{articleTitle}" received a like!',
        priority: 'low'
      },

      commentReply: {
        type: 'engagement',
        title: 'New reply to your comment',
        message: 'Someone replied to your comment on "{articleTitle}"',
        priority: 'normal'
      },

      // AI Chat related
      aiChatQuotaReached: {
        type: 'ai',
        title: 'AI Chat Limit Reached',
        message: 'You\'ve reached your daily AI chat limit. Upgrade to Premium for unlimited access.',
        priority: 'normal'
      },

      // System notifications
      maintenanceScheduled: {
        type: 'system',
        title: 'Scheduled Maintenance',
        message: 'FixItFlow will be undergoing maintenance from {startTime} to {endTime}.',
        priority: 'high'
      },

      newFeature: {
        type: 'announcement',
        title: 'New Feature Available',
        message: 'Check out our latest feature: {featureName}!',
        priority: 'normal'
      }
    };
  }

  // Send predefined notification
  async sendPredefinedNotification(userId, userEmail, templateKey, data = {}, options = {}) {
    const templates = this.getNotificationTemplates();
    const template = templates[templateKey];

    if (!template) {
      throw new Error(`Notification template '${templateKey}' not found`);
    }

    // Replace placeholders in message
    let message = template.message;
    Object.keys(data).forEach(key => {
      message = message.replace(`{${key}}`, data[key]);
    });

    const notification = {
      ...template,
      message,
      data
    };

    return await this.sendNotification(userId, userEmail, notification, options);
  }

  // Bulk notification sending
  async sendBulkNotifications(recipients, notification, options = {}) {
    const results = [];
    const batchSize = options.batchSize || 10;

    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      const batchPromises = batch.map(recipient => 
        this.sendNotification(recipient.userId, recipient.email, notification, options)
      );

      const batchResults = await Promise.allSettled(batchPromises);
      results.push(...batchResults);

      // Small delay between batches to prevent overwhelming
      if (i + batchSize < recipients.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return results;
  }

  // Get notification statistics
  getNotificationStats() {
    let totalNotifications = 0;
    let totalUsers = 0;
    let unreadCount = 0;

    for (const [userId, notifications] of notificationStorage.entries()) {
      totalUsers++;
      totalNotifications += notifications.length;
      unreadCount += notifications.filter(n => !n.read).length;
    }

    return {
      totalNotifications,
      totalUsers,
      unreadCount,
      readCount: totalNotifications - unreadCount,
      averagePerUser: totalUsers > 0 ? Math.round(totalNotifications / totalUsers) : 0
    };
  }
}

// Create singleton instance
const notificationService = new NotificationService();

module.exports = notificationService;
