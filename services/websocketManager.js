const { pool } = require('../config/database');

class WebSocketManager {
  constructor() {
    // In-memory storage for active connections
    this.connections = new Map(); // userId -> Set of socketIds
    this.socketUsers = new Map(); // socketId -> userId
  }

  // Add a new connection
  addConnection(userId, socketId) {
    if (!this.connections.has(userId)) {
      this.connections.set(userId, new Set());
    }
    this.connections.get(userId).add(socketId);
    this.socketUsers.set(socketId, userId);

    // Store connection in database
    this.storeConnectionInDB(userId, socketId);
  }

  // Remove a connection
  removeConnection(socketId) {
    const userId = this.socketUsers.get(socketId);
    if (userId) {
      const userConnections = this.connections.get(userId);
      if (userConnections) {
        userConnections.delete(socketId);
        if (userConnections.size === 0) {
          this.connections.delete(userId);
        }
      }
      this.socketUsers.delete(socketId);

      // Remove connection from database
      this.removeConnectionFromDB(socketId);
    }
  }

  // Get all connections for a user
  getUserConnections(userId) {
    return this.connections.get(userId) || new Set();
  }

  // Send notification to all devices of a user
  sendNotificationToUser(userId, notification, io) {
    const userConnections = this.getUserConnections(userId);
    
    userConnections.forEach(socketId => {
      io.to(socketId).emit('notification', notification);
    });

    return userConnections.size;
  }

  // Broadcast notification to all connected users
  broadcastNotification(notification, io) {
    io.emit('notification', notification);
  }

  // Store connection in database
  async storeConnectionInDB(userId, socketId) {
    try {
      await pool.query(
        'INSERT INTO connections (connection_id, user_id) VALUES ($1, $2) ON CONFLICT (connection_id) DO UPDATE SET connected_at = CURRENT_TIMESTAMP',
        [socketId, userId]
      );
    } catch (error) {
      console.error('Error storing connection in DB:', error);
    }
  }

  // Remove connection from database
  async removeConnectionFromDB(socketId) {
    try {
      await pool.query(
        'DELETE FROM connections WHERE connection_id = $1',
        [socketId]
      );
    } catch (error) {
      console.error('Error removing connection from DB:', error);
    }
  }

  // Get connection statistics
  getStats() {
    return {
      totalUsers: this.connections.size,
      totalConnections: this.socketUsers.size,
      connectionsPerUser: Object.fromEntries(
        Array.from(this.connections.entries()).map(([userId, connections]) => [
          userId,
          connections.size
        ])
      )
    };
  }

  // Load existing connections from database (for server restart)
  async loadConnectionsFromDB() {
    try {
      const result = await pool.query(
        'SELECT connection_id, user_id FROM connections WHERE connected_at > NOW() - INTERVAL \'1 hour\''
      );
      
      result.rows.forEach(row => {
        this.addConnection(row.user_id, row.connection_id);
      });
      
      console.log(`Loaded ${result.rows.length} connections from database`);
    } catch (error) {
      console.error('Error loading connections from DB:', error);
    }
  }
}

module.exports = new WebSocketManager(); 