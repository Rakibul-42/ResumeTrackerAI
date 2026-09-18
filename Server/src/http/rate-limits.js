const { rateLimit } = require('express-rate-limit');
const {createPostgresRateLimitStore} = require('./postgres-rate-limit-store');
function createRateLimits({ authLimit = 30, aiLimit = 10, pool, config } = {}) {
  const handler = (_req,res) => res.status(429).json({ error: { code:'RATE_LIMITED', message:'Too many requests. Please try again shortly.' } });
  const base = { standardHeaders:true, legacyHeaders:false, handler };
  const shared = scope => config?.nodeEnv === 'production' ? {store:createPostgresRateLimitStore({pool,scope,secret:config.jwtSecret})} : {};
  return {
    authLimiter: rateLimit({ ...base, ...shared('auth'), windowMs:15*60*1000, limit:authLimit }),
    aiLimiter: rateLimit({ ...base, ...shared('ai'), windowMs:5*60*1000, limit:aiLimit, keyGenerator:req => req.userId }),
  };
}
module.exports = { createRateLimits };
