const mongoose = require('mongoose');
const { User } = require('../models');
require('dotenv').config();

// Get email from command line arguments
const email = process.argv[2];

if (!email) {
  console.log('❌ Please provide an email address to promote to admin');
  console.log('Usage: node scripts/promote-to-admin.js <email>');
  process.exit(1);
}

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

async function promoteToAdmin() {
  try {
    console.log(`\n🔍 Looking for user with email: ${email}`);
    
    // Find the user
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log(`❌ No user found with email: ${email}`);
      return;
    }
    
    if (user.role === 'admin') {
      console.log(`✅ User ${email} is already an admin!`);
      return;
    }
    
    // Promote to admin
    user.role = 'admin';
    await user.save();
    
    console.log(`✅ Successfully promoted user to admin:`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Username: ${user.username}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Name: ${user.profile.firstName} ${user.profile.lastName}`);
    console.log('\n🎉 User can now access the admin dashboard!');
    
  } catch (error) {
    console.error('❌ Error promoting user to admin:', error);
  } finally {
    mongoose.connection.close();
    console.log('\n🔌 Database connection closed.');
  }
}

// Run the function
promoteToAdmin();
