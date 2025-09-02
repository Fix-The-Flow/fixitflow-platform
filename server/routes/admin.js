const express = require('express');
const { body, validationResult } = require('express-validator');
const { User, Guide, Ebook, Category, Purchase, Analytics, MascotTip } = require('../models');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { upload, parseCsvFile, createGuidesFromCsv, generateCsvTemplate, cleanupFile } = require('../services/csvUploadService');

const router = express.Router();

// Get dashboard statistics
router.get('/dashboard', authenticate, requireAdmin, async (req, res) => {
  try {
    const [
      totalUsers,
      totalGuides,
      totalEbooks,
      totalRevenue,
      recentUsers,
      popularGuides,
      recentPurchases
    ] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      Guide.countDocuments({ isPublished: true }),
      Ebook.countDocuments({ isPublished: true }),
      Purchase.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      User.find({ role: 'user' })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('username email createdAt profile'),
      Guide.find({ isPublished: true })
        .sort({ views: -1 })
        .limit(5)
        .populate('category', 'name')
        .select('title views completions category'),
      Purchase.find({ status: 'completed' })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('user', 'username email')
        .populate('ebook', 'title price')
    ]);

    const stats = {
      overview: {
        totalUsers,
        totalGuides,
        totalEbooks,
        totalRevenue: totalRevenue[0]?.total || 0
      },
      recentActivity: {
        newUsers: recentUsers,
        popularGuides,
        recentPurchases
      }
    };

    res.json({ stats });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all users for management
router.get('/users', authenticate, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role } = req.query;

    let query = {};
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { 'profile.firstName': { $regex: search, $options: 'i' } },
        { 'profile.lastName': { $regex: search, $options: 'i' } }
      ];
    }
    if (role) {
      query.role = role;
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.json({
      users,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user role or status
router.put('/users/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    
    if (role && !['user', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'User updated successfully',
      user
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error during user update' });
  }
});

// Get all guides for management
router.get('/guides', authenticate, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, search, category, status } = req.query;

    let query = {};
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    if (category) {
      query.category = category;
    }
    if (status === 'published') {
      query.isPublished = true;
    } else if (status === 'draft') {
      query.isPublished = false;
    }

    const guides = await Guide.find(query)
      .populate('category', 'name slug')
      .populate('author', 'username')
      .sort({ createdAt: -1 })
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
    console.error('Get admin guides error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all eBooks for management
router.get('/ebooks', authenticate, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, search, category, status } = req.query;

    let query = {};
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    if (category) {
      query.category = category;
    }
    if (status === 'published') {
      query.isPublished = true;
    } else if (status === 'draft') {
      query.isPublished = false;
    }

    const ebooks = await Ebook.find(query)
      .populate('category', 'name slug')
      .populate('author', 'username')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-content');

    const total = await Ebook.countDocuments(query);

    res.json({
      ebooks,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get admin ebooks error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new eBook
router.post('/ebooks', authenticate, requireAdmin, [
  body('title').notEmpty().withMessage('Title is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('category').isMongoId().withMessage('Valid category is required'),
  body('price').isNumeric().withMessage('Price must be a number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const ebook = new Ebook({
      ...req.body,
      author: req.user._id,
      slug: req.body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    });

    await ebook.save();
    
    const populatedEbook = await Ebook.findById(ebook._id)
      .populate('category', 'name slug')
      .populate('author', 'username');

    res.status(201).json({
      message: 'eBook created successfully',
      ebook: populatedEbook
    });
  } catch (error) {
    console.error('Create eBook error:', error);
    res.status(500).json({ message: 'Server error during eBook creation' });
  }
});

// Get single eBook for editing
router.get('/ebooks/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const ebook = await Ebook.findById(req.params.id)
      .populate('category', 'name slug')
      .populate('author', 'username');

    if (!ebook) {
      return res.status(404).json({ message: 'eBook not found' });
    }

    res.json({ ebook });
  } catch (error) {
    console.error('Get eBook error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update eBook
router.put('/ebooks/:id', authenticate, requireAdmin, [
  body('title').optional().notEmpty().withMessage('Title cannot be empty'),
  body('description').optional().notEmpty().withMessage('Description cannot be empty'),
  body('category').optional().isMongoId().withMessage('Valid category is required'),
  body('price').optional().isNumeric().withMessage('Price must be a number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const updateData = { ...req.body };
    
    // Update slug if title changed
    if (updateData.title) {
      updateData.slug = updateData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    }

    const ebook = await Ebook.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('category', 'name slug')
     .populate('author', 'username');

    if (!ebook) {
      return res.status(404).json({ message: 'eBook not found' });
    }

    res.json({
      message: 'eBook updated successfully',
      ebook
    });
  } catch (error) {
    console.error('Update eBook error:', error);
    res.status(500).json({ message: 'Server error during eBook update' });
  }
});

// Publish/Unpublish eBook
router.patch('/ebooks/:id/publish', authenticate, requireAdmin, async (req, res) => {
  try {
    const { isPublished } = req.body;
    
    const ebook = await Ebook.findByIdAndUpdate(
      req.params.id,
      { isPublished: Boolean(isPublished) },
      { new: true }
    ).populate('category', 'name slug')
     .populate('author', 'username');

    if (!ebook) {
      return res.status(404).json({ message: 'eBook not found' });
    }

    res.json({
      message: `eBook ${isPublished ? 'published' : 'unpublished'} successfully`,
      ebook
    });
  } catch (error) {
    console.error('Publish eBook error:', error);
    res.status(500).json({ message: 'Server error during publish update' });
  }
});

// Delete eBook
router.delete('/ebooks/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const ebook = await Ebook.findByIdAndDelete(req.params.id);
    
    if (!ebook) {
      return res.status(404).json({ message: 'eBook not found' });
    }

    // Also delete any related purchases (optional - might want to keep for records)
    // await Purchase.deleteMany({ ebook: req.params.id });

    res.json({ message: 'eBook deleted successfully' });
  } catch (error) {
    console.error('Delete eBook error:', error);
    res.status(500).json({ message: 'Server error during eBook deletion' });
  }
});

// Get sales analytics
router.get('/analytics/sales', authenticate, requireAdmin, async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    let dateFilter = {};
    const now = new Date();
    
    switch (period) {
      case '7d':
        dateFilter = { createdAt: { $gte: new Date(now - 7 * 24 * 60 * 60 * 1000) } };
        break;
      case '30d':
        dateFilter = { createdAt: { $gte: new Date(now - 30 * 24 * 60 * 60 * 1000) } };
        break;
      case '90d':
        dateFilter = { createdAt: { $gte: new Date(now - 90 * 24 * 60 * 60 * 1000) } };
        break;
      case '1y':
        dateFilter = { createdAt: { $gte: new Date(now - 365 * 24 * 60 * 60 * 1000) } };
        break;
    }

    const [
      salesByDay,
      topEbooks,
      revenueByCategory
    ] = await Promise.all([
      Purchase.aggregate([
        { $match: { status: 'completed', ...dateFilter } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            sales: { $sum: 1 },
            revenue: { $sum: '$amount' }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      Purchase.aggregate([
        { $match: { status: 'completed', ...dateFilter } },
        {
          $group: {
            _id: '$ebook',
            sales: { $sum: 1 },
            revenue: { $sum: '$amount' }
          }
        },
        { $sort: { sales: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'ebooks',
            localField: '_id',
            foreignField: '_id',
            as: 'ebook'
          }
        },
        { $unwind: '$ebook' }
      ]),
      Purchase.aggregate([
        { $match: { status: 'completed', ...dateFilter } },
        {
          $lookup: {
            from: 'ebooks',
            localField: 'ebook',
            foreignField: '_id',
            as: 'ebook'
          }
        },
        { $unwind: '$ebook' },
        {
          $lookup: {
            from: 'categories',
            localField: 'ebook.category',
            foreignField: '_id',
            as: 'category'
          }
        },
        { $unwind: '$category' },
        {
          $group: {
            _id: '$category.name',
            sales: { $sum: 1 },
            revenue: { $sum: '$amount' }
          }
        },
        { $sort: { revenue: -1 } }
      ])
    ]);

    res.json({
      salesByDay,
      topEbooks,
      revenueByCategory,
      period
    });
  } catch (error) {
    console.error('Sales analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Manage mascot tips
router.get('/mascot-tips', authenticate, requireAdmin, async (req, res) => {
  try {
    const tips = await MascotTip.find()
      .populate('category', 'name')
      .sort({ createdAt: -1 });

    res.json({ tips });
  } catch (error) {
    console.error('Get mascot tips error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/mascot-tips', authenticate, requireAdmin, [
  body('message').notEmpty().withMessage('Message is required'),
  body('context').isIn(['welcome', 'step', 'completion', 'error', 'encouragement', 'safety']),
  body('character').isIn(['wizard', 'robot', 'cat', 'dog', 'bear'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const tip = new MascotTip(req.body);
    await tip.save();

    const populatedTip = await MascotTip.findById(tip._id)
      .populate('category', 'name');

    res.status(201).json({
      message: 'Mascot tip created successfully',
      tip: populatedTip
    });
  } catch (error) {
    console.error('Create mascot tip error:', error);
    res.status(500).json({ message: 'Server error during tip creation' });
  }
});

router.put('/mascot-tips/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const tip = await MascotTip.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('category', 'name');

    if (!tip) {
      return res.status(404).json({ message: 'Mascot tip not found' });
    }

    res.json({
      message: 'Mascot tip updated successfully',
      tip
    });
  } catch (error) {
    console.error('Update mascot tip error:', error);
    res.status(500).json({ message: 'Server error during tip update' });
  }
});

router.delete('/mascot-tips/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const tip = await MascotTip.findByIdAndDelete(req.params.id);
    
    if (!tip) {
      return res.status(404).json({ message: 'Mascot tip not found' });
    }

    res.json({ message: 'Mascot tip deleted successfully' });
  } catch (error) {
    console.error('Delete mascot tip error:', error);
    res.status(500).json({ message: 'Server error during tip deletion' });
  }
});

// CSV Bulk Import Routes

// Download CSV template for guides
router.get('/guides/csv-template', authenticate, requireAdmin, async (req, res) => {
  try {
    const templatePath = await generateCsvTemplate();
    res.download(templatePath, 'guides-template.csv', (err) => {
      if (err) {
        console.error('Template download error:', err);
        res.status(500).json({ message: 'Error downloading template' });
      }
    });
  } catch (error) {
    console.error('Generate template error:', error);
    res.status(500).json({ message: 'Error generating CSV template' });
  }
});

// Upload and parse CSV file (preview)
router.post('/guides/csv-preview', authenticate, requireAdmin, upload, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No CSV file uploaded' });
    }

    const { data, errors } = await parseCsvFile(req.file.path);
    
    res.json({
      message: 'CSV file parsed successfully',
      preview: {
        totalRows: data.length,
        validRows: data.length,
        errors: errors,
        data: data.slice(0, 10) // Show first 10 rows for preview
      },
      fileName: req.file.filename
    });
  } catch (error) {
    console.error('CSV preview error:', error);
    if (req.file) {
      await cleanupFile(req.file.path);
    }
    res.status(500).json({ message: 'Error parsing CSV file' });
  }
});

// Get troubleshooting flows analytics
router.get('/flows/analytics', authenticate, requireAdmin, async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    let dateFilter = {};
    const now = new Date();
    
    switch (period) {
      case '7d':
        dateFilter = { createdAt: { $gte: new Date(now - 7 * 24 * 60 * 60 * 1000) } };
        break;
      case '30d':
        dateFilter = { createdAt: { $gte: new Date(now - 30 * 24 * 60 * 60 * 1000) } };
        break;
      case '90d':
        dateFilter = { createdAt: { $gte: new Date(now - 90 * 24 * 60 * 60 * 1000) } };
        break;
      case '1y':
        dateFilter = { createdAt: { $gte: new Date(now - 365 * 24 * 60 * 60 * 1000) } };
        break;
    }

    const [
      totalFlows,
      publishedFlows,
      totalViews,
      totalCompletions,
      flowsByCategory,
      flowsByDifficulty,
      recentFlows
    ] = await Promise.all([
      Guide.countDocuments(),
      Guide.countDocuments({ isPublished: true }),
      Guide.aggregate([
        { $group: { _id: null, total: { $sum: '$views' } } }
      ]),
      Guide.aggregate([
        { $group: { _id: null, total: { $sum: '$completions' } } }
      ]),
      Guide.aggregate([
        { $match: { isPublished: true } },
        { $lookup: { from: 'categories', localField: 'category', foreignField: '_id', as: 'categoryData' } },
        { $unwind: '$categoryData' },
        { $group: { _id: '$categoryData.name', count: { $sum: 1 }, views: { $sum: '$views' } } },
        { $sort: { count: -1 } }
      ]),
      Guide.aggregate([
        { $match: { isPublished: true } },
        { $group: { _id: '$difficulty', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Guide.find({ isPublished: true, ...dateFilter })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('category', 'name')
        .select('title views completions createdAt category')
    ]);

    const analytics = {
      overview: {
        totalFlows,
        publishedFlows,
        totalViews: totalViews[0]?.total || 0,
        totalCompletions: totalCompletions[0]?.total || 0,
        averageRating: 4.2 // Could calculate this properly later
      },
      breakdown: {
        byCategory: flowsByCategory,
        byDifficulty: flowsByDifficulty
      },
      recent: recentFlows
    };

    res.json({ analytics });
  } catch (error) {
    console.error('Flows analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get troubleshooting categories (alias for categories)
router.get('/troubleshooting-categories', authenticate, requireAdmin, async (req, res) => {
  try {
    const categories = await Category.find()
      .sort({ name: 1 });
    
    // Add count of guides per category
    const categoriesWithCounts = await Promise.all(
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

    res.json({ categories: categoriesWithCounts });
  } catch (error) {
    console.error('Get troubleshooting categories error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Import guides from CSV file
router.post('/guides/csv-import', authenticate, requireAdmin, async (req, res) => {
  try {
    const { fileName } = req.body;
    
    if (!fileName) {
      return res.status(400).json({ message: 'File name is required' });
    }

    const filePath = `uploads/csv/${fileName}`;
    const { data, errors } = await parseCsvFile(filePath);

    if (errors.length > 0) {
      await cleanupFile(filePath);
      return res.status(400).json({ 
        message: 'CSV file contains errors', 
        errors 
      });
    }

    const results = await createGuidesFromCsv(data, req.user._id);
    
    // Clean up the uploaded file
    await cleanupFile(filePath);

    res.json({
      message: 'CSV import completed',
      results: {
        totalProcessed: data.length,
        successful: results.success.length,
        failed: results.errors.length,
        successList: results.success,
        errorList: results.errors
      }
    });
  } catch (error) {
    console.error('CSV import error:', error);
    res.status(500).json({ message: 'Error importing guides from CSV' });
  }
});

module.exports = router;
