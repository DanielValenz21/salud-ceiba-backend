import db from '../utils/db.js';
import { buildHash } from '../utils/hashPayload.js';
import * as logsSvc from './logsService.js';

export const fetchMetas = async ({ territorio_id, anio, ind_id }) => {
  const sql = `
    SELECT m.meta_id, m.ind_id, i.nombre AS ind_nombre,
           m.territorio_id, t.nombre AS territorio_nombre,
           m.anio, m.valor_objetivo
    FROM metas m
    JOIN indicadores i USING (ind_id)
    JOIN territorios t USING (territorio_id)
    WHERE (? IS NULL OR m.territorio_id = ?)
      AND (? IS NULL OR m.anio          = ?)
      AND (? IS NULL OR m.ind_id        = ?)
    ORDER BY m.anio DESC, t.nombre, i.nombre
  `;
  const params = [territorio_id, territorio_id, anio, anio, ind_id, ind_id];
  const [rows] = await db.execute(sql, params);
  return rows;
};

export const upsertMetas = async (items, userId) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const inserted = [];
    const updated = [];
    const unchanged = [];

    for (const it of items) {
      const [result] = await conn.query(
        `
        INSERT INTO metas (ind_id, territorio_id, anio, valor_objetivo)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE valor_objetivo = VALUES(valor_objetivo)
        `,
        [it.ind_id, it.territorio_id, it.anio, it.valor_objetivo]
      );

      const metaId =
        result.insertId ||
        (
          await conn.query(
            'SELECT meta_id FROM metas WHERE ind_id=? AND territorio_id=? AND anio=?',
            [it.ind_id, it.territorio_id, it.anio]
          )
        )[0][0].meta_id;

      if (result.insertId) inserted.push(metaId);
      else if (result.affectedRows === 2) updated.push(metaId);
      else unchanged.push(metaId);

      await logsSvc.insertLog(conn, {
        user_id: userId,
        accion: result.insertId ? 'CREATE' : result.affectedRows === 2 ? 'UPDATE' : 'UPDATE',
        recurso: 'api/v1/metas',
        pk_recurso: metaId.toString(),
        payload_hash: buildHash(it)
      });
    }

    await conn.commit();
    return { inserted, updated, unchanged };
  } catch (err) {
    await conn.rollback();
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
      err.status = 400;
      err.message = /ind_id/.test(err.message)
        ? 'Indicador desconocido'
        : 'Territorio desconocido';
    }
    throw err;
  } finally {
    conn.release();
  }
};
