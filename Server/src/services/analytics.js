const {iso,toEvent}=require('../domain/serialize');
const last=rows=>rows.at(-1);
const delta=(current,previous)=>current==null || previous==null?null:current-previous;
function frequency(analyses,field,keyName) {
  const counts=new Map();
  for(const analysis of analyses) {
    const seen=new Set();
    for(const entry of analysis[field]) {
      const label=typeof entry==='string'?entry.trim():entry.title.trim();
      const key=label.toLowerCase();
      if(!key || seen.has(key)) continue;
      seen.add(key);
      const row=counts.get(key) || {[keyName]:label,...(typeof entry==='object'?{severity:entry.severity}:{}),count:0};
      row.count++;counts.set(key,row);
    }
  }
  return [...counts.values()].sort((a,b)=>b.count-a.count || a[keyName].localeCompare(b[keyName])).slice(0,10);
}
function createAnalyticsService(repository) {
  return {
    async dashboard(userId) {
      const {resumes,versions,analyses,events}=await repository.snapshot(userId);
      const latest=resumes[0];
      const stack=versions.filter(v=>v.resume_id===latest?.id).sort((a,b)=>a.version_number-b.version_number);
      const history=analyses.filter(a=>a.resume_id===latest?.id);
      const current=last(history.filter(a=>a.version_id===latest?.current_version_id));
      const previous=current?history[history.indexOf(current)-1]:null;
      return {
        totals:{resumes:resumes.length,rewrites:events.filter(e=>e.type==='rewrite').reduce((sum,e)=>sum+(e.metadata.appliedCount || 0),0),analyses:analyses.length},
        latestResume:latest?{_id:latest.id,title:latest.title}:null,
        scoreSeries:stack.filter(v=>v.latest_score!=null).map(v=>({label:`V${v.version_number}`,score:v.latest_score})),
        versionStack:stack.map(v=>({id:v.id,label:`V${v.version_number}`,title:v.source_type==='upload'?'Upload':'Rewrite pass',score:v.latest_score})),
        kpi:{
          atsScore:{value:current?.ats_score ?? null,delta:delta(current?.ats_score,previous?.ats_score),spark:history.map(a=>({v:a.ats_score}))},
          versions:{value:versions.length,spark:versions.map((_,i)=>({v:i+1}))},
          issuesIdentified:{value:current?.issues.length ?? 0,delta:delta(current?.issues.length,previous?.issues.length),spark:history.map(a=>({v:a.issues.length}))},
          keywordsMatched:{value:current?.keywords_present.length ?? 0,total:current?current.keywords_present.length+current.keywords_missing.length:0,delta:delta(current?.keywords_present.length,previous?.keywords_present.length),spark:history.map(a=>({v:a.keywords_present.length}))},
        },
        activity:events.slice(0,20).map(toEvent),
      };
    },
    async insights(userId) {
      const {resumes,analyses}=await repository.snapshot(userId);
      const best=analyses.reduce((a,b)=>!a || b.ats_score>a.ats_score?b:a,null);
      return {
        averageScore:analyses.length?Math.round(analyses.reduce((s,a)=>s+a.ats_score,0)/analyses.length):null,
        bestScore:best?{value:best.ats_score,resumeId:best.resume_id,resumeTitle:best.resume_title}:null,
        totalAnalyses:analyses.length,
        scoreTrend:analyses.map(a=>({score:a.ats_score,at:iso(a.created_at),resumeTitle:a.resume_title})),
        topIssues:frequency(analyses,'issues','title'),
        topMissingKeywords:frequency(analyses,'keywords_missing','keyword'),
        topPresentKeywords:frequency(analyses,'keywords_present','keyword'),
        resumePerformance:resumes.map(r=>{
          const rows=analyses.filter(a=>a.resume_id===r.id);
          return {resumeId:r.id,title:r.title,latestScore:last(rows)?.ats_score ?? null,bestScore:rows.length?Math.max(...rows.map(a=>a.ats_score)):null,improvement:rows.length?last(rows).ats_score-rows[0].ats_score:null,analysesCount:rows.length};
        }),
      };
    },
    async versions(userId) {
      const {versions}=await repository.snapshot(userId);
      return {totals:{all:versions.length,uploads:versions.filter(v=>v.source_type==='upload').length,rewrites:versions.filter(v=>v.source_type==='rewrite').length},
        versions:versions.reverse().map(v=>({id:v.id,label:`V${v.version_number}`,resumeId:v.resume_id,resumeTitle:v.resume_title,sourceType:v.source_type,score:v.latest_score,createdAt:iso(v.created_at)}))};
    },
    async history(userId) {
      const {events}=await repository.snapshot(userId);
      return {totals:{all:events.length,upload:events.filter(e=>e.type==='upload').length,analyze:events.filter(e=>e.type==='analyze').length,rewrite:events.filter(e=>e.type==='rewrite').length},events:events.map(toEvent)};
    },
  };
}
module.exports={createAnalyticsService};
