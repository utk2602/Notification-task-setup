const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function quickTest() {
  console.log('🚀 Quick System Test\n');
  console.log('='.repeat(40));

  let passed = 0;
  let failed = 0;

  // Test 1: Health Check
  console.log('1️⃣ Testing Health Check...');
  try {
    const response = await axios.get(`${BASE_URL}/health`);
    if (response.status === 200) {
      console.log('✅ Health check passed');
      console.log(`   Status: ${response.data.status}`);
      console.log(`   Users: ${response.data.websocket.stats.totalUsers}`);
      console.log(`   Connections: ${response.data.websocket.stats.totalConnections}`);
      passed++;
    } else {
      console.log('❌ Health check failed');
      failed++;
    }
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
    failed++;
  }

  // Test 2: User Signup
  console.log('\n2️⃣ Testing User Signup...');
  try {
    const signupResponse = await axios.post(`${BASE_URL}/api/auth/signup`, {
      email: `test${Date.now()}@example.com`,
      password: 'password123',
      name: 'Quick Test User'
    });

    if (signupResponse.status === 201) {
      console.log('✅ Signup passed');
      console.log(`   User: ${signupResponse.data.user.name}`);
      console.log(`   Email: ${signupResponse.data.user.email}`);
      passed++;

      // Test 3: Test Scheduling
      console.log('\n3️⃣ Testing Test Scheduling...');
      const token = signupResponse.data.token;
      const userId = signupResponse.data.user.id;

      const scheduleResponse = await axios.post(`${BASE_URL}/api/tests/schedule`, {
        userId: userId,
        testName: 'Quick Test'
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (scheduleResponse.status === 200) {
        console.log('✅ Test scheduling passed');
        console.log(`   Test: ${scheduleResponse.data.test.testName}`);
        console.log(`   Devices notified: ${scheduleResponse.data.notification.devicesNotified}`);
        passed++;
      } else {
        console.log('❌ Test scheduling failed');
        failed++;
      }

    } else {
      console.log('❌ Signup failed');
      failed++;
    }
  } catch (error) {
    console.log('❌ Signup failed:', error.response?.data?.error || error.message);
    failed++;
  }

  // Test 4: Error Handling
  console.log('\n4️⃣ Testing Error Handling...');
  try {
    await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'nonexistent@example.com',
      password: 'wrongpassword'
    });
    console.log('❌ Error handling failed - should have rejected invalid login');
    failed++;
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ Error handling passed - correctly rejected invalid login');
      passed++;
    } else {
      console.log('❌ Error handling failed - unexpected response');
      failed++;
    }
  }

  // Results
  console.log('\n' + '='.repeat(40));
  console.log('📊 QUICK TEST RESULTS');
  console.log('='.repeat(40));
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);

  if (failed === 0) {
    console.log('\n🎉 All quick tests passed! System is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Check the server and database connection.');
  }
}

// Check if server is running
async function checkServer() {
  try {
    await axios.get(`${BASE_URL}/health`);
    console.log('✅ Server is running\n');
    quickTest();
  } catch (error) {
    console.error('❌ Server is not running. Please start the server first:');
    console.log('   npm start');
    console.log('   or');
    console.log('   npm run dev');
  }
}

checkServer(); 