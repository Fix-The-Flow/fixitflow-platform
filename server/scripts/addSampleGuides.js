const mongoose = require('mongoose');
require('dotenv').config();

const { User, Category, Guide } = require('../models');

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

const addSampleData = async () => {
  try {
    await connectDB();

    console.log('🔍 Setting up sample data...');

    // Find or create admin user
    let adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      console.log('Creating admin user...');
      adminUser = await User.create({
        username: 'admin',
        email: 'admin@fixitflow.com',
        password: 'admin123',
        role: 'admin',
        profile: {
          firstName: 'Admin',
          lastName: 'User'
        }
      });
    }
    console.log(`✅ Admin user: ${adminUser.email}`);

    // Create categories
    const categories = [
      { name: 'Technology', slug: 'technology', description: 'Computer, phone, and tech issues', icon: '💻', color: '#3B82F6' },
      { name: 'Home Maintenance', slug: 'home-maintenance', description: 'DIY repairs and maintenance', icon: '🏠', color: '#10B981' },
      { name: 'Automotive', slug: 'automotive', description: 'Car and vehicle troubleshooting', icon: '🚗', color: '#F59E0B' }
    ];

    const createdCategories = {};
    for (const catData of categories) {
      let category = await Category.findOne({ slug: catData.slug });
      if (!category) {
        category = await Category.create(catData);
        console.log(`✅ Created category: ${category.name}`);
      }
      createdCategories[catData.slug] = category;
    }

    // Create sample guides
    const guides = [
      {
        title: 'Fix Slow WiFi Connection - Easy Steps',
        slug: 'fix-slow-wifi-connection',
        description: 'Is your WiFi running slowly? Follow these simple steps to diagnose and fix common WiFi speed issues in just minutes.',
        category: createdCategories['technology']._id,
        severity: 'medium',
        difficulty: 'beginner',
        estimatedTime: '10-15 minutes',
        tags: ['wifi', 'internet', 'connection', 'speed'],
        steps: [
          {
            stepNumber: 1,
            title: 'Restart Your Router',
            description: 'Unplug your router for 30 seconds, then plug it back in. Wait 2-3 minutes for all lights to turn solid green.',
            tips: ['Look for solid green lights on your router when it\'s ready', 'This clears temporary connection issues'],
            warnings: ['Don\'t skip the 30-second wait time']
          },
          {
            stepNumber: 2,
            title: 'Move Closer to Router',
            description: 'Test your internet speed when standing close to your router. If it improves significantly, distance or obstacles are the issue.',
            tips: ['Use an online speed test', 'Thick walls and metal objects can block WiFi signals']
          },
          {
            stepNumber: 3,
            title: 'Disconnect Other Devices',
            description: 'Temporarily disconnect other devices using WiFi (phones, tablets, smart TVs) to see if speed improves.',
            tips: ['Check if anyone is streaming videos or downloading files', 'Smart home devices can consume bandwidth']
          }
        ],
        prerequisites: ['Basic router access'],
        toolsNeeded: ['Computer or smartphone'],
        safetyWarnings: ['Ensure router ventilation is not blocked'],
        author: adminUser._id,
        isPublished: true,
        mascotCharacter: 'robot'
      },
      {
        title: 'Advanced Network Diagnostics - Professional Guide',
        slug: 'advanced-network-diagnostics',
        description: 'Professional-level network troubleshooting with advanced diagnostic tools and techniques for complex connectivity issues.',
        category: createdCategories['technology']._id,
        severity: 'high',
        difficulty: 'advanced',
        estimatedTime: '45-60 minutes',
        tags: ['networking', 'diagnostics', 'advanced', 'professional'],
        steps: [
          {
            stepNumber: 1,
            title: 'Network Speed Analysis',
            description: 'Use advanced tools like iperf3 and wireshark to measure bandwidth, latency, and packet loss across your network infrastructure.',
            tips: ['Run tests at different times of day', 'Compare wired vs wireless speeds'],
            warnings: ['Some tools require admin privileges']
          },
          {
            stepNumber: 2,
            title: 'Channel Interference Analysis',
            description: 'Scan for WiFi channel interference using WiFi analyzer tools and optimize your router\'s channel settings for best performance.',
            tips: ['Channels 1, 6, and 11 are best for 2.4GHz', '5GHz has more available channels']
          },
          {
            stepNumber: 3,
            title: 'Quality of Service (QoS) Configuration',
            description: 'Configure advanced QoS settings to prioritize critical traffic and manage bandwidth allocation for different devices and applications.',
            tips: ['Prioritize video calls over file downloads', 'Set bandwidth limits for non-critical devices']
          }
        ],
        prerequisites: ['Advanced networking knowledge', 'Router admin access'],
        toolsNeeded: ['Network analysis software', 'Command line access'],
        safetyWarnings: ['Back up router settings before changes', 'Document original settings'],
        author: adminUser._id,
        isPublished: true,
        mascotCharacter: 'wizard'
      },
      {
        title: 'Unclog a Drain - Quick DIY Fix',
        slug: 'unclog-drain-diy-fix',
        description: 'Simple methods to unclog most drain blockages using common household items. No plumber needed for minor clogs!',
        category: createdCategories['home-maintenance']._id,
        severity: 'medium',
        difficulty: 'beginner',
        estimatedTime: '20-30 minutes',
        tags: ['plumbing', 'drain', 'clog', 'diy'],
        steps: [
          {
            stepNumber: 1,
            title: 'Hot Water Flush',
            description: 'Boil a large pot of water and pour it slowly down the drain in 2-3 stages, allowing it to work between pours.',
            tips: ['Use the hottest water possible', 'Pour slowly to avoid splashing'],
            warnings: ['Be careful with hot water to avoid burns', 'Don\'t use boiling water on PVC pipes']
          },
          {
            stepNumber: 2,
            title: 'Baking Soda and Vinegar Treatment',
            description: 'Pour 1/2 cup baking soda down the drain, followed by 1/2 cup white vinegar. Cover with a drain plug or cloth for 15 minutes.',
            tips: ['The fizzing action helps break up clogs', 'Keep covered to maintain pressure']
          },
          {
            stepNumber: 3,
            title: 'Final Hot Water Rinse',
            description: 'After 15 minutes, remove the cover and flush with another pot of hot water to clear loosened debris.',
            tips: ['Run hot tap water for a few minutes afterward', 'Repeat process if partially successful']
          }
        ],
        prerequisites: ['Basic kitchen supplies'],
        toolsNeeded: ['Large pot', 'Baking soda', 'White vinegar', 'Drain plug or cloth'],
        safetyWarnings: ['Never mix different drain cleaning chemicals', 'Ensure good ventilation', 'Use hot water carefully'],
        author: adminUser._id,
        isPublished: true,
        mascotCharacter: 'bear'
      },
      {
        title: 'Car Battery Troubleshooting Guide',
        slug: 'car-battery-troubleshooting',
        description: 'Complete guide to diagnosing and fixing car battery issues, from simple connections to replacement decisions.',
        category: createdCategories['automotive']._id,
        severity: 'high',
        difficulty: 'intermediate',
        estimatedTime: '30-45 minutes',
        tags: ['car', 'battery', 'automotive', 'electrical'],
        steps: [
          {
            stepNumber: 1,
            title: 'Visual Inspection',
            description: 'Check battery terminals for corrosion (white/green buildup), loose connections, and physical damage to the battery case.',
            tips: ['Look for swelling or cracks in the battery case', 'Corrosion appears as white or green powder'],
            warnings: ['Turn off engine and remove keys before inspection', 'Wear safety glasses and gloves']
          },
          {
            stepNumber: 2,
            title: 'Clean Battery Terminals',
            description: 'If corrosion is present, disconnect terminals (negative first) and clean with baking soda solution and wire brush.',
            tips: ['Mix baking soda with water to neutralize acid', 'Clean both terminals and cable ends'],
            warnings: ['Always remove negative terminal first', 'Avoid getting baking soda solution in battery cells']
          },
          {
            stepNumber: 3,
            title: 'Test Battery Voltage',
            description: 'Use a multimeter to test battery voltage. Should read 12.6V or higher when engine is off, 13.5-14.5V when running.',
            tips: ['Test with engine off first, then while running', 'Temperature affects readings'],
            warnings: ['Don\'t let multimeter probes touch each other', 'Ensure good probe contact']
          }
        ],
        prerequisites: ['Basic automotive knowledge', 'Safety equipment'],
        toolsNeeded: ['Multimeter', 'Wire brush', 'Baking soda', 'Safety glasses', 'Gloves'],
        safetyWarnings: ['Battery acid is corrosive', 'Risk of electrical shock', 'Hydrogen gas is explosive - no sparks'],
        author: adminUser._id,
        isPublished: true,
        mascotCharacter: 'dog'
      }
    ];

    // Create guides
    for (const guideData of guides) {
      const existingGuide = await Guide.findOne({ slug: guideData.slug });
      if (!existingGuide) {
        const guide = await Guide.create(guideData);
        console.log(`✅ Created guide: ${guide.title}`);
      } else {
        console.log(`⚠️ Guide "${guideData.title}" already exists, skipping...`);
      }
    }

    console.log('🎉 Sample data setup complete!');
    console.log('\n📋 Available test guides:');
    console.log('- /guides/fix-slow-wifi-connection (Beginner, Technology)');
    console.log('- /guides/advanced-network-diagnostics (Advanced, Technology)'); 
    console.log('- /guides/unclog-drain-diy-fix (Beginner, Home Maintenance)');
    console.log('- /guides/car-battery-troubleshooting (Intermediate, Automotive)');
    
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

addSampleData();
