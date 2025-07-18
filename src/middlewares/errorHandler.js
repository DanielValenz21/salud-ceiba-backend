export const errorHandler = (err, req, res, _next) => {
  console.error(err);
  const status = err.status || 500;
  const code   = err.code   || 'InternalError';
  res.status(status).json({ error: code, message: err.message });
}; 