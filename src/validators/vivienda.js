import Joi from 'joi';

const lat = Joi.number().min(-90).max(90);
const lng = Joi.number().min(-180).max(180);

/* ---------- POST /viviendas ---------------- */
export const createViviendaSchema = Joi.object({
  sector_id:      Joi.number().integer().min(1).required(),
  codigo_familia: Joi.string().max(12).required(),
  direccion:      Joi.string().max(160).optional(),
  lat, lng
});

/* ---------- PUT /viviendas/:id ------------- */
export const updateViviendaSchema = Joi.object({
  sector_id:      Joi.number().integer().min(1),
  codigo_familia: Joi.string().max(12),
  direccion:      Joi.string().max(160),
  lat, lng
}).min(1);

/* ---------- GET /viviendas/:id/personas ---- */
export const personasQuerySchema = Joi.object({
  page:  Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20)
}).unknown(true);   // permite id en params
