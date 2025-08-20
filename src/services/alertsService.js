import db from '../utils/db.js';

export const fetchAlerts = async ({ tipo, territorio, activa, limit }) => {
  const where = [];
  const params = [];

  if (tipo)       { where.push('tipo = ?');          params.push(tipo); }
  if (territorio) { where.push('territorio_id = ?'); params.push(territorio); }
  if (activa)     { where.push('vigente_hasta IS NULL'); }

  const whereSQL = where.length ? 'WHERE ' + where.join(' AND ') : '';

  const [rows] = await db.execute(
    `SELECT * FROM alertas
       ${whereSQL}
       ORDER BY nivel DESC, vigente_desde DESC
       LIMIT ?`,
    [...params, limit]
  );

  return rows;
};
