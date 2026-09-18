const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const request=require('supertest');
const {randomUUID}=require('node:crypto');
const {createTestPool}=require('./helpers/database');
const {runMigrations}=require('../src/db/migrate');
const {createApp}=require('../src/app');
const {loadConfig}=require('../src/config');
const {sections,analysis}=require('./helpers/fixtures');
let pool,app,cookie,other,resumeId,v1,analysisId,rewriteId;
before(async()=>{
  pool=await createTestPool();await runMigrations(pool);
  app=createApp({pool,config:loadConfig({POSTGRES_URL:'postgres://t@localhost/t',GEMINI_API_KEY:'test',JWT_SECRET:'x'.repeat(40),NODE_ENV:'test'}),overrides:{
    rateLimits:{authLimit:100,aiLimit:100},
    extractPdfText:async()=> 'Ada Lovelace\nWorked on reliable APIs.\nKept the service running.',
    gemini:{parseResume:async()=>structuredClone(sections),analyzeResume:async()=>({...structuredClone(analysis),model:'test-model',bulletRewrites:analysis.bulletRewrites.map(r=>({...r,_id:randomUUID()}))})},
  }});
  for (const email of ['owner@example.com','other@example.com']) {
    const response=await request(app).post('/api/auth/register').send({name:'Test',email,password:'safe-test-password',acceptedTerms:true,termsVersion:'2026-09-18'}).expect(201);
    if(cookie) other=response.headers['set-cookie'];else cookie=response.headers['set-cookie'];
  }
});
after(()=>pool?.end());
const upload=()=>request(app).post('/api/resumes').set('Cookie',cookie).field('acknowledgeAi','true').field('noticeVersion','2026-09-18').field('title','Backend Engineer').attach('file',Buffer.from('%PDF-test'),{filename:'resume.pdf',contentType:'application/pdf'});
test('upload creates durable V1, list count, parsed sections and an event',async()=>{
  const result=await upload().expect(201);resumeId=result.body.resume._id;
  const detail=await request(app).get(`/api/resumes/${resumeId}`).set('Cookie',cookie).expect(200);
  assert.equal(detail.body.versions.length,1);assert.equal(detail.body.versions[0].label,'V1');
  v1=detail.body.versions[0]._id;assert.equal(detail.body.resume.currentVersionId,v1);
  assert.equal(detail.body.versions[0].parsedSections.basics.name,'Ada Lovelace');
  const list=await request(app).get('/api/resumes').set('Cookie',cookie).expect(200);
  assert.equal(list.body.resumes[0].versionCount,1);assert.equal(list.body.resumes[0].bestScore,null);
  await request(app).get(`/api/resumes/${resumeId}/versions/${v1}/analysis`).set('Cookie',cookie).expect(404);
  assert.equal((await pool.query('select * from activity_events')).rows.length,1);
});
test('owned lookups block other accounts and validate UUIDs',async()=>{
  for(const suffix of ['',`/versions/${v1}`,`/analyses`,`/versions/${v1}/analysis`]) {
    await request(app).get(`/api/resumes/${resumeId}${suffix}`).set('Cookie',other).expect(404);
  }
  await request(app).delete(`/api/resumes/${resumeId}`).set('Cookie',other).expect(404);
  await request(app).get('/api/resumes/not-a-uuid').set('Cookie',cookie).expect(400);
  await request(app).get('/api/resumes').expect(401);
});
test('analysis persists the component-compatible score breakdown and latest version score',async()=>{
  const result=await request(app).post(`/api/resumes/${resumeId}/analyze`).set('Cookie',cookie).send({versionId:v1,targetRole:'Engineer'}).expect(201);
  analysisId=result.body.analysis._id;rewriteId=result.body.analysis.bulletRewrites[0]._id;
  assert.deepEqual(result.body.analysis.scoreBreakdown,{keywords:18,formatting:18,impact:18,clarity:18});
  const version=await request(app).get(`/api/resumes/${resumeId}/versions/${v1}`).set('Cookie',cookie).expect(200);
  assert.equal(version.body.version.score,72);
  await request(app).post(`/api/resumes/${resumeId}/analyze`).set('Cookie',other).send({versionId:v1}).expect(404);
  await request(app).post(`/api/resumes/${resumeId}/analyze`).set('Cookie',cookie).send({versionId:randomUUID()}).expect(404);
});
test('selected rewrites create immutable versions with consistent text and diffs',async()=>{
  await request(app).post(`/api/resumes/${resumeId}/rewrite`).set('Cookie',cookie).send({analysisId,rewriteIds:['unknown']}).expect(400);
  const rewritten=await request(app).post(`/api/resumes/${resumeId}/rewrite`).set('Cookie',cookie).send({analysisId,rewriteIds:[rewriteId]}).expect(201);
  assert.equal(rewritten.body.appliedCount,1);assert.equal(rewritten.body.version.label,'V2');
  assert.equal(rewritten.body.version.parsedSections.experience[0].bullets[0],'Developed reliable APIs.');
  const old=await request(app).get(`/api/resumes/${resumeId}/versions/${v1}`).set('Cookie',cookie).expect(200);
  assert.equal(old.body.version.parsedSections.experience[0].bullets[0],'Worked on reliable APIs.');
  for(const mode of ['words','lines']) {
    const diff=await request(app).get(`/api/resumes/${resumeId}/diff`).query({from:v1,to:rewritten.body.version._id,mode}).set('Cookie',cookie).expect(200);
    assert.ok(diff.body.hunks.some(h=>h.type==='add' && h.text.includes('Developed')));
  }
  const results=await Promise.all([1,2].map(()=>request(app).post(`/api/resumes/${resumeId}/rewrite`).set('Cookie',cookie).send({analysisId}).expect(201)));
  assert.deepEqual(results.map(r=>r.body.version.label).sort(),['V3','V4']);
});
test('multipart validation rejects wrong types, excess size and unexpected parts',async()=>{
  await request(app).post('/api/resumes').set('Cookie',cookie).send({}).expect(400);
  await request(app).post('/api/resumes').set('Cookie',cookie).attach('file',Buffer.from('text'),'resume.txt').expect(400);
  await request(app).post('/api/resumes').set('Cookie',cookie).attach('file',Buffer.alloc(5*1024*1024+1),'large.pdf').expect(413);
  await request(app).post('/api/resumes').set('Cookie',cookie).attach('unexpected',Buffer.from('%PDF-test'),'resume.pdf').expect(400);
});
test('failed rewrites roll back and cross-resume inputs cannot change data',async()=>{
  const before=(await pool.query('SELECT count(*)::int AS n FROM resume_versions')).rows[0].n;
  const a=(await pool.query('SELECT bullet_rewrites FROM analyses WHERE id=$1',[analysisId])).rows[0];
  await pool.query('UPDATE analyses SET bullet_rewrites=$2 WHERE id=$1',[analysisId,JSON.stringify(a.bullet_rewrites.map(r=>({...r,original:'This passage is not in the resume.'})))]);
  await request(app).post(`/api/resumes/${resumeId}/rewrite`).set('Cookie',cookie).send({analysisId}).expect(409);
  assert.equal((await pool.query('SELECT count(*)::int AS n FROM resume_versions')).rows[0].n,before);
  await pool.query('UPDATE analyses SET bullet_rewrites=$2 WHERE id=$1',[analysisId,JSON.stringify(a.bullet_rewrites)]);
  await request(app).post(`/api/resumes/${resumeId}/rewrite`).set('Cookie',cookie).send({analysisId,rewriteIds:[rewriteId,rewriteId]}).expect(400);
  await request(app).post(`/api/resumes/${resumeId}/rewrite`).set('Cookie',other).send({analysisId}).expect(404);
  const second=(await upload().expect(201)).body.resume._id;
  await request(app).post(`/api/resumes/${second}/analyze`).set('Cookie',cookie).send({versionId:v1}).expect(404);
  await request(app).post(`/api/resumes/${second}/rewrite`).set('Cookie',cookie).send({analysisId}).expect(404);
  await request(app).get(`/api/resumes/${second}/diff`).set('Cookie',cookie).query({from:v1,to:randomUUID()}).expect(404);
  await request(app).delete(`/api/resumes/${second}`).set('Cookie',cookie).expect(200);
});
test('deleting a resume cascades its versions, analyses and events',async()=>{
  await request(app).delete(`/api/resumes/${resumeId}`).set('Cookie',cookie).expect(200);
  for(const table of ['resumes','resume_versions','analyses','activity_events']) assert.equal((await pool.query(`select * from ${table}`)).rows.length,0);
});
