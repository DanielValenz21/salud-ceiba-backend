import Joi from 'joi';

/* YYYY-MM → convertimos a { anio, mes } in controller */
const periodSchema = Joi.string()
  .pattern(/^\d{4}-(0[1-9]|1[0-2])$/)
  .message('periodo debe ser YYYY-MM');

// Middleware to validate query parameters and set req.validatedQuery
const querySchema = Joi.object({
  territorio_id: Joi.number().integer().min(1).max(5),
  ind_id: Joi.alternatives(
    Joi.number().integer().positive(),
    Joi.string().max(10)
  ),
  periodo_desde: periodSchema,
  periodo_hasta: periodSchema,
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(50),
});

export const validateQueryMetricas = (req, res, next) => {
  const { error, value } = querySchema.validate(req.query, { abortEarly: false });
  if (error) return res.status(400).json({ error: 'BadRequest', message: error.message });
  req.validatedQuery = value;
  next();
};

// Middleware to validate request body and set req.validatedBody
const bodySchema = Joi.array()
  .items(
    Joi.object({
      ind_id: Joi.alternatives(
        Joi.number().integer().positive(),
        Joi.string().max(10)
      ).required(),
      territorio_id: Joi.number().integer().min(1).max(5).required(),
      anio: Joi.number().integer().min(2000).max(2099).required(),
      mes: Joi.number().integer().min(1).max(12).required(),
      valor_num: Joi.number().integer().min(0).required(),
      valor_den: Joi.number().integer().min(0).allow(null).default(null),
    })
  )
  .min(1);

export const validateBodyMetricas = (req, res, next) => {
  const { error, value } = bodySchema.validate(req.body, { abortEarly: false });
  if (error) return res.status(400).json({ error: 'BadRequest', message: error.message });
  req.validatedBody = value;
  next();
};
