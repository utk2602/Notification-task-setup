# Real-Time Multi-Device Notification System

A robust, scalable real-time notification system built with Node.js, Express, Socket.IO, and PostgreSQL. This system provides instant notifications across multiple devices when administrative events occur.

## 🚀 Features

- **Real-time WebSocket Communication** - Instant notifications using Socket.IO
- **Multi-Device Support** - Notifications sent to all user's connected devices
- **JWT Authentication** - Secure user authentication and WebSocket handshake
- **PostgreSQL Database** - Persistent storage with proper relationships
- **Connection Management** - Track and manage active WebSocket connections
- **Admin Panel** - Schedule tests and trigger notifications
- **Modern UI** - Beautiful, responsive frontend demo
- **Security Features** - Rate limiting, CORS, input validation, password hashing

## 🏗️ Architecture Overview

```
┌─────────────────┐    HTTP/WebSocket    ┌─────────────────┐
│   Frontend      │ ◄──────────────────► │   Backend       │
│   (Browser)     │                      │   (Node.js)     │
└─────────────────┘                      └─────────────────┘
                                                │
                                                ▼
                                       ┌─────────────────┐
                                       │   PostgreSQL    │
                                       │   Database      │
                                       └─────────────────┘
```

### Data Flow

1. **Authentication**: HTTP requests → Database → JWT issuance
2. **WebSocket Connection**: Handshake → JWT verification → Connection registry
3. **Event Trigger**: Admin action → Lookup connections → Push notifications

## 📋 Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Neon PostgreSQL account (free tier available)

## 🛠️ Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd notification-task-setup
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Database Setup

#### Option A: Neon PostgreSQL (Recommended)

For cloud-hosted PostgreSQL with no local setup required:

1. Follow the [Neon PostgreSQL Setup Guide](NEON_SETUP.md)
2. Create a Neon account and project
3. Get your connection string
4. Add `DATABASE_URL` to your `.env` file

#### Option B: Local PostgreSQL

If you prefer local PostgreSQL:

```sql
CREATE DATABASE notification_db;
```

#### Enable UUID Extension (if not already enabled)

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### 4. Environment Configuration

Copy the environment example file and configure your settings:

```bash
cp env.example .env
```

Edit `.env` with your database credentials:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
# For Neon PostgreSQL (recommended)
DATABASE_URL=postgresql://username:password@hostname:port/database?sslmode=require

# For local PostgreSQL (fallback)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=notification_db
DB_USER=postgres
DB_PASSWORD=your_password

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=24h

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

### 5. Start the Server

```bash
# Development mode with auto-restart
npm run dev

# Production mode
npm start
```

The server will automatically:
- Initialize database tables
- Start the HTTP server on port 3000
- Start the WebSocket server
- Load existing connections from database

## 🎯 Usage

### 1. Access the Demo Interface

Open your browser and navigate to:
```
http://localhost:3000
```

### 2. User Authentication

1. **Sign Up**: Create a new account with email, password, and name
2. **Login**: Authenticate with your credentials
3. **Get JWT Token**: The system will provide a JWT token for API access

### 3. WebSocket Connection

1. Navigate to the "WebSocket" tab
2. Click "Connect WebSocket" to establish real-time connection
3. Monitor connection status and statistics

### 4. Schedule Tests (Admin Panel)

1. Navigate to the "Admin Panel" tab
2. Enter a user ID (UUID) and test name
3. Click "Schedule Test" to trigger notifications
4. Watch real-time notifications appear on connected devices

### 5. Multi-Device Testing

1. Open multiple browser tabs/windows
2. Login with the same user account
3. Connect WebSocket on each tab
4. Schedule a test from the admin panel
5. Observe notifications appear on all connected devices

## 📡 API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new user account
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Test Management
- `POST /api/tests/schedule` - Schedule test and send notifications
- `GET /api/tests/user/:userId` - Get user's tests
- `GET /api/tests` - Get all tests (admin)
- `DELETE /api/tests/:testId` - Delete test

### System
- `GET /health` - Health check and WebSocket stats

For detailed API documentation, see [swagger.json](swagger.json) and [WEBSOCKET_EVENTS.md](WEBSOCKET_EVENTS.md)

## 🔌 WebSocket Events

### Server Events
- `connected` - Connection established
- `notification` - New notification received
- `pong` - Response to ping

### Client Events
- `ping` - Test connection
- `notification_ack` - Acknowledge notification

## 🗄️ Database Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Connections Table
```sql
CREATE TABLE connections (
  connection_id VARCHAR(255) PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  connected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Tests Table
```sql
CREATE TABLE tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  test_name VARCHAR(255) NOT NULL,
  scheduled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with 12 salt rounds
- **Input Validation**: Joi schema validation
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **CORS Protection**: Configurable cross-origin requests
- **SQL Injection Protection**: Parameterized queries
- **Security Headers**: Helmet.js implementation

## 📊 Monitoring & Statistics

### Health Check Endpoint
```bash
curl http://localhost:3000/health
```

Returns:
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "websocket": {
    "stats": {
      "totalUsers": 5,
      "totalConnections": 8,
      "connectionsPerUser": {
        "user_uuid_1": 2,
        "user_uuid_2": 1
      }
    }
  }
}
```

## 🧪 Testing

### Manual Testing with cURL

#### 1. User Signup
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'
```

#### 2. User Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

#### 3. Schedule Test
```bash
curl -X POST http://localhost:3000/api/tests/schedule \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"userId":"USER_UUID","testName":"Mathematics Final"}'
```

### WebSocket Testing

Use the browser demo interface or a WebSocket client like Postman to test real-time connections.

## 🚀 Production Deployment

### Environment Variables
- Set `NODE_ENV=production`
- Use strong `JWT_SECRET`
- Configure production database credentials
- Set appropriate `CORS_ORIGIN`

### Scaling Considerations
- Use Redis for connection storage in multi-instance deployments
- Implement load balancing for WebSocket connections
- Use connection pooling for database
- Monitor memory usage for connection tracking

### Docker Deployment (Optional)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 📝 Project Structure

```
notification-task-setup/
├── config/
│   └── database.js          # Database configuration
├── middleware/
│   └── auth.js              # Authentication middleware
├── routes/
│   ├── auth.js              # Authentication routes
│   └── tests.js             # Test management routes
├── services/
│   └── websocketManager.js  # WebSocket connection management
├── public/
│   └── index.html           # Frontend demo
├── server.js                # Main server file
├── package.json             # Dependencies and scripts
├── env.example              # Environment variables template
├── swagger.json             # API documentation (Swagger/OpenAPI)
├── WEBSOCKET_EVENTS.md      # WebSocket events documentation
├── ARCHITECTURE_OVERVIEW.md # System architecture documentation
├── DEMO_VIDEO_SCRIPT.md     # Demo video script
├── NEON_SETUP.md            # Neon PostgreSQL setup guide
├── quick-signup.js          # Quick user creation script
├── view-data.js             # Database viewing script
└── README.md                # This file
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

For issues and questions:
1. Check the [API Documentation](API_DOCUMENTATION.md)
2. Review the health check endpoint
3. Check server logs for detailed error messages
4. Verify database connectivity and schema

## 🎯 Demo Video Script

To create a demo video showing the system in action:

1. **Setup (30 seconds)**
   - Show the project structure
   - Start the server
   - Open the demo interface

2. **Authentication Flow (30 seconds)**
   - Sign up a new user
   - Show database record creation
   - Login and get JWT token

3. **WebSocket Connection (30 seconds)**
   - Connect WebSocket on two different browser tabs
   - Show connection status and statistics
   - Demonstrate multi-device support

4. **Notification System (30 seconds)**
   - Use admin panel to schedule a test
   - Show real-time notifications on both tabs
   - Demonstrate the notification payload structure

5. **System Overview (30 seconds)**
   - Show health check endpoint
   - Display connection statistics
   - Highlight security features

Total demo time: ~2.5 minutes