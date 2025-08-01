const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import configurations and services
const { initializeDatabase } = require('./config/database');
const { authenticateSocket } = require('./middleware/auth');
const websocketManager = require('./services/websocketManager');

// Import routes
const authRoutes = require('./routes/auth');
const testRoutes = require('./routes/tests');

const app = express();
const server = http.createServer(app);

// Socket.IO setup
const io = socketIo(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Make io available to routes
app.set('io', io);

// Security middleware with CSP configuration for development
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:"],
    },
  },
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
app.use(express.static('public'));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    websocket: {
      stats: websocketManager.getStats()
    }
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/tests', testRoutes);

// WebSocket connection handling
io.use(authenticateSocket);

io.on('connection', (socket) => {
  console.log(`User ${socket.user.name} (${socket.user.id}) connected with socket ID: ${socket.id}`);

  // Add connection to manager
  websocketManager.addConnection(socket.user.id, socket.id);

  // Send welcome message
  socket.emit('connected', {
    message: 'Successfully connected to notification service',
    user: {
      id: socket.user.id,
      name: socket.user.name,
      email: socket.user.email
    },
    timestamp: new Date().toISOString()
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`User ${socket.user.name} (${socket.user.id}) disconnected`);
    websocketManager.removeConnection(socket.id);
  });

  // Handle custom events
  socket.on('ping', () => {
    socket.emit('pong', { timestamp: new Date().toISOString() });
  });

  // Handle notification acknowledgment
  socket.on('notification_ack', (data) => {
    console.log(`Notification acknowledged by ${socket.user.name}:`, data);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Initialize database and start server
const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Initialize database
    await initializeDatabase();
    
    // Load existing connections from database (for server restart scenarios)
    await websocketManager.loadConnectionsFromDB();

    // Start server
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📡 WebSocket server ready for connections`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

startServer(); 