const express = require('express');
const { Analytics, Guide, Ebook, User } = require('../models');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Track page view (public endpoint)
router.post('/track', async (req, res) => {
  try {
    const { page, userId, sessionId } = req.body;
    
    // Simple analytics tracking
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let analytics = await Analytics.findOne({ date: today });
    
    if (!analytics) {
      analytics = new Analytics({ date: today });
    }

    analytics.pageViews += 1;

    // Track unique visitors by session
    if (sessionId) {
      // This is a simplified approach - in production you'd want more sophisticated tracking
      analytics.uniqueVisitors += 1;
    }

    // Track specific content views
    if (page === 'guide') {
      analytics.guideViews += 1;
    } else if (page === 'ebook') {
      analytics.ebookViews += 1;
    }

    await analytics.save();

    res.json({ status: 'tracked' });
  } catch (error) {
    console.error('Analytics tracking error:', error);
    res.status(500).json({ message: 'Tracking failed' });
  }
});

// Get analytics data (admin only)
router.get('/data', authenticate, requireAdmin, async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    let dateFilter = {};
    const now = new Date();
    
    switch (period) {
      case '7d':
        dateFilter = { date: { $gte: new Date(now - 7 * 24 * 60 * 60 * 1000) } };
        break;
      case '30d':
        dateFilter = { date: { $gte: new Date(now - 30 * 24 * 60 * 60 * 1000) } };
        break;
      case '90d':
        dateFilter = { date: { $gte: new Date(now - 90 * 24 * 60 * 60 * 1000) } };
        break;
      case '1y':
        dateFilter = { date: { $gte: new Date(now - 365 * 24 * 60 * 60 * 1000) } };
        break;
    }

    const analyticsData = await Analytics.find(dateFilter)
      .sort({ date: 1 });

    // Calculate totals
    const totals = analyticsData.reduce((acc, day) => ({
      pageViews: acc.pageViews + day.pageViews,
      uniqueVisitors: acc.uniqueVisitors + day.uniqueVisitors,
      guideViews: acc.guideViews + day.guideViews,
      ebookViews: acc.ebookViews + day.ebookViews
    }), {
      pageViews: 0,
      uniqueVisitors: 0,
      guideViews: 0,
      ebookViews: 0
    });

    res.json({
      data: analyticsData,
      totals,
      period
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get content performance metrics (admin only)
router.get('/content-performance', authenticate, requireAdmin, async (req, res) => {
  try {
    const [topGuides, topEbooks] = await Promise.all([
      Guide.find({ isPublished: true })
        .populate('category', 'name')
        .sort({ views: -1 })
        .limit(10)
        .select('title views completions category rating'),
      Ebook.find({ isPublished: true })
        .populate('category', 'name')
        .sort({ 'sales.count': -1 })
        .limit(10)
        .select('title sales rating category')
    ]);

    res.json({
      topGuides,
      topEbooks
    });
  } catch (error) {
    console.error('Content performance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
