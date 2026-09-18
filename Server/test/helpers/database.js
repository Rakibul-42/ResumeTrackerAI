const { PGlite } = require('@electric-sql/pglite');
// PostgreSQL itself, compiled to WASM. Serialize checked-out clients like a pool
// with max=1 so transactions cannot accidentally interleave in tests.
async function createTestPool() {
  const db = new PGlite();
  await db.waitReady;
  let tail = Promise.resolve();
  async function connect() {
    const previous = tail;
    let unlock;
    tail = new Promise(resolve => { unlock = resolve; });
    await previous;
    return {
      async query(sql, params) {
        if (!params && sql.includes(';')) { const results = await db.exec(sql); return results.at(-1); }
        const result = await db.query(sql, params);
        return { ...result, rowCount: result.affectedRows ?? result.rows.length };
      },
      release: unlock,
    };
  }
  return { connect, async query(sql, params) {
    const c = await connect(); try { return await c.query(sql, params); } finally { c.release(); }
  }, end: () => db.close() };
}
module.exports = { createTestPool };
