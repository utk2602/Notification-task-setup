# Neon PostgreSQL Setup Guide

This guide will help you set up Neon PostgreSQL for your notification system.

## Step 1: Create a Neon Account

1. Go to [neon.tech](https://neon.tech)
2. Sign up for a free account
3. Verify your email address

## Step 2: Create a New Project

1. Click "Create New Project"
2. Choose a project name (e.g., "notification-system")
3. Select a region closest to you
4. Choose "PostgreSQL 15" (recommended)
5. Click "Create Project"

## Step 3: Get Your Connection String

1. Once your project is created, you'll see a dashboard
2. Click on "Connection Details" in the sidebar
3. Copy the connection string that looks like:
   ```
   postgresql://username:password@hostname:port/database?sslmode=require
   ```

## Step 4: Configure Your Environment

1. Create a `.env` file in your project root (if it doesn't exist)
2. Add your Neon connection string:
   ```
   DATABASE_URL=postgresql://username:password@hostname:port/database?sslmode=require
   ```
3. Add other required environment variables:
   ```
   # Server Configuration
   PORT=3000
   NODE_ENV=development
   
   # JWT Configuration
   JWT_SECRET=your_super_secret_jwt_key_here
   JWT_EXPIRES_IN=24h
   
   # CORS Configuration
   CORS_ORIGIN=http://localhost:3000
   ```

## Step 5: Test Your Connection

1. Start your application:
   ```bash
   npm start
   ```
2. The application will automatically create the required tables
3. Check the console for "Connected to PostgreSQL database" message

## Step 6: Verify Database Tables

Your application will automatically create these tables:
- `users` - User accounts and authentication
- `connections` - WebSocket connection tracking
- `tests` - Test data for notifications

## Troubleshooting

### Connection Issues
- Ensure your `.env` file has the correct `DATABASE_URL`
- Check that your Neon project is active
- Verify the connection string format

### SSL Issues
- The configuration includes `rejectUnauthorized: false` for development
- For production, consider using proper SSL certificates

### Table Creation Issues
- Ensure your Neon user has CREATE TABLE permissions
- Check the console logs for specific error messages

## Benefits of Neon PostgreSQL

1. **No Local Setup**: No need to install PostgreSQL locally
2. **Automatic Backups**: Neon provides automatic backups
3. **Scaling**: Easy to scale as your application grows
4. **Branching**: Create database branches for different environments
5. **Free Tier**: Generous free tier for development and small projects

## Migration from Local PostgreSQL

If you were using local PostgreSQL:
1. Export your data (if any) using pg_dump
2. Import to Neon using the connection string
3. Update your `.env` file with the Neon connection string
4. Test the application

## Security Notes

- Never commit your `.env` file to version control
- Use strong passwords for your Neon database
- Consider using Neon's connection pooling for production
- Regularly rotate your JWT secrets 