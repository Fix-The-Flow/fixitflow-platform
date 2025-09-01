const jwt = require('jsonwebtoken');
const User = require('../models/User');
const HelpfulHandyService = require('./aiChatbotService');
const logger = require('../config/logger');

class SocketService {
  static initialize(io) {
    this.io = io;
    this.connectedUsers = new Map();
    this.chatRooms = new Map();

    // Socket authentication middleware
    io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.token;
        
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);

        if (!user || !user.isActive) {
          return next(new Error('User not found or inactive'));
        }

        socket.userId = user._id.toString();
        socket.user = user;
        next();
      } catch (error) {
        logger.error('Socket authentication failed', {
          error: error.message,
          socketId: socket.id
        });
        next(new Error('Authentication failed'));
      }
    });

    // Connection handling
    io.on('connection', (socket) => {
      this.handleConnection(socket);
    });

    logger.info('Socket.io service initialized');
  }

  static handleConnection(socket) {
    const userId = socket.userId;
    const user = socket.user;

    // Store connected user
    this.connectedUsers.set(userId, {
      socketId: socket.id,
      user: user,
      connectedAt: new Date()
    });

    logger.info('User connected via socket', {
      userId,
      socketId: socket.id,
      userName: user.fullName
    });

    // Send welcome message
    socket.emit('connected', {
      message: 'Connected to FixItFlow',
      userId,
      features: {
        aiChat: true,
        notifications: true,
        realTimeUpdates: true
      }
    });

    // AI Chat Events
    this.setupAiChatEvents(socket);

    // Notification Events
    this.setupNotificationEvents(socket);

    // Premium Feature Events
    if (user.hasPremiumAccess()) {
      this.setupPremiumEvents(socket);
    }

    // Admin Events
    if (user.role === 'admin' || user.role === 'moderator') {
      this.setupAdminEvents(socket);
    }

    // Handle disconnection
    socket.on('disconnect', () => {
      this.handleDisconnection(socket);
    });
  }

  static setupAiChatEvents(socket) {
    const userId = socket.userId;
    const user = socket.user;

    // AI Chat
    socket.on('ai:chat', async (data) => {
      try {
        const { message, context = 'general' } = data;

        if (!message || message.trim().length === 0) {
          socket.emit('ai:error', { message: 'Message cannot be empty' });
          return;
        }

        // Show typing indicator
        socket.emit('ai:typing', true);

        const response = await HelpfulHandyService.chat(userId, message, context);

        // Hide typing indicator
        socket.emit('ai:typing', false);

        if (response.success) {
          socket.emit('ai:response', {
            message: response.message,
            context: response.context,
            conversationLength: response.conversationLength,
            timestamp: new Date()
          });

          // Suggest articles if relevant
          if (context !== 'account_help') {
            const suggestedArticles = await HelpfulHandyService.suggestArticles(message, 3);
            if (suggestedArticles.length > 0) {
              socket.emit('ai:suggestions', {
                articles: suggestedArticles,
                query: message
              });
            }
          }
        } else {
          socket.emit('ai:error', {
            message: response.message,
            suggestUpgrade: response.suggestUpgrade
          });
        }

        logger.info('AI chat via socket', {
          userId,
          messageLength: message.length,
          context,
          success: response.success
        });

      } catch (error) {
        socket.emit('ai:typing', false);
        socket.emit('ai:error', {
          message: 'Sorry, I\'m having trouble right now. Please try again.'
        });

        logger.error('Socket AI chat error', {
          userId,
          error: error.message
        });
      }
    });

    // Premium AI troubleshooting
    socket.on('ai:troubleshoot', async (data) => {
      if (!user.hasPremiumAccess()) {
        socket.emit('ai:error', {
          message: 'Premium subscription required for detailed AI troubleshooting',
          suggestUpgrade: true
        });
        return;
      }

      try {
        const { message } = data;
        
        socket.emit('ai:typing', true);
        const response = await HelpfulHandyService.chat(userId, message, 'premium');
        socket.emit('ai:typing', false);

        if (response.success) {
          socket.emit('ai:troubleshoot_response', {
            message: response.message,
            conversationLength: response.conversationLength,
            timestamp: new Date()
          });
        } else {
          socket.emit('ai:error', { message: response.message });
        }

      } catch (error) {
        socket.emit('ai:typing', false);
        socket.emit('ai:error', {
          message: 'Troubleshooting service temporarily unavailable'
        });

        logger.error('Socket AI troubleshoot error', {
          userId,
          error: error.message
        });
      }
    });

    // Clear chat history
    socket.on('ai:clear_history', () => {
      try {
        const cleared = HelpfulHandyService.clearConversation(userId);
        socket.emit('ai:history_cleared', {
          success: cleared,
          message: cleared ? 'Chat history cleared' : 'No history found'
        });

        logger.info('Chat history cleared via socket', { userId });
      } catch (error) {
        socket.emit('ai:error', {
          message: 'Failed to clear chat history'
        });

        logger.error('Socket clear history error', {
          userId,
          error: error.message
        });
      }
    });
  }

  static setupNotificationEvents(socket) {
    const userId = socket.userId;

    // Join user's notification room
    socket.join(`notifications:${userId}`);

    // Handle notification preferences
    socket.on('notifications:update_preferences', async (preferences) => {
      try {
        const user = await User.findById(userId);
        user.preferences.notifications = {
          ...user.preferences.notifications,
          ...preferences
        };
        await user.save();

        socket.emit('notifications:preferences_updated', {
          success: true,
          preferences: user.preferences.notifications
        });

        logger.info('Notification preferences updated via socket', {
          userId,
          preferences
        });

      } catch (error) {
        socket.emit('notifications:error', {
          message: 'Failed to update notification preferences'
        });

        logger.error('Socket notification preferences error', {
          userId,
          error: error.message
        });
      }
    });
  }

  static setupPremiumEvents(socket) {
    const userId = socket.userId;

    // Image analysis for troubleshooting
    socket.on('ai:analyze_image', async (data) => {
      try {
        const { imageUrl, description } = data;

        socket.emit('ai:analyzing', true);
        const response = await HelpfulHandyService.analyzeImage(userId, imageUrl, description);
        socket.emit('ai:analyzing', false);

        if (response.success) {
          socket.emit('ai:image_analysis', {
            analysis: response.message,
            timestamp: new Date()
          });
        } else {
          socket.emit('ai:error', {
            message: response.message,
            suggestUpgrade: response.suggestUpgrade
          });
        }

      } catch (error) {
        socket.emit('ai:analyzing', false);
        socket.emit('ai:error', {
          message: 'Image analysis service temporarily unavailable'
        });

        logger.error('Socket image analysis error', {
          userId,
          error: error.message
        });
      }
    });

    // Premium user room for exclusive features
    socket.join('premium_users');
  }

  static setupAdminEvents(socket) {
    const userId = socket.userId;
    const user = socket.user;

    // Admin room for notifications
    socket.join('admin_users');

    // Get AI chat statistics
    socket.on('admin:get_chat_stats', () => {
      try {
        const stats = HelpfulHandyService.getChatStats();
        socket.emit('admin:chat_stats', {
          stats,
          timestamp: new Date()
        });

        logger.info('Admin chat stats requested via socket', { userId });
      } catch (error) {
        socket.emit('admin:error', {
          message: 'Failed to retrieve chat statistics'
        });

        logger.error('Socket admin chat stats error', {
          userId,
          error: error.message
        });
      }
    });

    // Broadcast message to all users (admin only)
    if (user.role === 'admin') {
      socket.on('admin:broadcast', (data) => {
        const { message, type = 'info' } = data;
        
        this.io.emit('system:announcement', {
          message,
          type,
          timestamp: new Date(),
          from: 'FixItFlow Admin'
        });

        logger.info('Admin broadcast message sent', {
          adminId: userId,
          message: message.substring(0, 100),
          type
        });
      });
    }
  }

  static handleDisconnection(socket) {
    const userId = socket.userId;
    
    // Remove from connected users
    this.connectedUsers.delete(userId);

    logger.info('User disconnected from socket', {
      userId,
      socketId: socket.id
    });
  }

  // Utility methods for sending notifications
  static sendNotificationToUser(userId, notification) {
    this.io.to(`notifications:${userId}`).emit('notification', {
      ...notification,
      timestamp: new Date()
    });

    logger.info('Notification sent to user', {
      userId,
      type: notification.type
    });
  }

  static sendNotificationToPremiumUsers(notification) {
    this.io.to('premium_users').emit('notification', {
      ...notification,
      timestamp: new Date()
    });

    logger.info('Notification sent to premium users', {
      type: notification.type
    });
  }

  static sendNotificationToAdmins(notification) {
    this.io.to('admin_users').emit('admin:notification', {
      ...notification,
      timestamp: new Date()
    });

    logger.info('Notification sent to admins', {
      type: notification.type
    });
  }

  // Get connected user count
  static getConnectedUserCount() {
    return this.connectedUsers.size;
  }

  // Get connected users (admin only)
  static getConnectedUsers() {
    const users = [];
    for (const [userId, userInfo] of this.connectedUsers.entries()) {
      users.push({
        userId,
        name: userInfo.user.fullName,
        connectedAt: userInfo.connectedAt,
        isPremium: userInfo.user.hasPremiumAccess()
      });
    }
    return users;
  }

  // Check if user is online
  static isUserOnline(userId) {
    return this.connectedUsers.has(userId.toString());
  }

  // Send real-time updates
  static broadcastUpdate(event, data) {
    this.io.emit(event, {
      ...data,
      timestamp: new Date()
    });

    logger.info('Broadcast update sent', {
      event,
      dataKeys: Object.keys(data)
    });
  }
}

module.exports = SocketService;
