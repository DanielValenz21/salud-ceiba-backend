import Joi from 'joi';

// POST /eventos
const createSchema = Joi.object({
  persona_id: Joi.number().integer().positive().required(),
  ind_id: Joi.number().integer().positive().required(),
  valor_num: Joi.number().precision(2).allow(null),
  valor_texto: Joi.string().max(120).allow(null, ''),
  fecha_evento: Joi.date().max('now').iso().default(() => new Date()),
}).xor('valor_num', 'valor_texto');

// GET /eventos
const listSchema = Joi.object({
  persona_id: Joi.number().integer().positive(),
  ind_id: Joi.number().integer().positive(),
  from: Joi.date().iso(),
  to: Joi.date().iso().min(Joi.ref('from')),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

// GET /eventos/:id
const idParamSchema = Joi.object({ id: Joi.number().integer().positive().required() });

export const validateCreateEvento = (body) => createSchema.validate(body, { abortEarly: false });
export const validateListEventos = (query) => listSchema.validate(query, { abortEarly: false });
export const validateIdParam = (params) => idParamSchema.validate(params, { abortEarly: false });
