const { Router } = require('express');
const { z } = require('zod');
const jwt = require('jsonwebtoken');
const wrap = require('../async-route');
const { toPublicUser } = require('../../services/auth');
const {termsVersion}=require('../../../../shared/public-site.json');
const name = z.string().trim().min(1).max(80);
const email = z.string().trim().email().max(254).transform(v=>v.toLowerCase());
const password = z.string().min(8).refine(v=>Buffer.byteLength(v,'utf8')<=72,'Password must be 72 UTF-8 bytes or fewer.');
function authRoutes({auth,config,requireAuth,authLimiter}) {
  const router = Router();
  const options = { httpOnly:true, sameSite:'lax', secure:config.nodeEnv==='production', path:'/' };
  function sendUser(res,user,status=200) {
    const token = auth.signSession(user);
    res.cookie(config.cookieName,token,{...options, maxAge: Math.max(0,jwt.decode(token).exp*1000-Date.now())});
    return res.status(status).json({ user:toPublicUser(user) });
  }
  router.post('/register',authLimiter,wrap(async(req,res)=>sendUser(res,await auth.register(z.object({name,email,password,acceptedTerms:z.literal(true),termsVersion:z.literal(termsVersion)}).strict().parse(req.body)),201)));
  router.post('/login',authLimiter,wrap(async(req,res)=>sendUser(res,await auth.login(z.object({email,password:z.string().min(1).max(200)}).strict().parse(req.body)))));
  router.get('/me',requireAuth,(req,res)=>res.json({user:toPublicUser(req.user)}));
  router.post('/logout',wrap(async(req,res)=>{
    const token = req.cookies[config.cookieName];
    if (token) {
      try { const user=await auth.authenticate(token); await auth.revoke(user.id); }
      catch(e) { if(e.status!==401) throw e; }
    }
    res.clearCookie(config.cookieName,options).json({ok:true});
  }));
  router.patch('/profile',requireAuth,wrap(async(req,res)=>res.json({user:toPublicUser(await auth.updateProfile(req.userId,z.object({name}).strict().parse(req.body).name))})));
  router.patch('/password',requireAuth,authLimiter,wrap(async(req,res)=>{
    const input=z.object({currentPassword:z.string().min(1).max(200),newPassword:password}).strict().parse(req.body);
    const user=await auth.changePassword(req.user,input.currentPassword,input.newPassword);
    sendUser(res,user);
  }));
  return router;
}
module.exports = { authRoutes };
