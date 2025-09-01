const express = require('express');
const { body } = require('express-validator');
const {
  getProfile,
  updateProfile,
  updatePreferences,
  deleteAccount,
  getActivity,
  updateEmail,
  updatePhone,
  getSubscription,
  getAnalytics,
  exportUserData,
  getDashboard
} = require('../controllers/userController');

const { protect, requireEmailVerified } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const updateProfileValidation = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('First name can only contain letters and spaces'),
  
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Last name can only contain letters and spaces'),
  
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio cannot exceed 500 characters'),
  
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  
  body('dateOfBirth')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('Please provide a valid date of birth'),
  
  body('location.city')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('City must be between 2 and 100 characters'),
  
  body('location.country')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Country must be between 2 and 100 characters')
];

const updatePreferencesValidation = [
  body('notifications.email')
    .optional()
    .isBoolean()
    .withMessage('Email notification preference must be a boolean'),
  
  body('notifications.push')
    .optional()
    .isBoolean()
    .withMessage('Push notification preference must be a boolean'),
  
  body('notifications.sms')
    .optional()
    .isBoolean()
    .withMessage('SMS notification preference must be a boolean'),
  
  body('language')
    .optional()
    .isIn(['en', 'es', 'fr', 'de', 'it', 'pt'])
    .withMessage('Language must be one of: en, es, fr, de, it, pt'),
  
  body('timezone')
    .optional()
    .matches(/^[A-Za-z_\/]+$/)
    .withMessage('Please provide a valid timezone'),
  
  body('theme')
    .optional()
    .isIn(['light', 'dark', 'system'])
    .withMessage('Theme must be one of: light, dark, system')
];

const updateEmailValidation = [
  body('newEmail')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .notEmpty()
    .withMessage('Current password is required')
];

const updatePhoneValidation = [
  body('phone')
    .isMobilePhone()
    .withMessage('Please provide a valid phone number')
];

const deleteAccountValidation = [
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  body('confirmDelete')
    .equals('DELETE')
    .withMessage('Please type "DELETE" to confirm')
];

// All routes require authentication
router.use(protect);

// Profile routes
router.get('/profile', getProfile);
router.put('/profile', updateProfileValidation, updateProfile);

// Preferences
router.put('/preferences', updatePreferencesValidation, updatePreferences);

// Account management
router.delete('/account', deleteAccountValidation, deleteAccount);
router.get('/activity', getActivity);

// Email and phone management
router.put('/email', updateEmailValidation, updateEmail);
router.put('/phone', updatePhoneValidation, updatePhone);

// Subscription and analytics
router.get('/subscription', getSubscription);
router.get('/analytics', getAnalytics);

// Data export (GDPR)
router.get('/export', exportUserData);

// Dashboard
router.get('/dashboard', getDashboard);

module.exports = router;
