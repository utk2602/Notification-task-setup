# 🧪 Testing Guide for Notification System

This guide explains how to run all the test files to verify your notification system is working correctly.

## 📋 Prerequisites

Before running tests, ensure:

1. **Server is running**: Start your server with `npm start` or `npm run dev`
2. **Database is connected**: Check your `.env` file has correct database credentials
3. **Dependencies installed**: Run `npm install` if you haven't already

## 🚀 Quick Start

### 1. Quick System Test (Recommended for first check)
```bash
npm run test:quick
```
**What it tests:**
- ✅ System health check
- ✅ User signup
- ✅ Test scheduling
- ✅ Error handling

**Duration:** ~30 seconds

### 2. Complete System Test (Comprehensive)
```bash
npm run test
```
**What it tests:**
- ✅ All quick test features
- ✅ WebSocket connections
- ✅ Multi-device support
- ✅ Authentication flow
- ✅ Test management (CRUD)
- ✅ Error handling scenarios

**Duration:** ~2-3 minutes

## 📊 Individual Test Files

### 1. `test-quick.js` - Quick System Check
```bash
node test-quick.js
# or
npm run test:quick
```

**Features tested:**
- Health check endpoint
- User registration
- Test scheduling
- Basic error handling

**Use case:** Quick verification that system is working

### 2. `test-auth.js` - Authentication Tests
```bash
node test-auth.js
# or
npm run test:auth
```

**Features tested:**
- User signup
- User login
- Profile retrieval with token
- Invalid token handling
- Missing token handling

**Use case:** Verify authentication system

### 3. `test-websocket.js` - WebSocket Tests
```bash
node test-websocket.js
# or
npm run test:websocket
```

**Features tested:**
- Single WebSocket connection
- Multi-device connections
- Real-time notification delivery
- Connection reconnection
- Authentication via WebSocket

**Use case:** Verify real-time communication

### 4. `test-complete-system.js` - Full System Test
```bash
node test-complete-system.js
# or
npm run test
```

**Features tested:**
- All individual test features
- End-to-end workflow
- System integration
- Performance metrics

**Use case:** Complete system verification

## 🎯 Test Scenarios Explained

### Authentication Flow Test
```
1. Create new user account
2. Login with credentials
3. Retrieve profile with JWT token
4. Test invalid credentials
5. Test missing/expired tokens
```

### WebSocket Connection Test
```
1. Establish WebSocket connection with JWT
2. Verify authentication
3. Send ping/pong messages
4. Test notification delivery
5. Test multi-device connections
```

### Notification System Test
```
1. Schedule a test via API
2. Verify notification sent to WebSocket
3. Check multi-device delivery
4. Verify notification payload
5. Test notification acknowledgment
```

### Error Handling Test
```
1. Test invalid login credentials
2. Test unauthorized API access
3. Test invalid test scheduling
4. Test malformed requests
5. Verify proper error responses
```

## 📈 Expected Test Results

### Successful Test Output
```
🚀 Quick System Test

========================================
1️⃣ Testing Health Check...
✅ Health check passed
   Status: OK
   Users: 5
   Connections: 8

2️⃣ Testing User Signup...
✅ Signup passed
   User: Quick Test User
   Email: test1234567890@example.com

3️⃣ Testing Test Scheduling...
✅ Test scheduling passed
   Test: Quick Test
   Devices notified: 1

4️⃣ Testing Error Handling...
✅ Error handling passed - correctly rejected invalid login

========================================
📊 QUICK TEST RESULTS
========================================
✅ Passed: 4
❌ Failed: 0
📈 Success Rate: 100%

🎉 All quick tests passed! System is working correctly.
```

### Failed Test Output
```
❌ Health check failed: connect ECONNREFUSED 127.0.0.1:3000

❌ Server is not running. Please start the server first:
   npm start
   or
   npm run dev
```

## 🔧 Troubleshooting

### Common Issues

#### 1. Server Not Running
```
Error: connect ECONNREFUSED 127.0.0.1:3000
```
**Solution:**
```bash
npm start
# or
npm run dev
```

#### 2. Database Connection Error
```
Error: connection to database failed
```
**Solution:**
- Check `.env` file has correct `DATABASE_URL`
- Verify database is accessible
- Check network connectivity

#### 3. WebSocket Connection Failed
```
Error: WebSocket connection timeout
```
**Solution:**
- Ensure server is running on port 3000
- Check CORS settings
- Verify JWT token is valid

#### 4. Test User Already Exists
```
Error: User already exists
```
**Solution:**
- Tests use timestamped emails, so this shouldn't happen
- If it does, wait a moment and retry

## 🎥 Video Demonstration Testing

For your video demonstration, run these tests in sequence:

### 1. Pre-Video Setup
```bash
# Start server
npm start

# In another terminal, run quick test
npm run test:quick
```

### 2. During Video Recording
```bash
# Run comprehensive test
npm run test
```

### 3. Show Individual Features
```bash
# Test WebSocket specifically
npm run test:websocket

# Test authentication
npm run test:auth
```

## 📊 Test Coverage

| Feature | Quick Test | Auth Test | WebSocket Test | Complete Test |
|---------|------------|-----------|----------------|---------------|
| Health Check | ✅ | ❌ | ❌ | ✅ |
| User Signup | ✅ | ✅ | ✅ | ✅ |
| User Login | ❌ | ✅ | ❌ | ✅ |
| Profile Retrieval | ❌ | ✅ | ❌ | ✅ |
| Test Scheduling | ✅ | ❌ | ❌ | ✅ |
| WebSocket Connection | ❌ | ❌ | ✅ | ✅ |
| Multi-Device Support | ❌ | ❌ | ✅ | ✅ |
| Notification Delivery | ❌ | ❌ | ✅ | ✅ |
| Error Handling | ✅ | ✅ | ❌ | ✅ |
| CRUD Operations | ❌ | ❌ | ❌ | ✅ |

## 🚀 Running All Tests

To run all tests in sequence:
```bash
npm run test:all
```

This will run:
1. Quick system test
2. WebSocket test
3. Authentication test

## 📝 Customizing Tests

### Adding New Test Cases
1. Create a new test file: `test-custom.js`
2. Follow the pattern from existing test files
3. Add to `package.json` scripts if needed

### Modifying Test Data
Edit the test files to change:
- Test user credentials
- Test names
- Connection timeouts
- Number of test devices

### Environment Variables
Tests use these environment variables:
- `BASE_URL`: Server URL (default: http://localhost:3000)
- Database connection from `.env` file

## 🎯 Best Practices

1. **Run quick test first** - Verify basic functionality
2. **Check server status** - Ensure server is running before tests
3. **Monitor console output** - Look for detailed error messages
4. **Clean up after tests** - Tests create temporary users and data
5. **Use in CI/CD** - Tests can be automated in deployment pipelines

## 📞 Support

If tests fail:
1. Check server logs for errors
2. Verify database connectivity
3. Ensure all dependencies are installed
4. Check environment variables
5. Review the troubleshooting section above

---

**Happy Testing! 🎉** 