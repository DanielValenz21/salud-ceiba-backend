import { pool } from '../config/db.js';

/* --------------- listados ---------------- */
export async function listStock(filters) {
  const where = [], p = [];
  if (filters.categoria) { where.push('i.categoria=?'); p.push(filters.categoria); }
  if (filters.insumo_id) { where.push('i.insumo_id=?'); p.push(filters.insumo_id); }
  if (filters.lote)      { where.push('s.lote=?');      p.push(filters.lote);      }
  const sqlWhere = where.length ? 'WHERE ' + where.join(' AND ') : '';

  const [rows] = await pool.execute(
    `SELECT i.insumo_id,i.nombre,i.categoria,i.unidad,
            s.lote,s.existencias,DATE(s.ultima_operacion) AS ultima_operacion
       FROM stock_actual s
       JOIN insumos i USING(insumo_id)
       ${sqlWhere}
       ORDER BY i.insumo_id,s.lote`,
    p
  );

  const [[{ updated_at }]] = await pool.execute(
    'SELECT MAX(ultima_operacion) AS updated_at FROM stock_actual'
  );

  return { updated_at, rows };
}

export async function listTotals(filters) {
  const where = [], p = [];
  if (filters.categoria){ where.push('i.categoria=?'); p.push(filters.categoria); }
  if (filters.insumo_id){ where.push('i.insumo_id=?'); p.push(filters.insumo_id); }
  const sqlWhere = where.length ? 'WHERE ' + where.join(' AND ') : '';

  const [totales] = await pool.execute(
    `SELECT i.insumo_id,SUM(s.existencias) AS existencias
       FROM stock_actual s
       JOIN insumos i USING(insumo_id)
       ${sqlWhere}
       GROUP BY i.insumo_id`,
    p
  );
  return totales;
}

/* --------------- movimientos ---------------- */
const saldoSql = `
  SELECT COALESCE(SUM(CASE WHEN tipo_mov='ENTRADA' THEN cantidad ELSE -cantidad END),0) AS saldo
    FROM stock_movimientos
   WHERE insumo_id=? AND lote=?`;

export async function insertMovimiento(dto) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [[{ saldo }]] = await conn.execute(`${saldoSql} FOR UPDATE`,
                                             [dto.insumo_id,dto.lote]);

    if (dto.tipo_mov==='SALIDA' && dto.cantidad>saldo)
      throw { status:409, code:'StockInsuficiente', message:'Stock insuficiente' };

    const [r] = await conn.execute(
      `INSERT INTO stock_movimientos
         (insumo_id,lote,tipo_mov,cantidad,fecha_mov,responsable_id,observaciones)
       VALUES (?,?,?,?,?,?,?)`,
      [
        dto.insumo_id, dto.lote, dto.tipo_mov,
        dto.cantidad, dto.fecha_mov, dto.responsable_id,
        dto.referencia ?? null
      ]
    );

    const [[{ saldo:post }]] = await conn.execute(saldoSql,
                                                 [dto.insumo_id,dto.lote]);

    await conn.commit();
    return { mov_id:r.insertId, existencias_post:post };
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

/* --------------- trazabilidad lote ---------------- */
export async function getLote({ lote, insumo_id }) {
  const [[head]] = await pool.execute(
    `SELECT i.insumo_id,i.nombre,i.categoria,i.unidad,
            s.existencias
       FROM stock_actual s
       JOIN insumos i USING(insumo_id)
      WHERE s.lote=? AND (? IS NULL OR s.insumo_id=?)
      LIMIT 1`,
    [lote,insumo_id,insumo_id]
  );
  if (!head) return null;

  const [mov] = await pool.execute(
    `SELECT mov_id, tipo_mov AS tipo, cantidad,
            fecha_mov AS fecha, responsable_id AS usuario
       FROM stock_movimientos
      WHERE lote=? AND (? IS NULL OR insumo_id=?)
      ORDER BY fecha, mov_id`,
    [lote,insumo_id,insumo_id]
  );

  const [ev] = await pool.execute(
    `SELECT evento_id,persona_id,ind_id,valor_texto,fecha_evento
       FROM eventos
      WHERE lote=?`,
    [lote]
  );

  return {
    lote,
    insumo:{
      insumo_id:head.insumo_id,nombre:head.nombre,
      categoria:head.categoria,unidad:head.unidad
    },
    existencias_actuales:head.existencias,
    movimientos:mov,
    eventos_usados:ev
  };
}
