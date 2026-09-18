const {test}=require('node:test');
const assert=require('node:assert/strict');
const {parsedSectionsSchema}=require('../src/domain/schemas');
test('parsed sections preserve every optional field used by PDF export',()=>{
  const input={basics:{name:'Ada'},experience:[{role:'Engineer',location:'Remote',bullets:['Built APIs']}],education:[{school:'University',location:'London',details:'Honours'}],projects:[{name:'API',links:[{label:'Demo',url:'https://example.com'}]}],certifications:[{name:'Certificate',issuer:'Example',year:2025}]};
  const result=parsedSectionsSchema.parse(input);
  assert.equal(result.experience[0].location,'Remote');assert.equal(result.education[0].details,'Honours');
  assert.equal(result.projects[0].links[0].url,'https://example.com');assert.equal(result.certifications[0].issuer,'Example');
});
test('empty extraction and unsafe export links are rejected',()=>{
  assert.equal(parsedSectionsSchema.safeParse({}).success,false);
  assert.equal(parsedSectionsSchema.safeParse({basics:{name:'Ada',links:[{url:'javascript:alert(1)'}]}}).success,false);
});
