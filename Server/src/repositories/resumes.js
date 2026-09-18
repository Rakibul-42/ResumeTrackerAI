const {randomUUID}=require('node:crypto');
const {withTransaction}=require('../db/transaction');
const {AppError}=require('../errors');
const {applyRewrites,sectionsToText}=require('../domain/rewrites');
const missing=()=>new AppError(404,'NOT_FOUND','Resume or version not found.');
async function owned(db,userId,id,lock=false) {
  const r=(await db.query(`SELECT * FROM resumes WHERE id=$1 AND user_id=$2${lock?' FOR UPDATE':''}`,[id,userId])).rows[0];
  if(!r) throw missing();return r;
}
async function version(db,resumeId,id) {
  const v=(await db.query('SELECT * FROM resume_versions WHERE id=$1 AND resume_id=$2',[id,resumeId])).rows[0];
  if(!v) throw missing();return v;
}
async function event(db,{userId,resumeId,versionId,analysisId=null,type,title,subtitle='',label='',metadata={}}) {
  await db.query('INSERT INTO activity_events(id,user_id,resume_id,version_id,analysis_id,type,title,subtitle,label,metadata) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',[randomUUID(),userId,resumeId,versionId,analysisId,type,title,subtitle,label,JSON.stringify(metadata)]);
}
function createResumeRepository(pool) {
  return {
    async listOwned(userId) {
      return (await pool.query(`SELECT r.*, (SELECT count(*)::int FROM resume_versions v WHERE v.resume_id=r.id) AS version_count,
        (SELECT max(a.ats_score) FROM analyses a JOIN resume_versions v ON v.id=a.version_id WHERE v.resume_id=r.id) AS best_score
        FROM resumes r WHERE r.user_id=$1 ORDER BY r.updated_at DESC,r.id`,[userId])).rows;
    },
    async findOwnedDetail(userId,id) {
      const resume=await owned(pool,userId,id);
      const versions=(await pool.query('SELECT * FROM resume_versions WHERE resume_id=$1 ORDER BY version_number',[id])).rows;
      return {resume,versions};
    },
    async findOwnedVersion(userId,id,versionId) {await owned(pool,userId,id);return version(pool,id,versionId);},
    async deleteOwned(userId,id) {
      return withTransaction(pool,async db=>{await owned(db,userId,id,true);await db.query('DELETE FROM resumes WHERE id=$1 AND user_id=$2',[id,userId]);});
    },
    async createFromUpload({userId,title,filename,rawText,parsedSections,noticeVersion}) {
      return withTransaction(pool,async db=>{
        const id=randomUUID(),versionId=randomUUID();
        await db.query('INSERT INTO resumes(id,user_id,title,source_filename,ai_notice_version,ai_acknowledged_at) VALUES ($1,$2,$3,$4,$5,CASE WHEN $5::varchar IS NULL THEN NULL ELSE now() END)',[id,userId,title,filename,noticeVersion || null]);
        await db.query("INSERT INTO resume_versions(id,resume_id,version_number,source_type,raw_text,parsed_sections) VALUES ($1,$2,1,'upload',$3,$4)",[versionId,id,rawText,JSON.stringify(parsedSections)]);
        const resume=(await db.query('UPDATE resumes SET current_version_id=$2 WHERE id=$1 RETURNING *',[id,versionId])).rows[0];
        await event(db,{userId,resumeId:id,versionId,type:'upload',title:`Uploaded ${title}`,subtitle:'PDF parsed and saved',label:'V1'});
        return resume;
      });
    },
    async saveAnalysis({userId,resumeId,versionId,targetRole,result}) {
      return withTransaction(pool,async db=>{
        const resume=await owned(db,userId,resumeId,true);
        const v=await version(db,resumeId,versionId);
        const id=randomUUID();
        const row=(await db.query(`INSERT INTO analyses(id,version_id,target_role,ats_score,model,summary,score_breakdown,issues,strengths,keywords_present,keywords_missing,bullet_rewrites)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,[id,versionId,targetRole || null,result.atsScore,result.model,result.summary,
          JSON.stringify(result.scoreBreakdown),JSON.stringify(result.issues),JSON.stringify(result.strengths),JSON.stringify(result.keywordsPresent),JSON.stringify(result.keywordsMissing),JSON.stringify(result.bulletRewrites)])).rows[0];
        await db.query('UPDATE resume_versions SET latest_score=$2 WHERE id=$1',[versionId,result.atsScore]);
        await db.query('UPDATE resumes SET updated_at=now() WHERE id=$1',[resumeId]);
        await event(db,{userId,resumeId,versionId,analysisId:id,type:'analyze',title:`Analyzed V${v.version_number} of ${resume.title}`,subtitle:`Estimated ATS score ${result.atsScore} / 100`,label:'Analysis',metadata:{score:result.atsScore}});
        return row;
      });
    },
    async analyses(userId,id,versionId) {
      await owned(pool,userId,id);
      if(versionId) await version(pool,id,versionId);
      return (await pool.query(`SELECT a.* FROM analyses a JOIN resume_versions v ON v.id=a.version_id WHERE v.resume_id=$1${versionId?' AND v.id=$2':''} ORDER BY a.created_at DESC,a.id DESC`,versionId?[id,versionId]:[id])).rows;
    },
    async rewrite({userId,resumeId,analysisId,rewriteIds}) {
      return withTransaction(pool,async db=>{
        const resume=await owned(db,userId,resumeId,true);
        const a=(await db.query('SELECT a.* FROM analyses a JOIN resume_versions v ON v.id=a.version_id WHERE a.id=$1 AND v.resume_id=$2',[analysisId,resumeId])).rows[0];
        if(!a) throw missing();
        const parent=await version(db,resumeId,a.version_id);
        const suggestions=a.bullet_rewrites;
        const ids=rewriteIds || suggestions.map(r=>r._id);
        if(!ids.length || new Set(ids).size!==ids.length || ids.some(id=>!suggestions.some(r=>r._id===id))) throw new AppError(400,'INVALID_REWRITES','Select one or more valid rewrite suggestions.');
        const chosen=suggestions.filter(r=>ids.includes(r._id));
        const {parsedSections}=applyRewrites(parent.parsed_sections,chosen);
        const count=(await db.query('SELECT coalesce(max(version_number),0)+1 AS n FROM resume_versions WHERE resume_id=$1',[resumeId])).rows[0].n;
        const id=randomUUID();
        const created=(await db.query("INSERT INTO resume_versions(id,resume_id,parent_version_id,version_number,source_type,raw_text,parsed_sections) VALUES ($1,$2,$3,$4,'rewrite',$5,$6) RETURNING *",[id,resumeId,parent.id,count,sectionsToText(parsedSections),JSON.stringify(parsedSections)])).rows[0];
        await db.query('UPDATE resumes SET current_version_id=$2,updated_at=now() WHERE id=$1',[resumeId,id]);
        await event(db,{userId,resumeId,versionId:id,analysisId,type:'rewrite',title:`Applied ${chosen.length} rewrite(s) — created V${count}`,subtitle:resume.title,label:`V${count}`,metadata:{appliedCount:chosen.length}});
        return {version:created,appliedCount:chosen.length};
      });
    },
  };
}
module.exports={createResumeRepository};
