import { test } from 'node:test';
import assert from 'node:assert/strict';

test('static pages have route-specific metadata and no public indexing without a verified origin', async () => {
  const { buildPublicFiles } = await import('../scripts/public-build.mjs');
  const files = buildPublicFiles('<html><head><title>old</title></head><body><div id="root"></div></body></html>', {});
  assert.match(files['privacy.html'], /Privacy Policy \| ResumeTrackerAI/);
  assert.match(files['dashboard.html'], /noindex, nofollow/);
  assert.match(files['404.html'], /Page Not Found/);
  assert.match(files['robots.txt'], /Disallow: \//);
  assert.doesNotMatch(files['sitemap.xml'], /<loc>/);
  assert.doesNotMatch(files['_redirects'], /\/\* \/index.html 200/);
});

test('static output uses only explicit public configuration and preserves genuine 404 routing', async () => {
  const { buildPublicFiles } = await import('../scripts/public-build.mjs');
  const files = buildPublicFiles('<html><head></head><body></body></html>', {PUBLIC_SITE_URL:'https://resume.example',JWT_SECRET:'not-for-the-browser'});
  assert.match(files['index.html'], /https:\/\/resume.example\/og-image.png/);
  assert.doesNotMatch(JSON.stringify(files), /not-for-the-browser/);
  assert.match(files['_redirects'], /\/resumes\/:id \/resume-detail.html 200/);
  assert.match(files['_redirects'], /\/\* \/404.html 404/);
  assert.match(files['_headers'], /\/assets\/\*[\s\S]*immutable/);
});

test('private navigation never adds personal identifiers to metadata', async () => {
  const {metadataFor} = await import('../../shared/public-site.mjs');
  const meta = metadataFor('/resumes/12345678-1234-4234-8234-123456789012',{siteUrl:'https://resume.example'});
  assert.equal(meta.known,true);
  assert.equal(meta.canonical,null);
  assert.equal(meta.robots,'noindex, nofollow');
  assert.doesNotMatch(JSON.stringify(meta), /12345678/);
  assert.equal(metadataFor('/resumes/not-a-uuid').known,false);
});
