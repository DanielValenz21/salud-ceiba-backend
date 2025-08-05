import {
  listStock, listTotals,
  insertMovimiento, getLote
} from '../models/insumoModel.js';

export const getStock = async (req,res,next) => {
  try {
    const filters = {
      categoria : req.query.categoria,
      insumo_id : req.query.insumo_id,
      lote      : req.query.lote
    };
    const data = await listStock(filters);
    if (req.query.resumen==='true' || req.query.resumen===true)
      data.totales = await listTotals(filters);
    res.json(data);
  } catch (e){ next(e); }
};

export const createMovimiento = async (req,res,next) => {
  try {
    const dto = { ...req.body, responsable_id:req.user.user_id };
    const r   = await insertMovimiento(dto);
    res.locals.pk = r.mov_id;
    res.status(201).json({
      mov_id          : r.mov_id,
      ...req.body,
      existencias_post: r.existencias_post,
      fecha_mov       : req.body.fecha_mov.toISOString().slice(0,10),
      user_id         : req.user.user_id
    });
  } catch (e){ next(e); }
};

export const traceLote = async (req,res,next) => {
  try {
    const payload = await getLote({
      lote:req.params.lote,
      insumo_id:req.query.insumo_id
    });
    if (!payload)
      return res.status(404).json({ error:'NotFound', message:'Lote no existe' });
    res.json(payload);
  } catch (e){ next(e); }
};
