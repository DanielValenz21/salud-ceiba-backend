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
    `SELECT ind_id, MOD(periodo,100) AS mes, cobertura_pct
       FROM dashboard_coberturas
      WHERE territorio_id = ? AND FLOOR(periodo/100) = ?`,
    [territorio_id, anio]
  );
  return rows;
}
