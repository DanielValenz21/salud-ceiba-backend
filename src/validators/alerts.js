import Joi from 'joi';

export const alertsQuery = Joi.object({
  tipo: Joi.string().max(40),
  territorio: Joi.number().integer().positive(),
  activa: Joi.boolean().truthy('true').falsy('false').default(true),
  limit: Joi.number().integer().min(1).max(1000).default(100)
}).unknown(true);
