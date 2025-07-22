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