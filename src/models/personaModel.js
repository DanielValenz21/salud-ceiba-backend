import { pool } from '../config/db.js';

/*───────────────────────────────────────────────────────────
  POST /viviendas/:viviendaId/personas
───────────────────────────────────────────────────────────*/
export const insertPersona = async ({
  vivienda_id, dpi, nombres, apellidos, sexo, fecha_nac, idioma = null
}) => {
  /* vivienda activa (la tabla viviendas SÍ tiene activo) */
  const [[{ total }]] = await pool.execute(
    'SELECT COUNT(*) AS total FROM viviendas WHERE vivienda_id=? AND activo=1',
    [vivienda_id]
  );
  if (!total) {
    throw Object.assign(
      new Error('Vivienda no existe o está inactiva'),
      { status: 404, code: 'NotFound' }
    );
  }

  /* DPI único (si se envía) */
  if (dpi) {
    const [dup] = await pool.execute('SELECT 1 FROM personas WHERE dpi=?', [dpi]);
    if (dup.length) {
      throw Object.assign(
        new Error('DPI duplicado'),
        { status: 409, code: 'Conflict' }
      );
    }
  }

  /* insertar (sin columna activo) */
  const [res] = await pool.execute(
    `INSERT INTO personas
       (vivienda_id,dpi,nombres,apellidos,sexo,fecha_nac,idioma)
     VALUES (?,?,?,?,?,?,?)`,
    [vivienda_id, dpi || null, nombres, apellidos, sexo, fecha_nac, idioma]
  );

  return res.insertId;   // auditLog registrará este INSERT en logs
};

/*───────────────────────────────────────────────────────────
  GET /personas  (búsqueda global)
───────────────────────────────────────────────────────────*/
export const searchPersonas = async ({ q, dpi, offset, limit }) => {
  const where  = ['1=1'];
  const params = [];

  if (dpi) { where.push('dpi = ?');           params.push(dpi); }
  if (q)   { where.push('(nombres LIKE ? OR apellidos LIKE ?)');
             params.push(`%${q}%`, `%${q}%`); }

  const whereSQL = 'WHERE ' + where.join(' AND ');

  /* total */
  const [[{ total }]] = await pool.execute(
    `SELECT COUNT(*) AS total FROM personas ${whereSQL}`,
    params
  );

  /* filas (offset/limit interpolados) */
  const sql = `
    SELECT persona_id,nombres,apellidos,dpi,sexo,fecha_nac,vivienda_id
      FROM personas ${whereSQL}
      ORDER BY apellidos,nombres
      LIMIT ${offset},${limit}`;

  const [rows] = await pool.execute(sql, params);

  return { total, rows };
};

/*───────────────────────────────────────────────────────────
  GET /personas/:id  (detalle + historial)
───────────────────────────────────────────────────────────*/
export const getPersonaDetalle = async (id) => {
  const [pers] = await pool.execute(
    'SELECT * FROM personas WHERE persona_id=?',
    [id]
  );
  if (!pers.length) return null;

  const [hist] = await pool.execute(
    `SELECT evento_id,ind_id,fecha_evento,valor_num,valor_texto
       FROM eventos
      WHERE persona_id=?
      ORDER BY fecha_evento DESC`,
    [id]
  );

  return { ...pers[0], historial: hist };
};

/*───────────────────────────────────────────────────────────
  PUT /personas/:id
───────────────────────────────────────────────────────────*/
export const updatePersona = async (id, data) => {
  const [curr] = await pool.execute(
    'SELECT dpi FROM personas WHERE persona_id=?',
    [id]
  );
  const current = curr[0];
  if (!current) {
    throw Object.assign(
      new Error('Persona no existe'),
      { status: 404, code: 'NotFound' }
    );
  }

  if (data.dpi && data.dpi !== current.dpi) {
    const [dup] = await pool.execute('SELECT 1 FROM personas WHERE dpi=?', [data.dpi]);
    if (dup.length) {
      throw Object.assign(
        new Error('DPI duplicado'),
        { status: 409, code: 'Conflict' }
      );
    }
  }

  const fields = [], params = [];
  for (const [k, v] of Object.entries(data)) {
    fields.push(`${k} = ?`);
    params.push(v);
  }
  if (!fields.length) return;

  params.push(id);
  await pool.execute(
    `UPDATE personas SET ${fields.join(', ')} WHERE persona_id=?`,
    params
  );
};

