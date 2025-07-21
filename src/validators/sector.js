import Joi from 'joi';

export const createSectorSchema = Joi.object({
  territorio_id: Joi.number().integer().min(1).max(5).required(),
  nombre:        Joi.string().max(80).required(),
  geom: Joi.object({
    type: Joi.string().valid('Polygon').required(),
    coordinates: Joi.array().items(
      Joi.array().items(
        Joi.array().items(Joi.number()).length(2)
      )
    ).required()
  }).required()
});

export const updateSectorSchema = Joi.object({
  nombre: Joi.string().max(80).optional(),
  geom:   createSectorSchema.extract('geom').optional()
}).min(1);

export const bboxQuerySchema = Joi.object({
  bbox: Joi.string()
           .pattern(/^(-?\d+(\.\d+)?),(-?\d+(\.\d+)?),(-?\d+(\.\d+)?),(-?\d+(\.\d+)?)$/)
           .optional()
}); 