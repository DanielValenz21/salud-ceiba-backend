import { listTerritorios, listSectoresByTerritorio } from '../models/territorioModel.js';

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