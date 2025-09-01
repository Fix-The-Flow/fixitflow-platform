const logger = require('../config/logger');
const NotificationService = require('./notificationService');
const HelpfulHandyService = require('./aiChatbotService');
const SocketService = require('./socketService');

class PremiumService {
  constructor() {
    this.premiumFeatures = {
      aiChatUnlimited: true,
      imageUpload: true,
      videoChat: true,
      prioritySupport: true,
      advancedFilters: true,
      exportData: true,
      customization: true,
      analytics: true
    };
    
    this.freeUserLimits = {
      aiChatDaily: 5,
      imageUploads: 2,
      videoChatMinutes: 0,
      supportTickets: 2,
      exports: 0
    };
  }

  // Check if user has premium access
  isPremiumUser(user) {
    return user.subscription && 
           user.subscription.plan === 'premium' && 
           user.subscription.status === 'active' &&
           new Date(user.subscription.endDate) > new Date();
  }

  // Check if user is in trial period
  isTrialUser(user) {
    return user.subscription && 
           user.subscription.status === 'trial' &&
           new Date(user.subscription.endDate) > new Date();
  }

  // Check feature access for user
  hasFeatureAccess(user, featureName) {
    if (this.isPremiumUser(user)) {
      return true;
    }

    if (this.isTrialUser(user)) {
      // Trial users get access to most premium features
      return ['aiChatUnlimited', 'imageUpload', 'prioritySupport', 'advancedFilters'].includes(featureName);
    }

    return false;
  }

  // Get user's current usage for a feature
  async getUserUsage(userId, feature) {
    // In production, this would query a usage tracking database
    // For now, using simple in-memory tracking
    const today = new Date().toDateString();
    const usageKey = `${userId}_${feature}_${today}`;
    
    // This is a simplified implementation
    // In production, you'd use Redis or a database
    return global.featureUsage?.[usageKey] || 0;
  }

  // Increment user's usage for a feature
  async incrementUsage(userId, feature, amount = 1) {
    const today = new Date().toDateString();
    const usageKey = `${userId}_${feature}_${today}`;
    
    if (!global.featureUsage) {
      global.featureUsage = {};
    }
    
    global.featureUsage[usageKey] = (global.featureUsage[usageKey] || 0) + amount;
    
    logger.info('Feature usage incremented', {
      userId,
      feature,
      newUsage: global.featureUsage[usageKey]
    });
    
    return global.featureUsage[usageKey];
  }

  // Check if user can use a limited feature
  async canUseFeature(user, featureName) {
    if (this.isPremiumUser(user)) {
      return { canUse: true, reason: 'premium' };
    }

    if (this.isTrialUser(user)) {
      if (['aiChatUnlimited', 'imageUpload', 'prioritySupport', 'advancedFilters'].includes(featureName)) {
        return { canUse: true, reason: 'trial' };
      }
    }

    // Check free user limits
    const limits = this.freeUserLimits;
    const currentUsage = await this.getUserUsage(user.id, featureName);

    switch (featureName) {
      case 'aiChatDaily':
        if (currentUsage >= limits.aiChatDaily) {
          return { 
            canUse: false, 
            reason: 'limit_reached', 
            limit: limits.aiChatDaily,
            current: currentUsage
          };
        }
        break;

      case 'imageUploads':
        if (currentUsage >= limits.imageUploads) {
          return { 
            canUse: false, 
            reason: 'limit_reached', 
            limit: limits.imageUploads,
            current: currentUsage
          };
        }
        break;

      case 'supportTickets':
        if (currentUsage >= limits.supportTickets) {
          return { 
            canUse: false, 
            reason: 'limit_reached', 
            limit: limits.supportTickets,
            current: currentUsage
          };
        }
        break;

      default:
        return { canUse: false, reason: 'premium_required' };
    }

    return { canUse: true, reason: 'within_limits' };
  }

  // AI Chat premium features
  async handlePremiumAIChat(user, conversationId, message) {
    const canUse = await this.canUseFeature(user, 'aiChatDaily');
    
    if (!canUse.canUse) {
      if (canUse.reason === 'limit_reached') {
        // Notify user about limit
        await NotificationService.sendPredefinedNotification(
          user.id,
          user.email,
          'aiChatQuotaReached',
          { limit: canUse.limit },
          { realtime: true }
        );
      }
      return {
        success: false,
        error: 'AI_CHAT_LIMIT_REACHED',
        message: 'You have reached your daily AI chat limit. Upgrade to Premium for unlimited access.',
        upgradeRequired: true
      };
    }

    try {
      // Process AI chat with enhanced features for premium users
      const aiResponse = await HelpfulHandyService.sendMessage(conversationId, message, {
        userId: user.id,
        premium: this.isPremiumUser(user),
        enhancedFeatures: {
          imageAnalysis: this.isPremiumUser(user),
          detailedExplanations: this.isPremiumUser(user),
          followUpSuggestions: this.isPremiumUser(user)
        }
      });

      // Increment usage for free/trial users
      if (!this.isPremiumUser(user)) {
        await this.incrementUsage(user.id, 'aiChatDaily');
      }

      return {
        success: true,
        response: aiResponse,
        remainingUsage: this.isPremiumUser(user) ? 'unlimited' : 
                       (this.freeUserLimits.aiChatDaily - await this.getUserUsage(user.id, 'aiChatDaily'))
      };

    } catch (error) {
      logger.error('Premium AI chat error', {
        userId: user.id,
        error: error.message
      });
      return {
        success: false,
        error: 'AI_CHAT_ERROR',
        message: 'Sorry, there was an error processing your request.'
      };
    }
  }

  // Image upload with AI analysis (Premium feature)
  async handlePremiumImageUpload(user, imageData, description) {
    if (!this.hasFeatureAccess(user, 'imageUpload')) {
      const canUse = await this.canUseFeature(user, 'imageUploads');
      
      if (!canUse.canUse) {
        return {
          success: false,
          error: 'IMAGE_UPLOAD_LIMIT',
          message: 'Upgrade to Premium to upload more images with AI analysis.',
          upgradeRequired: true
        };
      }
    }

    try {
      // Simulate AI image analysis (replace with actual AI service)
      const analysis = await this.analyzeImage(imageData, description);
      
      // Increment usage for non-premium users
      if (!this.isPremiumUser(user)) {
        await this.incrementUsage(user.id, 'imageUploads');
      }

      return {
        success: true,
        analysis,
        remainingUploads: this.isPremiumUser(user) ? 'unlimited' : 
                         (this.freeUserLimits.imageUploads - await this.getUserUsage(user.id, 'imageUploads'))
      };

    } catch (error) {
      logger.error('Premium image upload error', {
        userId: user.id,
        error: error.message
      });
      return {
        success: false,
        error: 'IMAGE_ANALYSIS_ERROR',
        message: 'Sorry, there was an error analyzing your image.'
      };
    }
  }

  // Simulate AI image analysis
  async analyzeImage(imageData, description) {
    // This would integrate with an actual AI vision service
    return {
      detectedObjects: ['tool', 'wire', 'component'],
      suggestedActions: [
        'Check wire connections',
        'Test component functionality',
        'Inspect for visible damage'
      ],
      confidence: 0.85,
      relevantGuides: [
        {
          title: 'Electrical Troubleshooting Guide',
          id: 'guide_123',
          relevance: 0.92
        }
      ]
    };
  }

  // Video chat integration (Premium feature)
  async initiatePremiumVideoChat(user, supportType = 'general') {
    if (!this.hasFeatureAccess(user, 'videoChat')) {
      return {
        success: false,
        error: 'VIDEO_CHAT_PREMIUM',
        message: 'Video chat support is available for Premium members only.',
        upgradeRequired: true
      };
    }

    try {
      // Generate video chat session
      const sessionId = this.generateSessionId();
      const videoRoomId = `support_${user.id}_${Date.now()}`;

      // Notify support team
      await this.notifySupportTeam(user, supportType, videoRoomId);

      return {
        success: true,
        sessionId,
        videoRoomId,
        supportType,
        estimatedWaitTime: this.isPremiumUser(user) ? '2-5 minutes' : '10-15 minutes'
      };

    } catch (error) {
      logger.error('Video chat initiation error', {
        userId: user.id,
        error: error.message
      });
      return {
        success: false,
        error: 'VIDEO_CHAT_ERROR',
        message: 'Sorry, there was an error setting up video chat.'
      };
    }
  }

  // Priority support ticketing
  async createPriorityTicket(user, ticketData) {
    const canUse = await this.canUseFeature(user, 'supportTickets');
    
    if (!canUse.canUse && !this.hasFeatureAccess(user, 'prioritySupport')) {
      return {
        success: false,
        error: 'SUPPORT_LIMIT_REACHED',
        message: 'You have reached your support ticket limit. Upgrade for priority support.',
        upgradeRequired: true
      };
    }

    try {
      const ticket = {
        id: this.generateTicketId(),
        userId: user.id,
        subject: ticketData.subject,
        description: ticketData.description,
        priority: this.isPremiumUser(user) ? 'high' : 'normal',
        status: 'open',
        createdAt: new Date(),
        estimatedResponse: this.isPremiumUser(user) ? '1-2 hours' : '24-48 hours'
      };

      // Store ticket (implement database storage)
      logger.info('Support ticket created', {
        ticketId: ticket.id,
        userId: user.id,
        priority: ticket.priority
      });

      // Increment usage for non-premium users
      if (!this.isPremiumUser(user)) {
        await this.incrementUsage(user.id, 'supportTickets');
      }

      return {
        success: true,
        ticket
      };

    } catch (error) {
      logger.error('Support ticket creation error', {
        userId: user.id,
        error: error.message
      });
      return {
        success: false,
        error: 'TICKET_CREATION_ERROR',
        message: 'Sorry, there was an error creating your support ticket.'
      };
    }
  }

  // Data export feature (Premium only)
  async exportUserData(user, exportType = 'complete') {
    if (!this.hasFeatureAccess(user, 'exportData')) {
      return {
        success: false,
        error: 'EXPORT_PREMIUM_REQUIRED',
        message: 'Data export is available for Premium members only.',
        upgradeRequired: true
      };
    }

    try {
      const exportData = await this.generateExportData(user.id, exportType);
      
      return {
        success: true,
        exportData,
        downloadUrl: `/api/user/export/${exportData.id}`,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      };

    } catch (error) {
      logger.error('Data export error', {
        userId: user.id,
        error: error.message
      });
      return {
        success: false,
        error: 'EXPORT_ERROR',
        message: 'Sorry, there was an error exporting your data.'
      };
    }
  }

  // Helper methods
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateTicketId() {
    return `ticket_${Date.now()}_${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  }

  async notifySupportTeam(user, supportType, videoRoomId) {
    // Notify available support agents
    SocketService.broadcastToRole('support', 'video_chat_request', {
      userId: user.id,
      userName: user.fullName,
      supportType,
      videoRoomId,
      priority: this.isPremiumUser(user) ? 'high' : 'normal'
    });
  }

  async generateExportData(userId, exportType) {
    // Generate comprehensive user data export
    return {
      id: `export_${Date.now()}`,
      userId,
      type: exportType,
      generatedAt: new Date(),
      includes: [
        'profile_data',
        'troubleshooting_history',
        'ai_chat_history',
        'preferences',
        'subscription_info'
      ]
    };
  }

  // Get premium feature statistics
  getPremiumStats() {
    // Calculate usage statistics for admin dashboard
    return {
      activeFeatures: Object.keys(this.premiumFeatures),
      freeUserLimits: this.freeUserLimits,
      // Add more statistics as needed
    };
  }

  // Check subscription status and notify about expiring subscriptions
  async checkSubscriptionStatus(user) {
    if (!user.subscription) return;

    const endDate = new Date(user.subscription.endDate);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry === 3 && user.subscription.status === 'active') {
      // Send expiring notification
      await NotificationService.sendPredefinedNotification(
        user.id,
        user.email,
        'subscriptionExpiring',
        { daysUntilExpiry },
        { realtime: true, email: true }
      );
    } else if (daysUntilExpiry <= 0 && user.subscription.status === 'active') {
      // Send expired notification
      await NotificationService.sendPredefinedNotification(
        user.id,
        user.email,
        'subscriptionExpired',
        {},
        { realtime: true, email: true }
      );
    }
  }
}

// Create singleton instance
const premiumService = new PremiumService();

module.exports = premiumService;
