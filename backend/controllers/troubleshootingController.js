const { validationResult } = require('express-validator');
const Troubleshooting = require('../models/Troubleshooting');
const User = require('../models/User');
const { asyncHandler, ErrorResponse } = require('../middleware/errorHandler');
const logger = require('../config/logger');

// @desc    Get all troubleshooting articles
// @route   GET /api/troubleshooting
// @access  Public
exports.getTroubleshootingArticles = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = (page - 1) * limit;

  // Build query
  const query = {
    status: 'published',
    isActive: true
  };

  // Apply filters
  if (req.query.category) {
    query.category = req.query.category;
  }

  if (req.query.difficulty) {
    query.difficulty = req.query.difficulty;
  }

  if (req.query.search) {
    query.$text = { $search: req.query.search };
  }

  // Check if user has premium access for premium content
  if (!req.user || !req.user.hasPremiumAccess()) {
    query.isPremiumContent = false;
  }

  try {
    const articles = await Troubleshooting.find(query)
      .populate('author', 'firstName lastName avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Troubleshooting.countDocuments(query);

    res.status(200).json({
      success: true,
      articles,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    logger.error('Error fetching troubleshooting articles', {
      error: error.message,
      query: req.query
    });
    return next(new ErrorResponse('Failed to fetch articles', 500));
  }
});

// @desc    Get single troubleshooting article
// @route   GET /api/troubleshooting/:id
// @access  Public
exports.getTroubleshootingArticle = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  try {
    const article = await Troubleshooting.findById(id)
      .populate('author', 'firstName lastName avatar')
      .populate('comments.user', 'firstName lastName avatar')
      .populate('comments.replies.user', 'firstName lastName avatar')
      .populate('relatedArticles', 'title slug category difficulty');

    if (!article || article.status !== 'published' || !article.isActive) {
      return next(new ErrorResponse('Article not found', 404));
    }

    // Check premium access
    if (article.isPremiumContent && (!req.user || !req.user.hasPremiumAccess())) {
      return next(new ErrorResponse('Premium subscription required', 403));
    }

    // Increment views
    await article.incrementViews();

    // Update user analytics if logged in
    if (req.user) {
      const user = await User.findById(req.user.id);
      user.analytics.troubleshootingQueriesCount += 1;
      user.analytics.lastTroubleshootingQuery = new Date();
      
      // Add to favorite categories
      if (!user.analytics.favoriteCategories.includes(article.category)) {
        user.analytics.favoriteCategories.push(article.category);
        if (user.analytics.favoriteCategories.length > 10) {
          user.analytics.favoriteCategories.shift();
        }
      }
      
      await user.save();
    }

    logger.info('Troubleshooting article viewed', {
      articleId: article._id,
      userId: req.user?.id,
      category: article.category
    });

    res.status(200).json({
      success: true,
      article
    });

  } catch (error) {
    logger.error('Error fetching troubleshooting article', {
      articleId: id,
      error: error.message
    });
    return next(new ErrorResponse('Failed to fetch article', 500));
  }
});

// @desc    Get articles by category
// @route   GET /api/troubleshooting/category/:category
// @access  Public
exports.getArticlesByCategory = asyncHandler(async (req, res, next) => {
  const { category } = req.params;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;

  try {
    const articles = await Troubleshooting.getByCategory(category, limit, page);
    
    const total = await Troubleshooting.countDocuments({ 
      category, 
      status: 'published', 
      isActive: true 
    });

    res.status(200).json({
      success: true,
      category,
      articles,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    logger.error('Error fetching articles by category', {
      category,
      error: error.message
    });
    return next(new ErrorResponse('Failed to fetch articles', 500));
  }
});

// @desc    Search troubleshooting articles
// @route   GET /api/troubleshooting/search
// @access  Public
exports.searchArticles = asyncHandler(async (req, res, next) => {
  const { q: query, category, difficulty } = req.query;

  if (!query) {
    return next(new ErrorResponse('Search query is required', 400));
  }

  try {
    const filters = {};
    if (category) filters.category = category;
    if (difficulty) filters.difficulty = difficulty;

    // Check premium access
    if (!req.user || !req.user.hasPremiumAccess()) {
      filters.isPremiumContent = false;
    }

    const articles = await Troubleshooting.search(query, filters);

    logger.info('Article search performed', {
      query,
      filters,
      resultCount: articles.length,
      userId: req.user?.id
    });

    res.status(200).json({
      success: true,
      query,
      articles,
      count: articles.length
    });

  } catch (error) {
    logger.error('Error searching articles', {
      query,
      error: error.message
    });
    return next(new ErrorResponse('Search failed', 500));
  }
});

// @desc    Get popular articles
// @route   GET /api/troubleshooting/popular
// @access  Public
exports.getPopularArticles = asyncHandler(async (req, res, next) => {
  const limit = parseInt(req.query.limit, 10) || 10;

  try {
    const articles = await Troubleshooting.getPopular(limit);

    res.status(200).json({
      success: true,
      articles
    });

  } catch (error) {
    logger.error('Error fetching popular articles', {
      error: error.message
    });
    return next(new ErrorResponse('Failed to fetch popular articles', 500));
  }
});

// @desc    Add comment to article
// @route   POST /api/troubleshooting/:id/comments
// @access  Private
exports.addComment = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  const { id } = req.params;
  const { comment } = req.body;

  try {
    const article = await Troubleshooting.findById(id);
    
    if (!article || article.status !== 'published' || !article.isActive) {
      return next(new ErrorResponse('Article not found', 404));
    }

    const newComment = {
      user: req.user.id,
      comment,
      createdAt: new Date()
    };

    article.comments.push(newComment);
    await article.save();

    // Populate the new comment
    await article.populate('comments.user', 'firstName lastName avatar');

    const addedComment = article.comments[article.comments.length - 1];

    logger.info('Comment added to article', {
      articleId: id,
      userId: req.user.id,
      commentId: addedComment._id
    });

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      comment: addedComment
    });

  } catch (error) {
    logger.error('Error adding comment', {
      articleId: id,
      userId: req.user.id,
      error: error.message
    });
    return next(new ErrorResponse('Failed to add comment', 500));
  }
});

// @desc    Reply to a comment
// @route   POST /api/troubleshooting/:id/comments/:commentId/reply
// @access  Private
exports.replyToComment = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  const { id, commentId } = req.params;
  const { reply } = req.body;

  try {
    const article = await Troubleshooting.findById(id);
    
    if (!article) {
      return next(new ErrorResponse('Article not found', 404));
    }

    const comment = article.comments.id(commentId);
    if (!comment) {
      return next(new ErrorResponse('Comment not found', 404));
    }

    const newReply = {
      user: req.user.id,
      reply,
      createdAt: new Date()
    };

    comment.replies.push(newReply);
    await article.save();

    // Populate the reply
    await article.populate('comments.replies.user', 'firstName lastName avatar');

    const addedReply = comment.replies[comment.replies.length - 1];

    logger.info('Reply added to comment', {
      articleId: id,
      commentId,
      userId: req.user.id,
      replyId: addedReply._id
    });

    res.status(201).json({
      success: true,
      message: 'Reply added successfully',
      reply: addedReply
    });

  } catch (error) {
    logger.error('Error adding reply', {
      articleId: id,
      commentId,
      userId: req.user.id,
      error: error.message
    });
    return next(new ErrorResponse('Failed to add reply', 500));
  }
});

// @desc    Rate an article
// @route   POST /api/troubleshooting/:id/rate
// @access  Private
exports.rateArticle = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  const { id } = req.params;
  const { rating, review } = req.body;

  try {
    const article = await Troubleshooting.findById(id);
    
    if (!article || article.status !== 'published' || !article.isActive) {
      return next(new ErrorResponse('Article not found', 404));
    }

    await article.addRating(req.user.id, rating, review);

    logger.info('Article rated', {
      articleId: id,
      userId: req.user.id,
      rating
    });

    res.status(200).json({
      success: true,
      message: 'Article rated successfully',
      averageRating: article.averageRating
    });

  } catch (error) {
    logger.error('Error rating article', {
      articleId: id,
      userId: req.user.id,
      error: error.message
    });
    return next(new ErrorResponse('Failed to rate article', 500));
  }
});

// @desc    Like/unlike an article
// @route   POST /api/troubleshooting/:id/like
// @access  Private
exports.toggleLike = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { isLike } = req.body; // true for like, false for dislike

  try {
    const article = await Troubleshooting.findById(id);
    
    if (!article) {
      return next(new ErrorResponse('Article not found', 404));
    }

    await article.toggleLike(isLike);

    logger.info('Article like toggled', {
      articleId: id,
      userId: req.user.id,
      isLike
    });

    res.status(200).json({
      success: true,
      message: isLike ? 'Article liked' : 'Article disliked',
      likes: article.likes,
      dislikes: article.dislikes
    });

  } catch (error) {
    logger.error('Error toggling like', {
      articleId: id,
      userId: req.user.id,
      error: error.message
    });
    return next(new ErrorResponse('Failed to update like status', 500));
  }
});

// @desc    Get categories with article counts
// @route   GET /api/troubleshooting/categories
// @access  Public
exports.getCategories = asyncHandler(async (req, res, next) => {
  try {
    const categories = await Troubleshooting.aggregate([
      {
        $match: { 
          status: 'published', 
          isActive: true 
        }
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          latestUpdate: { $max: '$updatedAt' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    const categoriesWithInfo = categories.map(cat => ({
      category: cat._id,
      count: cat.count,
      latestUpdate: cat.latestUpdate,
      displayName: cat._id.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ')
    }));

    res.status(200).json({
      success: true,
      categories: categoriesWithInfo,
      total: categories.length
    });

  } catch (error) {
    logger.error('Error fetching categories', {
      error: error.message
    });
    return next(new ErrorResponse('Failed to fetch categories', 500));
  }
});

// @desc    Create new troubleshooting article (Admin/Moderator only)
// @route   POST /api/troubleshooting
// @access  Private (Admin/Moderator)
exports.createArticle = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  try {
    const articleData = {
      ...req.body,
      author: req.user.id
    };

    const article = await Troubleshooting.create(articleData);

    logger.info('New troubleshooting article created', {
      articleId: article._id,
      title: article.title,
      category: article.category,
      authorId: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Article created successfully',
      article
    });

  } catch (error) {
    logger.error('Error creating article', {
      authorId: req.user.id,
      error: error.message
    });
    return next(new ErrorResponse('Failed to create article', 500));
  }
});

// @desc    Update troubleshooting article (Admin/Moderator only)
// @route   PUT /api/troubleshooting/:id
// @access  Private (Admin/Moderator)
exports.updateArticle = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  const { id } = req.params;

  try {
    const updateData = {
      ...req.body,
      lastModifiedBy: req.user.id
    };

    const article = await Troubleshooting.findByIdAndUpdate(
      id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    );

    if (!article) {
      return next(new ErrorResponse('Article not found', 404));
    }

    logger.info('Troubleshooting article updated', {
      articleId: id,
      modifiedBy: req.user.id
    });

    res.status(200).json({
      success: true,
      message: 'Article updated successfully',
      article
    });

  } catch (error) {
    logger.error('Error updating article', {
      articleId: id,
      modifiedBy: req.user.id,
      error: error.message
    });
    return next(new ErrorResponse('Failed to update article', 500));
  }
});

// @desc    Delete troubleshooting article (Admin only)
// @route   DELETE /api/troubleshooting/:id
// @access  Private (Admin)
exports.deleteArticle = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  try {
    const article = await Troubleshooting.findByIdAndDelete(id);

    if (!article) {
      return next(new ErrorResponse('Article not found', 404));
    }

    logger.info('Troubleshooting article deleted', {
      articleId: id,
      title: article.title,
      deletedBy: req.user.id
    });

    res.status(200).json({
      success: true,
      message: 'Article deleted successfully'
    });

  } catch (error) {
    logger.error('Error deleting article', {
      articleId: id,
      deletedBy: req.user.id,
      error: error.message
    });
    return next(new ErrorResponse('Failed to delete article', 500));
  }
});

module.exports = {
  getTroubleshootingArticles,
  getTroubleshootingArticle,
  getArticlesByCategory,
  searchArticles,
  getPopularArticles,
  addComment,
  replyToComment,
  rateArticle,
  toggleLike,
  getCategories,
  createArticle,
  updateArticle,
  deleteArticle
};
