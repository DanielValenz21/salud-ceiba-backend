import * as metasSvc from '../services/metasService.js';
import { updateMetricsForMeta } from '../jobs/coverageJobs.js';

export const getMetas = async (req, res, next) => {
  try {
    const metas = await metasSvc.fetchMetas(req.query);
    return res.status(200).json(metas);
  } catch (err) {
    return next(err);
  }
};

export const upsertMetas = async (req, res, next) => {
  try {
    const payload = Array.isArray(req.body) ? req.body : [req.body];

    const { inserted, updated, unchanged } = await metasSvc.upsertMetas(
      payload,
      req.user.user_id
    );

    [...inserted, ...updated].forEach(metaId => updateMetricsForMeta(metaId));

    const code = inserted.length && !updated.length ? 201 : 200;
    return res.status(code).json({ inserted, updated, unchanged });
  } catch (err) {
    return next(err);
  }
};
