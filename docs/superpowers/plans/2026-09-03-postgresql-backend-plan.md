# Resume Tracker PostgreSQL Backend Implementation Plan

## Implementation record — 2026-09-16

Implemented inline as requested, without commits, pushes, or changes to `Server/.env`. See the root `README.md` for current commands and runtime behavior; the original step list below is retained as the design-time plan rather than a claim that every proposed filename was used.

Delivered: Express authentication and account settings; PostgreSQL migrations and ownership queries; PDF parsing; validated Gemini adapter; resume upload/list/detail/delete; saved analyses; immutable selected rewrites; version diffs; dashboard, insights, versions and history; real frontend adapters and cache invalidation; environment template, root launcher, tests, and operating guide. The separately approved frontend lint cleanup is also included.

Implementation adjustments:

- Node minimum is 22.13, matching the installed frontend toolchain, instead of the early Node 20 assumption.
- PGlite's embedded PostgreSQL engine replaces pg-mem so migration/constraint tests execute actual PostgreSQL SQL.
- SQL migrations use a transaction-scoped advisory lock; a second migration indexes remaining foreign keys.
- JWT sessions include a revocation counter; password changes and logout invalidate older cookies.
- PDF parsing uses pdf-parse 2.x in a timeout-limited child process. Tests caught a Windows native-module crash with worker-thread initialization, so process isolation is intentional.
- Diff responses include `parts` and character-count `stats` required by the actual frontend, plus the originally planned `hunks`.
- Parsed schemas preserve export-specific locations, education details, certification issuers, and project links; empty extraction and unsafe URLs are rejected.
- API error normalization, analytics invalidation, empty-account states, current-version selection, privacy wording, and rewrite selection resets are integrated in the client. PDF export is lazy-loaded.
- The combined root launcher uses direct Node child processes for Windows compatibility. Frontend HMR works; restart the combined command for backend changes, or use the standalone backend watch command.
- Browser checks use an explicitly named test harness with an in-memory database and fixed AI fixtures. Production has no mock or heuristic fallback.

Live provider verification remains dependent on the user's `POSTGRES_URL`, `GEMINI_API_KEY`, and `JWT_SECRET`. No secret values have been printed or changed.

---

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete backend inside `Server/`, persist all application data in PostgreSQL, use Gemini for parsing and analysis, connect the existing React frontend to the API, and provide a one-command root development launcher.

**Architecture:** A CommonJS Express API is composed from injected PostgreSQL, PDF, and Gemini adapters. Explicit SQL migrations create relational ownership/version records and validated JSONB analysis payloads. Existing React Query hooks retain their signatures while mock-backed API adapters switch to Axios.

**Tech Stack:** Node.js 20+, Express 4, PostgreSQL via `pg`, Zod, Multer 2, `pdf-parse`, `@google/genai`, bcrypt, JWT HTTP-only cookies, Node's built-in test runner, Supertest, pg-mem, React 19, Vite, Axios.

**Spec:** `docs/superpowers/specs/2026-09-03-postgresql-backend-design.md`

## Global Constraints

- Put all backend application code, schema, migrations, and backend configuration under `Server/`.
- Do not edit or reveal values from the existing `Server/.env`.
- Do not commit, push, create a pull request, or upload files.
- Run project commands through Git Bash (`E:/Git/bin/bash.exe`) as requested.
- Require `POSTGRES_URL`, `GEMINI_API_KEY`, and a minimum-32-character `JWT_SECRET`; never print their values.
- Preserve frontend hook signatures and the `/api` Vite proxy.
- Use application-generated UUIDs, ISO timestamp responses, parameterized SQL, owner-scoped resource queries, and the error envelope from the spec.
- Do not persist uploaded PDF bytes.
- Tests must not call the real Gemini API.
- Follow red-green-refactor for every behavior change and run each stated failing test before implementation.
- Gemini structured output must use `responseMimeType: "application/json"` with `responseJsonSchema`, as documented by the current official SDK.
- Let a supplied PostgreSQL URI control TLS options; do not overlay an `ssl` object that can replace URI SSL parameters.

## File Map

### Server runtime

- `Server/src/config.js` — validates and normalizes environment configuration.
- `Server/src/app.js` — composes Express middleware, repositories, services, and routes.
- `Server/src/server.js` — loads `.env`, migrates, starts HTTP, and shuts down cleanly.
- `Server/src/errors.js` — safe application errors and PostgreSQL error mapping.
- `Server/src/http/async-route.js` — Express 4 async error forwarding.
- `Server/src/http/error-handler.js` — one JSON error envelope, including Multer errors.
- `Server/src/http/auth-middleware.js` — verifies the cookie and attaches `req.userId`.
- `Server/src/http/rate-limits.js` — separate authentication and Gemini-operation limiters.
- `Server/src/http/upload.js` — one-file, 5 MiB in-memory PDF middleware.
- `Server/src/http/routes/*.js` — health, auth, resume, dashboard, insights, versions, and history endpoints.

### Database and domain

- `Server/src/db/pool.js` — `pg.Pool` construction and pool error logging.
- `Server/src/db/migrate.js` / `migrate-cli.js` — ordered migrations with advisory locking.
- `Server/src/db/migrations/001_initial_schema.sql` — approved PostgreSQL schema.
- `Server/src/db/transaction.js` — transaction helper.
- `Server/src/repositories/users.js` — user persistence.
- `Server/src/repositories/resumes.js` — owned resumes, versions, analyses, and rewrite transactions.
- `Server/src/repositories/analytics.js` — user-scoped aggregate snapshot queries.
- `Server/src/services/auth.js` — registration, login, profile, and password rules.
- `Server/src/services/pdf.js` — PDF signature and text extraction.
- `Server/src/services/gemini.js` — structured Gemini parsing/analysis, timeout, retry, and validation.
- `Server/src/services/resumes.js` — upload, analysis, and immutable rewrite orchestration.
- `Server/src/services/analytics.js` — pure dashboard/insight/version/history builders.
- `Server/src/domain/schemas.js` — Zod API, parsed-resume, and analysis schemas.
- `Server/src/domain/serialize.js` — snake_case row to frontend payload mapping.
- `Server/src/domain/rewrites.js` — exact immutable rewrite replacement.
- `Server/src/domain/diff.js` — word/line diff mapping.

### Tests and frontend

- `Server/test/helpers/harness.js` — pg-mem database, migrations, cookies, and fake Gemini/PDF adapters.
- `Server/test/*.test.js` — configuration, migration, HTTP, service, ownership, and aggregate tests.
- `Client/src/api/client.js`, `auth.js`, `resumes.js`, `dashboard.js`, `analytics.js` — real Axios calls.
- `Client/src/api/client.test.js`, `contracts.test.js` — interceptor and endpoint contract tests.
- `Client/src/components/resume/ResumeRow.jsx` — use `versionCount`.
- `package.json`, `scripts/dev.mjs`, `scripts/dev.test.mjs`, `README.md` — root orchestration and operating instructions.

---

### Task 1: Server dependencies, configuration, and safe errors

**Files:**
- Modify: `Server/package.json`
- Modify mechanically: `Server/package-lock.json`
- Create: `Server/.env.example`
- Create: `Server/src/config.js`
- Create: `Server/src/errors.js`
- Create: `Server/test/config.test.js`
- Create: `Server/test/errors.test.js`

**Interfaces:**
- Produces: `loadConfig(env): Config`
- Produces: `class AppError`, `mapDatabaseError(error)`, `toErrorBody(error, requestId)`
- `Config` keys: `nodeEnv`, `port`, `clientOrigin`, `postgresUrl`, `jwtSecret`, `jwtExpiresIn`, `cookieName`, `geminiApiKey`, `geminiModel`, `autoMigrate`.

- [ ] **Step 1: Update declared dependencies without writing application code**

Remove `mongoose`; add `pg`; update Multer to the current 2.x release; add `zod-to-json-schema`. Add `pg-mem` and `supertest` as dev dependencies. Add these scripts:

```json
{
  "scripts": {
    "dev": "nodemon src/server.js",
    "start": "node src/server.js",
    "db:migrate": "node src/db/migrate-cli.js",
    "test": "node --test --test-reporter=spec",
    "test:watch": "node --test --watch"
  }
}
```

Run from `Server/`: `npm install`

- [ ] **Step 2: Write failing configuration and error tests**

```js
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadConfig } = require("../src/config");

const valid = {
  POSTGRES_URL: "postgres://user:pass@localhost:5432/resumes",
  GEMINI_API_KEY: "gemini-test-key",
  JWT_SECRET: "x".repeat(32),
};

test("loadConfig requires the three secret-backed settings", () => {
  assert.throws(() => loadConfig({}), /POSTGRES_URL/);
});

test("POSTGRES_URL takes precedence and defaults are normalized", () => {
  const config = loadConfig({ ...valid, DATABASE_URL: "postgres://ignored/db" });
  assert.equal(config.postgresUrl, valid.POSTGRES_URL);
  assert.equal(config.port, 8000);
  assert.equal(config.autoMigrate, true);
  assert.equal(config.clientOrigin, "http://localhost:5173");
});

test("config errors never contain secret values", () => {
  assert.throws(
    () => loadConfig({ ...valid, JWT_SECRET: "too-short" }),
    (error) => !error.message.includes("too-short")
  );
});
```

`errors.test.js` must assert that PostgreSQL code `23505` maps to `409 CONFLICT`, ordinary `AppError` details survive, and unknown errors become `500 INTERNAL_ERROR` without stack/message leakage.

- [ ] **Step 3: Run RED**

Run: `npm test -- test/config.test.js test/errors.test.js`

Expected: fail because `src/config.js` and `src/errors.js` do not exist.

- [ ] **Step 4: Implement configuration and errors**

Use a Zod object plus a URL-scheme refinement:

```js
function loadConfig(env = process.env) {
  const input = {
    nodeEnv: env.NODE_ENV || "development",
    port: env.PORT || "8000",
    clientOrigin: env.CLIENT_ORIGIN || "http://localhost:5173",
    postgresUrl: env.POSTGRES_URL || env.DATABASE_URL,
    jwtSecret: env.JWT_SECRET,
    jwtExpiresIn: env.JWT_EXPIRES_IN || "7d",
    cookieName: env.COOKIE_NAME || "resume_tracker_session",
    geminiApiKey: env.GEMINI_API_KEY,
    geminiModel: env.GEMINI_MODEL || "gemini-2.5-flash",
    autoMigrate: env.AUTO_MIGRATE ?? "true",
  };
  const parsed = configSchema.safeParse(input);
  if (!parsed.success) {
    const names = [...new Set(parsed.error.issues.map((issue) => issue.path[0]))];
    throw new Error(`Invalid environment configuration: ${names.join(", ")}`);
  }
  return parsed.data;
}
```

`AppError` stores `status`, `code`, `details`, and `expose`; `toErrorBody` returns only safe fields. `mapDatabaseError` maps `23505`, `23503`, and connection-class `08xxx` codes without copying database messages.

- [ ] **Step 5: Document environment keys and run GREEN**

Write `.env.example` with non-secret examples and comments. Run: `npm test -- test/config.test.js test/errors.test.js`

Expected: all Task 1 tests pass.

### Task 2: PostgreSQL pool and idempotent schema migrations

**Files:**
- Create: `Server/src/db/pool.js`
- Create: `Server/src/db/transaction.js`
- Create: `Server/src/db/migrate.js`
- Create: `Server/src/db/migrate-cli.js`
- Create: `Server/src/db/migrations/001_initial_schema.sql`
- Create: `Server/test/migrations.test.js`

**Interfaces:**
- Produces: `createPool(connectionString): Pool`
- Produces: `withTransaction(pool, work): Promise<T>` where `work(client)` returns `T`.
- Produces: `runMigrations(pool, options?): Promise<string[]>`, returning newly applied filenames.

- [ ] **Step 1: Write the failing migration test**

Create a pg-mem pool, register `pg_advisory_lock(integer)` and `pg_advisory_unlock(integer)` test functions, then assert:

```js
test("initial migration creates all tables and is idempotent", async () => {
  const first = await runMigrations(pool, { migrationsDir, advisoryLock: false });
  const second = await runMigrations(pool, { migrationsDir, advisoryLock: false });
  assert.deepEqual(first, ["001_initial_schema.sql"]);
  assert.deepEqual(second, []);
  const result = await pool.query(
    "select table_name from information_schema.tables where table_schema = 'public'"
  );
  const names = new Set(result.rows.map((row) => row.table_name));
  for (const name of ["users", "resumes", "resume_versions", "analyses", "activity_events"]) {
    assert.ok(names.has(name), name);
  }
});
```

Add tests for lowercased-email uniqueness, `(resume_id, version_number)` uniqueness, score checks, and cascading resume deletion.

- [ ] **Step 2: Run RED**

Run: `npm test -- test/migrations.test.js`

Expected: fail because the migration runner and SQL do not exist.

- [ ] **Step 3: Implement the migration runner and transaction helper**

`runMigrations` must sort `*.sql`, create `schema_migrations`, optionally acquire a fixed advisory lock, and wrap each unapplied file in `begin/insert/commit`, rolling back on failure. Always release the client and advisory lock in `finally`.

```js
async function withTransaction(pool, work) {
  const client = await pool.connect();
  try {
    await client.query("begin");
    const result = await work(client);
    await client.query("commit");
    return result;
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}
```

`createPool` passes only `{ connectionString, max: 10, idleTimeoutMillis: 30000, connectionTimeoutMillis: 10000 }` so provider URI TLS settings remain intact.

- [ ] **Step 4: Write the complete initial schema**

Implement every table, constraint, default, and index in the approved spec. The migration must use this order: `users`, `resumes`, `resume_versions`, add the `current_version_id` foreign key, `analyses`, `activity_events`. UUID defaults are deliberately absent because IDs come from `crypto.randomUUID()`.

- [ ] **Step 5: Run GREEN**

Run: `npm test -- test/migrations.test.js`

Expected: migration, constraint, idempotency, and cascade tests pass.

### Task 3: Express composition, health, request IDs, and error envelope

**Files:**
- Create: `Server/src/http/async-route.js`
- Create: `Server/src/http/error-handler.js`
- Create: `Server/src/http/rate-limits.js`
- Create: `Server/src/http/routes/health.js`
- Create: `Server/src/app.js`
- Create: `Server/src/server.js`
- Create: `Server/test/http-foundation.test.js`

**Interfaces:**
- Produces: `createApp({ config, pool, overrides? }): Express.Application`
- Produces: `createServerRuntime({ config?, pool?, app? }): { start, stop }`
- Produces: `createRateLimits(options?): { authLimiter, aiLimiter }`.
- Every request receives `req.requestId` and `X-Request-Id`.

- [ ] **Step 1: Write failing foundation tests**

```js
test("health checks PostgreSQL and returns the request ID", async () => {
  const response = await request(app).get("/api/health").expect(200);
  assert.deepEqual(response.body, { ok: true, database: "connected" });
  assert.match(response.headers["x-request-id"], /^[0-9a-f-]{36}$/);
});

test("unknown API route uses the standard envelope", async () => {
  const response = await request(app).get("/api/not-real").expect(404);
  assert.equal(response.body.error.code, "NOT_FOUND");
  assert.equal(typeof response.body.error.message, "string");
});
```

Also assert invalid JSON returns `400 INVALID_JSON` rather than HTML, no stack appears in production mode, and the rate-limit factory creates independent auth and AI policies. Use one-request test limits to prove each limiter returns the standard `429 RATE_LIMITED` envelope.

- [ ] **Step 2: Run RED**

Run: `npm test -- test/http-foundation.test.js`

Expected: fail because `createApp` does not exist.

- [ ] **Step 3: Implement the minimal app and bootstrap**

Middleware order must be: request ID, Morgan, exact-origin CORS with credentials, `express.json({ limit: "256kb" })`, cookie parser, health route, feature routes, API 404, error handler.

The default auth limiter allows 20 requests per 15 minutes and is attached to registration, login, and password changes. The default AI limiter allows 10 requests per 5 minutes and is attached to upload parsing, analysis, and rewrite creation. Both use `standardHeaders: true`, `legacyHeaders: false`, and a handler that forwards `AppError(429, "RATE_LIMITED", "Too many requests; please try again later")`. `createApp` accepts limiter overrides so HTTP tests do not share counters.

`server.js` must load dotenv before configuration, create the pool, optionally migrate, verify `select 1`, initialize Gemini, and only then listen. `stop()` closes HTTP before `pool.end()`. Register `SIGINT` and `SIGTERM` once.

- [ ] **Step 4: Run GREEN**

Run: `npm test -- test/http-foundation.test.js`

Expected: all foundation tests pass with JSON content types.

### Task 4: Authentication and account settings

**Files:**
- Create: `Server/src/repositories/users.js`
- Create: `Server/src/services/auth.js`
- Create: `Server/src/http/auth-middleware.js`
- Create: `Server/src/http/routes/auth.js`
- Create: `Server/src/domain/serialize.js`
- Create: `Server/test/helpers/harness.js`
- Create: `Server/test/auth.test.js`
- Modify: `Server/src/app.js`

**Interfaces:**
- `createUserRepository(pool)` produces `findByEmail`, `findPublicById`, `insert`, `updateName`, `updatePassword`.
- `createAuthService({ users, config, bcrypt, jwt })` produces `register`, `login`, `getUser`, `updateProfile`, `changePassword`, `signSession`, `verifySession`.
- `toPublicUser(row)` returns `{ _id, name, email, createdAt }`.

- [ ] **Step 1: Build the reusable test harness**

The harness creates a fresh pg-mem pool, runs migrations, supplies valid test config, injects deterministic PDF/Gemini doubles, and returns `{ app, pool, register, close }`. `register()` uses Supertest and returns the response cookie for subsequent `.set("Cookie", cookie)` calls.

- [ ] **Step 2: Write failing registration/session tests**

Cover `201` registration, lowercase email storage, password hash non-disclosure, duplicate email `409`, cookie `HttpOnly`/`SameSite=Lax`, `GET /me`, logout cookie clearing, and invalid cookie `401`.

```js
test("registers and authenticates through the HTTP-only cookie", async () => {
  const response = await request(app).post("/api/auth/register").send({
    name: "Ada Lovelace",
    email: "ADA@example.com",
    password: "correct horse battery staple",
  }).expect(201);
  assert.equal(response.body.user.email, "ada@example.com");
  assert.ok(!("passwordHash" in response.body.user));
  const cookie = response.headers["set-cookie"][0];
  assert.match(cookie, /HttpOnly/i);
  assert.match(cookie, /SameSite=Lax/i);
  await request(app).get("/api/auth/me").set("Cookie", cookie).expect(200);
});
```

- [ ] **Step 3: Run RED, then implement registration/session behavior**

Run: `npm test -- test/auth.test.js --test-name-pattern="register|session|duplicate|logout"`

Expected RED: auth routes return 404.

Implement Zod request schemas, bcrypt cost 12, JWT subject=user ID, safe cookie options, generic invalid-credentials messages, and owner lookup. Run the same command and expect GREEN.

- [ ] **Step 4: Write failing login/profile/password tests**

Cover correct login, wrong email/password with identical `401` messages, trimmed 1–80 character name, incorrect current password, minimum-eight-character new password, successful password rotation, and old-password rejection afterward.

- [ ] **Step 5: Run RED, implement remaining account endpoints, and run GREEN**

Routes and responses must exactly be:

```text
POST  /api/auth/login      -> { user }
PATCH /api/auth/profile    -> { user }
PATCH /api/auth/password   -> { ok: true }
```

Mount `authLimiter` on registration, login, and password routes; profile and `me` remain under normal application limits.

Run: `npm test -- test/auth.test.js`

Expected: all authentication tests pass.

### Task 5: Validated PDF and Gemini adapters

**Files:**
- Create: `Server/src/domain/schemas.js`
- Create: `Server/src/services/pdf.js`
- Create: `Server/src/services/gemini.js`
- Create: `Server/test/pdf.test.js`
- Create: `Server/test/gemini.test.js`

**Interfaces:**
- `extractPdfText(buffer, { parsePdf? }): Promise<string>`
- `createGeminiService({ generateContent, model, timeoutMs?, attempts? })`
- Gemini service methods: `parseResume(rawText)` and `analyzeResume({ rawText, parsedSections, targetRole })`.
- Zod exports: `parsedSectionsSchema`, `analysisResultSchema`, `parsedSectionsJsonSchema`, `analysisJsonSchema`.

- [ ] **Step 1: Write failing PDF validation tests**

Assert non-buffer, missing `%PDF-` signature, parser rejection, empty extracted text, and successful trimmed text. Inject `parsePdf` so tests need no fixture:

```js
const text = await extractPdfText(Buffer.from("%PDF-test"), {
  parsePdf: async () => ({ text: "  Ada resume  " }),
});
assert.equal(text, "Ada resume");
```

- [ ] **Step 2: Run RED, implement PDF extraction, run GREEN**

Run: `npm test -- test/pdf.test.js`

`extractPdfText` must cap extracted text at 200,000 characters and map parser failures to `400 INVALID_PDF` without including parser internals.

- [ ] **Step 3: Write failing Gemini structured-output tests**

Use an injected `generateContent` function returning `{ text: JSON.stringify(value) }`. Assert `parseResume` and `analyzeResume` pass `responseMimeType: "application/json"`, a JSON schema, low temperature, and an abort signal. Assert invalid JSON/schema returns `502 AI_INVALID_RESPONSE`, a transient first failure retries once, non-transient validation failure does not retry, and timeout returns `502 AI_UPSTREAM_ERROR`.

- [ ] **Step 4: Run RED, implement Gemini service, run GREEN**

Core call:

```js
const response = await generateContent({
  model,
  contents: prompt,
  config: {
    systemInstruction,
    responseMimeType: "application/json",
    responseJsonSchema: jsonSchema,
    temperature: 0.1,
    abortSignal: controller.signal,
  },
});
const parsed = schema.safeParse(JSON.parse(response.text || ""));
```

Normalize every top-level parsed section, give each rewrite a server-generated stable `_id`, and verify the four breakdown integers sum to `atsScore` before returning.

Run: `npm test -- test/gemini.test.js`

Expected: all adapter tests pass without network access.

### Task 6: Resume upload, listing, details, versions, and deletion

**Files:**
- Create: `Server/src/http/upload.js`
- Create: `Server/src/repositories/resumes.js`
- Create: `Server/src/services/resumes.js`
- Create: `Server/src/http/routes/resumes.js`
- Create: `Server/test/resumes.test.js`
- Modify: `Server/src/app.js`
- Modify: `Server/src/domain/serialize.js`

**Interfaces:**
- Repository: `createFromUpload`, `listOwned`, `findOwnedDetail`, `findOwnedVersion`, `deleteOwned`.
- Service: `upload({ userId, file, title })`, `list(userId)`, `detail(userId, resumeId)`, `version(userId, resumeId, versionId)`, `remove(userId, resumeId)`.
- Upload response: `{ resume: { _id, title, createdAt, updatedAt, currentVersionId } }`.

- [ ] **Step 1: Write failing upload and validation HTTP tests**

Use `.attach("file", Buffer.from("%PDF-test"), { filename: "Ada.pdf", contentType: "application/pdf" })`. Assert V1 creation, filename-derived title, custom title, one upload event, absent file, wrong MIME/extension/signature, unexpected field, and >5 MiB `413`.

- [ ] **Step 2: Run RED**

Run: `npm test -- test/resumes.test.js --test-name-pattern="upload|PDF|5 MiB"`

Expected: resume upload route returns 404.

- [ ] **Step 3: Implement upload transaction and middleware**

Multer configuration:

```js
multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 1, parts: 2 },
  fileFilter(_req, file, callback) {
    callback(null, file.mimetype === "application/pdf" && /\.pdf$/i.test(file.originalname));
  },
}).single("file");
```

Mount `aiLimiter` before the upload middleware so rejected requests do not allocate file buffers.

`createFromUpload` must create resume/V1/event and assign `current_version_id` in one transaction. The title is trimmed to 160 characters; an empty supplied title falls back to the basename without `.pdf`.

- [ ] **Step 4: Run upload GREEN, then write failing read/delete tests**

Run the focused upload command and expect pass. Then test list shape (`versionCount`, `bestScore`), detail order, version response, delete cascade, invalid UUID, missing resource, and a second user's inability to read/delete the first user's resume.

- [ ] **Step 5: Implement owned reads/deletion and run GREEN**

Every SQL query joins or filters `resumes.user_id = $userId`. Serialize versions as:

```js
{
  _id: row.id,
  label: `V${row.version_number}`,
  sourceType: row.source_type,
  createdAt: row.created_at.toISOString(),
  score: row.latest_score,
  rawText: row.raw_text,
  parsedSections: parsedSectionsSchema.parse(row.parsed_sections),
}
```

Run: `npm test -- test/resumes.test.js`

Expected: all resume CRUD and isolation tests pass.

### Task 7: Analysis persistence, rewrites, and diffs

**Files:**
- Create: `Server/src/domain/rewrites.js`
- Create: `Server/src/domain/diff.js`
- Create: `Server/test/analysis.test.js`
- Create: `Server/test/rewrites.test.js`
- Create: `Server/test/diff.test.js`
- Modify: `Server/src/repositories/resumes.js`
- Modify: `Server/src/services/resumes.js`
- Modify: `Server/src/http/routes/resumes.js`
- Modify: `Server/src/domain/serialize.js`

**Interfaces:**
- `analyze({ userId, resumeId, versionId, targetRole? }): Promise<AnalysisPayload>`
- `applyAnalysisRewrites({ userId, resumeId, analysisId, rewriteIds? }): Promise<{ version, appliedCount }>`
- `applyRewrites(parsedSections, suggestions): { parsedSections, matchedIds }`
- `buildDiff(fromText, toText, mode): { hunks }`

- [ ] **Step 1: Write failing analysis tests**

Assert owned version input reaches the fake Gemini adapter, target role is trimmed, analysis is inserted, `latest_score` and resume `updated_at` change, an event is written, newest analysis wins, list is newest first, and cross-user/foreign-version requests return `404`.

- [ ] **Step 2: Run RED, implement analysis transaction, run GREEN**

Run: `npm test -- test/analysis.test.js`

The insert/update/event operations run in one transaction. `GET .../analysis` returns `404 NO_ANALYSIS` only after ownership is confirmed.

Mount `aiLimiter` on analysis and rewrite POST routes. Read-only analysis, version, and diff requests are not charged against this policy.

- [ ] **Step 3: Write failing pure rewrite tests**

```js
test("replaces selected exact strings without mutating the source", () => {
  const source = { experience: [{ bullets: ["Old", "Keep"] }] };
  const result = applyRewrites(source, [{ _id: "rw1", original: "Old", rewritten: "New" }]);
  assert.deepEqual(result.parsedSections.experience[0].bullets, ["New", "Keep"]);
  assert.equal(source.experience[0].bullets[0], "Old");
  assert.deepEqual([...result.matchedIds], ["rw1"]);
});
```

Also cover nested summary/project strings, one suggestion matching multiple identical strings, no match, and overlapping suggestions.

- [ ] **Step 4: Run RED, implement pure rewrite replacement, run GREEN**

Run: `npm test -- test/rewrites.test.js --test-name-pattern="replaces|match|mutating|overlapping"`

Implement recursive array/object traversal over a structured clone. Match original strings exactly; never apply substring replacement inside parsed fields.

- [ ] **Step 5: Write failing rewrite endpoint tests**

Cover selected IDs, omitted IDs meaning all, unknown ID `400`, unmatched selected rewrite `409`, V2 parent linkage, immutable V1, `current_version_id`, applied count/event metadata, and two concurrent rewrite requests allocating distinct version numbers.

- [ ] **Step 6: Implement locked rewrite transaction and run GREEN**

Inside `withTransaction`, select the owned resume `for update`, reload the analysis/version, validate all selections, compute `max(version_number) + 1`, insert the child version, update current version, and insert the event. Parameterize every value.

Run: `npm test -- test/rewrites.test.js`

- [ ] **Step 7: Write failing word/line diff tests, implement, and run GREEN**

Use `diffWordsWithSpace` for `words` and `diffLines` for `lines`. Map each part to `{ type: part.added ? "add" : part.removed ? "remove" : "context", text: part.value }`, discard only empty text, validate version ownership and `from !== to`.

Run: `npm test -- test/diff.test.js`

Expected: word/line modes, invalid mode, same version, missing version, and cross-user cases pass.

### Task 8: Dashboard, insights, versions, and history aggregates

**Files:**
- Create: `Server/src/repositories/analytics.js`
- Create: `Server/src/services/analytics.js`
- Create: `Server/src/http/routes/analytics.js`
- Create: `Server/test/analytics.test.js`
- Modify: `Server/src/app.js`

**Interfaces:**
- `loadAnalyticsSnapshot(userId)` returns owned `resumes`, `versions`, `analyses`, and `events` rows.
- Pure builders: `buildDashboard`, `buildInsights`, `buildVersions`, `buildHistory`.

- [ ] **Step 1: Write failing pure aggregate tests**

Use a fixed timestamp fixture and assert exact new-user shapes plus a multi-resume fixture. Definitions:

- Dashboard totals: resume count, sum of rewrite event `metadata.appliedCount`, analysis count.
- Latest resume: greatest `updated_at`.
- Current score: latest resume's current version `latest_score`.
- Issue and keyword KPI: latest analysis counts; delta against the preceding analysis when one exists.
- Insights: all-analysis rounded average/best/trend, grouped issue titles and keywords, and per-resume first/latest/best improvement.
- Versions: all version rows newest first and upload/rewrite totals.
- History: all events newest first and counts by type.

- [ ] **Step 2: Run RED, implement pure builders, run GREEN**

Run: `npm test -- test/analytics.test.js --test-name-pattern="builder|empty|aggregate"`

Limit chart sparks/trends to chronological points expected by current components; limit dashboard activity to five events and top issue/keyword lists to five entries.

- [ ] **Step 3: Write failing endpoint and ownership tests**

Register two users with different resumes. Assert `/api/dashboard`, `/api/insights`, `/api/versions`, and `/api/history` contain only the requesting user's IDs/titles/counts and use the exact mock-documented top-level property names.

- [ ] **Step 4: Implement snapshot repository/routes and run GREEN**

Run: `npm test -- test/analytics.test.js`

Expected: empty, aggregate, chronological, and multi-user isolation cases pass.

### Task 9: Replace frontend mocks with the real API

**Files:**
- Modify: `Client/package.json`
- Modify mechanically: `Client/package-lock.json`
- Modify: `Client/src/api/client.js`
- Modify: `Client/src/api/auth.js`
- Modify: `Client/src/api/resumes.js`
- Modify: `Client/src/api/dashboard.js`
- Modify: `Client/src/api/analytics.js`
- Modify: `Client/src/components/resume/ResumeRow.jsx`
- Create: `Client/src/api/client.test.js`
- Create: `Client/src/api/contracts.test.js`

**Interfaces:**
- `apiClient` remains the shared Axios instance.
- `normalizeApiError(error)` returns `{ status, message, details, original }`.
- `authApi`, `resumesApi`, `dashboardApi`, and `analyticsApi` retain every existing method name/signature.

- [ ] **Step 1: Add the client test script and write failing interceptor tests**

Set `"test": "node --test"`. Assert a server envelope becomes the existing frontend error shape, a network failure falls back to Axios's message, and `details` is optional.

- [ ] **Step 2: Run RED, implement Axios client, run GREEN**

Run: `npm test -- src/api/client.test.js`

Create Axios with `{ baseURL: "/api", withCredentials: true }`; do not set a default content type. Install the response interceptor using exported `normalizeApiError`.

- [ ] **Step 3: Write failing adapter contract tests**

Temporarily replace `apiClient.defaults.adapter` with a recorder and assert every method and URL. Required cases include multipart upload fields, analyze body, rewrite body, and diff query params.

```js
assert.equal(calls[0].url, "/resumes/r1/diff");
assert.deepEqual(calls[0].params, { from: "v1", to: "v2", mode: "words" });
assert.equal(uploadCall.data.get("title"), "Backend Engineer");
```

- [ ] **Step 4: Run RED, replace all mock implementations, run GREEN**

Run: `npm test -- src/api/contracts.test.js`

Use the already-commented request definitions as the contract, remove all `@/mock/*` and mock-delay imports, and let FormData set its own multipart boundary.

- [ ] **Step 5: Fix the version count consumer and run the client suite**

Replace `latestVersionNumber` reads in `ResumeRow` with `versionCount`. Run: `npm test`

Expected: API tests plus the existing theme tests pass.

### Task 10: Root launcher, documentation, and full verification

**Files:**
- Create: `package.json`
- Create: `scripts/dev.mjs`
- Create: `scripts/dev.test.mjs`
- Create: `README.md`
- Modify if verification exposes a scoped defect: files created in Tasks 1–9

**Interfaces:**
- `getNpmExecutable(platform)` returns `npm.cmd` on Windows and `npm` elsewhere.
- `runDevelopment()` starts `npm --prefix Server run dev` and `npm --prefix Client run dev`.

- [ ] **Step 1: Write the failing launcher unit test**

```js
test("uses the Windows npm executable under Git Bash", () => {
  assert.equal(getNpmExecutable("win32"), "npm.cmd");
  assert.equal(getNpmExecutable("linux"), "npm");
});
```

Also test that the child argument arrays are exactly `--prefix Server run dev` and `--prefix Client run dev`.

- [ ] **Step 2: Run RED, implement launcher and root scripts, run GREEN**

Root scripts:

```json
{
  "private": true,
  "scripts": {
    "setup": "npm --prefix Server install && npm --prefix Client ci",
    "dev": "node scripts/dev.mjs",
    "test": "npm --prefix Server test && npm --prefix Client test",
    "build": "npm --prefix Client run build",
    "lint": "npm --prefix Client run lint"
  }
}
```

The launcher uses `spawn` with `stdio: "inherit"`, never a shell-built command. On either child exit or `SIGINT`/`SIGTERM`, signal the other child once and propagate a nonzero unexpected exit code.

Run: `node --test scripts/dev.test.mjs`

- [ ] **Step 3: Write exact operating documentation**

Document these Git Bash commands without exposing the real `.env`:

```bash
cp -n Server/.env.example Server/.env
# Fill POSTGRES_URL, GEMINI_API_KEY, and JWT_SECRET.
npm run setup
npm run dev
```

Include the URLs, automatic migration behavior, explicit `npm --prefix Server run db:migrate`, test/build/lint commands, production cookie/origin requirements, and troubleshooting for database connection, invalid PDF, and Gemini errors.

- [ ] **Step 4: Run complete automated verification**

From the repository root in Git Bash, run separately and require exit code 0:

```bash
npm --prefix Server test
npm --prefix Client test
npm --prefix Client run lint
npm --prefix Client run build
node --test scripts/dev.test.mjs
```

- [ ] **Step 5: Run dependency and source hygiene checks**

```bash
rg -n "mongoose|MONGO_URI|mockDelay|@/mock" Server Client/src/api
rg -n "POSTGRES_URL|GEMINI_API_KEY|JWT_SECRET" Server/.env.example README.md
```

Expected: the first search has no active backend/API-mock matches; the second confirms documented names without secret values.

- [ ] **Step 6: Run PostgreSQL and HTTP smoke verification when credentials are present**

Start `npm run dev`, then verify:

```bash
curl --fail http://127.0.0.1:8000/api/health
```

Expected body: `{"ok":true,"database":"connected"}`. Inspect the database for the six tables and one applied migration. If no valid `POSTGRES_URL` has been supplied, report this smoke check as not run rather than claiming it passed.

- [ ] **Step 7: Run browser smoke verification when PostgreSQL and Gemini are configured**

Use the browser helper to register a new account, upload a small valid sample PDF, analyze V1, apply one rewrite to create V2, compare V1/V2, view dashboard/insights/history, export V2, and log out. Capture console errors and network failures. If a real Gemini key or suitable sample PDF is unavailable, report exactly which external smoke steps remain.

- [ ] **Step 8: Re-read the spec and report evidence**

Check all nine acceptance criteria in the specification against test output, build/lint output, SQL inspection, and browser results. Report changed files, commands and counts, external checks not run, and environment values the user must add. Do not claim completion for any command not freshly executed.
