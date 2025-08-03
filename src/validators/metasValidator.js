import Joi from 'joi';

const item = Joi.object({
  ind_id: Joi.number().integer().positive().required(),
  territorio_id: Joi.number().integer().positive().required(),
  anio: Joi.number().integer().min(2020).max(2100).required(),
  valor_objetivo: Joi.number().integer().positive().required()
});

export const metasSchema = Joi.alternatives().try(item, Joi.array().items(item).min(1));
