const express = require('express');
require('dotenv').config();

console.log('🚀 Starting ultra-minimal server...');

const app = express();

// Basic middleware only
app.use(express.json());

// Simple CORS - allow all origins in development
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Health check
app.get('/api/health', (req, res) => {
  console.log('✅ Health check requested');
  res.json({ status: 'OK', message: 'Server is running!' });
});

// Simple login endpoint (no database for now)
app.post('/api/auth/login', (req, res) => {
  console.log('🔐 Login attempt:', req.body);
  const { email, password } = req.body;
  
  // Hardcoded admin check
  if (email === 'admin@fixitflow.com' && password === 'admin123') {
    console.log('✅ Admin login successful');
    res.json({
      message: 'Login successful',
      token: 'fake-jwt-token-for-testing',
      user: {
        id: '1',
        username: 'admin',
        email: 'admin@fixitflow.com',
        role: 'admin'
      }
    });
  } else {
    console.log('❌ Invalid credentials');
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

// Categories
app.get('/api/categories', (req, res) => {
  console.log('📚 Categories requested');
  res.json({
    categories: [
      { _id: '1', name: 'Technology', color: '#3B82F6' },
      { _id: '2', name: 'Business', color: '#10B981' },
      { _id: '3', name: 'Health', color: '#F59E0B' }
    ]
  });
});

// eBooks
app.get('/api/admin/ebooks', (req, res) => {
  console.log('📖 eBooks requested');
  res.json({
    ebooks: [],
    pagination: { total: 0, pages: 0, current: 1 }
  });
});

const PORT = process.env.PORT || 5000;

try {
  app.listen(PORT, () => {
    console.log(`🎉 Server running on http://localhost:${PORT}`);
    console.log(`🔑 Admin login: admin@fixitflow.com / admin123`);
    console.log(`💚 Health check: http://localhost:${PORT}/api/health`);
  });
} catch (error) {
  console.error('❌ Server failed to start:', error);
}

process.on('SIGTERM', () => console.log('👋 Server shutting down...'));
process.on('SIGINT', () => console.log('👋 Server shutting down...'));
