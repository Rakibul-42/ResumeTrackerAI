const express = require('express');
const {metadataFor,renderPublicHtml,sitemap,robots} = require('../../../shared/public-site.mjs');

function createPublicSiteRouter({config,html}) {
  const router = express.Router();
  const publicConfig = config.publicSite || {};
  router.get('/sitemap.xml',(_req,res)=>res.type('application/xml').set('Cache-Control','public, max-age=0, must-revalidate').send(sitemap(publicConfig)));
  router.get('/robots.txt',(_req,res)=>res.type('text/plain').set('Cache-Control','public, max-age=0, must-revalidate').send(robots(publicConfig)));
  router.get('*',(req,res,next)=>{
    if (req.path === '/api' || req.path.startsWith('/api/')) return next();
    const normalized = req.path.length > 1 ? req.path.replace(/\/+$/, '') : req.path;
    if (normalized !== req.path && metadataFor(normalized,publicConfig).known) return res.redirect(308, normalized);
    const meta = metadataFor(req.path,publicConfig);
    res.set('X-Robots-Tag',meta.robots);
    res.set('Cache-Control',meta.indexable ? 'public, max-age=0, must-revalidate' : 'private, no-store');
    res.status(meta.known ? 200 : 404).type('html').send(renderPublicHtml(html, req.path, publicConfig));
  });
  return router;
}
module.exports = {createPublicSiteRouter};
