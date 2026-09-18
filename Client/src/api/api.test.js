import {test} from 'node:test';
import assert from 'node:assert/strict';
import {apiClient} from './client.js';
import {authApi} from './auth.js';
import {resumesApi} from './resumes.js';
import {analyticsApi} from './analytics.js';
import {dashboardApi} from './dashboard.js';

test('API adapters send real requests, credentials, query params, and multipart files',async()=>{
  const calls=[];
  apiClient.defaults.adapter=async config=>{calls.push(config);return {data:{ok:true},status:200,statusText:'OK',headers:{},config};};
  await authApi.login({email:'test@example.com',password:'password'});
  await authApi.register({name:'Test',email:'test@example.com',password:'password'});
  await authApi.me();await authApi.updateProfile({name:'Name'});await authApi.changePassword({currentPassword:'old',newPassword:'new'});await authApi.logout();
  await resumesApi.list();await resumesApi.get('r1');await resumesApi.getVersion('r1','v1');
  await resumesApi.upload(new File(['%PDF-test'],'resume.pdf',{type:'application/pdf'}),'Engineer',true);
  await resumesApi.analyze('r1',{versionId:'v1'});await resumesApi.analyses('r1');await resumesApi.analysisForVersion('r1','v1');
  await resumesApi.rewrite('r1',{analysisId:'a1',rewriteIds:['b1']});await resumesApi.diff('r1','v1','v2','lines');await resumesApi.remove('r1');
  await dashboardApi.get();await analyticsApi.insights();await analyticsApi.versions();await analyticsApi.history();
  assert.equal(calls.length,20);
  assert.ok(calls.every(c=>c.withCredentials && c.baseURL==='/api'));
  assert.deepEqual(JSON.parse(calls[0].data),{email:'test@example.com',password:'password'});
  assert.equal(calls[9].data.get('file').name,'resume.pdf');assert.equal(calls[9].data.get('title'),'Engineer');
  assert.equal(calls[9].headers.get('Content-Type'),false);
  assert.equal(calls[9].data.get('acknowledgeAi'),'true');
  assert.equal(calls[9].data.get('noticeVersion'),'2026-09-18');
  assert.deepEqual(calls[14].params,{from:'v1',to:'v2',mode:'lines'});
  assert.deepEqual(calls.slice(-4).map(c=>c.url),['/dashboard','/insights','/versions','/history']);
});
test('API errors expose the backend message/code and readable network failures',async()=>{
  apiClient.defaults.adapter=async()=>{throw {response:{status:502,data:{error:{message:'AI unavailable',code:'AI_UPSTREAM_ERROR'}}}};};
  await assert.rejects(authApi.me(),{message:'AI unavailable',status:502,code:'AI_UPSTREAM_ERROR'});
  apiClient.defaults.adapter=async()=>{throw new Error('Network Error');};
  await assert.rejects(authApi.me(),e=>e.message.includes('backend'));
});
