const { z } = require('zod');
const { zodToJsonSchema } = require('zod-to-json-schema');
const text = z.string().max(15000);
const list = item => z.array(item).max(150).default([]);
const blank = text.default('');
const hasText=value=>typeof value==='string'?Boolean(value.trim()):value && typeof value==='object'?Object.values(value).some(hasText):false;
const link = z.object({label:blank,url:z.string().max(2000).refine(v=>!v || /^(https?:\/\/|mailto:)/i.test(v),'Only HTTP, HTTPS and mail links are allowed.').default('')});
const parsedSectionsSchema = z.object({
  basics:z.object({name:blank,title:blank,email:blank,phone:blank,location:blank,links:list(link)}).default({}),
  summary:blank,
  experience:list(z.object({role:blank,company:blank,location:blank,period:blank,bullets:list(text)})),
  education:list(z.object({degree:blank,school:blank,location:blank,period:blank,details:blank})),
  skills:list(text),
  projects:list(z.object({name:blank,tech:list(text),summary:blank,links:list(link)})),
  certifications:list(z.object({name:blank,issuer:blank,year:z.union([z.string().max(30),z.number().int()]).nullable().optional()})),
  languages:list(text), interests:list(text),
}).refine(hasText,'The parsed resume must contain some text.');
const score=z.number().int().min(0).max(25);
const rewriteSchema=z.object({section:z.enum(['experience','summary','projects']),original:text.min(1),rewritten:text.min(1),rationale:text});
const analysisBase=z.object({
  atsScore:z.number().int().min(0).max(100),summary:text.min(1),
  scoreBreakdown:z.object({keywords:score,formatting:score,impact:score,clarity:score}),
  issues:list(z.object({title:text,severity:z.enum(['high','medium','low']),fix:text})),
  strengths:list(z.object({title:text,note:text})),keywordsPresent:list(text),keywordsMissing:list(text),
  bulletRewrites:z.array(rewriteSchema).max(30).default([]),
});
const analysisResultSchema=analysisBase.refine(v=>Object.values(v.scoreBreakdown).reduce((s,x)=>s+x,0)===v.atsScore,'Breakdown must sum to ATS score');
function jsonSchema(s) { const schema=zodToJsonSchema(s,{$refStrategy:'none'}); delete schema.$schema; return schema; }
module.exports={parsedSectionsSchema,analysisResultSchema,parsedSectionsJsonSchema:jsonSchema(parsedSectionsSchema),analysisJsonSchema:jsonSchema(analysisBase)};
