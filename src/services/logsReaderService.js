import db from '../utils/db.js';

export const fetchLogs = async ({
  accion, user_id, recurso, desde, hasta, page, limit
}) => {
  const where = [];
  const params = [];

  if (accion)   { where.push('accion = ?');       params.push(accion); }
  if (user_id)  { where.push('user_id = ?');      params.push(user_id); }
  if (recurso)  { where.push('recurso LIKE ?');   params.push(`%${recurso}%`); }
  if (desde)    { where.push('creado_en >= ?');   params.push(desde); }
  if (hasta)    { where.push('creado_en <= ?');   params.push(hasta); }

  const whereSQL = where.length ? 'WHERE ' + where.join(' AND ') : '';

  const [[{ total }]] = await db.execute(
    `SELECT COUNT(*) AS total FROM logs ${whereSQL}`, params
  );

  const offset = (page - 1) * limit;
  const [rows] = await db.execute(
    `SELECT * FROM logs
       ${whereSQL}
       ORDER BY creado_en DESC
       LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  return { total, rows };
};
