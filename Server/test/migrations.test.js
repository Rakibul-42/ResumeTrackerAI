const test = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { createTestPool } = require('./helpers/database');
const { runMigrations } = require('../src/db/migrate');
test('migrations are repeatable and PostgreSQL enforces identity/version/score constraints', async t => {
  const pool = await createTestPool(); t.after(() => pool.end());
  assert.deepEqual(await runMigrations(pool), ['001_initial_schema.sql','002_foreign_key_indexes.sql','003_consent.sql','004_shared_rate_limits.sql']);
  assert.deepEqual(await runMigrations(pool), []);
  const u = randomUUID(), r = randomUUID(), v = randomUUID();
  await pool.query('insert into users (id,name,email,password_hash) values ($1,$2,$3,$4)', [u,'Ada','ada@test.com','hash']);
  await assert.rejects(pool.query('insert into users (id,name,email,password_hash) values ($1,$2,$3,$4)', [randomUUID(),'Other','ADA@test.com','hash']), { code: '23505' });
  await pool.query('insert into resumes(id,user_id,title,source_filename) values ($1,$2,$3,$4)', [r,u,'Resume','r.pdf']);
  await pool.query("insert into resume_versions(id,resume_id,version_number,source_type,raw_text,parsed_sections) values ($1,$2,1,'upload','text','{}')", [v,r]);
  await assert.rejects(pool.query('update resume_versions set latest_score=101 where id=$1', [v]), { code: '23514' });
  await pool.query('update resumes set current_version_id=$1 where id=$2', [v,r]);
  await pool.query('delete from resumes where id=$1', [r]);
  assert.equal((await pool.query('select * from resume_versions')).rows.length, 0);
});
