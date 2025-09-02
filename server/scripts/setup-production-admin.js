const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Inline User model for production setup
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  isEmailVerified: { type: Boolean, default: false },
  profile: {
    firstName: String,
    lastName: String,
    avatar: String,
    bio: String
  },
  preferences: {
    newsletter: { type: Boolean, default: true },
    notifications: { type: Boolean, default: true }
  }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

async function setupProductionAdmin() {
  try {
    // Connect using environment variable
    const mongoUri = process.env.MONGODB_URI || process.env.mongodb_uri;
    console.log('Connecting to production database...');
    
    await mongoose.connect(mongoUri);
    console.log('Connected successfully');

    // Create admin user
    const adminEmail = 'admin@fixitflow.online';
    const adminPassword = 'FixItFlow2024!';

    // Check if admin exists
    let adminUser = await User.findOne({ email: adminEmail });

    if (adminUser) {
      console.log('Admin user exists, updating...');
      const hashedPassword = await bcrypt.hash(adminPassword, 12);
      adminUser.password = hashedPassword;
      adminUser.role = 'admin';
      adminUser.isEmailVerified = true;
      await adminUser.save();
    } else {
      console.log('Creating new admin user...');
      const hashedPassword = await bcrypt.hash(adminPassword, 12);
      
      adminUser = new User({
        username: 'admin',
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
    }

    console.log('✅ Admin user ready!');
    console.log('Email:', adminEmail);
    console.log('Password:', adminPassword);
    
    await mongoose.disconnect();
    console.log('Database connection closed');
    
  } catch (error) {
    console.error('Error setting up admin:', error);
  }
}

// Run if called directly
if (require.main === module) {
  setupProductionAdmin();
}

module.exports = { setupProductionAdmin };
