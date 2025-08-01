# Architecture Overview

## System Architecture

The Real-Time Multi-Device Notification System is designed as a scalable, event-driven architecture that provides instant notifications across multiple devices using WebSocket technology.

## High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Layer                             │
├─────────────────────────────────────────────────────────────────┤
│  Browser Tab 1  │  Browser Tab 2  │  Mobile App  │  Desktop App │
│  (WebSocket)    │  (WebSocket)    │  (WebSocket) │  (WebSocket) │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Transport Layer                            │
├─────────────────────────────────────────────────────────────────┤
│                    Socket.IO Server                             │
│              (WebSocket + HTTP Fallback)                        │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Application Layer                          │
├─────────────────────────────────────────────────────────────────┤
│  Auth Service  │  Test Service  │  Notification │  Connection   │
│                │                │  Service      │  Manager      │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Data Layer                                │
├─────────────────────────────────────────────────────────────────┤
│                    Neon PostgreSQL                              │
│  Users  │  Tests  │  Connections  │  (Future: Notifications)   │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow Architecture

### 1. Authentication Flow
```
HTTP Request → Express Router → Auth Service → Database → JWT Issuance
     │              │              │            │            │
     ▼              ▼              ▼            ▼            ▼
Client Browser → /api/auth/* → bcrypt/JWT → PostgreSQL → Token Response
```

**Detailed Steps:**
1. **Client sends HTTP request** to `/api/auth/signup` or `/api/auth/login`
2. **Express router** routes request to authentication service
3. **Auth service** validates input using Joi schemas
4. **Password hashing** using bcrypt with 12 salt rounds
5. **Database operation** creates/validates user in PostgreSQL
6. **JWT generation** using user ID and email
7. **Response** includes user data and JWT token

### 2. WebSocket Connection Flow
```
WebSocket Handshake → JWT Verification → Connection Registry → Ready State
        │                    │                    │              │
        ▼                    ▼                    ▼              ▼
Socket.IO Client → Auth Middleware → User Validation → Connection Manager
```

**Detailed Steps:**
1. **Client establishes WebSocket** connection with JWT token
2. **Socket.IO middleware** authenticates JWT token
3. **User validation** against database
4. **Connection registration** in WebSocket manager
5. **Welcome message** sent to client
6. **Connection ready** for notifications

### 3. Notification Trigger Flow
```
Event Trigger → User Lookup → Connection Discovery → Multi-Device Push
      │             │              │                    │
      ▼             ▼              ▼                    ▼
Admin Action → Find User → Get All Connections → Socket.IO Broadcast
```

**Detailed Steps:**
1. **Admin triggers event** via `/api/tests/schedule` endpoint
2. **System looks up user** by UUID in database
3. **Connection manager** finds all active connections for user
4. **Notification payload** created with test details
5. **Socket.IO broadcasts** to all user's connected devices
6. **Real-time delivery** to multiple devices simultaneously

## Component Details

### Client Layer
**Purpose**: Multiple client applications connecting to the system

**Components**:
- Web browsers (multiple tabs/windows)
- Mobile applications
- Desktop applications
- Any WebSocket-capable client

**Responsibilities**:
- Establish WebSocket connections
- Authenticate with JWT tokens
- Receive and display notifications
- Send acknowledgment events

### Transport Layer
**Purpose**: Handle real-time communication between clients and server

**Technology**: Socket.IO
- WebSocket with HTTP fallback
- Automatic reconnection
- Cross-browser compatibility
- Event-based communication

**Features**:
- Connection authentication
- Event routing
- Error handling
- Connection state management

### Application Layer

#### Authentication Service
- User registration and login
- JWT token generation and validation
- Password hashing with bcrypt
- Session management

#### Test Management Service
- Test scheduling and management
- Notification triggering
- CRUD operations for tests
- User-specific test retrieval

#### Notification Service
- Real-time notification delivery
- Multi-device broadcasting
- Notification payload formatting
- Delivery confirmation

#### Connection Manager
- Active connection tracking
- User-device mapping
- Connection statistics
- Cleanup on disconnection

### Data Layer
**Purpose**: Persistent storage and data management

**Technology**: Neon PostgreSQL
- Cloud-hosted PostgreSQL
- Automatic backups
- Scalable infrastructure
- SSL encryption

**Tables**:
- `users`: User accounts and authentication
- `connections`: WebSocket connection tracking
- `tests`: Test scheduling and management

## Security Architecture

### Authentication & Authorization
```
JWT Token Flow:
Client → JWT Token → Middleware → Database Validation → Request Processing
```

**Security Features**:
- JWT-based authentication
- Password hashing (bcrypt)
- Token expiration (24 hours)
- Database validation on each request

### Data Protection
- Input validation using Joi schemas
- SQL injection protection via parameterized queries
- CORS configuration
- Rate limiting (100 requests per 15 minutes)
- Security headers via Helmet.js

## Scalability Considerations

### Current Architecture
- Single-instance deployment
- In-memory connection tracking
- Direct database connections

### Future Enhancements
```
┌─────────────────────────────────────────────────────────────────┐
│                    Load Balancer                                │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                Multiple Server Instances                        │
├─────────────────────────────────────────────────────────────────┤
│  Instance 1  │  Instance 2  │  Instance 3  │  Instance N      │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Redis Cluster                                │
│              (Connection State Management)                      │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                Database Cluster                                 │
│              (Read Replicas + Failover)                        │
└─────────────────────────────────────────────────────────────────┘
```

## Performance Metrics

### Connection Handling
- **Maximum connections per user**: 20
- **Connection timeout**: 30 seconds idle
- **Authentication time**: < 100ms
- **Notification delivery**: < 50ms

### Database Performance
- **Connection pooling**: 20 max connections
- **Query optimization**: Indexed UUID fields
- **Response time**: < 10ms for simple queries

## Monitoring & Observability

### Health Checks
- `/health` endpoint with WebSocket statistics
- Database connectivity monitoring
- Connection count tracking
- Error rate monitoring

### Logging
- Request/response logging
- WebSocket connection events
- Error tracking with stack traces
- Performance metrics

## Deployment Architecture

### Development Environment
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Neon DB       │
│   (localhost)   │◄──►│   (localhost)   │◄──►│   (Cloud)       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Production Environment
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   CDN/Static    │    │   Load Balancer │    │   Neon DB       │
│   (CloudFront)  │◄──►│   (ALB/NLB)     │◄──►│   (Cloud)       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   Auto Scaling  │
                       │   Group (ECS)   │
                       └─────────────────┘
```

## Technology Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **WebSocket**: Socket.IO
- **Database**: Neon PostgreSQL
- **Authentication**: JWT + bcrypt
- **Validation**: Joi
- **Security**: Helmet.js, CORS, Rate Limiting

### Frontend (Demo)
- **HTML5/CSS3**: Modern responsive design
- **JavaScript**: Vanilla JS with Socket.IO client
- **UI Framework**: Bootstrap for styling

### Infrastructure
- **Database**: Neon PostgreSQL (cloud-hosted)
- **Development**: Local development server
- **Production**: Docker containers + cloud deployment

## API Design Patterns

### RESTful Endpoints
- **Authentication**: `/api/auth/*`
- **Test Management**: `/api/tests/*`
- **System Health**: `/health`

### WebSocket Events
- **Server Events**: `connected`, `notification`, `pong`
- **Client Events**: `ping`, `notification_ack`

### Error Handling
- **HTTP Status Codes**: 200, 201, 400, 401, 403, 404, 500
- **Error Response Format**: `{ error: "message" }`
- **Validation Errors**: Detailed field-level errors

This architecture provides a robust foundation for real-time notifications with excellent scalability, security, and maintainability. 