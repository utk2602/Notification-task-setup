const { Pool } = require('pg');
require('dotenv').config();

async function viewData() {
  console.log('🔍 Viewing Neon PostgreSQL Data...\n');

  // Check if DATABASE_URL is set
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not found in environment variables');
    console.log('Please add your Neon connection string to your .env file');
    return;
  }

  // Create pool configuration
  const poolConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  };

  const pool = new Pool(poolConfig);

  try {
    const client = await pool.connect();
    console.log('✅ Connected to Neon PostgreSQL\n');

    // Check if tables exist
    console.log('📋 Checking tables...');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('📊 Available tables:', tablesResult.rows.map(row => row.table_name).join(', '));
    console.log('');

    // View users data
    console.log('👥 USERS TABLE:');
    const usersResult = await client.query('SELECT * FROM users ORDER BY created_at DESC');
    if (usersResult.rows.length === 0) {
      console.log('   No users found');
    } else {
      usersResult.rows.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.name} (${user.email}) - Created: ${user.created_at}`);
      });
    }
    console.log('');

    // View connections data
    console.log('🔗 CONNECTIONS TABLE:');
    const connectionsResult = await client.query(`
      SELECT c.connection_id, u.name as user_name, c.connected_at
      FROM connections c
      JOIN users u ON c.user_id = u.id
      ORDER BY c.connected_at DESC
    `);
    
    if (connectionsResult.rows.length === 0) {
      console.log('   No connections found');
    } else {
      connectionsResult.rows.forEach((conn, index) => {
        console.log(`   ${index + 1}. ${conn.user_name} - Connected: ${conn.connected_at}`);
      });
    }
    console.log('');

    // View tests data
    console.log('📝 TESTS TABLE:');
    const testsResult = await client.query(`
      SELECT t.test_name, u.name as user_name, t.scheduled_at
      FROM tests t
      JOIN users u ON t.user_id = u.id
      ORDER BY t.scheduled_at DESC
    `);
    
    if (testsResult.rows.length === 0) {
      console.log('   No tests found');
    } else {
      testsResult.rows.forEach((test, index) => {
        console.log(`   ${index + 1}. ${test.test_name} for ${test.user_name} - Scheduled: ${test.scheduled_at}`);
      });
    }
    console.log('');

    // Show statistics
    console.log('📈 STATISTICS:');
    const statsResult = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM connections) as total_connections,
        (SELECT COUNT(*) FROM tests) as total_tests
    `);
    
    const stats = statsResult.rows[0];
    console.log(`   Total Users: ${stats.total_users}`);
    console.log(`   Total Connections: ${stats.total_connections}`);
    console.log(`   Total Tests: ${stats.total_tests}`);

    client.release();
    console.log('\n✅ Data viewing completed!');

  } catch (error) {
    console.error('❌ Error viewing data:', error.message);
  } finally {
    await pool.end();
  }
}

// Run the data viewer
viewData(); 