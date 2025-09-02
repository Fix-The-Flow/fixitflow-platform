import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { Crown, Star, Shield, Lock, Zap } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

// Membership Context
const MembershipContext = createContext();

export const useMembership = () => {
  const context = useContext(MembershipContext);
  if (!context) {
    throw new Error('useMembership must be used within a MembershipProvider');
  }
  return context;
};

// Membership Provider
export const MembershipProvider = ({ children }) => {
  const [userMembership, setUserMembership] = useState(null);

  // Fetch user membership status
  const { data: membershipData, refetch } = useQuery(
    'user-membership',
    async () => {
      const response = await axios.get('/api/user/membership');
      return response.data.membership;
    },
    {
      onSuccess: (data) => {
        setUserMembership(data);
      }
    }
  );

  const hasAccess = (requiredTier) => {
    if (!userMembership) return false;
    
    const tierLevels = {
      free: 0,
      premium: 1,
      pro: 2
    };
    
    const userLevel = tierLevels[userMembership.tier] || 0;
    const requiredLevel = tierLevels[requiredTier] || 0;
    
    return userLevel >= requiredLevel;
  };

  const canAccessFeature = (feature) => {
    const featureAccess = {
      'basic-troubleshooting': ['free', 'premium', 'pro'],
      'advanced-troubleshooting': ['premium', 'pro'],
      'ai-assistant': ['premium', 'pro'],
      'unlimited-flows': ['pro'],
      'premium-ebooks': ['premium', 'pro'],
      'ebook-creation': ['pro'],
      'priority-support': ['premium', 'pro'],
      'analytics': ['pro'],
      'csv-import': ['pro']
    };

    const allowedTiers = featureAccess[feature] || [];
    return allowedTiers.includes(userMembership?.tier);
  };

  const getRemainingUsage = (feature) => {
    const limits = {
      'monthly-flows': {
        free: 10,
        premium: 100,
        pro: -1 // unlimited
      },
      'monthly-ai-requests': {
        free: 0,
        premium: 50,
        pro: 200
      }
    };

    const limit = limits[feature]?.[userMembership?.tier];
    const used = userMembership?.usage?.[feature] || 0;
    
    if (limit === -1) return { unlimited: true };
    return { remaining: Math.max(0, limit - used), limit, used };
  };

  const value = {
    membership: userMembership,
    hasAccess,
    canAccessFeature,
    getRemainingUsage,
    refetchMembership: refetch
  };

  return (
    <MembershipContext.Provider value={value}>
      {children}
    </MembershipContext.Provider>
  );
};

// Membership Guard Component
export const MembershipGuard = ({ 
  requiredTier, 
  feature,
  children, 
  fallback,
  showUpgrade = true 
}) => {
  const { hasAccess, canAccessFeature, membership } = useMembership();

  const hasRequiredAccess = requiredTier ? hasAccess(requiredTier) : canAccessFeature(feature);

  if (hasRequiredAccess) {
    return children;
  }

  if (fallback) {
    return fallback;
  }

  if (showUpgrade) {
    return <MembershipUpgradePrompt requiredTier={requiredTier} feature={feature} />;
  }

  return null;
};

// Membership Badge Component
export const MembershipBadge = ({ tier, size = 'sm', showIcon = true }) => {
  const configs = {
    free: {
      icon: Shield,
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-800',
      label: 'Free'
    },
    premium: {
      icon: Star,
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-800',
      label: 'Premium'
    },
    pro: {
      icon: Crown,
      bgColor: 'bg-purple-100',
      textColor: 'text-purple-800',
      label: 'Pro'
    }
  };

  const config = configs[tier] || configs.free;
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'px-2.5 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${config.bgColor} ${config.textColor} ${sizeClasses[size]}`}>
      {showIcon && <Icon className={`mr-1 ${iconSizes[size]}`} />}
      {config.label}
    </span>
  );
};

// Membership Upgrade Prompt Component
export const MembershipUpgradePrompt = ({ requiredTier, feature, className = '' }) => {
  const { membership } = useMembership();
  
  const getUpgradeMessage = () => {
    if (requiredTier === 'premium' && membership?.tier === 'free') {
      return {
        title: 'Premium Feature',
        message: 'Upgrade to Premium to access this feature',
        action: 'Upgrade to Premium'
      };
    }
    if (requiredTier === 'pro' && ['free', 'premium'].includes(membership?.tier)) {
      return {
        title: 'Pro Feature',
        message: 'Upgrade to Pro to unlock this advanced feature',
        action: 'Upgrade to Pro'
      };
    }
    return {
      title: 'Premium Feature',
      message: 'This feature requires a paid membership',
      action: 'View Plans'
    };
  };

  const { title, message, action } = getUpgradeMessage();

  return (
    <div className={`bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-6 text-center ${className}`}>
      <div className="flex justify-center mb-4">
        {requiredTier === 'pro' ? (
          <Crown className="w-12 h-12 text-purple-600" />
        ) : (
          <Star className="w-12 h-12 text-yellow-600" />
        )}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-4">{message}</p>
      <button className="btn-primary">
        {action}
      </button>
    </div>
  );
};

// Usage Indicator Component
export const UsageIndicator = ({ feature, className = '' }) => {
  const { getRemainingUsage } = useMembership();
  const usage = getRemainingUsage(feature);

  if (usage.unlimited) {
    return (
      <div className={`flex items-center text-sm text-green-600 ${className}`}>
        <Zap className="w-4 h-4 mr-1" />
        Unlimited
      </div>
    );
  }

  const percentage = (usage.used / usage.limit) * 100;
  const isLow = percentage > 80;

  return (
    <div className={`${className}`}>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="text-gray-600">{feature.replace('-', ' ')}</span>
        <span className={`font-medium ${isLow ? 'text-red-600' : 'text-gray-900'}`}>
          {usage.remaining} remaining
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all duration-300 ${
            isLow ? 'bg-red-500' : 'bg-green-500'
          }`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <div className="text-xs text-gray-500 mt-1">
        {usage.used} of {usage.limit} used this month
      </div>
    </div>
  );
};

// Feature Access Component
export const FeatureAccess = ({ feature, children, upgrade = true }) => {
  const { canAccessFeature } = useMembership();

  if (canAccessFeature(feature)) {
    return children;
  }

  if (upgrade) {
    return (
      <div className="relative">
        <div className="opacity-50 pointer-events-none">
          {children}
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 rounded-lg">
          <div className="text-center p-4">
            <Lock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-600 mb-2">Premium Feature</p>
            <button className="btn-primary text-sm px-4 py-2">
              Upgrade Now
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

// Pricing Plans Component
export const PricingPlans = ({ onSelectPlan, currentTier = 'free' }) => {
  const plans = [
    {
      tier: 'free',
      name: 'Free',
      price: 0,
      description: 'Perfect for getting started',
      icon: Shield,
      features: [
        '10 troubleshooting flows per month',
        'Basic problem categories',
        'Community support',
        'Access to free eBooks'
      ],
      buttonText: 'Current Plan',
      disabled: currentTier === 'free'
    },
    {
      tier: 'premium',
      name: 'Premium',
      price: 9.99,
      description: 'For regular troubleshooters',
      icon: Star,
      popular: true,
      features: [
        '100 troubleshooting flows per month',
        'Advanced problem categories',
        'AI-powered suggestions',
        'Priority support',
        'Access to premium eBooks',
        '50 AI content requests'
      ],
      buttonText: currentTier === 'premium' ? 'Current Plan' : 'Upgrade to Premium',
      disabled: currentTier === 'premium'
    },
    {
      tier: 'pro',
      name: 'Pro',
      price: 19.99,
      description: 'For professionals and power users',
      icon: Crown,
      features: [
        'Unlimited troubleshooting flows',
        'All problem categories',
        'Advanced AI assistant',
        'Priority support',
        'Access to all eBooks',
        'Create & sell your own eBooks',
        '200 AI content requests',
        'Advanced analytics',
        'CSV import/export'
      ],
      buttonText: currentTier === 'pro' ? 'Current Plan' : 'Upgrade to Pro',
      disabled: currentTier === 'pro'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {plans.map((plan) => {
        const Icon = plan.icon;
        return (
          <div 
            key={plan.tier}
            className={`relative bg-white rounded-lg border-2 p-6 ${
              plan.popular 
                ? 'border-purple-500 shadow-lg scale-105' 
                : 'border-gray-200 shadow-sm'
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-purple-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                  Most Popular
                </span>
              </div>
            )}
            
            <div className="text-center">
              <Icon className={`w-12 h-12 mx-auto mb-4 ${
                plan.tier === 'free' ? 'text-gray-600' :
                plan.tier === 'premium' ? 'text-yellow-600' :
                'text-purple-600'
              }`} />
              
              <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
              <p className="text-gray-600 mb-4">{plan.description}</p>
              
              <div className="mb-6">
                <span className="text-3xl font-bold text-gray-900">${plan.price}</span>
                {plan.price > 0 && <span className="text-gray-600">/month</span>}
              </div>
              
              <ul className="text-left space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                      <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    </div>
                    <span className="text-sm text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <button
                onClick={() => onSelectPlan && onSelectPlan(plan.tier)}
                disabled={plan.disabled}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-colors duration-200 ${
                  plan.disabled
                    ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                    : plan.popular
                    ? 'bg-purple-600 text-white hover:bg-purple-700'
                    : 'bg-gray-900 text-white hover:bg-gray-800'
                }`}
              >
                {plan.buttonText}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Membership Features Matrix
export const membershipFeatures = {
  troubleshooting: {
    basicFlows: {
      free: true,
      premium: true,
      pro: true,
      limit: { free: 10, premium: 100, pro: -1 }
    },
    advancedFlows: {
      free: false,
      premium: true,
      pro: true
    },
    aiSuggestions: {
      free: false,
      premium: true,
      pro: true
    },
    csvImport: {
      free: false,
      premium: false,
      pro: true
    }
  },
  ebooks: {
    freeEbooks: {
      free: true,
      premium: true,
      pro: true
    },
    premiumEbooks: {
      free: false,
      premium: true,
      pro: true
    },
    ebookCreation: {
      free: false,
      premium: false,
      pro: true
    },
    aiAssistance: {
      free: false,
      premium: true,
      pro: true,
      limit: { premium: 50, pro: 200 }
    }
  },
  platform: {
    prioritySupport: {
      free: false,
      premium: true,
      pro: true
    },
    analytics: {
      free: false,
      premium: false,
      pro: true
    },
    customBranding: {
      free: false,
      premium: false,
      pro: true
    }
  }
};

// Tier comparison utility
export const compareTiers = (currentTier, targetTier) => {
  const levels = { free: 0, premium: 1, pro: 2 };
  return levels[targetTier] > levels[currentTier];
};

// Subscription prices
export const subscriptionPrices = {
  premium: {
    monthly: 9.99,
    annual: 99.99
  },
  pro: {
    monthly: 19.99,
    annual: 199.99
  }
};

// Export the main components and utilities
export default {
  MembershipProvider,
  useMembership,
  MembershipGuard,
  MembershipBadge,
  PricingPlans,
  membershipFeatures,
  compareTiers,
  subscriptionPrices
};
