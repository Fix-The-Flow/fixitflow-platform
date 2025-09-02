const mongoose = require('mongoose');
const { User, Guide, Category } = require('../models');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fixitflow')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Additional troubleshooting flows
const additionalFlows = [
  {
    title: "Fix Washing Machine Not Draining",
    description: "Resolve washing machine drainage issues",
    category: "Appliances",
    difficulty: "intermediate",
    estimatedTime: "45 minutes",
    severity: "medium",
    toolsNeeded: ["screwdriver", "bucket"],
    prerequisites: [],
    tags: ["washing", "machine", "drain", "water", "problem"],
    steps: [
      {
        stepNumber: 1,
        title: "Check drain hose",
        description: "Inspect hose for kinks or clogs",
        tips: ["Straighten any kinks in the hose"],
        warnings: []
      },
      {
        stepNumber: 2,
        title: "Clean lint filter",
        description: "Remove and clean washing machine filter",
        tips: ["Usually located at bottom front of washer"],
        warnings: []
      },
      {
        stepNumber: 3,
        title: "Inspect pump",
        description: "Remove front panel and check drain pump",
        tips: ["Look for debris blocking pump"],
        warnings: ["Disconnect power before accessing internal parts"]
      }
    ],
    safetyWarnings: ["Disconnect power before accessing internal parts"],
    isPublished: true
  },
  {
    title: "Fix Garbage Disposal Jam",
    description: "Clear jammed garbage disposal unit",
    category: "Plumbing",
    difficulty: "intermediate",
    estimatedTime: "25 minutes",
    severity: "medium",
    toolsNeeded: ["allen wrench", "flashlight"],
    prerequisites: [],
    tags: ["garbage", "disposal", "jam", "stuck"],
    steps: [
      {
        stepNumber: 1,
        title: "Turn off power",
        description: "Switch off at breaker and unit",
        tips: ["Use flashlight for visibility"],
        warnings: ["Never put hands in disposal"]
      },
      {
        stepNumber: 2,
        title: "Remove debris",
        description: "Use flashlight to check for visible objects",
        tips: ["Use tongs or pliers to remove objects"],
        warnings: ["Never use hands"]
      },
      {
        stepNumber: 3,
        title: "Use allen wrench",
        description: "Insert into bottom of unit and turn manually",
        tips: ["Turn both directions to free jam"],
        warnings: []
      }
    ],
    safetyWarnings: ["Never put hands in disposal"],
    isPublished: true
  },
  {
    title: "Replace Car Air Filter",
    description: "Change dirty engine air filter",
    category: "Automotive",
    difficulty: "beginner",
    estimatedTime: "15 minutes",
    severity: "low",
    toolsNeeded: [],
    prerequisites: ["new air filter"],
    tags: ["car", "air", "filter", "engine", "maintenance"],
    steps: [
      {
        stepNumber: 1,
        title: "Locate air filter housing",
        description: "Open hood and find rectangular box near engine",
        tips: ["Usually has clips or screws holding cover"],
        warnings: []
      },
      {
        stepNumber: 2,
        title: "Remove old filter",
        description: "Lift out dirty air filter",
        tips: ["Note orientation before removing"],
        warnings: []
      },
      {
        stepNumber: 3,
        title: "Install new filter",
        description: "Place new filter matching airflow direction",
        tips: ["Arrows should point toward engine"],
        warnings: ["Check filter every 12000 miles"]
      }
    ],
    safetyWarnings: ["Check filter every 12000 miles"],
    isPublished: true
  },
  {
    title: "Fix Dishwasher Not Cleaning Dishes",
    description: "Improve dishwasher cleaning performance",
    category: "Appliances",
    difficulty: "beginner",
    estimatedTime: "30 minutes",
    severity: "medium",
    toolsNeeded: [],
    prerequisites: ["dishwasher cleaner", "vinegar"],
    tags: ["dishwasher", "cleaning", "dishes", "soap", "residue"],
    steps: [
      {
        stepNumber: 1,
        title: "Check spray arms",
        description: "Remove and clean clogged spray holes",
        tips: ["Use toothpick to clear holes"],
        warnings: []
      },
      {
        stepNumber: 2,
        title: "Clean filter",
        description: "Remove and wash dishwasher filter",
        tips: ["Usually located at bottom of dishwasher"],
        warnings: []
      },
      {
        stepNumber: 3,
        title: "Run cleaning cycle",
        description: "Use dishwasher cleaner or white vinegar",
        tips: ["Run hottest cycle available"],
        warnings: ["Scrape but don't pre-rinse dishes"]
      }
    ],
    safetyWarnings: ["Scrape but don't pre-rinse dishes"],
    isPublished: true
  },
  {
    title: "Fix Ceiling Fan Wobbling",
    description: "Stop ceiling fan from shaking and wobbling",
    category: "Electrical",
    difficulty: "intermediate",
    estimatedTime: "30 minutes",
    severity: "medium",
    toolsNeeded: ["screwdriver"],
    prerequisites: ["balancing kit", "ceiling fan cleaner"],
    tags: ["ceiling", "fan", "wobble", "balance", "vibration"],
    steps: [
      {
        stepNumber: 1,
        title: "Tighten all screws",
        description: "Check and tighten mounting and blade screws",
        tips: ["Use appropriate screwdriver size"],
        warnings: ["Turn off power before working on fan"]
      },
      {
        stepNumber: 2,
        title: "Clean fan blades",
        description: "Remove dust and debris from blades",
        tips: ["Clean both top and bottom of blades"],
        warnings: []
      },
      {
        stepNumber: 3,
        title: "Balance the fan",
        description: "Use balancing kit to add weights",
        tips: ["Start with the blade that appears heaviest"],
        warnings: []
      }
    ],
    safetyWarnings: ["Turn off power before working on fan"],
    isPublished: true
  },
  {
    title: "Troubleshoot Air Conditioner Not Cooling",
    description: "Fix AC unit that runs but doesn't cool",
    category: "HVAC",
    difficulty: "intermediate",
    estimatedTime: "30 minutes",
    severity: "high",
    toolsNeeded: [],
    prerequisites: ["air filter"],
    tags: ["air", "conditioning", "cooling", "temperature", "thermostat"],
    steps: [
      {
        stepNumber: 1,
        title: "Check thermostat settings",
        description: "Ensure correct temperature and mode",
        tips: ["Set to cooling mode, temperature below room temp"],
        warnings: []
      },
      {
        stepNumber: 2,
        title: "Replace air filter",
        description: "Install clean filter if dirty",
        tips: ["Dirty filters restrict airflow"],
        warnings: []
      },
      {
        stepNumber: 3,
        title: "Check outdoor unit",
        description: "Clear debris from around condenser",
        tips: ["Keep 2 feet clearance around unit"],
        warnings: ["Turn off AC for ice to melt before restart"]
      }
    ],
    safetyWarnings: ["Turn off AC for ice to melt before restart"],
    isPublished: true
  },
  {
    title: "Fix Laptop Overheating",
    description: "Reduce laptop temperature and improve performance",
    category: "Technology",
    difficulty: "intermediate",
    estimatedTime: "25 minutes",
    severity: "medium",
    toolsNeeded: ["compressed air", "screwdriver"],
    prerequisites: ["thermal paste"],
    tags: ["laptop", "overheating", "fan", "cleaning", "cooling"],
    steps: [
      {
        stepNumber: 1,
        title: "Check air vents",
        description: "Inspect vents for dust and debris",
        tips: ["Use flashlight to see inside vents"],
        warnings: []
      },
      {
        stepNumber: 2,
        title: "Clean vents with air",
        description: "Use compressed air to blow out dust",
        tips: ["Hold can upright, use short bursts"],
        warnings: ["Never use compressed air while laptop is on"]
      },
      {
        stepNumber: 3,
        title: "Use cooling pad",
        description: "Place laptop on cooling pad when working",
        tips: ["Elevate laptop for better airflow"],
        warnings: []
      }
    ],
    safetyWarnings: ["Never use compressed air while laptop is on"],
    isPublished: true
  },
  {
    title: "Fix Water Heater Not Heating",
    description: "Troubleshoot electric or gas water heater",
    category: "Plumbing",
    difficulty: "intermediate",
    estimatedTime: "45 minutes",
    severity: "high",
    toolsNeeded: ["multimeter", "wrench"],
    prerequisites: [],
    tags: ["water", "heater", "hot", "water", "heating", "element"],
    steps: [
      {
        stepNumber: 1,
        title: "Check power supply",
        description: "Verify electrical power to unit",
        tips: ["Check circuit breaker first"],
        warnings: []
      },
      {
        stepNumber: 2,
        title: "Test heating elements",
        description: "Check elements with multimeter",
        tips: ["Should read 10-16 ohms for good element"],
        warnings: ["Turn off power and water before servicing"]
      },
      {
        stepNumber: 3,
        title: "Check thermostat",
        description: "Test and adjust water temperature setting",
        tips: ["Recommended setting is 120°F"],
        warnings: []
      }
    ],
    safetyWarnings: ["Turn off power and water before servicing"],
    isPublished: true
  }
];

async function uploadAdditionalFlows() {
  try {
    console.log('Starting additional data upload...');
    
    // Find admin user
    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      console.log('No admin user found!');
      process.exit(1);
    }

    // Get category mapping
    const categories = await Category.find({});
    const categoryMap = {};
    categories.forEach(cat => {
      categoryMap[cat.name] = cat._id;
    });

    console.log('Creating additional troubleshooting guides...');
    let successCount = 0;
    let errorCount = 0;

    for (const flowData of additionalFlows) {
      try {
        // Check if guide already exists
        const slug = flowData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        const existingGuide = await Guide.findOne({ slug });
        
        if (existingGuide) {
          console.log(`Guide already exists: ${flowData.title}`);
          continue;
        }

        // Create the guide
        const guide = new Guide({
          ...flowData,
          slug,
          category: categoryMap[flowData.category],
          author: adminUser._id,
          views: Math.floor(Math.random() * 500),
          completions: Math.floor(Math.random() * 200),
          rating: {
            average: (Math.random() * 1.5 + 3.5), // Random rating between 3.5-5
            count: Math.floor(Math.random() * 80)
          }
        });

        await guide.save();
        successCount++;
        console.log(`✓ Created guide: ${flowData.title}`);
        
      } catch (error) {
        errorCount++;
        console.error(`✗ Error creating guide "${flowData.title}":`, error.message);
      }
    }

    console.log('\n=== ADDITIONAL UPLOAD COMPLETE ===');
    console.log(`Successfully created: ${successCount} additional guides`);
    console.log(`Errors: ${errorCount}`);
    
    // Get total count
    const totalGuides = await Guide.countDocuments();
    console.log(`Total guides in database: ${totalGuides}`);
    
    process.exit(0);
    
  } catch (error) {
    console.error('Upload failed:', error);
    process.exit(1);
  }
}

// Run the upload
uploadAdditionalFlows();
