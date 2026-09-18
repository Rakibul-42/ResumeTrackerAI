import { Suspense, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { metadataFor, structuredData } from '../../../../shared/public-site.mjs';
import { getPublicConfig } from '@/lib/public-config';
import { Skeleton } from '@/components/ui/Skeleton';

export function RouteLoading() {
  return <main id="main-content" className="mx-auto w-full max-w-6xl p-6 space-y-6" aria-busy="true">
    <h1 className="sr-only">Loading page</h1><p role="status">Loading your page…</p>
    <Skeleton className="h-8 w-48" /><Skeleton className="h-64 w-full rounded-2xl" />
  </main>;
}

function setMeta(attribute, name, content) {
  let element = document.head.querySelector(`meta[${attribute}="${name}"]`);
  if (!content) { element?.remove(); return; }
  if (!element) { element = document.createElement('meta'); element.setAttribute(attribute, name); document.head.append(element); }
  element.content = content;
}

export function RouteFrame() {
  const { pathname } = useLocation();
  useEffect(() => {
    const config = getPublicConfig();
    const meta = metadataFor(pathname, config);
    document.title = meta.title;
    setMeta('name', 'description', meta.description);
    setMeta('name', 'robots', meta.robots);
    for (const [name, value] of Object.entries({title:meta.title,description:meta.description,url:meta.canonical,image:meta.image})) setMeta('property', `og:${name}`, value);
    setMeta('name', 'twitter:card', meta.image ? 'summary_large_image' : null);
    for (const [name, value] of Object.entries({'image:width':'1730','image:height':'909','image:alt':'ResumeTrackerAI — AI-assisted resume review and version tracking'})) setMeta('property',`og:${name}`,meta.image ? value : null);
    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (!meta.canonical) canonical?.remove();
    else {
      if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.append(canonical); }
      canonical.href = meta.canonical;
    }
    document.getElementById('site-schema')?.remove();
    if (pathname === '/' && meta.indexable) {
      const schema = document.createElement('script'); schema.id = 'site-schema'; schema.type = 'application/ld+json'; schema.textContent = JSON.stringify(structuredData(config)); document.head.append(schema);
    }
  }, [pathname]);
  return <Suspense fallback={<RouteLoading />}><Outlet /></Suspense>;
}
