const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const { asyncHandler, ErrorResponse } = require('../middleware/errorHandler');
const logger = require('../config/logger');

// Ensure upload directories exist
const ensureUploadDirs = async () => {
  const dirs = [
    'uploads',
    'uploads/avatars',
    'uploads/troubleshooting',
    'uploads/temp'
  ];

  for (const dir of dirs) {
    try {
      await fs.access(dir);
    } catch {
      await fs.mkdir(dir, { recursive: true });
      logger.info(`Created upload directory: ${dir}`);
    }
  }
};

// Initialize upload directories
ensureUploadDirs().catch(err => {
  logger.error('Failed to create upload directories:', err);
});

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = 'uploads/temp';
    
    if (file.fieldname === 'avatar') {
      uploadPath = 'uploads/avatars';
    } else if (file.fieldname === 'troubleshooting_images') {
      uploadPath = 'uploads/troubleshooting';
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, extension);
    
    // Sanitize filename
    const sanitizedBaseName = baseName
      .replace(/[^a-zA-Z0-9]/g, '_')
      .substring(0, 50);
    
    cb(null, `${sanitizedBaseName}_${uniqueSuffix}${extension}`);
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedTypes = {
    'avatar': ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    'troubleshooting_images': ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
    'documents': ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  };

  let fieldAllowedTypes = allowedTypes['troubleshooting_images']; // default
  
  if (allowedTypes[file.fieldname]) {
    fieldAllowedTypes = allowedTypes[file.fieldname];
  }

  if (fieldAllowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ErrorResponse(
      `Invalid file type. Allowed types: ${fieldAllowedTypes.join(', ')}`, 
      400
    ), false);
  }
};

// Multer configuration
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB default
    files: parseInt(process.env.MAX_FILES) || 5 // 5 files default
  }
});

// Image processing function
const processImage = async (inputPath, outputPath, options = {}) => {
  const {
    width = 800,
    height = 600,
    quality = 80,
    format = 'jpeg'
  } = options;

  try {
    let processor = sharp(inputPath);

    // Auto-orient based on EXIF data
    processor = processor.rotate();

    // Resize if dimensions provided
    if (width || height) {
      processor = processor.resize(width, height, {
        fit: 'cover',
        position: 'center'
      });
    }

    // Set format and quality
    if (format === 'jpeg') {
      processor = processor.jpeg({ quality });
    } else if (format === 'png') {
      processor = processor.png({ quality });
    } else if (format === 'webp') {
      processor = processor.webp({ quality });
    }

    await processor.toFile(outputPath);
    
    logger.info('Image processed successfully', {
      inputPath,
      outputPath,
      options
    });

    return outputPath;
  } catch (error) {
    logger.error('Image processing failed', {
      inputPath,
      outputPath,
      error: error.message
    });
    throw new ErrorResponse('Image processing failed', 500);
  }
};

// Avatar upload and processing
const uploadAvatar = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return next(new ErrorResponse('No file uploaded', 400));
  }

  const User = require('../models/User');
  const user = await User.findById(req.user.id);

  try {
    const inputPath = req.file.path;
    const filename = `avatar_${req.user.id}_${Date.now()}.jpeg`;
    const outputPath = path.join('uploads', 'avatars', filename);

    // Process avatar image
    await processImage(inputPath, outputPath, {
      width: 200,
      height: 200,
      quality: 85,
      format: 'jpeg'
    });

    // Delete old avatar if exists
    if (user.avatar && user.avatar.url) {
      const oldPath = user.avatar.url.replace(`${req.protocol}://${req.get('host')}/`, '');
      try {
        await fs.unlink(oldPath);
        logger.info('Old avatar deleted', { path: oldPath });
      } catch (err) {
        logger.warn('Failed to delete old avatar', { path: oldPath, error: err.message });
      }
    }

    // Update user avatar
    const avatarUrl = `${req.protocol}://${req.get('host')}/${outputPath.replace(/\\/g, '/')}`;
    user.avatar = {
      url: avatarUrl,
      publicId: filename
    };
    await user.save();

    // Clean up original uploaded file
    try {
      await fs.unlink(inputPath);
    } catch (err) {
      logger.warn('Failed to delete temporary file', { path: inputPath });
    }

    logger.info('Avatar uploaded successfully', {
      userId: req.user.id,
      filename,
      size: req.file.size
    });

    res.status(200).json({
      success: true,
      message: 'Avatar uploaded successfully',
      avatar: user.avatar
    });

  } catch (error) {
    // Clean up uploaded file on error
    try {
      await fs.unlink(req.file.path);
    } catch (err) {
      logger.warn('Failed to clean up uploaded file after error');
    }

    logger.error('Avatar upload failed', {
      userId: req.user.id,
      error: error.message
    });

    return next(error);
  }
});

// Multiple image upload for troubleshooting
const uploadTroubleshootingImages = asyncHandler(async (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return next(new ErrorResponse('No files uploaded', 400));
  }

  try {
    const processedImages = [];

    for (const file of req.files) {
      const inputPath = file.path;
      const filename = `troubleshooting_${Date.now()}_${Math.random().toString(36).substring(7)}.jpeg`;
      const outputPath = path.join('uploads', 'troubleshooting', filename);

      // Process image
      await processImage(inputPath, outputPath, {
        width: 1200,
        height: 900,
        quality: 80,
        format: 'jpeg'
      });

      const imageUrl = `${req.protocol}://${req.get('host')}/${outputPath.replace(/\\/g, '/')}`;
      
      processedImages.push({
        url: imageUrl,
        filename,
        originalName: file.originalname,
        size: file.size
      });

      // Clean up original file
      try {
        await fs.unlink(inputPath);
      } catch (err) {
        logger.warn('Failed to delete temporary file', { path: inputPath });
      }
    }

    logger.info('Troubleshooting images uploaded', {
      count: processedImages.length,
      userId: req.user?.id
    });

    res.status(200).json({
      success: true,
      message: 'Images uploaded successfully',
      images: processedImages
    });

  } catch (error) {
    // Clean up uploaded files on error
    for (const file of req.files) {
      try {
        await fs.unlink(file.path);
      } catch (err) {
        logger.warn('Failed to clean up uploaded file after error');
      }
    }

    logger.error('Troubleshooting images upload failed', {
      error: error.message,
      userId: req.user?.id
    });

    return next(error);
  }
});

// Delete file function
const deleteFile = async (filePath) => {
  try {
    await fs.unlink(filePath);
    logger.info('File deleted successfully', { filePath });
    return true;
  } catch (error) {
    logger.error('Failed to delete file', { filePath, error: error.message });
    return false;
  }
};

// Get file info
const getFileInfo = async (filePath) => {
  try {
    const stats = await fs.stat(filePath);
    return {
      exists: true,
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime
    };
  } catch (error) {
    return { exists: false };
  }
};

// Clean up old files (should be run as a cron job)
const cleanupOldFiles = async (directory, maxAgeHours = 24) => {
  try {
    const files = await fs.readdir(directory);
    const now = Date.now();
    let deletedCount = 0;

    for (const file of files) {
      const filePath = path.join(directory, file);
      const stats = await fs.stat(filePath);
      
      const ageHours = (now - stats.mtime.getTime()) / (1000 * 60 * 60);
      
      if (ageHours > maxAgeHours) {
        await deleteFile(filePath);
        deletedCount++;
      }
    }

    logger.info('Cleanup completed', {
      directory,
      deletedCount,
      maxAgeHours
    });

    return deletedCount;
  } catch (error) {
    logger.error('Cleanup failed', {
      directory,
      error: error.message
    });
    return 0;
  }
};

// Middleware configurations
const avatarUpload = upload.single('avatar');
const troubleshootingUpload = upload.array('troubleshooting_images', 5);
const documentUpload = upload.single('document');

module.exports = {
  // Multer middleware
  avatarUpload,
  troubleshootingUpload,
  documentUpload,
  
  // Upload handlers
  uploadAvatar,
  uploadTroubleshootingImages,
  
  // Utility functions
  processImage,
  deleteFile,
  getFileInfo,
  cleanupOldFiles,
  
  // Direct multer instance for custom usage
  upload
};
