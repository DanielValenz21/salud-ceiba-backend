import { pool } from '../config/db.js';

/* ► Todos los territorios ordenados */
export const listTerritorios = async () => {
  const [rows] = await pool.execute(
    'SELECT territorio_id,codigo,nombre FROM territorios ORDER BY territorio_id'
  );
  return rows;
};

/* ► Sectores de un territorio (+ opcional stats) */
/* ► Sectores de un territorio (+ opcional stats) */
export const listSectoresByTerritorio = async ({ territorioId, includeStats }) => {
  if (!includeStats) {
    const [rows] = await pool.execute(
      `SELECT sector_id,nombre,referencia_lat,referencia_lng
         FROM sectores
        WHERE territorio_id=? AND activo=1
        ORDER BY sector_id`,
      [territorioId]
    );
    return rows;
  }

  const [rows] = await pool.execute(
    `SELECT s.sector_id,s.nombre,s.referencia_lat,s.referencia_lng,
            COUNT(v.vivienda_id)                       AS viviendas,
            (SELECT cobertura_pct
               FROM dashboard_coberturas dc
              WHERE dc.sector_id=s.sector_id
              ORDER BY periodo DESC LIMIT 1)          AS hb_coverage
       FROM sectores s
       LEFT JOIN viviendas v
              ON v.sector_id=s.sector_id
             AND v.activo=1
      WHERE s.territorio_id=? AND s.activo=1
      GROUP BY s.sector_id
      ORDER BY s.sector_id`,
    [territorioId]
  );
  return rows;
};

export const createTerritorio = async ({ codigo, nombre }) => {
  // validar duplicado por codigo
  const [[dup]] = await pool.execute(
    'SELECT territorio_id FROM territorios WHERE codigo = ?',
    [codigo]
  );
  if (dup) {
    const err = new Error('Código de territorio ya existe');
    err.status = 409; err.code = 'Conflict';
    throw err;
  }

  const [res] = await pool.execute(
    'INSERT INTO territorios (codigo, nombre) VALUES (?, ?)',
    [codigo, nombre]
  );
  return { territorio_id: res.insertId, codigo, nombre };
};

export const updateTerritorio = async (id, { codigo, nombre }) => {
  const fields = []; const params = [];
  if (codigo) {
    // check duplicado de otro territorio
    const [[dup]] = await pool.execute(
      'SELECT territorio_id FROM territorios WHERE codigo = ? AND territorio_id <> ?',
      [codigo, id]
    );
    if (dup) {
      const err = new Error('Código de territorio ya existe');
      err.status = 409; err.code = 'Conflict';
      throw err;
    }
    fields.push('codigo=?'); params.push(codigo);
  }
  if (nombre) { fields.push('nombre=?'); params.push(nombre); }

  if (!fields.length) return;

  params.push(id);
  await pool.execute(`UPDATE territorios SET ${fields.join(', ')} WHERE territorio_id=?`, params);

  const [[row]] = await pool.execute(
    'SELECT territorio_id, codigo, nombre FROM territorios WHERE territorio_id=?',
    [id]
  );
  return row;
};