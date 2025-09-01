const OpenAI = require('openai');
const User = require('../models/User');
const Troubleshooting = require('../models/Troubleshooting');
const logger = require('../config/logger');

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Chat contexts and prompts
const SYSTEM_PROMPTS = {
  general: `You are "Helpful Handy", the friendly AI assistant for FixItFlow, a troubleshooting app. Your role is to help users with:

1. Account-related questions (signup, login, subscriptions, settings)
2. App navigation and features
3. General troubleshooting guidance
4. Directing users to relevant articles or premium features

Key information about FixItFlow:
- Free users get basic troubleshooting guides and community support
- Premium users ($4.99/month, $39.99/year, $1.99/day) get:
  * AI-powered troubleshooting chat
  * Image upload for visual help
  * Video chat support  
  * Premium troubleshooting guides
  * Priority support

Categories we cover: Technology, Automotive, Home Maintenance, Appliances, Electronics, Plumbing, Electrical, Heating/Cooling, Gardening, Pets, Health & Wellness, Computer Software, Mobile Devices, Internet/Networking.

Be helpful, friendly, and concise. If a user needs detailed technical help beyond basic guidance, suggest they explore our troubleshooting articles or upgrade to premium for personalized AI assistance.`,

  premium: `You are "Helpful Handy", the advanced AI troubleshooting assistant for FixItFlow Premium users. You provide detailed, step-by-step technical assistance for any problem users bring to you.

Your capabilities include:
- Analyzing problems and providing systematic troubleshooting approaches
- Asking clarifying questions to narrow down issues  
- Providing step-by-step solutions with safety warnings when needed
- Recommending when to seek professional help
- Suggesting preventive measures

Categories of expertise: Technology, Automotive, Home Maintenance, Appliances, Electronics, Plumbing, Electrical, Heating/Cooling, Gardening, Pets, Health & Wellness, Computer Software, Mobile Devices, Internet/Networking.

Always prioritize user safety and suggest professional help for dangerous tasks (electrical work, gas systems, etc.). Be thorough but clear in your explanations.`,

  account_help: `You are "Helpful Handy", the account support specialist for FixItFlow. Help users with:

- Account creation and login issues
- Email/phone verification problems
- Password reset assistance
- Subscription management (upgrading, canceling, billing)
- Profile settings and preferences
- Privacy and data questions

Be patient and provide clear, step-by-step guidance. For complex billing issues, direct users to contact human support.`,

  onboarding: `You are "Helpful Handy", the onboarding guide for new FixItFlow users. Your goal is to help them get started and understand the app's features:

- Welcome new users warmly
- Explain the difference between free and premium features
- Guide them through setting up their profile
- Show them how to search and browse troubleshooting articles
- Encourage email verification for security
- Suggest relevant categories based on their interests

Keep explanations simple and encourage exploration of the app.`
};

// Conversation memory (in production, this would be stored in Redis or database)
const conversationMemory = new Map();

class HelpfulHandyService {
  // Initialize conversation for a user
  static initializeConversation(userId, context = 'general') {
    const systemPrompt = SYSTEM_PROMPTS[context] || SYSTEM_PROMPTS.general;
    
    conversationMemory.set(userId, {
      context,
      messages: [
        { role: 'system', content: systemPrompt }
      ],
      createdAt: new Date(),
      lastActivity: new Date()
    });

    logger.info('AI conversation initialized', {
      userId,
      context
    });
  }

  // Get or create conversation for user
  static getConversation(userId, context = 'general') {
    if (!conversationMemory.has(userId)) {
      this.initializeConversation(userId, context);
    }
    
    return conversationMemory.get(userId);
  }

  // Clean up old conversations (call this periodically)
  static cleanupOldConversations(maxAgeHours = 24) {
    const cutoff = new Date(Date.now() - (maxAgeHours * 60 * 60 * 1000));
    let cleaned = 0;
    
    for (const [userId, conversation] of conversationMemory.entries()) {
      if (conversation.lastActivity < cutoff) {
        conversationMemory.delete(userId);
        cleaned++;
      }
    }
    
    logger.info('Cleaned up old conversations', { count: cleaned });
    return cleaned;
  }

  // Main chat function
  static async chat(userId, message, context = 'general') {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Check if premium features are requested but user doesn't have access
      if (context === 'premium' && !user.hasPremiumAccess()) {
        return {
          success: false,
          message: "I'd love to help you with detailed troubleshooting! This feature is available with FixItFlow Premium. Would you like to learn about our premium plans?",
          suggestUpgrade: true
        };
      }

      // Get conversation
      const conversation = this.getConversation(userId, context);
      
      // Add user message
      conversation.messages.push({
        role: 'user',
        content: message
      });

      // Update last activity
      conversation.lastActivity = new Date();

      // Get user context for personalization
      const userContext = await this.getUserContext(user);
      
      // Add user context to system message if it's a new conversation
      if (conversation.messages.length === 2) {
        conversation.messages[0].content += `\n\nUser context: ${userContext}`;
      }

      // Call OpenAI API
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: conversation.messages,
        max_tokens: 500,
        temperature: 0.7
      });

      const aiResponse = completion.choices[0].message.content;

      // Add AI response to conversation
      conversation.messages.push({
        role: 'assistant',
        content: aiResponse
      });

      // Keep conversation manageable (last 20 messages)
      if (conversation.messages.length > 21) { // 1 system + 20 conversation
        const systemMessage = conversation.messages[0];
        conversation.messages = [
          systemMessage,
          ...conversation.messages.slice(-19)
        ];
      }

      // Update user analytics
      user.analytics.aiChatCount += 1;
      await user.save();

      logger.info('AI chat interaction', {
        userId,
        context,
        messageLength: message.length,
        responseLength: aiResponse.length
      });

      return {
        success: true,
        message: aiResponse,
        context,
        conversationLength: conversation.messages.length - 1 // Exclude system message
      };

    } catch (error) {
      logger.error('AI chat error', {
        userId,
        context,
        error: error.message
      });

      return {
        success: false,
        message: "I'm having trouble right now. Please try again in a moment, or browse our troubleshooting articles for immediate help!",
        error: error.message
      };
    }
  }

  // Get user context for personalization
  static async getUserContext(user) {
    const contexts = [];
    
    // Subscription info
    if (user.subscription.plan === 'premium') {
      contexts.push('Premium subscriber');
    } else {
      contexts.push('Free user');
    }

    // Favorite categories
    if (user.analytics.favoriteCategories.length > 0) {
      contexts.push(`Interested in: ${user.analytics.favoriteCategories.join(', ')}`);
    }

    // Account status
    if (!user.isEmailVerified) {
      contexts.push('Email not verified');
    }

    // Usage stats
    if (user.analytics.troubleshootingQueriesCount > 0) {
      contexts.push(`Has viewed ${user.analytics.troubleshootingQueriesCount} articles`);
    }

    return contexts.join('. ');
  }

  // Generate response for specific scenarios
  static async handleAccountQuestion(userId, question) {
    const user = await User.findById(userId);
    
    // Handle common account questions with template responses
    const lowerQuestion = question.toLowerCase();
    
    if (lowerQuestion.includes('verify') && lowerQuestion.includes('email')) {
      if (user.isEmailVerified) {
        return "Great news! Your email is already verified. You're all set to use all FixItFlow features.";
      } else {
        return "I can help you verify your email! Check your inbox for a verification email from FixItFlow. If you don't see it, check your spam folder or I can help you resend it. Would you like me to resend the verification email?";
      }
    }
    
    if (lowerQuestion.includes('subscription') || lowerQuestion.includes('premium')) {
      if (user.subscription.plan === 'premium') {
        const daysRemaining = user.subscription.endDate ? 
          Math.max(0, Math.ceil((user.subscription.endDate - new Date()) / (1000 * 60 * 60 * 24))) : 
          'unlimited';
        return `You have an active Premium subscription! ${daysRemaining !== 'unlimited' ? `Days remaining: ${daysRemaining}` : ''}. You have access to AI troubleshooting, image uploads, video chat, and premium guides.`;
      } else {
        return "You're currently on our free plan with access to basic troubleshooting guides. Premium ($4.99/month) includes AI chat, image uploads, video support, and exclusive content. Would you like to learn more about upgrading?";
      }
    }
    
    if (lowerQuestion.includes('password') && lowerQuestion.includes('reset')) {
      return "I can help you reset your password! Go to the login page and click 'Forgot Password'. Enter your email address and you'll receive reset instructions. Make sure to check your spam folder too!";
    }
    
    // For other questions, use the general AI chat
    return await this.chat(userId, question, 'account_help');
  }

  // Suggest relevant articles based on user query
  static async suggestArticles(query, limit = 3) {
    try {
      const articles = await Troubleshooting.find({
        $text: { $search: query },
        status: 'published',
        isActive: true
      })
      .select('title category difficulty slug averageRating views')
      .sort({ score: { $meta: 'textScore' } })
      .limit(limit);

      return articles;
    } catch (error) {
      logger.error('Error suggesting articles', { query, error: error.message });
      return [];
    }
  }

  // Handle image-based troubleshooting (premium feature)
  static async analyzeImage(userId, imageUrl, description = '') {
    try {
      const user = await User.findById(userId);
      if (!user.hasPremiumAccess()) {
        return {
          success: false,
          message: "Image analysis is a premium feature. Upgrade to get visual troubleshooting assistance!",
          suggestUpgrade: true
        };
      }

      // For now, return a placeholder response
      // In a real implementation, you would use OpenAI's vision API
      return {
        success: true,
        message: "I can see your image! Based on what I observe and your description, here are some troubleshooting steps... (Image analysis feature would be implemented here with OpenAI Vision API)",
        requiresPremium: false
      };

    } catch (error) {
      logger.error('Image analysis error', {
        userId,
        error: error.message
      });

      return {
        success: false,
        message: "I'm having trouble analyzing the image right now. Please try describing the problem in text, and I'll do my best to help!"
      };
    }
  }

  // Get chat history for a user
  static getChatHistory(userId, limit = 50) {
    const conversation = conversationMemory.get(userId);
    if (!conversation) {
      return [];
    }

    // Return messages excluding system prompt, limited to requested amount
    return conversation.messages
      .slice(1) // Remove system message
      .slice(-limit) // Get last N messages
      .map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp || conversation.lastActivity
      }));
  }

  // Clear conversation history
  static clearConversation(userId) {
    if (conversationMemory.has(userId)) {
      conversationMemory.delete(userId);
      logger.info('Conversation cleared', { userId });
      return true;
    }
    return false;
  }

  // Get chat statistics
  static getChatStats() {
    const stats = {
      activeConversations: conversationMemory.size,
      contexts: {},
      totalMessages: 0
    };

    for (const conversation of conversationMemory.values()) {
      stats.contexts[conversation.context] = (stats.contexts[conversation.context] || 0) + 1;
      stats.totalMessages += conversation.messages.length - 1; // Exclude system message
    }

    return stats;
  }
}

module.exports = HelpfulHandyService;
