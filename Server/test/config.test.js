const test = require('node:test');
const assert = require('node:assert/strict');
const { loadConfig } = require('../src/config');
const { AppError, toErrorBody } = require('../src/errors');
const valid = { POSTGRES_URL: 'postgres://test:password@localhost/test', GEMINI_API_KEY: 'test-key', JWT_SECRET: 'x'.repeat(40) };
test('configuration requires named settings without leaking input values', () => {
  assert.throws(() => loadConfig({}), /POSTGRES_URL/);
  assert.throws(() => loadConfig({ ...valid, JWT_SECRET: 'private' }), e => e.message.includes('JWT_SECRET') && !e.message.includes('private'));
  assert.throws(() => loadConfig({ ...valid, POSTGRES_URL: 'https://example.com' }), /POSTGRES_URL/);
});
test('configuration normalizes defaults, explicit booleans and URL alias', () => {
  assert.equal(loadConfig(valid).port, 8000);
  assert.equal(loadConfig(valid).autoMigrate, true);
  assert.equal(loadConfig({ ...valid, AUTO_MIGRATE: 'false' }).autoMigrate, false);
  assert.equal(loadConfig({ ...valid, POSTGRES_URL: undefined, DATABASE_URL: valid.POSTGRES_URL }).postgresUrl, valid.POSTGRES_URL);
  assert.throws(() => loadConfig({ ...valid, AUTO_MIGRATE: 'wrong' }));
});
test('blank optional .env entries use defaults, but required secrets still fail', () => {
  const config=loadConfig({...valid,PORT:'',NODE_ENV:'',CLIENT_ORIGIN:'',JWT_EXPIRES_IN:'',GEMINI_MODEL:'',COOKIE_NAME:''});
  assert.equal(config.port,8000);assert.equal(config.geminiModel,'gemini-2.5-flash');
  assert.throws(()=>loadConfig({...valid,GEMINI_API_KEY:''}),/GEMINI_API_KEY/);
});
test('PostgreSQL pool limits are configurable and reject unsafe ranges', () => {
  const config=loadConfig({...valid,PG_POOL_MAX:'4',PG_IDLE_TIMEOUT_MS:'15000',PG_CONNECT_TIMEOUT_MS:'5000'});
  assert.deepEqual(config.pool,{max:4,idleTimeoutMillis:15000,connectionTimeoutMillis:5000});
  assert.equal(loadConfig(valid).pool.max,10);
  for(const [key,value] of [['PG_POOL_MAX','0'],['PG_POOL_MAX','201'],['PG_IDLE_TIMEOUT_MS','-1'],['PG_CONNECT_TIMEOUT_MS','0']]) assert.throws(()=>loadConfig({...valid,[key]:value}),new RegExp(key));
});
test('unknown errors hide internals; expected errors preserve safe messages', () => {
  assert.deepEqual(toErrorBody(new Error('SQL secret')), { error: { code: 'INTERNAL_ERROR', message: 'Something went wrong. Please try again.' } });
  assert.equal(toErrorBody(new AppError(400, 'INVALID_PDF', 'Upload a PDF')).error.code, 'INVALID_PDF');
});
