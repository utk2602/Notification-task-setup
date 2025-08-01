const { Pool } = require('pg');
require('dotenv').config();

// Support both Neon connection string and individual parameters
let poolConfig;

if (process.env.DATABASE_URL) {
  // Use Neon connection string
  poolConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    },
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  };
} else {
  // Fallback to individual parameters (for local development)
  poolConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'notification_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'your_password',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  };
}

const pool = new Pool(poolConfig);

// Test the connection
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Initialize database tables
const initializeDatabase = async () => {
  try {
    // Enable UUID extension if not already enabled
    await pool.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    // Drop existing tables if they exist (for clean slate)
    console.log('Cleaning up existing tables...');
    await pool.query('DROP TABLE IF EXISTS tests CASCADE');
    await pool.query('DROP TABLE IF EXISTS connections CASCADE');
    await pool.query('DROP TABLE IF EXISTS users CASCADE');

    // Create users table
    console.log('Creating users table...');
    await pool.query(`
      CREATE TABLE users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create connections table for WebSocket tracking
    console.log('Creating connections table...');
    await pool.query(`
      CREATE TABLE connections (
        connection_id VARCHAR(255) PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        connected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create tests table
    console.log('Creating tests table...');
    await pool.query(`
      CREATE TABLE tests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        test_name VARCHAR(255) NOT NULL,
        scheduled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Database tables initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  }
};

module.exports = { pool, initializeDatabase }; 