const { z } = require('zod');
const {publicConfigFromEnv} = require('../../shared/public-site.mjs');
const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(8000),
  CLIENT_ORIGIN: z.string().url().default('http://localhost:5173'),
  POSTGRES_URL: z.string().url().refine(v => /^postgres(?:ql)?:\/\//.test(v)),
  GEMINI_API_KEY: z.string().trim().min(1),
  JWT_SECRET: z.string().min(32).refine(v=>!v.startsWith('replace-with-'),'Replace the example JWT secret.'),
  JWT_EXPIRES_IN: z.string().regex(/^\d+[smhd]$/).default('7d'),
  COOKIE_NAME: z.string().regex(/^[a-zA-Z0-9_]+$/).default('resume_tracker_session'),
  GEMINI_MODEL: z.string().trim().min(1).default('gemini-2.5-flash'),
  AUTO_MIGRATE: z.enum(['true', 'false']).default('true'),
  PG_POOL_MAX: z.coerce.number().int().min(1).max(200).default(10),
  PG_IDLE_TIMEOUT_MS: z.coerce.number().int().min(1000).max(300000).default(30000),
  PG_CONNECT_TIMEOUT_MS: z.coerce.number().int().min(1000).max(60000).default(10000),
});
function loadConfig(env = process.env) {
  const values = Object.fromEntries(Object.entries(env).map(([key,value])=>[key,typeof value==='string' && !value.trim()?undefined:value]));
  const result = schema.safeParse({ ...values, POSTGRES_URL: values.POSTGRES_URL || values.DATABASE_URL });
  if (!result.success) throw new Error(`Invalid environment configuration: ${[...new Set(result.error.issues.map(i => i.path[0]))].join(', ')}`);
  const v = result.data;
  return { nodeEnv: v.NODE_ENV, port: v.PORT, clientOrigin: new URL(v.CLIENT_ORIGIN).origin,
    postgresUrl: v.POSTGRES_URL, geminiApiKey: v.GEMINI_API_KEY, jwtSecret: v.JWT_SECRET,
    jwtExpiresIn: v.JWT_EXPIRES_IN, cookieName: v.COOKIE_NAME, geminiModel: v.GEMINI_MODEL,
    autoMigrate: v.AUTO_MIGRATE === 'true', publicSite: publicConfigFromEnv(env),
    pool: {max:v.PG_POOL_MAX,idleTimeoutMillis:v.PG_IDLE_TIMEOUT_MS,connectionTimeoutMillis:v.PG_CONNECT_TIMEOUT_MS} };
}
module.exports = { loadConfig };
