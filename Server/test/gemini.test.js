const test = require('node:test');
const assert = require('node:assert/strict');
const { createGeminiService } = require('../src/services/gemini');
const { extractPdfText } = require('../src/services/pdf');
const { sections, analysis } = require('./helpers/fixtures');
test('PDF extraction validates bytes and rejects unreadable, empty or oversized text', async () => {
  await assert.rejects(extractPdfText(Buffer.from('not PDF')), {code:'INVALID_PDF'});
  await assert.rejects(extractPdfText(Buffer.from('%PDF-test'),{parsePdf:async()=>({text:''})}),{code:'INVALID_PDF'});
  assert.equal(await extractPdfText(Buffer.from('%PDF-test'),{parsePdf:async()=>({text:'  Resume text  '})}),'Resume text');
  await assert.rejects(extractPdfText(Buffer.from('%PDF-test'),{parsePdf:async()=>{throw new Error('private parser error');}}),e=>!e.message.includes('private'));
});
test('Gemini structured output is validated and rewrite IDs are assigned by server', async () => {
  const calls=[];
  const service=createGeminiService({model:'test-model',generateContent:async args=>{calls.push(args);return {text:JSON.stringify(calls.length===1?sections:analysis)};}});
  assert.equal((await service.parseResume('resume text')).basics.name,'Ada Lovelace');
  const result=await service.analyzeResume({rawText:'resume text',parsedSections:sections,targetRole:'Engineer'});
  assert.equal(result.model,'test-model');
  assert.match(result.bulletRewrites[0]._id,/^[\da-f-]{36}$/);
  assert.equal(calls[0].config.responseMimeType,'application/json');
  assert.ok(calls[0].config.responseJsonSchema.properties);
  const parsing=JSON.parse(calls[0].contents);
  const scoring=JSON.parse(calls[1].contents);
  assert.equal(parsing.resumeText,'resume text');
  assert.equal(scoring.resumeText,undefined,'analysis must not send raw text a second time');
  assert.deepEqual(scoring.parsedSections,sections,'all structured facts must be preserved');
  assert.equal(scoring.targetRole,'Engineer');
});
test('Gemini rejects invalid JSON and scores, retries only transient failures', async () => {
  const empty=createGeminiService({model:'test',generateContent:async()=>({text:'{}'})});
  await assert.rejects(empty.parseResume('resume text'),{code:'AI_INVALID_RESPONSE'});
  for(const payload of ['invalid',JSON.stringify({...analysis,atsScore:99})]) {
    const service=createGeminiService({model:'test',generateContent:async()=>({text:payload})});
    await assert.rejects(service.analyzeResume({rawText:'r',parsedSections:sections}),{code:'AI_INVALID_RESPONSE'});
  }
  let attempts=0;
  const service=createGeminiService({model:'test',retryDelayMs:0,generateContent:async()=>{if(++attempts===1) throw Object.assign(new Error('secret'),{status:503});return {text:JSON.stringify(sections)};}});
  assert.equal((await service.parseResume('r')).basics.name,'Ada Lovelace'); assert.equal(attempts,2);
});
test('Gemini requests time out and sanitize upstream errors', async () => {
  const service=createGeminiService({model:'test',timeoutMs:10,generateContent:()=>new Promise(()=>{})});
  await assert.rejects(service.parseResume('r'),{code:'AI_UPSTREAM_ERROR'});
  const rejected=createGeminiService({model:'test',generateContent:async()=>{throw Object.assign(new Error('SECRET_KEY'),{status:400});}});
  await assert.rejects(rejected.parseResume('r'),e=>!e.message.includes('SECRET_KEY'));
});
