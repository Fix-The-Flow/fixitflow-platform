const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function testAdminLogin() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || process.env.DATABASE_URL);
    console.log('✅ Connected to MongoDB');

    // Find admin user
    const adminUser = await User.findOne({ email: 'admin@fixitflow.com' }).select('+password');
    
    if (!adminUser) {
      console.log('❌ Admin user not found with email: admin@fixitflow.com');
      process.exit(1);
    }

    console.log('🔍 Admin user found:');
    console.log('   Email:', adminUser.email);
    console.log('   First Name:', adminUser.firstName);
    console.log('   Last Name:', adminUser.lastName);
    console.log('   Role:', adminUser.role);
    console.log('   Is Active:', adminUser.isActive);
    console.log('   Is Email Verified:', adminUser.isEmailVerified);
    console.log('   Has Password:', !!adminUser.password);
    console.log('   Password Length:', adminUser.password ? adminUser.password.length : 0);

    // Test password matching
    console.log('');
    console.log('🔐 Testing password authentication...');
    const isPasswordValid = await adminUser.matchPassword('admin123');
    console.log('   Password "admin123" matches:', isPasswordValid);

    if (!isPasswordValid) {
      console.log('');
      console.log('🔧 Updating admin password...');
      adminUser.password = 'admin123';
      await adminUser.save();
      console.log('✅ Password updated successfully');
      
      // Test again
      const adminUserUpdated = await User.findOne({ email: 'admin@fixitflow.com' }).select('+password');
      const isNewPasswordValid = await adminUserUpdated.matchPassword('admin123');
      console.log('   New password "admin123" matches:', isNewPasswordValid);
    }

    // Test JWT token generation
    console.log('');
    console.log('🎫 Testing JWT token generation...');
    try {
      const token = adminUser.getSignedJwtToken();
      console.log('   JWT token generated successfully');
      console.log('   Token length:', token.length);
    } catch (error) {
      console.log('   ❌ JWT token generation failed:', error.message);
    }

    console.log('');
    console.log('✅ Admin authentication test completed!');
    
  } catch (error) {
    console.error('❌ Error testing admin login:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

testAdminLogin();
