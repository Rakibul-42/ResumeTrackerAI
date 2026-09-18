# Resume Tracker PostgreSQL Backend Design

**Date:** 2026-09-03

## Objective

Replace the frontend's mock data layer with a production-shaped Express API backed by PostgreSQL and Gemini. A developer must be able to add the required values to `Server/.env`, install dependencies, and start both applications from the repository root without manually creating tables or editing source files.

## Current-State Findings

- `Client` is a React 19/Vite application and proxies `/api` to `http://localhost:8000`.
- `Server` contains only a package manifest, lockfile, and an existing private `.env`; it has no application code.
- The frontend already defines API adapters for authentication, resumes, dashboard data, insights, versions, and history, but those adapters currently call local mocks.
- The rendered landing, authentication, dashboard, resume list, resume detail, analysis, and PDF export routes work with mock data.
- The resume list component reads `latestVersionNumber`, while its documented mock contract provides `versionCount`. The implementation will standardize on `versionCount`.
- `ScoreBreakdown` consumes an object with `keywords`, `formatting`, `impact`, and `clarity`, each scored out of 25. The current mock returns a different array shape, causing the rendered values to be blank. The real API and replacement mock-independent client contract will use the object shape.
- The existing server dependencies and environment names reference MongoDB, but no MongoDB implementation exists. MongoDB and Mongoose will be removed from the active design.

## Chosen Architecture

Use the existing CommonJS Express server with `node-postgres` (`pg`) and versioned SQL migration files. SQL remains explicit and reviewable, while small repository modules isolate database queries from HTTP and service logic.

The system has these boundaries:

1. **HTTP application:** routing, cookies, multipart upload limits, validation, rate limiting, and standardized errors.
2. **Domain services:** authentication, PDF ingestion, Gemini parsing and analysis, immutable rewrite versioning, diffs, and analytics aggregation.
3. **Repositories:** parameterized PostgreSQL queries scoped to the authenticated user.
4. **External adapters:** PostgreSQL pool, PDF text extraction, Gemini client, password hashing, and JWT cookies.
5. **Frontend API adapters:** Axios methods matching the existing React Query hooks.

Dependencies are injected into the Express application and domain services where practical so tests can use deterministic database and Gemini substitutes.

## Runtime and Configuration

`Server/.env.example` will document:

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `POSTGRES_URL` | Yes | none | PostgreSQL connection URI |
| `GEMINI_API_KEY` | Yes | none | Gemini API authentication |
| `JWT_SECRET` | Yes | none | Signs authentication cookies; minimum 32 characters |
| `PORT` | No | `8000` | Express port |
| `CLIENT_ORIGIN` | No | `http://localhost:5173` | Allowed browser origin |
| `COOKIE_NAME` | No | `resume_tracker_session` | Authentication cookie name |
| `JWT_EXPIRES_IN` | No | `7d` | Session lifetime |
| `GEMINI_MODEL` | No | `gemini-2.5-flash` | Structured parsing and analysis model |
| `NODE_ENV` | No | `development` | Runtime mode |
| `AUTO_MIGRATE` | No | `true` | Apply pending migrations before listening |

`DATABASE_URL` may be accepted as a compatibility alias, but `POSTGRES_URL` is the documented name. If both exist, `POSTGRES_URL` wins.

Configuration is parsed once with Zod. Missing or invalid required values produce a short startup error naming the variable, with no secrets printed. PostgreSQL SSL behavior follows the supplied URI rather than overriding provider-specific connection options.

The server applies pending migrations before it begins listening. Migration execution uses a PostgreSQL advisory lock and records completed files in `schema_migrations`, making concurrent starts safe. `npm run db:migrate` remains available for explicit deployment workflows.

A dependency-free root Node launcher starts `Server` and `Client` concurrently, prefixes their output, forwards termination signals, and terminates the peer if either child exits unexpectedly. Root scripts provide:

- `npm run setup` — install locked dependencies in both directories.
- `npm run dev` — start server and Vite together.
- `npm test` — run server and client tests.
- `npm run build` — build the client and perform the server syntax/startup checks that do not require listening.

No existing secret-bearing `.env` file will be overwritten or copied into documentation.

## PostgreSQL Schema

All identifiers are application-generated UUIDs and are serialized to the frontend as `_id`. All timestamps are `timestamptz` and are serialized as ISO-8601 strings. Tables use foreign keys and indexes for ownership and time-ordered queries.

### `schema_migrations`

- `version text primary key`
- `applied_at timestamptz not null default now()`

### `users`

- `id uuid primary key`
- `name varchar(80) not null`
- `email text not null`
- `password_hash text not null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`
- Unique index on `lower(email)` for case-insensitive identity without requiring PostgreSQL extensions.

### `resumes`

- `id uuid primary key`
- `user_id uuid not null references users(id) on delete cascade`
- `title varchar(160) not null`
- `source_filename varchar(255) not null`
- `current_version_id uuid null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`
- Index on `(user_id, updated_at desc)`.

`current_version_id` receives a deferred foreign key to `resume_versions(id)` with `on delete set null` after the versions table exists.

### `resume_versions`

- `id uuid primary key`
- `resume_id uuid not null references resumes(id) on delete cascade`
- `parent_version_id uuid null references resume_versions(id) on delete set null`
- `version_number integer not null check (version_number > 0)`
- `source_type text not null check (source_type in ('upload', 'rewrite'))`
- `raw_text text not null`
- `parsed_sections jsonb not null`
- `latest_score smallint null check (latest_score between 0 and 100)`
- `created_at timestamptz not null default now()`
- Unique constraint on `(resume_id, version_number)`.
- Index on `(resume_id, created_at)`.

The API derives labels as `V${version_number}`. Resume versions are immutable except for `latest_score`, which caches the most recent validated analysis score for efficient dashboard queries.

### `analyses`

- `id uuid primary key`
- `version_id uuid not null references resume_versions(id) on delete cascade`
- `target_role varchar(160) null`
- `ats_score smallint not null check (ats_score between 0 and 100)`
- `model varchar(100) not null`
- `summary text not null`
- `score_breakdown jsonb not null`
- `issues jsonb not null`
- `strengths jsonb not null`
- `keywords_present jsonb not null`
- `keywords_missing jsonb not null`
- `bullet_rewrites jsonb not null`
- `created_at timestamptz not null default now()`
- Index on `(version_id, created_at desc)`.

Multiple analyses may exist for a version because the user can change the target role. Endpoints that request "the analysis" return the newest analysis for that version.

### `activity_events`

- `id uuid primary key`
- `user_id uuid not null references users(id) on delete cascade`
- `resume_id uuid not null references resumes(id) on delete cascade`
- `version_id uuid null references resume_versions(id) on delete set null`
- `analysis_id uuid null references analyses(id) on delete set null`
- `type text not null check (type in ('upload', 'analyze', 'rewrite'))`
- `title text not null`
- `subtitle text not null default ''`
- `label varchar(80) not null default ''`
- `metadata jsonb not null default '{}'::jsonb`
- `occurred_at timestamptz not null default now()`
- Index on `(user_id, occurred_at desc)`.

Deleting a resume removes its versions, analyses, and corresponding events, ensuring deleted resume data does not survive in history.

## Stored JSON Contracts

`parsed_sections` uses this shape, with absent content represented by empty strings or arrays rather than omitted top-level keys:

```json
{
  "basics": {
    "name": "",
    "title": "",
    "email": "",
    "phone": "",
    "location": "",
    "links": [{ "label": "", "url": "" }]
  },
  "summary": "",
  "experience": [
    { "role": "", "company": "", "period": "", "bullets": [""] }
  ],
  "education": [{ "degree": "", "school": "", "period": "" }],
  "skills": [""],
  "projects": [{ "name": "", "tech": [""], "summary": "" }],
  "certifications": [{ "name": "", "year": 2026 }],
  "languages": [""],
  "interests": [""]
}
```

An analysis uses:

```json
{
  "_id": "uuid",
  "versionId": "uuid",
  "atsScore": 86,
  "model": "gemini-2.5-flash",
  "summary": "",
  "scoreBreakdown": {
    "keywords": 22,
    "formatting": 21,
    "impact": 23,
    "clarity": 20
  },
  "issues": [{ "title": "", "severity": "high", "fix": "" }],
  "strengths": [{ "title": "", "note": "" }],
  "keywordsPresent": [""],
  "keywordsMissing": [""],
  "bulletRewrites": [
    {
      "_id": "stable-per-analysis-id",
      "section": "experience",
      "original": "",
      "rewritten": "",
      "rationale": ""
    }
  ],
  "createdAt": "ISO timestamp"
}
```

Each breakdown value is an integer from 0 through 25. The four values sum to `atsScore`. Issue severity is one of `high`, `medium`, or `low`. Gemini output is rejected unless it satisfies these schemas.

## HTTP API Contract

All routes are under `/api`. JSON responses use camelCase and frontend-compatible `_id` fields. Protected routes require the signed HTTP-only session cookie.

### Health

- `GET /api/health` returns `200 { "ok": true, "database": "connected" }` after a successful `select 1`.

### Authentication

- `POST /api/auth/register` consumes `{ name, email, password }`; returns `201 { user }` and sets the cookie.
- `POST /api/auth/login` consumes `{ email, password }`; returns `200 { user }` and sets the cookie.
- `POST /api/auth/logout` clears the cookie and returns `{ ok: true }`.
- `GET /api/auth/me` returns `{ user }`.
- `PATCH /api/auth/profile` consumes `{ name }` and returns `{ user }`.
- `PATCH /api/auth/password` consumes `{ currentPassword, newPassword }` and returns `{ ok: true }`.

The public user shape is `{ _id, name, email, createdAt }`; password hashes never leave the repository layer.

### Resumes and versions

- `GET /api/resumes` returns `{ resumes }`, where each row contains `{ _id, title, createdAt, updatedAt, versionCount, bestScore }`.
- `POST /api/resumes` accepts multipart field `file` plus optional `title`; returns `201 { resume }` after PDF extraction and structured parsing create V1.
- `GET /api/resumes/:id` returns `{ resume, versions }`. `resume` contains `{ _id, title, createdAt, updatedAt, currentVersionId }`; versions contain the full frontend version shape.
- `DELETE /api/resumes/:id` returns `{ ok: true }`.
- `GET /api/resumes/:id/versions/:versionId` returns `{ version }`.
- `POST /api/resumes/:id/analyze` consumes `{ versionId, targetRole? }` and returns `201 { analysis }`.
- `GET /api/resumes/:id/analyses` returns `{ analyses }` ordered newest first.
- `GET /api/resumes/:id/versions/:versionId/analysis` returns `{ analysis }` for the newest analysis or `404` if none exists.
- `POST /api/resumes/:id/rewrite` consumes `{ analysisId, rewriteIds? }` and returns `201 { version, appliedCount }`.
- `GET /api/resumes/:id/diff?from=<id>&to=<id>&mode=words|lines` returns `{ hunks }`, where each hunk is `{ type: 'add'|'remove'|'context', text }`.

Every lookup includes or verifies the authenticated user's ownership. A valid UUID belonging to another user returns `404`, preventing resource enumeration.

### Aggregates

- `GET /api/dashboard` returns the existing dashboard shape: `totals`, `latestResume`, `scoreSeries`, `versionStack`, `kpi`, and `activity`.
- `GET /api/insights` returns `averageScore`, `bestScore`, `totalAnalyses`, `scoreTrend`, `topIssues`, `topMissingKeywords`, `topPresentKeywords`, and `resumePerformance`.
- `GET /api/versions` returns `{ totals, versions }`.
- `GET /api/history` returns `{ totals, events }`.

Aggregates return empty arrays, zero counts, and nullable score fields for a new account, matching the frontend's empty states. They never return another user's data.

## PDF and Gemini Flow

### Upload

1. Multer accepts one in-memory PDF no larger than 5 MiB.
2. The service validates the MIME type, `.pdf` extension, and `%PDF-` file signature.
3. `pdf-parse` extracts text. Empty or unreadable PDFs return a validation error.
4. Gemini structured output converts the extracted text into `parsed_sections`.
5. Zod validates and normalizes the result.
6. One PostgreSQL transaction creates the resume, V1, sets `current_version_id`, and records the upload event.
7. The raw PDF bytes are released and are never persisted; only extracted text and structured content are stored.

### Analysis

1. The service loads the owned version and sends its text plus optional target role to Gemini.
2. Gemini returns the analysis JSON contract using structured-output configuration.
3. The service validates ranges, enum values, rewrite identifiers, and the score total.
4. One transaction inserts the analysis, updates `resume_versions.latest_score`, updates the parent resume's `updated_at`, and records an analysis event.

Transient Gemini failures receive one bounded retry. Requests have an abort timeout. Exhausted retries return a sanitized `502 AI_UPSTREAM_ERROR`; missing API configuration returns `503 AI_UNAVAILABLE`.

### Applying rewrites

The service loads the owned analysis and selects the requested rewrite IDs. When `rewriteIds` is omitted, all suggestions are applied. Unknown IDs return `400` rather than being silently ignored.

Selected `original` strings are replaced only where they exactly match strings in the stored parsed sections. If any selection no longer matches, the entire operation fails without creating a partial version. A transaction locks the resume row, allocates the next version number, creates an immutable rewrite version linked to its parent, changes `current_version_id`, and records a rewrite event. The frontend then requests analysis of that new version as it does today.

## Authentication and Security

- Passwords use bcrypt with a cost factor of 12.
- Registration lowercases and trims email addresses; login comparison is case-insensitive.
- JWTs contain only user ID, issued-at time, and expiry.
- The cookie is `httpOnly`, `sameSite=lax`, path `/`, and `secure` in production.
- CORS accepts only `CLIENT_ORIGIN` and credentials.
- JSON payload size is limited, multipart uploads are memory-limited, and unexpected multipart fields are rejected.
- Authentication endpoints and Gemini-backed endpoints have separate rate limits.
- Zod validates path parameters, query strings, bodies, configuration, Gemini responses, and persisted JSON read back from PostgreSQL.
- SQL uses parameters exclusively. Dynamic sort and filter choices are mapped from allowlists.
- Error messages never include SQL, stack traces, JWTs, connection strings, Gemini keys, prompts, or raw resume text.
- Shutdown stops accepting requests, closes the HTTP server, and drains the PostgreSQL pool.

Password reset/email delivery, email address changes, OAuth, subscriptions, job queues, and remote PDF object storage are outside this scope because the current frontend has no completed flows for them.

## Error Contract

All failures use:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "A safe message for the user",
    "details": {}
  }
}
```

`details` is omitted when unnecessary. Expected statuses are:

- `400` malformed input, invalid rewrite selection, or invalid PDF.
- `401` missing/invalid session or incorrect credentials/current password.
- `404` owned resource not found or resource belongs to another user.
- `409` duplicate email.
- `413` PDF or request too large.
- `429` rate limit reached.
- `502` invalid or failed Gemini response after retry.
- `503` unavailable database/AI configuration during an applicable request.
- `500` unexpected internal error with a request ID logged server-side.

The Axios interceptor converts this envelope to `{ status, message, details, original }`, preserving the error handling already used by the pages and React Query hooks. Multipart requests do not force a JSON `Content-Type`, allowing Axios to supply the boundary.

## Frontend Integration

- Enable the Axios instance at `/api` with credentials.
- Replace mock imports and implementations in `api/auth.js`, `api/resumes.js`, `api/dashboard.js`, and `api/analytics.js` with the documented requests.
- Preserve all existing hook signatures and page component expectations.
- Change `ResumeRow` to display `resume.versionCount`.
- Ensure the score breakdown API shape matches `ScoreBreakdown`; no presentation redesign is included.
- Clear React Query data on logout as the current context already does.
- Keep the Vite proxy targeting port 8000.

The unrelated missing auth label/input association and transient Recharts development warnings found during visual inspection are recorded findings but remain outside this backend integration scope.

## Testing Strategy

Implementation follows red-green-refactor. Tests are divided by contract boundary:

- **Configuration tests:** required variables, defaults, secret-safe failures, and connection URL precedence.
- **Schema/migration tests:** clean migration, idempotent rerun, foreign keys, unique lowercased email behavior, version uniqueness, and cascade deletion.
- **Authentication HTTP tests:** register, duplicate email, login, cookie attributes, `me`, logout, profile update, password change, and invalid sessions.
- **Resume HTTP tests:** PDF validation, successful upload, listing, details, version retrieval, ownership isolation, deletion, and maximum size.
- **Gemini adapter tests:** structured request configuration, schema normalization, transient retry, timeout, and sanitized upstream errors. Network calls are replaced by a deterministic injected fake in automated tests.
- **Analysis/rewrite tests:** score storage, newest-analysis selection, exact selected replacements, omitted selection, invalid IDs, immutable parent version, transaction rollback, and concurrent version allocation.
- **Diff tests:** word and line modes with add/remove/context output.
- **Aggregate tests:** brand-new users, multiple users, latest resume, KPI values, trends, grouped issues/keywords, version counts, and chronological history.
- **Frontend adapter tests:** endpoint, method, multipart body, credentials, and normalized error envelope.
- **Runtime verification:** server tests, client tests, ESLint, production client build, server syntax checks, migration against PostgreSQL, health request, and browser smoke checks of register through upload/analyze/rewrite/export when valid runtime credentials are available.

Tests must not call the real Gemini service. A manual smoke test may call Gemini only with the configured key and an explicit sample PDF.

## Acceptance Criteria

1. Adding `POSTGRES_URL`, `GEMINI_API_KEY`, and `JWT_SECRET` to `Server/.env`, then running the documented setup and root development commands, starts both applications and applies the schema automatically.
2. A user can register, remain authenticated through the cookie, update their name/password, and log out.
3. A user can upload a valid PDF, see V1 and parsed sections, analyze it with Gemini, apply selected rewrites into V2, compare versions, and export the chosen version.
4. Dashboard, insights, versions, history, and notifications use persisted data rather than mocks.
5. All resource access is scoped to the authenticated owner.
6. Empty accounts and missing analyses render existing frontend empty states without response-shape errors.
7. Invalid input, unavailable dependencies, and upstream failures use the documented safe error envelope.
8. No PDF binary, password, token, connection string, or Gemini key is exposed in API responses or logs.
9. Automated test, lint, and production-build commands pass, and the final verification report distinguishes any checks that require an externally supplied PostgreSQL URL or Gemini key.

## Source-Control Constraint

Files will be edited only in the shared workspace. No commit, push, pull request, or upload is part of this work.
