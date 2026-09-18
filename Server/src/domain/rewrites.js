const { AppError } = require('../errors');
function applyRewrites(sections,suggestions) {
  const copy=structuredClone(sections);
  const selected=new Map();
  for(const suggestion of suggestions) {
    const key=`${suggestion.section}:${suggestion.original}`;
    if(selected.has(key)) throw new AppError(400,'CONFLICTING_REWRITES','Select only one suggestion for each original passage.');
    selected.set(key,suggestion);
  }
  const matchedIds=new Set();
  const replace=(section,text)=>{
    const suggestion=selected.get(`${section}:${text}`);
    if(!suggestion) return text;
    matchedIds.add(suggestion._id); return suggestion.rewritten;
  };
  copy.summary=replace('summary',copy.summary);
  for(const job of copy.experience || []) job.bullets=job.bullets.map(b=>replace('experience',b));
  for(const project of copy.projects || []) project.summary=replace('projects',project.summary);
  if(matchedIds.size!==suggestions.length) throw new AppError(409,'REWRITE_MISMATCH','A suggestion does not match this resume. Run a fresh analysis.');
  return {parsedSections:copy,matchedIds};
}
function sectionsToText(sections) {
  const lines=[];
  function visit(value) {
    if(typeof value==='string' || typeof value==='number') { if(String(value).trim()) lines.push(String(value)); }
    else if(Array.isArray(value)) value.forEach(visit);
    else if(value && typeof value==='object') Object.values(value).forEach(visit);
  }
  visit(sections);return lines.join('\n');
}
module.exports={applyRewrites,sectionsToText};
