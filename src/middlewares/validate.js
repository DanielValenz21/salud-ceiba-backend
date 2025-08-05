import Joi from 'joi';

export const validate = (schema, target = 'body') => (req, res, next) => {
  // Clonar payloads para validación
  const payload = {
    body:   { ...req.body },
    query:  { ...req.query },
    params: { ...req.params }
  };
  // Validar con Joi, aplicar defaults y eliminar campos desconocidos
  const { error, value } = schema.validate(payload[target] ?? payload, {
    abortEarly: false,
    stripUnknown: true
  });
  if (error) {
    return res.status(400).json({ error: 'BadRequest', message: error.message });
  }
  // Escribir de vuelta al lugar correspondiente
  if (target === 'body') req.body = value;
  if (target === 'query') req.query = value;
  if (target === 'params') req.params = value;
  next();
};