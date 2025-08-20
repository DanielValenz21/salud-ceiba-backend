import { fetchLogs } from '../services/logsReaderService.js';

export const listLogs = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const { total, rows } = await fetchLogs(req.query);
    res.json({ meta: { page, limit, total }, data: rows });
  } catch (err) {
    next(err);
  }
};
