import {
  insertVivienda,
  getViviendaById,
  updateVivienda,
  listPersonasByVivienda
} from '../models/viviendaModel.js';
import { getPagination } from '../utils/pagination.js';

/* ---------- POST /viviendas ---------------- */
export const createVivienda = async (req, res, next) => {
  try {
    const viviendaId = await insertVivienda({ ...req.body, userId:req.user.user_id });
    res.locals.pk = viviendaId;
    res.status(201).json({ vivienda_id: viviendaId });
  } catch (err) { next(err); }
};

/* ---------- GET /viviendas/:id ------------- */
export const getVivienda = async (req, res, next) => {
  try {
    const vivienda = await getViviendaById(req.params.id);
    if (!vivienda)
      return res.status(404).json({ error:'NotFound', message:'Vivienda no encontrada' });
    res.json(vivienda);
  } catch (err) { next(err); }
};

/* ---------- PUT /viviendas/:id ------------- */
export const editVivienda = async (req, res, next) => {
  try {
    await updateVivienda(req.params.id, req.body, req.user.user_id);
    res.locals.pk = req.params.id;
    res.json({ message:'Vivienda actualizada' });
  } catch (err) { next(err); }
};

/* ---------- GET /viviendas/:id/personas ---- */
export const getPersonasByVivienda = async (req, res, next) => {
  try {
    const vivienda = await getViviendaById(req.params.id);
    if (!vivienda)
      return res.status(404).json({ error:'NotFound', message:'Vivienda no encontrada' });

    const { offset } = getPagination(req);
    const page  = Number(req.query.page  || 1);
    const limit = Number(req.query.limit || 20);

    const data = await listPersonasByVivienda({ viviendaId:req.params.id, offset, limit });

    res.json({
      meta:{ page, limit, total:data.total },
      vivienda:{ vivienda_id:vivienda.vivienda_id, codigo_familia:vivienda.codigo_familia },
      data:data.rows
    });
  } catch (err) { next(err); }
};
