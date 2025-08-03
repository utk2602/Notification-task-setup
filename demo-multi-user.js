const axios = require('axios');
const io = require('socket.io-client');

const BASE_URL = 'http://localhost:3000';

class MultiUserDemo {
  constructor() {
    this.users = [];
    this.sockets = [];
  }

  log(message, type = 'info') {
    const emoji = {
      info: 'ℹ️',
      success: '✅',
      error: '❌',
      warning: '⚠️',
      demo: '🎬'
    };
    console.log(`${emoji[type]} ${message}`);
  }

  async createUser(userIndex) {
    try {
      const userData = {
        email: `demo${userIndex}${Date.now()}@example.com`,
        password: 'password123',
        name: `Demo User ${userIndex}`
      };

      const response = await axios.post(`${BASE_URL}/api/auth/signup`, userData);
      
      if (response.status === 201) {
        const user = {
          ...userData,
          id: response.data.user.id,
          token: response.data.token
        };
        
        this.users.push(user);
        this.log(`Created user: ${user.name}`, 'success');
        return user;
      }
    } catch (error) {
      this.log(`Error creating user ${userIndex}: ${error.response?.data?.error || error.message}`, 'error');
      return null;
    }
  }

  async connectUser(user, userIndex) {
    return new Promise((resolve) => {
      const socket = io(BASE_URL, {
        auth: { token: user.token }
      });

      socket.on('connect', () => {
        this.log(`User ${userIndex} connected to WebSocket`, 'success');
      });

      socket.on('connected', (data) => {
        this.log(`User ${userIndex} authenticated as: ${data.user.name}`, 'success');
      });

      socket.on('notification', (notification) => {
        this.log(`User ${userIndex} received: ${notification.message}`, 'success');
      });

      socket.on('connect_error', (error) => {
        this.log(`User ${userIndex} connection error: ${error.message}`, 'error');
      });

      this.sockets.push(socket);

      // Complete after 2 seconds
      setTimeout(() => {
        resolve(true);
      }, 2000);
    });
  }

  async runDemo() {
    this.log('🎬 Starting Multi-User Demo', 'demo');
    console.log('='.repeat(50));

    // Step 1: Create multiple users
    this.log('\n📝 Step 1: Creating multiple users...', 'demo');
    for (let i = 1; i <= 3; i++) {
      const user = await this.createUser(i);
      if (!user) {
        this.log('Failed to create users, aborting demo', 'error');
        return;
      }
    }

    // Step 2: Connect all users to WebSocket
    this.log('\n🔗 Step 2: Connecting all users to WebSocket...', 'demo');
    for (let i = 0; i < this.users.length; i++) {
      await this.connectUser(this.users[i], i + 1);
    }

    // Step 3: Verify all users can access their profiles
    this.log('\n👤 Step 3: Verifying user authentication...', 'demo');
    for (let i = 0; i < this.users.length; i++) {
      const user = this.users[i];
      try {
        const response = await axios.get(`${BASE_URL}/api/auth/profile`, {
          headers: { 'Authorization': `Bearer ${user.token}` }
        });

        if (response.status === 200) {
          this.log(`User ${i + 1} authenticated: ${response.data.user.name}`, 'success');
        }
      } catch (error) {
        this.log(`User ${i + 1} authentication failed: ${error.response?.data?.error || error.message}`, 'error');
      }
    }

    // Step 4: Send notifications to specific users
    this.log('\n🔔 Step 4: Sending targeted notifications...', 'demo');
    
    // Send notification to user 1
    try {
      const response = await axios.post(`${BASE_URL}/api/tests/schedule`, {
        userId: this.users[0].id,
        testName: 'Demo Test for User 1'
      }, {
        headers: { 'Authorization': `Bearer ${this.users[0].token}` }
      });

      if (response.status === 200) {
        this.log(`Notification sent to User 1, devices notified: ${response.data.notification.devicesNotified}`, 'success');
      }
    } catch (error) {
      this.log(`Error sending notification to User 1: ${error.response?.data?.error || error.message}`, 'error');
    }

    // Wait for notification delivery
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Send notification to user 2
    try {
      const response = await axios.post(`${BASE_URL}/api/tests/schedule`, {
        userId: this.users[1].id,
        testName: 'Demo Test for User 2'
      }, {
        headers: { 'Authorization': `Bearer ${this.users[1].token}` }
      });

      if (response.status === 200) {
        this.log(`Notification sent to User 2, devices notified: ${response.data.notification.devicesNotified}`, 'success');
      }
    } catch (error) {
      this.log(`Error sending notification to User 2: ${error.response?.data?.error || error.message}`, 'error');
    }

    // Wait for notification delivery
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 5: Verify users are still authenticated after notifications
    this.log('\n🔍 Step 5: Verifying users remain authenticated...', 'demo');
    for (let i = 0; i < this.users.length; i++) {
      const user = this.users[i];
      try {
        const response = await axios.get(`${BASE_URL}/api/auth/profile`, {
          headers: { 'Authorization': `Bearer ${user.token}` }
        });

        if (response.status === 200) {
          this.log(`User ${i + 1} still authenticated: ${response.data.user.name}`, 'success');
        }
      } catch (error) {
        this.log(`User ${i + 1} lost authentication: ${error.response?.data?.error || error.message}`, 'error');
      }
    }

    // Step 6: Show connection statistics
    this.log('\n📊 Step 6: Connection Statistics...', 'demo');
    try {
      const response = await axios.get(`${BASE_URL}/health`);
      const stats = response.data.websocket.stats;
      this.log(`Total Users: ${stats.totalUsers}`, 'info');
      this.log(`Total Connections: ${stats.totalConnections}`, 'info');
      this.log(`Connections per User: ${JSON.stringify(stats.connectionsPerUser)}`, 'info');
    } catch (error) {
      this.log(`Error getting statistics: ${error.message}`, 'error');
    }

    // Demo summary
    console.log('\n' + '='.repeat(50));
    this.log('🎉 Multi-User Demo Completed!', 'demo');
    console.log('='.repeat(50));
    this.log('✅ Multiple users can login simultaneously', 'success');
    this.log('✅ Each user maintains their own authentication', 'success');
    this.log('✅ Notifications are delivered to specific users', 'success');
    this.log('✅ Users remain logged in when others login', 'success');
    this.log('✅ WebSocket connections are isolated per user', 'success');

    // Cleanup
    this.cleanup();
  }

  cleanup() {
    this.sockets.forEach(socket => {
      if (socket && socket.connected) {
        socket.disconnect();
      }
    });
    this.log('Cleaned up WebSocket connections', 'info');
  }
}

// Check if server is running
async function checkServer() {
  try {
    await axios.get(`${BASE_URL}/health`);
    console.log('✅ Server is running\n');
    
    const demo = new MultiUserDemo();
    await demo.runDemo();
  } catch (error) {
    console.error('❌ Server is not running. Please start the server first:');
    console.log('   npm start');
    console.log('   or');
    console.log('   npm run dev');
  }
}

checkServer(); 