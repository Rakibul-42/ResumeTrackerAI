class AppError extends Error {
  constructor(status, code, message, details) {
    super(message); this.status = status; this.code = code; this.details = details;
  }
}
function toErrorBody(error) {
  if (!(error instanceof AppError)) return { error: { code: 'INTERNAL_ERROR', message: 'Something went wrong. Please try again.' } };
  return { error: { code: error.code, message: error.message, ...(error.details ? { details: error.details } : {}) } };
}
function mapDatabaseError(error) {
  if (error.code === '23505') return new AppError(409, 'CONFLICT', 'This record already exists.');
  if (error.code === '23503') return new AppError(409, 'CONFLICT', 'The related record no longer exists.');
  if (/^08/.test(error.code || '') || ['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND', '57P01'].includes(error.code)) {
    return new AppError(503, 'DATABASE_UNAVAILABLE', 'Database unavailable. Please try again shortly.');
  }
  return error;
}
module.exports = { AppError, toErrorBody, mapDatabaseError };
