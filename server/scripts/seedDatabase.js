const mongoose = require('mongoose');
require('dotenv').config();

const { User, Category, Guide, Ebook, MascotTip } = require('../models');

const seedData = async () => {
  try {
    console.log('🔧 Seed Environment Check:');
    console.log('MONGODB_URI:', process.env.MONGODB_URI);
    console.log('Working directory:', process.cwd());
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fixitflow');
    console.log('Connected to MongoDB for seeding');
    console.log('Database name:', mongoose.connection.name);
    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Category.deleteMany({}),
      Guide.deleteMany({}),
      Ebook.deleteMany({}),
      MascotTip.deleteMany({})
    ]);

    console.log('Cleared existing data');

    // Create admin user
    const adminUser = new User({
      username: 'admin',
      email: 'admin@fixitflow.com',
      password: 'admin123',
      role: 'admin',
      profile: {
        firstName: 'FixItFlow',
        lastName: 'Admin'
      }
    });
    
    try {
      await adminUser.save();
      console.log('Created admin user with ID:', adminUser._id);
    } catch (userError) {
      console.error('Admin user creation error:', userError);
      throw userError;
    }

    // Create sample user
    const sampleUser = new User({
      username: 'johndoe',
      email: 'john@example.com',
      password: 'password123',
      profile: {
        firstName: 'John',
        lastName: 'Doe'
      }
    });
    await sampleUser.save();
    console.log('Created sample user');

    // Create categories
    const categories = [
      {
        name: 'Tech Support',
        slug: 'tech-support',
        description: 'Computer, phone, and gadget troubleshooting',
        icon: 'smartphone',
        color: '#3B82F6'
      },
      {
        name: 'Home Repair',
        slug: 'home-repair',
        description: 'Fix common household problems and maintenance',
        icon: 'home',
        color: '#10B981'
      },
      {
        name: 'DIY Projects',
        slug: 'diy-projects',
        description: 'Creative do-it-yourself projects and crafts',
        icon: 'wrench',
        color: '#F59E0B'
      },
      {
        name: 'Self-Care',
        slug: 'self-care',
        description: 'Health, wellness, and personal care solutions',
        icon: 'heart',
        color: '#EF4444'
      },
      {
        name: 'Pet Care',
        slug: 'pet-care',
        description: 'Taking care of your furry friends',
        icon: 'pawprint',
        color: '#8B5CF6'
      },
      {
        name: 'Automotive',
        slug: 'automotive',
        description: 'Car maintenance and repair guides',
        icon: 'car',
        color: '#06B6D4'
      }
    ];

    const savedCategories = await Category.insertMany(categories);
    console.log('Created categories');

    // Create sample guides
    const guides = [
      {
        title: 'Fix Slow Internet Connection',
        slug: 'fix-slow-internet-connection',
        description: 'Step-by-step guide to diagnose and fix slow internet speeds at home.',
        category: savedCategories[0]._id,
        severity: 'medium',
        difficulty: 'beginner',
        estimatedTime: '15-30 minutes',
        tags: ['internet', 'wifi', 'networking', 'speed'],
        steps: [
          {
            stepNumber: 1,
            title: 'Check your internet speed',
            description: 'Use a speed test website to measure your current internet speed.',
            tips: ['Try multiple speed test sites for accuracy', 'Test at different times of day'],
            mascotTip: 'Remember, your internet speed can vary throughout the day! 📊'
          },
          {
            stepNumber: 2,
            title: 'Restart your router',
            description: 'Unplug your router for 30 seconds, then plug it back in.',
            tips: ['Wait for all lights to stabilize before testing'],
            warnings: ['Make sure no one is in an important video call first!'],
            mascotTip: 'The good old "turn it off and on again" - works like magic! ✨'
          },
          {
            stepNumber: 3,
            title: 'Check for interference',
            description: 'Move closer to your router and check for obstacles or interference.',
            tips: ['Walls, microwaves, and other electronics can interfere with WiFi'],
            mascotTip: 'Your WiFi signal is like a shy friend - it doesnt like crowds! 📶'
          }
        ],
        author: adminUser._id,
        isPublished: true,
        views: 1250,
        completions: 890,
        mascotCharacter: 'robot'
      },
      {
        title: 'Unclog a Kitchen Sink',
        slug: 'unclog-kitchen-sink',
        description: 'Simple methods to clear kitchen sink blockages without calling a plumber.',
        category: savedCategories[1]._id,
        severity: 'low',
        difficulty: 'beginner',
        estimatedTime: '10-20 minutes',
        tags: ['plumbing', 'kitchen', 'sink', 'drainage'],
        steps: [
          {
            stepNumber: 1,
            title: 'Remove visible debris',
            description: 'Take out any food scraps or debris you can see in the drain.',
            safetyWarnings: ['Wear rubber gloves to protect your hands'],
            mascotTip: 'Gloves are your best friend for this messy job! 🧤'
          },
          {
            stepNumber: 2,
            title: 'Use hot water flush',
            description: 'Pour a pot of boiling water down the drain to dissolve grease.',
            warnings: ['Be careful with boiling water - pour slowly'],
            mascotTip: 'Hot water is like a spa day for your pipes! 🌊'
          }
        ],
        author: adminUser._id,
        isPublished: true,
        views: 980,
        completions: 720,
        mascotCharacter: 'bear'
      },
      {
        title: 'Build a Simple Bird Feeder',
        slug: 'build-simple-bird-feeder',
        description: 'Create an attractive bird feeder using common household items.',
        category: savedCategories[2]._id,
        severity: 'low',
        difficulty: 'beginner',
        estimatedTime: '30-45 minutes',
        tags: ['woodworking', 'crafts', 'birds', 'garden'],
        toolsNeeded: ['Plastic bottle', 'Wooden spoons', 'String', 'Birdseed'],
        steps: [
          {
            stepNumber: 1,
            title: 'Prepare the bottle',
            description: 'Clean a large plastic bottle and remove all labels.',
            tips: ['Use warm soapy water to remove sticky residue'],
            mascotTip: 'A clean start makes for a beautiful finish! ✨'
          }
        ],
        author: adminUser._id,
        isPublished: true,
        views: 650,
        completions: 420,
        mascotCharacter: 'cat'
      }
    ];

    const savedGuides = await Guide.insertMany(guides);
    console.log('Created sample guides');

    // Create sample eBook
    const sampleEbook = new Ebook({
      title: 'The Complete Home Tech Troubleshooting Guide',
      slug: 'complete-home-tech-guide',
      description: 'Everything you need to know about fixing common technology problems at home.',
      author: adminUser._id,
      category: savedCategories[0]._id,
      price: 19.99,
      content: {
        introduction: 'Welcome to your comprehensive guide for solving tech problems at home...',
        chapters: [
          {
            title: 'Internet and WiFi Issues',
            content: 'In this chapter, we\'ll cover the most common internet connectivity problems...',
            guides: [savedGuides[0]._id]
          }
        ],
        conclusion: 'You now have the tools and knowledge to tackle most home tech issues...'
      },
      metadata: {
        pageCount: 45,
        wordCount: 12000,
        readingTime: '60 minutes'
      },
      isPublished: true,
      aiGenerated: true
    });
    await sampleEbook.save();
    console.log('Created sample eBook');

    // Create mascot tips
    const mascotTips = [
      {
        context: 'welcome',
        message: 'Hey there! Welcome to FixItFlow! I\'m here to help you succeed. 🌟',
        character: 'wizard'
      },
      {
        context: 'step',
        message: 'Take your time with this step - there\'s no rush! 🐌',
        character: 'bear'
      },
      {
        context: 'completion',
        message: 'Fantastic work! You\'re becoming quite the problem-solver! 🎉',
        character: 'wizard'
      },
      {
        context: 'safety',
        message: 'Safety first! Make sure you have the right protective gear. 🦺',
        character: 'robot'
      },
      {
        context: 'encouragement',
        message: 'Don\'t give up! Every expert was once a beginner. 💪',
        character: 'dog'
      }
    ];

    await MascotTip.insertMany(mascotTips);
    console.log('Created mascot tips');

    console.log('✅ Database seeded successfully!');
    console.log('Admin login: admin@fixitflow.com / admin123');
    console.log('User login: john@example.com / password123');
    
  } catch (error) {
    console.error('Seeding error:', error);
  } finally {
    mongoose.connection.close();
  }
};

seedData();
