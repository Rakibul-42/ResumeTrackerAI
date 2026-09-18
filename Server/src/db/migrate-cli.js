require('dotenv').config({ path: require('node:path').resolve(__dirname, '../../.env') });
const { createPool } = require('./pool');
const { runMigrations } = require('./migrate');
async function main() {
  const url = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  if (!url) throw new Error('POSTGRES_URL is required');
  const pool = createPool(url,{max:1});
  try { const files = await runMigrations(pool); console.log(`Database ready: ${files.length} migration(s) applied.`); }
  finally { await pool.end(); }
}
main().catch(() => { console.error('Migration failed. Check POSTGRES_URL, database access, and schema permissions.'); process.exitCode = 1; });
