const express = require('express');
const {
  avatarUpload,
  troubleshootingUpload,
  uploadAvatar,
  uploadTroubleshootingImages
} = require('../services/uploadService');

const { protect, requirePremium } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Avatar upload (available to all authenticated users)
router.post('/avatar', avatarUpload, uploadAvatar);

// Troubleshooting images upload (premium feature)
router.post('/troubleshooting-images', requirePremium, troubleshootingUpload, uploadTroubleshootingImages);

module.exports = router;
