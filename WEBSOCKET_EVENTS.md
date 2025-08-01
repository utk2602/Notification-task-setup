# WebSocket Events Documentation

## Overview

The notification system uses Socket.IO for real-time bidirectional communication. All WebSocket connections require JWT authentication.

## Connection Setup

### Connect to WebSocket
```
URL: ws://localhost:3000
Authentication: JWT token in auth object
```

**Example with Socket.IO client:**
```javascript
const socket = io('http://localhost:3000', {
  auth: {
    token: 'your_jwt_token_here'
  }
});
```

## Server Events (Client Receives)

### 1. `connected`
Emitted when WebSocket connection is successfully established.

**Payload:**
```json
{
  "message": "Successfully connected to notification service",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### 2. `notification`
Emitted when a new notification is triggered (e.g., test scheduled).

**Payload:**
```json
{
  "type": "test_scheduled",
  "title": "Test Scheduled",
  "message": "Mathematics Final has been scheduled",
  "data": {
    "testId": "660e8400-e29b-41d4-a716-446655440000",
    "testName": "Mathematics Final",
    "scheduledAt": "2024-01-01T12:00:00.000Z"
  },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### 3. `pong`
Response to client's ping event.

**Payload:**
```json
{
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## Client Events (Server Receives)

### 1. `ping`
Test connection health.

**Payload:** None required

**Response:** Server emits `pong` event

### 2. `notification_ack`
Acknowledge receipt of notification.

**Payload:**
```json
{
  "notificationId": "optional_notification_id",
  "receivedAt": "2024-01-01T12:00:00.000Z"
}
```

## Connection States

### Connected
- WebSocket connection established
- JWT token validated
- User authenticated
- Ready to receive notifications

### Disconnected
- Connection lost
- User removed from active connections
- No longer receives notifications

## Error Handling

### Connection Errors
```javascript
socket.on('connect_error', (error) => {
  console.error('Connection failed:', error.message);
  // Handle authentication errors, network issues, etc.
});
```

### Authentication Errors
- Invalid JWT token
- Expired token
- User not found in database

## Multi-Device Support

### Connection Tracking
- Each device connection is tracked separately
- Multiple devices per user are supported
- Notifications sent to all connected devices

### Example Multi-Device Scenario
1. User connects from laptop (connection 1)
2. User connects from phone (connection 2)
3. Admin schedules test
4. Both devices receive `notification` event simultaneously

## Implementation Examples

### JavaScript Client
```javascript
const socket = io('http://localhost:3000', {
  auth: { token: jwtToken }
});

// Listen for connection
socket.on('connected', (data) => {
  console.log('Connected as:', data.user.name);
});

// Listen for notifications
socket.on('notification', (notification) => {
  console.log('New notification:', notification.message);
  // Display notification to user
});

// Test connection
socket.emit('ping');

// Acknowledge notification
socket.emit('notification_ack', {
  receivedAt: new Date().toISOString()
});
```

### React Hook Example
```javascript
import { useEffect, useState } from 'react';
import io from 'socket.io-client';

function useNotifications(jwtToken) {
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!jwtToken) return;

    const newSocket = io('http://localhost:3000', {
      auth: { token: jwtToken }
    });

    newSocket.on('connected', (data) => {
      setIsConnected(true);
      console.log('Connected as:', data.user.name);
    });

    newSocket.on('notification', (notification) => {
      setNotifications(prev => [...prev, notification]);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    setSocket(newSocket);

    return () => newSocket.close();
  }, [jwtToken]);

  return { socket, notifications, isConnected };
}
```

## Security Considerations

### Authentication
- All WebSocket connections require valid JWT token
- Tokens are validated on every connection
- Expired tokens result in connection rejection

### Rate Limiting
- WebSocket connections are subject to rate limiting
- Excessive connection attempts may be blocked

### Data Validation
- All event payloads are validated
- Malformed data is rejected

## Testing WebSocket Events

### Using Postman
1. Create WebSocket request to `ws://localhost:3000`
2. Add header: `Authorization: Bearer your_jwt_token`
3. Connect and send events
4. Monitor received events

### Using Browser Console
```javascript
// Connect to WebSocket
const socket = io('http://localhost:3000', {
  auth: { token: 'your_jwt_token' }
});

// Listen for events
socket.on('connected', console.log);
socket.on('notification', console.log);

// Send test events
socket.emit('ping');
```

## Performance Considerations

### Connection Limits
- Maximum 20 concurrent connections per user
- Connection timeout: 30 seconds idle
- Automatic cleanup of disconnected users

### Scalability
- WebSocket connections are stateless
- Database stores connection mappings
- Horizontal scaling supported via Redis (future enhancement) 