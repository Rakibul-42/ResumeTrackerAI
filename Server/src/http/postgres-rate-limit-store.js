const {createHmac} = require('node:crypto');

function createPostgresRateLimitStore({pool,scope,secret}) {
  let windowMs;
  let nextPrune = 0;
  const hash = key => createHmac('sha256',secret).update(`${scope}:${key}`).digest('hex');
  async function prune() {
    // Bounded cleanup; a database-clock expiry also governs each atomic increment.
    await pool.query(`DELETE FROM rate_limit_counters WHERE (scope,key_hash) IN
      (SELECT scope,key_hash FROM rate_limit_counters WHERE expires_at < now()
       ORDER BY expires_at LIMIT 1000 FOR UPDATE SKIP LOCKED)`);
  }
  return {
    localKeys:false,
    prefix:`${scope}:`,
    init(options) { windowMs = options.windowMs; },
    async increment(key) {
      if (Date.now() >= nextPrune) { nextPrune = Date.now()+60000; await prune(); }
      const {rows} = await pool.query(`INSERT INTO rate_limit_counters(scope,key_hash,hits,expires_at)
        VALUES ($1,$2,1,now()+($3::double precision * interval '1 millisecond'))
        ON CONFLICT (scope,key_hash) DO UPDATE SET
          hits=CASE WHEN rate_limit_counters.expires_at <= now() THEN 1 ELSE rate_limit_counters.hits+1 END,
          expires_at=CASE WHEN rate_limit_counters.expires_at <= now() THEN EXCLUDED.expires_at ELSE rate_limit_counters.expires_at END
        RETURNING hits,expires_at`,[scope,hash(key),windowMs]);
      return {totalHits:rows[0].hits,resetTime:new Date(rows[0].expires_at)};
    },
    async decrement(key) { await pool.query('UPDATE rate_limit_counters SET hits=GREATEST(hits-1,0) WHERE scope=$1 AND key_hash=$2',[scope,hash(key)]); },
    async resetKey(key) { await pool.query('DELETE FROM rate_limit_counters WHERE scope=$1 AND key_hash=$2',[scope,hash(key)]); },
    prune,
  };
}
module.exports = {createPostgresRateLimitStore};
