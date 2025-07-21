import { pool } from '../config/db.js';

/* ► Todos los territorios ordenados */
export const listTerritorios = async () => {
  const [rows] = await pool.execute(
    'SELECT territorio_id,codigo,nombre FROM territorios ORDER BY territorio_id'
  );
  return rows;
};

/* ► Sectores de un territorio (+ opcional stats) */
export const listSectoresByTerritorio = async ({ territorioId, includeStats }) => {
  if (!includeStats) {
    const [rows] = await pool.execute(
      `SELECT sector_id,nombre,ST_AsGeoJSON(geom) AS geom
         FROM sectores
        WHERE territorio_id = ? AND activo=1
        ORDER BY sector_id`,
      [territorioId]
    );
    return rows;
  }

  /* Con stats básicas (conteo de viviendas) */
  const [rows] = await pool.execute(
    `SELECT s.sector_id,s.nombre,
            COUNT(v.vivienda_id) AS viviendas
       FROM sectores s
       LEFT JOIN viviendas v ON v.sector_id = s.sector_id
      WHERE s.territorio_id = ?  AND s.activo=1
      GROUP BY s.sector_id
      ORDER BY s.sector_id`,
    [territorioId]
  );
  return rows;
}; 