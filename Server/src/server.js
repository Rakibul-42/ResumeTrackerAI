const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { loadConfig } = require('./config');
const { createPool } = require('./db/pool');
const { runMigrations } = require('./db/migrate');
const { createApp } = require('./app');

async function start() {
  let pool;
  let config;
  try {
    config = loadConfig();
    pool = createPool(config.postgresUrl, config.pool);
    if (config.autoMigrate) {
      const applied = await runMigrations(pool);
      console.log(`Database ready (${applied.length} new migration(s)).`);
    } else {
      await pool.query('SELECT 1 FROM schema_migrations LIMIT 1');
    }
    const server = createApp({ config, pool }).listen(config.port, () => {
      console.log(`ResumeTrackerAI API: http://localhost:${config.port}/api`);
      console.log(`Allowed frontend: ${config.clientOrigin}`);
    });
    let closing = false;
    const shutdown = () => {
      if (closing) return;
      closing = true;
      const timeout = setTimeout(() => process.exit(1), 10000).unref();
      server.close(async () => {
        await pool.end();
        clearTimeout(timeout);
        process.exit(0);
      });
    };
    server.on('error', async error => {
      console.error(error.code === 'EADDRINUSE'
        ? `Port ${config.port} is already in use. Stop the other server or change PORT and the frontend proxy target.`
        : 'The HTTP server could not start.');
      await pool.end();
      process.exitCode = 1;
    });
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
    return server;
  } catch (error) {
    // Never print a connection string, provider response, or secret.
    console.error(!config ? error.message : 'Database startup failed. Check POSTGRES_URL, database availability, TLS settings and migration permissions.');
    await pool?.end();
    process.exitCode = 1;
  }
}

if (require.main === module) start();
module.exports = { start };
