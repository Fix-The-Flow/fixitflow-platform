const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// User Schema
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  profile: {
    firstName: String,
    lastName: String,
    avatar: String,
    bio: String
  },
  preferences: {
    notifications: {
      type: Boolean,
      default: true
    },
    mascotEnabled: {
      type: Boolean,
      default: true
    }
  },
  savedGuides: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Guide'
  }],
  purchasedEbooks: [{
    ebook: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ebook'
    },
    purchaseDate: {
      type: Date,
      default: Date.now
    },
    transactionId: String
  }],
  progressTracking: [{
    guide: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Guide'
    },
    currentStep: {
      type: Number,
      default: 0
    },
    completed: {
      type: Boolean,
      default: false
    },
    lastAccessed: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Category Schema
const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  slug: {
    type: String,
    required: true,
    unique: true
  },
  description: String,
  icon: String,
  color: {
    type: String,
    default: '#3B82F6'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Guide Schema
const guideSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  estimatedTime: {
    type: String,
    required: true
  },
  tags: [String],
  steps: [{
    stepNumber: {
      type: Number,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    image: String,
    video: String,
    tips: [String],
    warnings: [String],
    mascotTip: String
  }],
  prerequisites: [String],
  toolsNeeded: [String],
  safetyWarnings: [String],
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  views: {
    type: Number,
    default: 0
  },
  completions: {
    type: Number,
    default: 0
  },
  rating: {
    average: {
      type: Number,
      default: 0
    },
    count: {
      type: Number,
      default: 0
    }
  },
  mascotCharacter: {
    type: String,
    enum: ['wizard', 'robot', 'cat', 'dog', 'bear'],
    default: 'wizard'
  }
}, {
  timestamps: true
});

// Ebook Schema
const ebookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  slug: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  coverImage: String,
  content: {
    chapters: [{
      title: String,
      content: String,
      guides: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Guide'
      }]
    }],
    introduction: String,
    conclusion: String
  },
  metadata: {
    pageCount: Number,
    wordCount: Number,
    readingTime: String,
    language: {
      type: String,
      default: 'en'
    }
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  sales: {
    count: {
      type: Number,
      default: 0
    },
    revenue: {
      type: Number,
      default: 0
    }
  },
  rating: {
    average: {
      type: Number,
      default: 0
    },
    count: {
      type: Number,
      default: 0
    }
  },
  aiGenerated: {
    type: Boolean,
    default: false
  },
  generationPrompt: String
}, {
  timestamps: true
});

// Purchase Schema
const purchaseSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  ebook: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ebook',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'usd'
  },
  stripePaymentId: String,
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  lastDownloaded: Date
}, {
  timestamps: true
});

// Analytics Schema
const analyticsSchema = new mongoose.Schema({
  date: {
    type: Date,
    default: Date.now
  },
  pageViews: {
    type: Number,
    default: 0
  },
  uniqueVisitors: {
    type: Number,
    default: 0
  },
  guideViews: {
    type: Number,
    default: 0
  },
  ebookViews: {
    type: Number,
    default: 0
  },
  purchases: {
    type: Number,
    default: 0
  },
  revenue: {
    type: Number,
    default: 0
  },
  topGuides: [{
    guide: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Guide'
    },
    views: Number
  }],
  topCategories: [{
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category'
    },
    views: Number
  }]
});

// Mascot Tip Schema
const mascotTipSchema = new mongoose.Schema({
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  },
  context: {
    type: String,
    enum: ['welcome', 'step', 'completion', 'error', 'encouragement', 'safety'],
    required: true
  },
  message: {
    type: String,
    required: true
  },
  character: {
    type: String,
    enum: ['wizard', 'robot', 'cat', 'dog', 'bear'],
    default: 'wizard'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Create models
const User = mongoose.model('User', userSchema);
const Category = mongoose.model('Category', categorySchema);
const Guide = mongoose.model('Guide', guideSchema);
const Ebook = mongoose.model('Ebook', ebookSchema);
const Purchase = mongoose.model('Purchase', purchaseSchema);
const Analytics = mongoose.model('Analytics', analyticsSchema);
const MascotTip = mongoose.model('MascotTip', mascotTipSchema);

module.exports = {
  User,
  Category,
  Guide,
  Ebook,
  Purchase,
  Analytics,
  MascotTip
};
