const { Pool } = require('pg');
require('dotenv').config();

// v1 — intentionally limited pool to cause timeouts under load
const pool = new Pool({
  host:                    process.env.DB_HOST     || 'localhost',
  port:                    process.env.DB_PORT     || 5432,
  database:                process.env.DB_NAME     || 'maneb_results',
  user:                    process.env.DB_USER     || 'postgres',
  password:                process.env.DB_PASSWORD || 'davie1234',
  max:                     5,
  idleTimeoutMillis:       1000,
  connectionTimeoutMillis: 30000,
  statement_timeout:       30000,
});

pool.on('error', (err) => {
  console.error('DB pool error:', err.message);
});

module.exports = pool;
