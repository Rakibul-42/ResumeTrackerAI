const {withTransaction}=require('../db/transaction');
function createAnalyticsRepository(pool) {
  return {
    // One consistent, user-scoped snapshot. Never load resume text into analytics.
    snapshot: userId=>withTransaction(pool,async db=>{
      await db.query('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY');
      const resumes=(await db.query('SELECT id,title,current_version_id,created_at,updated_at FROM resumes WHERE user_id=$1 ORDER BY updated_at DESC,id',[userId])).rows;
      const versions=(await db.query(`SELECT v.id,v.resume_id,v.version_number,v.source_type,v.latest_score,v.created_at,r.title AS resume_title
        FROM resume_versions v JOIN resumes r ON r.id=v.resume_id WHERE r.user_id=$1 ORDER BY v.created_at,v.version_number,v.id`,[userId])).rows;
      const analyses=(await db.query(`SELECT a.id,a.version_id,a.ats_score,a.issues,a.keywords_present,a.keywords_missing,a.created_at,v.resume_id,r.title AS resume_title
        FROM analyses a JOIN resume_versions v ON v.id=a.version_id JOIN resumes r ON r.id=v.resume_id WHERE r.user_id=$1 ORDER BY a.created_at,a.id`,[userId])).rows;
      const events=(await db.query('SELECT * FROM activity_events WHERE user_id=$1 ORDER BY occurred_at DESC,id',[userId])).rows;
      return {resumes,versions,analyses,events};
    }),
  };
}
module.exports={createAnalyticsRepository};
