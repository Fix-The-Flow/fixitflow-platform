const express = require('express');
const { body, validationResult } = require('express-validator');
const { Guide, Category, User, MascotTip } = require('../models');
const { authenticate, requireAdmin, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Get all guides with search and filtering (public)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { 
      search, 
      category, 
      severity, 
      difficulty, 
      tags, 
      sort = 'newest',
      page = 1,
      limit = 12
    } = req.query;

    // Build search query
    let query = { isPublished: true };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    if (category) {
      const categoryDoc = await Category.findOne({ slug: category });
      if (categoryDoc) {
        query.category = categoryDoc._id;
      }
    }

    if (severity) {
      query.severity = { $in: severity.split(',') };
    }

    if (difficulty) {
      query.difficulty = { $in: difficulty.split(',') };
    }

    if (tags) {
      query.tags = { $in: tags.split(',') };
    }

    // Build sort query
    let sortQuery = {};
    switch (sort) {
      case 'newest':
        sortQuery = { createdAt: -1 };
        break;
      case 'oldest':
        sortQuery = { createdAt: 1 };
        break;
      case 'popular':
        sortQuery = { views: -1 };
        break;
      case 'rating':
        sortQuery = { 'rating.average': -1 };
        break;
      case 'title':
        sortQuery = { title: 1 };
        break;
      default:
        sortQuery = { createdAt: -1 };
    }

    const guides = await Guide.find(query)
      .populate('category', 'name slug color icon')
      .populate('author', 'username profile.firstName profile.lastName')
      .sort(sortQuery)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Guide.countDocuments(query);

    res.json({
      guides,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get guides error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single guide by slug (public)
router.get('/:slug', optionalAuth, async (req, res) => {
  try {
    const guide = await Guide.findOne({ 
      slug: req.params.slug, 
      isPublished: true 
    })
    .populate('category', 'name slug color icon')
    .populate('author', 'username profile.firstName profile.lastName profile.avatar');

    if (!guide) {
      return res.status(404).json({ message: 'Guide not found' });
    }

    // Increment view count
    await Guide.findByIdAndUpdate(guide._id, { $inc: { views: 1 } });

    // Get user progress if authenticated
    let userProgress = null;
    if (req.user) {
      const progressEntry = req.user.progressTracking.find(
        p => p.guide.toString() === guide._id.toString()
      );
      userProgress = progressEntry || { currentStep: 0, completed: false };
    }

    // Get mascot tips for this guide
    const mascotTips = await MascotTip.find({
      $or: [
        { category: guide.category._id },
        { category: null }
      ],
      isActive: true
    });

    res.json({ 
      guide,
      userProgress,
      mascotTips
    });
  } catch (error) {
    console.error('Get guide error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new guide (admin only)
router.post('/', authenticate, requireAdmin, [
  body('title').notEmpty().withMessage('Guide title is required'),
  body('slug').notEmpty().withMessage('Guide slug is required'),
  body('description').notEmpty().withMessage('Guide description is required'),
  body('category').notEmpty().withMessage('Category is required'),
  body('estimatedTime').notEmpty().withMessage('Estimated time is required'),
  body('steps').isArray({ min: 1 }).withMessage('At least one step is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Check if guide slug already exists
    const existingGuide = await Guide.findOne({ slug: req.body.slug });
    if (existingGuide) {
      return res.status(400).json({ 
        message: 'Guide with this slug already exists' 
      });
    }

    // Validate category exists
    const category = await Category.findById(req.body.category);
    if (!category) {
      return res.status(400).json({ message: 'Invalid category' });
    }

    const guide = new Guide({
      ...req.body,
      author: req.user._id
    });

    await guide.save();

    const populatedGuide = await Guide.findById(guide._id)
      .populate('category', 'name slug color icon')
      .populate('author', 'username profile.firstName profile.lastName');

    res.status(201).json({
      message: 'Guide created successfully',
      guide: populatedGuide
    });
  } catch (error) {
    console.error('Create guide error:', error);
    res.status(500).json({ message: 'Server error during guide creation' });
  }
});

// Update guide (admin only)
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const guide = await Guide.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
    .populate('category', 'name slug color icon')
    .populate('author', 'username profile.firstName profile.lastName');

    if (!guide) {
      return res.status(404).json({ message: 'Guide not found' });
    }

    res.json({
      message: 'Guide updated successfully',
      guide
    });
  } catch (error) {
    console.error('Update guide error:', error);
    res.status(500).json({ message: 'Server error during guide update' });
  }
});

// Delete guide (admin only)
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const guide = await Guide.findByIdAndDelete(req.params.id);
    
    if (!guide) {
      return res.status(404).json({ message: 'Guide not found' });
    }

    // Remove from user saved guides and progress tracking
    await User.updateMany(
      {},
      {
        $pull: {
          savedGuides: guide._id,
          progressTracking: { guide: guide._id }
        }
      }
    );

    res.json({ message: 'Guide deleted successfully' });
  } catch (error) {
    console.error('Delete guide error:', error);
    res.status(500).json({ message: 'Server error during guide deletion' });
  }
});

// Save guide to user's collection (authenticated users)
router.post('/:id/save', authenticate, async (req, res) => {
  try {
    const guide = await Guide.findById(req.params.id);
    if (!guide) {
      return res.status(404).json({ message: 'Guide not found' });
    }

    const user = await User.findById(req.user._id);
    
    if (user.savedGuides.includes(guide._id)) {
      return res.status(400).json({ message: 'Guide already saved' });
    }

    user.savedGuides.push(guide._id);
    await user.save();

    res.json({ message: 'Guide saved successfully' });
  } catch (error) {
    console.error('Save guide error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove guide from user's collection (authenticated users)
router.delete('/:id/save', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.savedGuides = user.savedGuides.filter(
      guideId => guideId.toString() !== req.params.id
    );
    await user.save();

    res.json({ message: 'Guide removed from saved list' });
  } catch (error) {
    console.error('Remove saved guide error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user progress on a guide (authenticated users)
router.post('/:id/progress', authenticate, [
  body('currentStep').isInt({ min: 0 }).withMessage('Current step must be a valid number'),
  body('completed').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { currentStep, completed = false } = req.body;
    const guideId = req.params.id;

    const user = await User.findById(req.user._id);
    const existingProgress = user.progressTracking.find(
      p => p.guide.toString() === guideId
    );

    if (existingProgress) {
      existingProgress.currentStep = currentStep;
      existingProgress.completed = completed;
      existingProgress.lastAccessed = new Date();
    } else {
      user.progressTracking.push({
        guide: guideId,
        currentStep,
        completed,
        lastAccessed: new Date()
      });
    }

    await user.save();

    // If completed, increment guide completion count
    if (completed && (!existingProgress || !existingProgress.completed)) {
      await Guide.findByIdAndUpdate(guideId, { $inc: { completions: 1 } });
    }

    res.json({ 
      message: 'Progress updated successfully',
      progress: {
        currentStep,
        completed,
        lastAccessed: new Date()
      }
    });
  } catch (error) {
    console.error('Update progress error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
