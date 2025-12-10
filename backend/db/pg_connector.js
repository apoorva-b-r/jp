const { Pool } = require('pg');
require('dotenv').config();

// Create a connection pool for Local PostgreSQL
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'healthcare_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'admin',
  port: process.env.DB_PORT || 5432,
  // No SSL needed for local connection
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Event listeners
pool.on('connect', () => {
  console.log('✅ New client connected to Local PostgreSQL');
});

pool.on('error', (err, client) => {
  console.error('❌ Unexpected error on idle client:', err);
  process.exit(-1);
});

// Test the connection on startup
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Local PostgreSQL connection error:', err.stack);
    console.error('\n🔍 Troubleshooting:');
    console.error('   1. Make sure PostgreSQL is running on port 5432');
    console.error('   2. Check database "healthcare_db" exists');
    console.error('   3. Verify username "postgres" and password "admin"');
    console.error('   4. Try: psql -U postgres -d healthcare_db');
  } else {
    console.log('✅ Connected to Local PostgreSQL');
    console.log(`   Database: ${process.env.DB_NAME}`);
    console.log(`   Server time: ${res.rows[0].now}`);
  }
});

// Export query function and pool
module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
