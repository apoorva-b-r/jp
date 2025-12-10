const { Pool
} = require('pg');
require('dotenv').config();

// Create a connection pool using the DATABASE_URL from the .env file
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Removed SSL configuration since we are connecting locally.
});

// Test the connection on startup
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Local PostgreSQL connection error:', err.stack);
    console.error('   Ensure PostgreSQL is running on port 5432.');
  } else {
    console.log('✅ Connected to Local PostgreSQL.');
  }
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};