import db from '../utils/db.js';

export const fetchIssues = async ({ tabla, tipo, desde, hasta, limit }) => {
  const where = [];
  const params = [];

  if (tabla) { where.push('tabla = ?'); params.push(tabla); }
  if (tipo)  { where.push('tipo  = ?'); params.push(tipo); }
  if (desde) { where.push('detectado_en >= ?'); params.push(desde); }
  if (hasta) { where.push('detectado_en <= ?'); params.push(hasta); }

  const whereSQL = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const [[{ total }]] = await db.execute(
    `SELECT COUNT(*) AS total FROM vw_quality_issues ${whereSQL}`, params
  );

  const [rows] = await db.execute(
    `SELECT * FROM vw_quality_issues
       ${whereSQL}
       ORDER BY detectado_en DESC
       LIMIT ?`,
    [...params, limit]
  );

  return { total, rows };
};
