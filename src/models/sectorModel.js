import { pool } from '../config/db.js';

/* ► Listado (paginado + filtro opcional)  */
export const listSectors = async ({ territorio_id, offset, limit }) => {
  const where = ['activo=1'];
  const params = [];

  if (territorio_id) {
    where.push('territorio_id=?');
    params.push(territorio_id);
  }
  const whereSql = 'WHERE ' + where.join(' AND ');

  /* total */
  const [[{ total }]] = await pool.execute(
    `SELECT COUNT(*) AS total FROM sectores ${whereSql}`, params
  );

  /* datos */
  params.push(offset, limit);                  // siempre empujamos 2 valores
  const [rows] = await pool.execute(
    `SELECT sector_id,nombre,territorio_id,
            referencia_lat,referencia_lng
       FROM sectores ${whereSql}
      ORDER BY sector_id
      LIMIT ?,?`,                              // 2 placeholders
    params
  );

  return { total, rows };
};

/* ► Insertar */
export const insertSector = async ({ territorio_id, nombre, referencia_lat, referencia_lng }) => {
  const [res] = await pool.execute(
    `INSERT INTO sectores (territorio_id,nombre,referencia_lat,referencia_lng,activo)
     VALUES (?,?,?,?,1)`,
    [territorio_id, nombre, referencia_lat, referencia_lng]
  );
  return res.insertId;
};

/* ► Detalle con stats  */
export const getSectorById = async (id) => {
  const [rows] = await pool.execute(
    `SELECT s.sector_id,s.nombre,s.territorio_id,
            s.referencia_lat,s.referencia_lng,
            (SELECT COUNT(*) FROM viviendas v
              WHERE v.sector_id=s.sector_id AND v.activo=1)  AS viviendas,
            (SELECT COUNT(*) FROM personas p
              JOIN viviendas v ON v.vivienda_id=p.vivienda_id
              WHERE v.sector_id=s.sector_id AND v.activo=1)  AS personas,
            /* 👇 ya funciona si pusiste la vista con sector_id
               o devolverá NULL sin romper */
            (SELECT cobertura_pct
               FROM dashboard_coberturas dc
              WHERE dc.sector_id=s.sector_id
              ORDER BY periodo DESC LIMIT 1)                 AS hb_coverage
       FROM sectores s
      WHERE s.sector_id=? AND s.activo=1`,
    [id]
  );
  return rows[0];
};

/* ► Update parcial */
export const updateSector = async (id, { nombre, referencia_lat, referencia_lng }) => {
  const fields = [];
  const params = [];
  if (nombre)          { fields.push('nombre=?'); params.push(nombre); }
  if (referencia_lat)  { fields.push('referencia_lat=?'); params.push(referencia_lat); }
  if (referencia_lng)  { fields.push('referencia_lng=?'); params.push(referencia_lng); }
  if (!fields.length) return;
  params.push(id);
  await pool.execute(`UPDATE sectores SET ${fields.join(', ')} WHERE sector_id=?`, params);
};

/* ► Soft-delete con validación */
export const softDeleteSector = async (id) => {
  const [[{ total }]] = await pool.execute(
    'SELECT COUNT(*) AS total FROM viviendas WHERE sector_id=? AND activo=1',
    [id]
  );
  if (total) throw Object.assign(new Error('No se puede desactivar: viviendas activas'), { status:400, code:'BadRequest' });
  await pool.execute('UPDATE sectores SET activo=0 WHERE sector_id=?', [id]);
};

/* ► Viviendas por sector */
export const listViviendasBySector = async ({ sectorId, offset, limit, withGPS }) => {
  const gpsCols = withGPS ? ', v.lat, v.lng' : '';
  const [rows] = await pool.execute(
    `SELECT v.vivienda_id,v.codigo_familia${gpsCols},
            (SELECT COUNT(*) FROM personas p WHERE p.vivienda_id=v.vivienda_id) AS personas
       FROM viviendas v
      WHERE v.sector_id=? AND v.activo=1
      ORDER BY v.vivienda_id
      LIMIT ?,?`,
    [sectorId, offset, limit]
  );
  const [[{ total }]] = await pool.execute(
    'SELECT COUNT(*) AS total FROM viviendas WHERE sector_id=? AND activo=1',
    [sectorId]
  );
  return { total, rows };
};