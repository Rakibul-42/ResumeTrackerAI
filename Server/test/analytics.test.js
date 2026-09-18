const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const request=require('supertest');
const {randomUUID}=require('node:crypto');
const {createTestPool}=require('./helpers/database');
const {runMigrations}=require('../src/db/migrate');
const {createApp}=require('../src/app');
const {loadConfig}=require('../src/config');
const {sections,analysis}=require('./helpers/fixtures');
let pool,app,cookie,other,id;
before(async()=>{
  pool=await createTestPool();await runMigrations(pool);
  app=createApp({pool,config:loadConfig({POSTGRES_URL:'postgres://t@localhost/t',GEMINI_API_KEY:'test',JWT_SECRET:'x'.repeat(40),NODE_ENV:'test'}),overrides:{rateLimits:{authLimit:100,aiLimit:100},extractPdfText:async()=> 'Worked on reliable APIs.',gemini:{parseResume:async()=>structuredClone(sections),analyzeResume:async()=>({...structuredClone(analysis),model:'test',bulletRewrites:analysis.bulletRewrites.map(r=>({...r,_id:randomUUID()}))})}}});
  for(const email of ['owner@example.com','other@example.com']) {
    const r=await request(app).post('/api/auth/register').send({name:'Test',email,password:'test-password',acceptedTerms:true,termsVersion:'2026-09-18'}).expect(201);
    if(cookie) other=r.headers['set-cookie'];else cookie=r.headers['set-cookie'];
  }
});
after(()=>pool?.end());
const get=(path,session=cookie)=>request(app).get(`/api/${path}`).set('Cookie',session).expect(200);
test('new accounts have honest empty analytics and protected endpoints',async()=>{
  for(const path of ['dashboard','insights','versions','history']) await request(app).get(`/api/${path}`).expect(401);
  const d=(await get('dashboard')).body;
  assert.deepEqual(d.totals,{resumes:0,rewrites:0,analyses:0});assert.equal(d.latestResume,null);assert.equal(d.kpi.atsScore.value,null);assert.deepEqual(d.scoreSeries,[]);
  const i=(await get('insights')).body;
  assert.equal(i.averageScore,null);assert.equal(i.bestScore,null);assert.deepEqual(i.resumePerformance,[]);
  assert.deepEqual((await get('versions')).body.totals,{all:0,uploads:0,rewrites:0});
  assert.deepEqual((await get('history')).body.totals,{all:0,upload:0,analyze:0,rewrite:0});
});
test('analytics derive from saved records and never include another account',async()=>{
  id=(await request(app).post('/api/resumes').set('Cookie',cookie).field('acknowledgeAi','true').field('noticeVersion','2026-09-18').field('title','Engineer').attach('file',Buffer.from('%PDF-test'),'resume.pdf').expect(201)).body.resume._id;
  const v=(await get(`resumes/${id}`)).body.versions[0];
  const a=(await request(app).post(`/api/resumes/${id}/analyze`).set('Cookie',cookie).send({versionId:v._id}).expect(201)).body.analysis;
  await request(app).post(`/api/resumes/${id}/rewrite`).set('Cookie',cookie).send({analysisId:a._id}).expect(201);
  const d=(await get('dashboard')).body;
  assert.deepEqual(d.totals,{resumes:1,rewrites:1,analyses:1});assert.equal(d.latestResume._id,id);
  assert.equal(d.kpi.atsScore.value,null);assert.equal(d.kpi.versions.value,2);assert.equal(d.versionStack.length,2);
  assert.deepEqual(d.scoreSeries,[{label:'V1',score:72}]);assert.equal(d.activity.length,3);
  const i=(await get('insights')).body;
  assert.equal(i.averageScore,72);assert.equal(i.bestScore.value,72);assert.equal(i.resumePerformance[0].analysesCount,1);
  assert.equal(i.topMissingKeywords[0].keyword,'Testing');assert.equal(i.topIssues[0].count,1);
  assert.deepEqual((await get('versions')).body.totals,{all:2,uploads:1,rewrites:1});
  const h=(await get('history')).body;
  assert.deepEqual(h.totals,{all:3,upload:1,analyze:1,rewrite:1});assert.equal(h.events[0].type,'rewrite');
  assert.equal((await get('dashboard',other)).body.totals.resumes,0);assert.equal((await get('insights',other)).body.totalAnalyses,0);
  assert.equal((await get('versions',other)).body.versions.length,0);assert.equal((await get('history',other)).body.events.length,0);
});
test('deletion removes the resume from every aggregate',async()=>{
  await request(app).delete(`/api/resumes/${id}`).set('Cookie',cookie).expect(200);
  assert.equal((await get('dashboard')).body.totals.resumes,0);assert.equal((await get('insights')).body.totalAnalyses,0);
  assert.equal((await get('history')).body.totals.all,0);assert.equal((await get('versions')).body.totals.all,0);
});
