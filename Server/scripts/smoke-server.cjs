// Explicit test harness only: no .env, external database, or Gemini calls.
const {randomUUID}=require('node:crypto');
const {createTestPool}=require('../test/helpers/database');
const {sections,analysis}=require('../test/helpers/fixtures');
const {runMigrations}=require('../src/db/migrate');
const {createApp}=require('../src/app');
const {loadConfig}=require('../src/config');
async function main() {
  const port=Number(process.env.TEST_API_PORT || 8000);
  const pool=await createTestPool();
  await runMigrations(pool);
  const app=createApp({pool,config:loadConfig({NODE_ENV:'test',PORT:String(port),CLIENT_ORIGIN:process.env.TEST_CLIENT_ORIGIN || 'http://localhost:5173',POSTGRES_URL:'postgres://unused@localhost/test',GEMINI_API_KEY:'test-only',JWT_SECRET:randomUUID()+randomUUID()}),overrides:{rateLimits:{authLimit:100,aiLimit:100},gemini:{
    parseResume:async()=>structuredClone(sections),
    analyzeResume:async()=>({...structuredClone(analysis),model:'TEST FIXTURE — not Gemini',bulletRewrites:analysis.bulletRewrites.map(r=>({...r,_id:randomUUID()}))}),
  }}});
  const server=app.listen(port,'127.0.0.1',()=>console.log(`TEST-ONLY backend at http://127.0.0.1:${port}; in-memory database and fixed AI fixtures. Enter q to stop.`));
  server.on('error',async()=>{console.error(`Test port ${port} is unavailable.`);await pool.end();process.exit(1);});
  const stop=()=>server.close(async()=>{await pool.end();process.exit(0);});
  for(const signal of ['SIGTERM','SIGINT']) process.on(signal,stop);
  process.stdin.on('data',data=>{if(data.toString().trim()==='q') stop();});
  setTimeout(stop,30*60*1000).unref();
}
main().catch(()=>{console.error('Test backend startup failed.');process.exitCode=1;});
