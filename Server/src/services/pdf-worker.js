const { PDFParse } = require('pdf-parse');
async function parse(buffer) {
  // A dedicated ArrayBuffer is transferable, unlike pooled Node Buffer storage.
  const parser = new PDFParse({data:Uint8Array.from(buffer),isEvalSupported:false,stopAtErrors:true});
  let response;
  try {
    const result=await parser.getText();
    response={text:result.pages.map(page=>page.text).join('\n')};
  } catch {
    response={error:true};
  } finally {
    await parser.destroy();
  }
  process.send(response,()=>process.disconnect());
}
process.once('message',buffer=>parse(buffer).catch(()=>{
  if(process.connected) process.send({error:true},()=>process.disconnect());
}));
