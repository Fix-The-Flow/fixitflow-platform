const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');
const Troubleshooting = require('../models/Troubleshooting');
const logger = require('../config/logger');

// Connect to database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fixitflow', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('📦 MongoDB Connected for seeding');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

// Sample users data
const sampleUsers = [
  {
    firstName: 'John',
    lastName: 'Admin',
    username: 'admin',
    email: 'admin@fixitflow.com',
    password: 'Admin123!',
    role: 'admin',
    isEmailVerified: true,
    subscription: {
      plan: 'annual',
      status: 'active',
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      features: {
        complexGuides: true,
        aiChat: true,
        videoChat: true,
        linkedVideos: true
      }
    }
  },
  {
    firstName: 'Jane',
    lastName: 'Moderator',
    username: 'moderator',
    email: 'mod@fixitflow.com',
    password: 'Mod123!',
    role: 'moderator',
    isEmailVerified: true,
    subscription: {
      plan: 'monthly',
      status: 'active',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      features: {
        complexGuides: true,
        aiChat: true,
        videoChat: true,
        linkedVideos: true
      }
    }
  },
  {
    firstName: 'Mike',
    lastName: 'Premium',
    username: 'mike_premium',
    email: 'premium@example.com',
    password: 'Premium123!',
    role: 'user',
    isEmailVerified: true,
    subscription: {
      plan: 'monthly',
      status: 'active',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      features: {
        complexGuides: true,
        aiChat: true,
        videoChat: true,
        linkedVideos: true
      }
    }
  },
  {
    firstName: 'Sarah',
    lastName: 'Free',
    username: 'sarah_free',
    email: 'free@example.com',
    password: 'Free123!',
    role: 'user',
    isEmailVerified: true
  }
];

// Sample troubleshooting articles
const sampleArticles = [
  {
    title: 'Phone Running Slow - Complete Troubleshooting Guide',
    description: 'Is your smartphone running slower than usual? This comprehensive guide will help you identify and fix the most common causes of slow phone performance.',
    category: 'mobile-devices',
    difficulty: 'beginner',
    estimatedTime: { value: 15, unit: 'minutes' },
    problemSigns: [
      'Apps take longer than usual to open',
      'Phone freezes or becomes unresponsive',
      'Battery drains quickly',
      'Interface lags when scrolling or switching apps'
    ],
    possibleCauses: [
      { cause: 'Insufficient storage space', probability: 80 },
      { cause: 'Too many apps running in background', probability: 70 },
      { cause: 'Outdated software', probability: 60 },
      { cause: 'Cache buildup', probability: 50 },
      { cause: 'Hardware aging', probability: 30 }
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Check Available Storage',
        description: 'Go to Settings > Storage and check how much free space you have. If you have less than 1GB free, your phone will slow down significantly.',
        tips: ['Delete unused photos and videos', 'Uninstall apps you don\'t use'],
        estimatedTime: 3
      },
      {
        stepNumber: 2,
        title: 'Close Background Apps',
        description: 'Open your recent apps menu and swipe away apps you\'re not currently using. This frees up RAM and processing power.',
        tips: ['On iPhone: Double-tap home button and swipe up', 'On Android: Use the recent apps button'],
        estimatedTime: 2
      },
      {
        stepNumber: 3,
        title: 'Clear App Cache',
        description: 'Go to Settings > Apps and clear cache for frequently used apps like social media, browsers, and games.',
        estimatedTime: 5
      },
      {
        stepNumber: 4,
        title: 'Update Your Software',
        description: 'Check for and install any available system updates. Go to Settings > System Update.',
        estimatedTime: 10
      },
      {
        stepNumber: 5,
        title: 'Restart Your Phone',
        description: 'Turn your phone completely off and on again. This clears temporary files and refreshes system processes.',
        estimatedTime: 2
      }
    ],
    safetyPrecautions: [
      'Back up important data before making changes',
      'Ensure your phone is charged or connected to power during updates'
    ],
    alternatives: [
      {
        title: 'Factory Reset',
        description: 'If other methods don\'t work, consider backing up your data and performing a factory reset.',
        whenToUse: 'When the phone is severely slow and other methods haven\'t helped'
      }
    ],
    status: 'published',
    isActive: true,
    isPremiumContent: false
  },
  {
    title: 'Toilet Keeps Running - Quick Fix Guide',
    description: 'A running toilet can waste hundreds of gallons of water per day. Learn how to diagnose and fix the most common causes of a toilet that won\'t stop running.',
    category: 'plumbing',
    difficulty: 'beginner',
    estimatedTime: { value: 20, unit: 'minutes' },
    problemSigns: [
      'Water continuously runs in the toilet bowl',
      'You hear constant water running sound',
      'Water bill has increased unexpectedly',
      'Need to jiggle the handle to stop running'
    ],
    possibleCauses: [
      { cause: 'Flapper not sealing properly', probability: 85 },
      { cause: 'Chain too long or short', probability: 70 },
      { cause: 'Water level too high', probability: 60 },
      { cause: 'Worn flush valve seat', probability: 40 }
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Remove Toilet Tank Lid',
        description: 'Carefully lift the heavy ceramic lid off the toilet tank and set it aside in a safe place.',
        warnings: [
          { level: 'warning', message: 'Tank lid is heavy and fragile - handle with care' }
        ],
        estimatedTime: 1
      },
      {
        stepNumber: 2,
        title: 'Check the Flapper',
        description: 'Look at the rubber flapper at the bottom of the tank. It should be sitting flat against the valve seat. If it\'s warped or has debris underneath, clean or adjust it.',
        estimatedTime: 5
      },
      {
        stepNumber: 3,
        title: 'Adjust the Chain',
        description: 'The chain connecting the flush handle to the flapper should have slight slack. If too tight, the flapper won\'t seal. If too loose, it won\'t lift properly.',
        estimatedTime: 3
      },
      {
        stepNumber: 4,
        title: 'Check Water Level',
        description: 'Water should be about 1 inch below the rim of the overflow tube. If higher, adjust the float or bend the float arm.',
        estimatedTime: 5
      },
      {
        stepNumber: 5,
        title: 'Test the Fix',
        description: 'Replace the tank lid and flush the toilet. The running should stop within 30 seconds of flushing.',
        estimatedTime: 2
      }
    ],
    safetyPrecautions: [
      'Turn off water supply if major adjustments needed',
      'Wash hands thoroughly after working in toilet tank'
    ],
    whenToCallProfessional: 'If the flush valve seat is cracked or if you\'re not comfortable working with plumbing components',
    status: 'published',
    isActive: true,
    isPremiumContent: false
  },
  {
    title: 'Car Won\'t Start - Professional Diagnostic Guide',
    description: 'A comprehensive troubleshooting guide for diagnosing why your car won\'t start, covering everything from simple battery issues to complex electrical problems.',
    category: 'automotive',
    difficulty: 'intermediate',
    estimatedTime: { value: 45, unit: 'minutes' },
    problemSigns: [
      'Engine cranks but doesn\'t start',
      'No sound when turning the key',
      'Clicking sound when trying to start',
      'Dashboard lights dim or don\'t come on'
    ],
    possibleCauses: [
      { cause: 'Dead or weak battery', probability: 40 },
      { cause: 'Bad starter motor', probability: 25 },
      { cause: 'Fuel system issues', probability: 20 },
      { cause: 'Ignition system problems', probability: 15 }
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Check Battery Connections',
        description: 'Open the hood and inspect battery terminals for corrosion, looseness, or damage. Clean and tighten if necessary.',
        warnings: [
          { level: 'danger', message: 'Always remove negative terminal first and reconnect it last' }
        ],
        estimatedTime: 10
      },
      {
        stepNumber: 2,
        title: 'Test Battery Voltage',
        description: 'Use a multimeter to test battery voltage. Should read 12.6V or higher when engine is off, 13.5-14.5V when running.',
        estimatedTime: 5
      },
      {
        stepNumber: 3,
        title: 'Check Starter System',
        description: 'Listen for clicking sounds when turning key. Single click may indicate bad starter relay, rapid clicking suggests low battery.',
        estimatedTime: 5
      },
      {
        stepNumber: 4,
        title: 'Inspect Fuel System',
        description: 'Check fuel gauge and listen for fuel pump activation when turning key to ON position.',
        estimatedTime: 5
      },
      {
        stepNumber: 5,
        title: 'Test Ignition System',
        description: 'Check for spark at spark plugs using a spark tester tool.',
        warnings: [
          { level: 'warning', message: 'Be careful of electrical shock when testing ignition' }
        ],
        estimatedTime: 15
      }
    ],
    toolsRequired: ['Multimeter', 'Basic hand tools', 'Spark tester', 'Safety gloves'],
    safetyPrecautions: [
      'Ensure parking brake is engaged',
      'Work in well-ventilated area',
      'Disconnect battery when working on electrical components',
      'Never smoke or use open flames near fuel system'
    ],
    whenToCallProfessional: 'If you\'re not comfortable working with automotive electrical systems or if the problem persists after basic checks',
    status: 'published',
    isActive: true,
    isPremiumContent: true
  }
];

// Seed function
const seedDatabase = async () => {
  try {
    await connectDB();

    console.log('🔄 Clearing existing data...');
    await User.deleteMany({});
    await Troubleshooting.deleteMany({});

    console.log('👥 Creating users...');
    const createdUsers = [];
    
    for (const userData of sampleUsers) {
      const salt = await bcrypt.genSalt(12);
      userData.password = await bcrypt.hash(userData.password, salt);
      
      const user = await User.create(userData);
      createdUsers.push(user);
      console.log(`Created user: ${user.email}`);
    }

    console.log('📚 Creating troubleshooting articles...');
    const adminUser = createdUsers.find(u => u.role === 'admin');
    
    for (const articleData of sampleArticles) {
      articleData.author = adminUser._id;
      
      const article = await Troubleshooting.create(articleData);
      console.log(`Created article: ${article.title}`);
    }

    console.log('✅ Database seeded successfully!');
    console.log('\n📝 Test Accounts Created:');
    console.log('Admin: admin@fixitflow.com / Admin123!');
    console.log('Moderator: mod@fixitflow.com / Mod123!');
    console.log('Premium User: premium@example.com / Premium123!');
    console.log('Free User: free@example.com / Free123!');
    
    process.exit(0);

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

// Run seeding
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };
