import Joi from 'joi';

export const mortalidadListQuerySchema = Joi.object({
  causa_id: Joi.number().integer().positive().optional(),
  territorio_id: Joi.number().integer().positive().optional(),
  persona_id: Joi.number().integer().positive().optional(),
  anio: Joi.number().integer().min(1900).max(2100).optional(),
  mes: Joi.number().integer().min(1).max(12).optional(),
  modo: Joi.string().valid('agregado', 'detalle').default('agregado'),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(200).default(50),
});
