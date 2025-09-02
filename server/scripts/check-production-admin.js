const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { User } = require('../models');
require('dotenv').config();

// Use production MongoDB URI
const MONGODB_URI = 'mongodb+srv://fixitflow-admin:FixItFlow2024!@cluster0.zpluywp.mongodb.net/fixitflow?retryWrites=true&w=majority&appName=Cluster0';

async function checkAndCreateAdmin() {
  try {
    console.log('Connecting to production MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to production database');

    // Check existing admin users
    const adminUsers = await User.find({ role: 'admin' });
    console.log(`Found ${adminUsers.length} admin users:`);
    
    adminUsers.forEach(admin => {
      console.log(`- Email: ${admin.email}, Username: ${admin.username}`);
    });

    // Create/update admin user
    const adminEmail = 'admin@fixitflow.online';
    const adminPassword = 'FixItFlow2024!';

    let adminUser = await User.findOne({ email: adminEmail });

    if (!adminUser) {
      console.log('\nCreating new admin user...');
      const hashedPassword = await bcrypt.hash(adminPassword, 12);
      
      adminUser = new User({
        username: 'fixitflow-admin',
        email: adminEmail,
        password: hashedPassword,
        role: 'admin',
        isEmailVerified: true,
        profile: {
          firstName: 'FixItFlow',
          lastName: 'Admin'
        }
      });

      await adminUser.save();
      console.log('✅ Admin user created successfully!');
    } else {
      console.log('\nAdmin user already exists. Updating password...');
      const hashedPassword = await bcrypt.hash(adminPassword, 12);
      adminUser.password = hashedPassword;
      adminUser.role = 'admin';
      await adminUser.save();
      console.log('✅ Admin password updated!');
    }

    console.log('\n🎯 ADMIN LOGIN CREDENTIALS:');
    console.log('Email: admin@fixitflow.online');
    console.log('Password: FixItFlow2024!');
    console.log('\nUse these to login at: https://fixitflow-glhcrjdxy-terrytaylorwilliams-1078s-projects.vercel.app/login');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkAndCreateAdmin();
