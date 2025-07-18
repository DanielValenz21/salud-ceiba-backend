import Joi from 'joi';

/* 1) Login */
export const loginSchema = Joi.object({
  email:    Joi.string().email().required(),
  password: Joi.string().required()
});

/* 2) Refresh */
export const refreshSchema = Joi.object({
  refreshToken: Joi.string().required()
});

/* 3) Logout */
export const logoutSchema = Joi.object({
  refreshToken: Joi.string().required()
});

/* 4) Register (mantenido para compatibilidad) */
export const registerSchema = Joi.object({
  nombre:      Joi.string().max(50).required(),
  email:       Joi.string().email().max(120).required(),
  password:    Joi.string().min(8).required(),
  role_id:     Joi.number().integer().min(1).max(5).required(),
  persona_id:  Joi.number().integer().optional()
}); 