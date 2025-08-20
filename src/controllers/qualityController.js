import { fetchIssues } from '../services/qualityService.js';

export const listQualityIssues = async (req, res, next) => {
  try {
    const { total, rows } = await fetchIssues(req.query);
    res.json({ meta: { total, limit: req.query.limit }, data: rows });
  } catch (err) {
    next(err);
  }
};
