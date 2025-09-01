const mongoose = require('mongoose');

const troubleshootingSchema = new mongoose.Schema({
  // Basic information
  title: {
    type: String,
    required: [true, 'Please provide a title'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Please provide a description'],
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true
  },

  // Categorization
  category: {
    type: String,
    required: [true, 'Please provide a category'],
    enum: [
      'technology',
      'automotive',
      'home-maintenance',
      'appliances',
      'electronics',
      'plumbing',
      'electrical',
      'heating-cooling',
      'gardening',
      'pets',
      'health-wellness',
      'computer-software',
      'mobile-devices',
      'internet-networking',
      'other'
    ]
  },
  subcategory: {
    type: String,
    trim: true
  },
  tags: [{
    type: String,
    lowercase: true,
    trim: true
  }],

  // Difficulty and requirements
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  estimatedTime: {
    value: Number,
    unit: {
      type: String,
      enum: ['minutes', 'hours', 'days'],
      default: 'minutes'
    }
  },
  toolsRequired: [String],
  skillsRequired: [String],

  // Content
  problemSigns: [{
    type: String,
    trim: true
  }],
  possibleCauses: [{
    cause: String,
    probability: {
      type: Number,
      min: 1,
      max: 100,
      default: 50
    }
  }],
  
  // Step-by-step solution
  steps: [{
    stepNumber: {
      type: Number,
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true
    },
    images: [{
      url: String,
      alt: String,
      caption: String
    }],
    video: {
      url: String,
      thumbnail: String,
      duration: Number
    },
    tips: [String],
    warnings: [{
      level: {
        type: String,
        enum: ['info', 'warning', 'danger'],
        default: 'info'
      },
      message: String
    }],
    estimatedTime: Number // in minutes
  }],

  // Alternative solutions
  alternatives: [{
    title: String,
    description: String,
    steps: [String],
    whenToUse: String
  }],

  // Safety and precautions
  safetyPrecautions: [String],
  warnings: [String],
  whenToCallProfessional: String,

  // Media and resources
  images: [{
    url: String,
    alt: String,
    caption: String,
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  videos: [{
    url: String,
    title: String,
    thumbnail: String,
    duration: Number
  }],
  relatedArticles: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Troubleshooting'
  }],
  externalLinks: [{
    title: String,
    url: String,
    description: String
  }],

  // Engagement and feedback
  views: {
    type: Number,
    default: 0
  },
  likes: {
    type: Number,
    default: 0
  },
  dislikes: {
    type: Number,
    default: 0
  },
  bookmarks: {
    type: Number,
    default: 0
  },
  successRate: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },

  // User interactions
  ratings: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },
    review: String,
    helpful: {
      type: Number,
      default: 0
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],

  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    comment: {
      type: String,
      required: true,
      maxlength: [500, 'Comment cannot be more than 500 characters']
    },
    replies: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      reply: {
        type: String,
        required: true,
        maxlength: [300, 'Reply cannot be more than 300 characters']
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }],
    likes: {
      type: Number,
      default: 0
    },
    isHelpful: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Status and moderation
  status: {
    type: String,
    enum: ['draft', 'published', 'archived', 'pending_review'],
    default: 'draft'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isPremiumContent: {
    type: Boolean,
    default: false
  },
  
  // Author and moderation
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  moderationNotes: String,

  // SEO and metadata
  metaTitle: String,
  metaDescription: String,
  metaKeywords: [String],
  canonicalUrl: String,

  // Analytics
  analytics: {
    dailyViews: [{
      date: Date,
      views: Number
    }],
    searchKeywords: [{
      keyword: String,
      count: Number
    }],
    exitRate: Number,
    avgTimeOnPage: Number,
    bounceRate: Number
  }

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
troubleshootingSchema.index({ title: 'text', description: 'text', tags: 'text' });
troubleshootingSchema.index({ category: 1, subcategory: 1 });
troubleshootingSchema.index({ status: 1, isActive: 1 });
troubleshootingSchema.index({ views: -1 });
troubleshootingSchema.index({ createdAt: -1 });
troubleshootingSchema.index({ slug: 1 }, { unique: true });

// Virtual for average rating
troubleshootingSchema.virtual('averageRating').get(function() {
  if (this.ratings.length === 0) return 0;
  
  const sum = this.ratings.reduce((acc, rating) => acc + rating.rating, 0);
  return Math.round((sum / this.ratings.length) * 10) / 10;
});

// Virtual for total comments (including replies)
troubleshootingSchema.virtual('totalComments').get(function() {
  return this.comments.reduce((total, comment) => {
    return total + 1 + (comment.replies ? comment.replies.length : 0);
  }, 0);
});

// Virtual for read time estimation
troubleshootingSchema.virtual('estimatedReadTime').get(function() {
  const wordsPerMinute = 200;
  let totalWords = 0;
  
  // Count words in description
  totalWords += this.description.split(' ').length;
  
  // Count words in steps
  this.steps.forEach(step => {
    totalWords += step.description.split(' ').length;
  });
  
  return Math.ceil(totalWords / wordsPerMinute);
});

// Pre-save middleware to generate slug
troubleshootingSchema.pre('save', function(next) {
  if (this.isModified('title')) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/--+/g, '-') // Replace multiple hyphens with single
      .trim();
  }
  next();
});

// Method to increment views
troubleshootingSchema.methods.incrementViews = function() {
  this.views += 1;
  
  // Update daily analytics
  const today = new Date().toDateString();
  const todayAnalytics = this.analytics.dailyViews.find(
    day => day.date.toDateString() === today
  );
  
  if (todayAnalytics) {
    todayAnalytics.views += 1;
  } else {
    this.analytics.dailyViews.push({
      date: new Date(),
      views: 1
    });
  }
  
  // Keep only last 30 days
  if (this.analytics.dailyViews.length > 30) {
    this.analytics.dailyViews = this.analytics.dailyViews.slice(-30);
  }
  
  return this.save();
};

// Method to add rating
troubleshootingSchema.methods.addRating = function(userId, rating, review = '') {
  // Remove existing rating from this user
  this.ratings = this.ratings.filter(r => r.user.toString() !== userId.toString());
  
  // Add new rating
  this.ratings.push({
    user: userId,
    rating,
    review
  });
  
  return this.save();
};

// Method to toggle like/dislike
troubleshootingSchema.methods.toggleLike = function(isLike) {
  if (isLike) {
    this.likes += 1;
  } else {
    this.dislikes += 1;
  }
  return this.save();
};

// Static method to get popular articles
troubleshootingSchema.statics.getPopular = function(limit = 10) {
  return this.find({ status: 'published', isActive: true })
    .sort({ views: -1 })
    .limit(limit)
    .populate('author', 'firstName lastName avatar');
};

// Static method to get by category
troubleshootingSchema.statics.getByCategory = function(category, limit = 20, page = 1) {
  const skip = (page - 1) * limit;
  
  return this.find({ 
    category, 
    status: 'published', 
    isActive: true 
  })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('author', 'firstName lastName avatar');
};

// Static method for search
troubleshootingSchema.statics.search = function(query, filters = {}) {
  const searchQuery = {
    $text: { $search: query },
    status: 'published',
    isActive: true,
    ...filters
  };
  
  return this.find(searchQuery, { score: { $meta: 'textScore' } })
    .sort({ score: { $meta: 'textScore' } })
    .populate('author', 'firstName lastName avatar');
};

module.exports = mongoose.model('Troubleshooting', troubleshootingSchema);
