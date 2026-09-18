const { parsedSectionsSchema, analysisResultSchema } = require('./schemas');
const iso = date => new Date(date).toISOString();
function toResume(r) {return {_id:r.id,title:r.title,createdAt:iso(r.created_at),updatedAt:iso(r.updated_at),currentVersionId:r.current_version_id};}
function toVersion(v) {return {_id:v.id,label:`V${v.version_number}`,sourceType:v.source_type,createdAt:iso(v.created_at),score:v.latest_score,rawText:v.raw_text,parsedSections:parsedSectionsSchema.parse(v.parsed_sections)};}
function toAnalysis(a) {
  const values={atsScore:a.ats_score,summary:a.summary,scoreBreakdown:a.score_breakdown,issues:a.issues,strengths:a.strengths,keywordsPresent:a.keywords_present,keywordsMissing:a.keywords_missing,bulletRewrites:a.bullet_rewrites};
  analysisResultSchema.parse(values);
  return {...values,_id:a.id,versionId:a.version_id,model:a.model,targetRole:a.target_role,createdAt:iso(a.created_at)};
}
function toEvent(e) {return {id:e.id,type:e.type,title:e.title,subtitle:e.subtitle,label:e.label,at:iso(e.occurred_at),resumeId:e.resume_id};}
module.exports={toResume,toVersion,toAnalysis,toEvent,iso};
