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

async function checkAndCreateAdmin() {
  try {
    console.log('\n🔍 Checking for existing admin users...\n');
    
    // Check for existing admin users
    const adminUsers = await User.find({ role: 'admin' });
    
    if (adminUsers.length > 0) {
      console.log(`✅ Found ${adminUsers.length} admin user(s):`);
      adminUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. Email: ${user.email}`);
        console.log(`      Username: ${user.username}`);
        console.log(`      Role: ${user.role}`);
        console.log(`      Created: ${user.createdAt.toLocaleDateString()}\n`);
      });
    } else {
      console.log('❌ No admin users found!\n');
      
      // Create a default admin user
      console.log('🔧 Creating default admin user...\n');
      
      const adminUser = new User({
        username: 'admin',
        email: 'admin@fixitflow.com',
        password: 'admin123', // This will be hashed automatically
        role: 'admin',
        profile: {
          firstName: 'Admin',
          lastName: 'User'
        }
      });
      
      await adminUser.save();
      
      console.log('✅ Default admin user created successfully!');
      console.log('   Email: admin@fixitflow.com');
      console.log('   Password: admin123');
      console.log('   Username: admin');
      console.log('\n⚠️  Please change the password after first login!\n');
    }
    
    // Also check for any users that might need to be promoted to admin
    const regularUsers = await User.find({ role: 'user' });
    if (regularUsers.length > 0) {
      console.log(`📋 Found ${regularUsers.length} regular user(s):`);
      regularUsers.slice(0, 5).forEach((user, index) => {
        console.log(`   ${index + 1}. Email: ${user.email}, Username: ${user.username}`);
      });
      if (regularUsers.length > 5) {
        console.log(`   ... and ${regularUsers.length - 5} more users\n`);
      }
      
      console.log('💡 To promote a user to admin, you can run:');
      console.log('   node scripts/promote-to-admin.js <email>\n');
    }
    
  } catch (error) {
    console.error('❌ Error checking/creating admin user:', error);
  } finally {
    mongoose.connection.close();
    console.log('🔌 Database connection closed.');
  }
}

// Run the function
checkAndCreateAdmin();
