const {diffWordsWithSpace,diffLines}=require('diff');
function buildDiff(from,to,mode) {
  const parts=(mode==='lines'?diffLines:diffWordsWithSpace)(from,to).filter(p=>p.value).map(p=>({value:p.value,added:Boolean(p.added),removed:Boolean(p.removed)}));
  const stats={added:0,removed:0,unchanged:0};
  for(const part of parts) stats[part.added?'added':part.removed?'removed':'unchanged']+=part.value.length;
  return {parts,stats,hunks:parts.map(p=>({type:p.added?'add':p.removed?'remove':'context',text:p.value}))};
}
module.exports={buildDiff};
