const express = require('express');
const { User, Guide } = require('../models');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Get user's saved guides
router.get('/saved-guides', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate({
        path: 'savedGuides',
        populate: {
          path: 'category',
          select: 'name slug color icon'
        }
      });

    res.json({ savedGuides: user.savedGuides });
  } catch (error) {
    console.error('Get saved guides error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's progress tracking
router.get('/progress', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate({
        path: 'progressTracking.guide',
        populate: {
          path: 'category',
          select: 'name slug color icon'
        }
      });

    const progress = user.progressTracking
      .sort((a, b) => b.lastAccessed - a.lastAccessed);

    res.json({ progress });
  } catch (error) {
    console.error('Get progress error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's dashboard summary
router.get('/dashboard', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('savedGuides', 'title category difficulty')
      .populate('purchasedEbooks.ebook', 'title coverImage price');

    const recentProgress = user.progressTracking
      .sort((a, b) => b.lastAccessed - a.lastAccessed)
      .slice(0, 5);

    const recentGuides = await Guide.find({
      _id: { $in: recentProgress.map(p => p.guide) }
    })
    .populate('category', 'name slug color icon')
    .select('title slug category difficulty estimatedTime');

    const stats = {
      savedGuidesCount: user.savedGuides.length,
      purchasedEbooksCount: user.purchasedEbooks.length,
      completedGuidesCount: user.progressTracking.filter(p => p.completed).length,
      inProgressCount: user.progressTracking.filter(p => !p.completed && p.currentStep > 0).length
    };

    res.json({
      stats,
      recentGuides,
      savedGuides: user.savedGuides.slice(0, 5),
      purchasedEbooks: user.purchasedEbooks.slice(0, 5)
    });
  } catch (error) {
    console.error('Get user dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
