const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  // Basic user information
  firstName: {
    type: String,
    required: [true, 'Please provide first name'],
    trim: true,
    maxlength: [50, 'First name cannot be more than 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Please provide last name'],
    trim: true,
    maxlength: [50, 'Last name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Please provide email'],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ]
  },
  phone: {
    type: String,
    trim: true,
    match: [/^\+?[\d\s-()]+$/, 'Please provide a valid phone number']
  },
  password: {
    type: String,
    required: function() {
      return !this.socialAuth.google.id && !this.socialAuth.facebook.id;
    },
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },

  // Profile information
  avatar: {
    url: String,
    publicId: String
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot be more than 500 characters']
  },
  dateOfBirth: Date,
  location: {
    city: String,
    country: String
  },

  // Account status and verification
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  isPhoneVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'moderator'],
    default: 'user'
  },

  // Subscription information
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'premium'],
      default: 'free'
    },
    status: {
      type: String,
      enum: ['active', 'expired', 'cancelled', 'trial'],
      default: 'active'
    },
    startDate: Date,
    endDate: Date,
    stripeCustomerId: String,
    stripeSubscriptionId: String,
    paypalSubscriptionId: String,
    autoRenew: {
      type: Boolean,
      default: true
    }
  },

  // Social authentication
  socialAuth: {
    google: {
      id: String,
      email: String
    },
    facebook: {
      id: String,
      email: String
    }
  },

  // Security fields
  emailVerificationToken: String,
  emailVerificationExpire: Date,
  phoneVerificationCode: String,
  phoneVerificationExpire: Date,
  passwordResetToken: String,
  passwordResetExpire: Date,
  twoFactorSecret: String,
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },

  // Activity tracking
  lastLogin: Date,
  loginCount: {
    type: Number,
    default: 0
  },
  ipAddresses: [{
    ip: String,
    timestamp: Date,
    userAgent: String
  }],

  // Preferences
  preferences: {
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      push: {
        type: Boolean,
        default: true
      },
      sms: {
        type: Boolean,
        default: false
      }
    },
    language: {
      type: String,
      default: 'en'
    },
    timezone: String,
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'system'
    }
  },

  // Usage analytics
  analytics: {
    troubleshootingQueriesCount: {
      type: Number,
      default: 0
    },
    aiChatCount: {
      type: Number,
      default: 0
    },
    lastTroubleshootingQuery: Date,
    favoriteCategories: [String]
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for subscription status
userSchema.virtual('isPremium').get(function() {
  return this.subscription.plan === 'premium' && 
         this.subscription.status === 'active' && 
         (!this.subscription.endDate || this.subscription.endDate > new Date());
});

// Virtual for trial status
userSchema.virtual('isInTrial').get(function() {
  return this.subscription.status === 'trial' && 
         this.subscription.endDate > new Date();
});

// Index for better query performance
userSchema.index({ email: 1 });
userSchema.index({ 'socialAuth.google.id': 1 });
userSchema.index({ 'socialAuth.facebook.id': 1 });
userSchema.index({ 'subscription.plan': 1, 'subscription.status': 1 });

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to generate JWT token
userSchema.methods.getSignedJwtToken = function() {
  return jwt.sign(
    { 
      id: this._id,
      email: this.email,
      role: this.role,
      subscription: this.subscription.plan
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRE || '30d',
    }
  );
};

// Method to match password
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method to generate password reset token
userSchema.methods.getResetPasswordToken = function() {
  // Generate token
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Hash token and set to resetPasswordToken field
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set expire time (10 minutes)
  this.passwordResetExpire = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

// Method to generate email verification token
userSchema.methods.getEmailVerificationToken = function() {
  const verificationToken = crypto.randomBytes(20).toString('hex');

  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');

  this.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

  return verificationToken;
};

// Method to generate phone verification code
userSchema.methods.getPhoneVerificationCode = function() {
  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
  
  this.phoneVerificationCode = crypto
    .createHash('sha256')
    .update(verificationCode)
    .digest('hex');

  this.phoneVerificationExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

  return verificationCode;
};

// Method to update last login
userSchema.methods.updateLastLogin = function(ip, userAgent) {
  this.lastLogin = new Date();
  this.loginCount += 1;
  
  // Add IP address to history (keep last 10)
  this.ipAddresses.unshift({
    ip,
    timestamp: new Date(),
    userAgent
  });
  
  if (this.ipAddresses.length > 10) {
    this.ipAddresses = this.ipAddresses.slice(0, 10);
  }
  
  return this.save();
};

// Method to check if user has premium features
userSchema.methods.hasPremiumAccess = function() {
  return this.isPremium || this.isInTrial;
};

// Method to update subscription
userSchema.methods.updateSubscription = function(planData) {
  this.subscription = { ...this.subscription, ...planData };
  return this.save();
};

// Static method to find by email or social ID
userSchema.statics.findByEmailOrSocial = function(email, googleId, facebookId) {
  const query = { $or: [] };
  
  if (email) {
    query.$or.push({ email });
  }
  if (googleId) {
    query.$or.push({ 'socialAuth.google.id': googleId });
  }
  if (facebookId) {
    query.$or.push({ 'socialAuth.facebook.id': facebookId });
  }
  
  return this.findOne(query);
};

module.exports = mongoose.model('User', userSchema);
