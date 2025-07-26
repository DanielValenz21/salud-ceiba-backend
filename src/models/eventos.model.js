import { pool } from '../config/db.js';

// ========== INSERT ==========
export const insertEvento = async ({
  persona_id,
  ind_id,
  valor_num,
  valor_texto,
  fecha_evento,
  responsable_id,
}) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Verificar existencia persona & activo
    const [[persona]] = await conn.execute(
      `SELECT persona_id FROM personas WHERE persona_id = ?`,
      [persona_id]
    );
    if (!persona) throw { status: 404, message: 'Persona no existe' };

    // 2. Verificar indicador
    const [[indicador]] = await conn.execute(
      `SELECT ind_id FROM indicadores WHERE ind_id = ?`,
      [ind_id]
    );
    if (!indicador) throw { status: 400, message: 'Indicador inválido' };

    // 3. Insertar
    const [result] = await conn.execute(
      `INSERT INTO eventos
         (persona_id, sector_id, ind_id, valor_num, valor_texto, fecha_evento, responsable_id)
       VALUES
         (?, (SELECT sector_id FROM viviendas v
               JOIN personas p ON p.vivienda_id = v.vivienda_id
               WHERE p.persona_id = ?),
          ?, ?, ?, ?, ?)`,
      [
      persona_id,
      persona_id,
      ind_id,
      valor_num ?? null,     // convierte undefined → null
      valor_texto ?? null,   // idem
      fecha_evento,
      responsable_id
      ]
    );

    await conn.commit();
    return result.insertId;
  } catch (err) {
    await conn.rollback();
    if (err.status) throw err;
    throw err;
  } finally {
    conn.release();
  }
};

// ========== SELECT paginado ==========
export const selectEventosPaginados = async ({
  persona_id,
  ind_id,
  from,
  to,
  page,
  limit,
}) => {
  const offset = (page - 1) * limit;

  let baseSQL = `
    FROM eventos e
    JOIN personas p ON p.persona_id = e.persona_id
    JOIN indicadores i ON i.ind_id = e.ind_id
    WHERE 1 = 1
  `;
  const params = [];

  if (persona_id) {
    baseSQL += ' AND e.persona_id = ?';
    params.push(persona_id);
  }
  if (ind_id) {
    baseSQL += ' AND e.ind_id = ?';
    params.push(ind_id);
  }
  if (from) {
    baseSQL += ' AND e.fecha_evento >= ?';
    params.push(from);
  }
  if (to) {
    baseSQL += ' AND e.fecha_evento <= ?';
    params.push(to);
  }

  const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total ${baseSQL}`, params);

  const [rows] = await pool.query(
    `SELECT
       e.evento_id,
       e.fecha_evento,
       e.valor_num,
       e.valor_texto,
       e.persona_id,
       p.nombres,
       p.apellidos,
       e.ind_id,
       i.nombre AS indicador,
       e.responsable_id AS created_by
     ${baseSQL}
     ORDER BY e.fecha_evento DESC, e.evento_id DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  return {
    meta: { page, limit, total },
    data: rows,
  };
};

// ========== SELECT detalle ==========
export const selectEventoDetalle = async (evento_id) => {
  const [rows] = await pool.execute(
    `SELECT
        e.*,
        p.nombres,
        p.apellidos,
        i.nombre  AS indicador,
        u.nombre  AS creado_por
     FROM eventos e
     JOIN personas   p ON p.persona_id = e.persona_id
     JOIN indicadores i ON i.ind_id     = e.ind_id
     JOIN usuarios    u ON u.user_id    = e.responsable_id
     WHERE e.evento_id = ?`,
    [evento_id]
  );
  return rows[0];
};
