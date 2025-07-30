import { pool } from '../config/db.js';

/* Util para mapear string SIGSA → ind_id */
async function resolveIndicator(ind) {
  if (typeof ind === 'number') return ind;
  const [rows] = await pool.execute(
    'SELECT ind_id FROM indicadores WHERE sigsa_codigo = ? LIMIT 1',
    [ind]
  );
  if (!rows.length) throw { status: 409, code: 'FK_VIOLATION', message: `Indicador ${ind} no existe` };
  return rows[0].ind_id;
}

/* GET /metricas */
export async function fetchMetricas({ filters, page, limit }) {
  const where = [];
  const filterParams = [];

  if (filters.territorio_id) {
    where.push('m.territorio_id = ?');
    filterParams.push(filters.territorio_id);
  }
  if (filters.ind_id) {
    where.push(typeof filters.ind_id === 'number' ? 'm.ind_id = ?' : 'i.sigsa_codigo = ?');
    filterParams.push(filters.ind_id);
  }
  if (filters.periodo_desde) {
    where.push('(m.anio > ? OR (m.anio = ? AND m.mes >= ?))');
    filterParams.push(filters.periodo_desde.anio, filters.periodo_desde.anio, filters.periodo_desde.mes);
  }
  if (filters.periodo_hasta) {
    where.push('(m.anio < ? OR (m.anio = ? AND m.mes <= ?))');
    filterParams.push(filters.periodo_hasta.anio, filters.periodo_hasta.anio, filters.periodo_hasta.mes);
  }

  const whereSQL = where.length ? 'WHERE ' + where.join(' AND ') : '';

  /* total */
  const [countRows] = await pool.execute(
    `SELECT COUNT(*) AS total
       FROM metrica_mensual m
       JOIN indicadores i USING (ind_id)
     ${whereSQL}`,
    filterParams
  );
  const total = countRows[0].total;

  /* paginación */
  const offset = (page - 1) * limit;
  // Construir SQL con LIMIT y OFFSET interpolados (MySQL no permite placeholders allí)
  const dataSql = `
      SELECT m.ind_id, m.territorio_id, m.anio, m.mes,
             m.valor_num, m.valor_den, m.updated_at
        FROM metrica_mensual m
        JOIN indicadores i USING (ind_id)
      ${whereSQL}
      ORDER BY m.anio DESC, m.mes DESC
      LIMIT ${limit} OFFSET ${offset}`;
  const [rows] = await pool.execute(dataSql, filterParams);

  return { total, rows };
}

/* PUT /metricas  – array de objetos */
export async function bulkUpsert(records) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    /* Normalizamos SIGSA → ind_id antes de armar el bulk */
    for (const rec of records) {
      rec.ind_id = await resolveIndicator.call(conn, rec.ind_id);
    }

    // Preparamos placeholders y params garantizando 6 valores por registro
    const placeholder = '(?,?,?,?,?,?)';
    const values = Array(records.length).fill(placeholder).join(',');
    const params = [];
    for (const r of records) {
      // valor_den ya estará presente (si no, null)
      params.push(
        r.ind_id,
        r.territorio_id,
        r.anio,
        r.mes,
        r.valor_num,
        r.valor_den
      );
    }
    // Verificación defensiva de conteo de parámetros
    if (params.length !== records.length * 6) {
      throw new Error('Param count mismatch: ' + params.length + ' ≠ ' + records.length * 6);
    }

    const sql = `
      INSERT INTO metrica_mensual
        (ind_id, territorio_id, anio, mes, valor_num, valor_den)
      VALUES ${values}
      ON DUPLICATE KEY UPDATE
        valor_num = VALUES(valor_num),
        valor_den = VALUES(valor_den),
        updated_at = NOW();
    `;

    const [result] = await conn.execute(sql, params);
    await conn.commit();
    return result.affectedRows;           // filas insertadas + actualizadas
  } catch (err) {
    await conn.rollback();
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
      throw { status: 409, code: 'FK_VIOLATION', message: 'El indicador o territorio no existe' };
    }
    throw err;
  } finally {
    conn.release();
  }
}
