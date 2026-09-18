const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFile}=require('node:fs/promises');
const path=require('node:path');
const {extractPdfText}=require('../src/services/pdf');
test('real PDF worker extracts a text-based resume and rejects corrupt bytes',async()=>{
  const pdf=await readFile(path.join(__dirname,'fixtures','resume.pdf'));
  const text=await extractPdfText(pdf);
  assert.match(text,/Ada Lovelace/);assert.match(text,/Worked on reliable APIs/);
  await assert.rejects(extractPdfText(Buffer.from('%PDF-corrupt')),e=>e.status===400 && e.code==='INVALID_PDF');
});
