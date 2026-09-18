const fs = require('node:fs/promises');
const path = require('node:path');
async function runMigrations(pool, { migrationsDir = path.join(__dirname, 'migrations') } = {}) {
  const client = await pool.connect();
  const applied = [];
  try {
    // Transaction-scoped lock also works with transaction-pooling providers.
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(73482061)');
    await client.query('CREATE TABLE IF NOT EXISTS schema_migrations (version text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())');
    const done = new Set((await client.query('SELECT version FROM schema_migrations')).rows.map(r => r.version));
    const files = (await fs.readdir(migrationsDir)).filter(f => /^\d+.*\.sql$/.test(f)).sort();
    for (const file of files) {
      if (done.has(file)) continue;
      await client.query(await fs.readFile(path.join(migrationsDir, file), 'utf8'));
      await client.query('INSERT INTO schema_migrations(version) VALUES ($1)', [file]);
      applied.push(file);
    }
    await client.query('COMMIT');
    return applied;
  } catch (error) {
    await client.query('ROLLBACK'); throw error;
  } finally { client.release(); }
}
module.exports = { runMigrations };
