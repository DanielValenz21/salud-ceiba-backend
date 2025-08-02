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
  const [res] = await db.execute(
    `INSERT INTO mortalidad_registros
       (persona_id, causa_id, territorio_id, fecha_defuncion,
        lugar_defuncion, certificador_id, detalle_json)
     VALUES (?,?,?,?,?,?,?)`,
    [
      payload.persona_id ?? null,
      payload.causa_id,
      payload.territorio_id,
      payload.fecha_defuncion,
      payload.lugar_defuncion,
      payload.certificador_id,
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
