const mongoose = require('mongoose');
require('dotenv').config();

const Troubleshooting = require('../models/Troubleshooting');
const User = require('../models/User');

// Connect to database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📦 MongoDB Connected');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

// Test guides data
const testGuides = [
  {
    title: 'Fix Slow WiFi Connection - Easy Steps',
    slug: 'fix-slow-wifi-connection',
    description: 'Is your WiFi running slowly? Follow these simple steps to diagnose and fix common WiFi speed issues.',
    category: 'technology',
    difficulty: 'beginner',
    estimatedTime: { value: 10, unit: 'minutes' },
    problemSigns: [
      'Web pages take forever to load',
      'Videos buffer constantly',
      'Downloads are very slow',
      'WiFi signal appears strong but speed is poor'
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Restart Your Router',
        description: 'Unplug your router for 30 seconds, then plug it back in. Wait 2-3 minutes for it to fully restart.',
        estimatedTime: 5,
        tips: ['Look for solid green lights on your router when it\'s ready']
      },
      {
        stepNumber: 2,
        title: 'Move Closer to Router',
        description: 'Test your internet speed when standing close to your router. If it improves, distance or obstacles might be the issue.',
        estimatedTime: 2
      },
      {
        stepNumber: 3,
        title: 'Disconnect Other Devices',
        description: 'Temporarily disconnect other devices using WiFi to see if the speed improves.',
        estimatedTime: 3,
        tips: ['Smart TVs, phones, and tablets all use bandwidth']
      }
    ],
    status: 'published',
    isActive: true,
    isPremiumContent: false
  },
  {
    title: 'Advanced Network Diagnostics - Professional Guide',
    slug: 'advanced-network-diagnostics',
    description: 'Professional-level network troubleshooting with advanced diagnostic tools and techniques.',
    category: 'technology',
    difficulty: 'advanced',
    estimatedTime: { value: 45, unit: 'minutes' },
    problemSigns: [
      'Intermittent connection drops',
      'Slow speeds at specific times',
      'Unable to connect certain devices',
      'Network conflicts'
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Network Speed Analysis',
        description: 'Use advanced tools to measure bandwidth, latency, and packet loss across your network.',
        estimatedTime: 10,
        videoUrl: 'https://example.com/network-analysis-video'
      },
      {
        stepNumber: 2,
        title: 'Channel Interference Check',
        description: 'Scan for WiFi channel interference and optimize your router\'s channel settings.',
        estimatedTime: 15,
        videoUrl: 'https://example.com/channel-optimization-video'
      },
      {
        stepNumber: 3,
        title: 'Quality of Service (QoS) Setup',
        description: 'Configure advanced QoS settings to prioritize important traffic.',
        estimatedTime: 20
      }
    ],
    status: 'published',
    isActive: true,
    isPremiumContent: true
  },
  {
    title: 'Clogged Drain Quick Fix',
    slug: 'clogged-drain-quick-fix',
    description: 'Simple methods to unclog most drain blockages using common household items.',
    category: 'home-maintenance',
    difficulty: 'beginner',
    estimatedTime: { value: 20, unit: 'minutes' },
    problemSigns: [
      'Water drains very slowly',
      'Water doesn\'t drain at all',
      'Bad smell from drain',
      'Gurgling sounds when draining'
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Try Hot Water Flush',
        description: 'Boil a large pot of water and pour it slowly down the drain in 2-3 stages.',
        estimatedTime: 5,
        tips: ['Be careful with hot water - pour slowly to avoid splashing']
      },
      {
        stepNumber: 2,
        title: 'Use Baking Soda and Vinegar',
        description: 'Pour 1/2 cup baking soda down the drain, followed by 1/2 cup white vinegar. Cover with a plug for 15 minutes.',
        estimatedTime: 15
      },
      {
        stepNumber: 3,
        title: 'Final Hot Water Flush',
        description: 'Pour another pot of hot water down the drain to flush out the loosened debris.',
        estimatedTime: 2
      }
    ],
    safetyPrecautions: [
      'Never mix different drain cleaning chemicals',
      'Use hot water carefully to avoid burns'
    ],
    status: 'published',
    isActive: true,
    isPremiumContent: false
  }
];

const addTestGuides = async () => {
  try {
    await connectDB();

    // Find admin user to use as author
    console.log('🔍 Finding admin user...');
    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      console.error('❌ No admin user found! Please create an admin user first.');
      process.exit(1);
    }
    console.log(`✅ Found admin user: ${adminUser.email}`);

    console.log('🔄 Adding test guides...');
    
    for (const guide of testGuides) {
      guide.author = adminUser._id; // Add author to each guide
      try {
        const existingGuide = await Troubleshooting.findOne({ slug: guide.slug });
        if (existingGuide) {
          console.log(`Guide "${guide.title}" already exists, skipping...`);
          continue;
        }

        const newGuide = await Troubleshooting.create(guide);
        console.log(`✅ Created guide: ${newGuide.title}`);
      } catch (err) {
        console.log(`❌ Failed to create guide "${guide.title}":`, err.message);
      }
    }

    console.log('✅ Test guides added successfully!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

addTestGuides();
