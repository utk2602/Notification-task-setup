const express = require('express');
const Joi = require('joi');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const websocketManager = require('../services/websocketManager');

const router = express.Router();

// Validation schema for test scheduling
const scheduleTestSchema = Joi.object({
  userId: Joi.string().uuid().required(),
  testName: Joi.string().min(1).max(255).required()
});

// Schedule a test and trigger notifications
router.post('/schedule', authenticateToken, async (req, res) => {
  try {
    // Validate input
    const { error, value } = scheduleTestSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { userId, testName } = value;

    // Verify the user exists
    const userResult = await pool.query(
      'SELECT id, name FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    // Store the test in database
    const testResult = await pool.query(
      'INSERT INTO tests (user_id, test_name) VALUES ($1, $2) RETURNING id, created_at',
      [userId, testName]
    );

    const test = testResult.rows[0];

    // Create notification payload
    const notification = {
      type: 'NEW_TEST',
      message: `New test scheduled: ${testName}`,
      timestamp: new Date().toISOString(),
      testId: test.id,
      testName: testName,
      userId: userId
    };

    // Send notification to all devices of the user
    const devicesNotified = websocketManager.sendNotificationToUser(userId, notification, req.app.get('io'));

    res.status(200).json({
      message: 'Test scheduled successfully',
      test: {
        id: test.id,
        testName: testName,
        userId: userId,
        scheduledAt: test.created_at
      },
      notification: {
        sent: true,
        devicesNotified: devicesNotified,
        message: `Notification sent to ${devicesNotified} device(s)`
      }
    });

  } catch (error) {
    console.error('Test scheduling error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all tests for a user
router.get('/user/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;

    // Verify the user exists
    const userResult = await pool.query(
      'SELECT id FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get all tests for the user
    const testsResult = await pool.query(
      'SELECT id, test_name, scheduled_at, created_at FROM tests WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );

    res.json({
      tests: testsResult.rows
    });

  } catch (error) {
    console.error('Get tests error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all tests (admin endpoint)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const testsResult = await pool.query(
      `SELECT t.id, t.test_name, t.scheduled_at, t.created_at, 
              u.id as user_id, u.name as user_name, u.email as user_email
       FROM tests t 
       JOIN users u ON t.user_id = u.id 
       ORDER BY t.created_at DESC`
    );

    res.json({
      tests: testsResult.rows
    });

  } catch (error) {
    console.error('Get all tests error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a test
router.delete('/:testId', authenticateToken, async (req, res) => {
  try {
    const { testId } = req.params;

    const result = await pool.query(
      'DELETE FROM tests WHERE id = $1 RETURNING id, test_name, user_id',
      [testId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Test not found' });
    }

    const deletedTest = result.rows[0];

    // Send notification about test deletion
    const notification = {
      type: 'TEST_DELETED',
      message: `Test "${deletedTest.test_name}" has been deleted`,
      timestamp: new Date().toISOString(),
      testId: deletedTest.id,
      testName: deletedTest.test_name,
      userId: deletedTest.user_id
    };

    const devicesNotified = websocketManager.sendNotificationToUser(
      deletedTest.user_id, 
      notification, 
      req.app.get('io')
    );

    res.json({
      message: 'Test deleted successfully',
      test: deletedTest,
      notification: {
        sent: true,
        devicesNotified: devicesNotified
      }
    });

  } catch (error) {
    console.error('Delete test error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 