const User = require('../models/User');
const { ErrorResponse } = require('./errorHandler');

// Features that require premium access
const PREMIUM_FEATURES = {
  complexGuides: 'Complex troubleshooting guides',
  aiChat: 'AI chat support',
  videoChat: 'Video chat assistance',
  linkedVideos: 'Linked video tutorials'
};

// Check if user has premium access (registered users)
const checkUserPremiumAccess = (user, feature) => {
  if (!user) return false;
  
  // Check if subscription is valid and active
  if (user.subscription.plan === 'free') return false;
  
  const isActive = user.subscription.status === 'active';
  const notExpired = !user.subscription.endDate || user.subscription.endDate > new Date();
  
  if (!isActive || !notExpired) return false;
  
  // Check specific feature access
  return user.subscription.features && user.subscription.features[feature];
};

// Check if anonymous user has premium access via token
const checkAnonymousPremiumAccess = (subscriptionToken, feature) => {
  if (!subscriptionToken) return false;
  
  try {
    const subscriptionData = JSON.parse(Buffer.from(subscriptionToken, 'base64').toString());
    
    // Check if subscription is expired
    const isExpired = new Date() > new Date(subscriptionData.expiresAt);
    if (isExpired) return false;
    
    // Check if feature is included
    return subscriptionData.features && subscriptionData.features.includes(feature);
  } catch (error) {
    return false;
  }
};

// Middleware to require premium access for specific features
const requirePremiumFeature = (feature) => {
  return async (req, res, next) => {
    try {
      let hasPremiumAccess = false;
      
      // Check if user is authenticated
      if (req.user) {
        const user = await User.findById(req.user.id);
        hasPremiumAccess = checkUserPremiumAccess(user, feature);
      } else {
        // Check for anonymous subscription token
        const subscriptionToken = req.headers['x-subscription-token'] || 
                                req.query.subscriptionToken ||
                                req.body.subscriptionToken;
        
        hasPremiumAccess = checkAnonymousPremiumAccess(subscriptionToken, feature);
      }
      
      if (!hasPremiumAccess) {
        return res.status(403).json({
          success: false,
          message: `Premium subscription required for ${PREMIUM_FEATURES[feature]}`,
          feature,
          upgradeRequired: true,
          availablePlans: {
            daily: { price: 2.99, duration: '24 hours' },
            monthly: { price: 7.99, duration: '30 days' },
            annual: { price: 54.99, duration: '365 days' }
          }
        });
      }
      
      next();
    } catch (error) {
      console.error('Premium feature check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error checking premium access'
      });
    }
  };
};

// Middleware to check if guide is complex (premium only)
const checkGuideComplexity = async (req, res, next) => {
  try {
    // For now, we'll mark guides as complex based on certain criteria
    // You can later add a 'complexity' field to your Guide model
    const guideId = req.params.id || req.params.guideId;
    
    // TODO: Replace with actual guide complexity check from database
    // For demo purposes, let's assume guides with certain keywords are complex
    const complexKeywords = ['advanced', 'professional', 'expert', 'complex', 'ai', 'video'];
    
    // This would be replaced with actual database query
    // const guide = await Guide.findById(guideId);
    // const isComplex = guide.complexity === 'advanced' || guide.isPremium;
    
    // For now, randomly mark some guides as complex for demo
    const isComplex = Math.random() > 0.7; // 30% of guides are complex
    
    if (isComplex) {
      return requirePremiumFeature('complexGuides')(req, res, next);
    }
    
    next();
  } catch (error) {
    console.error('Guide complexity check error:', error);
    next();
  }
};

// Middleware to add subscription info to response for anonymous users
const addSubscriptionInfo = (req, res, next) => {
  const originalJson = res.json;
  
  res.json = function(data) {
    // Add subscription info for anonymous users
    if (!req.user) {
      const subscriptionToken = req.headers['x-subscription-token'] || 
                              req.query.subscriptionToken;
      
      if (subscriptionToken) {
        try {
          const subscriptionData = JSON.parse(Buffer.from(subscriptionToken, 'base64').toString());
          const isExpired = new Date() > new Date(subscriptionData.expiresAt);
          
          data.subscription = {
            plan: subscriptionData.plan,
            isExpired,
            expiresAt: subscriptionData.expiresAt,
            features: subscriptionData.features
          };
        } catch (error) {
          // Invalid token, ignore
        }
      } else {
        data.subscription = {
          plan: 'free',
          features: []
        };
      }
    }
    
    return originalJson.call(this, data);
  };
  
  next();
};

// Check specific feature access
const hasFeatureAccess = async (req, feature) => {
  if (req.user) {
    const user = await User.findById(req.user.id);
    return checkUserPremiumAccess(user, feature);
  }
  
  const subscriptionToken = req.headers['x-subscription-token'] || 
                          req.query.subscriptionToken;
  
  return checkAnonymousPremiumAccess(subscriptionToken, feature);
};

module.exports = {
  requirePremiumFeature,
  checkGuideComplexity,
  addSubscriptionInfo,
  hasFeatureAccess,
  PREMIUM_FEATURES
};
