const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { AppError } = require('../errors');
const toPublicUser = row => ({ _id:row.id, name:row.name, email:row.email, createdAt:new Date(row.created_at).toISOString() });
function createAuthService({ users, config }) {
  // Same bcrypt workload for unknown accounts to reduce account enumeration.
  const dummyHash = bcrypt.hash('unusable-random-account-password',12);
  const invalid = () => new AppError(401,'INVALID_CREDENTIALS','Email or password is incorrect.');
  return {
    async register({name,email,password,termsVersion}) {
      try { return await users.insert({name,email,passwordHash:await bcrypt.hash(password,12),termsVersion}); }
      catch(e) { if(e.code==='23505') throw new AppError(409,'EMAIL_EXISTS','An account with this email already exists.'); throw e; }
    },
    async login({email,password}) {
      const user = await users.findByEmail(email);
      const matches = await bcrypt.compare(password,user?.password_hash || await dummyHash);
      if(!user || !matches) throw invalid();
      return user;
    },
    async authenticate(token) {
      let claims;
      try { claims = jwt.verify(token,config.jwtSecret,{algorithms:['HS256'],issuer:'resume-tracker'}); }
      catch { throw new AppError(401,'UNAUTHENTICATED','Please sign in.'); }
      if (typeof claims.sub !== 'string' || !/^[0-9a-f-]{36}$/i.test(claims.sub)) throw invalid();
      const user = await users.findById(claims.sub);
      if(!user || user.session_version !== claims.sv) throw new AppError(401,'UNAUTHENTICATED','Your session expired. Please sign in.');
      return user;
    },
    signSession: user => jwt.sign({sv:user.session_version},config.jwtSecret,{subject:user.id,expiresIn:config.jwtExpiresIn,algorithm:'HS256',issuer:'resume-tracker'}),
    updateProfile: (id,name) => users.updateName(id,name),
    async changePassword(user,currentPassword,newPassword) {
      if(!await bcrypt.compare(currentPassword,user.password_hash)) throw new AppError(401,'INVALID_PASSWORD','Current password is incorrect.');
      const updated = await users.updatePassword(user.id,await bcrypt.hash(newPassword,12),user.password_hash);
      if (!updated) throw new AppError(409,'CONFLICT','Password was already changed. Please sign in again.');
      return updated;
    },
    revoke: id => users.revoke(id),
  };
}
module.exports = { createAuthService, toPublicUser };
