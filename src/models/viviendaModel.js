import { pool } from '../config/db.js';

/* ► Crear vivienda ----------------------------------------------- */
export const insertVivienda = async ({ sector_id, codigo_familia, direccion, lat, lng }) => {
  try {
    const [res] = await pool.execute(
      `INSERT INTO viviendas
         (sector_id,codigo_familia,direccion,lat,lng,activo)
       VALUES (?,?,?,?,?,1)`,
      [sector_id, codigo_familia, direccion || null, lat ?? null, lng ?? null]
    );
    return res.insertId; // logs() middleware ya registra la acción
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY')
      throw Object.assign(new Error('Código de familia ya existe'), { status:409, code:'Conflict' });
    throw err;
  }
};

/* ► Obtener ficha ------------------------------------------------- */
export const getViviendaById = async (id) => {
  const [rows] = await pool.execute(
    `SELECT v.vivienda_id, v.sector_id, s.nombre AS sector_nombre,
            v.codigo_familia, v.direccion, v.lat, v.lng,
            v.created_at,
            (SELECT COUNT(*) FROM personas p WHERE p.vivienda_id=v.vivienda_id) AS personas_count
       FROM viviendas v
       JOIN sectores s USING(sector_id)
      WHERE v.vivienda_id=? AND v.activo=1`,
    [id]
  );
  return rows[0];
};

/* ► Editar vivienda ---------------------------------------------- */
export const updateVivienda = async (id, data) => {
  const current = await getViviendaById(id);
  if (!current)
    throw Object.assign(new Error('Vivienda no encontrada'), { status:404, code:'NotFound' });

  /* impedir mover si tiene personas */
  if (data.sector_id && data.sector_id !== current.sector_id) {
    const [[{ total }]] = await pool.execute(
      'SELECT COUNT(*) AS total FROM personas WHERE vivienda_id=?',
      [id]
    );
    if (total)
      throw Object.assign(
        new Error('No se puede cambiar de sector: personas activas'),
        { status:400, code:'BadRequest' }
      );
  }

  const fields = [], params = [];
  for (const [k, v] of Object.entries(data)) {
    fields.push(`${k}=?`);
    params.push(v);
  }
  if (!fields.length) return;
  params.push(id);

  try {
    await pool.execute(`UPDATE viviendas SET ${fields.join(', ')} WHERE vivienda_id=?`, params);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY')
      throw Object.assign(new Error('Código de familia ya existe'), { status:409, code:'Conflict' });
    throw err;
  }
};

/* ► Personas de la vivienda -------------------------------------- */
export const listPersonasByVivienda = async ({ viviendaId, offset, limit }) => {
  const [rows] = await pool.query(          // 👈 cambia execute → query
    `SELECT persona_id, nombres, apellidos, sexo, fecha_nac
       FROM personas
      WHERE vivienda_id = ?
      ORDER BY persona_id
      LIMIT ?, ?`,
    [viviendaId, offset, limit]
  );
  const [[{ total }]] = await pool.execute(
    'SELECT COUNT(*) AS total FROM personas WHERE vivienda_id = ?',
    [viviendaId]
  );
  return { total, rows };
};

/*  Listar viviendas con filtros y paginacion ----------------------- */
export const listViviendas = async ({ sector_id, codigo_familia, offset = 0, limit = 20 }) => {
  const where = ['v.activo=1'];
  const params = [];

  if (sector_id) {
    where.push('v.sector_id = ?');
    params.push(sector_id);
  }
  if (codigo_familia) {
    where.push('v.codigo_familia LIKE ?');
    params.push(`${codigo_familia}%`);
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const [rows] = await pool.query(
    `SELECT v.vivienda_id, v.sector_id, s.nombre AS sector_nombre,
            v.codigo_familia, v.direccion, v.lat, v.lng,
            (SELECT COUNT(*) FROM personas p WHERE p.vivienda_id=v.vivienda_id) AS personas_count
       FROM viviendas v
       JOIN sectores s USING(sector_id)
      ${whereSql}
      ORDER BY v.vivienda_id
      LIMIT ?, ?`,
    [...params, offset, limit]
  );

  const countParams = params.slice();
  const [[{ total }]] = await pool.execute(
    `SELECT COUNT(*) AS total FROM viviendas v ${whereSql}`,
    countParams
  );

  return { total, rows };
};
