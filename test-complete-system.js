const axios = require('axios');
const io = require('socket.io-client');

const BASE_URL = 'http://localhost:3000';

class NotificationSystemTester {
  constructor() {
    this.token = null;
    this.userId = null;
    this.socket = null;
    this.testResults = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const emoji = {
      info: 'ℹ️',
      success: '✅',
      error: '❌',
      warning: '⚠️',
      test: '🧪'
    };
    console.log(`${emoji[type]} [${timestamp}] ${message}`);
  }

  addResult(testName, success, details = '') {
    this.testResults.push({ testName, success, details });
  }

  async runAllTests() {
    this.log('🚀 Starting Comprehensive Notification System Tests', 'test');
    console.log('='.repeat(60));

    try {
      // 1. System Health Check
      await this.testSystemHealth();

      // 2. Authentication Tests
      await this.testAuthentication();

      // 3. Test Management Tests
      await this.testTestManagement();

      // 4. WebSocket Tests
      await this.testWebSocket();

      // 5. Multi-Device Tests
      await this.testMultiDevice();

      // 6. Error Handling Tests
      await this.testErrorHandling();

      // 7. Final Health Check
      await this.testSystemHealth();

      // Print Results
      this.printResults();

    } catch (error) {
      this.log(`Test suite failed: ${error.message}`, 'error');
    }
  }

  async testSystemHealth() {
    this.log('Testing System Health...', 'test');
    
    try {
      const response = await axios.get(`${BASE_URL}/health`);
      
      if (response.status === 200) {
        const data = response.data;
        this.log(`System Status: ${data.status}`, 'success');
        this.log(`Total Users: ${data.websocket.stats.totalUsers}`, 'info');
        this.log(`Total Connections: ${data.websocket.stats.totalConnections}`, 'info');
        this.addResult('System Health Check', true, `Status: ${data.status}`);
      } else {
        this.addResult('System Health Check', false, `Status: ${response.status}`);
      }
    } catch (error) {
      this.addResult('System Health Check', false, error.message);
    }
  }

  async testAuthentication() {
    this.log('Testing Authentication Flow...', 'test');
    
    try {
      // Test 1: User Signup
      this.log('Testing User Signup...', 'info');
      const signupResponse = await axios.post(`${BASE_URL}/api/auth/signup`, {
        email: `test${Date.now()}@example.com`,
        password: 'password123',
        name: 'Test User'
      });

      if (signupResponse.status === 201) {
        this.token = signupResponse.data.token;
        this.userId = signupResponse.data.user.id;
        this.log(`User created: ${signupResponse.data.user.name}`, 'success');
        this.addResult('User Signup', true, `User: ${signupResponse.data.user.email}`);
      } else {
        this.addResult('User Signup', false, `Status: ${signupResponse.status}`);
      }

      // Test 2: User Login
      this.log('Testing User Login...', 'info');
      const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
        email: signupResponse.data.user.email,
        password: 'password123'
      });

      if (loginResponse.status === 200) {
        this.log(`Login successful: ${loginResponse.data.user.name}`, 'success');
        this.addResult('User Login', true, `User: ${loginResponse.data.user.email}`);
      } else {
        this.addResult('User Login', false, `Status: ${loginResponse.status}`);
      }

      // Test 3: Get Profile with Token
      this.log('Testing Profile Retrieval...', 'info');
      const profileResponse = await axios.get(`${BASE_URL}/api/auth/profile`, {
        headers: { 'Authorization': `Bearer ${this.token}` }
      });

      if (profileResponse.status === 200) {
        this.log(`Profile retrieved: ${profileResponse.data.user.name}`, 'success');
        this.addResult('Profile Retrieval', true, `User: ${profileResponse.data.user.name}`);
      } else {
        this.addResult('Profile Retrieval', false, `Status: ${profileResponse.status}`);
      }

    } catch (error) {
      this.log(`Authentication test failed: ${error.response?.data?.error || error.message}`, 'error');
      this.addResult('Authentication Flow', false, error.message);
    }
  }

  async testTestManagement() {
    this.log('Testing Test Management...', 'test');
    
    if (!this.token || !this.userId) {
      this.log('Skipping test management - no authentication token', 'warning');
      return;
    }

    try {
      // Test 1: Schedule Test
      this.log('Testing Test Scheduling...', 'info');
      const scheduleResponse = await axios.post(`${BASE_URL}/api/tests/schedule`, {
        userId: this.userId,
        testName: 'Mathematics Final Exam'
      }, {
        headers: { 'Authorization': `Bearer ${this.token}` }
      });

      if (scheduleResponse.status === 200) {
        const testId = scheduleResponse.data.test.id;
        this.log(`Test scheduled: ${scheduleResponse.data.test.testName}`, 'success');
        this.log(`Devices notified: ${scheduleResponse.data.notification.devicesNotified}`, 'info');
        this.addResult('Test Scheduling', true, `Test: ${scheduleResponse.data.test.testName}`);

        // Test 2: Get User Tests
        this.log('Testing Get User Tests...', 'info');
        const userTestsResponse = await axios.get(`${BASE_URL}/api/tests/user/${this.userId}`, {
          headers: { 'Authorization': `Bearer ${this.token}` }
        });

        if (userTestsResponse.status === 200) {
          this.log(`User tests retrieved: ${userTestsResponse.data.tests.length} tests`, 'success');
          this.addResult('Get User Tests', true, `Count: ${userTestsResponse.data.tests.length}`);

          // Test 3: Delete Test
          if (userTestsResponse.data.tests.length > 0) {
            this.log('Testing Test Deletion...', 'info');
            const deleteResponse = await axios.delete(`${BASE_URL}/api/tests/${testId}`, {
              headers: { 'Authorization': `Bearer ${this.token}` }
            });

            if (deleteResponse.status === 200) {
              this.log(`Test deleted: ${deleteResponse.data.test.test_name}`, 'success');
              this.addResult('Test Deletion', true, `Test: ${deleteResponse.data.test.test_name}`);
            } else {
              this.addResult('Test Deletion', false, `Status: ${deleteResponse.status}`);
            }
          }
        } else {
          this.addResult('Get User Tests', false, `Status: ${userTestsResponse.status}`);
        }
      } else {
        this.addResult('Test Scheduling', false, `Status: ${scheduleResponse.status}`);
      }

    } catch (error) {
      this.log(`Test management failed: ${error.response?.data?.error || error.message}`, 'error');
      this.addResult('Test Management', false, error.message);
    }
  }

  async testWebSocket() {
    this.log('Testing WebSocket Connection...', 'test');
    
    if (!this.token) {
      this.log('Skipping WebSocket test - no authentication token', 'warning');
      return;
    }

    try {
      return new Promise((resolve, reject) => {
        this.socket = io(BASE_URL, {
          auth: { token: this.token }
        });

        let connected = false;
        let notificationReceived = false;

        // Connection timeout
        const timeout = setTimeout(() => {
          if (!connected) {
            this.addResult('WebSocket Connection', false, 'Connection timeout');
            reject(new Error('WebSocket connection timeout'));
          }
        }, 5000);

        this.socket.on('connect', () => {
          this.log('WebSocket connected successfully', 'success');
          connected = true;
          this.addResult('WebSocket Connection', true, 'Connected successfully');
          clearTimeout(timeout);
        });

        this.socket.on('connected', (data) => {
          this.log(`WebSocket authenticated: ${data.user.name}`, 'success');
          this.addResult('WebSocket Authentication', true, `User: ${data.user.name}`);
        });

        this.socket.on('notification', (notification) => {
          this.log(`Notification received: ${notification.message}`, 'success');
          notificationReceived = true;
          this.addResult('WebSocket Notifications', true, `Type: ${notification.type}`);
        });

        this.socket.on('connect_error', (error) => {
          this.log(`WebSocket connection error: ${error.message}`, 'error');
          this.addResult('WebSocket Connection', false, error.message);
          clearTimeout(timeout);
          reject(error);
        });

        // Test ping after 2 seconds
        setTimeout(() => {
          if (connected) {
            this.socket.emit('ping');
            this.log('Ping sent to WebSocket', 'info');
          }
        }, 2000);

        // Complete test after 3 seconds
        setTimeout(() => {
          if (connected) {
            this.log('WebSocket test completed', 'success');
            resolve();
          }
        }, 3000);
      });

    } catch (error) {
      this.log(`WebSocket test failed: ${error.message}`, 'error');
      this.addResult('WebSocket Test', false, error.message);
    }
  }

  async testMultiDevice() {
    this.log('Testing Multi-Device Support...', 'test');
    
    if (!this.token) {
      this.log('Skipping multi-device test - no authentication token', 'warning');
      return;
    }

    try {
      // Create multiple WebSocket connections
      const sockets = [];
      const deviceCount = 3;

      for (let i = 0; i < deviceCount; i++) {
        const socket = io(BASE_URL, {
          auth: { token: this.token }
        });

        socket.on('connect', () => {
          this.log(`Device ${i + 1} connected`, 'success');
        });

        socket.on('notification', (notification) => {
          this.log(`Device ${i + 1} received notification: ${notification.message}`, 'success');
        });

        sockets.push(socket);
      }

      // Wait for all connections
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Schedule a test to trigger notifications
      const scheduleResponse = await axios.post(`${BASE_URL}/api/tests/schedule`, {
        userId: this.userId,
        testName: 'Multi-Device Test'
      }, {
        headers: { 'Authorization': `Bearer ${this.token}` }
      });

      if (scheduleResponse.status === 200) {
        this.log(`Multi-device test scheduled, devices notified: ${scheduleResponse.data.notification.devicesNotified}`, 'success');
        this.addResult('Multi-Device Support', true, `Devices: ${scheduleResponse.data.notification.devicesNotified}`);
      } else {
        this.addResult('Multi-Device Support', false, `Status: ${scheduleResponse.status}`);
      }

      // Wait for notifications and cleanup
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      sockets.forEach(socket => socket.disconnect());
      this.log('Multi-device test completed', 'success');

    } catch (error) {
      this.log(`Multi-device test failed: ${error.message}`, 'error');
      this.addResult('Multi-Device Support', false, error.message);
    }
  }

  async testErrorHandling() {
    this.log('Testing Error Handling...', 'test');
    
    try {
      // Test 1: Invalid login
      this.log('Testing Invalid Login...', 'info');
      try {
        await axios.post(`${BASE_URL}/api/auth/login`, {
          email: 'nonexistent@example.com',
          password: 'wrongpassword'
        });
        this.addResult('Invalid Login Handling', false, 'Should have failed');
      } catch (error) {
        if (error.response?.status === 401) {
          this.log('Invalid login correctly rejected', 'success');
          this.addResult('Invalid Login Handling', true, 'Correctly rejected');
        } else {
          this.addResult('Invalid Login Handling', false, `Unexpected status: ${error.response?.status}`);
        }
      }

      // Test 2: Access protected endpoint without token
      this.log('Testing Unauthorized Access...', 'info');
      try {
        await axios.get(`${BASE_URL}/api/auth/profile`);
        this.addResult('Unauthorized Access Handling', false, 'Should have failed');
      } catch (error) {
        if (error.response?.status === 401) {
          this.log('Unauthorized access correctly rejected', 'success');
          this.addResult('Unauthorized Access Handling', true, 'Correctly rejected');
        } else {
          this.addResult('Unauthorized Access Handling', false, `Unexpected status: ${error.response?.status}`);
        }
      }

      // Test 3: Invalid test scheduling
      if (this.token) {
        this.log('Testing Invalid Test Scheduling...', 'info');
        try {
          await axios.post(`${BASE_URL}/api/tests/schedule`, {
            userId: 'invalid-uuid',
            testName: ''
          }, {
            headers: { 'Authorization': `Bearer ${this.token}` }
          });
          this.addResult('Invalid Test Scheduling Handling', false, 'Should have failed');
        } catch (error) {
          if (error.response?.status === 400 || error.response?.status === 404) {
            this.log('Invalid test scheduling correctly rejected', 'success');
            this.addResult('Invalid Test Scheduling Handling', true, 'Correctly rejected');
          } else {
            this.addResult('Invalid Test Scheduling Handling', false, `Unexpected status: ${error.response?.status}`);
          }
        }
      }

    } catch (error) {
      this.log(`Error handling test failed: ${error.message}`, 'error');
      this.addResult('Error Handling', false, error.message);
    }
  }

  printResults() {
    console.log('\n' + '='.repeat(60));
    this.log('📊 TEST RESULTS SUMMARY', 'test');
    console.log('='.repeat(60));

    const passed = this.testResults.filter(r => r.success).length;
    const failed = this.testResults.filter(r => !r.success).length;
    const total = this.testResults.length;

    this.log(`Total Tests: ${total}`, 'info');
    this.log(`Passed: ${passed}`, 'success');
    this.log(`Failed: ${failed}`, failed > 0 ? 'error' : 'success');

    console.log('\n📋 Detailed Results:');
    this.testResults.forEach((result, index) => {
      const status = result.success ? '✅' : '❌';
      console.log(`${index + 1}. ${status} ${result.testName} - ${result.details}`);
    });

    if (failed === 0) {
      console.log('\n🎉 All tests passed! Your notification system is working perfectly!');
    } else {
      console.log('\n⚠️  Some tests failed. Please check the implementation.');
    }
  }

  cleanup() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}

// Run the tests
async function runTests() {
  const tester = new NotificationSystemTester();
  
  try {
    await tester.runAllTests();
  } catch (error) {
    console.error('Test suite failed:', error);
  } finally {
    tester.cleanup();
  }
}

// Check if server is running before starting tests
async function checkServer() {
  try {
    await axios.get(`${BASE_URL}/health`);
    console.log('✅ Server is running, starting tests...\n');
    runTests();
  } catch (error) {
    console.error('❌ Server is not running. Please start the server first:');
    console.log('   npm start');
    console.log('   or');
    console.log('   npm run dev');
  }
}

// Start the test suite
checkServer(); 