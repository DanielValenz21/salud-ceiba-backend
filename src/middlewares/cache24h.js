export const cache24h = (_req, res, next) => {
  res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate');
  next();
}; 