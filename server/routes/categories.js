const express = require('express');
const { body, validationResult } = require('express-validator');
const { Category, Guide } = require('../models');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all categories (public)
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true })
      .sort({ name: 1 });

    // Add guide count for each category
    const categoriesWithCount = await Promise.all(
      categories.map(async (category) => {
        const guideCount = await Guide.countDocuments({ 
          category: category._id, 
          isPublished: true 
        });
        return {
          ...category.toObject(),
          guideCount
        };
      })
    );

    res.json({ categories: categoriesWithCount });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single category by slug (public)
router.get('/:slug', async (req, res) => {
  try {
    const category = await Category.findOne({ 
      slug: req.params.slug, 
      isActive: true 
    });

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Get guides in this category
    const guides = await Guide.find({ 
      category: category._id, 
      isPublished: true 
    })
    .populate('author', 'username profile.firstName profile.lastName')
    .sort({ createdAt: -1 });

    res.json({ 
      category,
      guides
    });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new category (admin only)
router.post('/', authenticate, requireAdmin, [
  body('name').notEmpty().withMessage('Category name is required'),
  body('slug').notEmpty().withMessage('Category slug is required'),
  body('description').optional().isLength({ max: 500 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, slug, description, icon, color } = req.body;

    // Check if category already exists
    const existingCategory = await Category.findOne({
      $or: [{ name }, { slug }]
    });

    if (existingCategory) {
      return res.status(400).json({ 
        message: 'Category with this name or slug already exists' 
      });
    }

    const category = new Category({
      name,
      slug,
      description,
      icon,
      color
    });

    await category.save();

    res.status(201).json({
      message: 'Category created successfully',
      category
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ message: 'Server error during category creation' });
  }
});

// Update category (admin only)
router.put('/:id', authenticate, requireAdmin, [
  body('name').optional().notEmpty().withMessage('Category name cannot be empty'),
  body('slug').optional().notEmpty().withMessage('Category slug cannot be empty'),
  body('description').optional().isLength({ max: 500 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json({
      message: 'Category updated successfully',
      category
    });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ message: 'Server error during category update' });
  }
});

// Delete category (admin only)
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Check if category has guides
    const guideCount = await Guide.countDocuments({ category: category._id });
    if (guideCount > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete category with existing guides. Please move or delete guides first.' 
      });
    }

    await Category.findByIdAndDelete(req.params.id);

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ message: 'Server error during category deletion' });
  }
});

module.exports = router;
