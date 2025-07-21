import { pool } from '../config/db.js';

/* ► GeoJSON FeatureCollection (opcional bbox) */
export const listSectorsGeoJSON = async (bbox = null) => {
  let where = 'WHERE s.activo = 1';
  const params = [];

  if (bbox) {
    // bbox = [minLon,minLat,maxLon,maxLat]
    where += ' AND ST_Within(s.geom, ST_MakeEnvelope(?,?,?, ?,4326))';
    params.push(...bbox);
  }

  const [rows] = await pool.execute(
    `SELECT JSON_OBJECT(
        'type','Feature',
        'geometry', ST_AsGeoJSON(s.geom),
        'properties', JSON_OBJECT(
            'sector_id',s.sector_id,
            'territorio_id',s.territorio_id,
            'nombre',s.nombre
        )
      ) AS feature
     FROM sectores s ${where}`,
    params
  );

  // rows → [{feature: '{…}'}]
  const features = rows.map(r => JSON.parse(r.feature));
  return { type: 'FeatureCollection', features };
};

/* ► INSERT */
export const insertSector = async ({ territorio_id, nombre, geomGeoJSON }) => {
  const [res] = await pool.execute(
    `INSERT INTO sectores (territorio_id,nombre,geom,activo)
     VALUES (?,?,ST_GeomFromGeoJSON(?),1)`,
    [territorio_id, nombre, JSON.stringify(geomGeoJSON)]
  );
  return res.insertId;
};