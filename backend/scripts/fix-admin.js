const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function fixAdmin() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || process.env.DATABASE_URL);
    console.log('✅ Connected to MongoDB');

    // Find admin user
    const adminUser = await User.findOne({ role: 'admin' });
    
    if (!adminUser) {
      console.log('❌ No admin user found. Please run create-admin.js first.');
      process.exit(1);
    }

    console.log('🔍 Current admin user:');
    console.log('   Email:', adminUser.email);
    console.log('   First Name:', adminUser.firstName || 'MISSING');
    console.log('   Last Name:', adminUser.lastName || 'MISSING');
    console.log('   Username:', adminUser.username || 'N/A');

    // Fix admin user if missing firstName/lastName
    if (!adminUser.firstName || !adminUser.lastName) {
      console.log('🔧 Fixing admin user schema...');
      
      adminUser.firstName = adminUser.firstName || 'Admin';
      adminUser.lastName = adminUser.lastName || 'User';
      adminUser.isEmailVerified = true;
      adminUser.isActive = true;
      
      // Remove username field if it exists (it's not in the current schema)
      if (adminUser.username !== undefined) {
        adminUser.username = undefined;
      }
      
      await adminUser.save();
      console.log('✅ Admin user updated successfully!');
    } else {
      console.log('✅ Admin user already has proper schema');
    }
    
    console.log('');
    console.log('🔐 Admin Login Credentials:');
    console.log('   Email: admin@fixitflow.com');
    console.log('   Password: admin123');
    console.log('');
    console.log('🌟 You can now log in as admin in your app!');
    
  } catch (error) {
    console.error('❌ Error fixing admin user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

fixAdmin();
