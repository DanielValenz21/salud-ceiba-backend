export const errorHandler = (err, req, res, _next) => {
  console.error(err);
  if (err?.isJoi) {
    return res.status(400).json({ error: 'BadRequest', message: err.message });
  }
  const status = err.status || 500;
  const code   = err.code   || 'InternalError';
  res.status(status).json({ error: code, message: err.message });
}; 