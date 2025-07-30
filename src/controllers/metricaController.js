import { fetchMetricas, bulkUpsert } from '../models/metricaModel.js';

/* ------- GET /metricas ------- */
export async function listMetricas(req, res, next) {
  try {
    const { page, limit, ...rest } = req.validatedQuery;
    /* Convierte YYYY-MM a { anio, mes } */
    const toYM = s => s && { anio: parseInt(s.split('-')[0],10), mes: parseInt(s.split('-')[1],10) };
    const { total, rows } = await fetchMetricas({
      filters: {
        ...rest,
        periodo_desde: toYM(rest.periodo_desde),
        periodo_hasta: toYM(rest.periodo_hasta),
      },
      page,
      limit,
    });
    res.json({ meta: { page, limit, total }, data: rows });
  } catch (err) {
    next(err);
  }
}

/* ------- PUT /metricas ------- */
export async function bulkUpsertMetricas(req, res, next) {
  try {
    const rowsProcessed = await bulkUpsert(req.validatedBody);
    res.json({ message: 'Carga de métricas completada', rows_processed: rowsProcessed });
  } catch (err) {
    next(err);
  }
}
