const { Pool } = require('pg');
require('dotenv').config();

/**
 * Configuration for the database connection pool.
 * Uses environment variables for security and flexibility.
 */
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  max: 20, // Max number of clients in the pool
  idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: 2000, // How long to wait for a connection from the pool
});

pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

console.log('Database pool created successfully.');

module.exports = {
  // A helper function to run queries.
  query: (text, params) => pool.query(text, params),
  // A helper function to get a client from the pool for transactions
  getClient: () => pool.connect(),
};