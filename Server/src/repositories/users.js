const { randomUUID } = require('node:crypto');
function createUserRepository(pool) {
  const one = async (sql, params) => (await pool.query(sql, params)).rows[0];
  return {
    findByEmail: email => one('SELECT * FROM users WHERE lower(email)=lower($1)', [email]),
    findById: id => one('SELECT * FROM users WHERE id=$1', [id]),
    insert: ({name,email,passwordHash,termsVersion=null}) => one('INSERT INTO users(id,name,email,password_hash,terms_version,terms_accepted_at) VALUES ($1,$2,$3,$4,$5,CASE WHEN $5::varchar IS NULL THEN NULL ELSE now() END) RETURNING *', [randomUUID(),name,email,passwordHash,termsVersion]),
    updateName: (id,name) => one('UPDATE users SET name=$2,updated_at=now() WHERE id=$1 RETURNING *',[id,name]),
    updatePassword: (id,hash,oldHash) => one('UPDATE users SET password_hash=$2,session_version=session_version+1,updated_at=now() WHERE id=$1 AND password_hash=$3 RETURNING *',[id,hash,oldHash]),
    revoke: id => pool.query('UPDATE users SET session_version=session_version+1 WHERE id=$1',[id]),
  };
}
module.exports = { createUserRepository };
