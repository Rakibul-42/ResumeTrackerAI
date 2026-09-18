const {test} = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const {createTestPool} = require('./helpers/database');
const {runMigrations} = require('../src/db/migrate');
const {createApp} = require('../src/app');
const {loadConfig} = require('../src/config');

test('production replicas share authentication limits without retaining client IP addresses', async t => {
  const pool=await createTestPool(); t.after(()=>pool.end()); await runMigrations(pool);
  const config=loadConfig({POSTGRES_URL:'postgres://test@localhost/test',GEMINI_API_KEY:'test',JWT_SECRET:'x'.repeat(40),NODE_ENV:'production'});
  const a=createApp({pool,config,overrides:{rateLimits:{authLimit:2}}});
  const b=createApp({pool,config,overrides:{rateLimits:{authLimit:2}}});
  await request(a).post('/api/auth/login').send({}).expect(400);
  await request(b).post('/api/auth/login').send({}).expect(400);
  const rejected=await request(a).post('/api/auth/login').send({}).expect(429);
  assert.equal(rejected.body.error.code,'RATE_LIMITED');
  assert.ok(Number(rejected.headers['retry-after']) > 0);
  const rows=(await pool.query('SELECT * FROM rate_limit_counters')).rows;
  assert.equal(rows.length,1); assert.match(rows[0].key_hash,/^[a-f0-9]{64}$/);
  assert.doesNotMatch(JSON.stringify(rows),/127\.0\.0\.1/);
  await pool.query("UPDATE rate_limit_counters SET expires_at=now()-interval '1 second'");
  await request(b).post('/api/auth/login').send({}).expect(400);
});

test('shared counters increment atomically, isolate scopes, and can expire or reset',async t=>{
  const pool=await createTestPool();t.after(()=>pool.end());await runMigrations(pool);
  const {createPostgresRateLimitStore}=require('../src/http/postgres-rate-limit-store');
  const a=createPostgresRateLimitStore({pool,scope:'auth',secret:'test-secret'});
  const b=createPostgresRateLimitStore({pool,scope:'ai',secret:'test-secret'});
  a.init({windowMs:1000});b.init({windowMs:1000});
  const hits=await Promise.all(Array.from({length:12},()=>a.increment('identity')));
  assert.deepEqual(hits.map(h=>h.totalHits).sort((x,y)=>x-y),Array.from({length:12},(_,i)=>i+1));
  assert.equal((await b.increment('identity')).totalHits,1);
  await a.decrement('identity');assert.equal((await a.increment('identity')).totalHits,12);
  await a.resetKey('identity');assert.equal((await a.increment('identity')).totalHits,1);
  await pool.query("UPDATE rate_limit_counters SET expires_at=now()-interval '1 second'");
  await a.prune();assert.equal((await pool.query('SELECT count(*)::int AS count FROM rate_limit_counters')).rows[0].count,0);
});
