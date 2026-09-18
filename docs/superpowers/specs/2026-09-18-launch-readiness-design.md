# ResumeTrackerAI launch-readiness design

Date: 2026-09-18

Status: Written specification approved by the user on 2026-09-18. This document describes intended work, not completed implementation or a production-readiness certification.

## 1. Goal and boundaries

Improve the existing React/Vite frontend and Express/PostgreSQL/Gemini backend for accessibility, truthful public content, SEO, responsiveness, performance, and configurable deployment. Preserve the application's visual identity and working resume workflow. Do not migrate frameworks or rebuild unrelated components.

User constraints:

- Work only within `F:/Documents/Projects/ResumeTrackerAi`.
- Run project commands through Git Bash at `E:/Git/bin/bash.exe`.
- Do not commit, push, upload, deploy, provision infrastructure, or perform backlink outreach.
- Do not read out, replace, or edit the existing `Server/.env`; document additions in examples and setup instructions.
- Preserve unrelated files and user changes. Remove a dependency only after verifying that application code, scripts, and configuration do not use it.
- Continue inline; no delegated implementation or subagents.
- Keep real Gemini as the production provider. Deterministic fixtures are for explicit tests only.

The user will provide verified business details later and has not selected hosting. Business identity, contact email, country, address, domain, legal jurisdiction, provider retention commitments, image permissions, customer endorsements, and service guarantees must not be invented.

The requested `mobile.txt` is interpreted as `robots.txt` plus mobile-friendly pages, as explained in chat. Do not create a misleading nonstandard SEO file without clarification.

## 2. Baseline and selected approach

The existing backend already has ownership-scoped SQL, migrations, foreign-key indexes, connection pooling, cookie authentication, real PDF extraction, validated Gemini output, immutable resume versions, and integration tests. The frontend already has React Query caching, several loading skeletons, and lazy PDF export.

Source inspection identified these gaps:

- `Client/index.html` has a generic title and no route-specific SEO metadata.
- Most routes are eagerly imported; charts and other private-page code can enter the initial bundle.
- Landing/footer content includes placeholder destinations, unverified usage numbers, testimonials, and availability claims.
- Shared authentication labels are not associated with their inputs.
- The application sidebar is hidden below the medium breakpoint without equivalent navigation in that component.
- Theme colors, transparency, hover states, focus indicators, and continuous animation require browser verification.
- Google Fonts is loaded through a remote CSS import; no third-party tracking script or iframe was found in the source scan. A runtime network check is still required.
- List endpoints are unpaginated, and analytics loads a complete user snapshot into JavaScript.
- Global `Cache-Control: no-store` also affects public static assets.
- Rate limits currently live in each server process.

Selected approach: targeted improvements within the current stack, delivered in three dependent passes. A frontend-only pass would leave data-loading and deployment issues unresolved. A framework migration would add disruption unrelated to the request.

This is one release-hardening effort, not a new marketing platform, compliance service, or infrastructure deployment. Each pass receives its own bounded implementation task group and verification checkpoint.

## 3. Architecture and ownership

| Unit | Responsibility | Boundary |
| --- | --- | --- |
| Public route metadata | Titles, descriptions, public route list, robots policy and canonical paths | No account or resume data |
| Public content and policy pages | Truthful product explanation and documented data practices | Business facts supplied through explicit public configuration |
| Shared UI primitives and layouts | Semantics, labels, focus, mobile navigation, loading and error states | Preserve existing visual theme and component contracts where possible |
| List API and repositories | Validated pagination, filtering, ordering and ownership | Parameterized SQL; no client-side substitute for access control |
| Analytics service and cache | Bounded aggregate computation and user-isolated reuse | No raw resume text in aggregate caches; mutation-driven invalidation |
| Production HTTP layer | Metadata in HTML responses, public-asset caching, security and proxy handling | Private APIs and authenticated HTML remain non-cacheable |
| Deployment templates and docs | HTTPS, optional balancing and CDN configuration | Local templates only; no claim of live infrastructure |

Public metadata must appear in the initial production HTML response, including social previews; it cannot depend solely on client effects. The React app updates the same metadata on client-side navigation. Public content can remain React-rendered; this pass does not promise full server rendering or prerendering of the application.

## 4. Pass one: accessibility and trust

### 4.1 Shared interaction and layout behavior

- Preserve the brown/orange/cream design while correcting foreground/background pairs in light, dark, and high-contrast themes, including hover, focus, disabled, error and gradient states.
- Use WCAG 2.2 AA criteria as the testing target, not as an unverified compliance claim. Check normal text at 4.5:1, large text at 3:1, and relevant non-text controls at 3:1.
- Associate every form field with a visible label. Connect help/error text with `aria-describedby`, mark invalid inputs, announce asynchronous errors, and avoid placeholder-only labels.
- Give icon-only controls accessible names and clear action labels. Decorative icons are hidden from assistive technology.
- Add a skip-to-content link and meaningful landmarks. Each page has one descriptive H1; section headings follow a logical hierarchy. The persistent greeting is not the page H1.
- Make navigation available on mobile and by keyboard. Menus expose expanded state, close with Escape where appropriate, and return focus to their trigger. Dialog-like overlays manage focus without trapping the user.
- Ensure tabs, checkboxes, upload controls, pagination and search work without a mouse. Loading states expose useful status without repeated screen-reader announcements.
- Respect reduced-motion preferences and remove unnecessary continuous animation from that mode.
- Check layouts at 320, 375, 768, 1024 and 1440 CSS pixels, plus browser zoom/reflow. Tables, charts, long filenames and URLs must not force whole-page horizontal scrolling. Intentionally scrollable regions remain labeled and keyboard usable.

### 4.2 Truthful copy, links and assets

- Remove unverified testimonials, customer counts, employer endorsements, hiring promises, certification claims and unsupported uptime indicators from rendered pages. Preserve useful sections by replacing them with factual workflow explanations where appropriate.
- Label illustrative dashboard data as examples. Example rewrites must not demonstrate adding unsupported achievements or metrics.
- Replace placeholder links with real existing destinations or remove the unsupported navigation item. Do not create empty careers, pricing or support pages merely to preserve a link.
- Inventory rendered images, SVGs, icons, fonts and external requests. Record source/license evidence when available; record unknown provenance explicitly. Do not claim that unknown assets are licensed.
- Give meaningful images descriptive alt text and dimensions. Decorative images use empty alt text. Preserve unused user assets rather than deleting or recompressing them solely for checklist completion.
- Eliminate the Google Fonts runtime request by serving appropriately licensed font files locally with their license notices. If files/permissions cannot be verified, use the existing system-font fallbacks and document the visual tradeoff.

### 4.3 Policies, storage and consent

Add `/privacy`, `/terms`, and `/cookies` using the existing design and accessible public navigation. Pages describe actual implementation: account fields, password hashing, session cookies, extracted resume text, saved versions/results, Google Gemini processing, deletion behavior and operational limitations.

Keep missing business values empty in a public configuration template. Until verified details and jurisdiction-specific review are supplied, the policy pages visibly identify themselves as drafts and are excluded from the sitemap and search indexing. Do not add fictional contact links, governing law, guarantees, retention periods or legal assertions. A launch-readiness check reports the missing details; local development remains usable.

Registration includes a required, unchecked terms-acceptance control linked to the terms and privacy notice. Privacy notice acknowledgement is not described as blanket permission for unrelated processing. Upload includes an explicit acknowledgement that resume text will be processed by Google Gemini. The API validates required acknowledgements; browser-only enforcement is insufficient. Store the notice/terms version and server timestamp with the relevant account/upload record, not IP addresses or user-agent strings as consent evidence. Existing accounts retain a nullable historical acceptance value; never fabricate past consent.

Audit browser cookies and local storage. Keep the authentication cookie separate from optional preferences. Do not install marketing or analytics tracking. Offer clearly labeled controls for optional persistent preferences, with an equally accessible reject choice and a later settings entry. Without optional permission, theme and notification preferences can operate in memory. Record only the minimal preference choice/version needed to honor that decision. Clearing optional preferences must not log the user out.

Collect only information needed for the existing account and resume service. Use a display-name label instead of requesting a legal full name. Do not add birth dates, phone verification, address fields, or marketing profiles. Policy text must match the actual deletion capability; account deletion and password recovery are not silently claimed or added by this spec.

## 5. Pass two: SEO and frontend performance

### 5.1 Metadata, routing and discovery

- Use a single metadata definition for the landing page and new legal routes. Set unique titles and descriptions, canonical URLs, Open Graph and social-card fields.
- Add an original, locally served 1200-by-630 social image containing only verified product branding and factual wording. Include image dimensions and descriptive social-image alt text; retain provenance in the asset inventory.
- Use a configured `PUBLIC_SITE_URL`, never an arbitrary request Host header, to construct production canonical and sitemap URLs. Validate it as an HTTPS origin for public launch. No credentials may be exposed through public configuration.
- With no final domain, development remains functional, canonical URLs are omitted, discovery is disabled, and no example domain is presented as the real site.
- Serve `/sitemap.xml` from the same public-route registry, including only canonical indexable routes. Serve `/robots.txt` consistently with that registry. Private account, resume and API routes are not listed.
- Apply `noindex` to authentication/private routes and policy drafts, including production HTML/HTTP responses. Authentication remains the privacy boundary; robots directives are not access control.
- Keep clean public slugs `/privacy`, `/terms`, `/cookies`. Preserve existing UUID resume URLs; do not put names or resume content into slugs.
- Normalize unnecessary trailing slashes on known public routes. Unknown pages show a useful not-found page and return HTTP 404 on direct production requests, rather than silently redirecting everything to the landing page.
- Add factual WebSite/SoftwareApplication structured data where supported by visible page content. Omit aggregate ratings, testimonials, prices, corporate addresses and business organization details unless verified. Escape JSON-LD and metadata safely.
- Correct internal links to work both from the landing page and legal pages. Test fragment targets, route navigation and refreshes on nested routes.

### 5.2 Loading and rendering

- Lazy-load route modules so charts, private screens and PDF rendering are not required for the initial landing page. Keep useful skeletons for each route boundary and a retry path for failed chunk loads.
- Keep production JS/CSS minification. Inspect emitted chunks and browser requests rather than splitting every small dependency into its own file.
- Preserve dimensions/aspect ratios for visual content to reduce layout shifts. Lazy-load below-the-fold images; do not lazy-load the actual LCP image or essential above-the-fold content.
- Compress only shipped raster assets when this yields a measured size benefit without unacceptable visual loss. Optimize SVGs without changing accessibility or deleting source assets. Do not enlarge small assets by blindly converting formats.
- Avoid render-blocking remote font imports and unnecessary noncritical scripts. Existing module-script loading is already deferred; do not add redundant script loaders.
- Debounce network-backed list search by approximately 250 ms, with cancellation or stale-response isolation. Do not debounce direct typing, password entry or form validation feedback.
- Keep React Query keys scoped to filters/page/account boundaries and invalidate affected data after mutations. Add memoization only to measured or clearly expensive computation; avoid indiscriminate `memo` wrappers.
- Remove unused dependencies only after import/configuration/script checks and successful verification with synchronized lockfiles.

### 5.3 Backlink deliverable

Add a project document describing ethical, manual backlink opportunities: useful original resume guidance, a transparent explanation of scoring limitations, relevant career-resource partnerships and genuinely useful community contributions. Include prioritization, outreach examples, tracking fields and success measures. Do not purchase links, invent endorsements, send messages, register accounts, submit URLs to outside services or promise rankings.

## 6. Pass three: backend efficiency and deployment readiness

### 6.1 Pagination and query boundaries

- Paginate resume, version, analysis and activity lists at the database boundary. Default page size is 25; maximum is 100. Validate positive integer page numbers and page sizes, bounded search input and allowlisted sort/filter fields.
- Use a documented `{ items, page, pageSize, total, totalPages }` envelope for list responses. `totalPages` is zero for an empty collection. Update all affected frontend adapters, hooks, selectors, command-palette consumers and tests together; do not retain an accidental unbounded fallback.
- Use deterministic ordering with an ID tie-breaker. Counts reflect all matching owned records, not just the visible page. Empty and out-of-range pages return a valid empty list and correct metadata.
- Resume detail returns document metadata and current-version identity without embedding every historical raw text. Load a selected version on demand; provide a paginated version-list endpoint for switching/history.
- Move aggregate work into ownership-scoped SQL where practical. Dashboard/Insights totals must still cover the entire user's data. Chart series contain at most 60 chronological points; larger series use labeled equal-duration buckets covering the full requested range, with average scores and sample counts. Never present a truncated sample as an all-time total.
- Retain existing indexes. Add a forward-only migration only for indexes justified by the changed filter/order/join patterns. Test migrations on empty and existing schemas without deleting user data.
- Make pool limits/timeouts configurable with validated conservative defaults. Preserve TLS settings in the supplied PostgreSQL URL. Document that pool size multiplied by replicas must fit the database connection budget.

### 6.2 Safe caching

- Keep authenticated API responses `private, no-store`; never make resume, profile, analysis or activity responses publicly cacheable. Client query memory is cleared at account transitions.
- Cache only aggregate results on the server, with user identity, aggregate kind and a database-backed data revision in the cache key. Default TTL is 30 seconds, with limits of 200 entries and 5 MiB of serialized payload per process; skip any entry larger than 256 KiB. Evict least-recently-used entries to stay within both bounds, and allow caching to be disabled through configuration.
- Increment the user's aggregate revision in the same transaction as upload, analysis, rewrite or deletion. Read the current revision before a cache lookup so another replica cannot reuse a pre-mutation entry. Do not cache errors, partial computations or raw resume text. Coalesce identical in-flight aggregate requests where safe.
- Cache versioned public build assets with long-lived immutable headers. Revalidate HTML, metadata, robots and sitemap resources. Assets with stable filenames use conservative revalidation or content-versioned names.
- Tests must cover user isolation, mutation invalidation, expiry, bounded storage, concurrent reads, deletion and two app instances sharing the same database.

### 6.3 Gemini payloads and response compression

- Avoid sending duplicate raw text plus the same parsed sections when one faithful representation suffices. Parsing receives extracted text; analysis receives the structured representation needed for exact rewrite matching and scoring context.
- Preserve factual fields and exact source strings used by rewrites. Do not truncate silently, summarize away experience, or gzip text into an unreadable model prompt. Reject excessive input with an actionable error.
- Keep output validation, timeouts, retries, ownership and immutable version rules. Use fixture tests to compare payload size and ensure input minimization does not break suggestions, diffs or export.
- Apply negotiated transport compression to public text assets through the documented production layer. Do not indiscriminately compress secret-bearing authenticated responses; private response compression requires a separate threat-aware decision.

### 6.4 HTTPS, balancing and CDN templates

The default remains a single app process serving the production client and API behind a TLS-terminating reverse proxy. Add local example configuration and instructions; do not install services or change system settings.

- Redirect production public HTTP to the configured HTTPS origin, with health-check exceptions scoped to the internal deployment path. Development localhost must keep working without HTTPS.
- Trust forwarded headers only from the explicitly configured proxy boundary. Do not use blanket proxy trust or derive redirect destinations from untrusted Host headers.
- Set appropriate production security headers, preserve Secure/HttpOnly/SameSite cookies, and enable HSTS only on the verified HTTPS deployment. Document certificate/domain prerequisites.
- Provide optional two-upstream load-balancing configuration with health checks, timeouts suited to AI work, graceful shutdown and bounded request sizes.
- Replace process-local production rate-limit counters with a shared PostgreSQL-backed store before describing the multi-instance configuration as usable. Use atomic increments, expiry and bounded cleanup; do not retain raw IP addresses in limiter keys. Retain a lightweight isolated store for unit tests where appropriate.
- Treat static asset CDN support as configurable deployment preparation. Document cache bypass for `/api`, authenticated responses and any response with `Set-Cookie`; avoid adding an external CDN dependency to local development.
- Do not claim HTTPS, a CDN, a load balancer, DNS, certificates, backups or public indexing are live until the user configures a host and separate verification succeeds.

## 7. Errors, security and migrations

Retain the safe API error envelope and request IDs. New validation errors must be actionable without exposing secrets, SQL or uploaded content. Cache failures should fall back to a fresh query, not to stale cross-user data. A failure in consent persistence or content mutation must roll back the related transaction.

New schema changes are additive migrations: acceptance metadata, aggregate revision, shared rate-limit counters and justified query indexes. Preserve existing users, resume versions and analyses. No destructive migration, schema reset, automatic live-database benchmark or deletion of a real user's data is authorized.

Deployment examples must not expose the database or internal app ports publicly. The Gemini API key, database URL and JWT secret remain server-only. Public configuration contains only values intended for page visitors.

## 8. Verification and acceptance

Each task group follows regression-test-first development, then focused tests, lint and production build. Final acceptance includes:

1. Existing registration/login, upload, analysis, selected rewrite, version comparison, analytics, deletion and export behavior still works with explicit test fixtures.
2. New pagination contracts, SQL ownership, consent validation, migrations, cache isolation/invalidation and shared rate limits have automated tests.
3. Public production HTML contains correct metadata without waiting for JavaScript; private and unknown routes have correct indexing/status behavior. Sitemap URLs and canonical values agree.
4. All rendered navigation destinations and fragment targets resolve. No unverified testimonial, metric, business identity or placeholder link remains in shipped UI.
5. Keyboard walkthroughs cover landing, authentication, mobile navigation, upload, analysis, version switching, export and settings. Verify focus visibility, form error announcements, one H1 per page and relevant contrast pairs in every theme.
6. Browser checks cover the stated viewport sizes, reduced motion, loading/error/empty/populated states and optional storage preference changes. Source inspection alone is not reported as full accessibility verification.
7. Capture reproducible production-build performance measurements before and after changes under matching conditions. Report bundle/request differences and available lab LCP/CLS/interaction evidence. Field Core Web Vitals require real-user data; a single local interaction measurement is not a field INP result.
8. Inspect runtime network/storage for unexpected embeds, trackers and remote assets. Record copyright/provenance uncertainties instead of certifying ownership from filenames.
9. Run `npm run check` through Git Bash and report the actual results. Recheck PDF download end to end; an earlier browser test verified the preview but its automated download was cancelled.
10. Do not claim real PostgreSQL connectivity, Gemini key/quota validity, deployed HTTPS/CDN behavior, search indexing or legal compliance without separate evidence. Tests use synthetic resumes, not private user documents.

If browser, network or dependency tooling is unavailable, complete unaffected work and name the unverified check. Do not substitute fixture behavior for a successful live integration.

## 9. Deliverables and launch prerequisites

Deliver code/tests inside `Client/` and `Server/`, additive SQL migrations, public assets, environment examples, deployment examples, an asset/tracking inventory, a backlink strategy, and updated root setup documentation. Maintain a checklist mapping every user-requested item to an implementation, verified existing behavior or explicitly deferred deployment/legal prerequisite.

Launch prerequisites retained for the owner:

- Provide verified owner/business name, contact email, operating country and final domain; a public address only if appropriate.
- Review policies for the actual jurisdiction, audience, providers and retention practices.
- Supply PostgreSQL and Gemini credentials plus a JWT secret locally in `Server/.env`.
- Choose hosting, provision certificates/domain/CDN as applicable, and set the documented proxy and connection limits.
- Verify real provider calls, backup/restore arrangements, deployed security headers and production performance before accepting real resumes.

## 10. Reference guidance

These sources guide implementation; their inclusion is not evidence that the application already complies:

- [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/): accessibility criteria and test targets.
- [Google JavaScript SEO basics](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics): titles, descriptions, canonicals, indexing and rendered content.
- [Google canonical URL guidance](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls): consistent canonical signals.
- [ICO cookies and similar technologies guidance](https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guide-to-pecr/cookies-and-similar-technologies/): a UK-specific reference, not a determination of this application's applicable law. Verify current jurisdiction-specific guidance when policies are finalized.

## 11. Design review record

- [x] Existing project and relevant interfaces inspected.
- [x] Business-detail and hosting questions answered: details later, hosting configurable.
- [x] Three approaches compared and the targeted three-pass approach approved in chat.
- [x] Constraints, data boundaries, failure handling and verification criteria written down.
- [x] Written specification self-reviewed for scope, placeholders, contradictions and ambiguous behavior; pagination, chart aggregation and cache bounds made explicit.
- [x] User reviewed and approved the written specification.
- [ ] Detailed implementation plan created after written-spec approval.

No commit is part of this workflow, per the user's instructions.
# Hosting amendment — 2026-09-18

The owner selected Netlify for the frontend and Render for the backend after approving the original design. Build-time public metadata/static routing is now required in addition to the optional Express HTML host. Secrets remain only on Render; public business/domain values are whitelisted for Netlify builds. No deployment is authorized.

Netlify's documented 26-second proxy timeout conflicts with synchronous Gemini requests. A proposed PostgreSQL-backed AI jobs/polling extension is awaiting owner approval; this amendment does not approve that subsystem. The API proxy must not be presented as finished until the decision, implementation and verification are complete. See `docs/deployment.md`.
