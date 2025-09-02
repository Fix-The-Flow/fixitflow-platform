const mongoose = require('mongoose');
const { User, Guide, Category } = require('../models');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fixitflow')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Troubleshooting flows data
const troubleshootingFlows = [
  {
    title: "Fix Slow Internet Connection",
    description: "Troubleshoot and improve slow internet speeds",
    category: "Technology",
    difficulty: "beginner",
    estimatedTime: "15 minutes",
    severity: "medium",
    toolsNeeded: [],
    prerequisites: ["ethernet cable"],
    tags: ["internet", "slow", "connection", "wifi"],
    steps: [
      {
        stepNumber: 1,
        title: "Check internet speed",
        description: "Use speed test website to measure current speed",
        tips: ["Use multiple speed test sites for accuracy"],
        warnings: []
      },
      {
        stepNumber: 2,
        title: "Restart router",
        description: "Unplug router for 30 seconds then reconnect",
        tips: ["Wait for all lights to come back on"],
        warnings: []
      },
      {
        stepNumber: 3,
        title: "Check connected devices",
        description: "Disconnect unused devices to free up bandwidth",
        tips: ["Limit streaming and downloads"],
        warnings: []
      }
    ],
    safetyWarnings: [],
    isPublished: true
  },
  {
    title: "Unclog Kitchen Sink",
    description: "Remove blockages from kitchen sink drain",
    category: "Plumbing",
    difficulty: "beginner",
    estimatedTime: "20 minutes",
    severity: "medium",
    toolsNeeded: ["plunger", "snake"],
    prerequisites: ["baking soda", "vinegar"],
    tags: ["kitchen", "sink", "clog", "drain", "blockage"],
    steps: [
      {
        stepNumber: 1,
        title: "Remove standing water",
        description: "Clear visible water from sink",
        tips: ["Use a cup or bucket to bail out water"],
        warnings: []
      },
      {
        stepNumber: 2,
        title: "Try plunger",
        description: "Use sink plunger with firm pressure",
        tips: ["Cover drain completely with plunger"],
        warnings: []
      },
      {
        stepNumber: 3,
        title: "Use baking soda",
        description: "Pour 1 cup baking soda down drain",
        tips: ["Follow with hot water"],
        warnings: []
      }
    ],
    safetyWarnings: ["Wear gloves", "use eye protection"],
    isPublished: true
  },
  {
    title: "Fix Leaky Faucet",
    description: "Repair a dripping kitchen or bathroom faucet",
    category: "Plumbing",
    difficulty: "intermediate",
    estimatedTime: "45 minutes",
    severity: "medium",
    toolsNeeded: ["wrench", "pliers", "screwdriver"],
    prerequisites: ["O-rings", "washers", "plumbers tape"],
    tags: ["faucet", "leak", "drip", "repair"],
    steps: [
      {
        stepNumber: 1,
        title: "Turn off water supply",
        description: "Locate shutoff valve under sink and turn off",
        tips: ["Turn clockwise to close"],
        warnings: ["Turn off main water supply if valve is stuck"]
      },
      {
        stepNumber: 2,
        title: "Remove faucet handle",
        description: "Unscrew handle and remove",
        tips: ["Take photo before disassembly"],
        warnings: []
      },
      {
        stepNumber: 3,
        title: "Replace O-rings",
        description: "Remove old O-rings and install new ones",
        tips: ["Bring old O-ring to store for exact match"],
        warnings: []
      }
    ],
    safetyWarnings: ["Turn off main water supply if needed"],
    isPublished: true
  },
  {
    title: "Car Won't Start - Dead Battery",
    description: "Jump start car with dead battery",
    category: "Automotive",
    difficulty: "beginner",
    estimatedTime: "15 minutes",
    severity: "high",
    toolsNeeded: ["jumper cables"],
    prerequisites: [],
    tags: ["car", "battery", "dead", "jump", "start"],
    steps: [
      {
        stepNumber: 1,
        title: "Position helper vehicle",
        description: "Park close enough for cables to reach both batteries",
        tips: ["Don't let vehicles touch"],
        warnings: ["Keep vehicles separate"]
      },
      {
        stepNumber: 2,
        title: "Connect positive cable",
        description: "Red cable to dead battery positive terminal",
        tips: ["Positive terminal usually marked with +"],
        warnings: ["Don't let cables touch each other"]
      },
      {
        stepNumber: 3,
        title: "Connect other positive",
        description: "Other end of red cable to helper car positive",
        tips: ["Make sure connection is secure"],
        warnings: []
      }
    ],
    safetyWarnings: ["Keep metal tools away from terminals"],
    isPublished: true
  },
  {
    title: "Fix Running Toilet",
    description: "Stop toilet from continuously running",
    category: "Plumbing",
    difficulty: "beginner",
    estimatedTime: "20 minutes",
    severity: "low",
    toolsNeeded: [],
    prerequisites: ["flapper", "chain"],
    tags: ["toilet", "running", "water", "waste"],
    steps: [
      {
        stepNumber: 1,
        title: "Remove toilet tank lid",
        description: "Carefully lift and set aside tank lid",
        tips: ["Place lid on towel to prevent cracking"],
        warnings: ["Handle with care - ceramic breaks easily"]
      },
      {
        stepNumber: 2,
        title: "Check flapper seal",
        description: "Ensure flapper sits flat on valve seat",
        tips: ["Clean around valve seat if dirty"],
        warnings: []
      },
      {
        stepNumber: 3,
        title: "Adjust chain length",
        description: "Chain should have slight slack",
        tips: ["Too tight prevents sealing, too loose prevents opening"],
        warnings: []
      }
    ],
    safetyWarnings: ["Wear gloves when handling toilet parts"],
    isPublished: true
  },
  {
    title: "Unlock Frozen Computer",
    description: "Resolve unresponsive frozen computer",
    category: "Technology",
    difficulty: "beginner",
    estimatedTime: "5 minutes",
    severity: "medium",
    toolsNeeded: [],
    prerequisites: [],
    tags: ["computer", "frozen", "unresponsive", "crash"],
    steps: [
      {
        stepNumber: 1,
        title: "Wait 30 seconds",
        description: "Allow time for system to respond",
        tips: ["Sometimes system is just slow"],
        warnings: []
      },
      {
        stepNumber: 2,
        title: "Try Ctrl+Alt+Delete",
        description: "Attempt to open task manager",
        tips: ["This may help identify problem program"],
        warnings: []
      },
      {
        stepNumber: 3,
        title: "Force restart",
        description: "Hold power button for 10 seconds",
        tips: ["Last resort - may cause data loss"],
        warnings: ["Save work frequently to prevent data loss"]
      }
    ],
    safetyWarnings: ["Save work frequently to prevent data loss"],
    isPublished: true
  },
  {
    title: "Replace Smoke Detector Battery",
    description: "Change beeping smoke detector battery",
    category: "Home Maintenance",
    difficulty: "beginner",
    estimatedTime: "5 minutes",
    severity: "low",
    toolsNeeded: [],
    prerequisites: ["9V battery"],
    tags: ["smoke", "detector", "battery", "beeping"],
    steps: [
      {
        stepNumber: 1,
        title: "Locate beeping detector",
        description: "Follow sound to find the unit making noise",
        tips: ["Beeping usually means low battery"],
        warnings: []
      },
      {
        stepNumber: 2,
        title: "Remove detector",
        description: "Twist counterclockwise to remove from mount",
        tips: ["Some models just pull straight down"],
        warnings: []
      },
      {
        stepNumber: 3,
        title: "Replace battery",
        description: "Remove old battery and insert new 9V battery",
        tips: ["Check expiration date on new battery"],
        warnings: ["Test monthly and replace batteries annually"]
      }
    ],
    safetyWarnings: ["Test monthly and replace batteries annually"],
    isPublished: true
  },
  {
    title: "Fix Squeaky Door Hinges",
    description: "Eliminate annoying door squeaking sounds",
    category: "Home Maintenance",
    difficulty: "beginner",
    estimatedTime: "10 minutes",
    severity: "low",
    toolsNeeded: [],
    prerequisites: ["WD-40 or oil"],
    tags: ["door", "squeak", "hinge", "noise"],
    steps: [
      {
        stepNumber: 1,
        title: "Identify squeaky hinge",
        description: "Open and close door to locate source of noise",
        tips: ["Mark the problematic hinge"],
        warnings: []
      },
      {
        stepNumber: 2,
        title: "Clean hinges",
        description: "Wipe away dirt and old grease",
        tips: ["Use damp cloth first, then dry"],
        warnings: []
      },
      {
        stepNumber: 3,
        title: "Apply lubricant",
        description: "Spray WD-40 on hinge pins and pivot points",
        tips: ["A little goes a long way"],
        warnings: ["Avoid over-lubricating to prevent dirt buildup"]
      }
    ],
    safetyWarnings: ["Avoid over-lubricating to prevent dirt buildup"],
    isPublished: true
  },
  {
    title: "Reset Circuit Breaker",
    description: "Restore power by resetting tripped breaker",
    category: "Electrical",
    difficulty: "beginner",
    estimatedTime: "5 minutes",
    severity: "high",
    toolsNeeded: ["flashlight"],
    prerequisites: [],
    tags: ["circuit", "breaker", "electrical", "power", "outage"],
    steps: [
      {
        stepNumber: 1,
        title: "Locate electrical panel",
        description: "Find main breaker box in your home",
        tips: ["Usually in basement, garage, or utility room"],
        warnings: []
      },
      {
        stepNumber: 2,
        title: "Identify tripped breaker",
        description: "Look for breaker in middle position or with red indicator",
        tips: ["Tripped breakers don't fully switch to off position"],
        warnings: []
      },
      {
        stepNumber: 3,
        title: "Reset breaker",
        description: "Push breaker fully to off, then firmly to on position",
        tips: ["You should feel it click into place"],
        warnings: ["Never touch panel with wet hands"]
      }
    ],
    safetyWarnings: ["Never touch panel with wet hands"],
    isPublished: true
  },
  {
    title: "Troubleshoot Phone Not Charging",
    description: "Fix phone that won't charge properly",
    category: "Technology",
    difficulty: "beginner",
    estimatedTime: "10 minutes",
    severity: "medium",
    toolsNeeded: [],
    prerequisites: ["different charging cable"],
    tags: ["phone", "charging", "battery", "cable"],
    steps: [
      {
        stepNumber: 1,
        title: "Check charging cable",
        description: "Inspect cable for damage or debris",
        tips: ["Look for bent or broken connectors"],
        warnings: []
      },
      {
        stepNumber: 2,
        title: "Try different outlet",
        description: "Test with another wall outlet",
        tips: ["Some outlets may have poor connections"],
        warnings: []
      },
      {
        stepNumber: 3,
        title: "Clean charging port",
        description: "Gently remove lint with toothpick",
        tips: ["Be very gentle to avoid damage"],
        warnings: ["Avoid using damaged cables"]
      }
    ],
    safetyWarnings: ["Avoid using damaged cables"],
    isPublished: true
  }
];

// Create categories that don't exist
const categories = [
  { name: "Technology", slug: "technology", description: "Computer and electronic device troubleshooting", color: "#3B82F6" },
  { name: "Plumbing", slug: "plumbing", description: "Water system repairs and maintenance", color: "#06B6D4" },
  { name: "Automotive", slug: "automotive", description: "Car and vehicle troubleshooting", color: "#EF4444" },
  { name: "Electrical", slug: "electrical", description: "Electrical system repairs", color: "#F59E0B" },
  { name: "Home Maintenance", slug: "home-maintenance", description: "General household repairs", color: "#10B981" },
  { name: "Appliances", slug: "appliances", description: "Household appliance repairs", color: "#8B5CF6" },
  { name: "HVAC", slug: "hvac", description: "Heating and cooling system repairs", color: "#F97316" }
];

async function uploadTroubleshootingData() {
  try {
    console.log('Starting data upload...');
    
    // Find or create admin user
    let adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      console.log('No admin user found, creating one...');
      adminUser = new User({
        username: 'admin',
        email: 'admin@fixitflow.com',
        password: 'admin123',
        role: 'admin',
        profile: {
          firstName: 'Admin',
          lastName: 'User'
        }
      });
      await adminUser.save();
      console.log('Admin user created');
    }

    console.log(`Using admin user: ${adminUser.username}`);

    // Create categories
    console.log('Creating categories...');
    const categoryMap = {};
    
    for (const categoryData of categories) {
      let category = await Category.findOne({ slug: categoryData.slug });
      if (!category) {
        category = new Category(categoryData);
        await category.save();
        console.log(`Created category: ${category.name}`);
      }
      categoryMap[categoryData.name] = category._id;
    }

    // Create guides
    console.log('Creating troubleshooting guides...');
    let successCount = 0;
    let errorCount = 0;

    for (const flowData of troubleshootingFlows) {
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
          views: Math.floor(Math.random() * 1000), // Add some random view counts
          completions: Math.floor(Math.random() * 500),
          rating: {
            average: (Math.random() * 2 + 3), // Random rating between 3-5
            count: Math.floor(Math.random() * 100)
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

    console.log('\n=== UPLOAD COMPLETE ===');
    console.log(`Successfully created: ${successCount} guides`);
    console.log(`Errors: ${errorCount}`);
    console.log(`Categories created: ${Object.keys(categoryMap).length}`);
    
    process.exit(0);
    
  } catch (error) {
    console.error('Upload failed:', error);
    process.exit(1);
  }
}

// Run the upload
uploadTroubleshootingData();
