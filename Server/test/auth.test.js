const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { createTestPool } = require('./helpers/database');
const { runMigrations } = require('../src/db/migrate');
const { createApp } = require('../src/app');
const { loadConfig } = require('../src/config');
let pool, app;
const {termsVersion}=require('../../shared/public-site.json');
const config = loadConfig({ POSTGRES_URL: 'postgres://test@localhost/test', GEMINI_API_KEY: 'test', JWT_SECRET: 'x'.repeat(40), NODE_ENV: 'test' });
before(async () => { pool = await createTestPool(); await runMigrations(pool); app = createApp({ pool, config }); });
after(async () => pool?.end());
test('health, 404, malformed JSON and origin errors use JSON envelopes', async () => {
  assert.equal((await request(app).get('/api/health').expect(200)).body.database, 'connected');
  const headers=(await request(app).get('/api/auth/me').expect(401)).headers;
  assert.equal(headers['cache-control'],'private, no-store');
  assert.match(headers['x-robots-tag'],/noindex/);
  assert.equal((await request(app).get('/api/unknown').expect(404)).body.error.code, 'NOT_FOUND');
  await request(app).post('/api/auth/login').set('Content-Type','application/json').send('{').expect(400);
  await request(app).post('/api/auth/login').set('Origin','https://evil.example').send({}).expect(403);
});
test('register/login/profile/password/logout persist data and revoke stale cookies', async () => {
  const credentials = { acceptedTerms:true,termsVersion,name: 'Ada', email: 'ADA@example.com', password: 'correct-horse-battery' };
  const registered = await request(app).post('/api/auth/register').send(credentials).expect(201);
  let cookie = registered.headers['set-cookie'];
  assert.match(cookie[0], /HttpOnly/); assert.match(cookie[0], /SameSite=Lax/);
  assert.equal(registered.body.user.email, 'ada@example.com');
  assert.deepEqual(Object.keys(registered.body.user).sort(), ['_id','createdAt','email','name']);
  assert.notEqual((await pool.query('select password_hash from users')).rows[0].password_hash, credentials.password);
  await request(app).post('/api/auth/register').send(credentials).expect(409);
  await request(app).post('/api/auth/login').send({ email: credentials.email, password: 'wrong-password' }).expect(401);
  await request(app).get('/api/auth/me').expect(401);
  const me = await request(app).get('/api/auth/me').set('Cookie',cookie).expect(200);
  assert.equal(me.body.user.name,'Ada');
  await request(app).patch('/api/auth/profile').set('Cookie',cookie).send({ name:' Grace ' }).expect(200);
  await request(app).patch('/api/auth/password').set('Cookie',cookie).send({ currentPassword:'wrong', newPassword:'new-valid-password' }).expect(401);
  const changed = await request(app).patch('/api/auth/password').set('Cookie',cookie).send({ currentPassword:credentials.password, newPassword:'new-valid-password' }).expect(200);
  await request(app).get('/api/auth/me').set('Cookie',cookie).expect(401);
  cookie = changed.headers['set-cookie'];
  await request(app).get('/api/auth/me').set('Cookie',cookie).expect(200);
  await request(app).post('/api/auth/login').send({email:credentials.email,password:credentials.password}).expect(401);
  const login = await request(app).post('/api/auth/login').send({ email:credentials.email, password:'new-valid-password' }).expect(200);
  cookie = login.headers['set-cookie'];
  assert.equal(login.body.user.name,'Grace');
  await request(app).post('/api/auth/logout').set('Cookie',cookie).expect(200);
  await request(app).get('/api/auth/me').set('Cookie',cookie).expect(401);
});
test('auth rejects invalid fields and bcrypt truncation-length passwords', async () => {
  for (const password of ['short','é'.repeat(40)]) {
    await request(app).post('/api/auth/register').send({name:'Test',email:'test@example.com',password}).expect(400);
  }
  await request(app).get('/api/auth/me').set('Cookie',`${config.cookieName}=forged`).expect(401);
});
test('auth and AI limits return consistent JSON and production cookies are Secure',async()=>{
  const limited=createApp({pool,config:{...config,nodeEnv:'production'},overrides:{rateLimits:{authLimit:1,aiLimit:1}}});
  const registered=await request(limited).post('/api/auth/register').send({acceptedTerms:true,termsVersion,name:'Limit Test',email:'limit@example.com',password:'safe-password'}).expect(201);
  assert.match(registered.headers['set-cookie'][0],/Secure/);
  const cookie=registered.headers['set-cookie'];
  const limitedAuth=await request(limited).post('/api/auth/login').send({}).expect(429);
  assert.equal(limitedAuth.body.error.code,'RATE_LIMITED');
  await request(limited).post('/api/resumes').set('Cookie',cookie).send({}).expect(400);
  const limitedAi=await request(limited).post('/api/resumes').set('Cookie',cookie).send({}).expect(429);
  assert.equal(limitedAi.body.error.code,'RATE_LIMITED');
});
