import {
  listSectors,
  insertSector,
  getSectorById,
  updateSector,
  softDeleteSector,
  listViviendasBySector
} from '../models/sectorModel.js';
import { getPagination } from '../utils/pagination.js';

/* ---------- GET /sectores ------------------- */
export const listSectores = async (req, res, next) => {
  try {
    const { page, limit, territorio_id } = req.query;
    const { offset } = getPagination(req);
    const { total, rows } = await listSectors({ territorio_id, offset, limit });

    res.json({ meta:{ page, limit, total }, data: rows });
  } catch (err) { next(err); }
};

/* ---------- POST /sectores ------------------ */
export const createSector = async (req, res, next) => {
  try {
    const sectorId = await insertSector(req.body);
    res.locals.pk = sectorId;
    res.status(201).json({ sector_id: sectorId });
  } catch (err) { next(err); }
};

/* ---------- GET /sectores/:id --------------- */
export const getSector = async (req, res, next) => {
  try {
    const sector = await getSectorById(req.params.id);
    if (!sector)
      return res.status(404).json({ error:'NotFound', message:'Sector no encontrado' });
    res.json(sector);
  } catch (err) { next(err); }
};

/* ---------- PUT /sectores/:id --------------- */
export const editSector = async (req, res, next) => {
  try {
    await updateSector(req.params.id, req.body);
    res.locals.pk = req.params.id;
    res.json({ message:'Sector actualizado' });
  } catch (err) { next(err); }
};

/* ---------- DELETE /sectores/:id ------------ */
export const deleteSector = async (req, res, next) => {
  try {
    await softDeleteSector(req.params.id);
    res.locals.pk = req.params.id;
    res.status(204).end();
  } catch (err) { next(err); }
};

/* ---------- GET /sectores/:id/viviendas ----- */
export const getViviendasBySector = async (req, res, next) => {
  try {
    const { page, limit, withGPS } = req.query;
    const { offset } = getPagination(req);

    const data = await listViviendasBySector({
      sectorId: req.params.id,
      offset,
      limit,
      withGPS: withGPS === 'true'
    });

    res.json({
      meta:{ page, limit, total:data.total },
      data: data.rows,
      sector:{ sector_id:req.params.id }
    });
  } catch (err) { next(err); }
};