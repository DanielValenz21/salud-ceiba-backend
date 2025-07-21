import { listSectorsGeoJSON, insertSector } from '../models/sectorModel.js';
import { createSectorSchema } from '../validators/sector.js';
import Joi from 'joi';

/* GET /sectores?bbox=minLon,minLat,maxLon,maxLat */
export const getSectorsGeo = async (req, res, next) => {
  try {
    let bbox = null;
    if (req.query.bbox) {
      // Validar bbox = 4 números separados por coma
      const schema = Joi.string()
        .pattern(/^(-?\d+(\.\d+)?){1},(-?\d+(\.\d+)?){1},(-?\d+(\.\d+)?){1},(-?\d+(\.\d+)?){1}$/)
        .required();
      const { error } = schema.validate(req.query.bbox);
      if (error) return res.status(400).json({ error: 'BadRequest', message: 'bbox inválido' });

      bbox = req.query.bbox.split(',').map(Number); // [minLon,minLat,maxLon,maxLat]
    }

    const fc = await listSectorsGeoJSON(bbox);
    res.json(fc);
  } catch (err) {
    next(err);
  }
};

/* POST /sectores */
export const createSector = async (req, res, next) => {
  try {
    const { error, value } = createSectorSchema.validate(req.body);
    if (error) return res.status(400).json({ error:'BadRequest', message: error.message });

    const sectorId = await insertSector({
      territorio_id : value.territorio_id,
      nombre        : value.nombre,
      geomGeoJSON   : value.geom
    });

    res.status(201).json({ sector_id: sectorId });
  } catch (err) { next(err); }
};