require('dotenv').config();
const { Pool } = require('pg');

async function setupDatabase() {
  // First connect to default 'postgres' database
  const defaultPool = new Pool({
    host: 'localhost',
    database: 'postgres', // Connect to default database first
    user: 'postgres',
    password: 'admin',
    port: 5432,
  });

  try {
    console.log('🔄 Checking if healthcare_db exists...\n');

    // Check if database exists
    const result = await defaultPool.query(
      "SELECT 1 FROM pg_database WHERE datname='healthcare_db'"
    );

    if (result.rows.length > 0) {
      console.log('✅ Database "healthcare_db" already exists!\n');
    } else {
      console.log('⚠️  Database "healthcare_db" does not exist.');
      console.log('🔄 Creating database...\n');
      
      // Create database
      await defaultPool.query('CREATE DATABASE healthcare_db');
      console.log('✅ Database "healthcare_db" created successfully!\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await defaultPool.end();
  }

  // Now connect to healthcare_db and test
  const healthcarePool = new Pool({
    host: 'localhost',
    database: 'healthcare_db',
    user: 'postgres',
    password: 'admin',
    port: 5432,
  });

  try {
    console.log('🔄 Testing connection to healthcare_db...\n');
    
    const result = await healthcarePool.query('SELECT NOW()');
    console.log('✅ Connected to healthcare_db successfully!');
    console.log(`   Server time: ${result.rows[0].now}\n`);
    
    console.log('🎉 Setup complete! You can now start your server.\n');

  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  } finally {
    await healthcarePool.end();
  }
}

setupDatabase();
