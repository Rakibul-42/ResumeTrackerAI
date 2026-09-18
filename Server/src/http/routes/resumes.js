const {Router}=require('express');
const multer=require('multer');
const {z}=require('zod');
const {AppError}=require('../../errors');
const wrap=require('../async-route');
const uuid=z.string().uuid();
const {aiNoticeVersion}=require('../../../../shared/public-site.json');
function resumeRoutes({service,requireAuth,aiLimiter}) {
  const router=Router();router.use(requireAuth);
  router.param('id',(req,_res,next,id)=>{try{uuid.parse(id);next();}catch(e){next(e);}});
  router.param('versionId',(req,_res,next,id)=>{try{uuid.parse(id);next();}catch(e){next(e);}});
  const upload=multer({storage:multer.memoryStorage(),limits:{files:1,fileSize:5*1024*1024,fields:3,fieldSize:1024,parts:4},fileFilter(_req,file,cb){
    if(file.mimetype!=='application/pdf'|| !/\.pdf$/i.test(file.originalname)) return cb(new AppError(400,'INVALID_PDF','Only PDF uploads are supported.'));
    cb(null,true);
  }}).single('file');
  router.get('/',wrap(async(req,res)=>res.json(await service.list(req.userId))));
  router.post('/',aiLimiter,upload,wrap(async(req,res)=>{
    const {title,noticeVersion}=z.object({title:z.string().trim().max(160).optional(),acknowledgeAi:z.literal('true'),noticeVersion:z.literal(aiNoticeVersion)}).strict().parse(req.body || {});
    res.status(201).json(await service.upload({userId:req.userId,file:req.file,title,noticeVersion}));
  }));
  router.get('/:id',wrap(async(req,res)=>res.json(await service.detail(req.userId,req.params.id))));
  router.delete('/:id',wrap(async(req,res)=>res.json(await service.remove(req.userId,req.params.id))));
  router.get('/:id/versions/:versionId',wrap(async(req,res)=>res.json(await service.version(req.userId,req.params.id,req.params.versionId))));
  router.get('/:id/analyses',wrap(async(req,res)=>res.json(await service.analyses(req.userId,req.params.id))));
  router.get('/:id/versions/:versionId/analysis',wrap(async(req,res)=>res.json(await service.analysisForVersion(req.userId,req.params.id,req.params.versionId))));
  router.post('/:id/analyze',aiLimiter,wrap(async(req,res)=>{
    const input=z.object({versionId:uuid,targetRole:z.string().trim().max(160).optional()}).strict().parse(req.body);
    res.status(201).json(await service.analyze({userId:req.userId,resumeId:req.params.id,...input}));
  }));
  router.post('/:id/rewrite',aiLimiter,wrap(async(req,res)=>{
    const input=z.object({analysisId:uuid,rewriteIds:z.array(z.string().min(1).max(100)).min(1).max(30).optional()}).strict().parse(req.body);
    res.status(201).json(await service.rewrite({userId:req.userId,resumeId:req.params.id,...input}));
  }));
  router.get('/:id/diff',wrap(async(req,res)=>{
    const {from,to,mode}=z.object({from:uuid,to:uuid,mode:z.enum(['words','lines']).default('words')}).refine(v=>v.from!==v.to,'Choose two different versions.').parse(req.query);
    res.json(await service.diff(req.userId,req.params.id,from,to,mode));
  }));
  return router;
}
module.exports={resumeRoutes};
