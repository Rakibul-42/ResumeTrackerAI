# Netlify frontend + Render API — preparation, not a completed deployment

No hosting resources, billing settings, DNS records or credentials were changed. Do not launch publicly yet: the API routing/long-running AI flow still needs the decision below, followed by deployed testing and owner policy review.

## Open architecture decision

The browser currently uses same-origin `/api`, with HttpOnly, SameSite=Lax cookies. A Netlify proxy to Render would preserve that arrangement, but Netlify documents a **26-second proxy timeout**. Gemini currently allows 60 seconds per attempt plus one retry for transient provider failures. A plain proxy therefore cannot reliably carry the current synchronous upload/analysis flow. [Netlify proxy documentation](https://docs.netlify.com/manage/routing/redirects/rewrites-proxies/).

Recommended, awaiting owner approval: PostgreSQL-backed AI jobs on Render, quick acknowledgement responses and owner-scoped progress polling. Jobs need atomic claims, durable status, bounded retries, cancellation/deletion rules and idempotent result persistence. Do not replace this with a fire-and-forget in-memory queue. Upload text extraction also needs timeout/cold-start verification. The job table/worker and API proxy are **not implemented yet**.

Alternative to discuss: direct browser-to-API calls on deliberate same-site custom domains with reviewed cookie/CORS/CSRF settings. Do not simply change Axios to an unrelated `onrender.com` domain and expect the existing cookie policy to work.

## Frontend build

`netlify.toml` uses the repository root and publishes `Client/dist`:

```bash
npm --prefix Client ci --include=dev
npm --prefix Client run build
```

The build creates route-specific HTML metadata, `sitemap.xml`, `robots.txt`, `_headers` and exact known-route rewrites. Unknown paths retain 404 status; nested resume paths use private/noindex HTML. Vite emits minified, hashed chunks; only `/assets/*` gets one-year immutable browser caching. Route HTML revalidates on navigation. The frontend's actual data still requires the unfinished API integration above.

Set public build values in Netlify's UI, not secrets:

| Setting | Meaning |
| --- | --- |
| `PUBLIC_SITE_URL` | Final HTTPS frontend origin, no path/query/fragment |
| `PUBLIC_BUSINESS_NAME` | Verified operator/business name |
| `PUBLIC_CONTACT_EMAIL` | Verified public contact address |
| `PUBLIC_COUNTRY` | Operating country |
| `PUBLIC_POLICIES_READY` | Leave `false` until the text and owner details are reviewed |

Local builds also read `PUBLIC_*` values from `Client/.env` using Vite's production env-file rules. Existing `Server/.env` is never copied to the frontend. Legal pages stay draft/noindex until all required public details are configured and readiness is explicitly enabled. An unset origin means no canonical, an empty sitemap and noindex output. Netlify preview/branch contexts also remain noindex. Rebuild when public values change.

## Render backend

`deploy/render.yaml.example` is a reference, not an active deployment. Keep **Root Directory blank/repository root**, because Server imports `shared/`. The API honors Render's `PORT` environment value.

```bash
npm --prefix Server ci --omit=dev
npm --prefix Server start
```

Set `NODE_ENV=production`, the exact frontend HTTPS `CLIENT_ORIGIN`, `POSTGRES_URL` (or `DATABASE_URL`), `GEMINI_API_KEY`, and a random `JWT_SECRET` of at least 32 characters in Render. Keep database/AI/JWT values off Netlify. Choose an available Gemini model for your provider account. Health check: `/api/health` verifies a database query, not Gemini quota.

`AUTO_MIGRATE=true` applies additive migrations under a PostgreSQL advisory lock at startup. For separated permissions, run `npm run db:migrate` with the migration role first, then start with `AUTO_MIGRATE=false`. Back up an existing database before deploying migrations. Use provider-recommended TLS connection settings; never disable certificate validation globally.

## HTTPS, CDN, replicas and limits

Render provides managed certificates and HTTP-to-HTTPS redirects. Netlify supplies managed HTTPS and CDN delivery for hosted static files. Configure and verify custom-domain DNS/certificates in the respective dashboards; no certificate, DNS or live redirect was tested here. Avoid HSTS preload/includeSubDomains until every affected domain is ready. [Render TLS](https://render.com/docs/tls), [Netlify HTTPS](https://docs.netlify.com/manage/domains/secure-domains-with-https/https-ssl/).

Production auth and AI rate limits use PostgreSQL atomic counters shared by API replicas. Counter keys are HMAC hashes rather than stored raw IP addresses; expired rows are pruned in bounded batches during traffic. A store failure fails closed. Development/test mode uses memory counters. Reverse-proxy client-IP attribution still needs review when final API routing is selected: do not blindly enable `trust proxy: true` or trust browser-supplied forwarding headers.

Pool settings: `PG_POOL_MAX` (default 10), `PG_IDLE_TIMEOUT_MS` (30000), `PG_CONNECT_TIMEOUT_MS` (10000). Budget all replica/worker pools plus migration/admin headroom below the database's connection limit. The migration CLI uses a one-connection pool. Shared rate limits are one prerequisite for replicas, **not proof that multi-instance deployment is ready**: background jobs and aggregate-cache invalidation remain unfinished. Load balancing/scaling are provider configuration, not resources created by this repository.

Keep all authenticated API responses uncacheable by public CDNs. The existing client query cache is account-scoped through sign-out cleanup; planned server aggregate caching must include both owner identity and database revision. Never publicly cache resume text, analyses, cookies or job results.

## Before public launch

Complete the AI job/proxy decision, real PostgreSQL/Gemini smoke tests, trusted-proxy configuration, mobile/keyboard audit, pagination/aggregate work, actual PDF download test, provider policy review and verified business details. The full execution record is in `docs/superpowers/plans/2026-09-18-launch-readiness-plan.md`.
