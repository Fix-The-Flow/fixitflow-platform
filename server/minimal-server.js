const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();

// Enable CORS for all origins in development
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5001'],
  credentials: true
}));

app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Simple User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Auth routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });
    
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = new User({
      username,
      email,
      password: hashedPassword,
      role: 'user'
    });

    await user.save();
    
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
});

// Create admin user endpoint (both GET and POST)
app.get('/api/auth/create-admin', async (req, res) => {
  try {
    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      return res.json({ 
        message: 'Admin user already exists',
        credentials: {
          email: 'admin@fixitflow.com',
          password: 'admin123'
        },
        status: 'exists'
      });
    }

    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const adminUser = new User({
      username: 'admin',
      email: 'admin@fixitflow.com',
      password: hashedPassword,
      role: 'admin'
    });

    await adminUser.save();
    
    res.json({
      message: 'Admin user created successfully',
      credentials: {
        email: 'admin@fixitflow.com',
        password: 'admin123'
      },
      status: 'created'
    });
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({ message: 'Failed to create admin', error: error.message });
  }
});

app.post('/api/auth/create-admin', async (req, res) => {
  try {
    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      return res.status(400).json({ message: 'Admin user already exists' });
    }

    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const adminUser = new User({
      username: 'admin',
      email: 'admin@fixitflow.com',
      password: hashedPassword,
      role: 'admin'
    });

    await adminUser.save();
    
    res.json({
      message: 'Admin user created successfully',
      credentials: {
        email: 'admin@fixitflow.com',
        password: 'admin123'
      }
    });
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({ message: 'Failed to create admin', error: error.message });
  }
});

// Categories endpoints
app.get('/api/categories', async (req, res) => {
  try {
    // Return some default categories for now
    const defaultCategories = [
      { _id: '1', name: 'Technology', color: '#3B82F6' },
      { _id: '2', name: 'Business', color: '#10B981' },
      { _id: '3', name: 'Health', color: '#F59E0B' },
      { _id: '4', name: 'Education', color: '#8B5CF6' },
      { _id: '5', name: 'Lifestyle', color: '#EF4444' }
    ];
    
    res.json({ categories: defaultCategories });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch categories' });
  }
});

// Basic eBooks endpoints
app.get('/api/admin/ebooks', async (req, res) => {
  try {
    // Return empty array for now
    res.json({
      ebooks: [],
      pagination: {
        total: 0,
        pages: 0,
        current: 1
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch ebooks' });
  }
});

// Connect to MongoDB
const mongoUri = process.env.MONGODB_URI;
console.log('🔗 Connecting to MongoDB...');

mongoose.connect(mongoUri)
.then(async () => {
  console.log('✅ Connected to MongoDB');
  
  const PORT = process.env.PORT || 5000;
  
  app.listen(PORT, () => {
    console.log(`🚀 Minimal server running on port ${PORT}`);
    console.log('📊 Available endpoints:');
    console.log('   GET  /api/health');
    console.log('   POST /api/auth/register');
    console.log('   POST /api/auth/login');
    console.log('   POST /api/auth/create-admin');
    console.log('   GET  /api/categories');
    console.log('   GET  /api/admin/ebooks');
    
    console.log('');
    console.log('🔧 To create admin user, visit: http://localhost:' + PORT + '/api/auth/create-admin');
    console.log('📧 Admin login: admin@fixitflow.com');
    console.log('🔑 Admin password: admin123');
  });
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

module.exports = app;
