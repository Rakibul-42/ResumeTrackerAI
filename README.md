# ResumeTrackerAI

React frontend in `Client/`, Express + PostgreSQL backend in `Server/`, and Google Gemini for PDF parsing and resume analysis. All application screens use the real API; the old `Client/src/mock/` examples are no longer imported.

## Run locally (Git Bash)

Use Node.js **22.13+** (Node 24 LTS recommended), npm, a reachable PostgreSQL database, and a Gemini API key with access to the configured model.

```bash
cd /f/Documents/Projects/ResumeTrackerAi
npm run setup
```

Edit **`Server/.env`**. An existing file is deliberately never overwritten. Use `Server/.env.example` as a reference; if the file does not exist, copy the example first:

```bash
cp -n Server/.env.example Server/.env
```

Set these three required values:

```dotenv
POSTGRES_URL=postgresql://username:password@host:5432/database
GEMINI_API_KEY=your-gemini-api-key
JWT_SECRET=your-random-secret-at-least-32-characters
```

Generate a JWT secret locally (paste the output into `.env`):

```bash
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

`DATABASE_URL` is accepted as an alias when `POSTGRES_URL` is absent. URL-encode special characters in database credentials. For hosted PostgreSQL, use the provider's connection URL and required TLS parameters, such as `?sslmode=require`. Do not disable certificate checks globally. Keys and URLs belong in the backend only, never in `VITE_*` variables or frontend code.

Optional settings use these defaults, even if their `.env` entries are blank:

```dotenv
PORT=8000
CLIENT_ORIGIN=http://localhost:5173
NODE_ENV=development
GEMINI_MODEL=gemini-2.5-flash
JWT_EXPIRES_IN=7d
COOKIE_NAME=resume_tracker_session
AUTO_MIGRATE=true
```

Then run:

```bash
npm run env:check
npm run dev
```

Open **http://localhost:5173**, create an account, and upload a **text-based PDF up to 5 MB**. Upload creates V1; click Analyze for scoring and suggestions. Applying rewrites creates a new version and the UI analyzes it automatically. Select a saved version on the Export page to download its PDF.

The API starts only after the database is ready. Migrations run automatically by default; no manual table creation is needed. The database role must have permission to create tables and indexes in the intended schema. Never point development at an unrelated production database.

The combined command provides frontend hot reload. Restart it after backend code changes. For backend auto-restart, run these in separate Git Bash terminals:

```bash
npm --prefix Server run dev
npm --prefix Client run dev -- --strictPort
```

Keep `localhost` consistent between the browser and `CLIENT_ORIGIN`. The frontend proxies `/api` to port 8000. If changing ports, update `Client/vite.config.js` and `CLIENT_ORIGIN` to match. The combined launcher stops the other process when one exits. No commits, pushes, or deployments are part of setup.

## Checks and database commands

```bash
npm run check       # frontend lint, backend syntax, all tests, production build
npm test
npm run db:migrate  # explicit, safe-to-repeat migrations
```

Tests run without real credentials. They use PGlite (an embedded PostgreSQL engine) to test SQL, constraints, ownership, transactions, and API flows; deterministic fixtures stand in for Gemini. The real PDF worker is tested with a synthetic PDF. These checks do **not** establish connectivity to your hosted PostgreSQL or validate your Gemini quota/key. Verify those after setting `.env`: open `/api/health`, then upload and analyze a non-sensitive test resume.

For manual browser testing without credentials only:

```bash
node Server/scripts/smoke-server.cjs
# separate terminal:
npm --prefix Client run dev -- --strictPort
```

This explicit test harness uses a temporary in-memory database and fixed AI responses. **It is not the normal backend and must not be used for real resumes.** Stop it before `npm run dev`; it occupies port 8000. Production has no mock/fallback AI mode.

## Schema and API

SQL migrations are in `Server/src/db/migrations/`. The migration runner uses a transaction-scoped advisory lock and tracks applied files in `schema_migrations`.

| Table | Purpose |
| --- | --- |
| `users` | Account, case-insensitive email identity, bcrypt hash, session revocation counter and terms acceptance |
| `resumes` | User-owned document and current-version pointer |
| `resume_versions` | Immutable content, parsed sections, parent version, latest score |
| `analyses` | Gemini results, score breakdown, keywords, exact-match rewrite suggestions |
| `activity_events` | Upload, analysis, and rewrite history |
| `rate_limit_counters` | Shared production counters with hashed identities and indexed expiry |

Deleting a resume removes its versions, analyses, and related history. Parent content is never edited by a rewrite. Version numbers are allocated under a row lock. All document and analytics queries are scoped to the authenticated account. SQL uses parameterized values and indexed ownership/foreign-key lookups.

| API | Methods |
| --- | --- |
| `/api/health` | GET database health |
| `/api/auth/register`, `/login`, `/logout` | POST |
| `/api/auth/me` | GET |
| `/api/auth/profile`, `/password` | PATCH |
| `/api/resumes` | GET list; POST multipart `file`, optional `title`, `acknowledgeAi=true` and current `noticeVersion` |
| `/api/resumes/:id` | GET detail; DELETE document |
| `/api/resumes/:id/versions/:versionId` | GET version |
| `/api/resumes/:id/analyze` | POST `{ versionId, targetRole? }` |
| `/api/resumes/:id/analyses` | GET all saved analyses |
| `/api/resumes/:id/versions/:versionId/analysis` | GET latest analysis; `NO_ANALYSIS` 404 if none |
| `/api/resumes/:id/rewrite` | POST `{ analysisId, rewriteIds? }`; omitted IDs apply all suggestions |
| `/api/resumes/:id/diff?from=UUID&to=UUID&mode=words` | GET; `lines` mode also supported |
| `/api/dashboard`, `/insights`, `/versions`, `/history` | GET user-specific aggregates |

Registration additionally requires `acceptedTerms: true` and the current `termsVersion`; versions come from `shared/public-site.json`. Existing accounts are not assigned fabricated historic acceptance timestamps.

Responses use frontend-compatible `_id` identifiers. Errors use `{ "error": { "code": "...", "message": "...", "details": [] } }`; details are optional. Invalid inputs return 400, unauthenticated requests 401, missing/foreign documents 404, oversized uploads 413, rate limits 429, and failed/invalid Gemini responses 502. Unknown failures never expose secrets or SQL details.

Dashboard counts reflect stored records: rewrites count applied suggestions, Versions counts saved documents, and score/issue/keyword deltas are absolute differences, not percentages. An unanalysed current version has a null score. Insights summarizes all stored analyses; trends are chronological.

## Netlify + Render status

Frontend build configuration is in `netlify.toml`; a Render API template is in `deploy/render.yaml.example`. See [deployment preparation](docs/deployment.md) for public environment settings, HTTPS/CDN behavior, pool sizing and remaining launch checks. **The cross-host API connection is not finished:** Netlify’s 26-second proxy timeout requires a decision on PostgreSQL-backed AI jobs/progress polling before wiring the synchronous Gemini flow through it. Nothing has been deployed.

The current readiness improvements include consent enforcement, draft policy pages, optional-storage choices, public metadata/sitemap/robots, private noindex pages, real 404 handling, lazy page chunks and shared production rate limits. The broader performance/accessibility checklist remains in progress; see [readiness status](docs/launch-readiness-checklist.md).

## Optional single-server production mode

Build the client with `npm run build`, set `NODE_ENV=production` and `CLIENT_ORIGIN` to the public HTTPS origin, then `npm start`. The backend serves `Client/dist` and `/api` on the same origin. HTTPS is required for production Secure cookies. Use a persistent PostgreSQL database with backups. For separate migration/deploy jobs, run `npm run db:migrate` first and set `AUTO_MIGRATE=false` for the runtime role.

Sessions use HttpOnly, SameSite cookies. Password changes rotate the session and logout invalidates existing sessions for that account. Rate limits use PostgreSQL in production (30 auth attempts per 15 minutes per IP; 10 upload/analyze/rewrite requests per 5 minutes per account), with HMAC-hashed counter identities. Development/test limits are per process. All replicas need the same JWT secret and database. Reverse-proxy client-IP attribution still requires review before deployment. Email verification and forgotten-password recovery are not implemented.

Resume text is sent to Google Gemini. AI scores are estimates, not certified ATS outcomes. Review generated content before using it; prompts prohibit invented facts, but AI output still needs human review. Scanned/image-only, encrypted, and unreadable PDFs are rejected; OCR is not included. Original PDF bytes are processed in memory, not kept on disk; extracted text, structured content, and results are stored in PostgreSQL.

The build may report large-bundle warnings from the PDF renderer/charts and a Node 26 deprecation warning in Vite. They do not fail the build; the PDF export page is lazy-loaded. `npm run env:check` validates formatting only, and failures from missing credentials are intentionally actionable rather than silently switching to demo data.
