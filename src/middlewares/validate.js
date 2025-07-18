export const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate({ ...req.body, ...req.params, ...req.query }, { abortEarly: false });
  if (error) return res.status(400).json({ error: 'BadRequest', message: error.message });
  Object.assign(req, value);
  next();
}; 