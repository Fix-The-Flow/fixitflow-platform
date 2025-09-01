const express = require('express');
const { body, validationResult } = require('express-validator');
const { Ebook, Category, Purchase } = require('../models');
const { authenticate, requireAdmin, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Get all eBooks with search and filtering (public)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { 
      search, 
      category, 
      priceMin, 
      priceMax,
      sort = 'newest',
      page = 1,
      limit = 12
    } = req.query;

    // Build search query
    let query = { isPublished: true };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (category) {
      const categoryDoc = await Category.findOne({ slug: category });
      if (categoryDoc) {
        query.category = categoryDoc._id;
      }
    }

    if (priceMin || priceMax) {
      query.price = {};
      if (priceMin) query.price.$gte = parseFloat(priceMin);
      if (priceMax) query.price.$lte = parseFloat(priceMax);
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
      case 'price-low':
        sortQuery = { price: 1 };
        break;
      case 'price-high':
        sortQuery = { price: -1 };
        break;
      case 'popular':
        sortQuery = { 'sales.count': -1 };
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

    const ebooks = await Ebook.find(query)
      .populate('category', 'name slug color icon')
      .populate('author', 'username profile.firstName profile.lastName')
      .sort(sortQuery)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-content'); // Don't include full content in list

    const total = await Ebook.countDocuments(query);

    // Add ownership info for authenticated users
    if (req.user) {
      const userPurchases = await Purchase.find({
        user: req.user._id,
        status: 'completed'
      }).select('ebook');
      
      const ownedEbookIds = userPurchases.map(p => p.ebook.toString());
      
      ebooks.forEach(ebook => {
        ebook._doc.owned = ownedEbookIds.includes(ebook._id.toString());
      });
    }

    res.json({
      ebooks,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get ebooks error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single eBook by slug (public preview, full content for owners)
router.get('/:slug', optionalAuth, async (req, res) => {
  try {
    let ebook = await Ebook.findOne({ 
      slug: req.params.slug, 
      isPublished: true 
    })
    .populate('category', 'name slug color icon')
    .populate('author', 'username profile.firstName profile.lastName profile.avatar');

    if (!ebook) {
      return res.status(404).json({ message: 'eBook not found' });
    }

    let hasAccess = false;
    
    // Check if user owns this eBook
    if (req.user) {
      const purchase = await Purchase.findOne({
        user: req.user._id,
        ebook: ebook._id,
        status: 'completed'
      });
      hasAccess = !!purchase;
    }

    // If user doesn't own the eBook, only show preview
    if (!hasAccess) {
      ebook = {
        ...ebook.toObject(),
        content: {
          introduction: ebook.content.introduction,
          chapters: ebook.content.chapters.slice(0, 1).map(chapter => ({
            title: chapter.title,
            content: chapter.content.substring(0, 500) + '...',
            guides: []
          })),
          conclusion: null
        }
      };
    }

    res.json({ 
      ebook,
      hasAccess,
      preview: !hasAccess
    });
  } catch (error) {
    console.error('Get ebook error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new eBook (admin only)
router.post('/', authenticate, requireAdmin, [
  body('title').notEmpty().withMessage('eBook title is required'),
  body('slug').notEmpty().withMessage('eBook slug is required'),
  body('description').notEmpty().withMessage('eBook description is required'),
  body('category').notEmpty().withMessage('Category is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a valid number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Check if eBook slug already exists
    const existingEbook = await Ebook.findOne({ slug: req.body.slug });
    if (existingEbook) {
      return res.status(400).json({ 
        message: 'eBook with this slug already exists' 
      });
    }

    // Validate category exists
    const category = await Category.findById(req.body.category);
    if (!category) {
      return res.status(400).json({ message: 'Invalid category' });
    }

    const ebook = new Ebook({
      ...req.body,
      author: req.user._id
    });

    await ebook.save();

    const populatedEbook = await Ebook.findById(ebook._id)
      .populate('category', 'name slug color icon')
      .populate('author', 'username profile.firstName profile.lastName');

    res.status(201).json({
      message: 'eBook created successfully',
      ebook: populatedEbook
    });
  } catch (error) {
    console.error('Create ebook error:', error);
    res.status(500).json({ message: 'Server error during eBook creation' });
  }
});

// Update eBook (admin only)
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const ebook = await Ebook.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
    .populate('category', 'name slug color icon')
    .populate('author', 'username profile.firstName profile.lastName');

    if (!ebook) {
      return res.status(404).json({ message: 'eBook not found' });
    }

    res.json({
      message: 'eBook updated successfully',
      ebook
    });
  } catch (error) {
    console.error('Update ebook error:', error);
    res.status(500).json({ message: 'Server error during eBook update' });
  }
});

// Delete eBook (admin only)
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const ebook = await Ebook.findById(req.params.id);
    
    if (!ebook) {
      return res.status(404).json({ message: 'eBook not found' });
    }

    // Check if eBook has been purchased
    const purchaseCount = await Purchase.countDocuments({ 
      ebook: ebook._id, 
      status: 'completed' 
    });
    
    if (purchaseCount > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete eBook that has been purchased. Consider unpublishing instead.' 
      });
    }

    await Ebook.findByIdAndDelete(req.params.id);

    res.json({ message: 'eBook deleted successfully' });
  } catch (error) {
    console.error('Delete ebook error:', error);
    res.status(500).json({ message: 'Server error during eBook deletion' });
  }
});

// Get featured eBooks (public)
router.get('/featured/list', async (req, res) => {
  try {
    const featuredEbooks = await Ebook.find({ 
      isPublished: true 
    })
    .populate('category', 'name slug color icon')
    .populate('author', 'username profile.firstName profile.lastName')
    .sort({ 'sales.count': -1, 'rating.average': -1 })
    .limit(6)
    .select('-content');

    res.json({ ebooks: featuredEbooks });
  } catch (error) {
    console.error('Get featured ebooks error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get eBook statistics (admin only)
router.get('/:id/stats', authenticate, requireAdmin, async (req, res) => {
  try {
    const ebook = await Ebook.findById(req.params.id);
    
    if (!ebook) {
      return res.status(404).json({ message: 'eBook not found' });
    }

    const purchases = await Purchase.find({ 
      ebook: ebook._id, 
      status: 'completed' 
    }).sort({ createdAt: -1 });

    const stats = {
      totalSales: ebook.sales.count,
      totalRevenue: ebook.sales.revenue,
      averageRating: ebook.rating.average,
      ratingCount: ebook.rating.count,
      recentPurchases: purchases.slice(0, 10),
      salesByMonth: {} // Could be expanded with aggregation
    };

    res.json({ stats });
  } catch (error) {
    console.error('Get ebook stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
