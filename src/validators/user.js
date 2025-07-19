import Joi from 'joi';

export const filterSchema = Joi.object({
  page:   Joi.number().integer().min(1).default(1),
  limit:  Joi.number().integer().min(1).max(100).default(20),
  rol:    Joi.alternatives(Joi.string(), Joi.number().integer()).optional(),
  activo: Joi.boolean().optional(),
  q:      Joi.string().max(120).optional()
});

/* RegExp contraseña: ≥8, 1 mayús, 1 minús, 1 número */
const pwdRx = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

export const createSchema = Joi.object({
  nombre:     Joi.string().max(50).required(),
  email:      Joi.string().email().max(120).required(),
  rol:        Joi.alternatives(Joi.string(), Joi.number().integer()).required(),
  password:   Joi.string().pattern(pwdRx).required(),
  persona_id: Joi.number().integer().optional()
});

export const updateSchema = Joi.object({
  nombre:   Joi.string().max(50).optional(),
  email:    Joi.string().email().max(120).optional(),
  rol:      Joi.alternatives(Joi.string(), Joi.number().integer()).optional(),
  password: Joi.string().pattern(pwdRx).optional(),
  activo:   Joi.boolean().optional()
})
.min(1)          // al menos un campo modificable
.unknown(true);  // ignora id, page, q… que no pertenecen al body 