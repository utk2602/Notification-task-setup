const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testAuthFlow() {
  console.log('🔍 Testing Authentication Flow...\n');

  try {
    // Step 1: Signup
    console.log('1️⃣ Testing Signup...');
    const signupResponse = await axios.post(`${BASE_URL}/api/auth/signup`, {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User'
    });

    const token = signupResponse.data.token;
    const userId = signupResponse.data.user.id;

    console.log('✅ Signup successful');
    console.log('🔑 Token:', token.substring(0, 20) + '...');
    console.log('👤 User ID:', userId);
    console.log('');

    // Step 2: Test Profile with token
    console.log('2️⃣ Testing Profile with token...');
    const profileResponse = await axios.get(`${BASE_URL}/api/auth/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ Profile retrieved successfully');
    console.log('👤 Profile:', profileResponse.data.user);
    console.log('');

    // Step 3: Test Profile without token (should fail)
    console.log('3️⃣ Testing Profile without token (should fail)...');
    try {
      await axios.get(`${BASE_URL}/api/auth/profile`);
      console.log('❌ This should have failed!');
    } catch (error) {
      console.log('✅ Correctly rejected request without token');
      console.log('📝 Error:', error.response.data.error);
    }
    console.log('');

    // Step 4: Test Profile with invalid token (should fail)
    console.log('4️⃣ Testing Profile with invalid token (should fail)...');
    try {
      await axios.get(`${BASE_URL}/api/auth/profile`, {
        headers: {
          'Authorization': 'Bearer invalid_token_here'
        }
      });
      console.log('❌ This should have failed!');
    } catch (error) {
      console.log('✅ Correctly rejected request with invalid token');
      console.log('📝 Error:', error.response.data.error);
    }

    console.log('\n🎉 All tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testAuthFlow(); 