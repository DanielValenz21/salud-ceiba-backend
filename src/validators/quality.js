import Joi from 'joi';

export const qualityQuery = Joi.object({
  tabla: Joi.string().max(64),
  tipo: Joi.string().valid('NULL_VALUE', 'RANGE', 'FK_MISSING', 'DUPLICATE'),
  desde: Joi.date().iso(),
  hasta: Joi.date().iso().min(Joi.ref('desde')),
  limit: Joi.number().integer().min(1).max(1000).default(1000)
}).unknown(true);
