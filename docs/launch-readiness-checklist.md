# Launch-readiness status — work in progress

This is a status record, not a claim of error-free software, legal compliance, full WCAG conformance or production readiness. Work is project-local, inline and uncommitted. Real backend credentials and business details remain owner-supplied.

| Requested area | Current state |
| --- | --- |
| Backend + PostgreSQL schema | Existing auth/resume/version/analysis API is implemented and tested with embedded PostgreSQL. Additive consent and shared-limit migrations added. Live hosted PostgreSQL/Gemini remain unverified. |
| Titles, descriptions, canonical, structured data | Implemented through shared route metadata, build-time HTML and client navigation. Canonicals require a configured HTTPS origin. No fake domain, business entity, reviews or ratings. |
| Sitemap / robots / “mobile.txt” | Build generates sitemap.xml and robots.txt. Private/draft pages excluded. No standard mobile.txt directive is assumed; mobile behavior is handled by viewport/responsive layout. |
| OG image / image rights / compression | Original social graphic added with provenance in asset inventory. Existing assets preserved; unknown rights are not certified. Image optimization remains unfinished. |
| Slugs, links, 404 | Existing concise slugs retained. Footer/section links repaired and policy routes added. Unknown direct paths have a 404 response in Express and generated static routing. Full deployed link audit remains. |
| Heading hierarchy / one H1 | PageHeader, card headings, dashboard and analytics loading/empty states improved and tested. Export/loading/error states and every nested component still need final exhaustive review. |
| Accessibility / keyboard / labels | Label associations, labelled buttons/errors, tabs, mobile navigation, skip links, focus outlines and native search dialog added. Browser checks caught and drove fixes for unnamed controls and missing headings. Full all-theme contrast, reduced-motion and screen-reader audit remains. |
| Mobile/tablet | Local checks at 320/375/768 and desktop widths on selected pages; no horizontal document overflow in those observations. This is not verification of every component/device. |
| Privacy / terms / cookies | Draft pages and real links added; verified business/contact/jurisdiction and owner/legal review still required. Never invent operator details. |
| Consent / data minimization | Server-enforced current terms and AI acknowledgement; original PDF bytes not stored intentionally. Optional theme/notification storage is opt-in; rejection/revocation removes only app optional keys. |
| Tracking / embeds / claims | Remote font import and unsupported social-proof claims removed. No ad/analytics embeds found in application source. PDF preview is local blob content. See asset/tracking inventory; provider account settings require separate review. |
| Chunks / lazy loading / minification / scripts | Vite minifies and fingerprints assets. All pages load lazily; charts/PDF export separate from the main chunk. Main JS reduced from ~1,198 KB to ~560 KB in measured builds. No real-user Core Web Vitals or complete lab audit yet. |
| Loading skeletons / renders / input handling | Existing skeletons retained; accessible route fallback and several loading headings added. Theme value memoized. Search debouncing and broader rerender profiling remain. |
| API caching / expensive queries | Existing short-lived React Query cache retained, API responses explicitly private/no-store. Revision-keyed server aggregate cache and SQL aggregate redesign are not implemented yet. |
| Pagination / indexes | Existing owner/foreign-key indexes plus new expiry index. Large-list pagination and its accompanying query/index changes remain. |
| Connection pooling / AI payloads | Pool limits/timeouts configurable, migration pool size one. Analysis sends structured sections once, without duplicate raw text; tests verify all structured facts are preserved. |
| Rate limits / load balancing | Production counters shared in PostgreSQL and tested across two app instances. Trusted proxy/IP handling, job concurrency and actual provider replica/load-balancer setup remain. |
| HTTPS / CDN / hosting | Netlify static build and Render reference template added. Provider-managed HTTPS/CDN documented; no infrastructure deployed or live headers verified. API proxy is deliberately not enabled pending the AI-job decision. |
| Unused dependencies | Verified unused `morgan` removed, lockfile updated. No blanket dependency/asset purge. |
| Backlink strategy | Still to write. No outreach, account creation, paid links or ranking promises performed. |

## Current verification boundaries

Automated tests exercise actual HTTP handlers, migrations/SQL, schema validation, consent, ownership, shared counters, HTML metadata, static output and rendered React markup. They use synthetic data and fixtures, not a live Gemini key. Browser testing used the explicit temporary in-memory backend and a synthetic PDF: registration, preference rejection, upload, parse, analysis and PDF preview were exercised. Actual download completion is not yet established. Browser screenshots and temporary scripts stay under ignored `.runtime/`.

## Next work

1. Resolve the Netlify timeout architecture decision (recommended: durable PostgreSQL AI jobs and progress polling).
2. Finish pagination, bounded SQL analytics and revision-keyed caching without exposing another user's data.
3. Finish contrast, keyboard/mobile and export verification, image optimization and backlink strategy.
4. Add real owner/domain details, review policies, configure actual hosting and perform a non-sensitive live end-to-end smoke test.
