import Joi from 'joi';

const sexo   = Joi.string().valid('M', 'F');
const fecha  = Joi.date().max('now');
const dpiRx  = Joi.string().pattern(/^\d{8,15}$/).allow(null, '');

export const createPersonaSchema = Joi.object({
  nombres:    Joi.string().max(60).required(),
  apellidos:  Joi.string().max(60).required(),
  sexo:       sexo.required(),
  fecha_nac:  fecha.required(),
  dpi:        dpiRx.optional(),
  idioma:     Joi.string().max(40).optional()
}).unknown(true);

export const updatePersonaSchema = Joi.object({
  nombres:    Joi.string().max(60),
  apellidos:  Joi.string().max(60),
  sexo,
  fecha_nac:  fecha,
  dpi:        dpiRx,
  idioma:     Joi.string().max(40)
}).min(1).unknown(true);

export const listQuerySchema = Joi.object({
  page:  Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  q:     Joi.string().max(120).optional(),
  dpi:   dpiRx.optional()
}).unknown(true);
