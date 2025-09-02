const mongoose = require('mongoose');
const { User } = require('../models');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fixitflow', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

async function fixAdminRole() {
  try {
    console.log('\n🔧 Fixing admin user role...\n');
    
    // Find the admin user by email
    const adminUser = await User.findOne({ email: 'admin@fixitflow.com' });
    
    if (!adminUser) {
      console.log('❌ Admin user not found!');
      return;
    }
    
    console.log('📋 Current admin user details:');
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Username: ${adminUser.username}`);
    console.log(`   Current Role: ${adminUser.role}`);
    console.log(`   Created: ${adminUser.createdAt}`);
    
    if (adminUser.role !== 'admin') {
      console.log('\n🔧 Updating role to admin...');
      adminUser.role = 'admin';
      await adminUser.save();
      console.log('✅ Role updated successfully!');
    } else {
      console.log('\n✅ User already has admin role');
    }
    
    // Verify the change
    const updatedUser = await User.findOne({ email: 'admin@fixitflow.com' });
    console.log('\n📋 Updated admin user details:');
    console.log(`   Email: ${updatedUser.email}`);
    console.log(`   Username: ${updatedUser.username}`);
    console.log(`   Role: ${updatedUser.role}`);
    
    // Check all admin users
    console.log('\n👥 All admin users in database:');
    const allAdmins = await User.find({ role: 'admin' });
    allAdmins.forEach((admin, index) => {
      console.log(`   ${index + 1}. ${admin.email} (${admin.username})`);
    });
    
    console.log('\n✅ Admin role fix completed!');
    console.log('🔄 Please log out and log back in for changes to take effect.');
    
  } catch (error) {
    console.error('❌ Error fixing admin role:', error);
  } finally {
    mongoose.connection.close();
    console.log('\n🔌 Database connection closed.');
  }
}

// Run the function
fixAdminRole();
