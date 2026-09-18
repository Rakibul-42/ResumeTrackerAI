const sections = {
  basics:{name:'Ada Lovelace',title:'Engineer',email:'ada@example.com',phone:'',location:'London',links:[]},
  summary:'Engineer building reliable software.',
  experience:[{role:'Engineer',company:'Acme',period:'2020–Present',bullets:['Worked on reliable APIs.','Kept the service running.']}],
  education:[],skills:['JavaScript','PostgreSQL'],projects:[],certifications:[],languages:[],interests:[],
};
const analysis = {
  atsScore:72,summary:'Clear experience; strengthen verbs.',scoreBreakdown:{keywords:18,formatting:18,impact:18,clarity:18},
  issues:[{title:'Weak verbs',severity:'medium',fix:'Describe your contribution.'}],strengths:[{title:'Relevant skills',note:'JavaScript and SQL.'}],
  keywordsPresent:['JavaScript'],keywordsMissing:['Testing'],
  bulletRewrites:[{section:'experience',original:'Worked on reliable APIs.',rewritten:'Developed reliable APIs.',rationale:'Use a direct action verb.'}],
};
module.exports = { sections, analysis };
