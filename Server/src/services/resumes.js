const {AppError}=require('../errors');
const {parsedSectionsSchema,analysisResultSchema}=require('../domain/schemas');
const {toResume,toVersion,toAnalysis}=require('../domain/serialize');
const {buildDiff}=require('../domain/diff');
function createResumeService({repository,gemini,extractPdfText}) {
  return {
    async upload({userId,file,title,noticeVersion}) {
      if(!file) throw new AppError(400,'FILE_REQUIRED','Choose a PDF to upload.');
      const rawText=await extractPdfText(file.buffer);
      const parsedSections=parsedSectionsSchema.parse(await gemini.parseResume(rawText));
      const filename=file.originalname.split(/[\\/]/).at(-1).slice(0,255);
      const resume=await repository.createFromUpload({userId,title:title?.trim() || filename.replace(/\.pdf$/i,'').slice(0,160) || 'Resume',filename,rawText,parsedSections,noticeVersion});
      return {resume:toResume(resume)};
    },
    async list(userId) {return {resumes:(await repository.listOwned(userId)).map(r=>({...toResume(r),versionCount:r.version_count,bestScore:r.best_score}))};},
    async detail(userId,id) {const d=await repository.findOwnedDetail(userId,id);return {resume:toResume(d.resume),versions:d.versions.map(toVersion)};},
    async version(userId,id,versionId) {return {version:toVersion(await repository.findOwnedVersion(userId,id,versionId))};},
    async remove(userId,id) {await repository.deleteOwned(userId,id);return {ok:true};},
    async analyze({userId,resumeId,versionId,targetRole}) {
      const version=await repository.findOwnedVersion(userId,resumeId,versionId);
      const result=await gemini.analyzeResume({rawText:version.raw_text,parsedSections:parsedSectionsSchema.parse(version.parsed_sections),targetRole});
      analysisResultSchema.parse(result);
      return {analysis:toAnalysis(await repository.saveAnalysis({userId,resumeId,versionId,targetRole,result}))};
    },
    async analyses(userId,id) {return {analyses:(await repository.analyses(userId,id)).map(toAnalysis)};},
    async analysisForVersion(userId,id,versionId) {
      const rows=await repository.analyses(userId,id,versionId);
      if(!rows[0]) throw new AppError(404,'NO_ANALYSIS','No analysis for this version yet.');
      return {analysis:toAnalysis(rows[0])};
    },
    async rewrite(input) {const result=await repository.rewrite(input);return {...result,version:toVersion(result.version)};},
    async diff(userId,id,from,to,mode) {
      const a=await repository.findOwnedVersion(userId,id,from),b=await repository.findOwnedVersion(userId,id,to);
      return buildDiff(a.raw_text,b.raw_text,mode);
    },
  };
}
module.exports={createResumeService};
