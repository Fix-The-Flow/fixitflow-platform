#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Setting up FixItFlow...\n');

// Function to run commands
const runCommand = (command, description) => {
  console.log(`📦 ${description}...`);
  try {
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${description} completed\n`);
  } catch (error) {
    console.error(`❌ Error during ${description}:`, error.message);
    process.exit(1);
  }
};

// Function to create .env file from example
const createEnvFile = () => {
  const envExamplePath = path.join(__dirname, 'server', '.env.example');
  const envPath = path.join(__dirname, 'server', '.env');
  
  if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
    console.log('📄 Creating .env file...');
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ .env file created from template\n');
    console.log('⚠️  IMPORTANT: Please edit server/.env with your actual configuration values!\n');
  }
};

// Main setup function
const setup = async () => {
  try {
    // Install root dependencies
    runCommand('npm install', 'Installing root dependencies');
    
    // Install server dependencies
    runCommand('cd server && npm install', 'Installing server dependencies');
    
    // Install client dependencies
    runCommand('cd client && npm install', 'Installing client dependencies');
    
    // Create .env file
    createEnvFile();
    
    console.log('🎉 FixItFlow setup completed successfully!\n');
    console.log('📋 Next steps:');
    console.log('1. Edit server/.env with your configuration');
    console.log('2. Start MongoDB (if running locally)');
    console.log('3. Run "npm run seed" to populate sample data');
    console.log('4. Run "npm run dev" to start the development servers');
    console.log('\n🌐 The app will be available at:');
    console.log('   Frontend: http://localhost:3000');
    console.log('   Backend:  http://localhost:5000');
    console.log('\n👤 Default admin login:');
    console.log('   Email: admin@fixitflow.com');
    console.log('   Password: admin123');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
};

// Run setup
setup();
