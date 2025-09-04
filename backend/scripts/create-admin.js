const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function createAdmin() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || process.env.DATABASE_URL);
    console.log('✅ Connected to MongoDB');

    // Check if admin exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists:');
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Name: ${existingAdmin.fullName}`);
      console.log('');
      console.log('🔐 Try logging in with:');
      console.log('   Email: admin@fixitflow.com');
      console.log('   Password: admin123');
      process.exit(0);
    }

    // Create admin user with proper schema
    const adminUser = new User({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@fixitflow.com',
      password: 'admin123',
      role: 'admin',
      isEmailVerified: true,  // Skip email verification for admin
      isActive: true
    });

    await adminUser.save();
    
    console.log('✅ Admin user created successfully!');
    console.log('');
    console.log('🔐 Admin Login Credentials:');
    console.log('   Email: admin@fixitflow.com');
    console.log('   Password: admin123');
    console.log('');
    console.log('🌟 You can now log in as admin in your app!');
    console.log('📝 Remember to change the password after first login');
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    
    if (error.code === 11000) {
      console.log('');
      console.log('🔍 It seems like there might be a duplicate email or data issue.');
      console.log('💡 Try logging in with: admin@fixitflow.com / admin123');
    }
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

createAdmin();
