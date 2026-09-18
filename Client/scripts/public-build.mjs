import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import process from 'node:process';
import { loadEnv } from 'vite';
import { publicConfigFromEnv, routes, renderPublicHtml, metadataFor, sitemap, robots } from '../../shared/public-site.mjs';

export function buildPublicFiles(html, env = {}) {
  // Branch/preview deploys must not index or canonicalize to the production site.
  const preview = env.CONTEXT && env.CONTEXT !== 'production';
  const config = publicConfigFromEnv(preview ? {...env,PUBLIC_SITE_URL:'',PUBLIC_POLICIES_READY:'false'} : env);
  const files = {};
  const rewrites = [];
  const headers = ['/*\n  X-Content-Type-Options: nosniff\n  X-Frame-Options: DENY\n  Referrer-Policy: strict-origin-when-cross-origin\n  Permissions-Policy: camera=(), microphone=(), geolocation=()\n  Cache-Control: public, max-age=0, must-revalidate', '/assets/*\n  Cache-Control: public, max-age=31536000, immutable'];
  for (const route of Object.keys(routes)) {
    const filename = route === '/' ? 'index.html' : `${route.slice(1)}.html`;
    files[filename] = renderPublicHtml(html,route,config);
    if (route !== '/') rewrites.push(`${route} /${filename} 200`);
    if (!metadataFor(route,config).indexable) headers.push(`${route}\n  X-Robots-Tag: noindex, nofollow`, `/${filename}\n  X-Robots-Tag: noindex, nofollow`);
  }
  files['resume-detail.html'] = renderPublicHtml(html,'/resumes/00000000-0000-4000-8000-000000000000',config);
  files['resume-export.html'] = renderPublicHtml(html,'/resumes/00000000-0000-4000-8000-000000000000/export',config);
  files['404.html'] = renderPublicHtml(html,'/not-found',config);
  rewrites.push('/resumes/:id/export /resume-export.html 200', '/resumes/:id /resume-detail.html 200', '/* /404.html 404');
  headers.push('/resumes/*\n  X-Robots-Tag: noindex, nofollow', '/404.html\n  X-Robots-Tag: noindex, nofollow', '/resume-detail.html\n  X-Robots-Tag: noindex, nofollow', '/resume-export.html\n  X-Robots-Tag: noindex, nofollow');
  files['sitemap.xml'] = sitemap(config);
  files['robots.txt'] = robots(config);
  files['_redirects'] = rewrites.join('\n') + '\n';
  files['_headers'] = headers.join('\n\n') + '\n';
  return files;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const dist = fileURLToPath(new URL('../dist/',import.meta.url));
  const publicEnv = loadEnv('production', path.dirname(dist.replace(/[\\/]$/, '')), 'PUBLIC_');
  const files = buildPublicFiles(await readFile(path.join(dist,'index.html'),'utf8'),{...publicEnv,...process.env});
  await Promise.all(Object.entries(files).map(([filename,content])=>writeFile(path.join(dist,filename),content)));
  console.log(`Generated ${Object.keys(files).length} public routing/metadata files.`);
}
