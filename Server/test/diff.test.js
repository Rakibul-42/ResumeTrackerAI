const {test}=require('node:test');
const assert=require('node:assert/strict');
const {buildDiff}=require('../src/domain/diff');
test('diff payload includes the stats the frontend renders',()=>{
  const result=buildDiff('A','BB','words');
  assert.equal(result.stats.added,2);assert.equal(result.stats.removed,1);
  assert.ok(result.hunks.some(h=>h.type==='add'));
  assert.ok(result.parts.some(p=>p.added && p.value==='BB'));
  assert.deepEqual(buildDiff('same','same','words').stats,{added:0,removed:0,unchanged:4});
});
