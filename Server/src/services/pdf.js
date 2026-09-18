const path = require('node:path');
const { fork } = require('node:child_process');
const { AppError } = require('../errors');
function parseInWorker(buffer) {
  return new Promise((resolve,reject)=>{
    // Process isolation also contains native PDF/canvas crashes on Windows.
    const worker=fork(path.join(__dirname,'pdf-worker.js'),[],{
      execArgv:['--max-old-space-size=128'],serialization:'advanced',
      stdio:['ignore','ignore','ignore','ipc'],windowsHide:true,
    });
    let settled=false;
    const timer=setTimeout(()=>{settled=true;worker.kill();reject(new Error('PDF parse timeout'));},15000);
    worker.once('message',result=>{settled=true;clearTimeout(timer);result.error?reject(new Error('Unreadable PDF')):resolve(result);});
    worker.once('error',error=>{settled=true;clearTimeout(timer);worker.kill();reject(error);});
    worker.once('exit',()=>{clearTimeout(timer);if(!settled) reject(new Error('PDF parser exited'));});
    worker.send(buffer);
  });
}
async function extractPdfText(buffer,{parsePdf=parseInWorker}={}) {
  const invalid=()=>new AppError(400,'INVALID_PDF','Upload a readable text PDF. Scanned, encrypted or damaged PDFs are not supported.');
  if(!Buffer.isBuffer(buffer) || buffer.length>5*1024*1024 || buffer.subarray(0,5).toString()!=='%PDF-') throw invalid();
  try {
    const result=await parsePdf(buffer);
    const text=(result.text || '').replace(/\u0000/g,'').trim();
    if(!text || text.length>200000) throw invalid();
    return text;
  } catch { throw invalid(); }
}
module.exports={extractPdfText};
