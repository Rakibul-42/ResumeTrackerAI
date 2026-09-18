const { ZodError } = require('zod');
const { AppError, toErrorBody, mapDatabaseError } = require('../errors');
function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  if (error instanceof ZodError) error = new AppError(400, 'VALIDATION_ERROR', 'Please check the submitted fields.', error.issues.map(i => ({ field: i.path.join('.'), message: i.message })));
  else if (error.type === 'entity.parse.failed') error = new AppError(400, 'INVALID_JSON', 'Invalid JSON request.');
  else if (error.type === 'entity.too.large' || error.code === 'LIMIT_FILE_SIZE') error = new AppError(413, 'FILE_TOO_LARGE', 'Upload a PDF no larger than 5 MB.');
  else if (error.name === 'MulterError') error = new AppError(400, 'INVALID_UPLOAD', 'Send one PDF file and an optional title.');
  else error = mapDatabaseError(error);
  if (!(error instanceof AppError)) console.error(`Request ${req.requestId}: internal error (${error.name || 'Error'})`);
  res.status(error instanceof AppError ? error.status : 500).json(toErrorBody(error));
}
module.exports = { errorHandler };
