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
    const { codigo, nombre } = req.body || {};
    if (!codigo || !nombre) {
      return res.status(400).json({ error: 'BadRequest', message: 'codigo y nombre son requeridos' });
    }
    const t = await createTerritorio({ codigo: String(codigo).trim(), nombre: String(nombre).trim() });
    return res.status(201).json(t);
  } catch (err) { next(err); }
};

export const putTerritorio = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'BadRequest', message: 'id inválido' });

    const updated = await updateTerritorio(id, {
      codigo: req.body?.codigo?.trim(),
      nombre: req.body?.nombre?.trim(),
    });
    return res.json(updated ?? { message: 'Sin cambios' });
  } catch (err) { next(err); }
};