const axios = require('axios');
const io = require('socket.io-client');

const BASE_URL = 'http://localhost:3000';

class WebSocketTester {
  constructor() {
    this.token = null;
    this.userId = null;
    this.sockets = [];
    this.testResults = [];
  }

  log(message, type = 'info') {
    const emoji = {
      info: 'ℹ️',
      success: '✅',
      error: '❌',
      warning: '⚠️',
      test: '🧪'
    };
    console.log(`${emoji[type]} ${message}`);
  }

  async setupUser() {
    try {
      // Create a test user
      const signupResponse = await axios.post(`${BASE_URL}/api/auth/signup`, {
        email: `websocket-test${Date.now()}@example.com`,
        password: 'password123',
        name: 'WebSocket Test User'
      });

      this.token = signupResponse.data.token;
      this.userId = signupResponse.data.user.id;
      this.log(`User created: ${signupResponse.data.user.name}`, 'success');
      return true;
    } catch (error) {
      this.log(`Failed to create user: ${error.response?.data?.error || error.message}`, 'error');
      return false;
    }
  }

  async testSingleConnection() {
    this.log('Testing Single WebSocket Connection...', 'test');
    
    return new Promise((resolve) => {
      const socket = io(BASE_URL, {
        auth: { token: this.token }
      });

      let connected = false;
      let authenticated = false;

      const timeout = setTimeout(() => {
        if (!connected) {
          this.log('Connection timeout', 'error');
          resolve(false);
        }
      }, 5000);

      socket.on('connect', () => {
        this.log('WebSocket connected', 'success');
        connected = true;
        clearTimeout(timeout);
      });

      socket.on('connected', (data) => {
        this.log(`Authenticated as: ${data.user.name}`, 'success');
        authenticated = true;
      });

      socket.on('notification', (notification) => {
        this.log(`Notification received: ${notification.message}`, 'success');
      });

      socket.on('connect_error', (error) => {
        this.log(`Connection error: ${error.message}`, 'error');
        clearTimeout(timeout);
        resolve(false);
      });

      // Test ping after 2 seconds
      setTimeout(() => {
        if (connected) {
          socket.emit('ping');
          this.log('Ping sent', 'info');
        }
      }, 2000);

      // Complete test after 3 seconds
      setTimeout(() => {
        socket.disconnect();
        resolve(connected && authenticated);
      }, 3000);
    });
  }

  async testMultiDeviceConnection() {
    this.log('Testing Multi-Device WebSocket Connections...', 'test');
    
    const deviceCount = 3;
    const connections = [];

    // Create multiple connections
    for (let i = 0; i < deviceCount; i++) {
      const socket = io(BASE_URL, {
        auth: { token: this.token }
      });

      socket.on('connect', () => {
        this.log(`Device ${i + 1} connected`, 'success');
      });

      socket.on('connected', (data) => {
        this.log(`Device ${i + 1} authenticated as: ${data.user.name}`, 'success');
      });

      socket.on('notification', (notification) => {
        this.log(`Device ${i + 1} received: ${notification.message}`, 'success');
      });

      connections.push(socket);
    }

    // Wait for all connections
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Count successful connections
    const connectedCount = connections.filter(socket => socket.connected).length;
    this.log(`Connected devices: ${connectedCount}/${deviceCount}`, 'info');

    // Cleanup
    connections.forEach(socket => socket.disconnect());
    
    return connectedCount === deviceCount;
  }

  async testNotificationDelivery() {
    this.log('Testing Notification Delivery...', 'test');
    
    // Create a WebSocket connection
    const socket = io(BASE_URL, {
      auth: { token: this.token }
    });

    return new Promise((resolve) => {
      let notificationReceived = false;

      socket.on('connect', () => {
        this.log('WebSocket ready for notifications', 'success');
      });

      socket.on('notification', (notification) => {
        this.log(`Notification received: ${notification.message}`, 'success');
        notificationReceived = true;
      });

      // Schedule a test after 2 seconds
      setTimeout(async () => {
        try {
          const response = await axios.post(`${BASE_URL}/api/tests/schedule`, {
            userId: this.userId,
            testName: 'WebSocket Notification Test'
          }, {
            headers: { 'Authorization': `Bearer ${this.token}` }
          });

          if (response.status === 200) {
            this.log(`Test scheduled, devices notified: ${response.data.notification.devicesNotified}`, 'success');
          }
        } catch (error) {
          this.log(`Failed to schedule test: ${error.response?.data?.error || error.message}`, 'error');
        }
      }, 2000);

      // Check for notification after 4 seconds
      setTimeout(() => {
        socket.disconnect();
        resolve(notificationReceived);
      }, 4000);
    });
  }

  async testConnectionReconnection() {
    this.log('Testing Connection Reconnection...', 'test');
    
    const socket = io(BASE_URL, {
      auth: { token: this.token }
    });

    return new Promise((resolve) => {
      let initialConnect = false;
      let reconnected = false;

      socket.on('connect', () => {
        if (!initialConnect) {
          this.log('Initial connection established', 'success');
          initialConnect = true;
          
          // Disconnect after 1 second
          setTimeout(() => {
            this.log('Disconnecting...', 'info');
            socket.disconnect();
          }, 1000);
        } else {
          this.log('Reconnected successfully', 'success');
          reconnected = true;
        }
      });

      socket.on('disconnect', () => {
        this.log('Disconnected', 'info');
      });

      // Complete test after 5 seconds
      setTimeout(() => {
        socket.disconnect();
        resolve(initialConnect && reconnected);
      }, 5000);
    });
  }

  async runAllTests() {
    this.log('🚀 Starting WebSocket Tests', 'test');
    console.log('='.repeat(50));

    // Setup user first
    if (!(await this.setupUser())) {
      this.log('Failed to setup user, aborting tests', 'error');
      return;
    }

    // Run tests
    const tests = [
      { name: 'Single Connection', test: () => this.testSingleConnection() },
      { name: 'Multi-Device Connection', test: () => this.testMultiDeviceConnection() },
      { name: 'Notification Delivery', test: () => this.testNotificationDelivery() },
      { name: 'Connection Reconnection', test: () => this.testConnectionReconnection() }
    ];

    let passed = 0;
    let failed = 0;

    for (const test of tests) {
      this.log(`\n🧪 Running: ${test.name}`, 'test');
      try {
        const result = await test.test();
        if (result) {
          this.log(`✅ ${test.name} passed`, 'success');
          passed++;
        } else {
          this.log(`❌ ${test.name} failed`, 'error');
          failed++;
        }
      } catch (error) {
        this.log(`❌ ${test.name} failed: ${error.message}`, 'error');
        failed++;
      }
    }

    // Results
    console.log('\n' + '='.repeat(50));
    this.log('📊 WebSocket Test Results', 'test');
    console.log('='.repeat(50));
    this.log(`✅ Passed: ${passed}`, 'success');
    this.log(`❌ Failed: ${failed}`, failed > 0 ? 'error' : 'success');
    this.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`, 'info');

    if (failed === 0) {
      this.log('🎉 All WebSocket tests passed!', 'success');
    } else {
      this.log('⚠️  Some WebSocket tests failed', 'warning');
    }
  }
}

// Check if server is running
async function checkServer() {
  try {
    await axios.get(`${BASE_URL}/health`);
    console.log('✅ Server is running\n');
    
    const tester = new WebSocketTester();
    await tester.runAllTests();
  } catch (error) {
    console.error('❌ Server is not running. Please start the server first:');
    console.log('   npm start');
    console.log('   or');
    console.log('   npm run dev');
  }
}

checkServer(); 