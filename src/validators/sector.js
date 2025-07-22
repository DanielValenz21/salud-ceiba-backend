import Joi from 'joi';

/* ---------- Util común ---------- */
const lat = Joi.number().min(-90).max(90);
const lng = Joi.number().min(-180).max(180);

/* ---------- Query lista ---------- */
export const listQuerySchema = Joi.object({
  territorio_id: Joi.number().integer().min(1).optional(),
  page:   Joi.number().integer().min(1).default(1),
  limit:  Joi.number().integer().min(1).max(100).default(20)
});

/* ---------- Crear sector --------- */
export const createSectorSchema = Joi.object({
  territorio_id: Joi.number().integer().min(1).required(),
  nombre:        Joi.string().max(80).required(),
  referencia_lat: lat.required(),
  referencia_lng: lng.required()
});

/* ---------- Update sector -------- */
export const updateSectorSchema = Joi.object({
  nombre:          Joi.string().max(80),
  referencia_lat:  lat,
  referencia_lng:  lng
}).min(1).unknown(true);   // ← permite id y cualquier otra llave ajena

/* ---------- Viviendas query ------ */
export const viviendasQuerySchema = Joi.object({
  page:    Joi.number().integer().min(1).default(1),
  limit:   Joi.number().integer().min(1).max(100).default(20),
  withGPS: Joi.boolean().truthy('true').falsy('false').default(false)
}).unknown(true);          // ← permite “id” que llega desde params