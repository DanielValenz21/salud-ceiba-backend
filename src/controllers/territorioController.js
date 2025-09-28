import { listTerritorios, listSectoresByTerritorio, createTerritorio, updateTerritorio } from '../models/territorioModel.js';

/* GET /territorios */
export const getTerritorios = async (_req, res, next) => {
  try {
    res.json(await listTerritorios());
  } catch (err) { next(err); }
};

/* GET /territorios/:id/sectores */
export const getSectoresByTerritorio = async (req, res, next) => {
  try {
    const includeStats = req.query.includeStats === 'true';
    const rows = await listSectoresByTerritorio({
      territorioId: req.params.id,
      includeStats
    });
    if (!rows.length) return res.status(404).json({ error: 'NotFound', message: 'Territorio no existe o sin sectores' });
    res.json(rows);
  } catch (err) { next(err); }
}; 

export const postTerritorio = async (req, res, next) => {
  try {
    let { codigo, nombre } = req.body || {};
    if (!codigo || !nombre) {
      return res.status(400).json({ error: 'codigo y nombre son requeridos' });
    }
    codigo = String(codigo).trim().toUpperCase();
    nombre = String(nombre).trim();

    // codigo puede tener longitud ilimitada (se normaliza pero no se limita aquí)

    const creado = await createTerritorio({ codigo, nombre });
    return res.status(201).json(creado);
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'codigo ya existe' });
  if (e.code === 'ER_DATA_TOO_LONG') return res.status(400).json({ error: 'codigo demasiado largo' });
    // si el modelo lanzó errores con status (ej. 400/409), devolverlos
    if (e.status) return res.status(e.status).json({ error: e.message });
    console.error(e);
    return res.status(500).json({ error: 'internal' });
  }
};

export const putTerritorio = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'id inválido' });

    let { codigo, nombre } = req.body || {};
    if (codigo !== undefined && codigo !== null) codigo = String(codigo).trim().toUpperCase();
    if (nombre !== undefined && nombre !== null) nombre = String(nombre).trim();

    // codigo puede tener longitud ilimitada (se normaliza pero no se limita aquí)

    const updated = await updateTerritorio(id, { codigo, nombre });
    return res.json(updated ?? { message: 'Sin cambios' });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'codigo ya existe' });
  if (e.code === 'ER_DATA_TOO_LONG') return res.status(400).json({ error: 'codigo demasiado largo', hint: 'Aumentar tamaño de la columna `territorios.codigo` en la DB. Ver database/001_alter_territorios_codigo_varchar50.sql' });
    if (e.status) return res.status(e.status).json({ error: e.message });
    console.error(e);
    return res.status(500).json({ error: 'internal' });
  }
};