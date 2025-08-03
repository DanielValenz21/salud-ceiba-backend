import Joi from 'joi';

/* 43 – KPIs agregados */
export const coberturasQuery = Joi.object({
  periodo       : Joi.string().pattern(/^\d{6}(-\d{6})?$/),
  territorio_id : Joi.number().integer().positive(),
  sector_id     : Joi.number().integer().positive(),
  ind_id        : Joi.number().integer().positive()
}).unknown(true);

/* 44 – Alertas (rol ≥ Enfermera) */
export const alertasQuery = Joi.object({
  periodo       : Joi.string().pattern(/^\d{6}$/),     // un solo mes
  territorio_id : Joi.number().integer().positive()
}).unknown(true);

/* 45 – Serie temporal */
export const seriesQuery = Joi.object({
  ind_id        : Joi.number().integer().positive().required(),
  territorio_id : Joi.number().integer().positive(),
  sector_id     : Joi.number().integer().positive().when('territorio_id',
                        { is: Joi.exist(), then: Joi.optional(), otherwise: Joi.forbidden() }),
  desde         : Joi.string().pattern(/^\d{6}$/),
  hasta         : Joi.string().pattern(/^\d{6}$/)
}).unknown(true);
