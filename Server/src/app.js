const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const { randomUUID } = require('node:crypto');
const path = require('node:path');
const {existsSync,readFileSync} = require('node:fs');
const {createPublicSiteRouter} = require('./http/public-site');
const { AppError } = require('./errors');
const { createUserRepository } = require('./repositories/users');
const { createAuthService } = require('./services/auth');
const { authRoutes } = require('./http/routes/auth');
const { createRateLimits } = require('./http/rate-limits');
const { errorHandler } = require('./http/error-handler');
const wrap = require('./http/async-route');
const {createResumeRepository}=require('./repositories/resumes');
const {createResumeService}=require('./services/resumes');
const {createGeminiService}=require('./services/gemini');
const {extractPdfText}=require('./services/pdf');
const {resumeRoutes}=require('./http/routes/resumes');
const {createAnalyticsRepository}=require('./repositories/analytics');
const {createAnalyticsService}=require('./services/analytics');
function createApp({ config, pool, overrides = {} }) {
  const app=express();
  app.disable('x-powered-by');
  app.use((req,res,next)=>{req.requestId=randomUUID(); res.set('X-Request-Id',req.requestId); res.set('X-Content-Type-Options','nosniff'); res.set('Cache-Control','private, no-store'); if(req.path.startsWith('/api')) res.set('X-Robots-Tag','noindex, nofollow'); next();});
  app.use((req,_res,next)=>{
    if(!['GET','HEAD','OPTIONS'].includes(req.method) && req.headers.origin && req.headers.origin!==config.clientOrigin)
      return next(new AppError(403,'ORIGIN_REJECTED','Request origin is not allowed.'));
    next();
  });
  app.use(cors({origin:config.clientOrigin,credentials:true}));
  app.use(express.json({limit:'256kb'}));
  app.use(cookieParser());
  const limits=createRateLimits({...overrides.rateLimits,pool,config});
  const auth=createAuthService({users:createUserRepository(pool),config});
  const requireAuth=wrap(async(req,_res,next)=>{req.user=await auth.authenticate(req.cookies[config.cookieName]); req.userId=req.user.id; next();});
  app.get('/api/health',wrap(async(_req,res)=>{await pool.query('SELECT 1');res.json({ok:true,database:'connected'});}));
  app.use('/api/auth',authRoutes({auth,config,requireAuth,...limits}));
  const gemini=overrides.gemini || createGeminiService({model:config.geminiModel,generateContent:async args=>{
    const {GoogleGenAI}=require('@google/genai');
    return new GoogleGenAI({apiKey:config.geminiApiKey}).models.generateContent(args);
  }});
  const service=createResumeService({repository:createResumeRepository(pool),gemini,extractPdfText:overrides.extractPdfText || extractPdfText});
  app.use('/api/resumes',resumeRoutes({service,requireAuth,...limits}));
  const analytics=createAnalyticsService(createAnalyticsRepository(pool));
  for(const path of ['dashboard','insights','versions','history']) {
    app.get(`/api/${path}`,requireAuth,wrap(async(req,res)=>res.json(await analytics[path](req.userId))));
  }
  const clientDist=path.join(__dirname,'..','..','Client','dist');
  if(config.nodeEnv==='production' && existsSync(path.join(clientDist,'index.html'))) {
    app.use('/assets',express.static(path.join(clientDist,'assets'),{immutable:true,maxAge:'1y'}));
    app.use((req,res,next)=>{
      if (!['/favicon.svg','/icons.svg','/og-image.png'].includes(req.path)) return next();
      return express.static(clientDist,{maxAge:'1h'})(req,res,next);
    });
    app.use(createPublicSiteRouter({config,html:readFileSync(path.join(clientDist,'index.html'),'utf8')}));
  }
  app.use((_req,_res,next)=>next(new AppError(404,'NOT_FOUND','Route not found.')));
  app.use(errorHandler);
  return app;
}
module.exports = { createApp };
