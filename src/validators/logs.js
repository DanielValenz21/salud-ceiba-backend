import Joi from 'joi';

export const logsQuery = Joi.object({
  accion: Joi.string().valid('CREATE', 'UPDATE', 'DELETE', 'EXPORT', 'LOGIN'),
  user_id: Joi.number().integer().positive(),
  recurso: Joi.string().max(120),
  desde: Joi.date().iso(),
  hasta: Joi.date().iso().min(Joi.ref('desde')),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(500).default(100)
}).unknown(true);
