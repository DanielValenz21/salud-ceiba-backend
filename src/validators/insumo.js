import Joi from 'joi';

/* 46) GET /insumos */
export const stockQuery = Joi.object({
  categoria : Joi.string().valid('vacuna','suplemento','reactivo','otro'),
  insumo_id : Joi.number().integer().positive(),
  lote      : Joi.string().max(20),
  resumen   : Joi.boolean().truthy('true').falsy('false').default(false)
}).unknown(true);

/* 47) POST /insumos/movimientos */
export const movimientoBody = Joi.object({
  insumo_id : Joi.number().integer().positive().required(),
  lote      : Joi.string().max(20).required(),
  tipo_mov  : Joi.string().valid('ENTRADA','SALIDA').required(),
  cantidad  : Joi.number().integer().positive().required(),
  fecha_mov : Joi.date().max('now').default(() => new Date()),
  referencia: Joi.string().max(80).allow(null,'')
});

/* 48) GET /insumos/lotes/:lote */
export const loteQuery = Joi.object({
  insumo_id : Joi.number().integer().positive()
}).unknown(true);
