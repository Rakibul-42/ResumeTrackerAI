# Launch Readiness Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans inline, as requested by the user. Steps use checkbox syntax for tracking. Do not delegate or commit.

**Goal:** Implement the approved accessibility, trust, SEO, performance and deployment-readiness improvements without replacing the existing stack.

**Architecture:** Shared UI primitives enforce accessible interactions. Public configuration and a route registry drive policy pages and initial-response metadata. Database-owned pagination, revision-keyed aggregate caching and shared rate limits keep private data isolated across replicas.

**Tech Stack:** React 19, Vite 8, React Router, React Query, Express 4, PostgreSQL/pg, Zod, Gemini, Node test runner, Supertest and PGlite.

**Spec:** `docs/superpowers/specs/2026-09-18-launch-readiness-design.md`

## Global constraints

- Only edit this project; use Git Bash. No commits, pushes, uploads, infrastructure changes or outreach.
- Preserve `Server/.env`, all user credentials, unrelated source/assets and existing data.
- Business details/domain remain unset; policy pages are drafts until reviewed.
- Inline execution is already selected. The folder is not a usable Git repository; do not initialize it or create a worktree.
- Keep real Gemini in production; synthetic data only in explicit tests.
- Regression tests precede behavior changes. Use real rendered markup or API outputs, not source-text assertions.
- Each task ends with focused tests, lint and a review of the affected boundary. Run the complete check at final integration.

## Task 1: Accessible shared primitives and navigation

**Files:** `Client/src/components/auth/AuthShell.jsx`, `components/ui/{Button,IconButton,Checkbox,Tabs,Input}.jsx`, `components/layout/{AppShell,Sidebar,Topbar,PageHeader,CommandPalette,NotificationsPopover}.jsx`, `Client/src/index.css`, `Client/src/App.jsx`; create `Client/test/ui.test.js` and `test/render.js`.

**Interfaces:** Existing component props stay compatible. `AuthField` accepts `id`, error/help attributes and associates its visible label. PageHeader renders the page H1. IconButton derives an accessible name from `aria-label` or `title`. Mobile navigation uses existing route URLs.

- [ ] Write rendered-markup tests through Vite's SSR loader and React DOM server. Assert behavior at the component boundary:

```js
const html = render(AuthField, { label: 'Email', type: 'email', value: '', onChange() {} });
assert.match(html, /<label[^>]+for="([^"]+)"/);
assert.match(render(PageHeader, { title: 'Your resumes' }), /<h1\b/);
assert.match(render(IconButton, { title: 'Open search' }), /aria-label="Open search"/);
```

- [ ] Run `node --test Client/test/ui.test.js`; confirm missing label association/H1/name failures.
- [ ] Implement `useId()` label linkage, accessible errors, explicit icon labels, visible focus, mobile navigation, dialog focus behavior, keyboard tabs, and reduced motion. Use semantic controls and existing URLs.
- [ ] Run the focused tests and `npm --prefix Client run lint`. Reserve browser viewport/focus checks for Task 8.

## Task 2: Truthful public pages and local storage choices

**Files:** landing components, `Client/src/pages/{Landing,Login,Register,Settings}.jsx`, `Client/src/context/ThemeContext.jsx`, `components/layout/NotificationsPopover.jsx`; create `Client/src/lib/preferences.js`, `preferences.test.js`, `components/privacy/PrivacyPreferences.jsx`, `pages/Legal.jsx`, `shared/public-site.cjs`, `docs/asset-and-tracking-inventory.md`.

**Interfaces:** `readPreferences(storage)`, `savePreferences(storage, allowed)`, `readOptional(storage,key)` and `writeOptional(storage,key,value)` control optional local persistence. `public-site.cjs` exports policy versions, public routes and factual policy content without secrets. Legal route props select `privacy`, `terms` or `cookies`.

- [ ] Write tests showing optional storage is denied by default, malformed choices are rejected, revocation removes only app preference keys, and blocked storage does not crash the UI.

```js
assert.equal(readOptional(storage, 'arr-theme'), null);
savePreferences(storage, true);
writeOptional(storage, 'arr-theme', 'light');
assert.equal(readOptional(storage, 'arr-theme'), 'light');
savePreferences(storage, false);
assert.equal(storage.getItem('arr-theme'), null);
```

- [ ] Observe failures, then implement the small storage adapter and connect theme/notification consumers. Add a reusable preferences control with equal accept/reject choices.
- [ ] Add legal draft pages and genuine links. Replace unsupported landing/auth copy and testimonials with factual workflow/limitations content; keep illustrative content labeled.
- [ ] Render public pages in tests to check policy navigation and draft status. Remove remote font loading only with a documented local/system fallback; inventory assets without certifying unknown rights.
- [ ] Run client tests and lint.

## Task 3: Server-enforced form acknowledgement

**Files:** `Server/src/http/routes/{auth,resumes}.js`, `services/auth.js`, `repositories/{users,resumes}.js`, additive migration `003_consent.sql`, auth/resume tests; `Client/src/pages/Register.jsx`, `components/resume/UploadDropzone.jsx`, `api/resumes.js`, API tests.

**Interfaces:** Registration adds `acceptedTerms: true`, `termsVersion`; upload adds multipart `acknowledgeAi: 'true'`, `noticeVersion`. Versions are checked against shared constants. Store version and server time, not IP/UA. Existing rows remain nullable.

- [ ] Add API tests: missing/false/outdated acknowledgement returns 400; accepted current version creates a row with server timestamp; old accounts remain intact after migration.
- [ ] Run `npm --prefix Server test` and observe expected new-contract failures.
- [ ] Implement additive schema, strict validation, and persistence. Wire unchecked required controls in forms and update existing success fixtures to explicitly acknowledge the current policies.
- [ ] Run server/client tests and verify rollback and multipart field limits.

## Task 4: Metadata, public response routing and chunks

**Files:** shared public site module; create `Server/src/http/public-site.js`, `Server/test/public-site.test.js`, `Client/src/components/layout/RouteMetadata.jsx`, `Client/src/pages/NotFound.jsx`; modify `Server/src/{config,app}.js`, `Client/src/{routes,App}.jsx`, `Client/index.html`, `Client/vite.config.js`, environment examples; add local OG asset.

**Interfaces:** Public configuration returns only whitelisted business/domain values. `metadataFor(path, publicConfig)` provides titles, descriptions, canonical and robots policy. Initial HTML, React navigation, sitemap and robots use the same route definitions. Unknown direct URLs return 404.

- [ ] API tests request raw HTML, `/sitemap.xml`, `/robots.txt`, private routes and unknown routes. Assert escaped configured HTTPS canonicals, absence of private IDs in sitemap, private `noindex`, no fake domain when unconfigured and 404 behavior.
- [ ] Observe failing tests; implement metadata insertion before the SPA response, safe public configuration and client navigation metadata. Keep all secrets out of serialized configuration.
- [ ] Lazy-load route modules, preserve error/loading UI and PDF isolation. Add factual JSON-LD and an original OG image with provenance.
- [ ] Run tests/build and compare initial chunks with the baseline. Verify nested-route refreshes and social metadata without JS.

## Task 5: Database pagination and bounded analytics

**Files:** resume/analytics repositories and services, API routes, migrations; all list-consuming client APIs/hooks/pages/selectors/command palette; create pagination domain/helper tests.

**Interfaces:** List endpoints accept `page`, `pageSize`, optional bounded `q`; return `{items,page,pageSize,total,totalPages}`. Default pageSize 25/max 100. Selected version content uses its existing version endpoint. Summary responses retain all-time totals and at most 60 explicitly aggregated chronological points.

- [ ] Seed >25 records and two users; test complete disjoint pages, total counts, stable ordering, invalid limits, out-of-range empty pages and cross-user isolation.
- [ ] Observe failures; implement validated parameterized LIMIT/OFFSET/count queries, paginated version/analysis endpoints and SQL aggregates. Add only indexes used by changed query patterns.
- [ ] Update consumers atomically: page controls, list/search query keys, 250ms debounced search, current-version fetch and selector paging. Preserve all-history totals.
- [ ] Test mutations on later pages and empty/deleted selections, then run complete API/client tests.

## Task 6: Isolated caches, pooling and shared limits

**Files:** create `Server/src/services/aggregate-cache.js`, shared limiter store and tests; modify pool/config/repositories/services/app; add revision and rate-limit migration.

**Interfaces:** Cache key includes userId, aggregate kind and committed database revision. 30s TTL, 200 entries, 5MiB total serialized bytes, max 256KiB/entry. Production limits share PostgreSQL counters; pools expose validated max/idle/connect settings.

- [ ] Tests use two app instances on one test database to prove mutation invalidation, ownership isolation and shared limits. Inject a clock for TTL/eviction tests.
- [ ] Observe failures; bump data revision in mutation transactions, implement bounded aggregate reuse/in-flight coalescing and atomic shared counters with expiry. Hash IP limiter identities using server-held key material.
- [ ] Test invalid configuration, error fallback, deletion, concurrency, oversize entries and two-replica behavior. Never publicly cache private API data.

## Task 7: Payloads and configurable deployment

**Files:** Gemini service/tests; public HTTP middleware/config/tests; `deploy/nginx.conf.example`, `docs/deployment.md`, `.env.example`, package manifests/lockfiles and root README.

**Interfaces:** Parsing sends raw text once; analysis sends parsed sections and role without duplicate raw text. Static hashed assets cache immutably; private responses remain `private, no-store`. HTTPS redirects use configured origin and trusted proxy boundaries.

- [ ] Test Gemini input size/content preservation and exact rewrite matching. Observe duplicate-payload failure, then remove duplication without lossy truncation.
- [ ] Test private/public cache headers, spoofed forwarding/Host values, safe HTTPS redirect and development HTTP behavior; implement configuration and middleware.
- [ ] Write reverse-proxy/TLS, optional two-upstream balancing and CDN bypass templates. Document certificate/provider setup as not deployed, plus pool budgeting and shared rate-limit prerequisites.
- [ ] Remove verified unused dependencies, synchronize lockfiles and rerun tests/build. Do not touch real env values.

## Task 8: Browser verification and handoff documents

**Files:** create project-local browser test/report artifacts, `docs/launch-readiness-checklist.md`, `docs/backlink-strategy.md`; update README and this execution record.

- [ ] Start only scoped test servers with synthetic PDF/fixture AI; inspect existing ports first. Use the approved browser tooling and close only owned processes.
- [ ] Check each principal workflow, keyboard focus, all themes, 320/375/768/1024/1440 widths, reduced motion, one H1, valid links, storage preferences and real PDF download. Record exact limitations instead of false passes.
- [ ] Measure production bundle/network and available lab Web Vitals under matching conditions. No real-user/field claims from local tests.
- [ ] Write manual backlink strategy and map every requested item to code, verified pre-existing behavior or owner deployment/legal prerequisite.
- [ ] Run `npm run check`; review the complete changes for secrets, unrelated modifications, private caching, false claims and unused dependencies. Report results and remaining owner inputs without commits/uploads.

## Execution record

- Written spec approved; implementation plan self-reviewed for the three passes and data/privacy boundaries.
- Existing checkout is not a usable Git repository; work stays in place as requested.
- Implementation and verification progress will be recorded below as tasks complete.
