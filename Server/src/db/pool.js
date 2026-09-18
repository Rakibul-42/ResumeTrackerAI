const { Pool } = require('pg');
function createPool(connectionString, options = {}) {
  const pool = new Pool({ connectionString, max: 10, idleTimeoutMillis: 30000, connectionTimeoutMillis: 10000, ...options });
  pool.on('error', () => console.error('PostgreSQL connection error; a connection will be re-established.'));
  return pool;
}
module.exports = { createPool };
