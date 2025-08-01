const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function quickSignup() {
  console.log('🚀 Creating Sample User...\n');

  const sampleUser = {
    email: 'demo@example.com',
    password: 'demo123',
    name: 'Demo User'
  };

  try {
    console.log('📝 Creating user with:', sampleUser);
    
    const response = await axios.post(`${BASE_URL}/api/auth/signup`, sampleUser);
    
    console.log('✅ Signup successful!');
    console.log('👤 User created:', response.data.user.name);
    console.log('📧 Email:', response.data.user.email);
    console.log('🆔 User ID:', response.data.user.id);
    console.log('🔑 Token:', response.data.token.substring(0, 20) + '...');
    console.log('');
    
    console.log('🎯 Next steps:');
    console.log('1. Use this token for authenticated requests');
    console.log('2. Try logging in with the same credentials');
    console.log('3. Check the database with: node view-data.js');
    
  } catch (error) {
    if (error.response?.status === 409) {
      console.log('⚠️  User already exists! Try a different email.');
    } else {
      console.error('❌ Signup failed:', error.response?.data || error.message);
    }
  }
}

// Run the quick signup
quickSignup(); 