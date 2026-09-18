const {test}=require('node:test');
const assert=require('node:assert/strict');
const express=require('express');
const request=require('supertest');
const {loadConfig}=require('../src/config');
const env={POSTGRES_URL:'postgres://test@localhost/test',GEMINI_API_KEY:'private-provider-key',JWT_SECRET:'x'.repeat(40)};
function site(extra={}) {
  const {createPublicSiteRouter}=require('../src/http/public-site');
  const app=express();
  app.use(createPublicSiteRouter({config:loadConfig({...env,...extra}),html:'<!doctype html><html><head><title>old</title></head><body><div id="root"></div></body></html>'}));
  return app;
}
test('public HTML includes absolute canonical/social metadata without exposing secrets',async()=>{
  const res=await request(site({PUBLIC_SITE_URL:'https://resumes.example'})).get('/').set('Host','evil.example').expect(200);
  assert.match(res.text,/<title>ResumeTrackerAI/);
  assert.match(res.text,/rel="canonical" href="https:\/\/resumes.example\/"/);
  assert.match(res.text,/property="og:image" content="https:\/\/resumes.example\/og-image.png"/);
  assert.match(res.text,/application\/ld\+json/);
  assert.doesNotMatch(res.text,/private-provider-key|postgres:\/\/|evil.example/);
});
test('private/draft/unknown pages cannot inherit public indexing and unknown paths return 404',async()=>{
  const app=site({PUBLIC_SITE_URL:'https://resumes.example'});
  for(const path of ['/login','/register','/privacy','/resumes/11111111-1111-4111-8111-111111111111']) {
    const res=await request(app).get(path).expect(200);
    assert.match(res.headers['x-robots-tag'],/noindex/);
    assert.match(res.text,/name="robots" content="noindex, nofollow"/);
    assert.doesNotMatch(res.text,/rel="canonical"/);
  }
  await request(app).get('/missing-page').expect(404);
  await request(app).get('/terms/').expect(308).expect('Location','/terms');
});
test('sitemap and robots use only configured indexable public routes',async()=>{
  const app=site({PUBLIC_SITE_URL:'https://resumes.example'});
  const xml=(await request(app).get('/sitemap.xml').expect(200)).text;
  assert.match(xml,/<loc>https:\/\/resumes.example\/<\/loc>/);
  assert.doesNotMatch(xml,/resumes\/|settings|privacy|login/);
  assert.match((await request(app).get('/robots.txt')).text,/Sitemap: https:\/\/resumes.example\/sitemap.xml/);
  const unconfigured=site();
  assert.match((await request(unconfigured).get('/robots.txt')).text,/Disallow: \//);
  assert.doesNotMatch((await request(unconfigured).get('/sitemap.xml')).text,/<loc>/);
  assert.match((await request(unconfigured).get('/')).text,/noindex/);
});
test('business metadata is escaped and legal indexing requires complete reviewed configuration',async()=>{
  assert.throws(()=>loadConfig({...env,PUBLIC_SITE_URL:'http://unsafe.example'}),/PUBLIC_SITE_URL/);
  assert.throws(()=>loadConfig({...env,PUBLIC_POLICIES_READY:'true'}),/PUBLIC_/);
  const app=site({PUBLIC_SITE_URL:'https://resumes.example',PUBLIC_BUSINESS_NAME:'Example </script><script>alert(1)</script>',PUBLIC_CONTACT_EMAIL:'support@example.com',PUBLIC_COUNTRY:'Bangladesh',PUBLIC_POLICIES_READY:'true'});
  const res=await request(app).get('/privacy');
  assert.doesNotMatch(res.text,/<script>alert\(1\)<\/script>/);
  assert.match(res.text,/index, follow/);
  assert.match((await request(app).get('/sitemap.xml')).text,/https:\/\/resumes.example\/privacy/);
});
