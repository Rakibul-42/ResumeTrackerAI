const {test}=require('node:test');
const assert=require('node:assert/strict');
const {applyRewrites,sectionsToText}=require('../src/domain/rewrites');
const {sections}=require('./helpers/fixtures');
test('rewrites change only exact selected fields without mutating the source',()=>{
  const source={...structuredClone(sections),summary:'Original summary',projects:[{name:'Original summary',summary:'Project summary',tech:['JS']}]};
  const {parsedSections}=applyRewrites(source,[{_id:'1',section:'summary',original:'Original summary',rewritten:'Improved summary'},{_id:'2',section:'projects',original:'Project summary',rewritten:'Improved project'}]);
  assert.equal(source.summary,'Original summary');assert.equal(parsedSections.summary,'Improved summary');
  assert.equal(parsedSections.projects[0].name,'Original summary');assert.equal(parsedSections.projects[0].summary,'Improved project');
  assert.match(sectionsToText(parsedSections),/Improved project/);
});
test('unmatched and contradictory rewrites fail instead of inventing content',()=>{
  assert.throws(()=>applyRewrites(sections,[{_id:'1',section:'experience',original:'not present',rewritten:'invented'}]),{code:'REWRITE_MISMATCH'});
  const r={_id:'1',section:'summary',original:sections.summary,rewritten:'updated'};
  assert.throws(()=>applyRewrites(sections,[r,{...r,_id:'2'}]),{code:'CONFLICTING_REWRITES'});
});
