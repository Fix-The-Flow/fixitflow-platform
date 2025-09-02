const multer = require('multer');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');
const { Guide, Category } = require('../models');

// Configure multer for CSV uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/csv/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `guides-import-${uniqueSuffix}.csv`);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'text/csv' || file.mimetype === 'application/csv' || file.mimetype === 'application/vnd.ms-excel') {
    cb(null, true);
  } else {
    cb(new Error('Only CSV files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Ensure upload directory exists
const ensureUploadDir = async () => {
  try {
    await fsPromises.access('uploads/csv');
  } catch {
    await fsPromises.mkdir('uploads/csv', { recursive: true });
  }
};

// Initialize upload directory
ensureUploadDir();

// Parse CSV file and validate data
const parseCsvFile = async (filePath) => {
  const results = [];
  const errors = [];
  let rowIndex = 0;

  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => {
        rowIndex++;
        // Validate required fields
        const requiredFields = ['title', 'description', 'category', 'difficulty', 'estimatedTime'];
        const missingFields = requiredFields.filter(field => !data[field] || data[field].trim() === '');
        
        if (missingFields.length > 0) {
          errors.push({
            row: rowIndex + 1, // +1 because header row is not counted
            errors: `Missing required fields: ${missingFields.join(', ')}`
          });
          return;
        }

        // Parse steps if provided
        let steps = [];
        if (data.steps && data.steps.trim() !== '') {
          try {
            // Steps should be in format: "Step 1: Title | Description;Step 2: Title | Description"
            const stepParts = data.steps.split(';').filter(step => step.trim() !== '');
            steps = stepParts.map((step, idx) => {
              const parts = step.split(' | ');
              const title = parts[0] ? parts[0].replace(/^Step \d+:\s*/, '').trim() : `Step ${idx + 1}`;
              const description = parts[1] ? parts[1].trim() : data.description;
              
              return {
                stepNumber: idx + 1,
                title: title,
                description: description,
                tips: data[`step_${idx + 1}_tips`] ? data[`step_${idx + 1}_tips`].split(',').map(t => t.trim()).filter(t => t) : [],
                warnings: []
              };
            });
            
            // If no valid steps were parsed, create a default step
            if (steps.length === 0) {
              steps = [{
                stepNumber: 1,
                title: 'Main Step',
                description: data.description,
                tips: [],
                warnings: []
              }];
            }
          } catch (err) {
            console.warn('Error parsing steps for row', rowIndex, ':', err.message);
            steps = [{
              stepNumber: 1,
              title: 'Main Step',
              description: data.description,
              tips: [],
              warnings: []
            }];
          }
        } else {
          // No steps provided, create default step
          steps = [{
            stepNumber: 1,
            title: 'Main Step',
            description: data.description,
            tips: [],
            warnings: []
          }];
        }

        results.push({
          title: data.title.trim(),
          description: data.description.trim(),
          slug: data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
          category: data.category.trim(),
          difficulty: data.difficulty.toLowerCase().trim(),
          estimatedTime: data.estimatedTime.trim(),
          severity: data.severity ? data.severity.toLowerCase().trim() : 'medium',
          toolsNeeded: data.tools ? data.tools.split(',').map(t => t.trim()).filter(t => t) : [],
          prerequisites: data.materials ? data.materials.split(',').map(m => m.trim()).filter(m => m) : [],
          tags: data.tags ? data.tags.split(',').map(t => t.trim().toLowerCase()).filter(t => t) : [],
          steps: steps,
          safetyWarnings: data.safetyTips ? data.safetyTips.split(',').map(t => t.trim()).filter(t => t) : [],
          isPublished: data.published ? data.published.toLowerCase() === 'true' : false
        });
      })
      .on('end', () => {
        resolve({ data: results, errors });
      })
      .on('error', reject);
  });
};

// Create guides from parsed CSV data
const createGuidesFromCsv = async (guidesData, authorId) => {
  const results = {
    success: [],
    errors: []
  };

  for (let i = 0; i < guidesData.length; i++) {
    const guideData = guidesData[i];
    
    try {
      // Find or create category
      let category = await Category.findOne({ name: new RegExp(`^${guideData.category}$`, 'i') });
      if (!category) {
        category = new Category({
          name: guideData.category,
          slug: guideData.category.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          description: `${guideData.category} related guides`,
          color: '#3B82F6'
        });
        await category.save();
      }

      // Check if guide with same slug already exists
      const existingGuide = await Guide.findOne({ slug: guideData.slug });
      if (existingGuide) {
        results.errors.push({
          row: i + 2,
          title: guideData.title,
          error: 'Guide with this title already exists'
        });
        continue;
      }

      // Create the guide
      const guide = new Guide({
        ...guideData,
        category: category._id,
        author: authorId
      });

      await guide.save();
      
      results.success.push({
        title: guideData.title,
        id: guide._id
      });

    } catch (error) {
      results.errors.push({
        row: i + 2,
        title: guideData.title,
        error: error.message
      });
    }
  }

  return results;
};

// Generate CSV template
const generateCsvTemplate = async () => {
  const templatePath = path.join('uploads/csv', 'guides-template.csv');
  
  const csvWriter = createCsvWriter({
    path: templatePath,
    header: [
      { id: 'title', title: 'title' },
      { id: 'description', title: 'description' },
      { id: 'category', title: 'category' },
      { id: 'difficulty', title: 'difficulty' },
      { id: 'estimatedTime', title: 'estimatedTime' },
      { id: 'severity', title: 'severity' },
      { id: 'tools', title: 'tools' },
      { id: 'materials', title: 'materials' },
      { id: 'tags', title: 'tags' },
      { id: 'steps', title: 'steps' },
      { id: 'safetyTips', title: 'safetyTips' },
      { id: 'published', title: 'published' }
    ]
  });

  const sampleData = [
    {
      title: 'Fix Leaky Faucet',
      description: 'Step-by-step guide to fix a leaky kitchen faucet',
      category: 'Plumbing',
      difficulty: 'beginner',
      estimatedTime: '30 minutes',
      severity: 'medium',
      tools: 'wrench, pliers, screwdriver',
      materials: 'O-ring, plumber\'s tape',
      tags: 'faucet, leak, kitchen, plumbing',
      steps: 'Turn off water | Locate the main water shutoff;Remove handle | Unscrew the faucet handle;Replace O-ring | Install new O-ring and reassemble',
      safetyTips: 'Turn off water supply, Wear safety glasses',
      published: 'false'
    },
    {
      title: 'Reset Router Connection',
      description: 'How to reset your internet router to fix connection issues',
      category: 'Technology',
      difficulty: 'beginner',
      estimatedTime: '10 minutes',
      severity: 'low',
      tools: 'none',
      materials: 'none',
      tags: 'router, internet, connection, troubleshooting',
      steps: 'Locate reset button | Find the small reset button on your router;Hold reset button | Press and hold for 10 seconds;Wait for restart | Allow router to fully reboot',
      safetyTips: 'Unplug power before reset',
      published: 'true'
    }
  ];

  await csvWriter.writeRecords(sampleData);
  return templatePath;
};

// Clean up uploaded files
const cleanupFile = async (filePath) => {
  try {
    await fsPromises.unlink(filePath);
  } catch (error) {
    console.error('Error cleaning up file:', error);
  }
};

module.exports = {
  upload: upload.single('csv_file'),
  parseCsvFile,
  createGuidesFromCsv,
  generateCsvTemplate,
  cleanupFile
};
