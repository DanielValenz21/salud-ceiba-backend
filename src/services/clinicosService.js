import db from '../utils/db.js';

/* ---------- EVENTOS (vacunación, nutrición, salud reproductiva, epidemiología) ---------- */
export async function insertEvento(payload, trx = null) {
  const conn = trx ?? await db.getConnection();
  try {
    const [result] = await conn.execute(
      `INSERT INTO eventos
         (persona_id, sector_id, ind_id, valor_num, valor_texto, lote,
          fecha_evento, responsable_id, detalle_json)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [
        payload.persona_id ?? null,
        payload.sector_id,
        payload.ind_id,
        payload.valor_num ?? null,
        payload.valor_texto ?? null,
        payload.lote ?? null,
        payload.fecha_evento,
        payload.responsable_id,
        JSON.stringify(payload.detalle_json ?? {})
      ]
    );
    return result.insertId;
  } finally {
    if (!trx) conn.release();
  }
}

/* ---------- INDICADORES POR MÓDULO ---------- */
const MODULE_RANGES = {
  vacunacion:   [  1,  20],
  nutricion:    [ 21, 100],
  reproductiva: [101, 200],
  epidemiologia:[201, 300]
};

export async function listIndicadores({ modulo, q = '', limit = 50, offset = 0 }) {
  const range = MODULE_RANGES[modulo];
  if (!range) throw Object.assign(new Error('Módulo inválido'), { status: 400, code: 'BadRequest' });
  const [min, max] = range;

  const where = ['ind_id BETWEEN ? AND ?'];
  const params = [min, max];
  if (q && q.trim()) {
    where.push('nombre LIKE ?');
    params.push(`%${q.trim()}%`);
  }
  const whereSQL = 'WHERE ' + where.join(' AND ');

  const [[tot]] = await db.execute(
    `SELECT COUNT(*) AS total FROM indicadores ${whereSQL}`,
    params
  );
  const [rows] = await db.execute(
    `SELECT ind_id, nombre FROM indicadores ${whereSQL} ORDER BY nombre LIMIT ? OFFSET ?`,
    [...params, Number(limit), Number(offset)]
  );
  return { total: tot?.total ?? 0, rows };
}

/* ---------- MORBILIDAD (SIGSA 7) ---------- */
export async function upsertMorbilidadLote({ anio, mes, territorio_id, datos }) {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    for (const row of datos) {
      await conn.execute(
        `INSERT INTO morbilidad_causa_mes
           (causa_id, territorio_id, anio, mes, grupo_edad, casos)
         VALUES (?,?,?,?,?,?)
         ON DUPLICATE KEY UPDATE casos = VALUES(casos)`,
        [
          row.causa_id,
          territorio_id,
          anio,
          mes,
          row.grupo_edad,
          row.casos
        ]
      );
    }
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

/* ---------- MORTALIDAD ---------- */
export async function insertDefuncion(payload) {
  // Normalizar lugar_defuncion al enum: 'hospital' | 'hogar' | 'vía pública' | 'otro'
  const normalizeLugar = (val) => {
    const base = (val ?? 'hogar')
      .toString().trim().toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ');

    if (base === 'hospital') return 'hospital';
    if (base === 'hogar' || base === 'domicilio' || base === 'casa') return 'hogar';
    if (base === 'via publica') return 'vía pública';
    if (base === 'otro') return 'otro';
    return 'hogar';
  };

  const lugar = normalizeLugar(payload.lugar_defuncion);

  const [res] = await db.execute(
    `INSERT INTO mortalidad_registros
       (persona_id, causa_id, territorio_id, fecha_defuncion,
        lugar_defuncion, certificador_id, detalle_json)
     VALUES (?,?,?,?,?,?,?)`,
    [
      payload.persona_id ?? null,
      payload.causa_id,
      payload.territorio_id,
      payload.fecha_defuncion,     // ISO string válida para DATETIME
      lugar,
      payload.certificador_id ?? null,
      JSON.stringify(payload.detalle_json ?? {})
    ]
  );
  return res.insertId;
}

/* ---------- AMBIENTE / MÉTRICAS MENSUALES ---------- */
export async function upsertMetrica(payload) {
  await db.execute(
    `INSERT INTO metrica_mensual
       (ind_id, territorio_id, anio, mes, valor_num, valor_den)
     VALUES (?,?,?,?,?,?)
     ON DUPLICATE KEY UPDATE
       valor_num = VALUES(valor_num),
       valor_den = VALUES(valor_den)`,
    [
      payload.ind_id,
      payload.territorio_id,
      payload.anio,
      payload.mes,
      payload.valor_num,
      payload.valor_den ?? null
    ]
  );
}

/* ---------- DASHBOARD COBERTURAS ---------- */
export async function listCoberturas({ territorio_id, anio }) {
  const [rows] = await db.execute(
    `SELECT
         ind_id,
         mes,
         ROUND(valor_num / NULLIF(valor_den,0) * 100, 1) AS cobertura_pct
       FROM metrica_mensual
      WHERE territorio_id = ?
        AND anio = ?
        AND valor_den IS NOT NULL
      ORDER BY ind_id, mes`,
    [territorio_id, anio]
  );
  return rows;
}
 
/* ---------- MORBILIDAD – GET /morbilidad/casos ---------- */
export async function listMorbilidad({ causa_id, territorio_id, anio, mes }) {
  const where   = ['1=1'];
  const params  = [];

  if (causa_id)      { where.push('m.causa_id      = ?'); params.push(causa_id);      }
  if (territorio_id) { where.push('m.territorio_id = ?'); params.push(territorio_id); }
  if (anio)          { where.push('m.anio          = ?'); params.push(anio);          }
  if (mes)           { where.push('m.mes           = ?'); params.push(mes);           }

  const whereSQL = where.length ? 'WHERE ' + where.join(' AND ') : '';

  const [rows] = await db.execute(
    `SELECT
        m.causa_id,
        c.descripcion          AS causa,
        m.territorio_id,
        m.anio, m.mes,
        m.grupo_edad,
        m.casos
       FROM   morbilidad_causa_mes m
       JOIN   causas c USING (causa_id)
       ${whereSQL}
       ORDER  BY m.anio DESC, m.mes DESC, m.causa_id, m.grupo_edad`,
    params
  );

  return rows;
}

/* ---------- MORTALIDAD – GET /mortalidad/registros ---------- */
// --- WHERE dinámico usando YEAR/MONTH(fecha_defuncion) ---
function buildWhere(alias, f) {
  const where = [];
  const params = [];

  if (f.persona_id)    { where.push(`${alias}.persona_id = ?`);            params.push(f.persona_id); }
  if (f.causa_id)      { where.push(`${alias}.causa_id = ?`);              params.push(f.causa_id); }
  if (f.territorio_id) { where.push(`${alias}.territorio_id = ?`);         params.push(f.territorio_id); }
  if (f.anio)          { where.push(`YEAR(${alias}.fecha_defuncion) = ?`);  params.push(f.anio); }
  if (f.mes)           { where.push(`MONTH(${alias}.fecha_defuncion) = ?`); params.push(f.mes); }

  return { whereSQL: where.length ? 'WHERE ' + where.join(' AND ') : '', params };
}

// --- LISTA de mortalidad ---
export async function listMortalidad(f = {}) {
  const { whereSQL, params } = buildWhere('m', f);

  if (f.modo === 'detalle') {
    const limit  = Math.min(200, Number(f.limit) || 50);
    const page   = Math.max(1, Number(f.page) || 1);
    const offset = (page - 1) * limit;

    const [rows] = await db.execute(
      `SELECT
         m.defuncion_id                       AS registro_id,   -- PK real
         m.persona_id,
         m.causa_id,
         c.descripcion                        AS causa_nombre,
         m.territorio_id,
         t.nombre                             AS territorio_nombre,
         YEAR(m.fecha_defuncion)              AS anio,          -- calculado
         MONTH(m.fecha_defuncion)             AS mes,           -- calculado
         1                                    AS defunciones,   -- una fila = una defunción
         m.fecha_defuncion,
         m.lugar_defuncion,
         m.certificador_id,
         m.detalle_json,
         m.created_at
       FROM mortalidad_registros m
       LEFT JOIN causas      c ON c.causa_id = m.causa_id
       LEFT JOIN territorios t ON t.territorio_id = m.territorio_id
       ${whereSQL}
       ORDER BY anio DESC, mes DESC, m.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    return rows;
  }

  // modo agregado
  const [rows] = await db.execute(
    `SELECT
       m.causa_id,
       c.descripcion                        AS causa_nombre,
       m.territorio_id,
       t.nombre                             AS territorio_nombre,
       YEAR(m.fecha_defuncion)              AS anio,           -- calculado
       MONTH(m.fecha_defuncion)             AS mes,            -- calculado
       COUNT(*)                             AS total_defunciones
     FROM mortalidad_registros m
     LEFT JOIN causas      c ON c.causa_id = m.causa_id
     LEFT JOIN territorios t ON t.territorio_id = m.territorio_id
     ${whereSQL}
     GROUP BY
       m.causa_id,
       m.territorio_id,
       YEAR(m.fecha_defuncion),
       MONTH(m.fecha_defuncion)
     ORDER BY anio DESC, mes DESC`,
    params
  );
  return rows;
}
