const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const request=require('supertest');
const {createTestPool}=require('./helpers/database');
const {runMigrations}=require('../src/db/migrate');
const {createApp}=require('../src/app');
const {loadConfig}=require('../src/config');
const {sections}=require('./helpers/fixtures');
const {termsVersion,aiNoticeVersion}=require('../../shared/public-site.json');
let pool,app,parseCalls=0;
before(async()=>{
  pool=await createTestPool();await runMigrations(pool);
  app=createApp({pool,config:loadConfig({POSTGRES_URL:'postgres://test@localhost/test',GEMINI_API_KEY:'test',JWT_SECRET:'x'.repeat(40),NODE_ENV:'test'}),overrides:{
    gemini:{parseResume:async()=>{parseCalls++;return sections;}},extractPdfText:async()=> 'Synthetic resume',
  }});
});
after(async()=>pool?.end());
test('legacy account fixtures keep unknown acceptance empty instead of fabricating history',async()=>{
  const {createUserRepository}=require('../src/repositories/users');
  const user=await createUserRepository(pool).insert({name:'Legacy',email:'legacy@example.com',passwordHash:'test-only-hash'});
  assert.equal(user.terms_version,null);assert.equal(user.terms_accepted_at,null);
});
test('registration requires explicit current terms and stores server-stamped acceptance',async()=>{
  const credentials={name:'Consent Test',email:'consent@example.com',password:'safe-password'};
  await request(app).post('/api/auth/register').send(credentials).expect(400);
  await request(app).post('/api/auth/register').send({...credentials,acceptedTerms:false,termsVersion}).expect(400);
  await request(app).post('/api/auth/register').send({...credentials,acceptedTerms:true,termsVersion:'old'}).expect(400);
  await request(app).post('/api/auth/register').send({...credentials,acceptedTerms:true,termsVersion}).expect(201);
  const row=(await pool.query('SELECT terms_version,terms_accepted_at FROM users WHERE email=$1',[credentials.email])).rows[0];
  assert.equal(row.terms_version,termsVersion);assert.ok(row.terms_accepted_at);
});
test('PDF processing cannot run before AI acknowledgement and its notice is saved',async()=>{
  const registered=await request(app).post('/api/auth/register').send({name:'Upload Test',email:'upload-consent@example.com',password:'safe-password',acceptedTerms:true,termsVersion}).expect(201);
  const cookie=registered.headers['set-cookie'];
  const upload=()=>request(app).post('/api/resumes').set('Cookie',cookie);
  await upload().attach('file',Buffer.from('%PDF-test'),{filename:'test.pdf',contentType:'application/pdf'}).expect(400);
  assert.equal(parseCalls,0);
  await upload().field('acknowledgeAi','false').field('noticeVersion',aiNoticeVersion).attach('file',Buffer.from('%PDF-test'),{filename:'test.pdf',contentType:'application/pdf'}).expect(400);
  assert.equal(parseCalls,0);
  await upload().field('acknowledgeAi','true').field('noticeVersion',aiNoticeVersion).attach('file',Buffer.from('%PDF-test'),{filename:'test.pdf',contentType:'application/pdf'}).expect(201);
  const row=(await pool.query('SELECT ai_notice_version,ai_acknowledged_at FROM resumes')).rows[0];
  assert.equal(row.ai_notice_version,aiNoticeVersion);assert.ok(row.ai_acknowledged_at);
  assert.equal(parseCalls,1);
});
