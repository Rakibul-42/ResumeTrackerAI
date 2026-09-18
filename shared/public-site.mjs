import site from './public-site.json' with { type: 'json' };

export const routes = site.routes;
const detailRoute = /^\/resumes\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(\/export)?$/i;
const clean = value => typeof value === 'string' ? value.trim() : '';
export function publicConfigFromEnv(env = {}) {
  const siteUrl = clean(env.PUBLIC_SITE_URL);
  if (siteUrl) {
    let url;
    try { url = new URL(siteUrl); } catch { throw new Error('Invalid PUBLIC_SITE_URL'); }
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.pathname !== '/') throw new Error('Invalid PUBLIC_SITE_URL: use an HTTPS origin only.');
  }
  const config = { siteUrl: siteUrl ? new URL(siteUrl).origin : '', businessName: clean(env.PUBLIC_BUSINESS_NAME), contactEmail: clean(env.PUBLIC_CONTACT_EMAIL), country: clean(env.PUBLIC_COUNTRY), policiesReady: env.PUBLIC_POLICIES_READY === 'true' };
  if (clean(env.PUBLIC_POLICIES_READY) && !['true','false'].includes(env.PUBLIC_POLICIES_READY)) throw new Error('Invalid PUBLIC_POLICIES_READY');
  if (config.contactEmail && !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(config.contactEmail)) throw new Error('Invalid PUBLIC_CONTACT_EMAIL');
  if ([config.businessName, config.contactEmail, config.country].some(value => value.length > 200)) throw new Error('PUBLIC_ business details must not exceed 200 characters.');
  if (config.policiesReady && (!config.siteUrl || !config.businessName || !config.contactEmail || !config.country)) throw new Error('PUBLIC_POLICIES_READY requires PUBLIC_SITE_URL, PUBLIC_BUSINESS_NAME, PUBLIC_CONTACT_EMAIL and PUBLIC_COUNTRY.');
  return config;
}
export function metadataFor(pathname, config = {}) {
  const route = routes[pathname] || (detailRoute.test(pathname) ? { title: `${pathname.endsWith('/export') ? 'Export Resume' : 'Resume Details'} | ResumeTrackerAI`, description: 'Your private resume workspace.' } : null);
  const indexable = Boolean(route?.public && config.siteUrl && (!route.policy || config.policiesReady));
  return { title: route?.title || 'Page Not Found | ResumeTrackerAI', description: route?.description || 'This page could not be found.', known: Boolean(route), indexable, robots: indexable ? 'index, follow' : 'noindex, nofollow', canonical: indexable ? `${config.siteUrl}${pathname}` : null, image: indexable ? `${config.siteUrl}/og-image.png` : null };
}
export const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
export const safeJson = value => JSON.stringify(value).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
export function structuredData(config) {
  return { '@context':'https://schema.org', '@type':'WebApplication', name:site.brand, url:config.siteUrl, applicationCategory:'BusinessApplication', operatingSystem:'Web browser', description:routes['/'].description };
}
export function renderPublicHtml(html, pathname, config = {}) {
  const meta = metadataFor(pathname, config);
  // Build and the optional Express host can both run this without duplicate tags.
  const base = html.replace(/<!-- public-site:start -->[\s\S]*?<!-- public-site:end -->/g, '').replace(/<title>[\s\S]*?<\/title>/gi, '');
  const tags = [
    `<title>${escapeHtml(meta.title)}</title>`,
    `<meta name="description" content="${escapeHtml(meta.description)}">`,
    `<meta name="robots" content="${meta.robots}">`,
    `<meta property="og:title" content="${escapeHtml(meta.title)}">`,
    `<meta property="og:description" content="${escapeHtml(meta.description)}">`,
    '<meta property="og:type" content="website">',
    '<meta property="og:site_name" content="ResumeTrackerAI">',
  ];
  if (meta.canonical) tags.push(`<link rel="canonical" href="${escapeHtml(meta.canonical)}">`, `<meta property="og:url" content="${escapeHtml(meta.canonical)}">`, `<meta property="og:image" content="${escapeHtml(meta.image)}">`, '<meta property="og:image:alt" content="ResumeTrackerAI — AI-assisted resume review and version tracking">', '<meta property="og:image:width" content="1730">', '<meta property="og:image:height" content="909">', '<meta name="twitter:card" content="summary_large_image">');
  if (pathname === '/' && meta.indexable) tags.push(`<script id="site-schema" type="application/ld+json">${safeJson(structuredData(config))}</script>`);
  tags.push(`<script id="public-config" type="application/json">${safeJson(config)}</script>`);
  return base.replace('</head>', `<!-- public-site:start -->\n${tags.join('\n')}\n<!-- public-site:end -->\n</head>`);
}
export function sitemap(config = {}) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${Object.keys(routes).filter(path => metadataFor(path, config).indexable).map(path => `<url><loc>${escapeHtml(config.siteUrl + path)}</loc></url>`).join('')}</urlset>\n`;
}
export function robots(config = {}) {
  if (!config.siteUrl) return 'User-agent: *\nDisallow: /\n';
  // Private SPA HTML exposes no resume data and carries noindex. Allow crawling
  // that HTML so crawlers can actually see noindex; API data is never crawlable.
  return `User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: ${config.siteUrl}/sitemap.xml\n`;
}
