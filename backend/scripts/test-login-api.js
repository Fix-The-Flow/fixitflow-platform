const axios = require('axios');

async function testLoginAPI() {
  try {
    console.log('🔗 Testing login API endpoint...');
    
    const loginData = {
      email: 'admin@fixitflow.com',
      password: 'admin123'
    };
    
    console.log('📤 Sending login request to http://localhost:5000/api/auth/login');
    console.log('📋 Login data:', JSON.stringify(loginData, null, 2));
    
    const response = await axios.post('http://localhost:5000/api/auth/login', loginData);
    
    console.log('✅ Login API Response:');
    console.log('   Status:', response.status);
    console.log('   Success:', response.data.success);
    console.log('   Message:', response.data.message);
    console.log('   Token present:', !!response.data.token);
    console.log('   User data:', JSON.stringify(response.data.user, null, 2));
    
  } catch (error) {
    console.log('❌ Login API Error:');
    
    if (error.response) {
      console.log('   Status:', error.response.status);
      console.log('   Response:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.log('   No response received. Is the backend server running?');
      console.log('   Request:', error.request);
    } else {
      console.log('   Error:', error.message);
    }
  }
}

// Test if server is running first
async function checkServer() {
  try {
    console.log('🔍 Checking if backend server is running...');
    // Try /health first
    const response = await axios.get('http://localhost:5000/health', { timeout: 3000 });
    console.log('✅ Backend server is running on port 5000');
    return true;
  } catch (error) {
    console.log('❌ Backend server is not responding on http://localhost:5000');
    console.log('   Error:', error.message);
    console.log('   Make sure your backend server is running with: npm run dev');
    return false;
  }
}

async function main() {
  const serverRunning = await checkServer();
  if (serverRunning) {
    await testLoginAPI();
  }
}

main();
